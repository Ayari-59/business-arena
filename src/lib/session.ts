import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Session enseignant : cookie signé HMAC `userId.role.signature`.
 * (Les joueurs de démo utilisent le cookie invité de lib/guest.ts ; un élève
 * qui rejoint une partie par code reste un invité — ADR-08, SSO plus tard.)
 */

const COOKIE = "ba_session";
export type SessionRole = "teacher";

function secret(): string {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 32);
}

export async function setSession(userId: string, role: SessionRole): Promise<void> {
  const store = await cookies();
  const payload = `${userId}.${role}`;
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getSession(): Promise<{ userId: string; role: SessionRole } | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const [userId, role, signature] = raw.split(".");
  if (!userId || role !== "teacher" || !signature) return null;
  const expected = sign(`${userId}.${role}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { userId, role };
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
