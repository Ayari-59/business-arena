import { NextResponse, type NextRequest } from "next/server";
import { CSP_HEADER_NAME, contentSecurityPolicy } from "@/config/security-headers";

/**
 * La CSP à nonce. Un nonce imprévisible est tiré à chaque requête ; Next
 * l'appose sur les scripts qu'il engendre (il le lit dans l'en-tête CSP de la
 * requête), et le layout sur les siens (via l'en-tête `x-nonce`). C'est ce qui
 * permet de retirer 'unsafe-inline' des scripts sans casser le rendu.
 *
 * Conséquence assumée : lire le nonce rend les pages dynamiques (un nonce figé
 * n'aurait aucune valeur). Le compromis a été retenu sciemment : la protection
 * anti-injection prime le cache statique sur ce site.
 *
 * Anciennement « middleware.ts » : Next 16 a renommé la convention en « proxy ».
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);

  // Next lit le nonce dans l'en-tête CSP de la requête ; le layout le lit dans
  // « x-nonce ». Les deux voyagent donc côté requête, puis la CSP est posée sur
  // la réponse pour le navigateur.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(CSP_HEADER_NAME, csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CSP_HEADER_NAME, csp);
  return response;
}

export const config = {
  matcher: [
    {
      /*
       * Toutes les routes sauf : les routes API, les fichiers statiques et
       * images optimisées de Next, le service worker et le manifeste (servis à
       * part, sans script). On ignore aussi les préchargements de <Link> : leur
       * réponse n'est pas un document, inutile d'y poser la CSP.
       */
      source: "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
