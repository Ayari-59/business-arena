/**
 * LES CONDITIONS COMMERCIALES DU COURS : ce que l'arène ne négocie pas.
 *
 * La simulation vend à un prix et paie à un délai ; elle ne connaît ni remise ni escompte.
 * Le chapitre « Remises et règlements » les ajoute aux mêmes opérations que le chapitre
 * pilote, avec des conditions courantes entre professionnels : une remise sur une commande
 * importante, un escompte pour un paiement rapide.
 */

/** La remise accordée au client professionnel sur sa commande. */
export const TAUX_DE_REMISE = 0.05;
/** L'escompte, pour un paiement dans les jours qui suivent la facture. */
export const TAUX_D_ESCOMPTE = 0.02;
export const JOURS_D_ESCOMPTE = 10;
/** L'année commerciale, pour ramener l'escompte à un taux annuel. */
export const JOURS_PAR_AN = 360;
