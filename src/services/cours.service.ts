import { randomInt } from "node:crypto";
import { and, asc, count, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { coursClasses, coursEleves, coursProgressions, organizationMembers, type SuiviDEtapeEnregistre } from "@/db/schema";
import { ALPHABET_REPRISE } from "@/config/reprise";
import { chapitreParCode } from "@/config/cours/registre";
import { parcoursAChoisir, parcoursQuiOuvrent, type OuvrablePar } from "@/config/cours/parcours-de-formation";
import type { Chapitre } from "@/config/cours/types";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import type { ProgressionLue } from "@/pedagogy/cours/suivi";
import { offreDuCoursDe, plafondDElevesDesComptes, unCompteSousLicence } from "@/services/acces.service";
import { getTeacherOrgId } from "@/services/auth.service";

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
/** Un parcours du registre, ou un parcours de formation (le BUT : config/cours/parcours-de-formation.ts). */
const parcoursValide = (p: string | null | undefined) => (parcoursAChoisir(p) ? p : null);

export async function creerClasse(args: {
  enseignantId: string;
  nom: string;
  entreprise?: string | null;
  /** Le parcours du cours (config/cours/registre.ts) : obligatoire ; inconnu ou absent, rien ne se crée. */
  parcours?: string | null;
}): Promise<{ id: string; code: string } | null> {
  const nom = args.nom.trim().slice(0, NOM_DE_CLASSE_MAX);
  // Le parcours est obligatoire à la création (migration 0052) : il ouvre les chapitres.
  const parcours = parcoursValide(args.parcours);
  if (!nom || !parcours) return null;
  for (let essai = 0; essai < 8; essai += 1) {
    const [cree] = await db
      .insert(coursClasses)
      .values({ code: codeDeClasse(nom), nom, creePar: args.enseignantId, entreprise: entrepriseValide(args.entreprise), parcours })
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

/** Une classe de cet enseignant, et la progression de ses élèves dans un chapitre. Null : pas la sienne. */
export async function classeDeLEnseignant(enseignantId: string, classeId: string, chapitre: string) {
  const [classe] = await db
    .select()
    .from(coursClasses)
    .where(and(eq(coursClasses.id, classeId), eq(coursClasses.creePar, enseignantId)));
  if (!classe) return null;
  const eleves = await db
    .select({ userId: coursEleves.userId, nom: coursEleves.nom })
    .from(coursEleves)
    .where(eq(coursEleves.classeId, classeId))
    .orderBy(asc(coursEleves.nom));
  const lignes = await db
    .select()
    .from(coursProgressions)
    .where(and(eq(coursProgressions.classeId, classeId), eq(coursProgressions.chapitre, chapitre)));
  const parEleve = new Map(lignes.map((l) => [l.userId, l]));
  // Un élève qui a rejoint sans avoir encore ouvert le chapitre compte : il est à l'étape 0.
  const progressions: ProgressionLue[] = eleves.map((e) => {
    const l = parEleve.get(e.userId);
    return {
      eleve: e.nom,
      entreprise: l?.entreprise ?? classe.entreprise ?? "",
      etape: l?.etape ?? 0,
      etapes: l?.etapes ?? {},
      erreurs: l?.erreurs ?? {},
      majLe: l?.majLe ?? classe.createdAt,
    };
  });
  return { classe, progressions };
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
 * qui ouvre les chapitres, et le changer à volonté ouvrirait tout le cours.
 */
export async function choisirLeParcours(args: { enseignantId: string; classeId: string; parcours: string }): Promise<boolean> {
  const parcours = parcoursValide(args.parcours);
  if (!parcours) return false;
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

/** La classe d'un élève, s'il en suit une. */
export async function classeDeLEleve(userId: string) {
  const [m] = await db
    .select({
      classeId: coursClasses.id,
      classe: coursClasses.nom,
      eleve: coursEleves.nom,
      entreprise: coursClasses.entreprise,
      closeLe: coursClasses.closeLe,
      sansCalculatrice: coursClasses.sansCalculatrice,
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
 * QUI OUVRE QUEL CHAPITRE (décision du propriétaire, octobre 2026). Le chapitre libre s'ouvre
 * à tous (la Découverte). Les autres :
 *  · Campus : tous ;
 *  · Classe : ceux du parcours de la classe (`cours_classes.parcours`), pour l'élève par sa
 *    classe, pour l'enseignant par les classes qu'il a créées ;
 *  · Programme : de même, les parcours des classes de l'établissement (un programme couvre
 *    tous ses groupes, pas tout le catalogue : c'est l'offre Campus qui ouvre tout) ;
 *  · une classe héritée (d'avant la migration 0052) sans parcours : sous Classe ou Programme,
 *    l'accès d'avant (tout le cours), jusqu'à ce que son enseignant choisisse son parcours ;
 *  · LE PARCOURS D'UNE FORMATION (le BUT GEA, TC ou GACO) : il regroupe des chapitres d'autres
 *    parcours sans les dupliquer ; un chapitre s'ouvre à la classe dont le parcours est le sien ou
 *    un parcours de formation qui le regroupe, un cas dédié avec le chapitre qu'il reprend
 *    (`parcoursQuiOuvrent`, config/cours/parcours-de-formation.ts) ;
 *  · sans licence de l'arène en cours : aucun.
 * L'offre est celle de l'établissement de l'enseignant (celui de la classe, pour l'élève).
 */
export async function coursOuvert(
  qui: { enseignant?: string | null; eleve?: string | null },
  chapitre: Pick<Chapitre, "libre"> & OuvrablePar,
): Promise<boolean> {
  if (chapitre.libre) return true;
  const parcours = parcoursQuiOuvrent(chapitre);
  if (qui.enseignant && (await ouvertALEnseignant(qui.enseignant, parcours))) return true;
  if (qui.eleve && (await ouvertALEleve(qui.eleve, parcours))) return true;
  return false;
}

async function ouvertALEnseignant(enseignant: string, parcours: readonly string[]): Promise<boolean> {
  const org = await getTeacherOrgId(enseignant);
  const offre = org ? await offreDuCoursDe(org) : null;
  if (!offre) return false;
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

async function ouvertALEleve(eleve: string, parcours: readonly string[]): Promise<boolean> {
  const [m] = await db
    .select({ creePar: coursClasses.creePar, parcours: coursClasses.parcours, heritee: coursClasses.heritee })
    .from(coursEleves)
    .innerJoin(coursClasses, eq(coursClasses.id, coursEleves.classeId))
    .where(eq(coursEleves.userId, eleve));
  if (!m) return false;
  const org = await getTeacherOrgId(m.creePar);
  const offre = org ? await offreDuCoursDe(org) : null;
  if (!offre) return false;
  return offre === "campus" || (m.parcours !== null && parcours.includes(m.parcours)) || (m.heritee && m.parcours === null);
}
