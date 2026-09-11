import { describe, expect, it } from "vitest";
import {
  BPI_DIMENSIONS,
  computeRoundScores,
  gameBpi,
  normalizeToBenchmark,
  peerPercentile,
  strategyCoherence,
} from "../src/scoring/bpi";
import { novaScenario } from "../src/config/scenarios/nova";
import type { CompanyRoundResult, RoundDecisions } from "../src/engine/types";

/** Résultat synthétique minimal pour le scoring (les champs consommés seulement). */
function fakeResult(over: {
  operatingIncome?: number;
  netIncome?: number;
  revenue?: number;
  netTreasury?: number;
  overdraft?: number;
  totalShare?: number;
  utilization?: number;
  roe?: number;
  sold?: number;
  lost?: number;
}): CompanyRoundResult {
  return {
    companyId: "x",
    incomeStatement: {
      operatingIncome: over.operatingIncome ?? 20000,
      netIncome: over.netIncome ?? 15000,
      revenue: over.revenue ?? 300000,
    },
    balanceSheet: { overdraft: over.overdraft ?? 0 },
    functionalBalance: { netTreasury: over.netTreasury ?? 20000 },
    ratios: { returnOnEquity: over.roe ?? 0.03 },
    market: {
      totalShare: over.totalShare ?? 0.28,
      bySegment: {
        s: { demandForCompany: (over.sold ?? 4000) + (over.lost ?? 0), sold: over.sold ?? 4000, lost: over.lost ?? 0 },
      },
    },
    production: { utilizationRate: over.utilization ?? 0.8 },
  } as unknown as CompanyRoundResult;
}

const decisions = (over: Partial<RoundDecisions> = {}): RoundDecisions => ({
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
  ...over,
});

const noPedagogy = { situationScores: [], diagnosisScores: [] };

describe("normalisation (doc 08 §1.1)", () => {
  it("bornée et monotone : min → 0, cible → 100", () => {
    const bounds = { min: -50000, target: 45000 };
    expect(normalizeToBenchmark(-50000, bounds)).toBe(0);
    expect(normalizeToBenchmark(45000, bounds)).toBe(100);
    expect(normalizeToBenchmark(-100000, bounds)).toBe(0); // borné
    expect(normalizeToBenchmark(90000, bounds)).toBe(100); // borné
    expect(normalizeToBenchmark(0, bounds)).toBeGreaterThan(normalizeToBenchmark(-10000, bounds));
  });
  it("percentile parmi les pairs : premier = 100, dernier = 0, seul = 100", () => {
    expect(peerPercentile(30, [10, 20, 30])).toBe(100);
    expect(peerPercentile(10, [10, 20, 30])).toBe(0);
    expect(peerPercentile(20, [10, 20, 30])).toBe(50);
    expect(peerPercentile(42, [42])).toBe(100);
  });
});

describe("cohérence stratégique (doc 08 §1.3)", () => {
  it("pénalise le premium sans budget qualité", () => {
    const base = strategyCoherence({
      scenario: novaScenario,
      decisions: decisions({ price: 76, qualityBudget: 9000 }),
      result: fakeResult({}),
    });
    const incoherent = strategyCoherence({
      scenario: novaScenario,
      decisions: decisions({ price: 76, qualityBudget: 0 }),
      result: fakeResult({}),
    });
    expect(incoherent).toBeLessThan(base);
  });
  it("pénalise le marketing massif en pleine rupture", () => {
    const ok = strategyCoherence({
      scenario: novaScenario,
      decisions: decisions({ marketingBudget: 15000 }),
      result: fakeResult({ sold: 4000, lost: 100 }),
    });
    const bad = strategyCoherence({
      scenario: novaScenario,
      decisions: decisions({ marketingBudget: 15000 }),
      result: fakeResult({ sold: 4000, lost: 1500 }),
    });
    expect(bad).toBeLessThan(ok);
  });
  it("récompense le pilotage bénéficiaire ET liquide", () => {
    const healthy = strategyCoherence({
      scenario: novaScenario,
      decisions: decisions(),
      result: fakeResult({ netIncome: 10000, netTreasury: 5000 }),
    });
    const illiquid = strategyCoherence({
      scenario: novaScenario,
      decisions: decisions(),
      result: fakeResult({ netIncome: 10000, netTreasury: -5000 }),
    });
    expect(healthy).toBeGreaterThan(illiquid);
  });
});

describe("BPI d'un tour (doc 08 §1)", () => {
  it("7 dimensions dans [0,100], BPI pondéré, la meilleure entreprise domine", () => {
    const scores = computeRoundScores(novaScenario, [
      {
        companyId: "forte",
        decisions: decisions(),
        result: fakeResult({ operatingIncome: 40000, revenue: 380000, netTreasury: 60000, roe: 0.05, totalShare: 0.3, utilization: 0.85 }),
        pedagogy: { situationScores: [0.8], diagnosisScores: [1] },
      },
      {
        companyId: "faible",
        decisions: decisions(),
        result: fakeResult({ operatingIncome: -30000, netIncome: -30000, revenue: 180000, netTreasury: -40000, roe: -0.06, totalShare: 0.15, utilization: 0.5 }),
        pedagogy: noPedagogy,
      },
    ]);
    for (const s of scores) {
      for (const d of BPI_DIMENSIONS) {
        expect(s.normalized[d]).toBeGreaterThanOrEqual(0);
        expect(s.normalized[d]).toBeLessThanOrEqual(100);
      }
      expect(s.bpi).toBeGreaterThanOrEqual(0);
      expect(s.bpi).toBeLessThanOrEqual(100);
    }
    const forte = scores.find((s) => s.companyId === "forte")!;
    const faible = scores.find((s) => s.companyId === "faible")!;
    expect(forte.bpi).toBeGreaterThan(faible.bpi);
  });

  it("la maîtrise des modèles est neutre (50) sans situation ce tour (bots)", () => {
    const [only] = computeRoundScores(novaScenario, [
      { companyId: "bot", decisions: decisions(), result: fakeResult({}), pedagogy: noPedagogy },
    ]);
    expect(only!.raw.decision_mastery).toBe(50);
  });

  it("le score n'est PAS le seul résultat financier (§21) : la pédagogie pèse", () => {
    const make = (situationScores: number[]) =>
      computeRoundScores(novaScenario, [
        { companyId: "a", decisions: decisions(), result: fakeResult({}), pedagogy: { situationScores, diagnosisScores: [] } },
      ])[0]!.bpi;
    expect(make([1])).toBeGreaterThan(make([0]));
  });
});

describe("BPI de partie (doc 08 §1.4)", () => {
  it("poids croissants : le dernier tour pèse plus que le premier", () => {
    // [tour 1 : 0, tour 2 : 100] → le 100 final domine : BPI > 50
    expect(
      gameBpi([
        { index: 1, bpi: 0 },
        { index: 2, bpi: 100 },
      ]),
    ).toBeCloseTo((1 / 3) * 0 + (2 / 3) * 100, 9);
    expect(
      gameBpi([
        { index: 1, bpi: 100 },
        { index: 2, bpi: 0 },
      ]),
    ).toBeCloseTo((1 / 3) * 100, 9);
    expect(
      gameBpi([
        { index: 1, bpi: 60 },
        { index: 2, bpi: 60 },
        { index: 3, bpi: 60 },
      ]),
    ).toBeCloseTo(60, 9);
    expect(gameBpi([])).toBe(0);
  });

  it("poids par indice RÉEL : un tour sauté ne décale pas les suivants", () => {
    // Tours joués 1 et 3 (le 2 sauté). Le tour 3 pèse 3, pas 2.
    // Σ des indices présents = 1 + 3 = 4.
    expect(
      gameBpi([
        { index: 1, bpi: 0 },
        { index: 3, bpi: 100 },
      ]),
    ).toBeCloseTo((1 / 4) * 0 + (3 / 4) * 100, 9); // 75, et non 66,7 (ancien calcul par position)
  });
});
