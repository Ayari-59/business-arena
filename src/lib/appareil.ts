import { headers } from "next/headers";

/**
 * Ce qui tient le site : un téléphone, ou autre chose.
 *
 * Un tiroir replié par défaut sur téléphone et ouvert ailleurs ne peut pas se
 * décider avec une requête de média : l'attribut `open` d'un <details> est posé
 * par le rendu, et le serveur le pose avant de connaître la largeur de l'écran.
 * Poser la valeur par défaut au montage ferait sauter la page sous les yeux de
 * celui qu'on veut épargner. On regarde donc ce que la requête dit de
 * l'appareil, à l'endroit même où le serveur écrit la page.
 *
 * L'indice des navigateurs récents (`Sec-CH-UA-Mobile`) ne demande aucun
 * consentement ; Safari ne l'envoie pas, d'où le repli sur l'agent utilisateur.
 * Une tablette se déclare comme un ordinateur, et reçoit l'affichage large : le
 * défaut d'un tiroir n'y coûte que quelques lignes de défilement.
 */
const AGENT_DE_TELEPHONE =
  /iPhone|iPod|Android.+Mobile|Windows Phone|Mobile.+Firefox|webOS|BlackBerry/i;

export function detecterTelephone(entetes: {
  get(nom: string): string | null;
}): boolean {
  const indice = entetes.get("sec-ch-ua-mobile");
  if (indice) return indice.trim() === "?1";
  return AGENT_DE_TELEPHONE.test(entetes.get("user-agent") ?? "");
}

/** À appeler depuis un composant serveur rendu à la demande (pas prérendu). */
export async function estUnTelephone(): Promise<boolean> {
  return detecterTelephone(await headers());
}
