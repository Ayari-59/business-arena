/**
 * Typologie et calculs de coûts (doc 02 §5).
 */

/** Coût variable unitaire de production (matières + autres variables). */
export function unitVariableCost(materialCost: number, otherVariableCost: number): number {
  return materialCost + otherVariableCost;
}

/** Marge sur coût variable unitaire. */
export function unitContributionMargin(price: number, uvc: number): number {
  return price - uvc;
}

/** Taux de marge sur coût variable (MCV / CA). */
export function contributionMarginRate(price: number, uvc: number): number {
  return price > 0 ? (price - uvc) / price : 0;
}

/** Taux de marge (marge / coût d'achat) et taux de marque (marge / prix de vente). */
export function markupRate(price: number, cost: number): number {
  return cost > 0 ? (price - cost) / cost : 0;
}
export function marginRate(price: number, cost: number): number {
  return price > 0 ? (price - cost) / price : 0;
}

/**
 * Coûts pertinents d'une commande exceptionnelle (doc 03 §3.1) : seuls les
 * coûts/recettes différentiels comptent. Retourne la contribution différentielle.
 */
export function incrementalContribution(args: {
  offeredPrice: number;
  quantity: number;
  uvc: number;
  additionalFixedCosts: number;
}): number {
  return (args.offeredPrice - args.uvc) * args.quantity - args.additionalFixedCosts;
}
