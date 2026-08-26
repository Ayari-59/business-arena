import { describe, expect, it } from "vitest";
import { computeHr } from "../../src/engine/hr";
import { simulateRound } from "../../src/engine/simulation";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * RH (doc 02 §4.1) : mouvements d'effectif à t+1, coûts à t, morale salariale,
 * formation à rendements décroissants, démission sous le seuil d'attrition —
 * et neutralité absolue pour qui ne touche à rien (bots, calibration).
 */

const HR = {
  salaryPerEmployeePerRound: 8000,
  includedHeadcount: 4,
  hiringCost: 3000,
  firingCost: 6000,
  trainingScale: 3000,
  trainingSensitivity: 0.05,
  maxProductivity: 1.25,
  moraleSensitivity: 0.5,
  attritionThreshold: 0.95,
  maxHiresPerRound: 3,
  maxHeadcount: 10,
};

describe("computeHr : règles unitaires", () => {
  it("sans décision et à l'effectif inclus : rigoureusement neutre", () => {
    const out = computeHr({ config: HR, decisions: undefined, headcount: 4, productivity: 1 });
    expect(out).toMatchObject({ morale: 1, cost: 0, nextHeadcount: 4, nextProductivity: 1 });
  });

  it("embauche : coût immédiat, effectif au tour suivant, masse salariale ensuite", () => {
    const out = computeHr({
      config: HR,
      decisions: { hire: 2 },
      headcount: 4,
      productivity: 1,
    });
    expect(out.cost).toBe(2 * 3000); // recrutement seul : les salaires courent à l'arrivée
    expect(out.nextHeadcount).toBe(6);
    // au tour suivant, 6 salariés dont 4 inclus → 2 salaires en plus
    const next = computeHr({ config: HR, decisions: {}, headcount: 6, productivity: 1 });
    expect(next.cost).toBe(2 * 8000);
  });

  it("licenciement : indemnité immédiate, économie de masse salariale ensuite", () => {
    const out = computeHr({ config: HR, decisions: { fire: 1 }, headcount: 4, productivity: 1 });
    expect(out.cost).toBe(6000);
    expect(out.nextHeadcount).toBe(3);
    const next = computeHr({ config: HR, decisions: {}, headcount: 3, productivity: 1 });
    expect(next.cost).toBe(-8000); // un salaire de moins que la structure de référence
  });

  it("sous-payer : morale dégradée, et sous le seuil, une démission par tour", () => {
    const out = computeHr({
      config: HR,
      decisions: { salaryIndex: 0.9 },
      headcount: 4,
      productivity: 1,
    });
    expect(out.morale).toBeCloseTo(1 + 0.5 * -0.1, 10); // 0,95
    expect(out.departed).toBe(1);
    expect(out.nextHeadcount).toBe(3);
    expect(out.cost).toBeCloseTo(4 * 8000 * 0.9 - 4 * 8000, 6); // économie… au prix du départ
    // à 0,96 (au-dessus du seuil 0,95) : personne ne part
    const mild = computeHr({
      config: HR,
      decisions: { salaryIndex: 0.96 },
      headcount: 4,
      productivity: 1,
    });
    expect(mild.departed).toBe(0);
  });

  it("formation : productivité au tour suivant, rendements décroissants, plafond", () => {
    const out = computeHr({
      config: HR,
      decisions: { trainingBudget: 3000 },
      headcount: 4,
      productivity: 1,
    });
    expect(out.nextProductivity).toBeCloseTo(1 + 0.05 * Math.log(2), 10);
    expect(out.cost).toBe(3000);
    const capped = computeHr({
      config: HR,
      decisions: { trainingBudget: 1e9 },
      headcount: 4,
      productivity: 1.24,
    });
    expect(capped.nextProductivity).toBe(1.25);
  });

  it("bornes : jamais moins d'un salarié, embauches plafonnées", () => {
    const out = computeHr({
      config: HR,
      decisions: { fire: 10, salaryIndex: 0.8 },
      headcount: 2,
      productivity: 1,
    });
    expect(out.fired).toBe(1); // headcount − 1
    expect(out.departed).toBe(0); // pas de démission sous le plancher d'un salarié
    expect(out.nextHeadcount).toBe(1);
    const hires = computeHr({
      config: HR,
      decisions: { hire: 9 },
      headcount: 9,
      productivity: 1,
    });
    expect(hires.hired).toBe(1); // maxHeadcount 10
  });
});

// ---------------------------------------------------------------------------
// Intégration moteur : la RH traverse simulateRound
// ---------------------------------------------------------------------------

const scenario = (): EngineScenarioConfig => ({
  code: "test",
  version: "1",
  roundsCount: 3,
  roundDays: 90,
  market: {
    segments: [
      {
        code: "main",
        name: "Principal",
        size: 8000,
        growth: 0.05,
        priceElasticity: -1.5,
        refPrice: 60,
        minAcceptablePrice: 30,
        psychThresholds: [],
        marketingSensitivity: 0.15,
        qualitySensitivity: 0.3,
        loyalty: 0.2,
        priceEffectBounds: { min: 0.2, max: 4 },
        paymentDelayDays: 30,
      },
    ],
    seasonality: [1, 1, 1],
    outsideAttraction: 0.5,
    competitionIntensity: 2,
  },
  product: { code: "one", materialCostPerUnit: 22, otherVariableCostPerUnit: 16, hoursPerUnit: 0.3 },
  production: {
    qualitySensitivity: 0.15,
    qualityScale: 5000,
    qualityInertia: 0.6,
    maintenanceReference: 5000,
    availabilityDecay: 0.05,
  },
  marketing: { scale: 10000 },
  finance: {
    loanAnnualRate: 0.06,
    overdraftAnnualRate: 0.12,
    overdraftLimit: 30000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 30,
    depreciationPerRound: 3000,
  },
  fixedCostsPerRound: 60000,
  hr: HR,
  events: [],
  scriptedEvents: [],
  scoring: {
    weights: {
      economic: 0.3,
      financial: 0.2,
      commercial: 0.15,
      operational: 0.1,
      profitability: 0.1,
      strategy: 0.1,
      decisionMastery: 0.05,
    },
    benchmarks: {
      operatingIncome: { min: -50000, target: 45000 },
      revenue: { min: 150000, target: 400000 },
      netTreasury: { min: -60000, target: 80000 },
      returnOnEquity: { min: -0.1, target: 0.06 },
      marketShareTarget: 0.32,
      utilizationTarget: 0.85,
    },
  },
});

const company = (id: string): CompanyState => ({
  id,
  name: id,
  controller: "human",
  perceivedQuality: 1,
  machineCapacity: 9000, // le goulot est la main-d'œuvre : la RH devient un levier
  availability: 1,
  headcount: 4,
  hoursPerEmployee: 450, // capacité MOD = 4 × 450 / 0,3 = 6 000 u
  productivity: 1,
  finishedGoods: { quantity: 0, unitCost: 0 },
  finance: {
    fixedAssetsNet: 100000,
    inventoryValue: 0,
    receivables: 0,
    cash: 45000,
    equity: 100000,
    financialDebt: 45000,
    payables: 0,
    overdraft: 0,
  },
  lastMarketShare: {},
});

const base = (): RoundDecisions => ({
  price: 59,
  productionPlan: 9000,
  marketingBudget: 8000,
  qualityBudget: 2000,
  maintenanceBudget: 5000,
});

const input = (over: Partial<SimulationInput> = {}): SimulationInput => ({
  scenario: scenario(),
  roundIndex: 1,
  companies: [company("a"), company("b")],
  decisions: { a: base(), b: base() },
  activeEvents: [],
  seed: 42,
  ...over,
});

describe("simulateRound : la RH de bout en bout", () => {
  it("l'embauche élargit la capacité main-d'œuvre au tour suivant", () => {
    const r1 = simulateRound(
      input({ decisions: { a: { ...base(), hr: { hire: 2 } }, b: base() } }),
    );
    // tour 1 : capacité inchangée (recrutement en cours), coût facturé
    expect(r1.results["a"]!.production.laborCapacity).toBeCloseTo(6000, 6);
    expect(r1.results["a"]!.incomeStatement.fixedCosts).toBeCloseTo(60000 + 6000, 6);
    expect(r1.results["a"]!.hr).toMatchObject({ hired: 2, nextHeadcount: 6 });
    // tour 2 : 6 opérateurs → 9 000 u, masse salariale +2 × 8 000
    const r2 = simulateRound(
      input({ roundIndex: 2, companies: r1.companies, decisions: { a: base(), b: base() } }),
    );
    expect(r2.results["a"]!.production.laborCapacity).toBeCloseTo(9000, 6);
    expect(r2.results["a"]!.incomeStatement.fixedCosts).toBeCloseTo(60000 + 16000, 6);
  });

  it("la morale joue sur la capacité du tour ; qui ne fait rien reste neutre", () => {
    const out = simulateRound(
      input({ decisions: { a: { ...base(), hr: { salaryIndex: 1.2 } }, b: base() } }),
    );
    // a sur-paie : morale ×1,1 → 6 600 u de capacité MOD ce tour
    expect(out.results["a"]!.production.laborCapacity).toBeCloseTo(6000 * 1.1, 6);
    // b, sans décision RH : strictement identique à un scénario sans RH
    const noHr = simulateRound(
      input({ scenario: { ...scenario(), hr: undefined } }),
    );
    expect(out.results["b"]!.incomeStatement).toEqual(noHr.results["b"]!.incomeStatement);
    expect(out.results["b"]!.hr).toBeUndefined();
  });

  it("les bilans restent équilibrés avec des coûts RH négatifs (dégraissage)", () => {
    const r1 = simulateRound(
      input({ decisions: { a: { ...base(), hr: { fire: 2 } }, b: base() } }),
    );
    const r2 = simulateRound(
      input({ roundIndex: 2, companies: r1.companies, decisions: { a: base(), b: base() } }),
    );
    // 2 salariés de moins que la référence : −16 000 € de charges de structure
    expect(r2.results["a"]!.incomeStatement.fixedCosts).toBeCloseTo(60000 - 16000, 6);
    // capacité amputée : 2 × 450 / 0,3 = 3 000 u
    expect(r2.results["a"]!.production.laborCapacity).toBeCloseTo(3000, 6);
  });
});
