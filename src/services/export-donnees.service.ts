import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  classMembers,
  classes,
  competitions,
  coursClasses,
  episodeCohortes,
  examenCandidats,
  examens,
  games,
  organizationMembers,
  organizations,
  players,
  scenarios,
  teams,
  users,
} from "@/db/schema";
import { horsArchivesDEssai } from "@/services/archives-d-essai";

/**
 * « EXPORTER MES DONNÉES » (RGPD, droits d'accès et de portabilité) : ce que Business Arena
 * garde du compte enseignant, en JSON lisible.
 *
 * SEULEMENT LES DONNÉES DE CE COMPTE. Les parties, classes et examens que l'enseignant a
 * créés y figurent par leurs réglages et leurs effectifs, jamais par les pseudos, noms,
 * numéros d'étudiant ou notes des élèves : ce sont les données d'autres personnes, qui se
 * consultent dans l'espace enseignant et ne partent pas dans un fichier personnel. Le mot
 * de passe (même haché) et la version de session ne sortent pas non plus : ce sont des
 * secrets, pas des données sur la personne.
 */
export interface ExportDesDonnees {
  format: "business-arena/export-enseignant";
  version: 1;
  genereLe: string;
  compte: {
    id: string;
    email: string;
    nomAffiche: string;
    langue: string;
    creeLe: string;
    derniereConnexionLe: string | null;
    provenance: string | null;
    adresseConfirmeeLe: string | null;
    desactiveLe: string | null;
    nouveautes: { accordLe: string | null; retraitLe: string | null; versionDuTexte: string | null };
  };
  etablissements: { nom: string; role: string; depuis: string }[];
  parties: {
    id: string;
    nom: string | null;
    statut: string;
    mode: string;
    code: string | null;
    creeLe: string;
    rangeeLe: string | null;
    tuteurIA: boolean;
    equipes: number;
    eleves: number;
  }[];
  classes: { nom: string; anneeScolaire: string | null; code: string; creeLe: string; eleves: number }[];
  examens: { nom: string; code: string; ouverture: string | null; fermeture: string | null; creeLe: string; candidats: number }[];
  concours: { nom: string; statut: string; code: string; creeLe: string }[];
  classesDuCours: { nom: string; code: string; creeLe: string }[];
  cohortes: { nom: string; code: string; creeLe: string }[];
  scenarios: { nom: string; creeLe: string }[];
}

const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

export async function exporterMesDonnees(userId: string, maintenant = new Date()): Promise<ExportDesDonnees | null> {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) return null;

  const etablissements = await db
    .select({ nom: organizations.name, role: organizationMembers.role, depuis: organizationMembers.createdAt })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.userId, userId));

  // Une archive de tour d'essai n'est pas une partie : elle ne sort pas.
  const sesParties = await db.select().from(games).where(and(eq(games.createdBy, userId), horsArchivesDEssai));
  const idsParties = sesParties.map((g) => g.id);
  const equipes = idsParties.length
    ? await db
        .select({ gameId: teams.gameId, n: count() })
        .from(teams)
        .where(inArray(teams.gameId, idsParties))
        .groupBy(teams.gameId)
    : [];
  const eleves = idsParties.length
    ? await db
        .select({ gameId: teams.gameId, n: count() })
        .from(players)
        .innerJoin(teams, eq(teams.id, players.teamId))
        .where(inArray(teams.gameId, idsParties))
        .groupBy(teams.gameId)
    : [];
  const nb = (rows: { gameId: string; n: number }[], id: string) => rows.find((r) => r.gameId === id)?.n ?? 0;

  const sesClasses = await db
    .select({
      id: classes.id,
      nom: classes.name,
      annee: classes.schoolYear,
      code: classes.joinCode,
      creeLe: classes.createdAt,
    })
    .from(classes)
    .where(eq(classes.teacherId, userId));
  const effectifs = sesClasses.length
    ? await db
        .select({ classId: classMembers.classId, n: count() })
        .from(classMembers)
        .where(
          inArray(
            classMembers.classId,
            sesClasses.map((c) => c.id),
          ),
        )
        .groupBy(classMembers.classId)
    : [];

  const sesExamens = await db.select().from(examens).where(eq(examens.creePar, userId));
  const candidats = sesExamens.length
    ? await db
        .select({ examenId: examenCandidats.examenId, n: count() })
        .from(examenCandidats)
        .where(
          inArray(
            examenCandidats.examenId,
            sesExamens.map((e) => e.id),
          ),
        )
        .groupBy(examenCandidats.examenId)
    : [];

  const sesConcours = await db.select().from(competitions).where(eq(competitions.organizerId, userId));
  const sesClassesDuCours = await db.select().from(coursClasses).where(eq(coursClasses.creePar, userId));
  const sesCohortes = await db.select().from(episodeCohortes).where(eq(episodeCohortes.creePar, userId));
  const sesScenarios = await db
    .select({ nom: scenarios.title, creeLe: scenarios.createdAt })
    .from(scenarios)
    .where(eq(scenarios.authorId, userId));

  return {
    format: "business-arena/export-enseignant",
    version: 1,
    genereLe: maintenant.toISOString(),
    compte: {
      id: u.id,
      email: u.email,
      nomAffiche: u.displayName,
      langue: u.locale,
      creeLe: u.createdAt.toISOString(),
      derniereConnexionLe: iso(u.derniereConnexionLe),
      provenance: u.provenance,
      adresseConfirmeeLe: iso(u.emailConfirmeLe),
      desactiveLe: iso(u.desactiveLe),
      nouveautes: {
        accordLe: iso(u.nouveautesConsentiesLe),
        retraitLe: iso(u.nouveautesRetireesLe),
        versionDuTexte: u.nouveautesVersionDuTexte,
      },
    },
    etablissements: etablissements.map((e) => ({ nom: e.nom, role: e.role, depuis: e.depuis.toISOString() })),
    parties: sesParties.map((g) => ({
      id: g.id,
      nom: g.label,
      statut: g.status,
      mode: g.mode,
      code: g.joinCode,
      creeLe: g.createdAt.toISOString(),
      rangeeLe: iso(g.archivedAt),
      tuteurIA: g.tuteurActif,
      equipes: nb(equipes, g.id),
      eleves: nb(eleves, g.id),
    })),
    classes: sesClasses.map((c) => ({
      nom: c.nom,
      anneeScolaire: c.annee,
      code: c.code,
      creeLe: c.creeLe.toISOString(),
      eleves: effectifs.find((e) => e.classId === c.id)?.n ?? 0,
    })),
    examens: sesExamens.map((e) => ({
      nom: e.nom,
      code: e.code,
      ouverture: iso(e.ouverture),
      fermeture: iso(e.fermeture),
      creeLe: e.createdAt.toISOString(),
      candidats: candidats.find((c) => c.examenId === e.id)?.n ?? 0,
    })),
    concours: sesConcours.map((c) => ({
      nom: c.name,
      statut: c.status,
      code: c.joinCode,
      creeLe: c.createdAt.toISOString(),
    })),
    classesDuCours: sesClassesDuCours.map((c) => ({ nom: c.nom, code: c.code, creeLe: c.createdAt.toISOString() })),
    cohortes: sesCohortes.map((c) => ({ nom: c.nom, code: c.code, creeLe: c.createdAt.toISOString() })),
    scenarios: sesScenarios.map((s) => ({ nom: s.nom, creeLe: s.creeLe.toISOString() })),
  };
}
