import { COMMANDER_POUR_LA_PROMOTION } from "./commander-pour-la-promotion";
import { LA_FACTURE_CONTESTEE } from "./la-facture-contestee";
import { LE_RENDEZ_VOUS_A_LA_BANQUE } from "./le-rendez-vous-a-la-banque";
import { SUIVRE_LA_BAISSE } from "./suivre-la-baisse";
import type { Situation } from "./types";

export type { Situation } from "./types";

/** Les mises en situation, dans l'ordre où la page les propose. */
export const SITUATIONS: readonly Situation[] = [
  SUIVRE_LA_BAISSE,
  LA_FACTURE_CONTESTEE,
  LE_RENDEZ_VOUS_A_LA_BANQUE,
  COMMANDER_POUR_LA_PROMOTION,
];

export const situationParCode = (code: string) => SITUATIONS.find((s) => s.code === code);
