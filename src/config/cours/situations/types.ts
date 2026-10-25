import type { Chapitre } from "../types";

/**
 * UNE MISE EN SITUATION (demande du propriétaire, octobre 2026) : « des mises en
 * situation qui reprennent des compétences calculatoires ».
 *
 * Elle a la forme d'un chapitre, pour tout en reprendre : les étapes de calcul et
 * leur correction, le rendu, le contrôle de la licence, la progression remontée à
 * l'enseignant. Ce qui la distingue tient au contenu :
 *
 *   · un commanditaire pose une question, et la première étape la lui fait lire
 *     avec ses documents ; il n'y a pas de cours, aucune étape n'enseigne ;
 *   · les calculs sont ceux de chapitres déjà vus, qu'elle déclare (`reprend`),
 *     enchaînés dans un ordre que l'élève doit trouver ;
 *   · la dernière étape est la réponse rendue au commanditaire, le livrable.
 *
 * Elle vit hors du registre des chapitres (config/cours/situations) : elle ne
 * compte ni dans le catalogue des chapitres ni dans la couverture, qu'elle ne
 * fait que remobiliser.
 */
export interface Situation extends Chapitre {
  /** Les chapitres dont la situation reprend les calculs, dans l'ordre où ils s'apprennent. */
  reprend: readonly string[];
  /** Qui pose la question, en quelques mots (« La direction »). */
  commanditaire: string;
}
