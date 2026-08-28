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
 * Le dividende : la décision du niveau 6 (Executive).
 *
 * Les cinq premiers niveaux ouvrent chacun des décisions nouvelles, le sixième
 * se contentait de retirer les deux indices restants. Retirer une aide n'est
 * pas ouvrir un cran : il lui fallait un arbitrage à lui. C'est l'affectation
 * du résultat, la décision de direction par excellence, et la seule qui mette
 * l'élève face aux ASSOCIÉS plutôt qu'au marché.
 *
 * Trois règles, et chacune enseigne quelque chose :
 *
 * - on ne distribue que les RÉSERVES, les bénéfices des tours passés. Le
 *   résultat du tour en cours n'est pas connu quand la décision se prend ;
 * - des pertes accumulées ferment la distribution jusqu'à ce qu'elles soient
 *   rattrapées ;
 * - la caisse n'est PAS un plafond. Une entreprise rentable peut ne pas avoir
 *   de quoi payer son dividende, et découvrir que résultat et trésorerie sont
 *   deux choses différentes. C'est la leçon, pas un défaut.
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
    loanAnnualRate: 0.05,
    overdraftAnnualRate: 0.12,
    overdraftLimit: 200000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 0,
    depreciationPerRound: 3000,
    maxCapitalIncreaseTotal: 100000,
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

const base = (): RoundDecisions => ({
  price: 59,
  productionPlan: 4500,
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

/**
 * Joue un tour et renvoie le résultat ET l'état de sortie de « a ».
 *
 * Charges de structure allégées : le décor voisin fait perdre de l'argent au
 * premier tour, or il faut des bénéfices pour avoir quoi que ce soit à
 * distribuer. C'est le sujet même du test.
 */
function jouer(over: Partial<SimulationInput> = {}) {
  const out = simulateRound(
    input({ scenario: scenario({ fixedCostsPerRound: 20_000 }), ...over }),
  );
  return {
    res: out.results["a"]!,
    etat: out.companies.find((c) => c.id === "a")!,
  };
}

const tresorerie = (b: { cash: number; overdraft: number }) => b.cash - b.overdraft;

describe("dividende et réserves", () => {
  it("au premier tour, il n'y a rien à distribuer", () => {
    // Réserves absentes de l'état initial : une entreprise qui démarre n'a pas
    // encore de bénéfices, quel que soit son capital.
    const sans = jouer();
    const avec = jouer({
      decisions: { a: { ...base(), finance: { dividend: 50_000 } }, b: base() },
    });
    expect(avec.res.balanceSheet.equity).toBeCloseTo(sans.res.balanceSheet.equity, 6);
    expect(avec.res.balanceSheet.cash).toBeCloseTo(sans.res.balanceSheet.cash, 6);
  });

  it("les réserves suivent le résultat, tour après tour", () => {
    const premier = jouer();
    expect(premier.etat.reserves).toBeCloseTo(premier.res.incomeStatement.netIncome, 6);

    const second = jouer({ companies: [premier.etat, company("b")], roundIndex: 2 });
    expect(second.etat.reserves).toBeCloseTo(
      premier.res.incomeStatement.netIncome + second.res.incomeStatement.netIncome,
      6,
    );
  });

  it("le dividende sort de la caisse ET des capitaux propres, sans casser le bilan", () => {
    const premier = jouer();
    const reserves = premier.etat.reserves!;
    expect(reserves, "le premier tour doit être bénéficiaire").toBeGreaterThan(1000);

    const apres = (dividende: number) =>
      jouer({
        companies: [premier.etat, company("b")],
        roundIndex: 2,
        decisions: {
          a: { ...base(), ...(dividende ? { finance: { dividend: dividende } } : {}) },
          b: base(),
        },
      });

    const verse = Math.round(reserves / 2);
    const sans = apres(0);
    const avec = apres(verse);

    expect(sans.res.balanceSheet.equity - avec.res.balanceSheet.equity).toBeCloseTo(verse, 6);
    expect(
      tresorerie(sans.res.balanceSheet) - tresorerie(avec.res.balanceSheet),
    ).toBeCloseTo(verse, 6);
    expect(Math.abs(balanceGap(avec.res.balanceSheet))).toBeLessThan(0.01);

    // les réserves ont diminué d'autant
    expect(sans.etat.reserves! - avec.etat.reserves!).toBeCloseTo(verse, 6);
    // et le dividende n'est pas une charge : le résultat du tour ne bouge pas
    expect(avec.res.incomeStatement.netIncome).toBeCloseTo(
      sans.res.incomeStatement.netIncome,
      6,
    );
  });

  it("on ne distribue pas plus que les réserves", () => {
    const premier = jouer();
    const reserves = premier.etat.reserves!;
    const gourmand = jouer({
      companies: [premier.etat, company("b")],
      roundIndex: 2,
      decisions: { a: { ...base(), finance: { dividend: reserves * 10 } }, b: base() },
    });

    // écrêté à ce qui existe, et non refusé : il ne reste que le résultat du
    // tour qui vient de s'écouler
    expect(gourmand.etat.reserves).toBeCloseTo(gourmand.res.incomeStatement.netIncome, 6);
    expect(Math.abs(balanceGap(gourmand.res.balanceSheet))).toBeLessThan(0.01);
  });

  it("des pertes accumulées ferment la distribution", () => {
    // un tour ruineux : prix sous le coût de revient, volume maximal
    const ruine = jouer({
      decisions: {
        a: { ...base(), price: 25, productionPlan: 6000, marketingBudget: 60_000 },
        b: base(),
      },
    });
    expect(ruine.etat.reserves!).toBeLessThan(0);

    const suite = (dividende: number) =>
      jouer({
        companies: [ruine.etat, company("b")],
        roundIndex: 2,
        decisions: {
          a: { ...base(), ...(dividende ? { finance: { dividend: dividende } } : {}) },
          b: base(),
        },
      });
    expect(suite(20_000).res.balanceSheet.equity).toBeCloseTo(
      suite(0).res.balanceSheet.equity,
      6,
    );
  });

  it("la caisse n'est pas un plafond : on peut se mettre à découvert pour payer", () => {
    // Une entreprise rentable mais sans liquidités : le dividende passe quand
    // même, et la trésorerie plonge. C'est la leçon « le résultat n'est pas la
    // trésorerie », pas une faute du moteur.
    const premier = jouer();
    const assechee: CompanyState = {
      ...premier.etat,
      finance: {
        ...premier.etat.finance,
        cash: 1_000,
        // on retire la même somme des capitaux propres pour garder le bilan
        // équilibré au départ, sans quoi la garde du moteur refuserait le tour
        equity: premier.etat.finance.equity - (premier.etat.finance.cash - 1_000),
      },
    };
    const suite = (dividende: number) =>
      jouer({
        companies: [assechee, company("b")],
        roundIndex: 2,
        decisions: {
          a: { ...base(), ...(dividende ? { finance: { dividend: dividende } } : {}) },
          b: base(),
        },
      });

    const avec = suite(premier.etat.reserves!);
    const sans = suite(0);
    expect(tresorerie(avec.res.balanceSheet)).toBeLessThan(
      tresorerie(sans.res.balanceSheet),
    );
    expect(Math.abs(balanceGap(avec.res.balanceSheet))).toBeLessThan(0.01);
  });
});
