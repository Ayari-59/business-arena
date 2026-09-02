import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Session enseignant : cookie signé HMAC.
 *
 * Constaté (audit croisé §07) : le cookie signait seulement « id.rôle »,
 * sans date ni révocation. La durée de 30 jours ne tenait qu'au navigateur,
 * et rien ne pouvait fermer une session ouverte ailleurs.
 *
 * Le jeton porte maintenant { id, role, v, iat, exp } :
 * - exp : 30 jours, vérifié à chaque lecture, renouvelé en glissant quand il
 *   reste moins de 7 jours ;
 * - v : la version de session du compte ; « Se déconnecter partout »
 *   l'incrémente et tous les cookies antérieurs deviennent invalides.
 * Un cookie de l'ancien format, sans iat ni exp, est refusé : chaque
 * enseignant se reconnecte une fois.
 *
 * (Les joueurs de démo utilisent le cookie invité de lib/guest.ts ; un élève
 * qui rejoint une partie par code reste un invité — ADR-08, SSO plus tard.)
 */

const COOKIE = "ba_session";
export type SessionRole = "teacher";

export const DUREE_SESSION_MS = 30 * 24 * 60 * 60 * 1000;
export const SEUIL_RENOUVELLEMENT_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionPayload {
  id: string;
  role: SessionRole;
  /** Version de session du compte au moment de la connexion. */
  v: number;
  /** Émis à (ms epoch). */
  iat: number;
  /** Expire à (ms epoch). */
  exp: number;
}

function secret(): string {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

function sign(payload: string, cle: string): string {
  return createHmac("sha256", cle).update(payload).digest("hex").slice(0, 32);
}

/** Jeton = base64url(JSON) . signature. Pur, testable sans cookie. */
export function encodeToken(payload: SessionPayload, cle: string = secret()): string {
  const corps = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${corps}.${sign(corps, cle)}`;
}

/**
 * Relit un jeton : signature, forme, expiration. Rend null pour tout ce qui
 * n'est pas un jeton complet et valide à l'instant `now`, ancien format
 * compris.
 */
export function decodeToken(
  token: string | undefined | null,
  now: number = Date.now(),
  cle: string = secret(),
): SessionPayload | null {
  if (!token) return null;
  const parties = token.split(".");
  if (parties.length !== 2) return null;
  const [corps, signature] = parties as [string, string];
  const attendue = sign(corps, cle);
  const a = Buffer.from(signature);
  const b = Buffer.from(attendue);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let p: unknown;
  try {
    p = JSON.parse(Buffer.from(corps, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  if (typeof o.id !== "string" || o.role !== "teacher") return null;
  if (typeof o.v !== "number" || typeof o.iat !== "number" || typeof o.exp !== "number") return null;
  if (o.exp <= now) return null;
  return { id: o.id, role: "teacher", v: o.v, iat: o.iat, exp: o.exp };
}

export async function setSession(
  userId: string,
  role: SessionRole,
  sessionVersion: number = 1,
): Promise<void> {
  const store = await cookies();
  const now = Date.now();
  store.set(COOKIE, encodeToken({ id: userId, role, v: sessionVersion, iat: now, exp: now + DUREE_SESSION_MS }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DUREE_SESSION_MS / 1000,
    path: "/",
  });
}

/** La version de session courante du compte ; null si le compte n'existe plus. */
export async function sessionVersionOf(userId: string): Promise<number | null> {
  const row = (
    await db.select({ v: users.sessionVersion }).from(users).where(eq(users.id, userId))
  )[0];
  return row ? row.v : null;
}

export async function getSession(): Promise<{ userId: string; role: SessionRole } | null> {
  const store = await cookies();
  const now = Date.now();
  const p = decodeToken(store.get(COOKIE)?.value, now);
  if (!p) return null;
  // Révocation : un jeton d'une version antérieure est refusé, même valide.
  const version = await sessionVersionOf(p.id);
  if (version === null || version !== p.v) return null;
  // Renouvellement glissant : possible seulement là où un cookie peut être
  // posé (action serveur, route) ; ailleurs, la lecture reste valable.
  if (p.exp - now < SEUIL_RENOUVELLEMENT_MS) {
    try {
      await setSession(p.id, p.role, p.v);
    } catch {
      /* rendu d'un composant serveur : pas d'écriture de cookie ici */
    }
  }
  return { userId: p.id, role: p.role };
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
