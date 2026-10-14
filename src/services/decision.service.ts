import { neutralDecisions, type LeviersOuverts } from "@/engine/bots";
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
 *   investment, treasury, finance, acceptOrder, studies,
 *   et les choix de module (actions qualité, hygiène et sécurité,
 *   activations des catalogues optionnels) : ce sont des DÉMARRAGES, que le
 *   moteur garde ensuite dans l'état. Reconduits, ils relanceraient une action
 *   ponctuelle ou une action échue que l'équipe n'a pas redécidée.
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
    qualityActions: undefined,
    maintenanceDecisions: undefined,
    hsActions: undefined,
    trainingEnrollments: undefined,
    activeCommercialActionIds: undefined,
    activeContractIds: undefined,
    activeCapacityOptionIds: undefined,
    enteredMarketIds: undefined,
    startedInnovationIds: undefined,
    activeRseActionIds: undefined,
    activePricingStrategyIds: undefined,
    activeHRPolicyIds: undefined,
    activeCrisisPlanIds: undefined,
    activatePartnershipIds: undefined,
    startDigitalProjectIds: undefined,
    activeBrandActionIds: undefined,
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
  /** Les leviers figés de la partie : l'équipe absente ne décide qu'avec eux. */
  leviers: LeviersOuverts | null = null,
): RoundDecisions {
  const neutre = neutralDecisions({ scenario, state, roundIndex, leviers });
  return { ...neutre, finance: { ...(neutre.finance ?? {}), newLoan: 0, loanRepayment: 0 } };
}
