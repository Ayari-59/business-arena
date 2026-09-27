/**
 * CE QU'ON PUBLIE D'UN RELEVÉ D'USAGE, ET À PARTIR DE QUAND.
 *
 * Séparé du service parce que la règle n'a pas besoin de la base pour être
 * lue, ni pour être mise à l'épreuve : le plancher est une décision éditoriale,
 * pas une requête.
 */

export interface PreuvesDusage {
  /** Parties arrivées au moins à leur premier résultat. */
  parties: number;
  /** Tours effectivement résolus par le moteur. */
  tours: number;
  /** Décisions validées par une équipe. */
  decisions: number;
  /** Classes créées par un enseignant. */
  classes: number;
  /** Le jour du relevé, pour que le lecteur sache de quand il date. */
  releveLe: Date;
}

/**
 * EN DESSOUS, ON NE PUBLIE PAS. Trois parties prouvent l'inverse de ce qu'on
 * leur demande, et les gonfler serait mentir. La section apparaîtra d'elle-même
 * le jour où les chiffres seront vrais.
 */
export const PLANCHER = { parties: 10, tours: 30 } as const;

/** Le relevé passe-t-il le plancher ? Les deux conditions, pas l'une ou l'autre. */
export function assezPourEtreDit(p: Pick<PreuvesDusage, "parties" | "tours">): boolean {
  return p.parties >= PLANCHER.parties && p.tours >= PLANCHER.tours;
}
