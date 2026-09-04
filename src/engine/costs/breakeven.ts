/**
 * Seuil de rentabilité, point mort, marge et indice de sécurité (doc 02 §5).
 */

export interface BreakevenResult {
  /** Nombre d'unités pour couvrir les charges fixes. `null` = seuil jamais atteint. */
  breakEvenUnits: number | null;
  /** CA correspondant au seuil. `null` = seuil jamais atteint. */
  breakEvenRevenue: number | null;
  /** CA − seuil en valeur. `null` quand il n'y a pas de seuil. */
  safetyMargin: number | null;
  /** Marge de sécurité / CA. `null` quand il n'y a pas de seuil. */
  safetyIndex: number | null;
}

export function computeBreakeven(args: {
  fixedCosts: number; // fixes + amortissements du tour
  price: number;
  uvc: number;
  revenue: number;
}): BreakevenResult {
  const unitMargin = args.price - args.uvc;
  const mcvRate = args.price > 0 ? unitMargin / args.price : 0;
  // Marge sur coût variable nulle ou négative : chaque unité vendue creuse la
  // perte au lieu de contribuer aux charges fixes. Aucun volume ne couvre le
  // seuil — il n'existe pas. On rend `null` (« seuil jamais atteint ») plutôt
  // que `Infinity`, qui débordait ensuite en marge et indice de sécurité à
  // −Infinity et s'affichait « −∞ € », « −∞ % ».
  const breakEvenUnits = unitMargin > 0 ? args.fixedCosts / unitMargin : null;
  const breakEvenRevenue = mcvRate > 0 ? args.fixedCosts / mcvRate : null;
  const safetyMargin = breakEvenRevenue === null ? null : args.revenue - breakEvenRevenue;
  const safetyIndex =
    safetyMargin === null ? null : args.revenue > 0 ? safetyMargin / args.revenue : 0;
  return { breakEvenUnits, breakEvenRevenue, safetyMargin, safetyIndex };
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
