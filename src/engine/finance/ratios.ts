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
  // ROE (Rf). Quand les capitaux propres sont nuls ou négatifs, le ratio
  // résultat / CP n'a plus de sens : une PERTE sur des CP négatifs donnerait
  // un ratio POSITIF (perte < 0 ÷ CP < 0), qui se lirait comme une réussite.
  // Or des CP effacés sont le pire état de rentabilité pour l'associé. On
  // distingue donc deux cas plutôt que de tout ramener à 0 (neutre, ce qui
  // notait une entreprise insolvable au milieu de l'échelle) :
  //  - CP ≤ 0 ET perte → plancher à −1 (−100 %, « capitaux propres effacés »),
  //    en dessous de toute borne min de scénario : le score de rentabilité
  //    tombe donc au plancher, et l'affichage montre −100 % en rouge ;
  //  - CP ≤ 0 mais résultat positif (redressement en cours) → 0 (neutre) :
  //    on ne récompense pas une base de capital inexistante, mais on ne punit
  //    pas non plus une entreprise qui regagne de l'argent.
  const roe =
    b.equity > 0 ? is.netIncome / b.equity : is.netIncome < 0 ? -1 : 0;
  return {
    profitability: is.revenue > 0 ? is.netIncome / is.revenue : 0,
    returnOnCapitalEmployed: roce,
    returnOnEquity: roe,
    leverage: roe - roce,
    debtToEquity: b.equity > 0 ? b.financialDebt / b.equity : 0,
    assetTurnover: totalAssets > 0 ? is.revenue / totalAssets : 0,
  };
}
