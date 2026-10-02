/**
 * LES ÉCRANS OÙ L'ON JOUE, par opposition à ceux où l'on découvre le site.
 *
 * Sur un téléphone, on ne tient pas le même rôle des deux côtés. Sur la
 * vitrine on lit, on compare, on peut se laisser proposer d'installer
 * l'application. Dans une partie on décide, au pouce, avec un tour à rendre :
 * rien ne doit passer par-dessus l'écran, et tout ce qui se touche doit se
 * toucher du premier coup.
 *
 * Ce registre est la seule définition. L'invitation à installer s'en sert pour
 * se taire, et l'écran d'arène pose le marqueur `data-ecran-de-jeu`, que la
 * feuille de style lit pour agrandir les textes (voir globals.css).
 */
export const PREFIXES_DES_ECRANS_DE_JEU = ["/arena/", "/compete/"] as const;

/** Le marqueur que la page de jeu pose sur son contenu et que la feuille lit. */
export const MARQUEUR_ECRAN_DE_JEU = "data-ecran-de-jeu";

export function estEcranDeJeu(chemin: string | null | undefined): boolean {
  if (!chemin) return false;
  return PREFIXES_DES_ECRANS_DE_JEU.some((p) => chemin.startsWith(p));
}
