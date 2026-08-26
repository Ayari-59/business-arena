import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import { applyPeriodicity } from "../../src/config/scenarios/periodicity";
import { parseScenarioConfig } from "../../src/config/scenarios/schema";
import type {
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * Commandes fermes (« order ») et assurance catastrophe (doc 02 §7.2) :
 * l'ordre s'ajoute au CA sans gonfler la part de marché, réglé comptant,
 * borné par le stock ; l'assurance neutralise les événements couverts pour
 * les seuls assurés, contre une prime qui déplace le seuil de rentabilité.
 */

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
        psychThresholds: [{ threshold: 60, penalty: 0.95 }],
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
  insurance: { premiumPerRound: 2500, coveredEventCodes: ["natural_disaster"] },
  events: [
    {
      code: "natural_disaster",
      scope: "market",
      probability: 0,
      duration: 1,
      modifiers: [
        { target: "availability", op: "mul", value: 0.7 },
        { target: "material_cost", op: "mul", value: 1.1 },
      ],
    },
    {
      code: "big_order",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "order", op: "add", value: 500 }],
    },
  ],
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

const company = (id: string, stock = 0): CompanyState => ({
  id,
  name: id,
  controller: "human",
  perceivedQuality: 1,
  machineCapacity: 5500,
  availability: 1,
  headcount: 4,
  hoursPerEmployee: 450,
  productivity: 1,
  finishedGoods: { quantity: stock, unitCost: stock > 0 ? 38 : 0 },
  finance: {
    fixedAssetsNet: 100000,
    inventoryValue: stock * 38,
    receivables: 0,
    cash: 45000,
    equity: 100000 + stock * 38,
    financialDebt: 45000,
    payables: 0,
    overdraft: 0,
  },
  lastMarketShare: {},
});

const baseDecisions = (): RoundDecisions => ({
  price: 59,
  productionPlan: 4000,
  marketingBudget: 8000,
  qualityBudget: 2000,
  maintenanceBudget: 5000,
});

const input = (over: Partial<SimulationInput> = {}): SimulationInput => ({
  scenario: scenario(),
  roundIndex: 1,
  companies: [company("a", 1000), company("b", 1000)],
  decisions: { a: baseDecisions(), b: baseDecisions() },
  activeEvents: [],
  seed: 12345,
  ...over,
});

const orderEvent = (companyId: string, units = 500): EventInstance => ({
  code: "big_order",
  scope: "company",
  companyId,
  roundsLeft: 1,
  modifiers: [{ target: "order", op: "add", value: units }],
});

const disasterEvent = (): EventInstance => ({
  code: "natural_disaster",
  scope: "market",
  roundsLeft: 1,
  modifiers: [
    { target: "availability", op: "mul", value: 0.7 },
    { target: "material_cost", op: "mul", value: 1.1 },
  ],
});

describe("commande ferme (modificateur « order »)", () => {
  it("s'ajoute au CA de la seule entreprise ciblée, sans gonfler sa part de marché", () => {
    const out = simulateRound(input({ activeEvents: [orderEvent("a")] }));
    const a = out.results["a"]!;
    const b = out.results["b"]!;
    // mêmes décisions ⇒ mêmes ventes de marché ; l'écart de CA = la commande
    expect(a.extraOrders).toEqual({ requested: 500, delivered: 500, subcontracted: 0, unitPrice: 59 });
    expect(b.extraOrders).toBeUndefined();
    expect(a.incomeStatement.revenue - b.incomeStatement.revenue).toBeCloseTo(500 * 59, 6);
    expect(a.market.totalShare).toBeCloseTo(b.market.totalShare, 10);
    // réglée comptant : à CA supérieur, créances clients identiques
    expect(a.balanceSheet.receivables).toBeCloseTo(b.balanceSheet.receivables, 6);
    // 500 unités de plus sont sorties du stock
    const stockA = out.companies.find((c) => c.id === "a")!.finishedGoods.quantity;
    const stockB = out.companies.find((c) => c.id === "b")!.finishedGoods.quantity;
    expect(stockB - stockA).toBeCloseTo(500, 6);
  });

  it("est bornée par le stock disponible : on ne livre pas ce qu'on n'a pas", () => {
    // pas de stock initial, production nulle ⇒ rien à livrer
    const out = simulateRound(
      input({
        companies: [company("a"), company("b")],
        decisions: {
          a: { ...baseDecisions(), productionPlan: 0 },
          b: baseDecisions(),
        },
        activeEvents: [orderEvent("a")],
      }),
    );
    const a = out.results["a"]!;
    expect(a.extraOrders!.requested).toBe(500);
    expect(a.extraOrders!.delivered).toBe(0);
  });
});

describe("assurance catastrophe", () => {
  const insuredDecisions = (): RoundDecisions => ({ ...baseDecisions(), insurance: true });

  it("neutralise l'événement couvert pour le seul assuré, contre la prime", () => {
    const out = simulateRound(
      input({
        decisions: { a: insuredDecisions(), b: baseDecisions() },
        activeEvents: [disasterEvent()],
      }),
    );
    const a = out.results["a"]!;
    const b = out.results["b"]!;
    // a produit son plan (4000 < 5500), b est bridé par la disponibilité ×0,7
    expect(a.production.produced).toBeCloseTo(4000, 6);
    expect(b.production.produced).toBeCloseTo(5500 * 0.7, 6);
    // matières : l'assuré paie le tarif normal, le non-assuré subit ×1,1
    expect(a.incomeStatement.variableProductionCost).toBeCloseTo(
      a.production.produced * (22 + 16),
      6,
    );
    expect(b.incomeStatement.variableProductionCost).toBeCloseTo(
      b.production.produced * (22 * 1.1 + 16),
      6,
    );
    // la prime est une charge de structure de l'assuré
    expect(a.incomeStatement.fixedCosts).toBeCloseTo(60000 + 2500, 6);
    expect(b.incomeStatement.fixedCosts).toBeCloseTo(60000, 6);
    expect(a.insurance).toEqual({ premium: 2500, neutralizedEvents: ["natural_disaster"] });
    expect(b.insurance).toBeUndefined();
  });

  it("sans sinistre : la prime est payée quand même et déplace le seuil", () => {
    const out = simulateRound(
      input({ decisions: { a: insuredDecisions(), b: baseDecisions() } }),
    );
    const a = out.results["a"]!;
    const b = out.results["b"]!;
    expect(a.insurance).toEqual({ premium: 2500, neutralizedEvents: [] });
    expect(a.incomeStatement.fixedCosts - b.incomeStatement.fixedCosts).toBeCloseTo(2500, 6);
    expect(a.breakeven.breakEvenUnits).toBeGreaterThan(b.breakeven.breakEvenUnits);
  });

  it("un événement non couvert frappe aussi les assurés", () => {
    const uncovered: EventInstance = {
      code: "raw_material_spike",
      scope: "market",
      roundsLeft: 1,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.25 }],
    };
    const out = simulateRound(
      input({ decisions: { a: insuredDecisions(), b: baseDecisions() }, activeEvents: [uncovered] }),
    );
    const a = out.results["a"]!;
    expect(a.incomeStatement.variableProductionCost).toBeCloseTo(
      a.production.produced * (22 * 1.25 + 16),
      6,
    );
  });
});

describe("périodicité et validation", () => {
  it("applyPeriodicity redimensionne la prime et les commandes (flux × k)", () => {
    const monthly = applyPeriodicity(scenario(), "month");
    const k = 30 / 90;
    expect(monthly.insurance!.premiumPerRound).toBeCloseTo(2500 * k, 6);
    const order = monthly.events
      .find((e) => e.code === "big_order")!
      .modifiers.find((m) => m.target === "order")!;
    expect(order.value).toBeCloseTo(500 * k, 6);
    // les multiplicateurs, eux, ne changent pas
    const disaster = monthly.events.find((e) => e.code === "natural_disaster")!;
    expect(disaster.modifiers[0]!.value).toBe(0.7);
  });

  it("le schéma refuse une assurance couvrant un événement de demande", () => {
    const bad = {
      ...scenario(),
      insurance: { premiumPerRound: 1000, coveredEventCodes: ["demand_event"] },
      events: [
        ...scenario().events,
        {
          code: "demand_event",
          scope: "market" as const,
          probability: 0,
          duration: 1,
          modifiers: [{ target: "demand" as const, op: "mul" as const, value: 1.1 }],
        },
      ],
    };
    expect(() => parseScenarioConfig(bad)).toThrow(/demande/);
    const unknown = {
      ...scenario(),
      insurance: { premiumPerRound: 1000, coveredEventCodes: ["nope"] },
    };
    expect(() => parseScenarioConfig(unknown)).toThrow(/inconnu/);
  });
});
