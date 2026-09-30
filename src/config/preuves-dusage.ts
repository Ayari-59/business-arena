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
 * QUELS COMPTEURS SONT PUBLIÉS, ET QUI EN DÉCIDE.
 *
 * Deux des quatre n'avaient rien à faire sur une page de vitrine, et pour deux
 * raisons différentes.
 *
 * « Classes créées » est exact et vaut zéro. C'est le seul chiffre nul d'une
 * page destinée aux enseignants, et il y dit littéralement qu'aucun enseignant
 * n'a créé de classe. On ne touche pas à la valeur — on ne la publie pas tant
 * qu'un administrateur ne le demande pas.
 *
 * « Décisions validées » mesurait autre chose que ce qu'il annonçait (voir
 * preuves-dusage.service). Le compte est réparé ; le réglage reste, parce que
 * ce qui se publie d'un relevé d'usage est une décision éditoriale, pas une
 * propriété de la base.
 *
 * Le plancher ci-dessous continue de s'appliquer par-dessus : un réglage ne
 * fait pas apparaître une bande qui n'a pas de quoi être dite.
 */
export interface PreuvesPubliees {
  parties: boolean;
  tours: boolean;
  decisions: boolean;
  classes: boolean;
}

export const PREUVES_PUBLIEES_PAR_DEFAUT: PreuvesPubliees = {
  parties: true,
  tours: true,
  decisions: true,
  classes: false,
};

/** Reste-t-il quelque chose à montrer ? Sinon la bande n'a pas lieu d'être. */
export function auMoinsUnCompteur(p: PreuvesPubliees): boolean {
  return p.parties || p.tours || p.decisions || p.classes;
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
