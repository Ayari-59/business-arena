import { randomBytes, randomInt } from "node:crypto";
import { and, asc, count, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  episodeCohortes,
  episodeMembres,
  episodeReprises,
  organizations,
  users,
} from "@/db/schema";
import { getLicenceStatus, type LicenceState } from "@/services/licence.service";
import {
  ALPHABET_REPRISE,
  LONGUEUR_CODE_REPRISE,
  codeDeReprisePlausible,
  normaliserCodeDeReprise,
} from "@/config/reprise";
import { agregerCohorte, type VueDeCohorte } from "@/pedagogy/profil/cohorte";
import { garderLesTentatives } from "@/services/reprise.service";
import { partiesDeTous } from "@/services/episode-parties.service";
import { getTeacherOrgId } from "@/services/auth.service";
import { uneOrganisationAvecEpisodes } from "@/services/acces.service";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { NOM_DE_COHORTE_MAX, type RefusDeCohorte } from "@/config/cohortes";

/**
 * LES COHORTES D'ÉPISODES MANAGER, ET LE CODE QUI REND UN PROFIL.
 *
 * Une cohorte se crée pour une entreprise et un groupe (« ACME, managers de
 * proximité, automne »). Elle a deux portes :
 *
 *   · son CODE, que les managers reçoivent dans le lien d'invitation ;
 *   · la CLÉ de l'animateur, longue et secrète, qui ouvre la vue agrégée et
 *     rien d'autre — ni un nom, ni un profil.
 *
 * Le code de reprise est personnel : huit caractères, la même forme que dans
 * les concours et les classes, la même garde contre qui essaierait de le
 * deviner. Il rend à la personne son profil depuis un autre appareil.
 */

const MARQUEUR_REPRISE_PROFIL = "reprise-de-profil";

const tirer = (n: number) =>
  Array.from({ length: n }, () => ALPHABET_REPRISE[randomInt(ALPHABET_REPRISE.length)]).join("");

/** « ACME-7K3P » : un préfixe lisible tiré du nom, et quatre signes pour l'unicité. */
function codeDeCohorte(nom: string): string {
  const prefixe =
    nom
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6) || "COHORTE";
  return `${prefixe}-${tirer(4)}`;
}

export const normaliserCodeDeCohorte = (saisi: string) =>
  saisi
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);

/**
 * Créer une cohorte. `organizationId` est l'organisation de l'animateur : sous licence,
 * ses membres jouent tous les épisodes ; sans elle, les seules démonstrations
 * (services/acces.service.ts). Une cohorte de l'administration sans licence se crée
 * donc, mais n'ouvre aucun épisode payant. Celle d'un enseignant passe par
 * `creerCohorteDeLEnseignant`, qui exige la licence.
 */
export async function creerCohorte(
  nom: string,
  organizationId: string | null = null,
  options: { creePar?: string | null; episodes?: readonly string[] | null } = {},
): Promise<{ id: string; code: string; nom: string; cleAnimateur: string }> {
  const propre = nom.trim().slice(0, NOM_DE_COHORTE_MAX);
  if (!propre) throw new Error("Une cohorte a besoin d'un nom.");
  for (let essai = 0; essai < 8; essai += 1) {
    const [cree] = await db
      .insert(episodeCohortes)
      .values({
        code: codeDeCohorte(propre),
        nom: propre,
        cleAnimateur: randomBytes(18).toString("base64url"),
        organizationId,
        creePar: options.creePar ?? null,
        episodes: options.episodes ? [...options.episodes] : null,
      })
      .onConflictDoNothing()
      .returning();
    if (cree)
      return { id: cree.id, code: cree.code, nom: cree.nom, cleAnimateur: cree.cleAnimateur };
  }
  throw new Error("Impossible de tirer un code de cohorte libre.");
}

export async function cohorteParCode(code: string) {
  const net = normaliserCodeDeCohorte(code);
  if (!net) return null;
  const [c] = await db.select().from(episodeCohortes).where(eq(episodeCohortes.code, net));
  return c
    ? {
        id: c.id,
        code: c.code,
        nom: c.nom,
        episodes: c.episodes ?? null,
        close: c.closeLe !== null,
      }
    : null;
}

/**
 * La cohorte d'une personne, s'il y en a une : son nom, ses épisodes (nul : tous) et si
 * elle est close.
 */
export async function cohorteDe(userId: string) {
  const [m] = await db
    .select({
      code: episodeCohortes.code,
      nom: episodeCohortes.nom,
      depuis: episodeMembres.depuis,
      episodes: episodeCohortes.episodes,
      closeLe: episodeCohortes.closeLe,
    })
    .from(episodeMembres)
    .innerJoin(episodeCohortes, eq(episodeCohortes.id, episodeMembres.cohorteId))
    .where(eq(episodeMembres.userId, userId));
  return m
    ? {
        code: m.code,
        nom: m.nom,
        depuis: m.depuis,
        episodes: m.episodes ?? null,
        close: m.closeLe !== null,
      }
    : null;
}

/**
 * Rejoindre une cohorte ; une personne n'en suit qu'une : rejoindre une autre la remplace.
 * Une cohorte CLOSE refuse les nouveaux participants ; qui en est déjà membre le reste.
 */
export async function rejoindreCohorte(
  userId: string,
  code: string,
): Promise<{ ok: true; nom: string } | { ok: false; erreur: string; close?: true }> {
  const cohorte = await cohorteParCode(code);
  if (!cohorte) return { ok: false, erreur: "Ce code de cohorte n'existe pas." };
  if (cohorte.close) {
    const [deja] = await db
      .select({ cohorteId: episodeMembres.cohorteId })
      .from(episodeMembres)
      .where(eq(episodeMembres.userId, userId));
    if (deja?.cohorteId === cohorte.id) return { ok: true, nom: cohorte.nom };
    return { ok: false, erreur: "Cette cohorte est close.", close: true };
  }
  await db
    .insert(episodeMembres)
    .values({ userId, cohorteId: cohorte.id })
    .onConflictDoUpdate({
      target: episodeMembres.userId,
      set: { cohorteId: cohorte.id, depuis: new Date() },
    });
  return { ok: true, nom: cohorte.nom };
}

export async function quitterCohorte(userId: string): Promise<void> {
  await db.delete(episodeMembres).where(eq(episodeMembres.userId, userId));
}

/** Le code de reprise d'une personne ; créé seulement si on le demande. */
export async function codeDeRepriseDuProfil(userId: string, creer = false): Promise<string | null> {
  const lire = async () =>
    (await db.select().from(episodeReprises).where(eq(episodeReprises.userId, userId)))[0]?.code ??
    null;
  const existant = await lire();
  if (existant || !creer) return existant;
  for (let essai = 0; essai < 8; essai += 1) {
    const [pose] = await db
      .insert(episodeReprises)
      .values({ userId, code: tirer(LONGUEUR_CODE_REPRISE) })
      .onConflictDoNothing()
      .returning({ code: episodeReprises.code });
    if (pose) return pose.code;
    const relu = await lire();
    if (relu) return relu;
  }
  throw new Error("Impossible d'attribuer un code de reprise.");
}

/**
 * Retrouver la personne qui porte ce code. Le refus ne dit jamais ce qui
 * existe : un code mal formé et un code inconnu pèsent le même poids.
 */
export async function reprendreProfil(args: {
  code: string;
  ip?: string | null;
}): Promise<{ ok: true; userId: string } | { ok: false; erreur: string }> {
  const garde = await garderLesTentatives({ marqueur: MARQUEUR_REPRISE_PROFIL, ip: args.ip });
  if (garde.refus) return { ok: false, erreur: garde.refus };
  const net = normaliserCodeDeReprise(args.code);
  const [trouve] = codeDeReprisePlausible(net)
    ? await db.select().from(episodeReprises).where(eq(episodeReprises.code, net))
    : [];
  if (!trouve) {
    await garde.echec();
    return { ok: false, erreur: "Ce code ne correspond à aucun profil. Vérifiez-le et réessayez." };
  }
  await garde.succes();
  return { ok: true, userId: trouve.userId };
}

/** La vue de l'animateur, par sa clé ; `null` si la clé n'ouvre rien. */
export async function vueDeLAnimateur(
  cle: string,
): Promise<{ nom: string; code: string; vue: VueDeCohorte } | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(cle)) return null;
  const [c] = await db.select().from(episodeCohortes).where(eq(episodeCohortes.cleAnimateur, cle));
  if (!c) return null;
  const membres = await db
    .select({ userId: episodeMembres.userId })
    .from(episodeMembres)
    .where(eq(episodeMembres.cohorteId, c.id));
  const parties = await partiesDeTous(membres.map((m) => m.userId));
  return {
    nom: c.nom,
    code: c.code,
    vue: agregerCohorte(membres.map((m) => parties.get(m.userId) ?? [])),
  };
}

/** Toutes les cohortes, la plus récente d'abord, avec leur nombre de membres : pour l'administration. */
export async function listerCohortes(): Promise<
  {
    id: string;
    code: string;
    nom: string;
    cleAnimateur: string;
    creeeLe: Date;
    membres: number;
    /** L'organisation de l'animateur, et l'état de sa licence ; null : aucune rattachée. */
    organisation: { id: string; nom: string; licence: LicenceState } | null;
    /** L'enseignant qui l'a créée depuis son espace ; null : l'administration. */
    creePar: { nom: string; email: string } | null;
    /** Les épisodes qu'elle ouvre ; null : tous. */
    episodes: string[] | null;
    closeLe: Date | null;
  }[]
> {
  const lignes = await db
    .select({
      id: episodeCohortes.id,
      code: episodeCohortes.code,
      nom: episodeCohortes.nom,
      cleAnimateur: episodeCohortes.cleAnimateur,
      creeeLe: episodeCohortes.createdAt,
      organisationId: episodeCohortes.organizationId,
      organisationNom: organizations.name,
      creeParId: episodeCohortes.creePar,
      creeParNom: users.displayName,
      creeParEmail: users.email,
      episodes: episodeCohortes.episodes,
      closeLe: episodeCohortes.closeLe,
      membres: count(episodeMembres.userId),
    })
    .from(episodeCohortes)
    .leftJoin(episodeMembres, eq(episodeMembres.cohorteId, episodeCohortes.id))
    .leftJoin(organizations, eq(organizations.id, episodeCohortes.organizationId))
    .leftJoin(users, eq(users.id, episodeCohortes.creePar))
    .groupBy(episodeCohortes.id, organizations.id, users.id)
    .orderBy(desc(episodeCohortes.createdAt));
  return Promise.all(
    lignes.map(
      async ({ organisationId, organisationNom, creeParId, creeParNom, creeParEmail, ...l }) => ({
        ...l,
        episodes: l.episodes ?? null,
        membres: Number(l.membres),
        creePar: creeParId ? { nom: creeParNom ?? "", email: creeParEmail ?? "" } : null,
        organisation: organisationId
          ? {
              id: organisationId,
              nom: organisationNom ?? "",
              licence: (await getLicenceStatus(organisationId, new Date(), "episodes")).state,
            }
          : null,
      }),
    ),
  );
}

/**
 * Rattacher une cohorte à l'organisation de son animateur, ou l'en détacher. Ses membres
 * jouent tous les épisodes tant que cette organisation est sous licence.
 */
export async function rattacherCohorte(
  cohorteId: string,
  organizationId: string | null,
): Promise<void> {
  await db
    .update(episodeCohortes)
    .set({ organizationId })
    .where(eq(episodeCohortes.id, cohorteId));
}

/** Les organisations auxquelles rattacher une cohorte (hors l'organisation « grand public »). */
export async function organisationsPourLesCohortes(): Promise<{ id: string; nom: string }[]> {
  return db
    .select({ id: organizations.id, nom: organizations.name })
    .from(organizations)
    .where(ne(organizations.kind, "public"))
    .orderBy(asc(organizations.name));
}

/**
 * Remplacer la clé de l'animateur, quand son lien a circulé. L'ancien lien
 * cesse aussitôt d'ouvrir quoi que ce soit ; les membres ne sont pas touchés.
 */
export async function renouvelerCleAnimateur(cohorteId: string): Promise<string | null> {
  const [maj] = await db
    .update(episodeCohortes)
    .set({ cleAnimateur: randomBytes(18).toString("base64url") })
    .where(eq(episodeCohortes.id, cohorteId))
    .returning({ cle: episodeCohortes.cleAnimateur });
  return maj?.cle ?? null;
}

/* ---------------------------------------------------------------------------
 * LES COHORTES DE L'ENSEIGNANT.
 *
 * Décision du propriétaire (octobre 2026) : « des cohortes créées par l'enseignant ».
 * Depuis son espace (/teacher/cohortes), un enseignant sous licence crée une cohorte :
 * un nom, des épisodes. Elle reçoit le code de cohorte habituel, l'organisation de
 * l'enseignant (c'est elle qui ouvre les épisodes aux élèves, sans compte) et son
 * créateur. Toutes les fonctions ci-dessous filtrent par ce créateur DANS la requête :
 * un identifiant forgé, celui de la cohorte d'un autre, ne lit ni ne modifie rien.
 * Le modèle d'organisation ne partage pas les parties entre collègues (chacun voit les
 * siennes) ; les cohortes suivent la même règle.
 * ------------------------------------------------------------------------- */

/** Un refus de création, avec son code (config/cohortes.ts dit la phrase). */
export class CohorteRefuseeError extends Error {
  constructor(readonly raison: RefusDeCohorte) {
    super(raison);
    this.name = "CohorteRefuseeError";
  }
}

/** La violation d'unicité de Postgres (23505), quel que soit le pilote qui la porte. */
const estUnDoublon = (e: unknown): boolean => {
  const err = e as { code?: string; cause?: { code?: string } } | null;
  return err?.code === "23505" || err?.cause?.code === "23505";
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Les codes d'épisodes connus, sans doublon, dans l'ordre du registre. */
export function episodesRetenus(codes: readonly string[]): string[] {
  const voulus = new Set(codes.map((c) => c.trim()));
  return EPISODES.map((e) => e.code).filter((c) => voulus.has(c));
}

/**
 * Créer la cohorte d'un enseignant. Refusée (CohorteRefuseeError) sans établissement,
 * sans licence en cours de cet établissement qui inclut les épisodes (même pour les
 * seules démonstrations : pas d'essai en classe), sans nom ou sans épisode.
 */
export async function creerCohorteDeLEnseignant(args: {
  enseignantId: string;
  nom: string;
  episodes: readonly string[];
}): Promise<{ id: string; code: string; nom: string; cleAnimateur: string }> {
  const organisation = await getTeacherOrgId(args.enseignantId);
  if (!organisation) throw new CohorteRefuseeError("organisation");
  // Les épisodes se vendent à part (config/tarifs.ts) : il faut une licence en cours QUI
  // LES INCLUT ; une licence de l'arène seule n'ouvre que l'arène.
  if (!(await uneOrganisationAvecEpisodes([organisation]))) {
    throw new CohorteRefuseeError("licence");
  }
  if (!args.nom.trim()) throw new CohorteRefuseeError("nom");
  const episodes = episodesRetenus(args.episodes);
  if (episodes.length === 0) throw new CohorteRefuseeError("episodes");
  return creerCohorte(args.nom, organisation, { creePar: args.enseignantId, episodes });
}

export interface CohorteDeLEnseignant {
  id: string;
  code: string;
  nom: string;
  cleAnimateur: string;
  episodes: string[];
  membres: number;
  creeeLe: Date;
  closeLe: Date | null;
}

const filtreDuCreateur = (enseignantId: string, cohorteId?: string) =>
  cohorteId
    ? and(eq(episodeCohortes.creePar, enseignantId), eq(episodeCohortes.id, cohorteId))
    : eq(episodeCohortes.creePar, enseignantId);

async function lireLesCohortes(
  enseignantId: string,
  cohorteId?: string,
): Promise<CohorteDeLEnseignant[]> {
  const lignes = await db
    .select({
      id: episodeCohortes.id,
      code: episodeCohortes.code,
      nom: episodeCohortes.nom,
      cleAnimateur: episodeCohortes.cleAnimateur,
      episodes: episodeCohortes.episodes,
      creeeLe: episodeCohortes.createdAt,
      closeLe: episodeCohortes.closeLe,
      membres: count(episodeMembres.userId),
    })
    .from(episodeCohortes)
    .leftJoin(episodeMembres, eq(episodeMembres.cohorteId, episodeCohortes.id))
    .where(filtreDuCreateur(enseignantId, cohorteId))
    .groupBy(episodeCohortes.id)
    .orderBy(desc(episodeCohortes.createdAt));
  return lignes.map((l) => ({ ...l, episodes: l.episodes ?? [], membres: Number(l.membres) }));
}

/** Les cohortes de cet enseignant, la plus récente d'abord. Jamais celles d'un autre. */
export function cohortesDeLEnseignant(enseignantId: string): Promise<CohorteDeLEnseignant[]> {
  return lireLesCohortes(enseignantId);
}

/** Une cohorte de cet enseignant ; null si elle n'existe pas ou n'est pas la sienne. */
export async function cohorteDeLEnseignant(
  enseignantId: string,
  cohorteId: string,
): Promise<CohorteDeLEnseignant | null> {
  if (!UUID.test(cohorteId)) return null;
  return (await lireLesCohortes(enseignantId, cohorteId))[0] ?? null;
}

/** Renommer sa cohorte ; false si elle n'est pas la sienne ou si le nom est vide. */
export async function renommerCohorte(args: {
  enseignantId: string;
  cohorteId: string;
  nom: string;
}): Promise<boolean> {
  const propre = args.nom.trim().slice(0, NOM_DE_COHORTE_MAX);
  if (!propre || !UUID.test(args.cohorteId)) return false;
  const maj = await db
    .update(episodeCohortes)
    .set({ nom: propre })
    .where(filtreDuCreateur(args.enseignantId, args.cohorteId))
    .returning({ id: episodeCohortes.id });
  return maj.length === 1;
}

/**
 * Clore sa cohorte (ou la rouvrir). Close, elle refuse les nouveaux participants et
 * n'ouvre plus de nouvel épisode à ses membres ; une partie commencée se termine, et
 * la vue de l'animateur reste lisible. False si elle n'est pas la sienne.
 */
export async function cloreCohorte(args: {
  enseignantId: string;
  cohorteId: string;
  close: boolean;
}): Promise<boolean> {
  if (!UUID.test(args.cohorteId)) return false;
  const maj = await db
    .update(episodeCohortes)
    .set({ closeLe: args.close ? new Date() : null })
    .where(filtreDuCreateur(args.enseignantId, args.cohorteId))
    .returning({ id: episodeCohortes.id });
  return maj.length === 1;
}

/**
 * Renouveler le code de sa cohorte, quand il a circulé hors de la classe. L'ancien code
 * n'ouvre plus rien ; les membres restent membres. Le nouveau code, ou null si la
 * cohorte n'est pas la sienne.
 */
export async function renouvelerCodeDeCohorte(args: {
  enseignantId: string;
  cohorteId: string;
}): Promise<string | null> {
  const cohorte = await cohorteDeLEnseignant(args.enseignantId, args.cohorteId);
  if (!cohorte) return null;
  for (let essai = 0; essai < 8; essai += 1) {
    const code = codeDeCohorte(cohorte.nom);
    const [prise] = await db
      .select({ id: episodeCohortes.id })
      .from(episodeCohortes)
      .where(eq(episodeCohortes.code, code));
    if (prise) continue;
    try {
      const [maj] = await db
        .update(episodeCohortes)
        .set({ code })
        .where(filtreDuCreateur(args.enseignantId, args.cohorteId))
        .returning({ code: episodeCohortes.code });
      return maj?.code ?? null;
    } catch (e) {
      // Pris entre la lecture et l'écriture : on tire un autre code.
      if (!estUnDoublon(e)) throw e;
    }
  }
  throw new Error("Impossible de tirer un code de cohorte libre.");
}
