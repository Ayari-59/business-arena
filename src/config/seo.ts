/**
 * Ce que le site dit de lui-même hors de ses pages : dans l'onglet du
 * navigateur, dans un lien partagé, dans un résultat de recherche.
 *
 * Constaté en production : le titre était « BUSINESS ARENA » sur la plupart
 * des pages, la description ne nommait ni public ni matière, et aucun lien
 * partagé n'avait d'aperçu. Un enseignant qui reçoit l'adresse sur une
 * messagerie voyait une ligne nue.
 */

import { NOMBRE_D_EPISODES } from "./episodes/familles";
import { SCENARIO_CHOICES } from "./scenarios/registry";

export const NOM_DU_SITE = "Business Arena";

/** Le titre de la page d'accueil, et celui du site quand une page n'en a pas. */
export const TITRE_ACCUEIL = "Business Arena · Simulation d'entreprise pour BTS, DCG et écoles";

/**
 * LES NOMBRES DE LA DESCRIPTION sont comptés dans les registres, et ce sont
 * ceux que l'accueil affiche : un lecteur peut les vérifier sur la page même.
 * Elle annonçait « 139 situations, 20 modèles d'analyse », deux nombres
 * qu'aucune page publique ne permettait de retrouver (audit d'octobre 2026).
 */
export const DESCRIPTION_ACCUEIL = `Jeu d'entreprise pédagogique à essayer gratuitement, sans compte élève : ${SCENARIO_CHOICES.length} entreprises à piloter et ${NOMBRE_D_EPISODES} épisodes manager. Pilotez prix, production, trésorerie et affrontez la concurrence.`;

/**
 * L'APERÇU DE PARTAGE COMMUN, SANS ADRESSE. Le gabarit portait l'adresse de
 * l'accueil (`og:url`), héritée par toutes les pages : un lien partagé vers
 * /tarifs se présentait comme l'accueil. Une page qui veut son `og:url` le
 * pose elle-même, avec ce socle (Next remplace l'objet `openGraph` entier,
 * il ne le fusionne pas).
 */
export const OPEN_GRAPH_DU_SITE = {
  siteName: NOM_DU_SITE,
  locale: "fr_FR",
  type: "website",
} as const;

/** Le gabarit des autres pages : leur titre propre, puis le nom du site. */
export const GABARIT_DE_TITRE = "%s · Business Arena";
