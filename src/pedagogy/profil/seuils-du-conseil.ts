/**
 * Au-delà de cette qualité moyenne sur les deux derniers épisodes, on propose
 * l'Expert ; en deçà de la seconde, la Découverte. Des conventions de départ,
 * comme les autres seuils du profil.
 *
 * Elles vivent à part pour que le bilan de l'arène (`pedagogy/merite`) conseille
 * un niveau avec les MÊMES seuils, sans tirer le registre des épisodes avec lui.
 */
export const SEUILS_DU_CONSEIL = { expert: 0.8, decouverte: 0.4 } as const;
