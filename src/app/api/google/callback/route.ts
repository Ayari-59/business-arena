import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { requirePlatformAdmin } from "@/services/admin.service";
import { terminerConnexionAgenda } from "@/services/agenda-google.service";
import { adresseDeRetour, COOKIE_ETAT } from "../oauth";

/**
 * Le retour de Google après consentement. L'état doit être celui posé au
 * départ (sinon n'importe quel lien pourrait faire adopter un autre compte),
 * et la session doit toujours être celle d'un administrateur.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/teacher/login", request.url));
  try {
    await requirePlatformAdmin(session.userId);
  } catch {
    return NextResponse.redirect(new URL("/teacher", request.url));
  }
  const url = new URL(request.url);
  const retour = (resultat: string) => {
    const r = NextResponse.redirect(new URL(`/admin?agenda=${resultat}#agenda-google`, request.url));
    r.cookies.set(COOKIE_ETAT, "", { path: "/api/google", maxAge: 0 });
    return r;
  };
  const attendu = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${COOKIE_ETAT}=([^;]+)`))?.[1];
  const state = url.searchParams.get("state");
  if (!attendu || !state || attendu !== state) return retour("etat_invalide");
  if (url.searchParams.get("error")) return retour("refuse");
  const code = url.searchParams.get("code");
  if (!code) return retour("refuse");
  const r = await terminerConnexionAgenda(code, adresseDeRetour(request), session.userId);
  if ("error" in r) {
    console.error(`[agenda] connexion échouée : ${r.error}`);
    return retour(r.error === "jeton_absent" ? "jeton_absent" : "echec");
  }
  console.info(`[agenda] agenda Google connecté (${r.compte})`);
  return retour("connecte");
}
