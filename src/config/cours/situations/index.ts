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

/**
 * LES MOTS DE LA PAGE, SELON CE QU'ELLE OUVRE. Une mise en situation s'ouvre
 * comme un chapitre, mais elle n'en est pas un : la page ne dit pas « Ce chapitre
 * est réservé » ni « Terminer le chapitre » à l'élève qui répond à une demande.
 */
export function motsDuContenu(code: string) {
  return situationParCode(code)
    ? {
        reserve: "Cette mise en situation est réservée",
        terminer: "Terminer la mise en situation",
        termine: "Mise en situation terminée",
        etapes: "Les étapes de la mise en situation",
        journal: "Le journal complet de la mise en situation",
        recommencer: "Recommencer la mise en situation",
      }
    : {
        reserve: "Ce chapitre est réservé",
        terminer: "Terminer le chapitre",
        termine: "Chapitre terminé",
        etapes: "Les étapes du chapitre",
        journal: "Le journal complet du chapitre",
        recommencer: "Recommencer le chapitre",
      };
}
