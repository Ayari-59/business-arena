import { headers } from "next/headers";

/**
 * L'ADRESSE DU SITE TELLE QUE LE NAVIGATEUR L'A DEMANDÉE.
 *
 * Un lien à copier pour la classe doit ouvrir le site qu'on regarde : la production
 * derrière son domaine, une préversion, ou le serveur local d'une recette. Lue des
 * en-têtes de la requête, comme la vue de l'animateur le faisait déjà.
 */
export async function origineDeLaRequete(): Promise<string> {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const local = /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(hote);
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${hote}`;
}

/** Le lien d'invitation d'une cohorte, à partir de l'adresse du site. */
export const lienDInvitation = (origine: string, code: string): string =>
  `${origine}/entreprises/episode/rejoindre?code=${encodeURIComponent(code)}`;
