/**
 * LES ÉTALONS : contre qui des décisions sont rejouées.
 *
 * Deux usages, deux étalons, et c'est la décision du propriétaire :
 *
 *   · LE BILAN DES PARTIES (« mérite ou chance ») juge contre UN BON GESTIONNAIRE
 *     (`reference.ts`) : il joue le marché de la partie avec ce que le joueur
 *     voyait, puis ses décisions sont rejouées telles quelles, comme celles du
 *     joueur ;
 *   · L'EXAMEN INDIVIDUEL note contre LA GESTION NEUTRE DU SECTEUR, l'étalon que
 *     sa grille publiée nomme (config/examen/grille.ts) : une note d'accréditation
 *     ne change pas d'étalon sans une nouvelle version de grille.
 *
 * Le moteur de rejeu est le même (`rejouer`) : seul change qui décide pour le
 * joueur sous chaque marché.
 */
import { neutralDecisions } from "@/engine/bots";
import { bornerLInvestissement, plafondDInvestissement } from "@/engine/investment/plafond";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import type { DifficultyPreset } from "@/config/difficulty";
import { rejouer, type IssueDuRejeu, type PartieARejouer } from "./rejeu";
import { partieDeLaReference, selonLeNiveau } from "./reference";
import { GRAINES_DU_MERITE } from "./verdict";

export type Etalon = "gestion-neutre" | "bon-gestionnaire";

/**
 * LA GESTION NEUTRE DU SECTEUR, tour par tour : la gestion que le formulaire
 * propose (`neutralDecisions`, profil « balanced » des bots), tenue à chaque tour.
 * Le prix de référence du marché, un volume qui suit les ventes du tour passé et
 * la saison, un marketing et une qualité au niveau du marché, la maintenance de
 * référence ; rien de ce que le niveau n'ouvre pas, et l'investissement plafonné
 * comme celui du joueur. Elle ne réagit à personne.
 *
 * C'est, à l'identique, la « méthode de référence » d'avant le lot « mérite
 * durci » : l'examen la garde, et la garde de `tests/unit/examen-gestion-neutre`
 * le vérifie au centime de note sur des copies témoins.
 */
export function decisionDeLaGestionNeutre(
  ctx: {
    scenario: EngineScenarioConfig;
    state: CompanyState;
    roundIndex: number;
    lastSoldUnits?: number;
    lastSoldByProduct?: Record<string, number>;
  },
  ouverts: DifficultyPreset["decisions"] | null,
): RoundDecisions {
  // Sans `humanAvgPrice` : la gestion neutre ne réagit au prix de personne.
  const decision = selonLeNiveau(
    neutralDecisions({
      scenario: ctx.scenario,
      state: ctx.state,
      roundIndex: ctx.roundIndex,
      lastSoldUnits: ctx.lastSoldUnits,
      lastSoldByProduct: ctx.lastSoldByProduct,
    }),
    ouverts,
  );
  return bornerLInvestissement(decision, plafondDInvestissement(ctx.scenario, ctx.state, ouverts, decision.hr));
}

/**
 * Les rejeux de l'étalon sous les marchés possibles, dans l'ordre des graines.
 *
 *   · gestion neutre : elle décide sous CHAQUE marché, tour par tour (c'est
 *     ainsi que l'examen l'a toujours jouée) ;
 *   · bon gestionnaire : il joue le marché de la partie, puis ses décisions sont
 *     rejouées telles quelles.
 */
export function rejeuxDeLEtalon(
  partie: PartieARejouer,
  ouverts: DifficultyPreset["decisions"] | null,
  etalon: Etalon,
  graines: readonly number[] = GRAINES_DU_MERITE,
): IssueDuRejeu[] {
  if (etalon === "gestion-neutre") {
    const methode = { type: "methode" as const, decider: (c: Parameters<typeof decisionDeLaGestionNeutre>[0]) => decisionDeLaGestionNeutre(c, ouverts) };
    return graines.map((g) => rejouer(partie, g, methode));
  }
  const laReference = partieDeLaReference(partie, ouverts);
  return graines.map((g) => rejouer(laReference, g));
}
