import { VENDEUR } from "./editeur";

/**
 * LES CHOIX DU PROPRIÉTAIRE POUR LES CONDITIONS GÉNÉRALES (novembre 2026), lus par /cgv et /cgu.
 * Chacun est écrit une fois ici ; les pages les lisent, jamais une copie.
 */

/** Durée de validité d'un devis, en jours (l'usage courant). */
export const VALIDITE_DU_DEVIS_JOURS = 30;

/** Pénalités de retard entre professionnels : le minimum légal, 3 fois le taux d'intérêt légal. */
export const MULTIPLE_DU_TAUX_LEGAL = 3;

/** Indemnité forfaitaire pour frais de recouvrement, en euros (article D. 441-5 du Code de commerce). */
export const INDEMNITE_DE_RECOUVREMENT_EUROS = 40;

/** Engagement de disponibilité du service, en pourcentage du temps sur l'année de l'offre. */
export const DISPONIBILITE_ENGAGEE_POURCENT = 95;

/** Le délai laissé au vendeur pour corriger un manquement grave, après mise en demeure, en jours. */
export const DELAI_DE_MISE_EN_DEMEURE_JOURS = 30;

/** La période des sommes payées qui plafonne la responsabilité du vendeur, en mois. */
export const PLAFOND_DE_RESPONSABILITE_MOIS = 12;

/** Le tribunal compétent entre professionnels : celui du siège du vendeur. */
export const TRIBUNAL_COMPETENT = `les tribunaux du ressort de ${VENDEUR.adresse.ville}`;

/** La version des conditions, affichée au bas des pages. */
export const VERSION_DES_CONDITIONS = "novembre 2026";

/**
 * LES DÉLAIS APRÈS LE DEVIS (décision du propriétaire, 11 novembre 2026 ; audit de l'offre du même
 * jour, P2-1 : ni l'écran de confirmation, ni l'accusé, ni les CGV ne disaient quand la réponse vient,
 * ni quand la licence s'ouvre). En jours ouvrés. La phrase se dit à l'écran de confirmation du devis
 * (components/devis-form.tsx), dans l'accusé de réception (services/devis.service.ts) et dans les CGV.
 */
export const REPONSE_AU_DEVIS_JOURS_OUVRES = 2;
export const OUVERTURE_DE_LA_LICENCE_JOURS_OUVRES = 2;

/** « 2 jours ouvrés », « 1 jour ouvré ». */
const joursOuvres = (n: number) => (n > 1 ? `${n} jours ouvrés` : `${n} jour ouvré`);

/** « Réponse sous 2 jours ouvrés ; licence ouverte sous 2 jours ouvrés après la commande. » */
export const DELAIS_APRES_LE_DEVIS = `Réponse sous ${joursOuvres(REPONSE_AU_DEVIS_JOURS_OUVRES)} ; licence ouverte sous ${joursOuvres(OUVERTURE_DE_LA_LICENCE_JOURS_OUVRES)} après la commande.`;
