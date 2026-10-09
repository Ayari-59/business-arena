import { describe, expect, it } from "vitest";
import {
  NOVA_DEFINITION,
  NOVA_GAMME_DEFINITION,
  type ScenarioDefinition,
} from "../../src/config/scenarios/registry";
import { applyMarketScale } from "../../src/config/scenarios/market-scale";
import { orderOfferForRound, simulateRound } from "../../src/engine/simulation";
import { peekEventDraw } from "../../src/engine/events";
import { botDecisions } from "../../src/engine/bots";
import { toGamme } from "../../src/engine/gamme";
import {
  estimationAConserver,
  estimerLeTour,
  expurgerLeScenario,
  repartitionDesVentes,
} from "../../src/engine/estimation";
import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  RoundDecisions,
  SegmentCode,
} from "../../src/engine/types";

/**
 * LE RÉSULTAT ESTIMÉ EST LE RÉSULTAT RÉEL, SUR LES VENTES CONSTATÉES.
 *
 * C'est la garde qui tient tout le lot. L'estimation n'a pas sa comptabilité :
 * elle appelle `simulateRound` avec une demande imposée. Donc, si on lui donne
 * les ventes que le marché a RÉELLEMENT faites à l'équipe, elle doit rendre, au
 * centime, le compte de résultat, la trésorerie et le stock que la clôture a
 * écrits. Un compte estimé qui suivrait sa propre formule diverge un jour sans
 * que personne ne le voie : ce test est le seul endroit où cette divergence se
 * voit, et il la voit sur tous les postes, pas sur le seul résultat net.
 *
 * Ce qu'on rejoue : une partie entière (joueur + bots, marché redimensionné
 * comme à la création), tour après tour, en mono-produit au niveau 1 puis au
 * niveau 6 (emprunt, RH, investissement, placement, études, assurance,
 * commande exceptionnelle), et en gamme. À chaque tour, l'estimation part de
 * l'état d'OUVERTURE, des décisions réelles de l'équipe, du scénario EXPURGÉ
 * (celui que le navigateur reçoit) et d'une graine nulle.
 *
 * LES DEUX ÉCARTS IRRÉDUCTIBLES — ce qui se tire à la clôture, carte RSE et
 * rupture d'approvisionnement — ont chacun leur test plus bas : ils sont nommés
 * et mesurés, pas tolérés en silence.
 */

// ---------------------------------------------------------------------------
// De quoi rejouer une vraie partie
// ---------------------------------------------------------------------------

const GRAINE = 20_261_009;

interface Cas {
  nom: string;
  def: ScenarioDefinition;
  tours: number;
  /** Les décisions de l'équipe, tour par tour. */
  decisions: (ctx: {
    scenario: EngineScenarioConfig;
    etat: CompanyState;
    tour: number;
  }) => RoundDecisions;
}

/** Le marché tel qu'une vraie partie le joue : partagé entre toutes les entreprises. */
function mondeDe(def: ScenarioDefinition): EngineScenarioConfig {
  return applyMarketScale(def.scenario, 1 + def.bots.length);
}

/** Les ventes réellement constatées, référence par référence. */
function ventesConstatees(
  scenario: EngineScenarioConfig,
  resultat: CompanyRoundResult,
): Record<string, number> {
  const ventes: Record<string, number> = {};
  for (const p of toGamme(scenario)) {
    ventes[p.code] = p.market.segments.reduce(
      (s, seg) => s + (resultat.market.bySegment[seg.code]?.sold ?? 0),
      0,
    );
  }
  return ventes;
}

/** La répartition réellement constatée : les ventes du tour, segment par segment. */
function repartitionConstatee(resultat: CompanyRoundResult): Record<SegmentCode, number> {
  const poids: Record<SegmentCode, number> = {};
  for (const [code, detail] of Object.entries(resultat.market.bySegment)) {
    poids[code] = detail.sold;
  }
  return poids;
}

/**
 * Les postes du compte de résultat, du haut vers le bas : on les compare TOUS.
 * Comparer le seul résultat net laisserait passer deux erreurs qui s'annulent.
 */
const POSTES = [
  "revenue",
  "productionStocked",
  "cogs",
  "variableProductionCost",
  "commissionCost",
  "grossMargin",
  "marketingCost",
  "qualityCost",
  "maintenanceCost",
  "engagementRse",
  "rdCost",
  "fixedCosts",
  "ebitda",
  "depreciation",
  "operatingIncome",
  "interest",
  "financialIncome",
  "exceptionalCharge",
  "exceptionalIncome",
  "rescueSubsidy",
  "pretaxIncome",
  "taxLossUsed",
  "tax",
  "netIncome",
] as const;

/** Tous les nombres du compte réel égalent ceux du compte estimé, au centime. */
function memeCompte(estime: CompanyRoundResult, reel: CompanyRoundResult, ou: string): void {
  const a = estime.incomeStatement as unknown as Record<string, number | undefined>;
  const b = reel.incomeStatement as unknown as Record<string, number | undefined>;
  for (const poste of POSTES) {
    if (b[poste] === undefined && a[poste] === undefined) continue;
    expect(a[poste] ?? 0, `${ou} · ${poste}`).toBeCloseTo(b[poste] ?? 0, 2);
  }
  // Et les postes que le moteur ajoute sans que ce test les connaisse : aucune
  // ligne du compte réel ne doit manquer au compte estimé.
  for (const poste of Object.keys(b)) {
    if (typeof b[poste] !== "number") continue;
    expect(a[poste] ?? 0, `${ou} · ${poste} (poste non listé)`).toBeCloseTo(b[poste]!, 2);
  }
  expect(estime.functionalBalance.netTreasury, `${ou} · trésorerie nette`).toBeCloseTo(
    reel.functionalBalance.netTreasury,
    2,
  );
  expect(estime.balanceSheet.inventoryValue, `${ou} · stock en valeur`).toBeCloseTo(
    reel.balanceSheet.inventoryValue,
    2,
  );
  expect(estime.balanceSheet.cash, `${ou} · caisse`).toBeCloseTo(reel.balanceSheet.cash, 2);
  expect(estime.balanceSheet.receivables, `${ou} · créances`).toBeCloseTo(
    reel.balanceSheet.receivables,
    2,
  );
  expect(estime.balanceSheet.overdraft, `${ou} · découvert`).toBeCloseTo(
    reel.balanceSheet.overdraft,
    2,
  );
}

/** Une décision de gamme : la même pour chaque référence vendable. */
function parReference(
  scenario: EngineScenarioConfig,
  etat: CompanyState,
  tour: number,
): RoundDecisions["products"] {
  const gamme = toGamme(scenario);
  const out: NonNullable<RoundDecisions["products"]> = {};
  gamme.forEach((p, i) => {
    out[p.code] = {
      price: Math.round(p.market.segments[0]!.refPrice * (0.96 + 0.02 * i) * 10) / 10,
      productionPlan: Math.round((etat.machineCapacity / gamme.length) * 0.8),
      marketingBudget: 4000 + 500 * i,
      qualityBudget: 1500,
      rdBudget: tour <= 2 ? 12_000 : 2_000,
    };
  });
  return out;
}

const CAS: Cas[] = [
  {
    nom: "NOVA · niveau 1 (prix, volume, marketing, qualité, entretien)",
    def: NOVA_DEFINITION,
    tours: 4,
    decisions: ({ scenario, tour }) => ({
      // Un prix au-dessus du prix usuel et un atelier plein : le marché prend
      // MOINS que ce qui sort de l'atelier. C'est ce qui fait travailler la
      // demande imposée — un tour entièrement borné par le stock vendrait son
      // stock quelle que soit la demande, et l'égalité serait gratuite.
      price: scenario.market.segments[0]!.refPrice + 6 + tour,
      productionPlan: 5_200,
      marketingBudget: 9_000,
      qualityBudget: 3_000,
      maintenanceBudget: scenario.production.maintenanceReference,
    }),
  },
  {
    nom: "NOVA · niveau 6 (emprunt, RH, investissement, commande, études, placement)",
    def: NOVA_DEFINITION,
    tours: 4,
    decisions: ({ scenario, etat, tour }) => ({
      price: scenario.market.segments[0]!.refPrice + tour,
      productionPlan: 6_800,
      marketingBudget: 11_000,
      qualityBudget: 4000,
      maintenanceBudget: scenario.production.maintenanceReference,
      // Le fournisseur SANS risque de rupture : le tirage de la rupture a son
      // propre test, celui-ci mesure l'égalité, pas la malchance.
      supplierChoice: "premium",
      insurance: scenario.insurance?.formulas?.[0]?.code ?? true,
      acceptOrder: tour % 2 === 1,
      ...(tour === 2 ? { studies: { market: true, finance: true } } : {}),
      hr:
        tour === 2
          ? { hire: 1, trainingBudget: 6000, salaryIndex: 1.05 }
          : { trainingBudget: 2000, salaryIndex: 1 },
      ...(tour === 2 ? { investment: { machineCapacityUnits: 300 } } : {}),
      finance: {
        ...(tour === 1 ? { newLoan: 60_000 } : {}),
        ...(tour === 3 ? { loanRepayment: 5_000 } : {}),
        ...(tour === 4 ? { capitalIncrease: 20_000 } : {}),
      },
      treasury: {
        ...(tour === 3 ? { discount: 10_000 } : {}),
        ...(tour === 4 ? { factoring: 8_000 } : {}),
        ...(etat.finance.cash > 60_000 ? { placement: 10_000 } : {}),
      },
    }),
  },
  {
    nom: "NOVA en gamme · trois références, R&D et marque",
    def: NOVA_GAMME_DEFINITION,
    tours: 4,
    decisions: ({ scenario, etat, tour }) => ({
      price: scenario.market.segments[0]!.refPrice,
      productionPlan: Math.round(etat.machineCapacity * 0.8),
      marketingBudget: 12_000,
      qualityBudget: 4_500,
      maintenanceBudget: scenario.production.maintenanceReference,
      brandMarketingBudget: 6_000,
      communicationAxis: "qualite",
      rdBudget: tour <= 2 ? 36_000 : 6_000,
      products: parReference(scenario, etat, tour),
      acceptOrder: tour === 2,
    }),
  },
];

/**
 * Rejoue un cas et rend, tour par tour, le résultat RÉEL et le résultat ESTIMÉ
 * sur les ventes constatées. Rien n'est affirmé ici : c'est le matériel des
 * gardes ci-dessous.
 */
function rejouer(cas: Cas, options: { graine?: number; demandeAutre?: boolean } = {}) {
  const base = mondeDe(cas.def);
  // « demandeAutre » : le MÊME monde avec un marché deux fois plus grand, pour
  // la garde d'absence de fuite.
  const scenario = options.demandeAutre ? applyMarketScale(cas.def.scenario, 1) : base;
  const graine = options.graine ?? GRAINE;
  const expurge = expurgerLeScenario(scenario);
  let companies: CompanyState[] = [
    cas.def.company("player", cas.def.playerTeamName, "human"),
    ...cas.def.bots.map((b) => cas.def.company(b.id, b.name, "bot", b.profile)),
  ];
  const profils = new Map(cas.def.bots.map((b) => [b.id, b.profile]));
  let actifs: EventInstance[] = [];
  let dernier: CompanyRoundResult | null = null;
  const tours: {
    tour: number;
    reel: CompanyRoundResult;
    estime: ReturnType<typeof estimerLeTour>;
    ventes: Record<string, number>;
    ruptureReelle: boolean;
    cartesRse: string[];
  }[] = [];

  for (let tour = 1; tour <= cas.tours; tour += 1) {
    const ouverture = companies.find((c) => c.id === "player")!;
    const mesDecisions = cas.decisions({ scenario, etat: ouverture, tour });
    const decisions: Record<string, RoundDecisions> = { player: mesDecisions };
    for (const c of companies) {
      const profil = profils.get(c.id);
      if (profil === undefined) continue;
      decisions[c.id] = botDecisions(profil, { scenario, state: c, roundIndex: tour });
    }
    // CE QUE L'ÉQUIPE SAIT DU TOUR AVANT DE DÉCIDER : les événements en cours,
    // et le tirage, que l'arène retourne déjà face visible à l'ouverture.
    const connus = [
      ...actifs,
      ...peekEventDraw({
        scenario,
        roundIndex: tour,
        companies,
        activeEvents: actifs,
        seed: graine,
      }),
    ];
    const out = simulateRound({
      scenario,
      roundIndex: tour,
      companies,
      decisions,
      activeEvents: actifs,
      seed: graine,
    });
    const reel = out.results["player"]!;
    const ventes = ventesConstatees(scenario, reel);
    const estime = estimerLeTour(
      {
        scenario: expurge,
        state: ouverture,
        roundIndex: tour,
        events: connus,
        orderOffer: orderOfferForRound(scenario, tour, graine),
        repartition: repartitionConstatee(reel),
      },
      mesDecisions,
      ventes,
    );
    tours.push({
      tour,
      reel,
      estime,
      ventes,
      ruptureReelle: Boolean(reel.supplier?.supplyDisruption),
      cartesRse: out.newEvents.filter((e) => e.code.startsWith("rse_")).map((e) => e.code),
    });
    companies = out.companies;
    actifs = out.events;
    dernier = reel;
  }
  return { tours, scenario, expurge, dernier };
}

// ---------------------------------------------------------------------------
// LA GARDE DÉCISIVE
// ---------------------------------------------------------------------------

describe("estimé = réel sur les ventes constatées", () => {
  for (const cas of CAS) {
    it(`${cas.nom} : chaque poste du compte, la trésorerie et le stock`, () => {
      const { tours } = rejouer(cas);
      expect(tours.length).toBe(cas.tours);
      for (const t of tours) {
        // Aucune mauvaise surprise dans ces tours : s'il en tombait une, le
        // test le dirait ici plutôt que de rendre un écart inexpliqué.
        expect(t.ruptureReelle, `tour ${t.tour} : rupture tirée`).toBe(false);
        expect(t.cartesRse, `tour ${t.tour} : carte RSE tirée`).toEqual([]);
        memeCompte(t.estime.resultat, t.reel, `${cas.nom} · tour ${t.tour}`);
        // Et les trois chiffres que l'encart affiche.
        expect(Math.round(t.estime.chiffreDAffaires)).toBe(
          Math.round(t.reel.incomeStatement.revenue),
        );
        expect(Math.round(t.estime.resultatNet)).toBe(Math.round(t.reel.incomeStatement.netIncome));
        expect(Math.round(t.estime.tresorerieNette)).toBe(
          Math.round(t.reel.functionalBalance.netTreasury),
        );
      }
    });
  }

  it("le matériel du test mord : du chiffre, un impôt, du stock, une commande", () => {
    // Une égalité sur deux zéros ne prouve rien. Et une égalité sur un tour
    // entièrement borné par le stock ne prouve rien non plus : l'entreprise y
    // vend tout ce qu'elle a, quelle que soit la demande qu'on lui impose. Il
    // faut donc, dans le matériel, des tours où le marché prend MOINS que
    // l'atelier ne sort — ceux où la demande imposée est vraiment lue.
    for (const cas of [CAS[0]!, CAS[1]!, CAS[2]!]) {
      const { tours } = rejouer(cas);
      const total = tours.reduce((s, t) => s + t.reel.incomeStatement.revenue, 0);
      expect(total, `${cas.nom} · chiffre d'affaires cumulé`).toBeGreaterThan(100_000);
      const libres = tours.filter((t) => t.estime.manquantes === 0 && t.estime.ventesEstimees > 0);
      expect(
        libres.length,
        `${cas.nom} : aucun tour servi sans être borné par le stock`,
      ).toBeGreaterThan(0);
      expect(
        tours.some((t) => t.estime.stockFinal.unites > 0),
        `${cas.nom} : aucun tour ne laisse de stock`,
      ).toBe(true);
    }
    // Un impôt, un report déficitaire et une commande exceptionnelle servie :
    // les trois chemins comptables que l'estimation pourrait rater.
    const niveau6 = rejouer(CAS[1]!).tours;
    expect(niveau6.some((t) => t.reel.incomeStatement.tax > 0)).toBe(true);
    expect(niveau6.some((t) => (t.reel.orderOffer?.delivered ?? 0) > 0)).toBe(true);
    expect(niveau6.some((t) => t.reel.incomeStatement.netIncome < 0)).toBe(true);
  });

  it("en gamme, le stock estimé de CHAQUE référence est celui du tour réel", () => {
    const { tours, scenario } = rejouer(CAS[2]!);
    for (const t of tours) {
      for (const ref of t.estime.references) {
        const reel = t.reel.products?.[ref.code];
        expect(reel, `tour ${t.tour} · ${ref.code}`).toBeDefined();
        expect(ref.stockFinal, `tour ${t.tour} · stock de ${ref.code}`).toBeCloseTo(
          reel!.stock.quantity,
          2,
        );
      }
      expect(t.estime.references.length).toBe(toGamme(scenario).length);
    }
  });
});

// ---------------------------------------------------------------------------
// LES ÉCARTS IRRÉDUCTIBLES, NOMMÉS ET MESURÉS
// ---------------------------------------------------------------------------

describe("le tirage du tour : le seul écart que l'estimation ne peut pas combler", () => {
  /** Un monde minuscule, lisible : une entreprise, un segment, un fournisseur à risque. */
  const monde = (over: Partial<EngineScenarioConfig> = {}): EngineScenarioConfig => ({
    code: "estim",
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
          priceElasticity: -1.2,
          refPrice: 60,
          minAcceptablePrice: 20,
          psychThresholds: [],
          marketingSensitivity: 0.1,
          qualitySensitivity: 0.2,
          loyalty: 0.2,
          priceEffectBounds: { min: 0.5, max: 2 },
          paymentDelayDays: 30,
        },
      ],
      seasonality: [1, 1, 1],
      outsideAttraction: 0.3,
      competitionIntensity: 1.5,
    },
    product: {
      code: "one",
      materialCostPerUnit: 20,
      otherVariableCostPerUnit: 14,
      hoursPerUnit: 0.3,
    },
    production: {
      qualitySensitivity: 0.15,
      qualityScale: 5000,
      qualityInertia: 0.6,
      maintenanceReference: 5000,
      availabilityDecay: 0.05,
    },
    marketing: { scale: 10_000 },
    finance: {
      loanAnnualRate: 0.06,
      overdraftAnnualRate: 0.12,
      overdraftLimit: 40_000,
      taxRate: 0.25,
      supplierPaymentDelayDays: 30,
      depreciationPerRound: 2_000,
    },
    fixedCostsPerRound: 40_000,
    events: [],
    scriptedEvents: [],
    scoring: NOVA_DEFINITION.scenario.scoring,
    ...over,
  });

  const etat = (): CompanyState => ({
    id: "moi",
    name: "Moi",
    controller: "human",
    perceivedQuality: 1,
    machineCapacity: 5000,
    availability: 1,
    headcount: 4,
    hoursPerEmployee: 450,
    productivity: 1,
    finishedGoods: { quantity: 0, unitCost: 0 },
    finance: {
      fixedAssetsNet: 100_000,
      inventoryValue: 0,
      receivables: 0,
      cash: 60_000,
      equity: 120_000,
      financialDebt: 40_000,
      payables: 0,
      overdraft: 0,
    },
    lastMarketShare: {},
  });

  const dec = (over: Partial<RoundDecisions> = {}): RoundDecisions => ({
    price: 59,
    productionPlan: 3500,
    marketingBudget: 8_000,
    qualityBudget: 2_000,
    maintenanceBudget: 5_000,
    ...over,
  });

  it("une rupture d'approvisionnement tirée à la clôture creuse l'écart, et elle seule", () => {
    const risque = monde({
      suppliers: [
        {
          code: "fragile",
          name: "Fragile",
          narrative: "",
          costMultiplier: 0.9,
          qualityBonus: 0,
          paymentDelayDays: 30,
          supplyRiskProbability: 1,
          supplyRiskAvailabilityHit: 0.5,
        },
        {
          code: "sur",
          name: "Sûr",
          narrative: "",
          costMultiplier: 1,
          qualityBonus: 0,
          paymentDelayDays: 30,
          supplyRiskProbability: 0,
          supplyRiskAvailabilityHit: 1,
        },
      ],
    });
    const decisions = dec({ supplierChoice: "fragile" });
    const ouverture = etat();
    const out = simulateRound({
      scenario: risque,
      roundIndex: 1,
      companies: [ouverture],
      decisions: { moi: decisions },
      activeEvents: [],
      seed: 7,
    });
    const reel = out.results["moi"]!;
    expect(reel.supplier?.supplyDisruption, "la rupture doit bien être tirée").toBe(true);

    const dossier = {
      scenario: expurgerLeScenario(risque),
      state: ouverture,
      roundIndex: 1,
      events: [],
      orderOffer: null,
      repartition: repartitionConstatee(reel),
    };
    const estime = estimerLeTour(dossier, decisions, ventesConstatees(risque, reel));
    // L'estimation suppose le tour sans rupture : elle produit donc plus, et
    // son stock de fin de tour est plus gros que le réel. C'est l'écart, et il
    // est NOMMÉ : pas une dérive comptable.
    expect(estime.stockFinal.unites).toBeGreaterThan(
      reel.production.produced - reel.market.bySegment["main"]!.sold + 1,
    );
    expect(estime.resultat.production.produced).toBeGreaterThan(reel.production.produced);

    // Et sans rupture, le même tour redevient exact : l'écart vient du tirage,
    // de rien d'autre.
    const sain = { ...decisions, supplierChoice: "sur" };
    const outSain = simulateRound({
      scenario: risque,
      roundIndex: 1,
      companies: [ouverture],
      decisions: { moi: sain },
      activeEvents: [],
      seed: 7,
    });
    const reelSain = outSain.results["moi"]!;
    expect(reelSain.supplier?.supplyDisruption).toBe(false);
    const estimeSain = estimerLeTour(
      { ...dossier, repartition: repartitionConstatee(reelSain) },
      sain,
      ventesConstatees(risque, reelSain),
    );
    memeCompte(estimeSain.resultat, reelSain, "sans rupture");
  });

  it("une carte événement RSE tirée à la clôture creuse l'écart, et elle seule", () => {
    // Capital « process propre » déjà acquis : l'éco-subvention tombe à la
    // clôture, du tour 3. L'estimation ne la compte pas.
    const scenario = monde();
    const ouverture: CompanyState = { ...etat(), rseCleanCapital: 0.9, rseImageCapital: 0.9 };
    const decisions = dec({ rse: { budget: 4_000, investment: 4_000 } });
    const out = simulateRound({
      scenario,
      roundIndex: 3,
      companies: [ouverture],
      decisions: { moi: decisions },
      activeEvents: [],
      seed: 11,
    });
    const reel = out.results["moi"]!;
    const cartes = out.newEvents.map((e) => e.code);
    expect(cartes, "la carte RSE doit bien être tirée").toContain("rse_subvention");

    const estime = estimerLeTour(
      {
        scenario: expurgerLeScenario(scenario),
        state: ouverture,
        roundIndex: 3,
        events: [],
        orderOffer: null,
        repartition: repartitionConstatee(reel),
      },
      decisions,
      ventesConstatees(scenario, reel),
    );
    // Le produit exceptionnel de l'éco-subvention manque à l'estimé : l'écart
    // est exactement celui-là, pas un autre.
    const aide = reel.incomeStatement.exceptionalIncome ?? 0;
    expect(aide).toBeGreaterThan(0);
    expect(estime.compte.exceptionalIncome ?? 0).toBe(0);
    // Le résultat d'exploitation, lui, est identique : la subvention est un
    // produit EXCEPTIONNEL, et l'écart se lit exactement là.
    expect(estime.compte.operatingIncome).toBeCloseTo(reel.incomeStatement.operatingIncome, 2);
    expect(reel.incomeStatement.pretaxIncome - estime.compte.pretaxIncome).toBeCloseTo(aide, 2);
  });

  it("un événement du tour, lui, est connu d'avance : il ne creuse aucun écart", () => {
    // Le tirage du tour est déterministe et l'arène le montre à l'ouverture
    // (« le courrier du tour ») : l'estimation le reçoit, donc l'égalité tient
    // même quand le tour renchérit les matières de 25 %.
    const scenario = monde({
      events: [
        {
          code: "flambee",
          scope: "market" as const,
          probability: 0,
          duration: 1,
          modifiers: [{ target: "material_cost" as const, op: "mul" as const, value: 1.25 }],
        },
      ],
      scriptedEvents: [{ round: 1, eventCode: "flambee" }],
    });
    const ouverture = etat();
    const decisions = dec();
    const connus = peekEventDraw({
      scenario,
      roundIndex: 1,
      companies: [ouverture],
      activeEvents: [],
      seed: 3,
    });
    expect(connus.map((e) => e.code)).toEqual(["flambee"]);
    const out = simulateRound({
      scenario,
      roundIndex: 1,
      companies: [ouverture],
      decisions: { moi: decisions },
      activeEvents: [],
      seed: 3,
    });
    const reel = out.results["moi"]!;
    const estime = estimerLeTour(
      {
        scenario: expurgerLeScenario(scenario),
        state: ouverture,
        roundIndex: 1,
        events: connus,
        orderOffer: null,
        repartition: repartitionConstatee(reel),
      },
      decisions,
      ventesConstatees(scenario, reel),
    );
    memeCompte(estime.resultat, reel, "événement connu d'avance");
    // Et sans l'événement au dossier, le compte estimé n'est PLUS le compte
    // réel : la garde ci-dessus mesure bien quelque chose.
    const aveugle = estimerLeTour(
      {
        scenario: expurgerLeScenario(scenario),
        state: ouverture,
        roundIndex: 1,
        events: [],
        orderOffer: null,
        repartition: repartitionConstatee(reel),
      },
      decisions,
      ventesConstatees(scenario, reel),
    );
    expect(aveugle.compte.variableProductionCost).toBeLessThan(
      reel.incomeStatement.variableProductionCost - 1,
    );
  });

  it("la commande exceptionnelle du dossier est celle du tour, pas une autre", () => {
    // Un marché petit devant l'atelier : il reste du stock après le marché, et
    // la commande exceptionnelle a de quoi être servie.
    const scenario = monde({
      market: {
        ...monde().market,
        segments: monde().market.segments.map((x) => ({ ...x, size: 1_200 })),
      },
      orderOffers: [
        {
          code: "credit",
          title: "À crédit",
          narrative: "",
          units: 500,
          price: 70,
          paymentDelayDays: 90,
        },
        {
          code: "comptant",
          title: "Comptant",
          narrative: "",
          units: 400,
          price: 50,
          paymentDelayDays: 0,
        },
      ],
    });
    const ouverture = etat();
    const decisions = dec({ acceptOrder: true });
    const out = simulateRound({
      scenario,
      roundIndex: 1,
      companies: [ouverture],
      decisions: { moi: decisions },
      activeEvents: [],
      seed: 5,
    });
    const reel = out.results["moi"]!;
    expect(reel.orderOffer?.delivered ?? 0).toBeGreaterThan(0);
    const estime = estimerLeTour(
      {
        scenario: expurgerLeScenario(scenario),
        state: ouverture,
        roundIndex: 1,
        events: [],
        orderOffer: orderOfferForRound(scenario, 1, 5),
        repartition: repartitionConstatee(reel),
      },
      decisions,
      ventesConstatees(scenario, reel),
    );
    memeCompte(estime.resultat, reel, "commande exceptionnelle");
    // Sans l'offre au dossier, le chiffre d'affaires estimé tombe : la garde
    // ci-dessus tient bien sur la commande.
    const sansOffre = estimerLeTour(
      {
        scenario: expurgerLeScenario(scenario),
        state: ouverture,
        roundIndex: 1,
        events: [],
        orderOffer: null,
        repartition: repartitionConstatee(reel),
      },
      decisions,
      ventesConstatees(scenario, reel),
    );
    expect(sansOffre.chiffreDAffaires).toBeLessThan(estime.chiffreDAffaires - 1);
  });
});

// ---------------------------------------------------------------------------
// AUCUNE FUITE
// ---------------------------------------------------------------------------

describe("aucune fuite du marché dans l'estimation", () => {
  it("changer la graine ne change rien à l'estimation", () => {
    // Deux parties, deux graines : les tours RÉELS ne donnent pas la même
    // chose (le tirage n'est pas le même)…
    const a = rejouer(CAS[1]!, { graine: 1 });
    const b = rejouer(CAS[1]!, { graine: 999_983 });
    expect(a.tours.map((t) => Math.round(t.reel.incomeStatement.netIncome))).not.toEqual(
      b.tours.map((t) => Math.round(t.reel.incomeStatement.netIncome)),
    );
    // …et pourtant, sur les mêmes ventes, le même état et les mêmes décisions,
    // l'estimation est identique au centime : elle ne lit jamais la graine.
    const ouverture = NOVA_DEFINITION.company("player", "NOVA", "human");
    const decisions = CAS[1]!.decisions({ scenario: a.scenario, etat: ouverture, tour: 1 });
    const ventes = a.tours[0]!.ventes;
    const dossier = {
      scenario: a.expurge,
      state: ouverture,
      roundIndex: 1,
      events: [] as EventInstance[],
      orderOffer: null,
      repartition: repartitionConstatee(a.tours[0]!.reel),
    };
    const un = estimerLeTour(dossier, decisions, ventes);
    const deux = estimerLeTour(dossier, decisions, ventes);
    expect(JSON.stringify(un.resultat)).toBe(JSON.stringify(deux.resultat));
    // Et l'estimateur appelle le moteur avec une graine nulle : le dossier ne
    // porte aucune graine, il n'y a donc rien à lui passer.
    expect(Object.keys(dossier)).not.toContain("seed");
  });

  it("changer la demande réelle du marché ne change pas l'estimation", () => {
    // Le même tour, avec un marché deux fois plus grand (`applyMarketScale`
    // sans les bots) : les ventes réelles changent, l'estimation sur des ventes
    // données ne bouge pas d'un centime.
    const petit = mondeDe(NOVA_DEFINITION);
    const grand = applyMarketScale(NOVA_DEFINITION.scenario, 1);
    const tailles = (s: EngineScenarioConfig) => s.market.segments.map((x) => x.size);
    expect(tailles(petit)).not.toEqual(tailles(grand));
    const ouverture = NOVA_DEFINITION.company("player", "NOVA", "human");
    const decisions = CAS[0]!.decisions({ scenario: petit, etat: ouverture, tour: 1 });
    const ventes = { [petit.product.code]: 3_200 };
    const commun = {
      state: ouverture,
      roundIndex: 1,
      events: [] as EventInstance[],
      orderOffer: null,
      repartition: repartitionDesVentes(petit, 1, null),
    };
    const a = estimerLeTour({ ...commun, scenario: expurgerLeScenario(petit) }, decisions, ventes);
    const b = estimerLeTour({ ...commun, scenario: expurgerLeScenario(grand) }, decisions, ventes);
    expect(JSON.stringify(a.compte)).toBe(JSON.stringify(b.compte));
    expect(a.tresorerieNette).toBe(b.tresorerieNette);
  });

  it("changer les concurrents ne change pas l'estimation", () => {
    const scenario = mondeDe(NOVA_DEFINITION);
    const ouverture = NOVA_DEFINITION.company("player", "NOVA", "human");
    const decisions = CAS[0]!.decisions({ scenario, etat: ouverture, tour: 1 });
    const ventes = { [scenario.product.code]: 3_000 };
    const dossier = {
      scenario: expurgerLeScenario(scenario),
      state: ouverture,
      roundIndex: 1,
      events: [] as EventInstance[],
      orderOffer: null,
      repartition: repartitionDesVentes(scenario, 1, null),
    };
    const seul = estimerLeTour(dossier, decisions, ventes);
    // Le scénario expurgé n'a plus de bots du tout : c'est le point.
    expect(dossier.scenario.bots).toBeUndefined();
    const avecBots = estimerLeTour(
      { ...dossier, scenario: { ...dossier.scenario, bots: NOVA_DEFINITION.scenario.bots } },
      decisions,
      ventes,
    );
    expect(JSON.stringify(seul.compte)).toBe(JSON.stringify(avecBots.compte));
  });

  it("le scénario expurgé ne porte plus un seul paramètre de demande caché", () => {
    for (const def of [NOVA_DEFINITION, NOVA_GAMME_DEFINITION]) {
      const expurge = expurgerLeScenario(mondeDe(def));
      for (const p of toGamme(expurge)) {
        for (const s of p.market.segments) {
          expect(s.size, `${def.code} · ${s.code} · taille`).toBe(0);
          expect(s.growth).toBe(0);
          expect(s.marketingSensitivity).toBe(0);
          expect(s.qualitySensitivity).toBe(0);
          expect(s.loyalty).toBe(0);
          expect(s.minAcceptablePrice).toBe(0);
          expect(s.psychThresholds).toEqual([]);
          expect(s.priceEffectBounds).toEqual({ min: 1, max: 1 });
        }
      }
      expect(expurge.events).toEqual([]);
      expect(expurge.scriptedEvents).toEqual([]);
      expect(expurge.orderOffers).toBeUndefined();
      expect(expurge.bots).toBeUndefined();
      expect(expurge.market.outsideAttraction).toBe(0);
      // Ce que le joueur voit déjà reste : le prix usuel et la saison.
      const segments = def.scenario.market.segments;
      expurge.market.segments.forEach((s, i) => {
        expect(s.refPrice).toBe(segments[i]!.refPrice);
        expect(s.paymentDelayDays).toBe(segments[i]!.paymentDelayDays);
      });
    }
  });
});

// ---------------------------------------------------------------------------
// CE QUE L'ENCART MONTRE
// ---------------------------------------------------------------------------

describe("ce que l'encart montre", () => {
  const scenario = mondeDe(NOVA_DEFINITION);
  const ouverture = NOVA_DEFINITION.company("player", "NOVA", "human");
  const decisions: RoundDecisions = {
    price: 69,
    productionPlan: 2_000,
    marketingBudget: 8_000,
    qualityBudget: 2_000,
    maintenanceBudget: 5_000,
  };
  const dossier = {
    scenario: expurgerLeScenario(scenario),
    state: ouverture,
    roundIndex: 1,
    events: [] as EventInstance[],
    orderOffer: null,
    repartition: repartitionDesVentes(scenario, 1, null),
  };

  it("estimer plus que ce qu'on peut livrer se voit : le manque est chiffré", () => {
    const estime = estimerLeTour(dossier, decisions, { [scenario.product.code]: 5_000 });
    expect(estime.ventesEstimees).toBe(5_000);
    expect(estime.ventesLivrables).toBeLessThan(5_000);
    expect(estime.manquantes).toBeCloseTo(5_000 - estime.ventesLivrables, 6);
    expect(estime.stockFinal.unites).toBeCloseTo(0, 6);
  });

  it("estimer moins que ce qu'on produit laisse du stock, et rien ne manque", () => {
    const estime = estimerLeTour(dossier, decisions, { [scenario.product.code]: 800 });
    expect(estime.manquantes).toBe(0);
    expect(estime.stockFinal.unites).toBeGreaterThan(0);
    expect(estime.stockFinal.valeur).toBeGreaterThan(0);
  });

  it("estimer zéro vente ne casse rien : le tour coûte ses charges", () => {
    const estime = estimerLeTour(dossier, decisions, { [scenario.product.code]: 0 });
    expect(estime.chiffreDAffaires).toBe(0);
    expect(estime.resultatNet).toBeLessThan(0);
    expect(estime.manquantes).toBe(0);
  });

  it("une trésorerie estimée négative se dit, elle ne se corrige pas", () => {
    // Un volume énorme et aucune vente : la caisse part, et l'estimation le dit.
    const estime = estimerLeTour(
      dossier,
      { ...decisions, productionPlan: 7_000, marketingBudget: 60_000 },
      { [scenario.product.code]: 0 },
    );
    expect(estime.tresorerieNette).toBeLessThan(0);
  });

  it("ce qui est conservé avec les décisions : les ventes et les trois chiffres", () => {
    const estime = estimerLeTour(dossier, decisions, { [scenario.product.code]: 1_800 });
    const garde = estimationAConserver({ [scenario.product.code]: 1_800 }, estime);
    expect(garde.units).toBe(1_800);
    expect(garde.byProduct[scenario.product.code]).toBe(1_800);
    expect(garde.estimate?.revenue).toBe(estime.chiffreDAffaires);
    expect(garde.estimate?.netIncome).toBe(estime.resultatNet);
    expect(garde.estimate?.netTreasury).toBe(estime.tresorerieNette);
    expect(garde.estimate?.deliverableUnits).toBe(estime.ventesLivrables);
    // Sans résultat calculé, une estimation de ventes reste une estimation.
    expect(estimationAConserver({ [scenario.product.code]: 10 }, null).estimate).toBeUndefined();
    // Une saisie négative ne descend pas dans la donnée.
    expect(estimationAConserver({ [scenario.product.code]: -5 }, null).units).toBe(0);
  });

  it("le moteur IGNORE le champ : une estimation ne change pas le tour", () => {
    const sans = simulateRound({
      scenario,
      roundIndex: 1,
      companies: [ouverture],
      decisions: { player: decisions },
      activeEvents: [],
      seed: 4,
    });
    const avec = simulateRound({
      scenario,
      roundIndex: 1,
      companies: [ouverture],
      decisions: {
        player: {
          ...decisions,
          salesEstimate: { byProduct: { [scenario.product.code]: 99_999 }, units: 99_999 },
        },
      },
      activeEvents: [],
      seed: 4,
    });
    expect(JSON.stringify(avec.results)).toBe(JSON.stringify(sans.results));
  });

  it("la répartition par défaut est celle du tour passé, ramenée à une proportion", () => {
    const segments = scenario.market.segments.map((s) => s.code);
    const dernier = {
      market: {
        totalShare: 0,
        bySegment: Object.fromEntries(
          segments.map((code, i) => [
            code,
            {
              potential: 0,
              attraction: 0,
              share: 0,
              demandForCompany: 0,
              sold: i === 0 ? 300 : 100,
              lost: 0,
              revenue: 0,
              commission: 0,
            },
          ]),
        ),
      },
    };
    const r = repartitionDesVentes(scenario, 2, dernier as never);
    const total = segments.reduce((s, c) => s + r[c]!, 0);
    expect(total).toBeCloseTo(1, 9);
    expect(r[segments[0]!]).toBeGreaterThan(r[segments[1]!] ?? 0);
    // Au premier tour, aucune vente à recopier : la taille des clientèles donne
    // la proportion, et elle somme à 1 elle aussi.
    const premier = repartitionDesVentes(scenario, 1, null);
    expect(segments.reduce((s, c) => s + premier[c]!, 0)).toBeCloseTo(1, 9);
  });
});
