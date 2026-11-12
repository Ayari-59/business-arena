import { randomInt } from "node:crypto";
import { and, asc, count, desc, eq, gte, inArray, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { coursClasses, coursEleves, coursProgressions, organizationMembers, orgLicences, type SuiviDEtapeEnregistre } from "@/db/schema";
import { ALPHABET_REPRISE } from "@/config/reprise";
import { chapitreParCode } from "@/config/cours/registre";
import { parcoursProposeAChoisir, parcoursQuiOuvrent, type OuvrablePar } from "@/config/cours/parcours-de-formation";
import type { Chapitre } from "@/config/cours/types";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import { distinguerLesHomonymes } from "@/lib/format";
import type { ProgressionLue } from "@/pedagogy/cours/suivi";
import { offreDuCoursDe, plafondDElevesDesComptes, unCompteSousLicence } from "@/services/acces.service";
import { getTeacherOrgId } from "@/services/auth.service";
import { chapitresLiberesDuPlusRecent, parcoursAttribues } from "@/services/attributions.service";
import { getLicenceStatus } from "@/services/licence.service";
import {
  dansLesAttributions,
  libereALaClasse,
  parcoursAttribue,
  parcoursDeLaLicenceClasse,
  type ModeDeLiberation,
} from "@/services/chapitres-de-la-classe";

/**
 * LES CLASSES DU COURS PAR LA SIMULATION.
 *
 * Une classe se crée depuis l'espace enseignant ; ses élèves la rejoignent par son code,
 * sous un prénom ou un pseudonyme, sans compte (leur identité d'invité suffit). Le
 * chapitre qu'un élève suit remonte sa progression ici, et l'enseignant la lit agrégée.
 *
 * TOUT CE QUI VIENT DU NAVIGATEUR EST BORNÉ. L'élève ne peut écrire que SA progression,
 * dans SA classe ; le chapitre et l'entreprise doivent exister ; les étapes inconnues
 * du chapitre sont ignorées ; les remarques sont du texte court, en nombre limité.
 */

export const NOM_DE_CLASSE_MAX = 80;
export const NOM_D_ELEVE_MAX = 40;
const REMARQUE_MAX = 300;
const REMARQUES_GARDEES_PAR_ETAPE = 30;

const tirer = (n: number) =>
  Array.from({ length: n }, () => ALPHABET_REPRISE[randomInt(ALPHABET_REPRISE.length)]).join("");

/** « BTSCG1-7K3P » : un préfixe lisible tiré du nom de la classe, et quatre signes. */
function codeDeClasse(nom: string): string {
  const prefixe =
    nom
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6) || "CLASSE";
  return `${prefixe}-${tirer(4)}`;
}

export const normaliserCodeDeClasse = (saisi: string) =>
  saisi
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);

const entrepriseValide = (e: string | null | undefined) => (e && ENTREPRISES_DU_COURS.includes(e) ? e : null);
/**
 * Un parcours du registre, ou un parcours de formation (le cours d'un diplôme : config/cours/parcours-de-formation.ts),
 * qu'une classe peut choisir aujourd'hui : pas celui d'une formation retirée (config/formations-proposees.ts).
 */
const parcoursValide = (p: string | null | undefined) => (parcoursProposeAChoisir(p) ? p : null);

/**
 * LA LICENCE CLASSE EN COURS DE L'ÉTABLISSEMENT DE CET ENSEIGNANT, et le moment depuis lequel une
 * classe compte pour elle : son début, ou son enregistrement s'il est plus tard (une licence posée
 * aujourd'hui, datée du 1er septembre, ne compte pas les classes d'essai de septembre). Null hors de
 * l'offre Classe.
 */
async function licenceClasseEnCours(enseignantId: string): Promise<{ depuis: Date } | null> {
  const org = await getTeacherOrgId(enseignantId);
  if (!org) return null;
  const statut = await getLicenceStatus(org, new Date(), "arene");
  if ((statut.state !== "active" && statut.state !== "bientot_expiree") || statut.licence?.arene !== "classe") return null;
  const [ligne] = await db
    .select({ debut: orgLicences.startsAt, enregistree: orgLicences.createdAt })
    .from(orgLicences)
    .where(eq(orgLicences.id, statut.licence.id));
  const debut = ligne ? Math.max(ligne.debut.getTime(), ligne.enregistree.getTime()) : statut.licence.startsAt.getTime();
  return { depuis: new Date(debut) };
}

/**
 * LE SEUL PARCOURS QU'UNE NOUVELLE CLASSE DE CET ENSEIGNANT PEUT PRENDRE, sous l'offre Classe
 * (services/chapitres-de-la-classe.ts, `parcoursDeLaLicenceClasse`) ; null quand le choix est libre
 * (Programme, Campus, sans offre, ou pas encore de parcours fixé sous Classe). LES CLASSES D'ESSAI NE
 * COMPTENT PAS (décision du propriétaire, 11 novembre 2026) : seules les classes créées sous la
 * licence en cours le fixent.
 */
export async function parcoursImposeALEnseignant(enseignantId: string): Promise<string | null> {
  const licence = await licenceClasseEnCours(enseignantId);
  if (!licence) return null;
  const [attribues, classes] = await Promise.all([
    parcoursAttribues(enseignantId),
    db
      .select({ parcours: coursClasses.parcours })
      .from(coursClasses)
      .where(and(eq(coursClasses.creePar, enseignantId), gte(coursClasses.createdAt, licence.depuis)))
      .orderBy(asc(coursClasses.createdAt), asc(coursClasses.id)),
  ]);
  return parcoursDeLaLicenceClasse(attribues, classes.map((c) => c.parcours));
}

export async function creerClasse(args: {
  enseignantId: string;
  nom: string;
  entreprise?: string | null;
  /** Le parcours du cours (config/cours/registre.ts) : obligatoire ; inconnu ou absent, rien ne se crée. */
  parcours?: string | null;
  /** Tout ouvrir aux élèves, ou libérer chapitre par chapitre (migration 0056) ; « tout » par défaut. */
  liberation?: ModeDeLiberation;
}): Promise<{ id: string; code: string } | null> {
  const nom = args.nom.trim().slice(0, NOM_DE_CLASSE_MAX);
  // Le parcours est obligatoire à la création (migration 0052) : il ouvre les chapitres. Quand
  // l'admin a attribué des parcours (migration 0056), il est l'un d'eux.
  const parcours = parcoursValide(args.parcours);
  if (!nom || !parcours || !parcoursAttribue(await parcoursAttribues(args.enseignantId), parcours)) return null;
  // Sous l'offre Classe, toutes les classes sur un même parcours (décision du 10 novembre 2026).
  const impose = await parcoursImposeALEnseignant(args.enseignantId);
  if (impose !== null && impose !== parcours) return null;
  const liberation: ModeDeLiberation = args.liberation === "chapitre" ? "chapitre" : "tout";
  for (let essai = 0; essai < 8; essai += 1) {
    const [cree] = await db
      .insert(coursClasses)
      .values({ code: codeDeClasse(nom), nom, creePar: args.enseignantId, entreprise: entrepriseValide(args.entreprise), parcours, liberation })
      .onConflictDoNothing()
      .returning({ id: coursClasses.id, code: coursClasses.code });
    if (cree) return cree;
  }
  throw new Error("Impossible de tirer un code de classe libre.");
}

export async function classesDeLEnseignant(enseignantId: string) {
  return db
    .select({
      id: coursClasses.id,
      code: coursClasses.code,
      nom: coursClasses.nom,
      entreprise: coursClasses.entreprise,
      parcours: coursClasses.parcours,
      closeLe: coursClasses.closeLe,
      createdAt: coursClasses.createdAt,
      eleves: count(coursEleves.userId),
    })
    .from(coursClasses)
    .leftJoin(coursEleves, eq(coursEleves.classeId, coursClasses.id))
    .where(eq(coursClasses.creePar, enseignantId))
    .groupBy(coursClasses.id)
    .orderBy(desc(coursClasses.createdAt));
}

/**
 * LES ÉLÈVES D'UNE CLASSE, CHACUN SOUS UN NOM QUI LE DISTINGUE (audit UX du 11 novembre 2026, P1-5) :
 * deux « Léa » deviennent « Léa n°1 » et « Léa n°2 », dans l'ordre où elles ont rejoint
 * (lib/format.ts, `distinguerLesHomonymes`, la règle des équipes de l'arène). Rangés par nom.
 */
async function elevesDeLaClasse(classeId: string): Promise<{ userId: string; nom: string }[]> {
  const eleves = await db
    .select({ userId: coursEleves.userId, nom: coursEleves.nom })
    .from(coursEleves)
    .where(eq(coursEleves.classeId, classeId))
    .orderBy(asc(coursEleves.depuis), asc(coursEleves.userId));
  const noms = distinguerLesHomonymes(eleves.map((e) => e.nom));
  return eleves.map((e, i) => ({ userId: e.userId, nom: noms[i]! })).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

/** Une classe de cet enseignant, sans ses élèves ; null : pas la sienne. */
export async function laClasseDeLEnseignant(enseignantId: string, classeId: string) {
  const [classe] = await db
    .select()
    .from(coursClasses)
    .where(and(eq(coursClasses.id, classeId), eq(coursClasses.creePar, enseignantId)));
  return classe ?? null;
}

/** Une classe de cet enseignant, et la progression de ses élèves dans un chapitre. Null : pas la sienne. */
export async function classeDeLEnseignant(enseignantId: string, classeId: string, chapitre: string) {
  const [classe] = await db
    .select()
    .from(coursClasses)
    .where(and(eq(coursClasses.id, classeId), eq(coursClasses.creePar, enseignantId)));
  if (!classe) return null;
  const eleves = await elevesDeLaClasse(classeId);
  const lignes = await db
    .select()
    .from(coursProgressions)
    .where(and(eq(coursProgressions.classeId, classeId), eq(coursProgressions.chapitre, chapitre)));
  const parEleve = new Map(lignes.map((l) => [l.userId, l]));
  // Un élève qui a rejoint sans avoir encore ouvert le chapitre compte, « pas commencé » (audit UX
  // du 11 novembre 2026, P2-9 : il se lisait « 1 sur 7 »).
  const progressions: ProgressionLue[] = eleves.map((e) => {
    const l = parEleve.get(e.userId);
    return {
      eleve: e.nom,
      entreprise: l?.entreprise ?? classe.entreprise ?? "",
      etape: l?.etape ?? 0,
      etapes: l?.etapes ?? {},
      erreurs: l?.erreurs ?? {},
      majLe: l?.majLe ?? classe.createdAt,
      commence: Boolean(l),
    };
  });
  return { classe, progressions };
}

/** La ligne d'un élève en tête du suivi : le chapitre où il a travaillé en dernier, son étape, et quand. */
export interface ResumeDEleve {
  eleve: string;
  /** Le code du chapitre ; null : aucun chapitre ouvert encore. */
  chapitre: string | null;
  /** L'étape la plus avancée atteinte dans ce chapitre. */
  etape: number;
  majLe: Date | null;
}

/**
 * LA CLASSE, ÉLÈVE PAR ÉLÈVE (audit UX du 11 novembre 2026, P1-2 : le suivi ne valait que pour le
 * chapitre choisi, et rien ne disait quel chapitre chaque élève avait ouvert). Pour chacun, le
 * chapitre de sa dernière activité. Null : pas une classe de cet enseignant.
 */
export async function resumeDeLaClasse(enseignantId: string, classeId: string): Promise<ResumeDEleve[] | null> {
  const [classe] = await db
    .select({ id: coursClasses.id })
    .from(coursClasses)
    .where(and(eq(coursClasses.id, classeId), eq(coursClasses.creePar, enseignantId)));
  if (!classe) return null;
  const [eleves, lignes] = await Promise.all([
    elevesDeLaClasse(classeId),
    db
      .select({ userId: coursProgressions.userId, chapitre: coursProgressions.chapitre, etape: coursProgressions.etape, majLe: coursProgressions.majLe })
      .from(coursProgressions)
      .where(eq(coursProgressions.classeId, classeId))
      .orderBy(desc(coursProgressions.majLe)),
  ]);
  const derniere = new Map<string, (typeof lignes)[number]>();
  for (const l of lignes) if (!derniere.has(l.userId)) derniere.set(l.userId, l);
  return eleves.map((e) => {
    const l = derniere.get(e.userId);
    return { eleve: e.nom, chapitre: l?.chapitre ?? null, etape: l?.etape ?? 0, majLe: l?.majLe ?? null };
  });
}

export async function cloreClasse(args: { enseignantId: string; classeId: string; close: boolean }): Promise<boolean> {
  const fait = await db
    .update(coursClasses)
    .set({ closeLe: args.close ? new Date() : null })
    .where(and(eq(coursClasses.id, args.classeId), eq(coursClasses.creePar, args.enseignantId)))
    .returning({ id: coursClasses.id });
  return fait.length > 0;
}

/**
 * Donner son parcours à une classe qui n'en a pas (une classe d'avant la migration 0052), par
 * son enseignant seulement. Une fois choisi, il ne change plus : sous l'offre Classe, c'est lui
 * qui ouvre les chapitres, et le changer à volonté ouvrirait tout le cours. Sous l'offre Classe,
 * c'est le parcours des autres classes de l'enseignant, quand il est fixé (`parcoursImposeALEnseignant`).
 */
export async function choisirLeParcours(args: { enseignantId: string; classeId: string; parcours: string }): Promise<boolean> {
  const parcours = parcoursValide(args.parcours);
  if (!parcours || !parcoursAttribue(await parcoursAttribues(args.enseignantId), parcours)) return false;
  const impose = await parcoursImposeALEnseignant(args.enseignantId);
  if (impose !== null && impose !== parcours) return false;
  const fait = await db
    .update(coursClasses)
    .set({ parcours })
    .where(and(eq(coursClasses.id, args.classeId), eq(coursClasses.creePar, args.enseignantId), isNull(coursClasses.parcours)))
    .returning({ id: coursClasses.id });
  return fait.length > 0;
}

/** Une classe héritée de cet enseignant, sans parcours encore : sa page lui demande de le choisir. */
export async function classeAChoisirSonParcours(enseignantId: string, classeId: string): Promise<boolean> {
  const [c] = await db
    .select({ id: coursClasses.id })
    .from(coursClasses)
    .where(
      and(eq(coursClasses.id, classeId), eq(coursClasses.creePar, enseignantId), eq(coursClasses.heritee, true), isNull(coursClasses.parcours)),
    );
  return Boolean(c);
}

/** Permettre ou retirer la calculatrice aux élèves d'une classe, par son enseignant seulement. */
export async function permettreLaCalculatrice(args: { enseignantId: string; classeId: string; permise: boolean }): Promise<boolean> {
  const fait = await db
    .update(coursClasses)
    .set({ sansCalculatrice: !args.permise })
    .where(and(eq(coursClasses.id, args.classeId), eq(coursClasses.creePar, args.enseignantId)))
    .returning({ id: coursClasses.id });
  return fait.length > 0;
}

export async function classeParCode(code: string) {
  const net = normaliserCodeDeClasse(code);
  if (!net) return null;
  const [c] = await db.select().from(coursClasses).where(eq(coursClasses.code, net));
  return c
    ? { id: c.id, code: c.code, nom: c.nom, entreprise: c.entreprise, close: c.closeLe !== null, creePar: c.creePar }
    : null;
}

export type RefusDAdhesion = "inconnu" | "close" | "nom" | "pleine";

/** Rejoindre une classe sous un prénom ; un élève n'en suit qu'une : en rejoindre une autre la remplace. */
export async function rejoindreClasse(
  userId: string,
  code: string,
  nomSaisi: string,
): Promise<{ ok: true; nom: string } | { ok: false; refus: RefusDAdhesion }> {
  const nom = nomSaisi.replace(/\s+/g, " ").trim().slice(0, NOM_D_ELEVE_MAX);
  if (!nom) return { ok: false, refus: "nom" };
  const classe = await classeParCode(code);
  if (!classe) return { ok: false, refus: "inconnu" };
  if (classe.close) {
    const [deja] = await db.select({ classeId: coursEleves.classeId }).from(coursEleves).where(eq(coursEleves.userId, userId));
    if (deja?.classeId !== classe.id) return { ok: false, refus: "close" };
  }
  // L'EFFECTIF DE L'OFFRE CLASSE : au plafond, la classe n'accueille plus, sauf l'élève qui y est déjà.
  const plafond = await plafondDElevesDesComptes([classe.creePar]);
  if (plafond !== null) {
    const autres = await db
      .select({ n: count() })
      .from(coursEleves)
      .where(and(eq(coursEleves.classeId, classe.id), ne(coursEleves.userId, userId)));
    if ((autres[0]?.n ?? 0) >= plafond) return { ok: false, refus: "pleine" };
  }
  await db
    .insert(coursEleves)
    .values({ userId, classeId: classe.id, nom })
    .onConflictDoUpdate({ target: coursEleves.userId, set: { classeId: classe.id, nom, depuis: new Date() } });
  return { ok: true, nom: classe.nom };
}

export async function quitterClasse(userId: string): Promise<void> {
  await db.delete(coursEleves).where(eq(coursEleves.userId, userId));
}

/** La classe d'un élève, s'il en suit une ; son parcours dit à la page d'un chapitre quel diplôme il prépare. */
export async function classeDeLEleve(userId: string) {
  const [m] = await db
    .select({
      classeId: coursClasses.id,
      classe: coursClasses.nom,
      eleve: coursEleves.nom,
      entreprise: coursClasses.entreprise,
      parcours: coursClasses.parcours,
      closeLe: coursClasses.closeLe,
      sansCalculatrice: coursClasses.sansCalculatrice,
      liberation: coursClasses.liberation,
    })
    .from(coursEleves)
    .innerJoin(coursClasses, eq(coursClasses.id, coursEleves.classeId))
    .where(eq(coursEleves.userId, userId));
  return m ? { ...m, close: m.closeLe !== null, calculatrice: !m.sansCalculatrice } : null;
}

export interface ProgressionEnvoyee {
  chapitre: string;
  entreprise: string;
  etape: number;
  etapes: Record<string, SuiviDEtapeEnregistre>;
  /** Les remarques d'un essai manqué, à ajouter à celles de l'étape. */
  erreur?: { etape: string; remarques: string[] };
}

/**
 * Enregistrer la progression d'un élève dans le chapitre qu'il suit, pour sa classe.
 * Sans classe, rien ne s'écrit : le cours seul reste sur l'appareil.
 */
export async function enregistrerProgression(userId: string, envoi: ProgressionEnvoyee): Promise<boolean> {
  const classe = await classeDeLEleve(userId);
  if (!classe) return false;
  const chapitre = chapitreParCode(envoi.chapitre);
  const entreprise = entrepriseValide(envoi.entreprise);
  if (!chapitre || !entreprise) return false;
  const ids = new Set(chapitre.etapes.map((e) => e.id));
  const entier = (x: unknown, max: number) => (Number.isInteger(x) && (x as number) >= 0 ? Math.min(x as number, max) : 0);
  const etapes: Record<string, SuiviDEtapeEnregistre> = {};
  for (const [id, s] of Object.entries(envoi.etapes ?? {})) {
    if (!ids.has(id) || typeof s !== "object" || s === null) continue;
    etapes[id] = { essais: entier(s.essais, 999), reussi: s.reussi === true, aide: s.aide === true };
  }
  const etape = entier(envoi.etape, chapitre.etapes.length);

  const [deja] = await db
    .select({ erreurs: coursProgressions.erreurs })
    .from(coursProgressions)
    .where(
      and(
        eq(coursProgressions.userId, userId),
        eq(coursProgressions.classeId, classe.classeId),
        eq(coursProgressions.chapitre, chapitre.code),
      ),
    );
  const erreurs = { ...(deja?.erreurs ?? {}) };
  if (envoi.erreur && ids.has(envoi.erreur.etape)) {
    const nouvelles = (envoi.erreur.remarques ?? [])
      .filter((r): r is string => typeof r === "string" && r.trim() !== "")
      .map((r) => r.trim().slice(0, REMARQUE_MAX));
    erreurs[envoi.erreur.etape] = [...(erreurs[envoi.erreur.etape] ?? []), ...nouvelles].slice(-REMARQUES_GARDEES_PAR_ETAPE);
  }
  await db
    .insert(coursProgressions)
    .values({ userId, classeId: classe.classeId, chapitre: chapitre.code, entreprise, etape, etapes, erreurs })
    .onConflictDoUpdate({
      target: [coursProgressions.userId, coursProgressions.classeId, coursProgressions.chapitre],
      set: { entreprise, etape, etapes, erreurs, majLe: new Date() },
    });
  return true;
}

/**
 * Un chapitre réservé s'ouvre à l'élève par sa classe : quand l'enseignant qui l'a créée
 * est rattaché à un établissement sous licence de l'arène. L'élève n'a pas de compte ;
 * c'est la licence de son enseignant qui le couvre.
 */
export async function classeSousLicence(userId: string): Promise<boolean> {
  const [m] = await db
    .select({ creePar: coursClasses.creePar })
    .from(coursEleves)
    .innerJoin(coursClasses, eq(coursClasses.id, coursEleves.classeId))
    .where(eq(coursEleves.userId, userId));
  return m ? unCompteSousLicence([m.creePar]) : false;
}

/**
 * QUI OUVRE QUEL CHAPITRE (décision du propriétaire, octobre 2026). Un chapitre libre s'ouvre
 * à tous (la Découverte ; un par diplôme depuis novembre 2026, config/cours/chapitres-libres.ts).
 * Les autres :
 *  · Campus : tous ;
 *  · Classe : ceux du parcours de la classe (`cours_classes.parcours`), pour l'élève par sa
 *    classe, pour l'enseignant par les classes qu'il a créées ;
 *  · Programme : de même, les parcours des classes de l'établissement (un programme couvre
 *    tous ses groupes, pas tout le catalogue : c'est l'offre Campus qui ouvre tout) ;
 *  · une classe héritée (d'avant la migration 0052) sans parcours : sous Classe ou Programme,
 *    l'accès d'avant (tout le cours), jusqu'à ce que son enseignant choisisse son parcours ;
 *  · LE PARCOURS D'UNE FORMATION (le cours d'un diplôme : le bac STMG, un BTS, un BUT, le DCG…) : il regroupe des chapitres d'autres
 *    parcours sans les dupliquer ; un chapitre s'ouvre à la classe dont le parcours est le sien ou
 *    un parcours de formation qui le regroupe, un cas dédié avec le chapitre qu'il reprend
 *    (`parcoursQuiOuvrent`, config/cours/parcours-de-formation.ts) ;
 *  · LES PRÉREQUIS ANNONCÉS (décision du propriétaire, 11 novembre 2026) : un chapitre s'ouvre aussi
 *    avec le chapitre qui l'annonce en prérequis, de proche en proche, et une classe qui libère un
 *    chapitre libère ses prérequis (même fonction ; services/chapitres-de-la-classe.ts) ;
 *  · sans licence de l'arène en cours : aucun.
 * L'offre est celle de l'établissement de l'enseignant (celui de la classe, pour l'élève).
 */
export async function coursOuvert(
  qui: { enseignant?: string | null; eleve?: string | null },
  chapitre: Pick<Chapitre, "libre"> & OuvrablePar,
  /** Sans la libération de la classe : pour lire l'offre une fois par parcours (/cours). */
  options: { sansLiberation?: boolean } = {},
): Promise<boolean> {
  if (chapitre.libre) return true;
  if (qui.enseignant && (await ouvertALEnseignant(qui.enseignant, chapitre))) return true;
  if (qui.eleve && (await ouvertALEleve(qui.eleve, chapitre, options.sansLiberation ?? false))) return true;
  return false;
}

/**
 * La libération de la classe d'un élève : son mode, ses chapitres libérés, et ceux-ci du plus
 * récemment libéré au plus ancien (« Ma classe » vise le dernier) ; null sans classe.
 */
export async function liberationDeLEleve(
  eleve: string,
): Promise<{ mode: ModeDeLiberation; liberes: Set<string>; duPlusRecent: string[] } | null> {
  const [m] = await db
    .select({ classeId: coursClasses.id, liberation: coursClasses.liberation })
    .from(coursEleves)
    .innerJoin(coursClasses, eq(coursClasses.id, coursEleves.classeId))
    .where(eq(coursEleves.userId, eleve));
  if (!m) return null;
  const duPlusRecent = m.liberation === "chapitre" ? await chapitresLiberesDuPlusRecent(m.classeId) : [];
  return { mode: m.liberation, liberes: new Set(duPlusRecent), duPlusRecent };
}

// L'ADMIN RESTREINT, L'ENSEIGNANT LIBÈRE (migration 0056 ; règles pures :
// services/chapitres-de-la-classe.ts). Une liste d'attribution limite ce que l'offre ouvre ; une
// classe en « chapitre » n'ouvre à ses élèves que les chapitres libérés.
async function ouvertALEnseignant(enseignant: string, chapitre: OuvrablePar): Promise<boolean> {
  const org = await getTeacherOrgId(enseignant);
  const offre = org ? await offreDuCoursDe(org) : null;
  if (!offre) return false;
  if (!dansLesAttributions(await parcoursAttribues(enseignant), chapitre)) return false;
  const parcours = parcoursQuiOuvrent(chapitre);
  if (offre === "campus") return true;
  const qui = offre === "classe" ? eq(coursClasses.creePar, enseignant) : eq(organizationMembers.organizationId, org!);
  const condition = and(qui, or(inArray(coursClasses.parcours, [...parcours]), and(eq(coursClasses.heritee, true), isNull(coursClasses.parcours))));
  const [une] = await db
    .select({ id: coursClasses.id })
    .from(coursClasses)
    .innerJoin(organizationMembers, eq(organizationMembers.userId, coursClasses.creePar))
    .where(condition)
    .limit(1);
  return Boolean(une);
}

async function ouvertALEleve(eleve: string, chapitre: OuvrablePar, sansLiberation: boolean): Promise<boolean> {
  const parcours = parcoursQuiOuvrent(chapitre);
  const [m] = await db
    .select({
      classeId: coursClasses.id,
      creePar: coursClasses.creePar,
      parcours: coursClasses.parcours,
      heritee: coursClasses.heritee,
      liberation: coursClasses.liberation,
    })
    .from(coursEleves)
    .innerJoin(coursClasses, eq(coursClasses.id, coursEleves.classeId))
    .where(eq(coursEleves.userId, eleve));
  if (!m) return false;
  const org = await getTeacherOrgId(m.creePar);
  const offre = org ? await offreDuCoursDe(org) : null;
  if (!offre) return false;
  if (!dansLesAttributions(await parcoursAttribues(m.creePar), chapitre)) return false;
  const parSonOffre = offre === "campus" || (m.parcours !== null && parcours.includes(m.parcours)) || (m.heritee && m.parcours === null);
  if (!parSonOffre) return false;
  if (sansLiberation || m.liberation === "tout") return true;
  const liberes = new Set(await chapitresLiberesDuPlusRecent(m.classeId));
  return libereALaClasse(m.liberation, liberes, { libre: false, code: chapitre.code ?? "", reprend: chapitre.reprend });
}
