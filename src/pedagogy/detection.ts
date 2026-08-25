import type { CompanyRoundResult } from "../engine/types";
import type { DetectCode } from "../config/scenarios/nova/situations";

/**
 * Détection de situations (doc 03 §1.1) : des règles observent les résultats
 * d'un tour et déclenchent les situations correspondantes pour le tour suivant.
 */
export function detectSituations(result: CompanyRoundResult): DetectCode[] {
  const detected: DetectCode[] = [];
  const { netIncome } = result.incomeStatement;
  const { netTreasury } = result.functionalBalance;

  if (netIncome > 0 && netTreasury < 0) detected.push("profitable_illiquid");
  if (netIncome < 0) detected.push("below_breakeven");

  const segments = Object.values(result.market.bySegment);
  const sold = segments.reduce((s, d) => s + d.sold, 0);
  const lost = segments.reduce((s, d) => s + d.lost, 0);
  if (sold > 0 && lost > 0.1 * sold) detected.push("stockout");

  return detected;
}
