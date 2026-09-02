/**
 * Ce que le site dit de lui-même hors de ses pages : dans l'onglet du
 * navigateur, dans un lien partagé, dans un résultat de recherche.
 *
 * Constaté en production : le titre était « BUSINESS ARENA » sur la plupart
 * des pages, la description ne nommait ni public ni matière, et aucun lien
 * partagé n'avait d'aperçu. Un enseignant qui reçoit l'adresse sur une
 * messagerie voyait une ligne nue.
 */

export const NOM_DU_SITE = "Business Arena";

/** Le titre de la page d'accueil, et celui du site quand une page n'en a pas. */
export const TITRE_ACCUEIL = "Business Arena · Simulation d'entreprise pour BTS, DCG et écoles";

export const DESCRIPTION_ACCUEIL =
  "Jeu d'entreprise pédagogique gratuit et sans compte élève : 9 secteurs, 79 situations, 18 modèles d'analyse. Pilotez prix, production, trésorerie et affrontez la concurrence.";

/** Le gabarit des autres pages : leur titre propre, puis le nom du site. */
export const GABARIT_DE_TITRE = "%s · Business Arena";
