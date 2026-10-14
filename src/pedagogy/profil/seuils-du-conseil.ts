/**
 * Au-delà de cette qualité moyenne sur les deux derniers épisodes, on propose
 * l'Expert ; en deçà de la seconde, la Découverte. Des conventions de départ,
 * comme les autres seuils du profil.
 *
 * Elles vivent à part depuis que le bilan de l'arène (`pedagogy/merite`) les
 * lisait sans tirer le registre des épisodes. Il a maintenant les siens
 * (`SEUILS_DE_LA_SUITE`) : face à un bon gestionnaire, la part des marchés
 * battus est presque toujours proche de 0 ou de 1, et ces seuils-ci auraient
 * fait descendre presque tout le monde.
 */
export const SEUILS_DU_CONSEIL = { expert: 0.8, decouverte: 0.4 } as const;
