import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import { subscriptionChurnRate } from "../../src/engine/subscription";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
  SubscriptionConfig,
} from "../../src/engine/types";

/**
 * Modèle par ABONNEMENT (opt-in) : l'entreprise porte un portefeuille
 * d'adhérents d'un tour à l'autre. Une part s'en va (attrition), le reste est
 * servi en priorité sur la capacité du tour, les nouveaux viennent du marché.
 * Sans le bloc, rien ne change : le scénario périssable reste identique.
 */

const SUB: SubscriptionConfig = {
  baseChurnRate: 0.15,
  qualityChurnSensitivity: 1,
  priceChurnSensitivity: 1,
  refPrice: 100,
  crowdingThreshold: 0.85,
  crowdingChurn: 0.2,
};

const scenario = (subscription?: SubscriptionConfig): EngineScenarioConfig => ({
  code: "test-subscription",
  version: "1",
  roundsCount: 3,
  roundDays: 90,
  market: {
    segments: [
      {
        code: "nouveaux",
        name: "Nouveaux adhérents",
        size: 1000,
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
  product: { code: "abonnement", materialCostPerUnit: 6, otherVariableCostPerUnit: 9, hoursPerUnit: 1 },
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
  perishable: true,
  ...(subscription ? { subscription } : {}),
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

const company = (id: string, members?: number): CompanyState => ({
  id,
  name: id,
  controller: "human",
  perceivedQuality: 1,
  machineCapacity: 2000,
  availability: 1,
  headcount: 5,
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
  ...(members !== undefined ? { members } : {}),
});

const decisions = (over: Partial<RoundDecisions> = {}): RoundDecisions => ({
  price: 100,
  productionPlan: 1800,
  marketingBudget: 2000,
  qualityBudget: 1000,
  maintenanceBudget: 5000,
  ...over,
});

const input = (
  subscription: SubscriptionConfig | undefined,
  members: number | undefined,
  over: Partial<RoundDecisions> = {},
): SimulationInput => ({
  scenario: scenario(subscription),
  roundIndex: 1,
  companies: [company("a", members), company("b", members)],
  decisions: { a: decisions(over), b: decisions(over) },
  activeEvents: [],
  seed: 12345,
});

describe("taux d'attrition", () => {
  it("vaut le taux de base à qualité et prix de référence, sans saturation", () => {
    expect(subscriptionChurnRate({ config: SUB, perceivedQuality: 1, price: 100, occupancy: 0.5 })).toBeCloseTo(0.15, 10);
  });

  it("monte quand la qualité perçue baisse, baisse quand elle monte", () => {
    const low = subscriptionChurnRate({ config: SUB, perceivedQuality: 0.8, price: 100, occupancy: 0.5 });
    const high = subscriptionChurnRate({ config: SUB, perceivedQuality: 1.25, price: 100, occupancy: 0.5 });
    expect(low).toBeGreaterThan(0.15);
    expect(high).toBeLessThan(0.15);
  });

  it("monte avec un prix au-dessus de la référence", () => {
    expect(subscriptionChurnRate({ config: SUB, perceivedQuality: 1, price: 120, occupancy: 0.5 })).toBeCloseTo(0.18, 10);
  });

  it("la saturation ajoute son terme au-delà du seuil, plafonné à l'occupation totale", () => {
    const under = subscriptionChurnRate({ config: SUB, perceivedQuality: 1, price: 100, occupancy: 0.85 });
    const half = subscriptionChurnRate({ config: SUB, perceivedQuality: 1, price: 100, occupancy: 0.925 });
    const full = subscriptionChurnRate({ config: SUB, perceivedQuality: 1, price: 100, occupancy: 1 });
    const over = subscriptionChurnRate({ config: SUB, perceivedQuality: 1, price: 100, occupancy: 1.4 });
    expect(under).toBeCloseTo(0.15, 10);
    expect(half).toBeCloseTo(0.25, 10);
    expect(full).toBeCloseTo(0.35, 10);
    expect(over).toBeCloseTo(0.35, 10);
  });

  it("reste borné par le plafond", () => {
    const churn = subscriptionChurnRate({
      config: { ...SUB, maxChurnRate: 0.4 },
      perceivedQuality: 0.3,
      price: 200,
      occupancy: 1,
    });
    expect(churn).toBe(0.4);
  });
});

describe("portefeuille d'adhérents dans la simulation", () => {
  it("sans le bloc, rien n'est émis et le scénario périssable est identique", () => {
    const out = simulateRound(input(undefined, undefined));
    const r = out.results["a"]!;
    expect(r.subscription).toBeUndefined();
    expect(out.companies.find((c) => c.id === "a")!.members).toBeUndefined();
    expect(JSON.stringify(r)).not.toContain("subscription");
  });

  it("les adhérents restés sont servis en priorité, au prix du tour, et rejoignent le CA", () => {
    const out = simulateRound(input(SUB, 1000));
    const r = out.results["a"]!;
    const s = r.subscription!;
    expect(s.opening).toBe(1000);
    expect(s.churnRate).toBeCloseTo(0.15, 10);
    expect(s.churned).toBeCloseTo(150, 10);
    expect(s.retained).toBeCloseTo(850, 10);
    expect(s.unserved).toBe(0);
    expect(s.retainedRevenue).toBeCloseTo(850 * 100, 6);
    // Les nouveaux viennent du marché sur les places restantes.
    const newFromMarket = Object.values(r.market.bySegment).reduce((t, d) => t + d.sold, 0);
    expect(s.newMembers).toBeCloseTo(newFromMarket, 10);
    expect(s.closing).toBeCloseTo(850 + newFromMarket, 10);
    expect(r.incomeStatement.revenue).toBeCloseTo((850 + newFromMarket) * 100, 6);
    // Le portefeuille de clôture ouvre le tour suivant.
    expect(out.companies.find((c) => c.id === "a")!.members).toBeCloseTo(s.closing, 10);
  });

  it("le marché n'a que les places restantes après les adhérents conservés", () => {
    const with1000 = simulateRound(input(SUB, 1000, { productionPlan: 900 })).results["a"]!;
    const none = simulateRound(input(SUB, 0, { productionPlan: 900 })).results["a"]!;
    // 850 adhérents restés sur 900 places : 50 places pour le marché.
    const newWith = Object.values(with1000.market.bySegment).reduce((t, d) => t + d.sold, 0);
    const newNone = Object.values(none.market.bySegment).reduce((t, d) => t + d.sold, 0);
    expect(newWith).toBeLessThanOrEqual(50 + 1e-9);
    expect(newNone).toBeGreaterThan(newWith);
  });

  it("sans assez de places, les adhérents restés sans place sont perdus", () => {
    const r = simulateRound(input(SUB, 1000, { productionPlan: 500 })).results["a"]!;
    const s = r.subscription!;
    expect(s.retained).toBeCloseTo(500, 10);
    expect(s.unserved).toBeCloseTo(350, 10);
    expect(s.newMembers).toBe(0);
    expect(s.closing).toBeCloseTo(500, 10);
  });

  it("la saturation du tour fait partir davantage", () => {
    // 1 900 adhérents sur 2 000 places : occupation 0,95 → attrition 0,15 + 0,2 × (0,1 ÷ 0,15).
    const r = simulateRound(input(SUB, 1900, { productionPlan: 2000 })).results["a"]!;
    expect(r.subscription!.occupancy).toBeCloseTo(0.95, 10);
    expect(r.subscription!.churnRate).toBeCloseTo(0.15 + 0.2 * (0.1 / 0.15), 10);
  });

  it("le bilan reste équilibré avec le portefeuille", () => {
    const out = simulateRound(input(SUB, 1000));
    const b = out.companies.find((c) => c.id === "a")!.finance;
    const actif = b.fixedAssetsNet + b.inventoryValue + b.receivables + b.cash;
    const passif = b.equity + b.financialDebt + b.payables + b.overdraft;
    expect(actif).toBeCloseTo(passif, 4);
  });
});
