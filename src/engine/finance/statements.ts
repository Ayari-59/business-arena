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
  newLoan: number;
  loanRepayment: number;
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

  // --- Créances, dettes fournisseurs, flux de trésorerie ------------------
  const receivablesEnd = input.revenue * input.receivableRatio;
  const collections = input.revenue + o.receivables - receivablesEnd;
  const payablesEnd = input.purchases * input.payableRatio;
  const supplierPayments = input.purchases + o.payables - payablesEnd;
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
    { label: "nouvel_emprunt", amount: input.newLoan },
    { label: "remboursement_emprunt", amount: -loanRepayment },
  ].filter((i) => i.amount !== 0);

  const netFlow = items.reduce((s, i) => s + i.amount, 0);
  const openingNet = o.cash - o.overdraft;
  const closingNet = openingNet + netFlow;

  // --- Bilan de clôture ---------------------------------------------------
  const closing: BalanceSheet = {
    fixedAssetsNet: o.fixedAssetsNet - depreciation,
    inventoryValue: o.inventoryValue + input.inventoryChange,
    receivables: receivablesEnd,
    cash: Math.max(0, closingNet),
    equity: o.equity + netIncome,
    financialDebt: o.financialDebt + input.newLoan - loanRepayment,
    payables: payablesEnd,
    overdraft: Math.max(0, -closingNet),
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
  const liabilities = b.equity + b.financialDebt + b.payables + b.overdraft;
  return assets - liabilities;
}
