import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { authSecret } from "@/lib/auth-secret";
import type { RoleLti } from "./constantes";

/**
 * LE CONTEXTE DU DERNIER LANCEMENT, en cookie signé (HMAC, la clé des sessions).
 *
 * Il dit qui a été lancé, depuis quelle plateforme, dans quel rôle et pour quelle
 * activité. Les écrans LTI (configuration de l'activité, attente de l'élève) le lisent
 * pour savoir de quelle activité il s'agit : l'adresse ne porte aucun identifiant qu'on
 * pourrait changer à la main. Quatre heures : la durée d'une séance.
 */

export const COOKIE_CONTEXTE = "ba_lti";
export const DUREE_CONTEXTE_S = 4 * 60 * 60;

export interface ContexteLti {
  /** Le compte lancé. */
  u: string;
  /** La plateforme. */
  p: string;
  r: RoleLti;
  /** L'activité (lti_liens.id), absente pour une sélection de contenu. */
  l: string | null;
  /** Expiration, en millisecondes. */
  exp: number;
}

const signer = (corps: string, cle: string) =>
  createHmac("sha256", `lti-contexte:${cle}`).update(corps).digest("base64url");

export function encoderContexte(c: ContexteLti, cle: string = authSecret()): string {
  const corps = Buffer.from(JSON.stringify(c), "utf8").toString("base64url");
  return `${corps}.${signer(corps, cle)}`;
}

export function decoderContexte(
  valeur: string | undefined | null,
  now: number = Date.now(),
  cle: string = authSecret(),
): ContexteLti | null {
  if (!valeur) return null;
  const [corps, signature] = valeur.split(".");
  if (!corps || !signature) return null;
  const a = Buffer.from(signature);
  const b = Buffer.from(signer(corps, cle));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const o = JSON.parse(Buffer.from(corps, "base64url").toString("utf8")) as Record<string, unknown>;
    if (typeof o.u !== "string" || typeof o.p !== "string" || typeof o.exp !== "number") return null;
    if (o.r !== "enseignant" && o.r !== "eleve") return null;
    if (o.exp <= now) return null;
    return { u: o.u, p: o.p, r: o.r, l: typeof o.l === "string" ? o.l : null, exp: o.exp };
  } catch {
    return null;
  }
}

export async function poserContexte(c: Omit<ContexteLti, "exp">): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_CONTEXTE, encoderContexte({ ...c, exp: Date.now() + DUREE_CONTEXTE_S * 1000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DUREE_CONTEXTE_S,
    path: "/",
  });
}

export async function lireContexte(): Promise<ContexteLti | null> {
  const store = await cookies();
  return decoderContexte(store.get(COOKIE_CONTEXTE)?.value);
}
