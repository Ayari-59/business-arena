import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * LA SUBVENTION EXCEPTIONNELLE, CÔTÉ MOTEUR.
 *
 * Elle n'est ni tirée au sort ni prévue par le scénario : c'est un geste
 * humain — l'animateur accorde une aide à une équipe en cessation de paiements
 * dont la banque ne prête plus et dont les associés ont vidé leur enveloppe.
 * Le moteur n'a rien à décider : il encaisse ce qui a été accordé.
 *
 * Ce que ce fichier garde :
 *  · l'argent ENTRE vraiment (trésorerie, résultat, bilan équilibré) ;
 *  · il entre sur sa PROPRE ligne, jamais confondu avec l'éco-subvention RSE ;
 *  · il entre MÊME quand l'entreprise est gelée — c'est précisément à elle
 *    qu'on l'accorde, et la lui refuser la condamnerait à l'arrêt perpétuel ;
 *  · sans subvention, RIEN n'est émis : les parties qui se passent bien ne
 *    portent pas la trace d'un dispositif qu'elles n'ont jamais touché.
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

const tour = (
  roundIndex: number,
  companies: CompanyState[],
  dec: RoundDecisions,
  config: EngineScenarioConfig = scenario(),
): SimulationInput => ({
  scenario: config,
  roundIndex,
  companies,
  decisions: { a: dec },
  activeEvents: [],
  seed: 42,
});


/** Le même tour, avec une subvention accordée à l'entreprise « a ». */
const avecSubvention = (input: SimulationInput, montant: number): SimulationInput => ({
  ...input,
  rescueSubsidies: { a: montant },
});

describe("la subvention de sauvetage", () => {
  it("sans subvention, le moteur n'émet rien : ni ligne, ni flux", () => {
    // La non-régression qui compte : une partie qui n'a jamais vu de crise doit
    // produire exactement les mêmes résultats qu'avant ce dispositif.
    const r = simulateRound(tour(1, [company()], base()));
    expect(r.results["a"]!.incomeStatement.rescueSubsidy).toBeUndefined();
    expect(
      r.results["a"]!.cashFlow.items.some((i) => i.label === "subvention_exceptionnelle"),
    ).toBe(false);
  });

  it("accordée, elle entre en trésorerie et au résultat, sur sa propre ligne", () => {
    const sans = simulateRound(tour(1, [company()], base()));
    const avec = simulateRound(avecSubvention(tour(1, [company()], base()), 60000));

    const cr = avec.results["a"]!.incomeStatement;
    expect(cr.rescueSubsidy).toBe(60000);
    // Sur SA ligne : la confondre avec l'éco-subvention RSE ferait lire un
    // sauvetage comme une récompense écologique.
    expect(cr.exceptionalIncome).toBeUndefined();
    const flux = avec.results["a"]!.cashFlow.items.find(
      (i) => i.label === "subvention_exceptionnelle",
    );
    expect(flux?.amount).toBe(60000);

    // L'entreprise perd de l'argent : l'aide entre donc en entier au résultat,
    // sans impôt à payer dessus, et la trésorerie s'améliore d'autant.
    expect(cr.netIncome - sans.results["a"]!.incomeStatement.netIncome).toBeCloseTo(60000, 2);
    const ecart =
      avec.results["a"]!.functionalBalance.netTreasury -
      sans.results["a"]!.functionalBalance.netTreasury;
    expect(ecart).toBeGreaterThan(0);
  });

  it("le bilan reste équilibré : c'est l'invariant du moteur", () => {
    // Un produit qui entrerait en caisse sans passer par le résultat
    // déséquilibrerait le bilan — le moteur jette dans ce cas, mais mieux vaut
    // le vérifier ici que le découvrir en séance.
    const b = simulateRound(avecSubvention(tour(1, [company()], base()), 60000)).results["a"]!
      .balanceSheet;
    const actif = b.fixedAssetsNet + b.inventoryValue + b.receivables + b.cash + (b.shortTermInvestment ?? 0);
    const passif = b.equity + b.financialDebt + b.payables + b.overdraft + (b.vatLiability ?? 0);
    expect(actif - passif).toBeCloseTo(0, 2);
  });

  it("elle traverse le gel : c'est à l'entreprise à l'arrêt qu'on l'accorde", () => {
    // Une défaillante ne dépense plus rien — mais elle encaisse. Sans cela,
    // l'aide arriverait exactement là où elle ne servirait à rien.
    const r1 = simulateRound(tour(1, [company()], base()));
    const r2 = simulateRound(tour(2, r1.companies, base()));
    expect(r2.companies.find((c) => c.id === "a")!.status).toBe("defaillant");

    const gelee = simulateRound(tour(3, r2.companies, base()));
    const secourue = simulateRound(avecSubvention(tour(3, r2.companies, base()), 400000));
    expect(secourue.results["a"]!.incomeStatement.rescueSubsidy).toBe(400000);

    // Elle arrive en entier, MOINS l'impôt qu'elle déclenche. Une aide plus
    // grosse que les pertes reportées rend l'entreprise bénéficiaire sur le
    // tour, et l'État prend sa part : c'est juste, et c'est une surprise qu'il
    // vaut mieux voir ici qu'en séance.
    const impotDeLAide =
      secourue.results["a"]!.incomeStatement.tax - gelee.results["a"]!.incomeStatement.tax;
    expect(impotDeLAide).toBeGreaterThan(0);
    expect(
      secourue.results["a"]!.functionalBalance.netTreasury -
        gelee.results["a"]!.functionalBalance.netTreasury,
    ).toBeCloseTo(400000 - impotDeLAide, 0);
  });

  it("assez large, elle sort l'entreprise de la crise et remet le compteur à zéro", () => {
    // La seule raison d'être du dispositif : que l'équipe puisse repartir.
    const r1 = simulateRound(tour(1, [company()], base()));
    expect(r1.results["a"]!.treasury!.crisis).toBe(true);

    const sauve = simulateRound(avecSubvention(tour(2, r1.companies, base()), 900000));
    // Le bloc `treasury` disparaît quand plus rien ne s'y passe : pas de
    // mobilisation, pas d'affacturage forcé, pas de crise. Son absence est
    // donc la meilleure des nouvelles.
    expect(sauve.results["a"]!.treasury?.crisis ?? false).toBe(false);
    expect(sauve.companies.find((c) => c.id === "a")!.crisisStreak ?? 0).toBe(0);
    expect(sauve.results["a"]!.defaillant).toBeUndefined();
  });

  it("un montant nul ou négatif ne crée rien", () => {
    // Garde-fou : un accord à zéro (ou une donnée corrompue) ne doit pas faire
    // apparaître une ligne vide, ni retirer de l'argent.
    for (const montant of [0, -50000]) {
      const r = simulateRound(avecSubvention(tour(1, [company()], base()), montant));
      expect(r.results["a"]!.incomeStatement.rescueSubsidy).toBeUndefined();
      expect(
        r.results["a"]!.cashFlow.items.some((i) => i.label === "subvention_exceptionnelle"),
      ).toBe(false);
    }
  });
});
