import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authSecret } from "@/lib/auth-secret";

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
    displayName: "Joueur invité",
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
