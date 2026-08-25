/**
 * Seuil de rentabilité, point mort, marge et indice de sécurité (doc 02 §5).
 */

export interface BreakevenResult {
  breakEvenUnits: number;
  breakEvenRevenue: number;
  safetyMargin: number; // CA − seuil en valeur
  safetyIndex: number; // marge de sécurité / CA
}

export function computeBreakeven(args: {
  fixedCosts: number; // fixes + amortissements du tour
  price: number;
  uvc: number;
  revenue: number;
}): BreakevenResult {
  const unitMargin = args.price - args.uvc;
  const mcvRate = args.price > 0 ? unitMargin / args.price : 0;
  const breakEvenUnits = unitMargin > 0 ? args.fixedCosts / unitMargin : Infinity;
  const breakEvenRevenue = mcvRate > 0 ? args.fixedCosts / mcvRate : Infinity;
  const safetyMargin = args.revenue - breakEvenRevenue;
  return {
    breakEvenUnits,
    breakEvenRevenue,
    safetyMargin,
    safetyIndex: args.revenue > 0 ? safetyMargin / args.revenue : 0,
  };
}

/**
 * Point mort : jour du tour où le CA cumulé atteint le seuil (CA supposé
 * linéaire sur la période). Retourne null si le seuil n'est pas atteint.
 */
export function deadPointDay(args: {
  breakEvenRevenue: number;
  revenue: number;
  roundDays: number;
}): number | null {
  if (args.revenue <= 0 || args.breakEvenRevenue > args.revenue) return null;
  return (args.breakEvenRevenue / args.revenue) * args.roundDays;
}
