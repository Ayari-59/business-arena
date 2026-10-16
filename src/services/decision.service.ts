import { neutralDecisions, type LeviersOuverts } from "@/engine/bots";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { sansDepensesPonctuelles } from "@/services/decision-baseline";

/**
 * Reconduction des décisions du tour précédent quand une équipe humaine
 * n'a pas soumis les siennes.
 *
 * La MÊME RÈGLE que la proposition du formulaire (`sansDepensesPonctuelles`,
 * services/decision-baseline.ts) : une dépense ponctuelle vaut pour SON tour.
 * Reconduite, elle se paierait encore sans que personne ne l'ait redécidée :
 * l'équipe absente qui avait financé une référence à bâtir la refinançait à
 * chaque tour d'absence, comme celle qui validait la proposition.
 *
 * Champs récurrents (préservés) :
 *   price, productionPlan, marketingBudget, qualityBudget, maintenanceBudget,
 *   marque et axe de communication, hr.salaryIndex, supplierChoice,
 *   insurance, forecast ; le détail par référence (prix, plan, budgets).
 *
 * Champs ponctuels (retirés, ou remis à zéro pour la R&D) :
 *   rdBudget (global et par référence), hr.hire, hr.fire, hr.trainingBudget,
 *   investment, treasury, finance, acceptOrder, studies, rse, salesEstimate,
 *   rachat (niveau 7 : reconduit, il se rejouerait ; la sous-traitance, le
 *   réseau et la fabrication à l'étranger se reconduisent comme le plan),
 *   et les choix de module (actions qualité, programmes R&D lancés, arrêts) :
 *   ce sont des DÉMARRAGES, que le moteur garde ensuite dans l'état. Reconduits,
 *   ils relanceraient une action ponctuelle ou échue que l'équipe n'a pas
 *   redécidée.
 */
export function carryOverDecisions(prev: RoundDecisions): RoundDecisions {
  return sansDepensesPonctuelles(prev);
}

/**
 * Décisions par défaut quand aucune soumission ni historique n'existe.
 * Basées sur les décisions neutres du secteur joué, avec un emprunt nul.
 */
export function fallbackDecisions(
  scenario: EngineScenarioConfig,
  state: CompanyState,
  roundIndex: number,
  /** Les leviers figés de la partie : l'équipe absente ne décide qu'avec eux. */
  leviers: LeviersOuverts | null = null,
): RoundDecisions {
  const neutre = neutralDecisions({ scenario, state, roundIndex, leviers });
  return { ...neutre, finance: { ...(neutre.finance ?? {}), newLoan: 0, loanRepayment: 0 } };
}
