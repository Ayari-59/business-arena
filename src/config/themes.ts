/**
 * L'HABILLAGE DU SITE : « L'ARÈNE », LE CLAIR ET LE MARINE.
 *
 * Le site a longtemps proposé deux thèmes, un sombre et un clair qui le
 * renversait, et un bouton pour basculer de l'un à l'autre. Il n'en a plus
 * qu'un, qui ne se choisit pas, et qui garde ses deux sols :
 *
 *   · le PAPIER, un fond clair à peine bleuté, ses cartes blanches et son
 *     encre, pour lire et pour jouer ;
 *   · le TABLEAU, un marine et ses blancs, là où la classe regarde ensemble :
 *     l'en-tête, le haut de l'accueil, les bandes à contre-jour, les écrans de
 *     chiffres de l'arène, la projection.
 *
 * L'orange y est l'action, l'or la distinction, le vert et le rouge le gain et
 * la perte. Les échelles complètes vivent dans scripts/generer-theme-clair.ts
 * (PAPIER, TABLEAU), qui engendre la feuille.
 *
 * Ce fichier garde les deux couleurs de fond en clair, pour ce qui ne lit pas
 * les feuilles de style : la barre d'état du téléphone, l'écran de démarrage
 * de l'application installée, les pastilles d'aperçu des palettes.
 */

/** Le fond de la page : le clair de l'arène. */
export const COULEUR_DU_PAPIER = "#f5f7fb";

/** Le fond du tableau : le marine de l'arène. */
export const COULEUR_DU_TABLEAU = "#0b2545";
