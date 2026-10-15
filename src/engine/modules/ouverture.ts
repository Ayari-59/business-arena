import type { LeviersOuverts } from "../bots/leviers";

/**
 * QUAND UN MODULE EST-IL OFFERT À LA PARTIE ? UNE SEULE RÈGLE.
 *
 * Un module suit le niveau de difficulté par le levier qui lui ressemble : les
 * démarches qualité au niveau qui ouvre la qualité, les programmes de R&D avec
 * la recherche et développement. L'offre (`services/modules-offer`) s'en sert
 * pour savoir quoi proposer, et la validation du serveur pour refuser un
 * module que le niveau ne propose pas.
 */

/** Les décisions de module, une par catalogue du scénario. */
export const DECISIONS_DE_MODULE = ["qualityActions", "startedRdActionIds"] as const;

export type DecisionDeModule = (typeof DECISIONS_DE_MODULE)[number];

/** Le levier du niveau qui ouvre chaque module. */
export const OUVERT_PAR: Record<DecisionDeModule, keyof LeviersOuverts> = {
  qualityActions: "quality",
  startedRdActionIds: "rd",
};

/** Un module est-il offert à ce niveau ? Sans leviers (aucun niveau connu) : oui. */
export function moduleOuvert(decision: DecisionDeModule, leviers: LeviersOuverts | null | undefined): boolean {
  return !leviers || leviers[OUVERT_PAR[decision]] === true;
}
