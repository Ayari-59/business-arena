import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * Plafond d'augmentation de capital (doc 02 §6.5) : les associés suivent
 * jusqu'à une enveloppe TOTALE sur la partie — un apport illimité fausserait
 * le jeu de trésorerie. Sans plafond au scénario : comportement historique.
 */

const scenario = (over: Partial<EngineScenarioConfig> = {}): EngineScenarioConfig => ({
  code: "test",
  version: "1",
  roundsCount: 3,
  roundDays: 90,
  market: {
    segments: [
      {
        code: "main",
        name: "Principal",
        size: 6000,
        growth: 0,
        priceElasticity: -1.5,
        refPrice: 60,
        minAcceptablePrice: 30,
        psychThresholds: [],
        marketingSensitivity: 0.15,
        qualitySensitivity: 0.3,
        loyalty: 0.2,
        priceEffectBounds: { min: 0.2, max: 4 },
        paymentDelayDays: 0,
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
    loanAnnualRate: 0.05,
    overdraftAnnualRate: 0.12,
    overdraftLimit: 200000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 0,
    depreciationPerRound: 3000,
    maxCapitalIncreaseTotal: 100000,
  },
  fixedCostsPerRound: 60000,
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
  ...over,
});

const company = (id: string): CompanyState => ({
  id,
  name: id,
  controller: "human",
  perceivedQuality: 1,
  machineCapacity: 6000,
  availability: 1,
  headcount: 4,
  hoursPerEmployee: 500,
  productivity: 1,
  finishedGoods: { quantity: 0, unitCost: 0 },
  finance: {
    fixedAssetsNet: 135000,
    inventoryValue: 0,
    receivables: 0,
    cash: 100000,
    equity: 155000,
    financialDebt: 80000,
    payables: 0,
    overdraft: 0,
  },
  lastMarketShare: {},
});

const base = (): RoundDecisions => ({
  price: 59,
  productionPlan: 4500,
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

describe("plafond d'augmentation de capital", () => {
  it("un apport au-delà de l'enveloppe est écrêté dès le premier tour", () => {
    const out = simulateRound(
      input({
        decisions: { a: { ...base(), finance: { capitalIncrease: 250000 } }, b: base() },
      }),
    );
    const a = out.results["a"]!;
    expect(a.capital).toEqual({ requested: 250000, applied: 100000, remainingAfter: 0 });
    // seuls 100 000 € entrent en capitaux propres et en caisse
    const plain = simulateRound(input()).results["a"]!;
    expect(a.balanceSheet.equity - plain.balanceSheet.equity).toBeCloseTo(100000, 4);
    expect(out.companies.find((c) => c.id === "a")!.capitalRaised).toBeCloseTo(100000, 6);
  });

  it("l'enveloppe est CUMULATIVE : ce qui est apporté au tour 1 manque au tour 2", () => {
    const r1 = simulateRound(
      input({
        decisions: { a: { ...base(), finance: { capitalIncrease: 60000 } }, b: base() },
      }),
    );
    expect(r1.results["a"]!.capital).toEqual({
      requested: 60000,
      applied: 60000,
      remainingAfter: 40000,
    });
    const r2 = simulateRound(
      input({
        roundIndex: 2,
        companies: r1.companies,
        decisions: { a: { ...base(), finance: { capitalIncrease: 60000 } }, b: base() },
      }),
    );
    expect(r2.results["a"]!.capital).toEqual({
      requested: 60000,
      applied: 40000, // il ne restait que 40 000 €
      remainingAfter: 0,
    });
  });

  it("sans plafond au scénario : apport libre (comportement historique)", () => {
    const free = scenario();
    free.finance = { ...free.finance, maxCapitalIncreaseTotal: undefined };
    const out = simulateRound(
      input({
        scenario: free,
        decisions: { a: { ...base(), finance: { capitalIncrease: 250000 } }, b: base() },
      }),
    );
    const a = out.results["a"]!;
    expect(a.capital).toBeUndefined();
    const plain = simulateRound(input({ scenario: free })).results["a"]!;
    expect(a.balanceSheet.equity - plain.balanceSheet.equity).toBeCloseTo(250000, 4);
  });
});
