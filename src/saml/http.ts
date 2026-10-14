import { NextResponse } from "next/server";

/**
 * LES RÉPONSES COMMUNES DES ROUTES /api/saml/*.
 *
 * Sans configuration, les routes répondent 503 : la connexion par l'établissement
 * n'existe pas encore pour ce site (le bouton n'apparaît nulle part). Un refus mène à
 * une page du site, sobre, qui ne dit jamais le motif technique (il est au journal).
 */

export function reponseIndisponible(): Response {
  return new Response("La connexion par l'établissement n'est pas encore disponible sur ce site.", {
    status: 503,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "retry-after": "86400" },
  });
}

export type MotifDeRefus = "verification" | "inconnu" | "plafond" | "indisponible";

export function versLeRefus(origine: string, motif: MotifDeRefus, statut: 302 | 303 = 303): NextResponse {
  return NextResponse.redirect(new URL(`/etablissement/refus?motif=${motif}`, origine), statut);
}
