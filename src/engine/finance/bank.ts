import { DEFAULT_RSE_CONFIG, financingTrustBonus } from "../rse";
import type { CompanyState, EngineScenarioConfig } from "../types";

/**
 * LE DOSSIER BANCAIRE
 *
 * Ce que la banque consent — plafond de découvert et taux — suit une CONFIANCE.
 * Elle joue sur le découvert seul, jamais sur un emprunt déjà accordé : le
 * découvert est un concours révocable, la banque peut le réduire et le
 * renchérir ; un prêt en cours, non.
 *
 * DEUX SOURCES, ET UNE SEULE VIT AUJOURD'HUI.
 *
 *  · La fiabilité des plans de trésorerie passés fait DESCENDRE la confiance
 *    sous le plein. Cette voie est en sommeil : l'arène ne demande plus de
 *    plan, `fiabiliteDuPlan` rend donc `null` et la confiance ne bouge pas. Le
 *    moteur garde la mécanique entière pour un plan arrivé autrement.
 *  · Le standing RSE la fait MONTER AU-DESSUS du plein — la prime verte.
 *
 * C'est pourquoi la confiance n'est pas bornée à 1. Elle l'était, et la prime
 * verte s'en trouvait entièrement écrasée : personne ne descendant plus sous
 * le plein, il n'y avait plus rien à regagner. Une entreprise sans engagement
 * obtient donc le plafond nominal du scénario ; un standing RSE établi obtient
 * mieux. C'est le sens du financement vert, et ce que l'atelier DCG-RSE
 * demande de constater.
 */

const CONFIANCE_PLEINE = 1;

/**
 * Jusqu'où la prime verte peut porter la confiance au-dessus du plein. Ce
 * n'est pas elle qui dose l'effet — c'est le coefficient RSE du scénario, dont
 * `financingTrustBonus` est l'asymptote — mais un garde-fou dur, pour qu'aucun
 * appelant ne puisse transformer le découvert en ligne de crédit illimitée.
 */
const CONFIANCE_MAX = 1.25;

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
 * bas rapproche l'affacturage forcé, qui est la vraie sanction. Au-dessus du
 * plein — la prime verte, seule à y mener —, la pente est la même : le plafond
 * s'élargit et le taux cède, du même pas qu'ils se resserraient.
 */
export function conditionsBancaires(
  confiance: number,
  base: { overdraftLimit: number; overdraftAnnualRate: number },
  bank: NonNullable<EngineScenarioConfig["finance"]["bank"]>,
): { overdraftLimit: number; overdraftAnnualRate: number } {
  const c = borne(confiance, 0, CONFIANCE_MAX);
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

/**
 * LA CONFIANCE RÉELLEMENT SERVIE À LA BANQUE : celle acquise, plus la prime
 * verte que vaut le standing RSE.
 *
 * Elle est ici et nulle part ailleurs, parce que trois endroits en ont besoin —
 * le moteur qui applique les conditions, la vue qui les ANNONCE au formulaire,
 * et le panneau de trésorerie qui redit le plafond. Calculée trois fois, elle
 * finirait par diverger, et l'élève lirait un découvert que la banque
 * n'applique pas. C'est exactement la faute qu'on a déjà payée une fois.
 */
export function confianceServie(
  state: Pick<CompanyState, "bankTrust" | "rseImageCapital">,
  scenario: Pick<EngineScenarioConfig, "rse">,
): number {
  const acquise = confianceInitiale(state);
  const prime = financingTrustBonus(
    state.rseImageCapital ?? 0,
    (scenario.rse ?? DEFAULT_RSE_CONFIG).financingTrustBonus,
  );
  return acquise + prime;
}
