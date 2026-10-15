import type { LeviersOuverts } from "../bots/leviers";

/**
 * QUAND UN MODULE EST-IL OFFERT À LA PARTIE ? UNE SEULE RÈGLE, DEUX LECTEURS.
 *
 * Un module suit le niveau de difficulté par le levier qui lui ressemble : la
 * qualité au niveau qui ouvre la qualité, la formation avec les ressources
 * humaines, la capacité avec l'investissement, les options de financement
 * avec le financement, la stratégie (export, innovation, prix, marque, R&D,
 * actions commerciales) avec la recherche et développement.
 *
 * L'offre (`services/modules-offer`) s'en sert pour savoir quoi proposer, et
 * le moteur pour savoir si une crise peut frapper l'entreprise : une crise
 * n'arrive qu'aux parties dont le niveau ouvre les plans de crise. Deux
 * copies de la table auraient fini par diverger.
 */

/** Les décisions de module, une par catalogue du scénario. */
export const DECISIONS_DE_MODULE = [
  "qualityActions",
  "hsActions",
  "trainingEnrollments",
  "activeHRPolicyIds",
  "maintenanceDecisions",
  "activeContractIds",
  "activeCapacityOptionIds",
  "activatePartnershipIds",
  "activeCrisisPlanIds",
  "financingDraws",
  "activeRseActionIds",
  "enteredMarketIds",
  "startedInnovationIds",
  "startedRdActionIds",
  "activePricingStrategyIds",
  "activeCommercialActionIds",
  "startDigitalProjectIds",
  "activeBrandActionIds",
] as const;

export type DecisionDeModule = (typeof DECISIONS_DE_MODULE)[number];

/** Le levier du niveau qui ouvre chaque module. */
export const OUVERT_PAR: Record<DecisionDeModule, keyof LeviersOuverts> = {
  qualityActions: "quality",
  hsActions: "hr",
  trainingEnrollments: "hr",
  activeHRPolicyIds: "hr",
  maintenanceDecisions: "maintenance",
  // Les achats : ce que l'on produit, au niveau qui ouvre la qualité.
  activeContractIds: "quality",
  activeCapacityOptionIds: "investment",
  activatePartnershipIds: "investment",
  activeCrisisPlanIds: "insurance",
  financingDraws: "finance",
  activeRseActionIds: "rse",
  enteredMarketIds: "rd",
  startedInnovationIds: "rd",
  startedRdActionIds: "rd",
  activePricingStrategyIds: "rd",
  activeCommercialActionIds: "rd",
  startDigitalProjectIds: "rd",
  activeBrandActionIds: "rd",
};

/** Un module est-il offert à ce niveau ? Sans leviers (aucun niveau connu) : oui. */
export function moduleOuvert(decision: DecisionDeModule, leviers: LeviersOuverts | null | undefined): boolean {
  return !leviers || leviers[OUVERT_PAR[decision]] === true;
}

/**
 * Une crise peut-elle frapper l'entreprise ce tour ? Seulement si l'appelant a
 * dit à quel niveau la partie se joue, et que ce niveau offre les plans de
 * crise : sans niveau connu (rejeux, tests, calibration), aucune crise n'est
 * tirée, comme avant que la crise ne pèse sur le chiffre d'affaires.
 */
export function criseOfferte(leviers: LeviersOuverts | null | undefined): boolean {
  return Boolean(leviers) && moduleOuvert("activeCrisisPlanIds", leviers);
}
