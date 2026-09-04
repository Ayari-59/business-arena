import { describe, expect, it } from "vitest";
import { simulateRound, fleetMaintenanceMultiplier } from "../../src/engine/simulation";
import { createRng } from "../../src/engine/random";
import type {
  CompanyState,
  EngineScenarioConfig,
  EquipmentItem,
  EquipmentTypeDef,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

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
  events: [
    {
      code: "raw_material_spike",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.25 }],
    },
  ],
  scriptedEvents: [{ round: 2, eventCode: "raw_material_spike" }],
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
  decisions: { a: baseDecisions(), b: { ...baseDecisions(), price: 54 } },
  activeEvents: [],
  seed: 12345,
  ...over,
});

describe("simulateRound : déterminisme (ADR-05)", () => {
  it("mêmes entrées ⇒ mêmes sorties, au bit près", () => {
    const a = simulateRound(input());
    const b = simulateRound(input());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it("une graine différente peut produire un autre tirage (pas les mêmes objets figés)", () => {
    // le tirage probabiliste est vide ici (probability 0), mais le pipeline reste stable
    const a = simulateRound(input({ seed: 1 }));
    const b = simulateRound(input({ seed: 2 }));
    expect(Object.keys(a.results)).toEqual(Object.keys(b.results));
  });
});

describe("simulateRound : cohérence économique et comptable", () => {
  it("le prix bas de b lui donne plus de volume, a garde plus de marge unitaire", () => {
    const out = simulateRound(input());
    const a = out.results["a"]!;
    const b = out.results["b"]!;
    expect(b.market.totalShare).toBeGreaterThan(a.market.totalShare);
    expect(a.breakeven.breakEvenUnits).toBeLessThan(b.breakeven.breakEvenUnits!);
  });
  it("production bornée par les capacités, jamais par décret (§13)", () => {
    const out = simulateRound(
      input({ decisions: { a: { ...baseDecisions(), productionPlan: 99999 }, b: baseDecisions() } }),
    );
    const a = out.results["a"]!;
    expect(a.production.produced).toBeLessThanOrEqual(a.production.machineCapacity + 1e-9);
    expect(a.production.produced).toBeLessThanOrEqual(a.production.laborCapacity + 1e-9);
  });
  it("TN = FRNG − BFR = trésorerie − découvert pour chaque entreprise", () => {
    const out = simulateRound(input());
    for (const r of Object.values(out.results)) {
      expect(r.functionalBalance.netTreasury).toBeCloseTo(
        r.functionalBalance.frng - r.functionalBalance.bfr,
        6,
      );
      expect(r.functionalBalance.netTreasury).toBeCloseTo(
        r.balanceSheet.cash - r.balanceSheet.overdraft,
        6,
      );
    }
  });
  it("décisions manquantes ⇒ erreur explicite (la reconduction se fait en amont, ADR-04)", () => {
    expect(() => simulateRound(input({ decisions: { a: baseDecisions() } }))).toThrow();
  });
});

describe("simulateRound : événements scriptés (doc 02 §7)", () => {
  it("la hausse matières du tour 2 renchérit le coût variable de production", () => {
    const round1 = simulateRound(input());
    const round2 = simulateRound(
      input({
        roundIndex: 2,
        companies: round1.companies,
        activeEvents: round1.events,
      }),
    );
    expect(round2.newEvents.map((e) => e.code)).toContain("raw_material_spike");
    const a2 = round2.results["a"]!;
    const produced = a2.production.produced;
    // coût variable de production = produit × (22 × 1,25 + 16)
    expect(a2.incomeStatement.variableProductionCost).toBeCloseTo(produced * (22 * 1.25 + 16), 6);
    // l'événement (durée 2) reste actif pour le tour suivant
    expect(round2.events.map((e) => e.code)).toContain("raw_material_spike");
  });
});

describe("simulateRound : partie chaînée et propriété d'équilibre (doc 09 §2)", () => {
  it("3 tours chaînés : bilans équilibrés, stocks et parts cohérents", () => {
    let companies = [company("a"), company("b")];
    let events: SimulationInput["activeEvents"] = [];
    for (let round = 1; round <= 3; round++) {
      const out = simulateRound(
        input({ roundIndex: round, companies, activeEvents: events }),
      );
      for (const r of Object.values(out.results)) {
        // l'équilibre du bilan est déjà garanti par le moteur (throw sinon) ;
        // on vérifie ici les invariants de marché
        expect(r.market.totalShare).toBeGreaterThanOrEqual(0);
        expect(r.market.totalShare).toBeLessThanOrEqual(1);
      }
      companies = out.companies;
      events = out.events;
    }
  });

  it("50 tours de décisions pseudo-aléatoires seedées : aucun déséquilibre", () => {
    const rng = createRng(987);
    let companies = [company("a"), company("b")];
    let events: SimulationInput["activeEvents"] = [];
    for (let i = 0; i < 50; i++) {
      const randomDecisions = (): RoundDecisions => ({
        price: 20 + rng.next() * 80,
        productionPlan: rng.next() * 8000,
        marketingBudget: rng.next() * 30000,
        qualityBudget: rng.next() * 10000,
        maintenanceBudget: rng.next() * 8000,
        finance: { newLoan: rng.next() * 20000, loanRepayment: rng.next() * 10000 },
      });
      const out = simulateRound(
        input({
          roundIndex: (i % 3) + 1,
          companies,
          activeEvents: events,
          decisions: { a: randomDecisions(), b: randomDecisions() },
          seed: 1000 + i,
        }),
      );
      for (const r of Object.values(out.results)) {
        expect(r.functionalBalance.netTreasury).toBeCloseTo(
          r.balanceSheet.cash - r.balanceSheet.overdraft,
          4,
        );
      }
      companies = out.companies;
      events = out.events;
    }
  });
});

describe("fleetMaintenanceMultiplier", () => {
  const typeDefs: EquipmentTypeDef[] = [
    { code: "eco", name: "Éco", capacityPerUnit: 10, costPerUnit: 5000, depreciationRounds: 8, maintenanceMultiplier: 0.7, maxPerRound: 3 },
    { code: "std", name: "Std", capacityPerUnit: 10, costPerUnit: 8000, depreciationRounds: 8, maintenanceMultiplier: 1.0, maxPerRound: 3 },
    { code: "pro", name: "Pro", capacityPerUnit: 10, costPerUnit: 12000, depreciationRounds: 8, maintenanceMultiplier: 1.3, maxPerRound: 3 },
  ];
  const types = new Map<string, EquipmentTypeDef>(typeDefs.map((t) => [t.code, t]));

  it("renvoie 1 pour un parc vide", () => {
    expect(fleetMaintenanceMultiplier([], types)).toBe(1);
  });

  it("renvoie le multiplicateur exact pour un parc homogène", () => {
    const fleet: EquipmentItem[] = [{ typeCode: "pro", count: 5, acquiredRound: 1, bookValue: 60000 }];
    expect(fleetMaintenanceMultiplier(fleet, types)).toBe(1.3);
  });

  it("moyenne pondérée par capacité pour un parc mixte", () => {
    const fleet: EquipmentItem[] = [
      { typeCode: "eco", count: 3, acquiredRound: 1, bookValue: 15000 },
      { typeCode: "pro", count: 2, acquiredRound: 1, bookValue: 24000 },
    ];
    // (3×10×0.7 + 2×10×1.3) / (3×10 + 2×10) = (21 + 26) / 50 = 0.94
    expect(fleetMaintenanceMultiplier(fleet, types)).toBeCloseTo(0.94, 10);
  });
});

describe("maintenanceMultiplier affecte la disponibilité", () => {
  it("un parc premium (×1.3) perd plus de disponibilité qu'un parc standard à budget égal", () => {
    const eqTypes: EngineScenarioConfig["equipment"] = {
      types: [
        { code: "std", name: "Std", capacityPerUnit: 1100, costPerUnit: 50000, depreciationRounds: 8, maintenanceMultiplier: 1.0, maxPerRound: 5 },
        { code: "pro", name: "Pro", capacityPerUnit: 1100, costPerUnit: 80000, depreciationRounds: 8, maintenanceMultiplier: 1.3, maxPerRound: 5 },
      ],
      initialFleet: [{ typeCode: "std", count: 5 }],
    };
    const s = { ...scenario(), equipment: eqTypes };
    const stdFleet: EquipmentItem[] = [{ typeCode: "std", count: 5, acquiredRound: 0, bookValue: 250000 }];
    const proFleet: EquipmentItem[] = [{ typeCode: "pro", count: 5, acquiredRound: 0, bookValue: 400000 }];
    const makeInput = (fleet: EquipmentItem[]): SimulationInput => ({
      scenario: s,
      roundIndex: 1,
      companies: [
        { ...company("a"), fleet, machineCapacity: 5500, availability: 0.9 },
        { ...company("b"), machineCapacity: 5500, availability: 0.9, fleet: stdFleet },
      ],
      decisions: { a: baseDecisions(), b: baseDecisions() },
      activeEvents: [],
      seed: 42,
    });
    const outStd = simulateRound(makeInput(stdFleet));
    const outPro = simulateRound(makeInput(proFleet));
    const availStd = outStd.companies.find((c) => c.id === "a")!.availability;
    const availPro = outPro.companies.find((c) => c.id === "a")!.availability;
    expect(availPro).toBeLessThan(availStd);
  });
});
