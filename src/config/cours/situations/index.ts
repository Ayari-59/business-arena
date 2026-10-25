import { COMMANDER_POUR_LA_PROMOTION } from "./commander-pour-la-promotion";
import { EMBAUCHER_POUR_LA_SAISON } from "./embaucher-pour-la-saison";
import { LA_FACTURE_CONTESTEE } from "./la-facture-contestee";
import { LA_REMISE_DU_GRAND_COMPTE } from "./la-remise-du-grand-compte";
import { LE_RENDEZ_VOUS_A_LA_BANQUE } from "./le-rendez-vous-a-la-banque";
import { QUEL_PRIX_POUR_LA_SAISON } from "./quel-prix-pour-la-saison";
import { SUIVRE_LA_BAISSE } from "./suivre-la-baisse";
import type { Situation } from "./types";

export type { Situation } from "./types";

/** Les mises en situation, dans l'ordre où la page les propose. */
export const SITUATIONS: readonly Situation[] = [
  SUIVRE_LA_BAISSE,
  LA_FACTURE_CONTESTEE,
  LE_RENDEZ_VOUS_A_LA_BANQUE,
  COMMANDER_POUR_LA_PROMOTION,
  QUEL_PRIX_POUR_LA_SAISON,
  LA_REMISE_DU_GRAND_COMPTE,
  EMBAUCHER_POUR_LA_SAISON,
];

export const situationParCode = (code: string) => SITUATIONS.find((s) => s.code === code);
