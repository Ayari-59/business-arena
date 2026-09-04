import { describe, expect, it } from "vitest";
import { balanceGap, computeFinance } from "../../src/engine/finance/statements";
import { computeFunctionalBalance } from "../../src/engine/finance/functional";
import { computeRatios } from "../../src/engine/finance/ratios";
import { irr, npv, paybackPeriod } from "../../src/engine/investment";
import type { BalanceSheet } from "../../src/engine/types";

/**
 * Cas de référence intégralement vérifiable à la main (doc 09 §1) —
 * c'est aussi le mini-cas « rentable mais illiquide » du §16.
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

const roundInput = {
  opening,
  roundDays: 90,
  revenue: 200000,
  receivableRatio: 0.5, // la moitié du CA à 45 j+ → créances 100 000
  purchases: 60000,
  payableRatio: 30 / 90, // fournisseurs à 30 j → dettes 20 000
  otherVariableCash: 30000,
  inventoryChange: 15000, // production stockée
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

describe("compte de résultat et bilan (doc 02 §6)", () => {
  const out = computeFinance(roundInput);

  it("compte de résultat exact au centime", () => {
    const is = out.incomeStatement;
    expect(is.grossMargin).toBe(125000); // 200 000 − 75 000
    expect(is.ebitda).toBe(65000); // − 10 000 − 50 000
    expect(is.operatingIncome).toBe(60000); // − 5 000
    expect(is.interest).toBeCloseTo(900, 9); // 45 000 × 8 % × 90/360
    expect(is.pretaxIncome).toBeCloseTo(59100, 9);
    expect(is.tax).toBeCloseTo(14775, 9);
    expect(is.netIncome).toBeCloseTo(44325, 9);
  });

  it("flux de trésorerie : pont exact et découvert automatique", () => {
    // encaissements 100 000 ; décaissements 40 000 + 30 000 + 50 000 + 10 000 + 900 + 14 775
    const net = out.cashFlow.items.reduce((s, i) => s + i.amount, 0);
    expect(net).toBeCloseTo(-45675, 9);
    expect(out.cashFlow.closing).toBeCloseTo(-675, 9);
    expect(out.closing.cash).toBe(0);
    expect(out.closing.overdraft).toBeCloseTo(675, 9);
  });

  it("le bilan de clôture équilibre au centime", () => {
    expect(Math.abs(balanceGap(out.closing))).toBeLessThan(0.01);
    expect(out.closing.equity).toBeCloseTo(144325, 9);
    expect(out.closing.receivables).toBeCloseTo(100000, 9);
    expect(out.closing.payables).toBeCloseTo(20000, 9);
    expect(out.closing.inventoryValue).toBeCloseTo(15000, 9);
  });
});

describe("FRNG / BFR / trésorerie nette (§16)", () => {
  const out = computeFinance(roundInput);
  const fb = computeFunctionalBalance(out.closing);

  it("FRNG et BFR conformes aux définitions", () => {
    expect(fb.frng).toBeCloseTo(144325 + 45000 - 95000, 9); // 94 325
    expect(fb.bfr).toBeCloseTo(15000 + 100000 - 20000, 9); // 95 000
  });
  it("invariant : TN = FRNG − BFR = disponibilités − concours bancaires", () => {
    expect(fb.netTreasury).toBeCloseTo(fb.frng - fb.bfr, 9);
    expect(fb.netTreasury).toBeCloseTo(out.closing.cash - out.closing.overdraft, 9);
  });
  it("reproduit « rentable mais en difficulté de trésorerie » (§16)", () => {
    expect(out.incomeStatement.netIncome).toBeGreaterThan(0);
    expect(fb.netTreasury).toBeLessThan(0); // le BFR de croissance a absorbé le FRNG
  });
});

describe("ratios et effet de levier (§17)", () => {
  const out = computeFinance(roundInput);
  const ratios = computeRatios(out.incomeStatement, out.closing, 0.25);

  it("profitabilité, Re, Rf calculés sur les bons agrégats", () => {
    expect(ratios.profitability).toBeCloseTo(44325 / 200000, 9);
    expect(ratios.returnOnCapitalEmployed).toBeCloseTo((60000 * 0.75) / (144325 + 45000), 9);
    expect(ratios.returnOnEquity).toBeCloseTo(44325 / 144325, 9);
    expect(ratios.leverage).toBeCloseTo(ratios.returnOnEquity - ratios.returnOnCapitalEmployed, 9);
  });
  it("levier positif quand Re > coût de la dette (dette bon marché)", () => {
    expect(ratios.leverage).toBeGreaterThan(0);
  });
});

describe("ROE quand les capitaux propres sont effacés (§17)", () => {
  // Bilan d'une entreprise dont les pertes cumulées ont dépassé le capital :
  // capitaux propres négatifs. `computeFinance` ne plancherise pas les CP
  // (statements.ts), donc ce cas est atteignable en partie réelle.
  const insolvent: BalanceSheet = {
    fixedAssetsNet: 50000,
    inventoryValue: 0,
    receivables: 0,
    cash: 0,
    equity: -20000,
    financialDebt: 60000,
    payables: 0,
    overdraft: 0,
  };

  it("CP ≤ 0 avec perte → −100 % (plancher), pas 0 (neutre)", () => {
    // Sans garde, une perte sur des CP négatifs donnerait un ratio POSITIF
    // (−10000 ÷ −20000 = +0,5), qui se lirait comme une réussite.
    const is = { revenue: 40000, operatingIncome: -8000, netIncome: -10000 } as never;
    const ratios = computeRatios(is, insolvent, 0.25);
    expect(ratios.returnOnEquity).toBe(-1);
  });

  it("CP ≤ 0 mais résultat positif (redressement) → 0 (neutre)", () => {
    const is = { revenue: 40000, operatingIncome: 3000, netIncome: 2000 } as never;
    const ratios = computeRatios(is, insolvent, 0.25);
    expect(ratios.returnOnEquity).toBe(0);
  });
});

describe("VAN, TRI, délai de récupération (doc 02 §6.5)", () => {
  it("VAN à taux nul = somme des flux ; VAN connue à 10 %", () => {
    expect(npv([-100, 60, 60], 0)).toBeCloseTo(20, 9);
    expect(npv([-100, 110], 0.1)).toBeCloseTo(0, 9);
    expect(npv([-1000, 500, 500, 500], 0.1)).toBeCloseTo(
      -1000 + 500 / 1.1 + 500 / 1.21 + 500 / 1.331,
      9,
    );
  });
  it("TRI : VAN(TRI) ≈ 0 ; null si aucun TRI réel", () => {
    expect(irr([-100, 110])!).toBeCloseTo(0.1, 5);
    const r = irr([-1000, 500, 500, 500])!;
    expect(Math.abs(npv([-1000, 500, 500, 500], r))).toBeLessThan(1e-4);
    expect(irr([-100, -50])).toBeNull();
  });
  it("délai de récupération avec interpolation", () => {
    expect(paybackPeriod([-100, 60, 60])).toBeCloseTo(1 + 40 / 60, 9);
    expect(paybackPeriod([-100, 20, 20])).toBeNull();
  });
});
