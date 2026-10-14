import { createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ltiComptes, samlComptes, users } from "@/db/schema";
import { authSecret } from "@/lib/auth-secret";
import type { Courriel } from "@/lib/courriel";
import { SITE_URL } from "@/config/site";
import { VERSION_DU_TEXTE } from "@/config/nouveautes";

/**
 * LES NOUVEAUTÉS DE BUSINESS ARENA : LE CONSENTEMENT, ET LE LIEN QUI LE RETIRE.
 *
 * Demande du propriétaire (octobre 2026) : pouvoir écrire aux enseignants inscrits. Ce qui
 * est un MESSAGE DE SERVICE (licence, incident, devis, rendez-vous) part sans accord : il
 * exécute le service demandé. Ce qui est une NOUVEAUTÉ (un épisode de plus, une offre, un
 * conseil d'usage) relève de la prospection, donc d'un accord libre, spécifique, éclairé et
 * univoque (RGPD, art. 4.11, 6.1.a et 7 ; CPCE, art. L34-5) :
 *  · une case NON cochée à l'inscription, et le même texte dans l'espace enseignant ;
 *  · la date de l'accord ET la version du texte accepté, pour pouvoir le prouver ;
 *  · un retrait aussi simple que l'accord : un lien par compte, signé, sans connexion,
 *    dans chaque e-mail de nouveautés, et l'en-tête `List-Unsubscribe` pour le bouton de
 *    la messagerie ;
 *  · conservation : jusqu'au retrait ou à la suppression du compte.
 *
 * Il n'y a pas encore d'envoi groupé. Quand il viendra, il ne construira pas ses e-mails à
 * la main : `courrielDeNouveautes` refuse un destinataire qui ne consent pas, et pose
 * lui-même le lien et l'en-tête de désinscription. Le fichier des consentants se tire de
 * /admin/inscrits (« Exporter les consentants »), avec le lien de chacun.
 */

export { MESSAGES_DE_SERVICE, TEXTE_DU_CONSENTEMENT, VERSION_DU_TEXTE } from "@/config/nouveautes";

export interface ColonnesDuConsentement {
  nouveautesConsentiesLe: Date | null;
  nouveautesRetireesLe: Date | null;
  nouveautesVersionDuTexte: string | null;
}

export interface EtatDuConsentement {
  /** Le compte accepte-t-il les nouveautés aujourd'hui ? */
  consent: boolean;
  /** La date de l'accord en vigueur (ou du dernier accord, s'il a été retiré). */
  accordLe: Date | null;
  /** La date du dernier retrait. */
  retraitLe: Date | null;
  /** La version du texte accepté. */
  version: string | null;
}

/** Le compte consent quand son accord est plus récent que son retrait. Pur. */
export function etatDuConsentement(c: ColonnesDuConsentement): EtatDuConsentement {
  const accord = c.nouveautesConsentiesLe;
  const retrait = c.nouveautesRetireesLe;
  return {
    consent: accord !== null && (retrait === null || accord.getTime() > retrait.getTime()),
    accordLe: accord,
    retraitLe: retrait,
    version: c.nouveautesVersionDuTexte,
  };
}

async function colonnes(userId: string): Promise<ColonnesDuConsentement | null> {
  const [u] = await db
    .select({
      nouveautesConsentiesLe: users.nouveautesConsentiesLe,
      nouveautesRetireesLe: users.nouveautesRetireesLe,
      nouveautesVersionDuTexte: users.nouveautesVersionDuTexte,
    })
    .from(users)
    .where(eq(users.id, userId));
  return u ?? null;
}

/**
 * Coche ou décoche. Cocher quand on consent déjà ne change rien (la date d'accord reste
 * la première) ; décocher pose la date du retrait sans effacer celle de l'accord.
 */
export async function enregistrerConsentement(
  userId: string,
  consenti: boolean,
  maintenant: Date = new Date(),
): Promise<EtatDuConsentement> {
  const c = await colonnes(userId);
  if (!c) throw new Error("Compte introuvable.");
  const etat = etatDuConsentement(c);
  if (consenti && !etat.consent) {
    await db
      .update(users)
      .set({ nouveautesConsentiesLe: maintenant, nouveautesVersionDuTexte: VERSION_DU_TEXTE })
      .where(eq(users.id, userId));
    return { ...etat, consent: true, accordLe: maintenant, version: VERSION_DU_TEXTE };
  }
  if (!consenti && etat.consent) {
    await db.update(users).set({ nouveautesRetireesLe: maintenant }).where(eq(users.id, userId));
    return { ...etat, consent: false, retraitLe: maintenant };
  }
  return etat;
}

/**
 * À LA CRÉATION D'UN COMPTE ENSEIGNANT, quel que soit le chemin : le formulaire du site
 * aujourd'hui, et demain un premier lancement LTI ou une première venue par RENATER qui
 * montreraient la même case (les deux créent aujourd'hui le compte sans accord). Rien n'est enregistré si la case n'est pas cochée : l'absence
 * d'accord est l'état par défaut, pas un refus à dater.
 */
export async function consentementALaCreation(userId: string, caseCochee: boolean): Promise<void> {
  if (caseCochee) await enregistrerConsentement(userId, true);
}

/* ---------------------------------------------------------------------------
 * L'ADRESSE À LAQUELLE ÉCRIRE.
 * ------------------------------------------------------------------------- */

/** Les adresses techniques des comptes sans courriel propre (invités, LTI, RENATER). */
const ADRESSE_TECHNIQUE = /@[a-z0-9.-]*\.?business-arena\.local$/i;

/**
 * L'adresse de contact d'un compte : son e-mail, sauf s'il est technique (compte venu
 * d'une plateforme LTI ou de RENATER) ; dans ce cas, le courriel transmis, s'il y en a
 * un. Null : on ne peut pas lui écrire.
 */
export function adresseDeContact(email: string, courrielTransmis: string | null = null): string | null {
  if (!ADRESSE_TECHNIQUE.test(email)) return email;
  return courrielTransmis?.trim() || null;
}

/**
 * Le courriel transmis pour cet enseignant par sa plateforme LTI ou par la fédération
 * RENATER (le plus récent des deux), pour un compte dont l'adresse de connexion est
 * technique.
 */
export async function courrielTransmisDe(userId: string): Promise<string | null> {
  const [lti, saml] = await Promise.all([
    db
      .select({ courriel: ltiComptes.courriel, le: ltiComptes.dernierLancement })
      .from(ltiComptes)
      .where(and(eq(ltiComptes.userId, userId), eq(ltiComptes.role, "enseignant")))
      .orderBy(desc(ltiComptes.dernierLancement)),
    db
      .select({ courriel: samlComptes.courriel, le: samlComptes.derniereVenue })
      .from(samlComptes)
      .where(and(eq(samlComptes.userId, userId), eq(samlComptes.role, "enseignant")))
      .orderBy(desc(samlComptes.derniereVenue)),
  ]);
  const transmis = [...lti, ...saml].filter((l) => l.courriel).sort((a, b) => b.le.getTime() - a.le.getTime());
  return transmis[0]?.courriel ?? null;
}

/** Ce que l'espace enseignant montre : l'état, et l'adresse à laquelle on écrirait. */
export async function consentementDuCompte(
  userId: string,
): Promise<{ etat: EtatDuConsentement; adresse: string | null } | null> {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) return null;
  const adresse = adresseDeContact(u.email, ADRESSE_TECHNIQUE.test(u.email) ? await courrielTransmisDe(userId) : null);
  return { etat: etatDuConsentement(u), adresse };
}

/* ---------------------------------------------------------------------------
 * LE JETON DE DÉSINSCRIPTION.
 *
 * Un par compte, signé (HMAC-SHA256, clé dérivée d'AUTH_SECRET pour ce seul usage), sans
 * date d'expiration : le lien d'un e-mail d'il y a deux ans doit encore désinscrire. Il ne
 * donne accès à rien d'autre qu'au retrait du consentement de CE compte ; il ne connecte
 * pas, ne montre ni le nom ni l'adresse. Changer AUTH_SECRET invalide tous les liens déjà
 * envoyés (la page le dit et renvoie vers l'espace enseignant).
 * ------------------------------------------------------------------------- */

const BUT_DU_JETON = "business-arena/nouveautes/desinscription/v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function signature(userId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${BUT_DU_JETON}:${userId.toLowerCase()}`).digest("base64url");
}

export function jetonDeDesinscription(userId: string, secret: string = authSecret()): string {
  return `${userId.toLowerCase()}.${signature(userId, secret)}`;
}

/** L'identifiant du compte que le jeton désigne, ou null s'il n'est pas authentique. */
export function verifierJetonDeDesinscription(
  jeton: string | null | undefined,
  secret: string = authSecret(),
): string | null {
  if (!jeton || jeton.length > 200) return null;
  const [userId, sig, ...reste] = jeton.trim().split(".");
  if (!userId || !sig || reste.length > 0 || !UUID.test(userId)) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(signature(userId, secret));
  return a.length === b.length && timingSafeEqual(a, b) ? userId.toLowerCase() : null;
}

/**
 * LE LIEN À METTRE DANS TOUT E-MAIL DE NOUVEAUTÉS, en clair dans le corps : il ouvre la
 * page /nouveautes/desinscription, qui retire l'accord d'un clic et le confirme.
 */
export function lienDeDesinscription(user: { id: string }, origine: string = SITE_URL): string {
  return `${origine}/nouveautes/desinscription?jeton=${encodeURIComponent(jetonDeDesinscription(user.id))}`;
}

/**
 * L'adresse de l'en-tête `List-Unsubscribe` : la messagerie y POSTE
 * « List-Unsubscribe=One-Click » (RFC 8058), sans ouvrir de page. Ouverte dans un
 * navigateur, elle renvoie vers la page de confirmation.
 */
export function adresseDeDesinscriptionEnUnClic(user: { id: string }, origine: string = SITE_URL): string {
  return `${origine}/api/nouveautes/desinscription?jeton=${encodeURIComponent(jetonDeDesinscription(user.id))}`;
}

export type ResultatDeDesinscription =
  | { etat: "invalide" }
  | { etat: "desinscrit"; le: Date }
  | { etat: "deja"; le: Date }
  | { etat: "jamais" };

/**
 * Retire l'accord du compte que le jeton désigne. Rejouer le même lien ne fait rien de plus
 * et le dit (« déjà désinscrit depuis le … ») ; un jeton faux ou d'un compte supprimé est
 * « invalide », sans dire lequel des deux.
 */
export async function desinscrireParJeton(
  jeton: string | null | undefined,
  maintenant: Date = new Date(),
): Promise<ResultatDeDesinscription> {
  const userId = verifierJetonDeDesinscription(jeton);
  if (!userId) return { etat: "invalide" };
  const c = await colonnes(userId);
  if (!c) return { etat: "invalide" };
  const etat = etatDuConsentement(c);
  if (etat.consent) {
    await enregistrerConsentement(userId, false, maintenant);
    return { etat: "desinscrit", le: maintenant };
  }
  if (etat.retraitLe) return { etat: "deja", le: etat.retraitLe };
  return { etat: "jamais" };
}

/* ---------------------------------------------------------------------------
 * L'E-MAIL DE NOUVEAUTÉS.
 * ------------------------------------------------------------------------- */

export interface DestinataireDeNouveautes extends ColonnesDuConsentement {
  id: string;
  email: string;
  /** Le courriel transmis par LTI ou RENATER, pour un compte à l'adresse technique. */
  courrielTransmis?: string | null;
  /** Un compte désactivé par l'administration ne reçoit pas de nouveautés. */
  desactiveLe?: Date | null;
}

/**
 * L'unique façon de construire un e-mail de nouveautés : null si le destinataire ne consent
 * pas, n'a pas d'adresse ou a été désactivé ; sinon le message, avec en pied le lien de désinscription en
 * clair et l'en-tête `List-Unsubscribe` (lib/courriel.ts). À passer à `envoyerCourriel`.
 */
export function courrielDeNouveautes(
  destinataire: DestinataireDeNouveautes,
  contenu: { sujet: string; texte: string },
  origine: string = SITE_URL,
): Courriel | null {
  if (!etatDuConsentement(destinataire).consent || destinataire.desactiveLe) return null;
  const a = adresseDeContact(destinataire.email, destinataire.courrielTransmis ?? null);
  if (!a) return null;
  return {
    a,
    sujet: contenu.sujet,
    texte: [
      contenu.texte.trimEnd(),
      "",
      "--",
      "Vous recevez ce message parce que vous avez accepté les nouveautés de Business Arena (au plus une fois par mois).",
      `Se désinscrire en un clic : ${lienDeDesinscription(destinataire, origine)}`,
    ].join("\n"),
    desinscription: adresseDeDesinscriptionEnUnClic(destinataire, origine),
  };
}
