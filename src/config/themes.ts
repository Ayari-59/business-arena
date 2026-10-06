/**
 * L'HABILLAGE DU SITE : LE PAPIER ET LE TABLEAU.
 *
 * Le site a longtemps proposé deux thèmes, un sombre et un clair qui le
 * renversait, et un bouton pour basculer de l'un à l'autre. Il n'en a plus
 * qu'un, qui ne se choisit pas :
 *
 *   · le PAPIER, un ivoire à l'encre brune, pour lire et pour jouer ;
 *   · le TABLEAU, une ardoise vert-noir et sa craie, là où la classe regarde
 *     ensemble — les bandes à contre-jour, les écrans de chiffres de l'arène,
 *     la projection.
 *
 * Le sombre n'a pas disparu : il est devenu une matière que le site pose à
 * dessein, au lieu d'un mode qu'on bascule. Les échelles complètes vivent dans
 * scripts/generer-theme-clair.ts (PAPIER, TABLEAU), qui engendre la feuille.
 *
 * Ce fichier garde les deux couleurs de fond en clair, pour ce qui ne lit pas
 * les feuilles de style : la barre d'état du téléphone, l'écran de démarrage
 * de l'application installée, les pastilles d'aperçu des palettes.
 */

/** Le fond de la page : l'ivoire du papier (oklch 98,3 % 0,009 88). */
export const COULEUR_DU_PAPIER = "#fcf9f3";

/** Le fond du tableau : l'ardoise vert-noir (oklch 23 % 0,016 162). */
export const COULEUR_DU_TABLEAU = "#161f1b";
