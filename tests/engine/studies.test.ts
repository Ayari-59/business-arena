import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import { applyPeriodicity } from "../../src/config/scenarios/periodicity";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * Études achetables (doc 02 §8bis) : l'information a un prix — facturé en
 * charge de structure (résultat, trésorerie et seuil de rentabilité la
 * portent), le rapport est délivré avec les résultats.
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
  },
  fixedCostsPerRound: 60000,
  studies: { marketCost: 1500, priceCost: 1000, financeCost: 800, projectCost: 1200 },
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

describe("études achetables : l'information a un prix", () => {
  it("les études cochées sont facturées en charges de structure", () => {
    const plain = simulateRound(input());
    const bought = simulateRound(
      input({
        decisions: {
          a: { ...base(), studies: { market: true, project: true } },
          b: base(),
        },
      }),
    );
    const pA = plain.results["a"]!;
    const bA = bought.results["a"]!;
    expect(bA.studies).toEqual({ purchased: ["market", "project"], cost: 2700 });
    // 1 500 + 1 200 = 2 700 € de charges fixes en plus
    expect(bA.incomeStatement.fixedCosts - pA.incomeStatement.fixedCosts).toBeCloseTo(2700, 6);
    // le seuil de rentabilité monte : l'information se lit comme les autres charges
    expect(bA.breakeven.breakEvenUnits).toBeGreaterThan(pA.breakeven.breakEvenUnits!);
    // et la trésorerie la décaisse (l'impôt peut amortir l'écart)
    expect(bA.cashFlow.closing).toBeLessThan(pA.cashFlow.closing);
  });

  it("aucune étude cochée (ou pas de catalogue) : rien ne change", () => {
    const plain = simulateRound(input());
    expect(plain.results["a"]!.studies).toBeUndefined();
    const noCatalog = simulateRound(
      input({
        scenario: scenario({ studies: undefined }),
        decisions: { a: { ...base(), studies: { market: true } }, b: base() },
      }),
    );
    // sans catalogue au scénario, cocher ne facture rien
    expect(noCatalog.results["a"]!.studies).toBeUndefined();
    expect(noCatalog.results["a"]!.incomeStatement.fixedCosts).toBeCloseTo(
      plain.results["a"]!.incomeStatement.fixedCosts,
      6,
    );
  });

  it("périodicité : des prestations par tour, en flux (× k)", () => {
    const monthly = applyPeriodicity(scenario(), "month");
    expect(monthly.studies!.marketCost).toBe(500);
    expect(monthly.studies!.projectCost).toBe(400);
    // Un tarif se lit en euros entiers, quelle que soit la périodicité : le
    // tiers de 1 000 € donnait « 333,333 € » à l'écran, à côté de tarifs ronds.
    const tiers = applyPeriodicity(scenario(), "month").studies!.priceCost;
    expect(Number.isInteger(tiers), `priceCost = ${tiers}`).toBe(true);
  });
});
