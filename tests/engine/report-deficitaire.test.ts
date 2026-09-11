import { describe, expect, it } from "vitest";
import { computeFinance, type FinanceInput } from "../../src/engine/finance/statements";
import type { BalanceSheet } from "../../src/engine/types";

/**
 * Report en avant des pertes (report déficitaire, doc 02 ; V2 couche 2, #4).
 *
 * Une perte n'est pas perdue : elle constitue un déficit reportable qui
 * s'impute sur les bénéfices imposables des tours suivants AVANT le calcul de
 * l'impôt. Report intégral et illimité (le plafond réel ne se déclenche jamais
 * à l'échelle du jeu). Ce test vérifie le calcul isolément, indépendamment du
 * snapshot d'ensemble de la partie.
 */

const opening: BalanceSheet = {
  fixedAssetsNet: 100000,
  inventoryValue: 0,
  receivables: 0,
  cash: 45000,
  equity: 100000,
  financialDebt: 45000,
  payables: 0,
  overdraft: 0,
};

/** Tour de référence bénéficiaire : pretaxIncome = 59 100 (cf. finance.test.ts). */
const profit: FinanceInput = {
  opening,
  roundDays: 90,
  revenue: 200000,
  receivableRatio: 0.5,
  purchases: 60000,
  payableRatio: 30 / 90,
  otherVariableCash: 30000,
  inventoryChange: 15000,
  cogs: 75000,
  marketingCost: 10000,
  qualityCost: 0,
  maintenanceCost: 0,
  fixedCosts: 50000,
  depreciation: 5000,
  loanAnnualRate: 0.08,
  overdraftAnnualRate: 0.12,
  interestMultiplier: 1,
  taxRate: 0.25,
  vatRate: 0,
  newLoan: 0,
  loanRepayment: 0,
  capitalIncrease: 0,
  investmentOutlay: 0,
};

/** Même tour rendu déficitaire par un CA effondré : pretaxIncome = −40 900. */
const loss: FinanceInput = { ...profit, revenue: 100000 };

describe("report déficitaire", () => {
  it("sans déficit reporté, l'impôt et le stock sont inchangés", () => {
    const out = computeFinance(profit);
    expect(out.incomeStatement.tax).toBeCloseTo(14775, 6);
    expect(out.incomeStatement.taxLossUsed).toBeUndefined();
    expect(out.taxLossCarryforward).toBe(0);
  });

  it("une perte ne paie pas d'impôt et crée un déficit reportable égal à la perte", () => {
    const out = computeFinance(loss);
    expect(out.incomeStatement.pretaxIncome).toBeCloseTo(-40900, 6);
    expect(out.incomeStatement.tax).toBe(0);
    expect(out.incomeStatement.taxLossUsed).toBeUndefined();
    expect(out.taxLossCarryforward).toBeCloseTo(40900, 6);
  });

  it("report intégral : un déficit ≥ bénéfice annule l'impôt et s'impute d'autant", () => {
    const out = computeFinance({ ...profit, openingTaxLossCarryforward: 100000 });
    expect(out.incomeStatement.tax).toBe(0);
    expect(out.incomeStatement.taxLossUsed).toBeCloseTo(59100, 6);
    // netIncome = pretaxIncome (aucun impôt), le déficit restant est reporté.
    expect(out.incomeStatement.netIncome).toBeCloseTo(59100, 6);
    expect(out.taxLossCarryforward).toBeCloseTo(40900, 6);
  });

  it("report partiel : un déficit < bénéfice ne taxe que le reliquat et épuise le stock", () => {
    const out = computeFinance({ ...profit, openingTaxLossCarryforward: 20000 });
    // base imposable = 59 100 − 20 000 = 39 100 → IS = 9 775
    expect(out.incomeStatement.taxLossUsed).toBeCloseTo(20000, 6);
    expect(out.incomeStatement.tax).toBeCloseTo(9775, 6);
    expect(out.taxLossCarryforward).toBe(0);
  });

  it("un tour déficitaire cumule l'ancien déficit et la perte du tour", () => {
    const out = computeFinance({ ...loss, openingTaxLossCarryforward: 10000 });
    expect(out.incomeStatement.tax).toBe(0);
    expect(out.incomeStatement.taxLossUsed).toBeUndefined();
    // 10 000 déjà reportés + 40 900 de perte du tour.
    expect(out.taxLossCarryforward).toBeCloseTo(50900, 6);
  });
});
