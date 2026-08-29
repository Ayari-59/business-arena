import type { EngineScenarioConfig } from "../types";

/**
 * LE DOSSIER BANCAIRE
 *
 * Le plan de trésorerie que l'élève dépose avec ses décisions ne changeait
 * aucun calcul : il était confronté au réalisé au tour suivant, et c'était
 * tout. Un prévisionnel sans conséquence n'enseigne pas la gestion, il
 * enseigne l'exercice de gestion. Ici, le plan sert à quelque chose : c'est la
 * pièce que la banque lit avant de prêter, et sa fiabilité passée décide de ce
 * qu'elle consent ensuite.
 *
 * Deux effets, tous deux sur le découvert, jamais sur un emprunt déjà
 * accordé : le découvert est un concours révocable, la banque peut le réduire
 * et le renchérir ; un prêt en cours, non.
 */

const CONFIANCE_PLEINE = 1;

function borne(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

/** Confiance portée par une entreprise qui n'a encore rien promis. */
export function confianceInitiale(state: { bankTrust?: number }): number {
  return state.bankTrust ?? CONFIANCE_PLEINE;
}

/**
 * Fiabilité du plan d'un tour, entre 0 (à côté de la plaque) et 1 (annoncé
 * juste). `null` quand aucun plan n'a été déposé : la banque n'a alors rien à
 * juger, et la confiance reste où elle est.
 *
 * Chaque ligne annoncée donne un écart relatif, ramené à une échelle qui ne
 * s'effondre pas quand la prévision approche zéro : sans ce garde-fou,
 * annoncer une trésorerie nulle et finir à 200 € d'écart vaudrait une erreur
 * infinie.
 */
export function fiabiliteDuPlan(input: {
  expectedUnits?: number;
  expectedCash?: number;
  soldUnits: number;
  netTreasury: number;
  /** Ordre de grandeur du tour (charges de structure) : le plancher d'échelle. */
  cashScale: number;
}): number | null {
  const ecarts: number[] = [];
  if (input.expectedUnits !== undefined) {
    const echelle = Math.max(Math.abs(input.expectedUnits), Math.abs(input.soldUnits), 1);
    ecarts.push(borne(Math.abs(input.soldUnits - input.expectedUnits) / echelle, 0, 1));
  }
  if (input.expectedCash !== undefined) {
    const echelle = Math.max(
      Math.abs(input.expectedCash),
      Math.abs(input.netTreasury),
      Math.abs(input.cashScale),
      1,
    );
    ecarts.push(borne(Math.abs(input.netTreasury - input.expectedCash) / echelle, 0, 1));
  }
  if (ecarts.length === 0) return null;
  return 1 - ecarts.reduce((somme, e) => somme + e, 0) / ecarts.length;
}

/**
 * Confiance du tour suivant. Lissage exponentiel : la banque a de la mémoire,
 * un bon trimestre n'efface pas trois mauvais, et un mauvais ne condamne pas.
 */
export function confianceSuivante(
  avant: number,
  fiabilite: number | null,
  bank: NonNullable<EngineScenarioConfig["finance"]["bank"]>,
): number {
  if (fiabilite === null) return avant;
  return borne(bank.memory * avant + (1 - bank.memory) * fiabilite, 0, 1);
}

/**
 * Conditions consenties pour le tour, à confiance donnée. Le plafond se
 * resserre et le taux monte à mesure que la confiance tombe ; un plafond plus
 * bas rapproche l'affacturage forcé, qui est la vraie sanction.
 */
export function conditionsBancaires(
  confiance: number,
  base: { overdraftLimit: number; overdraftAnnualRate: number },
  bank: NonNullable<EngineScenarioConfig["finance"]["bank"]>,
): { overdraftLimit: number; overdraftAnnualRate: number } {
  const c = borne(confiance, 0, 1);
  return {
    overdraftLimit: base.overdraftLimit * (bank.minOverdraftShare + (1 - bank.minOverdraftShare) * c),
    overdraftAnnualRate: base.overdraftAnnualRate + bank.maxOverdraftSpread * (1 - c),
  };
}

/**
 * Un plan de trésorerie accompagne-t-il ces décisions ? C'est la ligne de
 * trésorerie qui compte : annoncer des ventes n'est pas présenter un plan de
 * financement, et c'est le second que la banque exige.
 */
export function planDepose(forecast?: { expectedCash?: number }): boolean {
  return forecast?.expectedCash !== undefined;
}
