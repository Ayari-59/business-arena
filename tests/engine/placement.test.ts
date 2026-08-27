import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import { balanceGap } from "../../src/engine/finance/statements";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * Placement du surplus de trésorerie (niveaux Stratégie et Executive).
 *
 * La contrepartie exacte du découvert : l'argent qui dort ne rapporte rien,
 * mais l'argent placé ne paie plus rien. Ce qui doit être vrai :
 *
 * - le placement quitte la caisse du tour et n'y revient qu'au SUIVANT ;
 * - le bilan reste équilibré au centime, le placement étant un actif ;
 * - la trésorerie nette ne bouge pas d'un placement (les VMP sont de la
 *   trésorerie active), mais la caisse disponible, si ;
 * - placer plus que ce qu'on a est impossible ;
 * - on peut placer ET tomber en découvert : c'est même toute la leçon.
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
    loanAnnualRate: 0.06,
    overdraftAnnualRate: 0.12,
    overdraftLimit: 60000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 30,
    depreciationPerRound: 3000,
  },
  treasury: {
    discountAnnualRate: 0.06,
    discountMaxShare: 0.6,
    factoringFeeRate: 0.025,
    forcedFactoringFeeRate: 0.05,
    placementAnnualRate: 0.02,
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

const company = (id: string, over: Partial<CompanyState> = {}): CompanyState => ({
  id,
  name: id,
  controller: "human",
  perceivedQuality: 1,
  machineCapacity: 5500,
  availability: 1,
  headcount: 4,
  hoursPerEmployee: 450,
  productivity: 1,
  finishedGoods: { quantity: 0, unitCost: 0 },
  finance: {
    fixedAssetsNet: 135000,
    inventoryValue: 0,
    receivables: 0,
    cash: 100000,
    equity: 235000,
    financialDebt: 0,
    payables: 0,
    overdraft: 0,
  },
  lastMarketShare: {},
  ...over,
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

describe("placement du surplus de trésorerie", () => {
  it("le placement quitte la caisse et apparaît à l'actif, bilan équilibré", () => {
    const sans = simulateRound(input()).results["a"]!;
    const avec = simulateRound(
      input({ decisions: { a: { ...base(), treasury: { placement: 40000 } }, b: base() } }),
    ).results["a"]!;

    expect(avec.balanceSheet.shortTermInvestment).toBeCloseTo(40000, 6);
    expect(sans.balanceSheet.shortTermInvestment ?? 0).toBe(0);
    // 40 000 € de moins en caisse, à l'euro près
    expect(avec.balanceSheet.cash).toBeCloseTo(sans.balanceSheet.cash - 40000, 6);
    expect(Math.abs(balanceGap(avec.balanceSheet))).toBeLessThan(0.01);
  });

  it("placer ne change ni le résultat du tour ni la trésorerie nette", () => {
    const sans = simulateRound(input()).results["a"]!;
    const avec = simulateRound(
      input({ decisions: { a: { ...base(), treasury: { placement: 40000 } }, b: base() } }),
    ).results["a"]!;

    // Les VMP sont de la trésorerie ACTIVE : la TN ne bouge pas d'un placement.
    // C'est la caisse disponible qui bouge, et c'est bien là le risque.
    expect(avec.functionalBalance.netTreasury).toBeCloseTo(
      sans.functionalBalance.netTreasury,
      6,
    );
    // Le placement souscrit ce tour ne rapporte rien AVANT son terme.
    expect(avec.incomeStatement.netIncome).toBeCloseTo(sans.incomeStatement.netIncome, 6);
    expect(avec.incomeStatement.financialIncome ?? 0).toBe(0);
  });

  it("au tour suivant, le placement revient en caisse avec ses intérêts", () => {
    const placed = 40000;
    const out = simulateRound(
      input({
        companies: [
          company("a", {
            finance: { ...company("a").finance, cash: 60000, shortTermInvestment: placed },
          }),
          company("b"),
        ],
      }),
    ).results["a"]!;

    // 2 %/an sur un tour de 90 jours = un quart d'année.
    const interets = placed * 0.02 * (90 / 360);
    expect(out.treasury!.matured).toBeCloseTo(placed, 6);
    expect(out.treasury!.placementIncome).toBeCloseTo(interets, 6);
    expect(out.incomeStatement.financialIncome).toBeCloseTo(interets, 6);
    // et le résultat en profite, après impôt
    expect(out.balanceSheet.shortTermInvestment).toBeCloseTo(0, 6);
    expect(Math.abs(balanceGap(out.balanceSheet))).toBeLessThan(0.01);
  });

  it("on ne place jamais plus que ce dont on dispose à l'ouverture", () => {
    const out = simulateRound(
      input({
        companies: [
          // Bilan d'ouverture équilibré : 135 000 + 30 000 = 165 000.
          company("a", {
            finance: { ...company("a").finance, cash: 30000, equity: 165000 },
          }),
          company("b"),
        ],
        decisions: { a: { ...base(), treasury: { placement: 500000 } }, b: base() },
      }),
    ).results["a"]!;
    expect(out.treasury!.placed).toBeCloseTo(30000, 6);
    expect(Math.abs(balanceGap(out.balanceSheet))).toBeLessThan(0.01);
  });

  it("placer tout son cash fait tomber en découvert : la leçon du tour", () => {
    // Clientèle à 45 jours : la moitié du chiffre d'affaires part en créances.
    // Le tour se boucle sans découvert, mais il ne reste pas grand-chose.
    const aCredit = scenario({
      market: {
        ...scenario().market,
        segments: [{ ...scenario().market.segments[0]!, paymentDelayDays: 45 }],
      },
    });
    const sans = simulateRound(input({ scenario: aCredit })).results["a"]!;
    expect(sans.balanceSheet.overdraft).toBeCloseTo(0, 6);

    const avec = simulateRound(
      input({
        scenario: aCredit,
        decisions: { a: { ...base(), treasury: { placement: 100000 } }, b: base() },
      }),
    ).results["a"]!;

    // On détient 100 000 € placés à 2 % ET un découvert à 12 %.
    expect(avec.balanceSheet.shortTermInvestment).toBeCloseTo(100000, 6);
    expect(avec.balanceSheet.overdraft).toBeGreaterThan(0);
    expect(avec.balanceSheet.cash).toBeCloseTo(0, 6);
    expect(Math.abs(balanceGap(avec.balanceSheet))).toBeLessThan(0.01);
  });

  it("un scénario sans taux de placement ignore la demande", () => {
    const sansTaux = scenario({
      treasury: {
        discountAnnualRate: 0.06,
        discountMaxShare: 0.6,
        factoringFeeRate: 0.025,
        forcedFactoringFeeRate: 0.05,
      },
    });
    const out = simulateRound(
      input({
        scenario: sansTaux,
        decisions: { a: { ...base(), treasury: { placement: 40000 } }, b: base() },
      }),
    ).results["a"]!;
    expect(out.balanceSheet.shortTermInvestment ?? 0).toBe(0);
    expect(Math.abs(balanceGap(out.balanceSheet))).toBeLessThan(0.01);
  });
});
