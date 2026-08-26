import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import { applyPeriodicity, applyPeriodicityToCompany } from "../../src/config/scenarios/periodicity";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * Engagements financiers (doc 02 §6.3, §6.5) : échéanciers d'emprunt
 * OBLIGATOIRES (le remboursement décidé devient un anticipé), mobilisation du
 * poste clients (escompte plafonné / affacturage), plafond de découvert
 * appliqué — au-delà, affacturage forcé ; sans créances, crise caractérisée.
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
        paymentDelayDays: 45, // la moitié du CA reste en créances : matière à mobiliser
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
  machineCapacity: 5500,
  availability: 1,
  headcount: 4,
  hoursPerEmployee: 450,
  productivity: 1,
  finishedGoods: { quantity: 0, unitCost: 0 },
  loans: [{ remaining: 80000, perRound: 5000 }],
  finance: {
    fixedAssetsNet: 135000, // équilibre d'ouverture : 135 000 + 100 000 = 155 000 + 80 000
    inventoryValue: 0,
    receivables: 0,
    cash: 100000, // assez pour que le tour de référence ne déclenche PAS d'affacturage forcé
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

const input = (over: Partial<SimulationInput> = {}): SimulationInput => ({
  scenario: scenario(),
  roundIndex: 1,
  companies: [company("a"), company("b")],
  decisions: { a: base(), b: base() },
  activeEvents: [],
  seed: 42,
  ...over,
});

describe("échéanciers d'emprunt obligatoires", () => {
  it("l'échéance est prélevée même sans aucune décision", () => {
    const out = simulateRound(input());
    const a = out.results["a"]!;
    expect(a.debt).toMatchObject({ mandatoryRepayment: 5000, earlyRepayment: 0, newLoan: 0 });
    expect(a.balanceSheet.financialDebt).toBeCloseTo(75000, 6);
    expect(a.debt!.nextMandatory).toBeCloseTo(5000, 6);
    const nextLoans = out.companies.find((c) => c.id === "a")!.loans!;
    expect(nextLoans[0]!.remaining).toBeCloseTo(75000, 6);
    const item = a.cashFlow.items.find((i) => i.label === "remboursement_emprunt");
    expect(item?.amount).toBeCloseTo(-5000, 6);
  });

  it("le remboursement décidé est un ANTICIPÉ qui s'ajoute à l'échéance", () => {
    const out = simulateRound(
      input({ decisions: { a: { ...base(), finance: { loanRepayment: 10000 } }, b: base() } }),
    );
    const a = out.results["a"]!;
    expect(a.debt).toMatchObject({ mandatoryRepayment: 5000, earlyRepayment: 10000 });
    expect(a.balanceSheet.financialDebt).toBeCloseTo(65000, 6);
  });

  it("un nouvel emprunt s'étale sur la durée contractuelle, 1re échéance à t+1", () => {
    const r1 = simulateRound(
      input({ decisions: { a: { ...base(), finance: { newLoan: 32000 } }, b: base() } }),
    );
    const a1 = r1.results["a"]!;
    expect(a1.debt!.newLoan).toBe(32000);
    expect(a1.debt!.mandatoryRepayment).toBeCloseTo(5000, 6); // l'ancien seul ce tour
    expect(a1.debt!.nextMandatory).toBeCloseTo(5000 + 32000 / 16, 6);
    const r2 = simulateRound(
      input({ roundIndex: 2, companies: r1.companies, decisions: { a: base(), b: base() } }),
    );
    expect(r2.results["a"]!.debt!.mandatoryRepayment).toBeCloseTo(7000, 6);
  });

  it("sans échéancier au scénario : remboursement libre (comportement historique)", () => {
    const legacy = scenario();
    legacy.finance = { ...legacy.finance, loanDurationRounds: undefined };
    const out = simulateRound(input({ scenario: legacy }));
    expect(out.results["a"]!.debt).toBeUndefined();
    expect(out.results["a"]!.balanceSheet.financialDebt).toBeCloseTo(80000, 6);
  });
});

describe("mobilisation du poste clients", () => {
  it("escompte plafonné à sa part du poste, coût en charges financières", () => {
    const plain = simulateRound(input());
    const out = simulateRound(
      input({ decisions: { a: { ...base(), treasury: { discount: 1e9 } }, b: base() } }),
    );
    const a = out.results["a"]!;
    const plainA = plain.results["a"]!;
    const gross = plainA.balanceSheet.receivables;
    expect(plainA.treasury?.forcedFactored ?? 0).toBe(0); // baseline propre
    expect(a.treasury!.discounted).toBeCloseTo(0.6 * gross, 4);
    expect(a.balanceSheet.receivables).toBeCloseTo(0.4 * gross, 4);
    // agios = montant × 6 % × 90/360, en charges financières
    const expectedCost = a.treasury!.discounted * 0.06 * 0.25;
    expect(a.treasury!.financingCost).toBeCloseTo(expectedCost, 4);
    expect(a.incomeStatement.interest - plainA.incomeStatement.interest).toBeCloseTo(
      expectedCost,
      4,
    );
  });

  it("l'affacturage prend le relais au-delà, à sa commission", () => {
    const out = simulateRound(
      input({
        decisions: { a: { ...base(), treasury: { discount: 1e9, factoring: 1e9 } }, b: base() },
      }),
    );
    const a = out.results["a"]!;
    expect(a.balanceSheet.receivables).toBeCloseTo(0, 4); // tout mobilisé
    expect(a.treasury!.factored).toBeGreaterThan(0);
    expect(a.treasury!.financingCost).toBeGreaterThan(a.treasury!.factored * 0.025);
  });
});

describe("plafond de découvert", () => {
  // charges de structure alourdies : le tour plonge sous le plafond, mais le
  // poste clients suffit encore à combler l'écart (cession forcée possible)
  const drained = scenario({ fixedCostsPerRound: 150000 });

  it("au-delà du plafond, la banque force l'affacturage — le solde revient dans les clous", () => {
    const out = simulateRound(input({ scenario: drained }));
    const a = out.results["a"]!;
    expect(a.treasury!.forcedFactored).toBeGreaterThan(0);
    expect(a.cashFlow.closing).toBeGreaterThanOrEqual(-20000 - 0.01);
    expect(a.treasury!.crisis).toBe(false);
  });

  it("sans créances à céder : crise de trésorerie caractérisée", () => {
    const noCredit = scenario({ fixedCostsPerRound: 220000 });
    noCredit.market = {
      ...noCredit.market,
      segments: noCredit.market.segments.map((s) => ({ ...s, paymentDelayDays: 0 })),
    };
    const out = simulateRound(input({ scenario: noCredit }));
    const a = out.results["a"]!;
    expect(a.treasury!.forcedFactored).toBe(0);
    expect(a.treasury!.crisis).toBe(true);
    expect(a.cashFlow.closing).toBeLessThan(-20000);
  });
});

describe("périodicité des engagements", () => {
  it("même emprunt, même durée réelle : durée en tours ÷k, échéance par tour ×k", () => {
    const monthly = applyPeriodicity(scenario(), "month");
    expect(monthly.finance.loanDurationRounds).toBeCloseTo(48, 6); // 16 trimestres = 48 mois
    const c = applyPeriodicityToCompany(company("a"), "month");
    expect(c.loans![0]!.perRound).toBeCloseTo(5000 / 3, 6);
    expect(c.loans![0]!.remaining).toBe(80000); // la dette est un stock, pas un flux
  });
});
