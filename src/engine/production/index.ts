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
  overheatThreshold?: number;
}): number {
  const threshold = args.overheatThreshold ?? 0.95;
  const base = 1 + args.qualitySensitivity * Math.log(1 + args.qualityBudget / args.qualityScale);
  const overheat = args.utilizationRate > threshold ? 1 - (args.utilizationRate - threshold) : 1;
  return Math.max(0.1, base * overheat);
}

/**
 * Taux de rebut interne (doc 02 §4.2) : les rebuts croissent quand la qualité
 * produite baisse. La MAINTENANCE peut aussi jouer (facteur optionnel), de façon
 * UNIDIRECTIONNELLE : sous le budget de maintenance de référence les rebuts
 * augmentent (jusqu'à ×(1 + s)) ; au budget de référence ou au-dessus, aucun
 * effet (facteur plafonné à 1 — pas de « récompense » à sur-entretenir). L'effet
 * est totalement inactif si `maintenanceDefectSensitivity` vaut 0 ou est absent
 * — les scénarios qui ne l'activent pas gardent leur comportement exact.
 * Résultat borné à [0, 0.5].
 */
export function computeDefectRate(args: {
  baseDefectRate: number;
  producedQuality: number;
  rseDefectReduction?: number;
  maintenanceBudget?: number;
  maintenanceReference?: number;
  maintenanceDefectSensitivity?: number;
}): number {
  const rse = args.rseDefectReduction ?? 0;
  const s = args.maintenanceDefectSensitivity ?? 0;
  const ref = args.maintenanceReference ?? 0;
  let maintenanceFactor = 1;
  if (s > 0 && ref > 0) {
    const ratio = (args.maintenanceBudget ?? 0) / ref;
    // Unidirectionnel : sous-entretien (ratio < 1) → plus de rebuts, jusqu'à
    // ×(1 + s). Au budget de référence ou au-dessus (ratio ≥ 1) → facteur 1,
    // aucun bonus. Le max(0, …) plafonne l'effet à 1 vers le haut.
    maintenanceFactor = 1 + s * Math.max(0, 1 - ratio);
  }
  const raw = args.baseDefectRate * (2 - args.producedQuality) * (1 - rse) * maintenanceFactor;
  return Math.min(0.5, Math.max(0, raw));
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
  availabilityFloor?: number;
}): number {
  const floor = args.availabilityFloor ?? 0.3;
  const ratio =
    args.maintenanceReference > 0
      ? Math.min(1, args.maintenanceBudget / args.maintenanceReference)
      : 1;
  const next = args.current - args.availabilityDecay * (1 - ratio) + 0.5 * args.availabilityDecay * ratio;
  return Math.min(1, Math.max(floor, next));
}
