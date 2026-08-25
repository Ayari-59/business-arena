/**
 * Production sous contraintes (doc 02 §4) : une entreprise ne produit jamais
 * une quantité décrétée — la réalisation est bornée par les capacités (§13).
 */

export interface ProductionInput {
  planned: number;
  machineCapacity: number; // unités/tour à 100 %
  availability: number; // 0..1
  headcount: number;
  hoursPerEmployee: number;
  productivity: number;
  hoursPerUnit: number;
}

export interface ProductionResult {
  produced: number;
  machineCapacity: number; // capacité machine effective du tour
  laborCapacity: number;
  utilizationRate: number; // production / capacité machine effective
}

export function computeProduction(input: ProductionInput): ProductionResult {
  const machineCapacity = Math.max(0, input.machineCapacity * input.availability);
  const laborHours = input.headcount * input.hoursPerEmployee * input.productivity;
  const laborCapacity = input.hoursPerUnit > 0 ? laborHours / input.hoursPerUnit : Infinity;
  const produced = Math.max(0, Math.min(input.planned, machineCapacity, laborCapacity));
  return {
    produced,
    machineCapacity,
    laborCapacity,
    utilizationRate: machineCapacity > 0 ? produced / machineCapacity : 0,
  };
}

/**
 * Qualité produite : fonction du budget qualité (rendements décroissants),
 * dégradée en surchauffe (> 95 % d'utilisation). La qualité perçue suit avec
 * inertie : perceived(t) = λ×perceived(t-1) + (1-λ)×produced(t) (doc 02 §4).
 */
export function computeProducedQuality(args: {
  qualityBudget: number;
  qualitySensitivity: number;
  qualityScale: number;
  utilizationRate: number;
}): number {
  const base = 1 + args.qualitySensitivity * Math.log(1 + args.qualityBudget / args.qualityScale);
  const overheat = args.utilizationRate > 0.95 ? 1 - (args.utilizationRate - 0.95) : 1;
  return Math.max(0.1, base * overheat);
}

export function updatePerceivedQuality(
  previous: number,
  produced: number,
  inertia: number,
): number {
  return inertia * previous + (1 - inertia) * produced;
}

/**
 * Disponibilité machine : se dégrade si la maintenance est sous le budget de
 * référence, se rétablit (vers 1) sinon (doc 02 §4).
 */
export function updateAvailability(args: {
  current: number;
  maintenanceBudget: number;
  maintenanceReference: number;
  availabilityDecay: number;
}): number {
  const ratio =
    args.maintenanceReference > 0
      ? Math.min(1, args.maintenanceBudget / args.maintenanceReference)
      : 1;
  const next = args.current - args.availabilityDecay * (1 - ratio) + 0.5 * args.availabilityDecay * ratio;
  return Math.min(1, Math.max(0.3, next));
}
