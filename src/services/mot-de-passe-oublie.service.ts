import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { jetonsDeReinitialisation, loginAttempts, users } from "@/db/schema";
import { SITE_URL } from "@/config/site";
import {
  DUREE_DU_JETON_DE_REINITIALISATION_MS,
  DUREE_DU_JETON_DITE,
} from "@/config/mot-de-passe-oublie";
import { FENETRE_PAR_DESTINATAIRE_MS, PLAFOND_PAR_DESTINATAIRE_PAR_JOUR } from "@/config/plafonds-des-formulaires";
import { envoyerCourriel } from "@/lib/courriel";
import { COUT_BCRYPT, LONGUEUR_MINIMALE_DU_MOT_DE_PASSE, MOT_DE_PASSE_TROP_COURT } from "@/services/auth.service";

/**
 * LE MOT DE PASSE OUBLIÉ DES ENSEIGNANTS (migration 0054).
 *
 *  · La DEMANDE ne dit jamais si le compte existe : la page répond toujours le même
 *    message (config/mot-de-passe-oublie.ts), et l'action fait le travail après la réponse
 *    (`after`), pour qu'un envoi réel ne se lise pas dans le temps de réponse.
 *  · Le JETON est tiré au hasard (32 octets), envoyé une fois par courriel, et seule son
 *    empreinte SHA-256 est gardée. Il vaut `DUREE_DU_JETON_DE_REINITIALISATION_MS` et sert
 *    une seule fois : la consommation est une seule mise à jour conditionnelle, deux
 *    onglets ne peuvent pas s'en servir tous les deux.
 *  · La RÉINITIALISATION impose la règle des mots de passe de l'inscription, invalide tous
 *    les jetons du compte, efface ses échecs de connexion et fait avancer sa version de
 *    session : toute session ouverte ailleurs (cookie signé pour l'ancienne version) est
 *    refusée — le même mécanisme que « Se déconnecter partout ».
 *  · Les comptes sans mot de passe (RENATER, LTI) et les comptes désactivés ne reçoivent
 *    rien : il n'y a pas de mot de passe à leur rendre.
 *  · Plafonds : par adresse d'origine dans l'action (`garderLesTentatives`) ; par
 *    destinataire ici, `PLAFOND_PAR_DESTINATAIRE_PAR_JOUR` jetons par 24 heures, en silence.
 */

const empreinteDe = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

export function lienDeReinitialisation(jeton: string, origine: string = SITE_URL): string {
  return `${origine}/teacher/reinitialiser?jeton=${encodeURIComponent(jeton)}`;
}

export function courrielDeReinitialisation(lien: string): { sujet: string; texte: string } {
  return {
    sujet: "Réinitialiser votre mot de passe Business Arena",
    texte: [
      "Bonjour,",
      "",
      "Une réinitialisation du mot de passe de votre compte enseignant Business Arena a été demandée.",
      "Pour choisir un nouveau mot de passe, ouvrez ce lien :",
      "",
      lien,
      "",
      `Le lien reste valable ${DUREE_DU_JETON_DITE} et ne sert qu'une fois. Choisir un nouveau mot de`,
      "passe ferme toutes les sessions ouvertes sur vos autres appareils.",
      "",
      "Si vous n'avez rien demandé, ignorez ce message : votre mot de passe ne change pas.",
    ].join("\n"),
  };
}

export type ResultatDeLaDemande =
  | { etat: "envoye" }
  | { etat: "aucun_compte" }
  | { etat: "plafond" }
  | { etat: "non_envoye" };

/** Le travail de la demande. Son résultat ne sort JAMAIS vers la page : il sert aux tests et au journal. */
export async function demanderUneReinitialisation(args: {
  email: string;
  maintenant?: Date;
  envoyer?: typeof envoyerCourriel;
}): Promise<ResultatDeLaDemande> {
  const email = args.email.trim().toLowerCase();
  const maintenant = args.maintenant ?? new Date();
  const envoyer = args.envoyer ?? envoyerCourriel;
  if (!email || email.length > 320) return { etat: "aucun_compte" };

  const compte = (
    await db
      .select({ id: users.id, email: users.email, passwordHash: users.passwordHash, desactiveLe: users.desactiveLe })
      .from(users)
      .where(eq(users.email, email))
  )[0];
  if (!compte?.passwordHash || compte.desactiveLe) return { etat: "aucun_compte" };

  const recents = await db
    .select({ id: jetonsDeReinitialisation.id })
    .from(jetonsDeReinitialisation)
    .where(
      and(
        eq(jetonsDeReinitialisation.userId, compte.id),
        gt(jetonsDeReinitialisation.createdAt, new Date(maintenant.getTime() - FENETRE_PAR_DESTINATAIRE_MS)),
      ),
    );
  if (recents.length >= PLAFOND_PAR_DESTINATAIRE_PAR_JOUR) return { etat: "plafond" };

  const jeton = randomBytes(32).toString("base64url");
  await db.insert(jetonsDeReinitialisation).values({
    userId: compte.id,
    empreinte: empreinteDe(jeton),
    expireLe: new Date(maintenant.getTime() + DUREE_DU_JETON_DE_REINITIALISATION_MS),
    createdAt: maintenant,
  });
  const { sujet, texte } = courrielDeReinitialisation(lienDeReinitialisation(jeton));
  const r = await envoyer({ a: compte.email, sujet, texte });
  if (!r.envoye) {
    console.warn(`[mot-de-passe-oublie] lien non envoyé à ${compte.id} : ${r.raison}`);
    return { etat: "non_envoye" };
  }
  return { etat: "envoye" };
}

const JETON_PLAUSIBLE = /^[A-Za-z0-9_-]{20,100}$/;

/** Le jeton est-il encore utilisable (existant, non utilisé, non expiré) ? Ne le consomme pas. */
export async function jetonUtilisable(jeton: string | null | undefined, maintenant: Date = new Date()): Promise<boolean> {
  if (!jeton || !JETON_PLAUSIBLE.test(jeton)) return false;
  const r = await db
    .select({ id: jetonsDeReinitialisation.id })
    .from(jetonsDeReinitialisation)
    .where(
      and(
        eq(jetonsDeReinitialisation.empreinte, empreinteDe(jeton)),
        isNull(jetonsDeReinitialisation.utiliseLe),
        gt(jetonsDeReinitialisation.expireLe, maintenant),
      ),
    );
  return r.length > 0;
}

export const LIEN_INVALIDE =
  "Ce lien n'est plus valable : il a expiré, a déjà servi ou a été mal recopié. Demandez-en un nouveau.";

export type ResultatDeReinitialisation = { ok: true; userId: string } | { ok: false; erreur: string; champ?: "password" };

export async function reinitialiserLeMotDePasse(args: {
  jeton: string;
  motDePasse: string;
  maintenant?: Date;
}): Promise<ResultatDeReinitialisation> {
  const maintenant = args.maintenant ?? new Date();
  // La règle d'abord : un mot de passe refusé ne consomme pas le lien.
  if (args.motDePasse.length < LONGUEUR_MINIMALE_DU_MOT_DE_PASSE) {
    return { ok: false, erreur: MOT_DE_PASSE_TROP_COURT, champ: "password" };
  }
  if (!JETON_PLAUSIBLE.test(args.jeton)) return { ok: false, erreur: LIEN_INVALIDE };
  // Une seule mise à jour conditionnelle : le premier qui consomme le jeton l'a.
  const pris = await db
    .update(jetonsDeReinitialisation)
    .set({ utiliseLe: maintenant })
    .where(
      and(
        eq(jetonsDeReinitialisation.empreinte, empreinteDe(args.jeton)),
        isNull(jetonsDeReinitialisation.utiliseLe),
        gt(jetonsDeReinitialisation.expireLe, maintenant),
      ),
    )
    .returning({ userId: jetonsDeReinitialisation.userId });
  const userId = pris[0]?.userId;
  if (!userId) return { ok: false, erreur: LIEN_INVALIDE };

  const passwordHash = await bcrypt.hash(args.motDePasse, COUT_BCRYPT);
  const maj = await db
    .update(users)
    .set({ passwordHash, sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(and(eq(users.id, userId), isNull(users.desactiveLe)))
    .returning({ email: users.email });
  if (!maj[0]) return { ok: false, erreur: LIEN_INVALIDE };
  // Les autres liens du compte ne servent plus ; les échecs de connexion repartent de zéro.
  await db.delete(jetonsDeReinitialisation).where(eq(jetonsDeReinitialisation.userId, userId));
  await db.delete(loginAttempts).where(eq(loginAttempts.email, maj[0].email));
  return { ok: true, userId };
}

/** La purge de chaque nuit : les jetons expirés (services/purge.service.ts). */
export async function purgerLesJetonsExpires(maintenant: Date = new Date()): Promise<number> {
  return (
    await db
      .delete(jetonsDeReinitialisation)
      .where(lt(jetonsDeReinitialisation.expireLe, maintenant))
      .returning({ id: jetonsDeReinitialisation.id })
  ).length;
}
