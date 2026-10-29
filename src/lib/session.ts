import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authSecret } from "@/lib/auth-secret";
import { cleDerivee } from "@/lib/cles";

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

/**
 * LA DURÉE MAXIMALE ABSOLUE D'UNE SESSION (audit d'octobre 2026, P2-8).
 *
 * Le renouvellement glissant prolongeait une session sans fin : un poste qui revient
 * chaque semaine restait connecté pour toujours. Le jeton porte maintenant l'heure de la
 * CONNEXION (`auth`), reportée telle quelle à chaque renouvellement, et la session est
 * refusée quand elle a plus de 90 jours, renouvelée ou non. L'enseignant se reconnecte
 * alors une fois.
 */
export const DUREE_MAXIMALE_SESSION_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * LA FIN DE LA TRANSITION VERS LA CLÉ DÉRIVÉE (audit d'octobre 2026, P2-7).
 *
 * Les jetons sont signés d'une clé propre à la session (lib/cles.ts). Ceux émis avant ce
 * changement l'étaient avec AUTH_SECRET lui-même : on les relit encore, pour ne
 * déconnecter personne, s'ils ont été émis avant cette date. Le premier renouvellement
 * glissant les réémet sous la nouvelle clé, et un jeton dure 30 jours : passé cette
 * date, aucun jeton légitime de l'ancien schéma ne peut plus exister, et la branche
 * pourra être retirée.
 */
export const FIN_DES_JETONS_SANS_CLE_DERIVEE = Date.UTC(2026, 11, 31);

export interface SessionPayload {
  id: string;
  role: SessionRole;
  /** Version de session du compte au moment de la connexion. */
  v: number;
  /** Émis à (ms epoch). */
  iat: number;
  /** Expire à (ms epoch). */
  exp: number;
  /**
   * Heure de la connexion (ms epoch), gardée à chaque renouvellement : c'est d'elle que
   * compte la durée maximale. Absente d'un jeton d'avant, elle vaut son iat.
   */
  auth: number;
}

function secret(): string {
  return authSecret();
}

/** `cle` est la racine (AUTH_SECRET) ; la signature emploie la clé dérivée de la session. */
function sign(payload: string, cle: string): string {
  return signAvec(payload, cleDerivee("session", cle));
}

function signAvec(payload: string, cle: string): string {
  return createHmac("sha256", cle).update(payload).digest("hex").slice(0, 32);
}

/** Jeton = base64url(JSON) . signature. Pur, testable sans cookie. */
export function encodeToken(
  payload: Omit<SessionPayload, "auth"> & { auth?: number },
  cle: string = secret(),
): string {
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
  const egale = (attendue: string) => {
    const a = Buffer.from(signature);
    const b = Buffer.from(attendue);
    return a.length === b.length && timingSafeEqual(a, b);
  };
  const cleDeSession = egale(sign(corps, cle));
  // L'ancien schéma, signé d'AUTH_SECRET lui-même : relu pendant la transition seulement.
  if (!cleDeSession && !egale(signAvec(corps, cle))) return null;
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
  if (!cleDeSession && o.iat >= FIN_DES_JETONS_SANS_CLE_DERIVEE) return null;
  if (o.auth !== undefined && typeof o.auth !== "number") return null;
  const auth = typeof o.auth === "number" ? o.auth : o.iat;
  if (now - auth > DUREE_MAXIMALE_SESSION_MS) return null;
  return { id: o.id, role: "teacher", v: o.v, iat: o.iat, exp: o.exp, auth };
}

export async function setSession(
  userId: string,
  role: SessionRole,
  sessionVersion: number = 1,
  /** L'heure de la connexion, reportée par un renouvellement ; maintenant sinon. */
  connexion?: number,
): Promise<void> {
  const store = await cookies();
  const now = Date.now();
  const auth = connexion ?? now;
  // Le jeton n'expire jamais après la durée maximale comptée depuis la connexion.
  const exp = Math.min(now + DUREE_SESSION_MS, auth + DUREE_MAXIMALE_SESSION_MS);
  store.set(COOKIE, encodeToken({ id: userId, role, v: sessionVersion, iat: now, exp, auth }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.max(0, Math.floor((exp - now) / 1000)),
    path: "/",
  });
}

/**
 * La version de session courante du compte ; null si le compte n'existe plus, ou s'il a
 * été DÉSACTIVÉ par l'administration (/admin/inscrits) : sa session est alors refusée à
 * chaque lecture, quelle que soit la façon dont elle a été ouverte (mot de passe, LTI,
 * RENATER). La désactivation fait aussi avancer la version : les deux gardes se tiennent.
 */
export async function sessionVersionOf(userId: string): Promise<number | null> {
  const row = (
    await db
      .select({ v: users.sessionVersion, desactiveLe: users.desactiveLe })
      .from(users)
      .where(eq(users.id, userId))
  )[0];
  return row && row.desactiveLe === null ? row.v : null;
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
      await setSession(p.id, p.role, p.v, p.auth);
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
