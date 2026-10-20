import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationMembers, users } from "@/db/schema";
import { SITE_URL } from "@/config/site";
import { authSecret } from "@/lib/auth-secret";
import { envoyerCourriel, type ResultatEnvoi } from "@/lib/courriel";
import { adresseEtablie, adressesAConfirmer, refusDeLicencePourAdresse } from "@/lib/adresse-etablie";
import { synchroniserLesDroitsDAdmin } from "@/services/admin.service";

/**
 * L'ADRESSE CONFIRMÉE : LE LIEN REÇU À L'INSCRIPTION (migration 0046).
 *
 * Décision du propriétaire. N'importe qui pouvait s'inscrire avec l'adresse d'un autre :
 * personne ne vérifiait qu'elle lui appartenait. Un lien part désormais à l'inscription,
 * et l'ouvrir confirme l'adresse. Il ne bloque PAS l'essai : un enseignant qui veut juste
 * voir le jeu le voit tout de suite. Sans adresse confirmée, deux choses seulement sont
 * refusées :
 *   · devenir administrateur de la plateforme (`synchroniserLesDroitsDAdmin`) ;
 *   · recevoir une licence pour son établissement (`adresseDeLEtablissementEtablie`).
 *
 * Le jeton est signé (HMAC-SHA256, clé dérivée d'AUTH_SECRET pour ce seul usage) sur le
 * compte, son adresse et l'échéance du lien : une adresse changée depuis l'envoi rend le
 * lien caduc. Il ne connecte pas et ne montre rien du compte.
 */

const BUT_DU_JETON = "business-arena/compte/confirmation-email/v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MINUTE = 60 * 1000;

/** Le lien reste valable une semaine : le temps d'un retour de vacances. */
export const DUREE_DU_LIEN_MS = 7 * 24 * 60 * MINUTE;
/** La même durée, dite dans les textes : lue de la constante, jamais écrite à la main. */
export const DUREE_DU_LIEN_DITE = (() => {
  const jours = Math.round(DUREE_DU_LIEN_MS / (24 * 60 * MINUTE));
  return jours === 7 ? "une semaine" : `${jours} jour${jours > 1 ? "s" : ""}`;
})();
/** Deux envois à la même adresse sont espacés d'au moins deux minutes. */
export const INTERVALLE_ENTRE_DEUX_ENVOIS_MS = 2 * MINUTE;

function signature(userId: string, email: string, echeance: number, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${BUT_DU_JETON}:${userId.toLowerCase()}:${email.trim().toLowerCase()}:${echeance}`)
    .digest("base64url");
}

export function jetonDeConfirmation(
  user: { id: string; email: string },
  echeance: Date,
  secret: string = authSecret(),
): string {
  const t = echeance.getTime();
  return `${user.id.toLowerCase()}.${t.toString(36)}.${signature(user.id, user.email, t, secret)}`;
}

/** Le compte et l'échéance que le jeton porte, sans encore en vérifier la signature. */
function lireLeJeton(jeton: string | null | undefined): { userId: string; echeance: number; sig: string } | null {
  if (!jeton || jeton.length > 200) return null;
  const [userId, echeance36, sig, ...reste] = jeton.trim().split(".");
  if (!userId || !echeance36 || !sig || reste.length > 0 || !UUID.test(userId)) return null;
  const echeance = parseInt(echeance36, 36);
  if (!Number.isFinite(echeance)) return null;
  return { userId: userId.toLowerCase(), echeance, sig };
}

function signatureValide(
  lu: { userId: string; echeance: number; sig: string },
  email: string,
  secret: string,
): boolean {
  const a = Buffer.from(lu.sig);
  const b = Buffer.from(signature(lu.userId, email, lu.echeance, secret));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function lienDeConfirmation(jeton: string, origine: string = SITE_URL): string {
  return `${origine}/compte/confirmer?jeton=${encodeURIComponent(jeton)}`;
}

export type ResultatDeConfirmation =
  | { etat: "confirme" }
  | { etat: "deja"; le: Date }
  | { etat: "expire" }
  | { etat: "invalide" };

/**
 * Confirme l'adresse du compte que le jeton désigne. Rouvrir le lien ne fait rien de plus
 * et le dit. Un jeton faux, d'un compte supprimé ou d'une adresse changée depuis est
 * « invalide », sans dire lequel. Une fois l'adresse confirmée, les droits d'administrateur
 * sont relus : une adresse d'ADMIN_EMAILS les reçoit à cet instant.
 */
export async function confirmerParJeton(
  jeton: string | null | undefined,
  maintenant: Date = new Date(),
  secret: string = authSecret(),
): Promise<ResultatDeConfirmation> {
  const lu = lireLeJeton(jeton);
  if (!lu) return { etat: "invalide" };
  const compte = (
    await db
      .select({ id: users.id, email: users.email, confirmeLe: users.emailConfirmeLe })
      .from(users)
      .where(eq(users.id, lu.userId))
  )[0];
  if (!compte || !signatureValide(lu, compte.email, secret)) return { etat: "invalide" };
  if (compte.confirmeLe) return { etat: "deja", le: compte.confirmeLe };
  if (maintenant.getTime() > lu.echeance) return { etat: "expire" };
  await db.update(users).set({ emailConfirmeLe: maintenant }).where(eq(users.id, compte.id));
  await synchroniserLesDroitsDAdmin(compte.id, compte.email);
  return { etat: "confirme" };
}

export type ResultatDEnvoiDuLien =
  | { etat: "envoye" }
  | { etat: "deja_confirme" }
  | { etat: "trop_tot"; minutes: number }
  | { etat: "non_envoye"; raison: Extract<ResultatEnvoi, { envoye: false }>["raison"] };

/** Le courriel du lien : texte simple, sans rien d'autre à faire qu'ouvrir le lien. */
export function courrielDeConfirmation(lien: string): { sujet: string; texte: string } {
  return {
    sujet: "Confirmez votre adresse sur Business Arena",
    texte: [
      "Bonjour,",
      "",
      "Un compte enseignant vient d'être ouvert sur Business Arena avec cette adresse.",
      "Pour confirmer qu'elle est bien la vôtre, ouvrez ce lien :",
      "",
      lien,
      "",
      `Le lien reste valable ${DUREE_DU_LIEN_DITE}. Vous pouvez déjà jouer sans l'ouvrir ; il faut`,
      "seulement une adresse confirmée pour recevoir une licence d'établissement.",
      "",
      "Si vous n'avez rien demandé, ignorez ce message : sans confirmation, le compte",
      "ne reçoit aucune licence.",
    ].join("\n"),
  };
}

/**
 * Envoie (ou renvoie) le lien de confirmation au compte. Rien ne part pour une adresse
 * déjà confirmée, ni moins de deux minutes après le dernier envoi. Un envoi qui échoue ne
 * casse rien : l'inscription est faite, et « Mon compte » propose de renvoyer le lien.
 */
export async function envoyerLeLienDeConfirmation(
  userId: string,
  maintenant: Date = new Date(),
  envoyer: typeof envoyerCourriel = envoyerCourriel,
): Promise<ResultatDEnvoiDuLien> {
  const compte = (
    await db
      .select({
        id: users.id,
        email: users.email,
        confirmeLe: users.emailConfirmeLe,
        envoyeeLe: users.confirmationEnvoyeeLe,
      })
      .from(users)
      .where(eq(users.id, userId))
  )[0];
  if (!compte) return { etat: "non_envoye", raison: "refuse" };
  if (compte.confirmeLe) return { etat: "deja_confirme" };
  if (compte.envoyeeLe) {
    const reste = compte.envoyeeLe.getTime() + INTERVALLE_ENTRE_DEUX_ENVOIS_MS - maintenant.getTime();
    if (reste > 0) return { etat: "trop_tot", minutes: Math.max(1, Math.ceil(reste / MINUTE)) };
  }
  const jeton = jetonDeConfirmation(compte, new Date(maintenant.getTime() + DUREE_DU_LIEN_MS));
  const { sujet, texte } = courrielDeConfirmation(lienDeConfirmation(jeton));
  const resultat = await envoyer({ a: compte.email, sujet, texte });
  if (!resultat.envoye) {
    console.warn(`[confirmation] lien non envoyé à ${compte.id} : ${resultat.raison}`);
    return { etat: "non_envoye", raison: resultat.raison };
  }
  await db.update(users).set({ confirmationEnvoyeeLe: maintenant }).where(eq(users.id, compte.id));
  return { etat: "envoye" };
}

/** Les adresses à confirmer avant toute licence à cet établissement (vide : rien n'attend). */
export async function adressesAConfirmerPourLaLicence(organizationId: string): Promise<string[]> {
  const admins = await db
    .select({
      email: users.email,
      emailConfirmeLe: users.emailConfirmeLe,
      provenance: users.provenance,
      invitationId: users.invitationId,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.role, "org_admin")));
  return adressesAConfirmer(admins);
}

export { adresseEtablie, adressesAConfirmer, refusDeLicencePourAdresse };

/** Où en est l'adresse du compte, pour « Mon compte ». */
export async function etatDeLAdresse(
  userId: string,
): Promise<{ etablie: boolean; confirmeLe: Date | null } | null> {
  const compte = (
    await db
      .select({
        emailConfirmeLe: users.emailConfirmeLe,
        provenance: users.provenance,
        invitationId: users.invitationId,
      })
      .from(users)
      .where(eq(users.id, userId))
  )[0];
  if (!compte) return null;
  return { etablie: adresseEtablie(compte), confirmeLe: compte.emailConfirmeLe };
}
