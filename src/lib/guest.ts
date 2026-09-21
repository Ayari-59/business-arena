import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authSecret } from "@/lib/auth-secret";
import { NOM_INVITE_PAR_DEFAUT, pseudoAffichable } from "@/config/invite";

/**
 * Identité invitée (v0.1, étape 6) : un visiteur reçoit un identifiant signé en
 * cookie et un compte `users` minimal, ce qui préserve l'intégrité du schéma
 * (games.created_by, players…) sans écran de connexion. L'authentification
 * complète (ADR-08) arrive à l'étape 7 avec l'interface enseignant.
 */

const COOKIE = "ba_guest";

function secret(): string {
  return authSecret();
}

function sign(id: string): string {
  return createHmac("sha256", secret()).update(id).digest("hex").slice(0, 32);
}

function verify(value: string): string | null {
  const [id, signature] = value.split(".");
  if (!id || !signature) return null;
  const expected = sign(id);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

/** Renvoie l'id utilisateur invité courant, en le créant au besoin. */
export async function getOrCreateGuestUserId(): Promise<string> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  const existing = raw ? verify(raw) : null;
  if (existing) {
    const found = await db.select({ id: users.id }).from(users).where(eq(users.id, existing));
    if (found.length > 0) return existing;
  }
  const id = randomUUID();
  await db.insert(users).values({
    id,
    email: `guest-${id}@guest.business-arena.local`,
    displayName: NOM_INVITE_PAR_DEFAUT,
  });
  store.set(COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}

/** Id utilisateur courant sans création (null si aucun cookie valide). */
export async function getGuestUserId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  return raw ? verify(raw) : null;
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
