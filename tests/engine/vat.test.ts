import { describe, expect, it } from "vitest";
import { balanceGap, computeFinance } from "../../src/engine/finance/statements";
import { computeFunctionalBalance } from "../../src/engine/finance/functional";
import type { BalanceSheet } from "../../src/engine/types";

/**
 * TVA (doc 02 §6) : le résultat reste HT ; créances et dettes deviennent TTC,
 * la TVA nette du tour est décaissée au tour suivant — une dette
 * d'exploitation qui pèse sur le BFR. Le bilan reste équilibré au centime.
 */

const opening: BalanceSheet = {
  fixedAssetsNet: 100000,
  inventoryValue: 20000,
  receivables: 0,
  cash: 50000,
  equity: 125000,
  financialDebt: 45000,
  payables: 0,
  overdraft: 0,
};

const baseInput = {
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
  vatRate: 0.2,
  newLoan: 0,
  loanRepayment: 0,
  capitalIncrease: 0,
  investmentOutlay: 0,
};

describe("TVA : comptes HT, flux TTC, dette de TVA", () => {
  const withVat = computeFinance(baseInput);
  const without = computeFinance({ ...baseInput, vatRate: 0 });

  it("le compte de résultat est rigoureusement identique avec ou sans TVA", () => {
    expect(withVat.incomeStatement).toEqual(without.incomeStatement);
  });

  it("créances et dettes fournisseurs deviennent TTC", () => {
    expect(withVat.closing.receivables).toBeCloseTo(200000 * 1.2 * 0.5, 6); // 120 000
    expect(withVat.closing.payables).toBeCloseTo(60000 * 1.2 * (30 / 90), 6); // 24 000
  });

  it("TVA nette du tour = 20 % × (CA − achats), au passif", () => {
    expect(withVat.closing.vatLiability).toBeCloseTo(0.2 * (200000 - 60000), 6); // 28 000
  });

  it("le bilan reste équilibré au centime et la TVA pèse sur le BFR", () => {
    expect(Math.abs(balanceGap(withVat.closing))).toBeLessThan(0.01);
    const fb = computeFunctionalBalance(withVat.closing);
    expect(fb.bfr).toBeCloseTo(
      withVat.closing.inventoryValue +
        withVat.closing.receivables -
        withVat.closing.payables -
        28000,
      6,
    );
    expect(fb.netTreasury).toBeCloseTo(
      withVat.closing.cash - withVat.closing.overdraft,
      6,
    );
  });

  it("au tour suivant, la TVA due est décaissée", () => {
    const next = computeFinance({ ...baseInput, opening: withVat.closing });
    const vatItem = next.cashFlow.items.find((i) => i.label === "tva_decaissee");
    expect(vatItem?.amount).toBeCloseTo(-28000, 6);
    expect(Math.abs(balanceGap(next.closing))).toBeLessThan(0.01);
  });

  it("un crédit de TVA (achats > ventes) est porté en négatif et augmente le BFR", () => {
    // cohérence production stockée : achats + charges variables = coût des ventes + Δstock
    const credit = computeFinance({
      ...baseInput,
      revenue: 30000,
      receivableRatio: 0,
      cogs: 15000,
      inventoryChange: 75000, // 60 000 + 30 000 − 15 000
    });
    expect(credit.closing.vatLiability).toBeCloseTo(0.2 * (30000 - 60000), 6); // −6 000
    expect(Math.abs(balanceGap(credit.closing))).toBeLessThan(0.01);
    const fb = computeFunctionalBalance(credit.closing);
    // la créance de TVA (dette négative) augmente le BFR
    expect(fb.bfr).toBeCloseTo(
      credit.closing.inventoryValue + credit.closing.receivables - credit.closing.payables + 6000,
      6,
    );
  });
});
