import { describe, expect, it } from "vitest";
import { computeProduction, computeProducedQuality } from "../../src/engine/production";
import { addToStock, removeFromStock } from "../../src/engine/inventory/cump";
import {
  contributionMarginRate,
  incrementalContribution,
  marginRate,
  markupRate,
  unitContributionMargin,
  unitVariableCost,
} from "../../src/engine/costs";
import { computeBreakeven, deadPointDay } from "../../src/engine/costs/breakeven";

describe("production sous contraintes (§13)", () => {
  const base = {
    planned: 10000,
    machineCapacity: 5500,
    availability: 1,
    headcount: 4,
    hoursPerEmployee: 450,
    productivity: 1,
    hoursPerUnit: 0.3, // capacité MOD = 4×450/0.3 = 6000 u
  };
  it("jamais plus que la capacité machine", () => {
    expect(computeProduction(base).produced).toBe(5500);
  });
  it("la disponibilité dégrade la capacité machine", () => {
    expect(computeProduction({ ...base, availability: 0.8 }).produced).toBe(4400);
  });
  it("la main-d'œuvre peut être la contrainte active", () => {
    const r = computeProduction({ ...base, machineCapacity: 20000 });
    expect(r.produced).toBe(6000); // contrainte MOD
    expect(r.laborCapacity).toBe(6000);
  });
  it("le plan du joueur est respecté quand il est sous les capacités", () => {
    expect(computeProduction({ ...base, planned: 3000 }).produced).toBe(3000);
  });
  it("taux d'utilisation = production / capacité machine effective", () => {
    const r = computeProduction({ ...base, planned: 2750 });
    expect(r.utilizationRate).toBeCloseTo(0.5, 9);
  });
  it("la surchauffe (> 95 %) dégrade la qualité produite", () => {
    const calm = computeProducedQuality({ qualityBudget: 0, qualitySensitivity: 0.2, qualityScale: 1000, utilizationRate: 0.8 });
    const hot = computeProducedQuality({ qualityBudget: 0, qualitySensitivity: 0.2, qualityScale: 1000, utilizationRate: 1 });
    expect(hot).toBeLessThan(calm);
  });
});

describe("stocks au CUMP (doc 02 §5)", () => {
  it("CUMP sur deux entrées à coûts différents, vérifiable à la main", () => {
    let stock = { quantity: 100, unitCost: 10 };
    stock = addToStock(stock, 50, 16);
    // (100×10 + 50×16) / 150 = 1800/150 = 12
    expect(stock.unitCost).toBeCloseTo(12, 9);
    const { stock: after, cost } = removeFromStock(stock, 60);
    expect(cost).toBeCloseTo(720, 9);
    expect(after.quantity).toBe(90);
    expect(after.unitCost).toBeCloseTo(12, 9);
  });
  it("on ne sort jamais plus que le stock disponible", () => {
    const { stock, cost } = removeFromStock({ quantity: 10, unitCost: 5 }, 25);
    expect(stock.quantity).toBe(0);
    expect(cost).toBe(50);
  });
});

describe("coûts, marges (doc 02 §5)", () => {
  it("marges et taux — cas NOVA : prix 59, coût variable 38", () => {
    const uvc = unitVariableCost(22, 16); // matières 22 + autres 16
    expect(uvc).toBe(38);
    expect(unitContributionMargin(59, uvc)).toBe(21);
    expect(contributionMarginRate(59, uvc)).toBeCloseTo(21 / 59, 9);
    expect(markupRate(59, 38)).toBeCloseTo(21 / 38, 9); // taux de marge
    expect(marginRate(59, 38)).toBeCloseTo(21 / 59, 9); // taux de marque
  });
  it("commande exceptionnelle (§7) : contributive malgré un prix < coût complet", () => {
    // uvc 38, coût complet 55 ; offre à 45 € pour 1 000 u sans fixes additionnels
    const contribution = incrementalContribution({
      offeredPrice: 45,
      quantity: 1000,
      uvc: 38,
      additionalFixedCosts: 0,
    });
    expect(contribution).toBe(7000); // le coût complet aurait fait refuser à tort
  });
});

describe("seuil de rentabilité (doc 02 §5, §15)", () => {
  it("cas NOVA vérifiable à la main : fixes 96 000, prix 59, uvc 38", () => {
    const r = computeBreakeven({ fixedCosts: 96000, price: 59, uvc: 38, revenue: 295000 });
    expect(r.breakEvenUnits).toBeCloseTo(96000 / 21, 6); // ≈ 4571,4
    expect(r.breakEvenRevenue).toBeCloseTo(96000 / (21 / 59), 6); // ≈ 269 714
    expect(r.safetyMargin).toBeCloseTo(295000 - 96000 / (21 / 59), 6);
    expect(r.safetyIndex).toBeCloseTo(r.safetyMargin / 295000, 9);
  });
  it("marge unitaire nulle ou négative ⇒ seuil inatteignable", () => {
    const r = computeBreakeven({ fixedCosts: 1000, price: 10, uvc: 12, revenue: 500 });
    expect(r.breakEvenUnits).toBe(Infinity);
  });
  it("point mort : jour où le CA cumulé atteint le seuil", () => {
    // seuil 60 000, CA 90 000 sur 90 jours ⇒ jour 60
    expect(deadPointDay({ breakEvenRevenue: 60000, revenue: 90000, roundDays: 90 })).toBeCloseTo(60, 9);
    expect(deadPointDay({ breakEvenRevenue: 100000, revenue: 90000, roundDays: 90 })).toBeNull();
  });
});
