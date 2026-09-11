import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import { rawDimensionScoresV2 } from "../../src/scoring/bpi";
import type {
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * Faillite (cessation de paiements, V2 couche 2, #5).
 *
 * Deux tours consécutifs de crise de trésorerie caractérisée (découvert au-delà
 * du plafond, plus aucune créance à céder) rendent l'entreprise défaillante :
 * elle est alors gelée (ne produit plus, ne dépense plus, n'emprunte plus),
 * seule la recapitalisation restant ouverte — un apport qui la ramène sous le
 * plafond la fait repasser active. Sa performance financière tombe au plancher.
 */

const scenario = (over: Partial<EngineScenarioConfig> = {}): EngineScenarioConfig => ({
  code: "test",
  version: "1",
  roundsCount: 6,
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
        paymentDelayDays: 0, // tout comptant : aucune créance à céder
      },
    ],
    seasonality: [1, 1, 1, 1, 1, 1],
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
    overdraftLimit: 20000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 30,
    depreciationPerRound: 3000,
    loanDurationRounds: 16,
  },
  treasury: {
    discountAnnualRate: 0.06,
    discountMaxShare: 0.6,
    factoringFeeRate: 0.025,
    forcedFactoringFeeRate: 0.05,
  },
  fixedCostsPerRound: 220000, // charges de structure écrasantes : la caisse plonge
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

const company = (): CompanyState => ({
  id: "a",
  name: "a",
  controller: "human",
  perceivedQuality: 1,
  machineCapacity: 5500,
  availability: 1,
  headcount: 4,
  hoursPerEmployee: 450,
  productivity: 1,
  finishedGoods: { quantity: 0, unitCost: 0 },
  loans: [{ remaining: 80000, perRound: 5000 }],
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
  productionPlan: 4000,
  marketingBudget: 8000,
  qualityBudget: 2000,
  maintenanceBudget: 5000,
});

const tour = (roundIndex: number, companies: CompanyState[], dec: RoundDecisions): SimulationInput => ({
  scenario: scenario(),
  roundIndex,
  companies,
  decisions: { a: dec },
  activeEvents: [],
  seed: 42,
});

const societeA = (out: ReturnType<typeof simulateRound>) => out.companies.find((c) => c.id === "a")!;

describe("faillite", () => {
  it("une première crise avertit sans déclarer la défaillance", () => {
    const r1 = simulateRound(tour(1, [company()], base()));
    expect(r1.results["a"]!.treasury!.crisis).toBe(true);
    expect(r1.results["a"]!.defaillant).toBeUndefined();
    expect(societeA(r1).crisisStreak).toBe(1);
    expect(societeA(r1).status ?? "active").toBe("active");
  });

  it("deux crises consécutives rendent l'entreprise défaillante", () => {
    const r1 = simulateRound(tour(1, [company()], base()));
    const r2 = simulateRound(tour(2, r1.companies, base()));
    expect(r2.results["a"]!.defaillant).toBe(true);
    expect(societeA(r2).status).toBe("defaillant");
    expect(societeA(r2).crisisStreak).toBe(2);
  });

  it("une entreprise défaillante est gelée : elle ne produit ni ne dépense plus", () => {
    const r1 = simulateRound(tour(1, [company()], base()));
    const r2 = simulateRound(tour(2, r1.companies, base()));
    // Le joueur pousse un gros plan et de gros budgets : ils sont ignorés.
    const r3 = simulateRound(
      tour(3, r2.companies, { ...base(), productionPlan: 9999, marketingBudget: 90000, qualityBudget: 90000 }),
    );
    const a3 = r3.results["a"]!;
    expect(a3.production.produced).toBe(0);
    expect(a3.incomeStatement.marketingCost).toBe(0);
    expect(a3.incomeStatement.qualityCost).toBe(0);
    // Toujours défaillante : les charges de structure continuent de creuser.
    expect(a3.defaillant).toBe(true);
  });

  it("une recapitalisation suffisante fait repasser l'entreprise active", () => {
    const r1 = simulateRound(tour(1, [company()], base()));
    const r2 = simulateRound(tour(2, r1.companies, base()));
    const r3 = simulateRound(
      tour(3, r2.companies, { ...base(), finance: { capitalIncrease: 2_000_000 } }),
    );
    const a3 = r3.results["a"]!;
    expect(a3.defaillant).toBeUndefined();
    expect(societeA(r3).status).toBe("active");
    expect(societeA(r3).crisisStreak).toBe(0);
    // L'apport est bien pris en compte malgré le gel (capitaux propres en hausse).
    expect(societeA(r3).finance.equity).toBeGreaterThan(societeA(r2).finance.equity);
  });

  it("une entreprise défaillante n'écoule pas son stock résiduel, même sur commande ferme", () => {
    // Défaillante, avec un stock de tours passés. Une commande ferme (événement)
    // arrive : sans garde, elle puisait dans ce stock — une entreprise à l'arrêt
    // se remettait à vendre. Elle ne doit rien vendre ; son stock reste gelé.
    const defaillante: CompanyState = {
      ...company(),
      status: "defaillant",
      crisisStreak: 2,
      finishedGoods: { quantity: 1000, unitCost: 20 },
    };
    const commandeFerme: EventInstance = {
      code: "big_order",
      scope: "company",
      companyId: "a",
      roundsLeft: 1,
      modifiers: [{ target: "order", op: "add", value: 500 }],
    };
    const out = simulateRound({
      scenario: scenario(),
      roundIndex: 3,
      companies: [defaillante],
      decisions: { a: base() },
      activeEvents: [commandeFerme],
      seed: 42,
    });
    const a = out.results["a"]!;
    expect(a.incomeStatement.revenue).toBe(0); // aucune vente
    expect(a.production.produced).toBe(0); // aucune production
    expect(societeA(out).finishedGoods.quantity).toBe(1000); // stock intact
  });

  it("la performance financière d'une entreprise défaillante est au plancher", () => {
    const r1 = simulateRound(tour(1, [company()], base()));
    const r2 = simulateRound(tour(2, r1.companies, base()));
    const scores = rawDimensionScoresV2({
      scenario: scenario(),
      result: r2.results["a"]!,
      pedagogy: { situationScores: [], carried: false, coherence: null, previousNetIncome: 0 },
    });
    expect(scores.financial).toBe(0);
  });
});
