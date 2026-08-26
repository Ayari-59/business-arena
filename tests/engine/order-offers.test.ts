import { describe, expect, it } from "vitest";
import { orderOfferForRound, simulateRound } from "../../src/engine/simulation";
import { applyPeriodicity } from "../../src/config/scenarios/periodicity";
import type {
  CompanyState,
  EngineScenarioConfig,
  OrderOfferDef,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * Commandes exceptionnelles (doc 02 §5.1) : une offre ENTRE CHAQUE TOUR
 * (rotation déterministe), à accepter ou refuser. L'export à long délai fait
 * gonfler le poste clients (BFR), le comptant apporte du cash à marge mince.
 */

const OFFERS: OrderOfferDef[] = [
  {
    code: "export_90j",
    title: "Export 90 j",
    narrative: "Commande export payée à 90 jours.",
    units: 500,
    price: 74,
    paymentDelayDays: 90,
  },
  {
    code: "cash_now",
    title: "Comptant",
    narrative: "Vente flash payée comptant.",
    units: 500,
    price: 45,
    paymentDelayDays: 0,
  },
];

const scenario = (over: Partial<EngineScenarioConfig> = {}): EngineScenarioConfig => ({
  code: "test",
  version: "1",
  roundsCount: 4,
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
        paymentDelayDays: 0, // marché comptant : les créances viendront de l'OFFRE seule
      },
    ],
    seasonality: [1, 1, 1, 1],
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
  orderOffers: OFFERS,
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

// plan large : il reste du stock pour servir l'offre après le marché
const base = (): RoundDecisions => ({
  price: 59,
  productionPlan: 5500,
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

describe("rotation du pool : une offre entre chaque tour", () => {
  it("cycle déterministe, la même pour toutes les équipes", () => {
    const s = scenario();
    expect(orderOfferForRound(s, 1)!.code).toBe("export_90j");
    expect(orderOfferForRound(s, 2)!.code).toBe("cash_now");
    expect(orderOfferForRound(s, 3)!.code).toBe("export_90j"); // retour du pool
    expect(orderOfferForRound(scenario({ orderOffers: undefined }), 1)).toBeNull();
  });

  it("l'offre du tour apparaît dans les résultats, même déclinée", () => {
    const out = simulateRound(input());
    const a = out.results["a"]!;
    expect(a.orderOffer).toMatchObject({
      code: "export_90j",
      accepted: false,
      delivered: 0,
      revenue: 0,
    });
  });
});

describe("export à 90 jours : forte marge, BFR qui gonfle", () => {
  it("CA en plus au prix imposé, tout le montant part en créances", () => {
    const refuse = simulateRound(input());
    const accept = simulateRound(
      input({ decisions: { a: { ...base(), acceptOrder: true }, b: base() } }),
    );
    const rA = refuse.results["a"]!;
    const aA = accept.results["a"]!;
    expect(aA.orderOffer).toMatchObject({ accepted: true, delivered: 500 });
    expect(aA.incomeStatement.revenue - rA.incomeStatement.revenue).toBeCloseTo(500 * 74, 4);
    // délai 90 j sur un tour de 90 j : 100 % du CA de l'offre en créances
    expect(aA.orderOffer!.onCredit).toBeCloseTo(500 * 74, 4);
    expect(aA.balanceSheet.receivables - rA.balanceSheet.receivables).toBeCloseTo(500 * 74, 4);
    // le BFR porte l'attente : +37 000 € de créances, −19 000 € de stock cédé
    // (500 u × 38 € de coût variable) — il gonfle du solde net
    expect(aA.functionalBalance.bfr - rA.functionalBalance.bfr).toBeCloseTo(
      500 * 74 - 500 * 38,
      4,
    );
    // la part de marché, elle, ne bouge pas (marché adressable seul)
    expect(aA.market.totalShare).toBeCloseTo(rA.market.totalShare, 9);
  });

  it("livraison bornée par le stock restant après le marché", () => {
    const tight = simulateRound(
      input({
        decisions: {
          a: { ...base(), productionPlan: 100, acceptOrder: true }, // presque tout part au marché
          b: base(),
        },
      }),
    );
    const a = tight.results["a"]!;
    expect(a.orderOffer!.delivered).toBeLessThan(500);
  });
});

describe("comptant à marge mince : du cash, pas de créances", () => {
  it("aucune créance supplémentaire, la trésorerie encaisse le CA", () => {
    const refuse = simulateRound(input({ roundIndex: 2 }));
    const accept = simulateRound(
      input({ roundIndex: 2, decisions: { a: { ...base(), acceptOrder: true }, b: base() } }),
    );
    const rA = refuse.results["a"]!;
    const aA = accept.results["a"]!;
    expect(aA.orderOffer).toMatchObject({ code: "cash_now", accepted: true, onCredit: 0 });
    expect(aA.balanceSheet.receivables).toBeCloseTo(rA.balanceSheet.receivables, 4);
    const extraRevenue = aA.orderOffer!.revenue;
    expect(extraRevenue).toBeCloseTo(500 * 45, 4);
    // tout le CA de l'offre est encaissé dans le tour (impôt en écart possible)
    const cashDelta =
      aA.cashFlow.closing - rA.cashFlow.closing + (aA.incomeStatement.tax - rA.incomeStatement.tax);
    expect(cashDelta).toBeCloseTo(extraRevenue, 4);
  });
});

describe("périodicité", () => {
  it("volumes en flux (× k), prix et délais inchangés", () => {
    const monthly = applyPeriodicity(scenario(), "month");
    expect(monthly.orderOffers![0]!.units).toBeCloseTo(500 / 3, 6);
    expect(monthly.orderOffers![0]!.price).toBe(74);
    expect(monthly.orderOffers![0]!.paymentDelayDays).toBe(90);
  });
});
