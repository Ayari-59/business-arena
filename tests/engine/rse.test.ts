import { describe, expect, it } from "vitest";
import { simulateRound } from "@/engine/simulation";
import { balanceGap } from "@/engine/finance/statements";
import { DEFAULT_RSE_CONFIG, RSE_CARD_CODES } from "@/engine/rse";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
} from "@/engine/types";

/**
 * ENGAGEMENT RSE — LOT 2, effets moteur.
 *
 * On vérifie l'arbitrage « payer maintenant, gagner plus tard » de bout en
 * bout : la dépense est une charge décaissée (elle coûte ce tour), l'effet
 * image est DIFFÉRÉ (nul le tour de la première dépense, présent au suivant),
 * l'investissement propre réduit les rebuts, et l'invariant comptable tient.
 */

const scenario = (): EngineScenarioConfig => ({
  code: "test-rse",
  version: "1",
  roundsCount: 6,
  roundDays: 90,
  market: {
    segments: [
      {
        code: "main",
        name: "Principal",
        size: 8000,
        growth: 0,
        priceElasticity: -1.5,
        refPrice: 60,
        minAcceptablePrice: 30,
        psychThresholds: [],
        marketingSensitivity: 0.15,
        qualitySensitivity: 0.3,
        loyalty: 0,
        priceEffectBounds: { min: 0.2, max: 4 },
        paymentDelayDays: 30,
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
  // Non-qualité active : indispensable pour observer la réduction des rebuts.
  qualityCosts: { baseDefectRate: 0.1, externalReturnSensitivity: 0.5 },
  finance: {
    loanAnnualRate: 0.06,
    overdraftAnnualRate: 0.12,
    overdraftLimit: 30000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 30,
    depreciationPerRound: 3000,
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
    fixedAssetsNet: 100000,
    inventoryValue: 0,
    receivables: 0,
    cash: 45000,
    equity: 100000,
    financialDebt: 45000,
    payables: 0,
    overdraft: 0,
  },
  lastMarketShare: {},
  ...over,
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
  companies: [company("a"), company("b")],
  decisions: { a: baseDecisions(), b: baseDecisions() },
  activeEvents: [],
  seed: 4242,
  ...over,
});

describe("RSE Lot 2 : la dépense coûte maintenant", () => {
  it("engager un budget RSE réduit le résultat du tour et apparaît en charge", () => {
    const out = simulateRound(
      input({
        decisions: {
          a: { ...baseDecisions(), rse: { budget: 12000 } },
          b: baseDecisions(),
        },
      }),
    );
    const a = out.results["a"]!;
    const b = out.results["b"]!;
    // Charge visible au compte de résultat…
    expect(a.incomeStatement.engagementRse).toBeCloseTo(12000, 6);
    expect(b.incomeStatement.engagementRse ?? 0).toBe(0);
    // …et EBE plus bas de ce montant (tout le reste égal par ailleurs).
    expect(b.incomeStatement.ebitda - a.incomeStatement.ebitda).toBeCloseTo(12000, 6);
  });

  it("l'invariant du bilan tient avec une dépense RSE (budget + investissement)", () => {
    const out = simulateRound(
      input({
        decisions: {
          a: { ...baseDecisions(), rse: { budget: 9000, investment: 7000 } },
          b: baseDecisions(),
        },
      }),
    );
    for (const r of Object.values(out.results)) {
      expect(Math.abs(balanceGap(r.balanceSheet))).toBeLessThan(0.01);
    }
  });
});

describe("RSE Lot 2 : l'effet image est différé", () => {
  it("le tour de la première dépense, l'attractivité est inchangée (capital d'ouverture nul)", () => {
    const out = simulateRound(
      input({
        decisions: {
          a: { ...baseDecisions(), rse: { budget: 15000 } },
          b: baseDecisions(),
        },
      }),
    );
    // Décisions identiques par ailleurs ⇒ mêmes parts CE tour : la RSE n'a pas
    // encore d'effet sur la demande (elle vient de payer, pas encore de récolter).
    expect(out.results["a"]!.market.totalShare).toBeCloseTo(
      out.results["b"]!.market.totalShare,
      6,
    );
    // Le capital d'image est constitué pour le tour suivant.
    const nextA = out.companies.find((c) => c.id === "a")!;
    expect(nextA.rseImageCapital ?? 0).toBeGreaterThan(0);
  });

  it("au tour suivant, le capital acquis relève la part de marché", () => {
    const r1 = simulateRound(
      input({
        decisions: {
          a: { ...baseDecisions(), rse: { budget: 15000 } },
          b: baseDecisions(),
        },
      }),
    );
    // Tour 2 : mêmes décisions, mais A porte désormais du capital-image.
    const r2 = simulateRound({
      scenario: scenario(),
      roundIndex: 2,
      companies: r1.companies,
      decisions: {
        a: { ...baseDecisions(), rse: { budget: 15000 } },
        b: baseDecisions(),
      },
      activeEvents: [],
      seed: 4242,
    });
    expect(r2.results["a"]!.market.totalShare).toBeGreaterThan(
      r2.results["b"]!.market.totalShare,
    );
  });
});

describe("RSE Lot 2 : l'investissement propre réduit les rebuts", () => {
  it("à capital « process propre » égal, plus de capital ⇒ moins de rebuts", () => {
    const out = simulateRound(
      input({
        companies: [
          company("a", { rseCleanCapital: 2 }),
          company("b", { rseCleanCapital: 0 }),
        ],
      }),
    );
    const a = out.results["a"]!;
    const b = out.results["b"]!;
    expect(a.production.produced).toBeCloseTo(b.production.produced, 6);
    expect(a.qualityCosts!.defectUnits).toBeLessThan(b.qualityCosts!.defectUnits);
  });
});

describe("RSE Lot 2B : climat social (moins de départs)", () => {
  const hrConfig = {
    salaryPerEmployeePerRound: 8000,
    includedHeadcount: 4,
    hiringCost: 5000,
    firingCost: 3000,
    trainingScale: 5000,
    trainingSensitivity: 0.1,
    maxProductivity: 1.5,
    moraleSensitivity: 0.2,
    attritionThreshold: 0.95,
    maxHiresPerRound: 3,
    maxHeadcount: 10,
  };

  it("un capital-image élevé retient les salariés quand le salaire glisse sous le marché", () => {
    const sc = { ...scenario(), hr: hrConfig };
    const out = simulateRound({
      scenario: sc,
      roundIndex: 1,
      // Salaire 0,90 < seuil d'attrition 0,95 : sans RSE, un départ ; avec un
      // capital-image mûr, le seuil effectif descend et personne ne part.
      companies: [company("a", { rseImageCapital: 3 }), company("b")],
      decisions: {
        a: { ...baseDecisions(), hr: { salaryIndex: 0.9 } },
        b: { ...baseDecisions(), hr: { salaryIndex: 0.9 } },
      },
      activeEvents: [],
      seed: 4242,
    });
    expect(out.results["a"]!.hr!.departed).toBe(0);
    expect(out.results["b"]!.hr!.departed).toBe(1);
    expect(out.results["a"]!.rse!.attritionRelief).toBeGreaterThan(0);
  });
});

describe("RSE Lot 2B : financement vert", () => {
  const bankConfig = { memory: 0.7, maxOverdraftSpread: 0.1, minOverdraftShare: 0.3 };

  it("à confiance partielle, le capital-image adoucit le taux de découvert (intérêts plus bas)", () => {
    const sc = { ...scenario(), finance: { ...scenario().finance, bank: bankConfig } };
    // Découvert d'ouverture identique, confiance partielle identique : seul le
    // capital-image RSE distingue A de B.
    const inOverdraft = (id: string, over = {}) =>
      company(id, {
        bankTrust: 0.5,
        finance: {
          // Bilan d'ouverture équilibré : actif 100 000 = capitaux propres
          // 80 000 + découvert 20 000.
          fixedAssetsNet: 100000,
          inventoryValue: 0,
          receivables: 0,
          cash: 0,
          equity: 80000,
          financialDebt: 0,
          payables: 0,
          overdraft: 20000,
        },
        ...over,
      });
    const out = simulateRound({
      scenario: sc,
      roundIndex: 1,
      companies: [inOverdraft("a", { rseImageCapital: 3 }), inOverdraft("b")],
      decisions: { a: baseDecisions(), b: baseDecisions() },
      activeEvents: [],
      seed: 4242,
    });
    expect(out.results["a"]!.rse!.financingBonus).toBeGreaterThan(0);
    expect(out.results["b"]!.rse?.financingBonus ?? 0).toBe(0);
    // Taux de découvert plus doux ⇒ charges financières plus basses pour A.
    expect(out.results["a"]!.incomeStatement.interest).toBeLessThan(
      out.results["b"]!.incomeStatement.interest,
    );
  });
});

describe("RSE Lot 2C : cartes événement", () => {
  const withCards = (over: Partial<(typeof DEFAULT_RSE_CONFIG)["cards"]>) => ({
    ...scenario(),
    rse: { ...DEFAULT_RSE_CONFIG, cards: { ...DEFAULT_RSE_CONFIG.cards, ...over } },
  });

  it("🏅 un capital-image mûr décroche le label et gagne des parts", () => {
    const out = simulateRound({
      scenario: withCards({ minRound: 1 }),
      roundIndex: 1,
      companies: [company("a", { rseImageCapital: 1 }), company("b")],
      decisions: { a: baseDecisions(), b: baseDecisions() },
      activeEvents: [],
      seed: 4242,
    });
    expect(out.newEvents.some((e) => e.code === RSE_CARD_CODES.label && e.companyId === "a")).toBe(
      true,
    );
    expect(out.results["a"]!.market.totalShare).toBeGreaterThan(
      out.results["b"]!.market.totalShare,
    );
  });

  it("📢 un engagement tiède déclenche le bad buzz et perd des parts", () => {
    const out = simulateRound({
      scenario: withCards({ minRound: 1, badBuzzProbability: 1 }),
      roundIndex: 1,
      // A : capital dans la zone tiède (0 < 0,15 < plafond) ; B : jamais engagé.
      companies: [company("a", { rseImageCapital: 0.15 }), company("b")],
      decisions: { a: baseDecisions(), b: baseDecisions() },
      activeEvents: [],
      seed: 4242,
    });
    expect(
      out.newEvents.some((e) => e.code === RSE_CARD_CODES.badBuzz && e.companyId === "a"),
    ).toBe(true);
    expect(out.results["a"]!.market.totalShare).toBeLessThan(
      out.results["b"]!.market.totalShare,
    );
  });

  it("aucune carte avant l'horizon minRound, même à capital mûr", () => {
    const out = simulateRound({
      scenario: withCards({ minRound: 5 }),
      roundIndex: 2,
      companies: [company("a", { rseImageCapital: 1 }), company("b")],
      decisions: { a: baseDecisions(), b: baseDecisions() },
      activeEvents: [],
      seed: 4242,
    });
    expect(
      out.newEvents.some(
        (e) => e.code === RSE_CARD_CODES.label || e.code === RSE_CARD_CODES.badBuzz,
      ),
    ).toBe(false);
  });

  it("aucune carte RSE pour une entreprise qui n'a jamais engagé (capital nul)", () => {
    const out = simulateRound({
      scenario: withCards({ minRound: 1, badBuzzProbability: 1 }),
      roundIndex: 3,
      companies: [company("a"), company("b")],
      decisions: { a: baseDecisions(), b: baseDecisions() },
      activeEvents: [],
      seed: 4242,
    });
    expect(
      out.newEvents.some(
        (e) => e.code === RSE_CARD_CODES.label || e.code === RSE_CARD_CODES.badBuzz,
      ),
    ).toBe(false);
  });
});

describe("RSE Lot 2 : rétro-compatibilité", () => {
  it("sans aucune décision RSE, aucun champ rse, aucun capital, aucune charge", () => {
    const out = simulateRound(input());
    const a = out.results["a"]!;
    expect(a.rse).toBeUndefined();
    expect(a.incomeStatement.engagementRse).toBeUndefined();
    const nextA = out.companies.find((c) => c.id === "a")!;
    expect(nextA.rseImageCapital).toBeUndefined();
    expect(nextA.rseCleanCapital).toBeUndefined();
  });
});
