import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import type {
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * Investissement capacitaire, financement par capital, commandes à prix
 * imposé (avec sous-traitance) et coûts de la non-qualité : chaque mécanique
 * traverse le moteur avec des bilans équilibrés au centime — et une
 * entreprise qui ne fait rien reste rigoureusement inchangée.
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
  investment: { costPerCapacityUnit: 20, depreciationRounds: 16, maxPerRound: 2000 },
  subcontracting: { unitCost: 52 },
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
  machineCapacity: 5500,
  availability: 1,
  headcount: 4,
  hoursPerEmployee: 450,
  productivity: 1,
  finishedGoods: { quantity: 1000, unitCost: 38 },
  finance: {
    fixedAssetsNet: 100000,
    inventoryValue: 38000,
    receivables: 0,
    cash: 80000,
    equity: 173000,
    financialDebt: 45000,
    payables: 0,
    overdraft: 0,
  },
  lastMarketShare: {},
});

const base = (): RoundDecisions => ({
  price: 59,
  productionPlan: 4000,
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

describe("investissement capacitaire", () => {
  it("décaissé et immobilisé ce tour, capacité et amortissements à t+1", () => {
    const r1 = simulateRound(
      input({
        decisions: { a: { ...base(), investment: { machineCapacityUnits: 1500 } }, b: base() },
      }),
    );
    const a1 = r1.results["a"]!;
    const b1 = r1.results["b"]!;
    // tour 1 : 30 000 € décaissés et immobilisés, capacité inchangée
    expect(a1.investment).toEqual({ capacityUnits: 1500, outlay: 30000 });
    expect(a1.balanceSheet.fixedAssetsNet - b1.balanceSheet.fixedAssetsNet).toBeCloseTo(30000, 6);
    expect(a1.production.machineCapacity).toBeCloseTo(5500, 6);
    expect(a1.incomeStatement.depreciation).toBeCloseTo(b1.incomeStatement.depreciation, 6);
    const investFlow = a1.cashFlow.items.find((i) => i.label === "investissement");
    expect(investFlow?.amount).toBe(-30000);
    // tour 2 : mise en service (capacité +1 500) et amortissement +30 000/16
    const r2 = simulateRound(
      input({ roundIndex: 2, companies: r1.companies, decisions: { a: base(), b: base() } }),
    );
    expect(r2.results["a"]!.production.machineCapacity).toBeCloseTo(7000, 6);
    expect(
      r2.results["a"]!.incomeStatement.depreciation - r2.results["b"]!.incomeStatement.depreciation,
    ).toBeCloseTo(30000 / 16, 6);
  });

  it("le plafond d'achat par tour s'applique", () => {
    const out = simulateRound(
      input({
        decisions: { a: { ...base(), investment: { machineCapacityUnits: 99999 } }, b: base() },
      }),
    );
    expect(out.results["a"]!.investment).toEqual({ capacityUnits: 2000, outlay: 40000 });
  });
});

describe("financement par augmentation de capital", () => {
  it("trésorerie et capitaux propres montent d'autant, sans intérêts", () => {
    const out = simulateRound(
      input({
        decisions: {
          a: { ...base(), finance: { capitalIncrease: 50000 } },
          b: base(),
        },
      }),
    );
    const a = out.results["a"]!;
    const b = out.results["b"]!;
    expect(a.balanceSheet.equity - b.balanceSheet.equity).toBeCloseTo(50000, 6);
    expect(a.incomeStatement.interest).toBeCloseTo(b.incomeStatement.interest, 6);
    expect(a.cashFlow.items.find((i) => i.label === "augmentation_capital")?.amount).toBe(50000);
  });
});

describe("commandes à prix imposé et sous-traitance", () => {
  const orderEvent = (mods: EventInstance["modifiers"]): EventInstance => ({
    code: "special",
    scope: "company",
    companyId: "a",
    roundsLeft: 1,
    modifiers: mods,
  });

  it("prix imposé : le CA de la commande se calcule au prix de l'offre, pas au prix propre", () => {
    const out = simulateRound(
      input({
        activeEvents: [
          orderEvent([
            { target: "order", op: "add", value: 400 },
            { target: "order_price", op: "add", value: 55 },
          ]),
        ],
      }),
    );
    const a = out.results["a"]!;
    const b = out.results["b"]!;
    expect(a.extraOrders).toEqual({
      requested: 400,
      delivered: 400,
      subcontracted: 0,
      unitPrice: 55,
    });
    expect(a.incomeStatement.revenue - b.incomeStatement.revenue).toBeCloseTo(400 * 55, 4);
  });

  it("commande XXL : le stock d'abord, la sous-traitance comble — à son coût", () => {
    const out = simulateRound(
      input({
        decisions: { a: { ...base(), productionPlan: 0 }, b: base() },
        activeEvents: [
          orderEvent([
            { target: "order", op: "add", value: 2500 },
            { target: "order_price", op: "add", value: 61 },
            { target: "order_subcontract", op: "add", value: 2500 },
          ]),
        ],
      }),
    );
    const a = out.results["a"]!;
    // production nulle : le stock (1 000) sert le marché puis la commande ;
    // le manque est sous-traité — total livré + sous-traité = 2 500
    expect(a.extraOrders!.requested).toBe(2500);
    expect(a.extraOrders!.delivered + a.extraOrders!.subcontracted).toBeCloseTo(2500, 4);
    expect(a.extraOrders!.subcontracted).toBeGreaterThan(1500);
    expect(a.extraOrders!.unitPrice).toBe(61);
  });

  it("sans sous-traitant au scénario, rien n'est sous-traité", () => {
    const out = simulateRound(
      input({
        scenario: scenario({ subcontracting: undefined }),
        decisions: { a: { ...base(), productionPlan: 0 }, b: base() },
        activeEvents: [
          orderEvent([
            { target: "order", op: "add", value: 2500 },
            { target: "order_subcontract", op: "add", value: 2500 },
          ]),
        ],
      }),
    );
    expect(out.results["a"]!.extraOrders!.subcontracted).toBe(0);
  });
});

describe("coûts de la qualité et de la non-qualité", () => {
  const withQuality = scenario({
    qualityCosts: { baseDefectRate: 0.04, externalReturnSensitivity: 0.5 },
  });

  it("rebuts internes : produits et payés, jamais vendus — valorisés au coût variable", () => {
    const out = simulateRound(input({ scenario: withQuality }));
    const a = out.results["a"]!;
    expect(a.qualityCosts).toBeDefined();
    expect(a.qualityCosts!.defectUnits).toBeGreaterThan(0);
    expect(a.qualityCosts!.internalFailure).toBeCloseTo(a.qualityCosts!.defectUnits * 38, 4);
    // qualité perçue à 1 : aucun retour client
    expect(a.qualityCosts!.returnedUnits).toBe(0);
  });

  it("qualité perçue dégradée : des retours clients remboursés au prix de vente", () => {
    const damaged = { ...company("a"), perceivedQuality: 0.8 };
    const out = simulateRound(
      input({ scenario: withQuality, companies: [damaged, company("b")] }),
    );
    const a = out.results["a"]!;
    expect(a.qualityCosts!.returnedUnits).toBeGreaterThan(0);
    expect(a.qualityCosts!.externalFailure).toBeCloseTo(a.qualityCosts!.returnedUnits * 59, 4);
  });

  it("plus de budget qualité ⇒ moins de rebuts (la prévention paie)", () => {
    const low = simulateRound(input({ scenario: withQuality }));
    const high = simulateRound(
      input({
        scenario: withQuality,
        decisions: { a: { ...base(), qualityBudget: 20000 }, b: base() },
      }),
    );
    expect(high.results["a"]!.qualityCosts!.defectUnits).toBeLessThan(
      low.results["a"]!.qualityCosts!.defectUnits,
    );
  });
});
