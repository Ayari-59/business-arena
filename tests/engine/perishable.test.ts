import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * Activités périssables (hôtel, restaurant, service) : la capacité non vendue
 * est perdue. Le drapeau est opt-in — les scénarios industriels gardent leur
 * stock reporté au CUMP.
 */

const scenario = (perishable: boolean): EngineScenarioConfig => ({
  code: "test-perishable",
  version: "1",
  roundsCount: 3,
  roundDays: 90,
  market: {
    segments: [
      {
        code: "main",
        name: "Principal",
        size: 2000,
        growth: 0,
        priceElasticity: -1.5,
        refPrice: 100,
        minAcceptablePrice: 50,
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
  product: { code: "nuitee", materialCostPerUnit: 10, otherVariableCostPerUnit: 5, hoursPerUnit: 0.2 },
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
    overdraftLimit: 100000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 30,
    depreciationPerRound: 3000,
  },
  fixedCostsPerRound: 20000,
  ...(perishable ? { perishable: true } : {}),
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
  machineCapacity: 4000,
  availability: 1,
  headcount: 4,
  hoursPerEmployee: 450,
  productivity: 1,
  finishedGoods: { quantity: 0, unitCost: 0 },
  finance: {
    fixedAssetsNet: 100000,
    inventoryValue: 0,
    receivables: 0,
    cash: 200000,
    equity: 255000,
    financialDebt: 45000,
    payables: 0,
    overdraft: 0,
  },
  lastMarketShare: {},
});

/** Prix très haut : la demande s'effondre, une large part de la capacité reste invendue. */
const decisions = (): RoundDecisions => ({
  price: 180,
  productionPlan: 3000,
  marketingBudget: 2000,
  qualityBudget: 1000,
  maintenanceBudget: 5000,
});

const input = (perishable: boolean): SimulationInput => ({
  scenario: scenario(perishable),
  roundIndex: 1,
  companies: [company("a"), company("b")],
  decisions: { a: decisions(), b: decisions() },
  activeEvents: [],
  seed: 12345,
});

describe("activité périssable", () => {
  it("industriel : les invendus deviennent du stock reporté", () => {
    const out = simulateRound(input(false));
    const a = out.companies.find((c) => c.id === "a")!;
    expect(a.finishedGoods.quantity).toBeGreaterThan(0);
    expect(a.finance.inventoryValue).toBeGreaterThan(0);
  });

  it("périssable : rien ne se reporte, ni en quantité ni au bilan", () => {
    const out = simulateRound(input(true));
    const a = out.companies.find((c) => c.id === "a")!;
    expect(a.finishedGoods.quantity).toBe(0);
    expect(a.finance.inventoryValue).toBe(0);
  });

  it("périssable : la capacité perdue est une charge, pas un actif", () => {
    const industrial = simulateRound(input(false)).results["a"]!;
    const service = simulateRound(input(true)).results["a"]!;
    // Même chiffre d'affaires (le marché ne dépend pas du mode de stockage)...
    expect(service.incomeStatement.revenue).toBeCloseTo(
      industrial.incomeStatement.revenue,
      6,
    );
    // ...mais le gâchis pèse sur la marge, alors qu'il dormait à l'actif.
    expect(service.incomeStatement.cogs).toBeGreaterThan(industrial.incomeStatement.cogs);
    expect(service.incomeStatement.operatingIncome).toBeLessThan(
      industrial.incomeStatement.operatingIncome,
    );
    expect(service.incomeStatement.productionStocked).toBe(0);
  });

  it("périssable : le bilan reste équilibré", () => {
    const out = simulateRound(input(true));
    const b = out.companies.find((c) => c.id === "a")!.finance;
    const assets = b.fixedAssetsNet + b.inventoryValue + b.receivables + b.cash;
    const liabilities =
      b.equity + b.financialDebt + b.payables + b.overdraft + (b.vatLiability ?? 0);
    expect(assets).toBeCloseTo(liabilities, 6);
  });

  it("périssable : le coût des ventes couvre TOUTE la capacité engagée", () => {
    const out = simulateRound(input(true));
    const r = out.results["a"]!;
    // Rien n'est stocké : tout ce qui est acheté et transformé passe en charges
    // du tour (vendu ou perdu) — achats + variables décaissés = coût des ventes.
    const engaged =
      r.incomeStatement.variableProductionCost + r.incomeStatement.productionStocked;
    expect(r.incomeStatement.cogs).toBeCloseTo(engaged, 6);
  });
});
