import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { requirePlatformAdmin } from "@/services/admin.service";
import { urlDeConsentement } from "@/services/agenda-google.service";
import { adresseDeRetour, COOKIE_ETAT } from "../oauth";

/**
 * Le clic « Connecter mon agenda » : réservé à l'administrateur, pose un
 * état aléatoire en cookie (pour reconnaître le retour de Google) et envoie
 * vers l'écran de consentement.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/teacher/login", request.url));
  try {
    await requirePlatformAdmin(session.userId);
  } catch {
    return NextResponse.redirect(new URL("/teacher", request.url));
  }
  const state = randomBytes(24).toString("base64url");
  const url = urlDeConsentement(state, adresseDeRetour(request));
  if (!url) return NextResponse.redirect(new URL("/admin?agenda=client_non_configure", request.url));
  const reponse = NextResponse.redirect(url);
  reponse.cookies.set(COOKIE_ETAT, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/google",
    maxAge: 600,
  });
  return reponse;
}
