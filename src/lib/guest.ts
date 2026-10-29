import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authSecret } from "@/lib/auth-secret";
import { cleDerivee } from "@/lib/cles";
import { NOM_INVITE_PAR_DEFAUT, pseudoAffichable } from "@/config/invite";
import { COOKIE_INVITE, optionsCookieInvite } from "@/lib/cookie-invite";

/**
 * Identité invitée (v0.1, étape 6) : un visiteur reçoit un identifiant signé en
 * cookie et un compte `users` minimal, ce qui préserve l'intégrité du schéma
 * (games.created_by, players…) sans écran de connexion. L'authentification
 * complète (ADR-08) arrive à l'étape 7 avec l'interface enseignant.
 */

const COOKIE = COOKIE_INVITE;

/** Une signature HMAC tronquée, la clé donnée. */
const hmac = (id: string, cle: string) => createHmac("sha256", cle).update(id).digest("hex").slice(0, 32);

const egales = (x: string, y: string) => {
  const a = Buffer.from(x);
  const b = Buffer.from(y);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * La valeur du cookie : « id.signature », signée de la clé dérivée de l'invité
 * (lib/cles.ts, audit d'octobre 2026, P2-7). `racine` est AUTH_SECRET ; pure, testable.
 */
export function signerInvite(id: string, racine: string = authSecret()): string {
  return `${id}.${hmac(id, cleDerivee("invite", racine))}`;
}

/**
 * L'id que porte la valeur, ou null. `ancien` : signée d'AUTH_SECRET lui-même (avant la
 * clé dérivée). On la relit encore, sans date limite : le cookie dure un an et il est la
 * seule mémoire des parties solo ; on la réémet sous la nouvelle clé dès qu'on le peut.
 */
export function lireInvite(value: string, racine: string = authSecret()): { id: string; ancien: boolean } | null {
  const [id, signature, ...reste] = value.split(".");
  if (!id || !signature || reste.length > 0) return null;
  if (egales(signature, hmac(id, cleDerivee("invite", racine)))) return { id, ancien: false };
  if (egales(signature, hmac(id, racine))) return { id, ancien: true };
  return null;
}

function verify(value: string): string | null {
  return lireInvite(value)?.id ?? null;
}

/** Réémet sous la nouvelle clé un cookie de l'ancien schéma, là où un cookie peut s'écrire. */
async function reemettreSiAncien(store: Awaited<ReturnType<typeof cookies>>, raw: string): Promise<void> {
  const lu = lireInvite(raw);
  if (!lu?.ancien) return;
  try {
    store.set(COOKIE, signerInvite(lu.id), optionsCookieInvite());
  } catch {
    /* rendu d'un composant serveur : le cookie se réémettra à la prochaine action */
  }
}

/** Renvoie l'id utilisateur invité courant, en le créant au besoin. */
export async function getOrCreateGuestUserId(): Promise<string> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  const existing = raw ? verify(raw) : null;
  if (existing) {
    const found = await db.select({ id: users.id }).from(users).where(eq(users.id, existing));
    if (found.length > 0) {
      await reemettreSiAncien(store, raw!);
      return existing;
    }
  }
  const id = randomUUID();
  await db.insert(users).values({
    id,
    email: `guest-${id}@guest.business-arena.local`,
    displayName: NOM_INVITE_PAR_DEFAUT,
  });
  store.set(COOKIE, signerInvite(id), optionsCookieInvite());
  return id;
}

/** Id utilisateur courant sans création (null si aucun cookie valide). */
export async function getGuestUserId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  return raw ? verify(raw) : null;
}

/**
 * DONNER À CET APPAREIL UNE IDENTITÉ QUI EXISTE DÉJÀ.
 *
 * Un élève de concours qui change de poste, vide ses cookies ou passe au
 * téléphone n'est plus reconnu : le cookie invité est la seule mémoire de qui
 * il est. Son code de reprise le rend à lui-même, et c'est ici que l'appareil
 * reçoit son identité retrouvée plutôt qu'une nouvelle.
 *
 * La fonction ne vérifie RIEN : l'appelant doit avoir établi que ce joueur est
 * bien celui qui demande. Aujourd'hui, seul le service de concours l'appelle,
 * après avoir reconnu un code de reprise.
 */
export async function setGuestCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, signerInvite(userId), optionsCookieInvite());
}

/**
 * LIBÉRER L'APPAREIL.
 *
 * Le cookie invité dure un an. En salle informatique, le poste passe d'une
 * classe à l'autre : sans ce geste, le deuxième élève retrouve le cookie du
 * premier, `joinGameByCode` écrase son prénom et les deux ne font plus qu'un
 * seul joueur — une équipe, un jeu de décisions, un historique de situations,
 * et un nom perdu au carnet de l'enseignant. L'effacement rend l'appareil
 * neutre ; l'élève suivant reçoit sa propre identité à son entrée par code.
 *
 * Rien n'est supprimé en base : les décisions déjà prises appartiennent à
 * l'équipe, pas à l'appareil, et l'élève qui revient avec le même code les
 * retrouve (l'enseignant le remet dans son équipe si le hasard l'a rangé
 * ailleurs).
 */
export async function clearGuestCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/**
 * Le prénom porté par l'appareil, ou null s'il n'en porte pas encore.
 *
 * Sert à avertir AVANT la saisie : « cet appareil est à Léa ». Après, il est
 * trop tard — le pseudo est déjà écrasé.
 */
export async function getGuestDisplayName(): Promise<string | null> {
  const id = await getGuestUserId();
  if (!id) return null;
  const found = await db
    .select({ nom: users.displayName })
    .from(users)
    .where(eq(users.id, id));
  // Le nom par défaut n'apprend rien : c'est celui d'un visiteur qui n'a
  // encore rejoint aucune partie. L'annoncer ferait un avertissement de plus
  // sans un seul cas d'usage.
  return pseudoAffichable(found[0]?.nom);
}
