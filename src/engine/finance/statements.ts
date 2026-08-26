import type { BalanceSheet, CashFlowItem, IncomeStatement } from "../types";

/**
 * États financiers d'un tour (doc 02 §6). Construction comptable cohérente :
 * le bilan de clôture équilibre par construction (invariant testé, doc 09).
 * Année commerciale de 360 jours pour les prorata de taux et de délais.
 */

export interface FinanceInput {
  opening: BalanceSheet;
  roundDays: number;
  revenue: number;
  /** Ratio de CA encaissé à crédit : Σ(CA segment × min(1, délai/jours du tour)) / CA. */
  receivableRatio: number;
  /** Achats de matières du tour (consommées à la production). */
  purchases: number;
  payableRatio: number; // min(1, délai fournisseur / jours du tour)
  /** Autres coûts variables décaissés (MOD, énergie). */
  otherVariableCash: number;
  /** Variation de stock de produits finis valorisée (production stockée). */
  inventoryChange: number;
  /** Coût variable des unités vendues (CUMP). */
  cogs: number;
  marketingCost: number;
  qualityCost: number;
  maintenanceCost: number;
  fixedCosts: number;
  depreciation: number;
  loanAnnualRate: number;
  overdraftAnnualRate: number;
  interestMultiplier: number; // événements (hausse des taux)
  taxRate: number;
  /** Taux de TVA (0 = désactivée) — voir EngineScenarioConfig.finance.vatRate. */
  vatRate: number;
  newLoan: number;
  loanRepayment: number;
  /** Apport en capital du tour (trésorerie et capitaux propres). */
  capitalIncrease: number;
  /** Investissement du tour : décaissé et immobilisé immédiatement. */
  investmentOutlay: number;
}

export interface FinanceOutput {
  incomeStatement: IncomeStatement;
  closing: BalanceSheet;
  cashFlow: { opening: number; items: CashFlowItem[]; closing: number };
}

export function computeFinance(input: FinanceInput): FinanceOutput {
  const o = input.opening;
  const periodFraction = input.roundDays / 360;

  // --- Compte de résultat -------------------------------------------------
  const variableProductionCost = input.purchases + input.otherVariableCash;
  const grossMargin = input.revenue - input.cogs;
  const ebitda =
    grossMargin -
    input.marketingCost -
    input.qualityCost -
    input.maintenanceCost -
    input.fixedCosts;
  const depreciation = Math.min(input.depreciation, o.fixedAssetsNet);
  const operatingIncome = ebitda - depreciation;
  const interest =
    (o.financialDebt * input.loanAnnualRate + o.overdraft * input.overdraftAnnualRate) *
    periodFraction *
    input.interestMultiplier;
  const pretaxIncome = operatingIncome - interest;
  const tax = input.taxRate * Math.max(0, pretaxIncome);
  const netIncome = pretaxIncome - tax;

  const incomeStatement: IncomeStatement = {
    revenue: input.revenue,
    productionStocked: input.inventoryChange,
    cogs: input.cogs,
    variableProductionCost,
    grossMargin,
    marketingCost: input.marketingCost,
    qualityCost: input.qualityCost,
    maintenanceCost: input.maintenanceCost,
    fixedCosts: input.fixedCosts,
    ebitda,
    depreciation,
    operatingIncome,
    interest,
    pretaxIncome,
    tax,
    netIncome,
  };

  // --- Créances, dettes fournisseurs, TVA, flux de trésorerie -------------
  // TVA : le compte de résultat reste HT ; créances et dettes deviennent TTC,
  // la TVA nette du tour (collectée − déductible sur achats) est décaissée au
  // tour SUIVANT — c'est une dette d'exploitation, elle pèse sur le BFR.
  const vat = input.vatRate;
  const openingVat = o.vatLiability ?? 0;
  const receivablesEnd = input.revenue * (1 + vat) * input.receivableRatio;
  const collections = input.revenue * (1 + vat) + o.receivables - receivablesEnd;
  const payablesEnd = input.purchases * (1 + vat) * input.payableRatio;
  const supplierPayments = input.purchases * (1 + vat) + o.payables - payablesEnd;
  const vatDue = vat * (input.revenue - input.purchases); // négatif = crédit de TVA
  const loanRepayment = Math.min(input.loanRepayment, o.financialDebt);

  const items: CashFlowItem[] = [
    { label: "encaissements_clients", amount: collections },
    { label: "paiements_fournisseurs", amount: -supplierPayments },
    { label: "couts_variables_decaisses", amount: -input.otherVariableCash },
    { label: "couts_fixes", amount: -input.fixedCosts },
    { label: "marketing", amount: -input.marketingCost },
    { label: "qualite", amount: -input.qualityCost },
    { label: "maintenance", amount: -input.maintenanceCost },
    { label: "interets", amount: -interest },
    { label: "impot", amount: -tax },
    { label: "tva_decaissee", amount: -openingVat },
    { label: "investissement", amount: -input.investmentOutlay },
    { label: "nouvel_emprunt", amount: input.newLoan },
    { label: "augmentation_capital", amount: input.capitalIncrease },
    { label: "remboursement_emprunt", amount: -loanRepayment },
  ].filter((i) => i.amount !== 0);

  const netFlow = items.reduce((s, i) => s + i.amount, 0);
  const openingNet = o.cash - o.overdraft;
  const closingNet = openingNet + netFlow;

  // --- Bilan de clôture ---------------------------------------------------
  const closing: BalanceSheet = {
    fixedAssetsNet: o.fixedAssetsNet - depreciation + input.investmentOutlay,
    inventoryValue: o.inventoryValue + input.inventoryChange,
    receivables: receivablesEnd,
    cash: Math.max(0, closingNet),
    equity: o.equity + netIncome + input.capitalIncrease,
    financialDebt: o.financialDebt + input.newLoan - loanRepayment,
    payables: payablesEnd,
    overdraft: Math.max(0, -closingNet),
    vatLiability: vatDue,
  };

  return {
    incomeStatement,
    closing,
    cashFlow: { opening: openingNet, items, closing: closingNet },
  };
}

/** Total actif = total passif (contrôle d'équilibre, testé au centime). */
export function balanceGap(b: BalanceSheet): number {
  const assets = b.fixedAssetsNet + b.inventoryValue + b.receivables + b.cash;
  const liabilities =
    b.equity + b.financialDebt + b.payables + b.overdraft + (b.vatLiability ?? 0);
  return assets - liabilities;
}
