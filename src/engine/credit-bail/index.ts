import type { ContratDeCreditBail, EngineScenarioConfig, EquipmentTypeDef } from "../types";

/**
 * LE CRÉDIT-BAIL DES MACHINES (drapeau `creditBail`, posé à la création d'une partie).
 *
 * LE CONTRAT TYPE, le seul de l'arène (décision du propriétaire, novembre 2026) :
 *  · trois ans de loyers constants, exprimés en tours (douze au trimestre, trente-six au
 *    mois), payés à terme échu : le premier au tour où la machine entre en service, celui
 *    qui suit la signature ;
 *  · un taux implicite égal au taux d'emprunt du scénario plus 1,5 point ;
 *  · aucun apport : la valeur financée est le prix de la machine au catalogue ;
 *  · une option d'achat à 1 % du prix, en fin de contrat. Le loyer se calcule pour que
 *    les loyers et l'option, actualisés au taux implicite, rendent la valeur financée.
 *
 * LES COMPTES, AU PLAN COMPTABLE GÉNÉRAL. Le loyer est une charge externe (compte 612,
 * « Redevances de crédit-bail ») ; la machine n'est pas à l'actif pendant le contrat et ne
 * s'amortit pas ; les loyers restant à payer, avec le prix de l'option, se lisent en annexe
 * (« Engagements de crédit-bail »), hors bilan. Ce n'est pas une dette au bilan.
 *
 * À LA LEVÉE D'OPTION, la machine entre à l'actif pour le prix de l'option (compte 2154),
 * amortie sur sa DURÉE RÉSIDUELLE : la durée d'amortissement de son type moins la durée du
 * contrat, et jamais moins d'un an (`dureeResiduelle`). Une règle simple : la machine a
 * déjà servi le temps du contrat, il lui reste ce qu'une machine achetée neuve aurait
 * encore à amortir, et un an au moins quand le contrat a duré plus que l'amortissement.
 *
 * LA BANQUE lit l'engagement pour moitié dans ce qu'elle accepte de prêter
 * (`PART_DE_L_ENGAGEMENT_DANS_L_ENDETTEMENT`) : un loyer à venir pèse sur la capacité de
 * remboursement, même s'il n'est pas au bilan.
 *
 * LA TVA : le moteur n'en porte que sur les ventes et les achats de matières ; les
 * charges externes (structure, loyers) sont hors taxe et sans TVA déductible. Le loyer suit
 * cette règle.
 */

/** La durée du contrat, en années. */
export const DUREE_DU_CREDIT_BAIL_EN_ANNEES = 3;
/** Ce que le taux implicite ajoute au taux d'emprunt du scénario. */
export const MAJORATION_DU_TAUX_DE_CREDIT_BAIL = 0.015;
/** Le prix de l'option d'achat, en part du prix de la machine. */
export const PART_DE_L_OPTION_D_ACHAT = 0.01;
/** La part de l'engagement de crédit-bail que la banque compte comme une dette. */
export const PART_DE_L_ENGAGEMENT_DANS_L_ENDETTEMENT = 0.5;

const JOURS_D_UNE_ANNEE = 360;

/** Le crédit-bail est-il ouvert dans ce scénario joué ? */
export function creditBailOuvert(scenario: Pick<EngineScenarioConfig, "creditBail" | "equipment">): boolean {
  return scenario.creditBail === true && !!scenario.equipment;
}

/** Le nombre de loyers d'un contrat : trois ans, en tours. */
export function dureeDuCreditBail(roundDays: number): number {
  return Math.max(1, Math.round((DUREE_DU_CREDIT_BAIL_EN_ANNEES * JOURS_D_UNE_ANNEE) / roundDays));
}

/** Le taux implicite d'un tour. */
export function tauxDuCreditBailParTour(scenario: Pick<EngineScenarioConfig, "finance" | "roundDays">): number {
  return ((scenario.finance.loanAnnualRate + MAJORATION_DU_TAUX_DE_CREDIT_BAIL) * scenario.roundDays) / JOURS_D_UNE_ANNEE;
}

export interface ConditionsDuCreditBail {
  /** Le nombre de loyers. */
  duree: number;
  tauxParTour: number;
  /** Le loyer d'un tour, pour une machine. */
  loyer: number;
  /** Le prix de l'option, pour une machine. */
  option: number;
  /** La valeur financée, pour une machine. */
  valeurFinancee: number;
}

/**
 * Les conditions du contrat type pour une machine de ce type : le loyer constant L tel que
 * Σ L / (1 + r)^k (k = 1 … n) + option / (1 + r)^n = prix.
 */
export function conditionsDuCreditBail(
  scenario: Pick<EngineScenarioConfig, "finance" | "roundDays">,
  type: Pick<EquipmentTypeDef, "costPerUnit">,
): ConditionsDuCreditBail {
  const duree = dureeDuCreditBail(scenario.roundDays);
  const r = tauxDuCreditBailParTour(scenario);
  const prix = type.costPerUnit;
  const option = prix * PART_DE_L_OPTION_D_ACHAT;
  const actualisation = Math.pow(1 + r, -duree);
  const loyer = r > 0 ? ((prix - option * actualisation) * r) / (1 - actualisation) : (prix - option) / duree;
  return { duree, tauxParTour: r, loyer, option, valeurFinancee: prix };
}

/** Les loyers qui restent à payer sur un contrat. */
export const loyersRestants = (c: ContratDeCreditBail): number => Math.max(0, c.duree - c.loyersPayes);

/** L'engagement de crédit-bail : les loyers restant à payer, tous contrats. */
export function engagementDeCreditBail(contrats: readonly ContratDeCreditBail[] | undefined): number {
  return (contrats ?? []).reduce((s, c) => s + c.loyer * loyersRestants(c), 0);
}

/** Le prix des options d'achat des contrats en cours. */
export function optionsDeCreditBail(contrats: readonly ContratDeCreditBail[] | undefined): number {
  return (contrats ?? []).reduce((s, c) => s + c.option, 0);
}

/**
 * La durée d'amortissement d'une machine dont l'option est levée : celle de son type moins
 * la durée du contrat, un an au moins.
 */
export function dureeResiduelle(
  type: Pick<EquipmentTypeDef, "depreciationRounds">,
  dureeDuContrat: number,
  roundDays: number,
): number {
  const unAn = Math.max(1, Math.round(JOURS_D_UNE_ANNEE / roundDays));
  return Math.max(unAn, Math.round(type.depreciationRounds - dureeDuContrat));
}

/** L'identifiant du contrat signé au tour `tour` pour ce type (un contrat par type et par tour). */
export const identifiantDuContrat = (typeCode: string, tour: number): string => `cb-${typeCode}-r${tour}`;

/** Une machine suivie une à une appartient-elle à ce contrat ? */
export const machineDuContrat = (machineId: string, contratId: string): boolean => machineId.startsWith(`${contratId}-`);

/** Une machine suivie une à une est-elle en crédit-bail ? */
export const machineEnCreditBail = (machineId: string): boolean => machineId.startsWith("cb-");
