import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_INVITE, optionsCookieInvite } from "@/lib/cookie-invite";
import { cheminDemande, ENTETE_CHEMIN_DEMANDE } from "@/lib/connexion-enseignant";
import { CSP_HEADER_NAME, cspANonce, sousNonce } from "@/config/security-headers";

/**
 * UNE BARRE OBLIQUE INVERSE DANS L'ADRESSE (« \ », encodée %5C).
 *
 * Constaté en production (audit d'octobre 2026) : `/tarifs%5C` répondait 500, Next
 * cherchant un module `pages/tarifs%5C.js` qui n'existe pas, et le journal d'erreurs
 * s'en remplissait. Un navigateur change de lui-même un « \ » tapé en « / » ; ces
 * adresses viennent d'un copier-coller ou d'un robot.
 *   · en fin d'adresse, on retire les « \ » et on redirige (308) vers la page ;
 *   · ailleurs, aucune page du site n'en contient : on répond 404.
 */
const BARRE_INVERSE = /%5c|\\/i;
const BARRES_INVERSES_FINALES = /(?:%5c|\\)+$/i;

function barreInverse(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!BARRE_INVERSE.test(pathname)) return null;
  const sans = pathname.replace(BARRES_INVERSES_FINALES, "");
  if (!BARRE_INVERSE.test(sans)) {
    const cible = request.nextUrl.clone();
    cible.pathname = sans || "/";
    return NextResponse.redirect(cible, 308);
  }
  return new NextResponse("Page introuvable", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

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
/** Les pages où le cookie invité se prolonge : les entrées du matcher à cookie. */
const PAGES_DE_JEU = /^\/(?:jouer|profile|reprendre|arena(?:\/.*)?)?\/?$/;

export function proxy(request: NextRequest) {
  const refus = barreInverse(request);
  if (refus) return refus;

  const { pathname } = request.nextUrl;
  const entetes = new Headers(request.headers);
  let modifiees = false;

  // L'ESPACE ENSEIGNANT : la page demandée est transmise à la page serveur, qui
  // la met dans l'adresse de connexion si la session manque
  // (lib/connexion-enseignant.ts). L'en-tête reçu du client est écrasé.
  if (pathname === "/teacher" || pathname.startsWith("/teacher/")) {
    entetes.set(ENTETE_CHEMIN_DEMANDE, cheminDemande(request.nextUrl));
    modifiees = true;
  }

  // LA CSP À NONCE des zones déjà dynamiques (config/security-headers.ts, audit P2-6).
  // Posée dans la requête, elle fait poser le nonce par Next sur ses propres scripts ;
  // posée dans la réponse, elle s'applique. Un nonce neuf à chaque requête.
  let csp: string | null = null;
  if (sousNonce(pathname)) {
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    csp = cspANonce(nonce);
    entetes.set(CSP_HEADER_NAME, csp);
    modifiees = true;
  }

  const response = modifiees ? NextResponse.next({ request: { headers: entetes } }) : NextResponse.next();
  if (csp) response.headers.set(CSP_HEADER_NAME, csp);
  // Le cookie invité ne se prolonge que sur les pages de jeu (voir `matcher`) : les
  // autres zones passent ici pour la CSP ou le retour après connexion.
  const valeur = PAGES_DE_JEU.test(pathname) ? request.cookies.get(COOKIE_INVITE)?.value : undefined;
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
    // L'espace enseignant, pour le retour après connexion (voir plus haut), et les
    // zones à CSP à nonce (config/security-headers.ts, ZONES_A_NONCE) ; le test
    // csp-a-nonce vérifie que la liste est la même.
    { source: "/teacher/:path*" },
    { source: "/admin/:path*" },
    { source: "/arena/:path*" },
    { source: "/etablissement/:path*" },
    { source: "/org/:path*" },
    { source: "/examen/:path*" },
    { source: "/compete/:path*" },
    { source: "/profile/:path*" },
    // Toute adresse qui contient une barre oblique inverse, encodée ou non.
    { source: "/(.*%5[cC].*)" },
    { source: "/(.*\\\\.*)" },
  ],
};
