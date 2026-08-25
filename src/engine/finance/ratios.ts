import type { BalanceSheet, IncomeStatement } from "../types";

/**
 * Profitabilité et rentabilités (doc 02 §6.4, §17) : « gagner de l'argent »
 * n'est pas « être rentable par rapport aux moyens engagés ».
 */
export interface Ratios {
  profitability: number; // résultat net / CA
  returnOnCapitalEmployed: number; // Re : REX net d'IS / (CP + dettes financières)
  returnOnEquity: number; // Rf : résultat net / CP
  leverage: number; // effet de levier = Rf − Re
  debtToEquity: number;
  assetTurnover: number; // CA / total actif
}

export function computeRatios(is: IncomeStatement, b: BalanceSheet, taxRate: number): Ratios {
  const capitalEmployed = b.equity + b.financialDebt;
  const totalAssets = b.fixedAssetsNet + b.inventoryValue + b.receivables + b.cash;
  const roce =
    capitalEmployed > 0 ? (is.operatingIncome * (1 - taxRate)) / capitalEmployed : 0;
  const roe = b.equity > 0 ? is.netIncome / b.equity : 0;
  return {
    profitability: is.revenue > 0 ? is.netIncome / is.revenue : 0,
    returnOnCapitalEmployed: roce,
    returnOnEquity: roe,
    leverage: roe - roce,
    debtToEquity: b.equity > 0 ? b.financialDebt / b.equity : 0,
    assetTurnover: totalAssets > 0 ? is.revenue / totalAssets : 0,
  };
}
