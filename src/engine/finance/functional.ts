import type { BalanceSheet } from "../types";

/**
 * Équilibre fonctionnel (doc 02 §6.2) — le pilier pédagogique §16 :
 *   FRNG = ressources stables − emplois stables
 *   BFR  = stocks + créances d'exploitation − dettes d'exploitation
 *   TN   = FRNG − BFR  (invariant : TN = disponibilités − concours bancaires)
 */
export interface FunctionalBalance {
  frng: number;
  bfr: number;
  netTreasury: number;
}

export function computeFunctionalBalance(b: BalanceSheet): FunctionalBalance {
  const frng = b.equity + b.financialDebt - b.fixedAssetsNet;
  // La TVA à décaisser est une dette d'exploitation (un crédit de TVA, une créance).
  const bfr = b.inventoryValue + b.receivables - b.payables - (b.vatLiability ?? 0);
  return { frng, bfr, netTreasury: frng - bfr };
}
