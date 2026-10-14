import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_INVITE, optionsCookieInvite } from "@/lib/cookie-invite";

/**
 * LE COOKIE INVITÉ SE RENOUVELLE À CHAQUE VISITE.
 *
 * Il est la seule mémoire de qui est le joueur : sans lui, ses parties solo
 * deviennent introuvables. Il durait un an à compter de sa CRÉATION, donc un
 * joueur régulier le voyait expirer pile quand il revenait. Chaque passage sur
 * une page de jeu le prolonge d'un an à partir de maintenant.
 *
 * Le proxy ne vérifie ni ne change la valeur : il la renvoie telle quelle avec
 * une nouvelle durée. Une valeur falsifiée reste refusée par `verify` au
 * rendu, exactement comme avant.
 *
 * Il ne tourne que sur les pages où l'on joue ou reprend (voir `matcher`), et
 * seulement si le cookie est là : l'accueil statique reste servi du cache pour
 * les visiteurs sans cookie, robots compris.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const valeur = request.cookies.get(COOKIE_INVITE)?.value;
  if (valeur) response.cookies.set(COOKIE_INVITE, valeur, optionsCookieInvite());
  return response;
}

// Le matcher doit être un littéral : Next l'analyse à la compilation, sans exécuter le fichier.
export const config = {
  matcher: [
    { source: "/", has: [{ type: "cookie", key: "ba_guest" }] },
    { source: "/jouer", has: [{ type: "cookie", key: "ba_guest" }] },
    { source: "/profile", has: [{ type: "cookie", key: "ba_guest" }] },
    { source: "/reprendre", has: [{ type: "cookie", key: "ba_guest" }] },
    { source: "/arena/:path*", has: [{ type: "cookie", key: "ba_guest" }] },
  ],
};
