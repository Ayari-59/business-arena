import { neutralDecisions } from "@/engine/bots";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";

/**
 * Reconduction des décisions du tour précédent quand une équipe humaine
 * n'a pas soumis les siennes.
 *
 * Champs récurrents (preservés) :
 *   price, productionPlan, marketingBudget, qualityBudget, maintenanceBudget,
 *   hr.salaryIndex, supplierChoice, insurance, forecast
 *
 * Champs ponctuels (remis à undefined) :
 *   hr.hire, hr.fire, hr.trainingBudget,
 *   investment, treasury, finance, acceptOrder, studies
 */
export function carryOverDecisions(prev: RoundDecisions): RoundDecisions {
  return {
    ...prev,
    hr: prev.hr ? { salaryIndex: prev.hr.salaryIndex } : undefined,
    supplierChoice: prev.supplierChoice,
    investment: undefined,
    treasury: undefined,
    finance: undefined,
    acceptOrder: undefined,
    studies: undefined,
  };
}

/**
 * Décisions par défaut quand aucune soumission ni historique n'existe.
 * Basées sur les décisions neutres du secteur joué, avec un emprunt nul.
 */
export function fallbackDecisions(
  scenario: EngineScenarioConfig,
  state: CompanyState,
  roundIndex: number,
): RoundDecisions {
  return {
    ...neutralDecisions({ scenario, state, roundIndex }),
    finance: { newLoan: 0, loanRepayment: 0 },
  };
}
