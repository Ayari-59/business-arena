import { desinscrireParJeton } from "@/services/nouveautes.service";

/**
 * LA DÉSINSCRIPTION DEPUIS LA MESSAGERIE (RFC 8058). L'en-tête `List-Unsubscribe` d'un
 * e-mail de nouveautés pointe ici (`adresseDeDesinscriptionEnUnClic`) ; le bouton
 * « Se désabonner » de Gmail, Outlook ou Apple Mail y POSTE
 * « List-Unsubscribe=One-Click », sans cookie ni page. Ouverte dans un navigateur (une
 * messagerie qui ne sait pas poster), l'adresse renvoie vers la page de confirmation.
 */
const jetonDe = (request: Request) => new URL(request.url).searchParams.get("jeton");

export async function POST(request: Request) {
  const r = await desinscrireParJeton(jetonDe(request));
  if (r.etat === "invalide") return new Response("Lien de désinscription invalide.", { status: 400 });
  return new Response("Désinscription enregistrée.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(request: Request) {
  const jeton = jetonDe(request) ?? "";
  const cible = new URL(`/nouveautes/desinscription?jeton=${encodeURIComponent(jeton)}`, request.url);
  return Response.redirect(cible, 303);
}
