import { randomBytes, randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { episodeCohortes, episodeMembres, episodeReprises } from "@/db/schema";
import {
  ALPHABET_REPRISE,
  LONGUEUR_CODE_REPRISE,
  codeDeReprisePlausible,
  normaliserCodeDeReprise,
} from "@/config/reprise";
import { agregerCohorte, type VueDeCohorte } from "@/pedagogy/profil/cohorte";
import { garderLesTentatives } from "@/services/reprise.service";
import { partiesDeTous } from "@/services/episode-parties.service";

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

export async function creerCohorte(
  nom: string,
): Promise<{ id: string; code: string; nom: string; cleAnimateur: string }> {
  const propre = nom.trim().slice(0, 120);
  if (!propre) throw new Error("Une cohorte a besoin d'un nom.");
  for (let essai = 0; essai < 8; essai += 1) {
    const [cree] = await db
      .insert(episodeCohortes)
      .values({
        code: codeDeCohorte(propre),
        nom: propre,
        cleAnimateur: randomBytes(18).toString("base64url"),
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
  return c ? { id: c.id, code: c.code, nom: c.nom } : null;
}

/** La cohorte d'une personne, s'il y en a une. */
export async function cohorteDe(userId: string) {
  const [m] = await db
    .select({ code: episodeCohortes.code, nom: episodeCohortes.nom, depuis: episodeMembres.depuis })
    .from(episodeMembres)
    .innerJoin(episodeCohortes, eq(episodeCohortes.id, episodeMembres.cohorteId))
    .where(eq(episodeMembres.userId, userId));
  return m ?? null;
}

/** Rejoindre une cohorte ; une personne n'en suit qu'une : rejoindre une autre la remplace. */
export async function rejoindreCohorte(
  userId: string,
  code: string,
): Promise<{ ok: true; nom: string } | { ok: false; erreur: string }> {
  const cohorte = await cohorteParCode(code);
  if (!cohorte) return { ok: false, erreur: "Ce code de cohorte n'existe pas." };
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
