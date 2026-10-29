import { and, eq, inArray, isNull, like, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  classMembers,
  classes,
  competitionMembers,
  competitions,
  coursClasses,
  coursEleves,
  episodeCohortes,
  episodeMembres,
  examenCandidats,
  examens,
  games,
  hintUsages,
  inscritsJournal,
  organizationMembers,
  organizations,
  players,
  teams,
  users,
} from "@/db/schema";
import { horsArchivesDEssai } from "@/services/archives-d-essai";

/**
 * L'EFFACEMENT DES DONNÉES PERSONNELLES (RGPD, droit à l'effacement), en un seul endroit.
 *
 * Trois gestes s'en servent : « Supprimer mon compte » dans l'espace enseignant, les
 * effacements sur demande de l'administration (un établissement entier, un élève), et la
 * purge de chaque nuit (services/purge.service.ts).
 *
 * Le schéma porte l'essentiel en cascade (src/db/schema) : une partie emporte ses équipes,
 * ses tours, ses décisions, ses résultats et ses situations ; un compte emporte ses
 * rattachements. Quatre clés seulement REFUSENT la suppression d'un compte, et c'est ici
 * qu'on les lève dans le bon ordre : `games.created_by`, `classes.teacher_id`,
 * `competitions.organizer_id` et `hint_usages.user_id`. Le driver HTTP de Neon n'ouvre pas
 * de transaction : chaque étape laisse donc la base cohérente, et rejouer le geste après
 * une coupure termine le travail sans rien casser.
 */

/** L'adresse technique d'une identité d'élève sans compte (lib/guest.ts, LTI, RENATER, examen). */
export const ADRESSE_D_INVITE = "guest-%@guest.business-arena.local";
/** Les comptes de démonstration (services/demo.service.ts) : jamais effacés par ces gestes. */
export const ADRESSE_DE_DEMO = "%@demo.business-arena.fr";

/**
 * Un ÉLÈVE SANS COMPTE : une identité invitée, sans mot de passe ni provenance, qui n'est ni
 * administrateur ni compte de démonstration.
 */
export const estUnEleveSansCompte: SQL = and(
  like(users.email, ADRESSE_D_INVITE),
  isNull(users.passwordHash),
  isNull(users.provenance),
  eq(users.isPlatformAdmin, false),
)!;

export const REFUS_EFFACEMENT = {
  introuvable: "Compte introuvable.",
  administrateur:
    "Un compte administrateur de la plateforme ne se supprime pas d'ici : retirez d'abord ses droits d'administration.",
  demonstration: "Les comptes de démonstration ne se suppriment pas.",
  pasUnEleve: "Ce compte n'est pas celui d'un élève sans compte.",
  etablissementPublic: "L'établissement « Grand public » porte les parties solo : il ne se supprime pas.",
  etablissementIntrouvable: "Établissement introuvable.",
} as const;

export type ResultatEffacement =
  | { ok: true; parties: number; eleves: number; comptes: number; enseignantsDetaches?: number }
  | { ok: false; raison: string };

const distincts = (xs: (string | null)[]): string[] => [...new Set(xs.filter((x): x is string => !!x))];

/** Supprimer des parties : la cascade emporte tout ce qui en dépend. */
export async function supprimerDesParties(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const faites = await db.delete(games).where(inArray(games.id, ids)).returning({ id: games.id });
  return faites.length;
}

/**
 * Supprimer des comptes d'élèves sans compte, avec leurs propres parties (solo, examen) et
 * l'usage de leurs indices. Les identités qui ne sont pas des élèves sans compte sont
 * ignorées : ce geste ne touche jamais un enseignant.
 */
export async function supprimerDesEleves(ids: string[]): Promise<{ eleves: number; parties: number }> {
  if (ids.length === 0) return { eleves: 0, parties: 0 };
  const eleves = (
    await db
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.id, ids), estUnEleveSansCompte))
  ).map((u) => u.id);
  if (eleves.length === 0) return { eleves: 0, parties: 0 };
  const leursParties = (
    await db.select({ id: games.id }).from(games).where(and(inArray(games.createdBy, eleves), horsArchivesDEssai))
  ).map((g) => g.id);
  const parties = await supprimerDesParties(leursParties);
  await db.delete(hintUsages).where(inArray(hintUsages.userId, eleves));
  const faits = await db.delete(users).where(inArray(users.id, eleves)).returning({ id: users.id });
  return { eleves: faits.length, parties };
}

/**
 * Parmi des élèves sans compte, ceux qui ne sont plus rattachés à RIEN après un effacement :
 * plus d'équipe, de classe, d'examen, de concours, de cohorte, de classe du cours, ni de
 * partie à eux. Ceux-là n'existaient que par ce qui vient d'être effacé ; les autres
 * gardent ce qui les rattache ailleurs.
 */
async function orphelins(candidats: string[]): Promise<string[]> {
  if (candidats.length === 0) return [];
  const encoreLies = new Set<string>();
  const lire = async (q: Promise<{ id: string }[]>) => {
    for (const r of await q) encoreLies.add(r.id);
  };
  await lire(db.select({ id: players.userId }).from(players).where(inArray(players.userId, candidats)));
  await lire(db.select({ id: classMembers.userId }).from(classMembers).where(inArray(classMembers.userId, candidats)));
  await lire(
    db.select({ id: examenCandidats.userId }).from(examenCandidats).where(inArray(examenCandidats.userId, candidats)),
  );
  await lire(
    db
      .select({ id: competitionMembers.userId })
      .from(competitionMembers)
      .where(inArray(competitionMembers.userId, candidats)),
  );
  await lire(
    db.select({ id: episodeMembres.userId }).from(episodeMembres).where(inArray(episodeMembres.userId, candidats)),
  );
  await lire(db.select({ id: coursEleves.userId }).from(coursEleves).where(inArray(coursEleves.userId, candidats)));
  await lire(
    db.select({ id: games.createdBy }).from(games).where(and(inArray(games.createdBy, candidats), horsArchivesDEssai)),
  );
  return candidats.filter((c) => !encoreLies.has(c));
}

/** Les élèves rattachés à ces parties, classes, examens, concours, cohortes et classes du cours. */
async function elevesRattaches(p: {
  parties?: string[];
  classes?: string[];
  examens?: string[];
  concours?: string[];
  cohortes?: string[];
  classesDuCours?: string[];
}): Promise<string[]> {
  const ids: (string | null)[] = [];
  if (p.parties?.length) {
    const r = await db
      .select({ id: players.userId })
      .from(players)
      .innerJoin(teams, eq(teams.id, players.teamId))
      .where(inArray(teams.gameId, p.parties));
    ids.push(...r.map((x) => x.id));
  }
  if (p.classes?.length) {
    const r = await db.select({ id: classMembers.userId }).from(classMembers).where(inArray(classMembers.classId, p.classes));
    ids.push(...r.map((x) => x.id));
  }
  if (p.examens?.length) {
    const r = await db
      .select({ id: examenCandidats.userId })
      .from(examenCandidats)
      .where(inArray(examenCandidats.examenId, p.examens));
    ids.push(...r.map((x) => x.id));
  }
  if (p.concours?.length) {
    const r = await db
      .select({ id: competitionMembers.userId })
      .from(competitionMembers)
      .where(inArray(competitionMembers.competitionId, p.concours));
    ids.push(...r.map((x) => x.id));
  }
  if (p.cohortes?.length) {
    const r = await db
      .select({ id: episodeMembres.userId })
      .from(episodeMembres)
      .where(inArray(episodeMembres.cohorteId, p.cohortes));
    ids.push(...r.map((x) => x.id));
  }
  if (p.classesDuCours?.length) {
    const r = await db.select({ id: coursEleves.userId }).from(coursEleves).where(inArray(coursEleves.classeId, p.classesDuCours));
    ids.push(...r.map((x) => x.id));
  }
  return distincts(ids);
}

/**
 * Supprimer des examens, avec les parties de leurs candidats (une partie d'examen est
 * créée au nom du candidat, et n'a de sens que dans son examen).
 */
export async function supprimerDesExamens(ids: string[]): Promise<{ examens: number; parties: number }> {
  if (ids.length === 0) return { examens: 0, parties: 0 };
  const partiesDExamen = distincts(
    (
      await db
        .select({ id: examenCandidats.gameId })
        .from(examenCandidats)
        .where(inArray(examenCandidats.examenId, ids))
    ).map((c) => c.id),
  );
  const parties = await supprimerDesParties(partiesDExamen);
  const faits = await db.delete(examens).where(inArray(examens.id, ids)).returning({ id: examens.id });
  return { examens: faits.length, parties };
}

/**
 * SUPPRIMER UN COMPTE ENSEIGNANT, et tout ce qu'il a créé : ses parties (avec leurs
 * équipes, décisions et résultats), ses classes, ses examens (noms, numéros et notes des
 * candidats compris), ses concours, ses cohortes et ses classes du cours. Les élèves sans
 * compte qui n'étaient rattachés qu'à cela sont supprimés aussi ; ceux qui jouent ailleurs
 * gardent le reste. Le compte d'un administrateur de la plateforme ou de démonstration
 * est refusé.
 */
export async function supprimerCompteEnseignant(userId: string): Promise<ResultatEffacement> {
  const [u] = await db
    .select({ id: users.id, email: users.email, admin: users.isPlatformAdmin })
    .from(users)
    .where(eq(users.id, userId));
  if (!u) return { ok: false, raison: REFUS_EFFACEMENT.introuvable };
  if (u.admin) return { ok: false, raison: REFUS_EFFACEMENT.administrateur };
  if (u.email.toLowerCase().endsWith(ADRESSE_DE_DEMO.slice(1))) {
    return { ok: false, raison: REFUS_EFFACEMENT.demonstration };
  }

  const ids = async (q: Promise<{ id: string }[]>) => (await q).map((r) => r.id);
  // Les archives de tour d'essai partent avec leur partie (cascade sur `essai_de`).
  const sesParties = await ids(
    db.select({ id: games.id }).from(games).where(and(eq(games.createdBy, userId), horsArchivesDEssai)),
  );
  const sesClasses = await ids(db.select({ id: classes.id }).from(classes).where(eq(classes.teacherId, userId)));
  const sesExamens = await ids(db.select({ id: examens.id }).from(examens).where(eq(examens.creePar, userId)));
  const sesConcours = await ids(
    db.select({ id: competitions.id }).from(competitions).where(eq(competitions.organizerId, userId)),
  );
  const sesCohortes = await ids(
    db.select({ id: episodeCohortes.id }).from(episodeCohortes).where(eq(episodeCohortes.creePar, userId)),
  );
  const sesClassesDuCours = await ids(
    db.select({ id: coursClasses.id }).from(coursClasses).where(eq(coursClasses.creePar, userId)),
  );
  const candidats = (
    await elevesRattaches({
      parties: sesParties,
      classes: sesClasses,
      examens: sesExamens,
      concours: sesConcours,
      cohortes: sesCohortes,
      classesDuCours: sesClassesDuCours,
    })
  ).filter((id) => id !== userId);

  const examensFaits = await supprimerDesExamens(sesExamens);
  if (sesConcours.length) await db.delete(competitions).where(inArray(competitions.id, sesConcours));
  const parties = (await supprimerDesParties(sesParties)) + examensFaits.parties;
  if (sesClasses.length) await db.delete(classes).where(inArray(classes.id, sesClasses));
  if (sesCohortes.length) await db.delete(episodeCohortes).where(inArray(episodeCohortes.id, sesCohortes));
  if (sesClassesDuCours.length) await db.delete(coursClasses).where(inArray(coursClasses.id, sesClassesDuCours));
  await db.delete(hintUsages).where(eq(hintUsages.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  const eleves = await supprimerDesEleves(await orphelins(candidats));
  return { ok: true, parties: parties + eleves.parties, eleves: eleves.eleves, comptes: 1 };
}

/**
 * SUPPRIMER UN ÉLÈVE SUR DEMANDE (administration) : son identité, ses rattachements, ses
 * parties à lui (solo, examen) et ses notes d'examen. Les parties de classe restent : elles
 * appartiennent à l'équipe et à l'enseignant ; l'élève n'y figure plus.
 */
export async function supprimerUnEleve(userId: string): Promise<ResultatEffacement> {
  const [u] = await db.select({ id: users.id }).from(users).where(and(eq(users.id, userId), estUnEleveSansCompte));
  if (!u) return { ok: false, raison: REFUS_EFFACEMENT.pasUnEleve };
  const partiesDExamen = distincts(
    (
      await db.select({ id: examenCandidats.gameId }).from(examenCandidats).where(eq(examenCandidats.userId, userId))
    ).map((c) => c.id),
  );
  const parties = await supprimerDesParties(partiesDExamen);
  const r = await supprimerDesEleves([userId]);
  return { ok: true, parties: parties + r.parties, eleves: r.eleves, comptes: 0 };
}

/**
 * SUPPRIMER UN ÉTABLISSEMENT ENTIER (administration, sur demande) : ses parties, classes,
 * examens, concours, cohortes, licences et rattachements ; les élèves sans compte qui
 * n'étaient rattachés qu'à lui. Les comptes enseignants ne sont JAMAIS supprimés par ce geste
 * (décision du propriétaire) : ils restent, détachés de l'établissement et sans sa licence,
 * avec leurs données propres. Pour effacer un enseignant, il y a « Supprimer mon compte ». L'établissement « Grand public », qui porte les parties
 * solo, est refusé.
 */
export async function supprimerUnEtablissement(organizationId: string): Promise<ResultatEffacement> {
  const [org] = await db
    .select({ id: organizations.id, kind: organizations.kind })
    .from(organizations)
    .where(eq(organizations.id, organizationId));
  if (!org) return { ok: false, raison: REFUS_EFFACEMENT.etablissementIntrouvable };
  if (org.kind === "public") return { ok: false, raison: REFUS_EFFACEMENT.etablissementPublic };

  // Décision du propriétaire : les comptes enseignants RESTENT. Ils sont seulement détachés
  // (leur rattachement et les licences de l'établissement partent en cascade avec lui) ;
  // ce qu'ils ont créé hors de cet établissement leur reste. Aucune clé étrangère ne relie
  // un compte à un établissement autrement que par `organization_members`.
  const enseignants = await db
    .select({ id: organizationMembers.userId })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.organizationId, organizationId), ne(organizationMembers.role, "student")));
  let parties = 0;

  // Les données de l'établissement, quel qu'en soit l'auteur.
  // Ce qui reste de l'établissement (créé par des comptes rattachés ailleurs aussi).
  const ids = async (q: Promise<{ id: string }[]>) => (await q).map((r) => r.id);
  const sesParties = await ids(
    db.select({ id: games.id }).from(games).where(and(eq(games.organizationId, organizationId), horsArchivesDEssai)),
  );
  const sesClasses = await ids(
    db.select({ id: classes.id }).from(classes).where(eq(classes.organizationId, organizationId)),
  );
  const sesExamens = await ids(
    db.select({ id: examens.id }).from(examens).where(eq(examens.organizationId, organizationId)),
  );
  const sesConcours = await ids(
    db.select({ id: competitions.id }).from(competitions).where(eq(competitions.organizationId, organizationId)),
  );
  const sesCohortes = await ids(
    db.select({ id: episodeCohortes.id }).from(episodeCohortes).where(eq(episodeCohortes.organizationId, organizationId)),
  );
  const membresEleves = await ids(
    db
      .select({ id: organizationMembers.userId })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.role, "student"))),
  );
  const candidats = distincts([
    ...(await elevesRattaches({
      parties: sesParties,
      classes: sesClasses,
      examens: sesExamens,
      concours: sesConcours,
      cohortes: sesCohortes,
    })),
    ...membresEleves,
  ]);

  const examensFaits = await supprimerDesExamens(sesExamens);
  parties += examensFaits.parties;
  parties += await supprimerDesParties(sesParties);
  if (sesCohortes.length) await db.delete(episodeCohortes).where(inArray(episodeCohortes.id, sesCohortes));
  // L'établissement : ses classes, concours, licences, invitations et rattachements suivent en cascade.
  await db.delete(organizations).where(eq(organizations.id, organizationId));

  const r = await supprimerDesEleves(await orphelins(candidats));
  return { ok: true, parties: parties + r.parties, eleves: r.eleves, comptes: 0, enseignantsDetaches: enseignants.length };
}

/**
 * Chercher des élèves sans compte pour un effacement sur demande : par pseudo (en partie),
 * ou par le code de la partie qu'ils ont rejointe. Au plus 50 réponses.
 */
export async function chercherDesEleves(recherche: string): Promise<
  {
    id: string;
    pseudo: string;
    creeLe: Date;
    parties: { code: string | null; nom: string | null; etablissement: string }[];
  }[]
> {
  const q = recherche.trim();
  if (q.length < 2) return [];
  const parCode = await db
    .select({ id: players.userId })
    .from(players)
    .innerJoin(teams, eq(teams.id, players.teamId))
    .innerJoin(games, eq(games.id, teams.gameId))
    .where(or(eq(games.joinCode, q.toUpperCase()), eq(teams.joinCode, q.toUpperCase())));
  const motif = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const trouves = await db
    .select({ id: users.id, pseudo: users.displayName, creeLe: users.createdAt })
    .from(users)
    .where(
      and(
        estUnEleveSansCompte,
        parCode.length
          ? or(
              sql`${users.displayName} ILIKE ${motif}`,
              inArray(
                users.id,
                parCode.map((p) => p.id),
              ),
            )
          : sql`${users.displayName} ILIKE ${motif}`,
      ),
    )
    .limit(50);
  if (trouves.length === 0) return [];
  const leursParties = await db
    .select({
      userId: players.userId,
      code: games.joinCode,
      nom: games.label,
      etablissement: organizations.name,
    })
    .from(players)
    .innerJoin(teams, eq(teams.id, players.teamId))
    .innerJoin(games, eq(games.id, teams.gameId))
    .innerJoin(organizations, eq(organizations.id, games.organizationId))
    .where(
      inArray(
        players.userId,
        trouves.map((t) => t.id),
      ),
    );
  return trouves.map((t) => ({
    ...t,
    parties: leursParties.filter((p) => p.userId === t.id).map(({ code, nom, etablissement }) => ({ code, nom, etablissement })),
  }));
}

/** Les établissements, pour l'effacement sur demande (sans « Grand public »). */
export async function etablissementsEffacables(): Promise<{ id: string; nom: string }[]> {
  return db
    .select({ id: organizations.id, nom: organizations.name })
    .from(organizations)
    .where(ne(organizations.kind, "public"))
    .orderBy(organizations.name);
}

/**
 * Garder la trace d'un effacement sur demande dans le journal de l'administration, sans
 * recopier la donnée effacée : le geste, l'établissement visé par son nom (ce n'est pas une
 * donnée personnelle) et les nombres.
 */
export async function noterLEffacement(adminId: string, geste: string, detail: string): Promise<void> {
  await db.insert(inscritsJournal).values({ adminId, geste, cibleUserId: null, detail });
}
