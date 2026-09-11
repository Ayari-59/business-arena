import { describe, expect, it, vi } from "vitest";
import {
  BPI_V2_DIMENSIONS,
  computeRoundScoresV2,
  financialV2Score,
  peerPercentile,
  scoringWeightsV2,
  type PedagogyInputsV2,
} from "../src/scoring/bpi";
import { novaScenario } from "../src/config/scenarios/nova";
import type { CompanyRoundResult } from "../src/engine/types";

// coherencePivots vit dans le service (qui importe @/db) : on neutralise la base
// pour tester la fonction pure sans connexion.
vi.mock("@/db", () => ({ db: {} }));
const { coherencePivots } = await import("../src/services/scoring.service");

/**
 * BPI v2 (V1-2) : base zéro, ex æquo au même percentile, finance en variation,
 * une équipe silencieuse ne peut pas primer. On rejoue notamment le scénario du
 * diagnostic (4 équipes identiques au T1) pour verrouiller l'égalité.
 */

function fakeResult(over: {
  operatingIncome?: number;
  netIncome?: number;
  revenue?: number;
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
    balanceSheet: { overdraft: 0 },
    functionalBalance: { netTreasury: 20000 },
    ratios: { returnOnEquity: over.roe ?? 0.03 },
    market: {
      totalShare: over.totalShare ?? 0.28,
      bySegment: {
        s: {
          demandForCompany: (over.sold ?? 4000) + (over.lost ?? 0),
          sold: over.sold ?? 4000,
          lost: over.lost ?? 0,
        },
      },
    },
    production: { utilizationRate: over.utilization ?? 0.8 },
  } as unknown as CompanyRoundResult;
}

const ped = (over: Partial<PedagogyInputsV2> = {}): PedagogyInputsV2 => ({
  situationScores: [],
  carried: false,
  coherence: null,
  previousNetIncome: 0,
  ...over,
});

describe("performance financière v2 : sur la variation, plancher 20 sur une perte", () => {
  it("une perte plafonne à 20, quelle que soit la trésorerie", () => {
    expect(financialV2Score(fakeResult({ netIncome: -30000, revenue: 180000 }), -50000)).toBe(20);
    expect(financialV2Score(fakeResult({ netIncome: -1, revenue: 300000 }), 0)).toBe(20);
  });
  it("un résultat en hausse marque plus qu'un résultat en baisse", () => {
    const hausse = financialV2Score(fakeResult({ netIncome: 40000, revenue: 300000 }), 10000);
    const stable = financialV2Score(fakeResult({ netIncome: 10000, revenue: 300000 }), 10000);
    const baisse = financialV2Score(fakeResult({ netIncome: 10000, revenue: 300000 }), 40000);
    expect(stable).toBeCloseTo(50, 6); // aucune variation → milieu
    expect(hausse).toBeGreaterThan(stable);
    expect(baisse).toBeLessThan(stable);
  });
  it("ne dépend plus du niveau absolu : même variation, même note", () => {
    const a = financialV2Score(fakeResult({ netIncome: 20000, revenue: 300000 }), 10000);
    const b = financialV2Score(fakeResult({ netIncome: 120000, revenue: 300000 }), 110000);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe("cohérence des pivots (base zéro, sur les décisions éditées)", () => {
  const source = (over: Partial<Record<"price" | "productionPlan", "edited" | "default" | "carried">> = {}) => ({
    price: "default" as const,
    productionPlan: "default" as const,
    ...over,
  });
  const dec = { price: 60, productionPlan: 5000 } as never;
  const prop = { price: 59, productionPlan: 4800 } as never;

  it("null quand le tour ne suggère aucun levier pivot", () => {
    expect(
      coherencePivots({ levers: [{ field: "marketingBudget", direction: "up" }], source: source(), decisions: dec, proposed: prop }),
    ).toBeNull();
    expect(coherencePivots({ levers: [], source: source(), decisions: dec, proposed: prop })).toBeNull();
  });

  it("ne compte que les pivots ÉDITÉS dans le bon sens", () => {
    // prix édité à la hausse, attendu à la hausse → 1/1
    expect(
      coherencePivots({ levers: [{ field: "price", direction: "up" }], source: source({ price: "edited" }), decisions: dec, proposed: prop }),
    ).toBe(100);
    // prix seulement validé par défaut → 0
    expect(
      coherencePivots({ levers: [{ field: "price", direction: "up" }], source: source(), decisions: dec, proposed: prop }),
    ).toBe(0);
    // édité mais dans le mauvais sens → 0
    expect(
      coherencePivots({ levers: [{ field: "price", direction: "down" }], source: source({ price: "edited" }), decisions: dec, proposed: prop }),
    ).toBe(0);
    // « review » : tout changement compte
    expect(
      coherencePivots({ levers: [{ field: "productionPlan", direction: "review" }], source: source({ productionPlan: "edited" }), decisions: dec, proposed: prop }),
    ).toBe(100);
  });

  it("deux leviers, un seul satisfait → 50", () => {
    expect(
      coherencePivots({
        levers: [
          { field: "price", direction: "up" },
          { field: "productionPlan", direction: "up" },
        ],
        source: source({ price: "edited" }), // volume resté par défaut
        decisions: dec,
        proposed: prop,
      }),
    ).toBe(50);
  });
});

describe("scores v2 d'un tour", () => {
  it("six dimensions, toutes dans [0,100]", () => {
    const [s] = computeRoundScoresV2(novaScenario, [
      { companyId: "a", result: fakeResult({}), pedagogy: ped({ situationScores: [0.8] }) },
    ]);
    expect(Object.keys(s!.raw).sort()).toEqual([...BPI_V2_DIMENSIONS].sort());
    for (const d of BPI_V2_DIMENSIONS) {
      expect(s!.normalized[d]).toBeGreaterThanOrEqual(0);
      expect(s!.normalized[d]).toBeLessThanOrEqual(100);
    }
  });

  it("base zéro : sans situation ni décision éditée, maîtrise et cohérence à 0", () => {
    const [s] = computeRoundScoresV2(novaScenario, [
      { companyId: "vide", result: fakeResult({}), pedagogy: ped() },
    ]);
    expect(s!.raw.decision_mastery).toBe(0);
    // pilotage = 0,5 × opérationnel + 0,5 × 0 : borné par la seule exécution
    expect(s!.raw.pilotage).toBeLessThanOrEqual(50);
  });

  it("une équipe reconduite est à 0 en maîtrise et en cohérence de pilotage", () => {
    const [s] = computeRoundScoresV2(novaScenario, [
      {
        companyId: "silencieuse",
        result: fakeResult({}),
        pedagogy: ped({ carried: true, coherence: 100, situationScores: [1] }),
      },
    ]);
    expect(s!.raw.decision_mastery).toBe(0); // reconduit ⇒ 0 même avec un score
    expect(s!.raw.pilotage).toBeLessThanOrEqual(50); // cohérence forcée à 0
  });

  it("les ex æquo partagent le même percentile (rang fractionnaire)", () => {
    expect(peerPercentile(-2060, [-2060, -2060, 500])).toBe(peerPercentile(-2060, [-2060, -2060, 500]));
    const [a, b] = computeRoundScoresV2(novaScenario, [
      { companyId: "a", result: fakeResult({ netIncome: -2060 }), pedagogy: ped() },
      { companyId: "b", result: fakeResult({ netIncome: -2060 }), pedagogy: ped() },
    ]);
    expect(a!.bpi).toBeCloseTo(b!.bpi, 9);
  });

  it("éditer les pivots dans le bon sens bat l'équipe qui a tout laissé par défaut, d'au moins 10 points", () => {
    const [edite, vide] = computeRoundScoresV2(novaScenario, [
      { companyId: "edite", result: fakeResult({}), pedagogy: ped({ coherence: 100 }) },
      { companyId: "vide", result: fakeResult({}), pedagogy: ped({ coherence: 0 }) },
    ]);
    expect(edite!.bpi - vide!.bpi).toBeGreaterThanOrEqual(10);
  });

  it("scénario du diagnostic : 4 équipes identiques au T1 ont le même BPI", () => {
    // 1 « valide vide » (coherence 0) + 3 silencieuses (carried) : décisions et
    // résultats identiques, aucune situation rendue → même BPI (± 0,5).
    const humaines = computeRoundScoresV2(novaScenario, [
      { companyId: "vide", result: fakeResult({ netIncome: -2060 }), pedagogy: ped({ coherence: 0 }) },
      { companyId: "s1", result: fakeResult({ netIncome: -2060 }), pedagogy: ped({ carried: true, coherence: 0 }) },
      { companyId: "s2", result: fakeResult({ netIncome: -2060 }), pedagogy: ped({ carried: true, coherence: 0 }) },
      { companyId: "s3", result: fakeResult({ netIncome: -2060 }), pedagogy: ped({ carried: true, coherence: 0 }) },
      // un bot avec d'autres chiffres : le percentile est calculé bots inclus
      { companyId: "bot", result: fakeResult({ netIncome: -30900, operatingIncome: -30000, revenue: 180000, roe: -0.06, totalShare: 0.15, utilization: 0.5 }), pedagogy: ped({ carried: true }) },
    ]);
    const bpis = humaines.filter((s) => s.companyId !== "bot").map((s) => s.bpi);
    for (const v of bpis) expect(v).toBeCloseTo(bpis[0]!, 1);
  });
});

describe("poids v2", () => {
  it("« pilotage » reçoit la somme stratégie + opérationnel, total = 1", () => {
    const w = scoringWeightsV2(novaScenario.scoring);
    expect(w.pilotage).toBeCloseTo(
      novaScenario.scoring.weights.strategy + novaScenario.scoring.weights.operational,
      9,
    );
    const total = Object.values(w).reduce((a, c) => a + c, 0);
    expect(total).toBeCloseTo(1, 6);
  });
});
