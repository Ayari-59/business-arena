import type { SituationDef } from "./situation-kit";

/**
 * LES SITUATIONS DES SECTEURS, DANS LE NAVIGATEUR : AUCUNE (audit, P1-2).
 *
 * Voir `situations-des-secteurs.ts`. Le navigateur reçoit des listes vides : un
 * code client qui lirait une situation par le registre n'y trouverait rien, et
 * les corrigés ne quittent jamais le serveur. La garde
 * `tests/architecture/corriges-hors-du-navigateur.test.ts` vérifie que les deux
 * fichiers exportent les mêmes noms.
 */
const AUCUNE: SituationDef[] = [];

export const NOVA_SITUATIONS = AUCUNE;
export const NOVA_GAMME_SITUATIONS = AUCUNE;
export const BOUTIQUE_SITUATIONS = AUCUNE;
export const BOUTIQUE_MONO_SITUATIONS = AUCUNE;
export const HOTEL_SITUATIONS = AUCUNE;
export const HOTEL_GAMME_SITUATIONS = AUCUNE;
export const BISTROT_SITUATIONS = AUCUNE;
export const BISTROT_GAMME_SITUATIONS = AUCUNE;
export const CONSEIL_SITUATIONS = AUCUNE;
export const CONSEIL_GAMME_SITUATIONS = AUCUNE;
export const ECOMMERCE_SITUATIONS = AUCUNE;
export const ECOMMERCE_GAMME_SITUATIONS = AUCUNE;
export const FITNESS_SITUATIONS = AUCUNE;
export const BATIMENT_SITUATIONS = AUCUNE;
export const TRANSPORT_SITUATIONS = AUCUNE;
