import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * LE DOSSIER BANCAIRE.
 *
 * Le plan de trésorerie que l'élève déposait avec ses décisions ne changeait
 * aucun calcul : le moteur le rangeait, le montrait au tour suivant à côté du
 * réalisé, et c'était tout. Un prévisionnel sans conséquence n'apprend pas à
 * en faire un, il apprend à remplir deux cases.
 *
 * Il sert maintenant à obtenir du crédit, et son exactitude se paie :
 *
 *  - pas de plan, pas d'emprunt : la banque n'instruit pas une demande que
 *    rien n'appuie ;
 *  - l'écart entre l'annoncé et le constaté nourrit une confiance, qui fixe au
 *    tour suivant le plafond de découvert consenti et son taux.
 *
 * La confiance agit sur le DÉCOUVERT et jamais sur un emprunt déjà accordé :
 * le découvert est un concours révocable, le prêt en cours ne l'est pas.
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
        paymentDelayDays: 60,
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
    overdraftLimit: 100000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 0,
    depreciationPerRound: 3000,
    bank: { memory: 0.6, maxOverdraftSpread: 0.05, minOverdraftShare: 0.4 },
  },
  treasury: {
    discountAnnualRate: 0.09,
    discountMaxShare: 0.6,
    factoringFeeRate: 0.03,
    forcedFactoringFeeRate: 0.09,
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

/** Scénario d'avant le dossier bancaire : le prévisionnel n'y change rien. */
const sansBanque = (): EngineScenarioConfig => {
  const s = scenario();
  const { bank: _ignore, ...finance } = s.finance;
  return { ...s, finance };
};

const company = (over: Partial<CompanyState> = {}): CompanyState => ({
  id: "a",
  name: "a",
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
    cash: 20000,
    equity: 75000,
    financialDebt: 80000,
    payables: 0,
    overdraft: 0,
  },
  lastMarketShare: {},
  ...over,
});

const base = (): RoundDecisions => ({
  price: 59,
  productionPlan: 4500,
  marketingBudget: 8000,
  qualityBudget: 2000,
  maintenanceBudget: 5000,
});

function jouer(over: {
  scenario?: EngineScenarioConfig;
  state?: Partial<CompanyState>;
  decisions?: RoundDecisions;
}) {
  const moi = company(over.state);
  const input: SimulationInput = {
    scenario: over.scenario ?? scenario(),
    roundIndex: 1,
    companies: [moi, company({ id: "b", name: "b" })],
    decisions: { a: over.decisions ?? base(), b: base() },
    activeEvents: [],
    seed: 42,
  };
  const out = simulateRound(input);
  const res = out.results["a"]!;
  return {
    res,
    etat: out.companies.find((c) => c.id === "a")!,
    vendu: Object.values(res.market.bySegment).reduce((somme, d) => somme + d.sold, 0),
  };
}

const plan = (expectedCash: number, expectedUnits?: number): RoundDecisions => ({
  ...base(),
  finance: { newLoan: 60000 },
  forecast: { expectedCash, ...(expectedUnits === undefined ? {} : { expectedUnits }) },
});

describe("dossier bancaire", () => {
  it("la banque instruit la demande, avec ou sans plan de trésorerie", () => {
    // L'ARÈNE NE DEMANDE PLUS DE PLAN. Le verrou d'origine — pas de plan, pas
    // de prêt — aurait interdit d'emprunter à tout le monde une fois le champ
    // retiré du formulaire. L'emprunt entre donc en caisse dans les deux cas,
    // et le bilan le dit, pas seulement le récit.
    const sans = jouer({ decisions: { ...base(), finance: { newLoan: 60000 } } });
    const avec = jouer({ decisions: plan(0) });

    expect(sans.res.bank!.loanRequested).toBe(60000);
    expect(sans.res.bank!.loanGranted).toBe(60000);
    expect(sans.res.bank!.planFiled).toBe(false);
    expect(avec.res.bank!.loanGranted).toBe(60000);
    // Le même emprunt des deux côtés : la dette financière de clôture aussi.
    expect(avec.res.balanceSheet.financialDebt - sans.res.balanceSheet.financialDebt).toBeCloseTo(
      0,
      6,
    );
  });

  it("annoncer des ventes n'est pas présenter un plan de financement", () => {
    // C'est la ligne de TRÉSORERIE qui fait le plan : elle seule est jugeable
    // contre un besoin daté. Le moteur garde cette distinction — un plan
    // déposé par une autre voie qu'un formulaire reste jugé —, elle ne
    // commande simplement plus l'octroi du prêt.
    const res = jouer({
      decisions: { ...base(), finance: { newLoan: 60000 }, forecast: { expectedUnits: 4200 } },
    }).res;
    expect(res.bank!.planFiled).toBe(false);
    expect(res.bank!.reliability).not.toBeNull();
    expect(res.bank!.loanGranted).toBe(60000);
  });

  it("une partie ouverte avant le dossier bancaire garde son emprunt", () => {
    // Rétro-compatibilité : les snapshots déjà joués ne portent pas de bloc
    // `bank`, et une demande sans plan doit continuer d'y passer.
    const res = jouer({
      scenario: sansBanque(),
      decisions: { ...base(), finance: { newLoan: 60000 } },
    }).res;
    expect(res.bank).toBeUndefined();
    expect(res.balanceSheet.financialDebt).toBeCloseTo(80000 + 60000, 6);
  });

  it("un plan juste maintient la confiance, un plan faux la fait tomber", () => {
    const reference = jouer({ decisions: plan(0) });
    const juste = jouer({
      decisions: plan(reference.res.functionalBalance.netTreasury, reference.vendu),
    });
    const faux = jouer({ decisions: plan(2_000_000, 1) });

    expect(juste.res.bank!.reliability).toBeCloseTo(1, 6);
    expect(juste.etat.bankTrust).toBeCloseTo(1, 6);
    // L'écart est plafonné à 1 : annoncer n'importe quoi ne vaut jamais pire
    // que zéro de fiabilité, sans quoi un seul tour délirant serait
    // irrattrapable.
    expect(faux.res.bank!.reliability).toBeLessThan(0.001);
    // mémoire 0,6 : la confiance pleine tombe à 0,6 en un tour, pas à zéro
    expect(faux.etat.bankTrust).toBeCloseTo(0.6, 3);
  });

  it("sans rien annoncer, la confiance ne bouge pas : la banque n'a rien à juger", () => {
    const res = jouer({ state: { bankTrust: 0.5 } });
    expect(res.res.bank!.reliability).toBeNull();
    expect(res.etat.bankTrust).toBeCloseTo(0.5, 6);
  });

  it("les conditions du tour sont celles de la confiance d'OUVERTURE", () => {
    // Le plan de ce tour n'est jugeable qu'une fois le tour joué : le punir
    // tout de suite reviendrait à sanctionner avant de savoir.
    const res = jouer({ state: { bankTrust: 0.5 }, decisions: plan(2_000_000, 1) }).res;
    expect(res.bank!.trustBefore).toBeCloseTo(0.5, 6);
    expect(res.bank!.overdraftLimit).toBeCloseTo(100000 * (0.4 + 0.6 * 0.5), 6);
    expect(res.bank!.overdraftAnnualRate).toBeCloseTo(0.12 + 0.05 * 0.5, 6);
    expect(res.bank!.trustAfter).toBeLessThan(0.5);
  });

  it("une confiance perdue resserre le découvert et le renchérit", () => {
    // Cash de départ volontairement mince : le tour finit à découvert, et
    // c'est là que les conditions se voient.
    const pauvre = { cash: 0, equity: 55000 } as const;
    const fiable = jouer({ state: { bankTrust: 1, finance: { ...company().finance, ...pauvre } } });
    const grille = jouer({ state: { bankTrust: 0, finance: { ...company().finance, ...pauvre } } });

    expect(grille.res.bank!.overdraftLimit).toBeCloseTo(100000 * 0.4, 6);
    expect(grille.res.bank!.overdraftAnnualRate).toBeCloseTo(0.17, 6);
    // le découvert coûte plus cher, donc le résultat est plus bas
    expect(grille.res.incomeStatement.interest).toBeGreaterThan(
      fiable.res.incomeStatement.interest,
    );
    expect(grille.res.incomeStatement.netIncome).toBeLessThan(fiable.res.incomeStatement.netIncome);
  });

  it("un plafond rabaissé pousse à l'affacturage forcé", () => {
    // La vraie sanction n'est pas le demi-point de taux : c'est la ligne
    // coupée, qui fait céder les créances d'office au tarif fort. L'élève qui
    // a mal prévu ne perd pas seulement des intérêts, il perd la main sur son
    // poste clients.
    const exsangue = { cash: 0, equity: 55000 } as const;
    const etat = (bankTrust: number) => ({
      bankTrust,
      finance: { ...company().finance, ...exsangue },
    });
    const fiable = jouer({ state: etat(1) });
    const grille = jouer({ state: etat(0) });

    expect(grille.res.treasury!.forcedFactored).toBeGreaterThan(
      fiable.res.treasury!.forcedFactored,
    );
    expect(grille.res.treasury!.financingCost).toBeGreaterThan(
      fiable.res.treasury!.financingCost,
    );
  });
});

/**
 * LA BANQUE N'EST PAS UN PUITS.
 *
 * Rien ne bornait l'emprunt : une équipe en découvert profond pouvait demander
 * cent mille euros de plus chaque tour et les obtenir, ce qui retirait toute
 * conséquence à la cessation de paiements — on ne coule pas quand le crédit
 * est infini.
 *
 * La règle est celle d'un vrai dossier : la dette financière ne dépasse pas
 * `maxDebtToEquity` fois les capitaux propres. Elle a la propriété qu'on
 * cherche — elle se resserre d'elle-même à mesure que l'entreprise perd de
 * l'argent, donc celle qui va mal touche le mur au moment précis où elle
 * voudrait s'endetter davantage.
 */
describe("capacité d'endettement", () => {
  // Capitaux propres 75 000, dette 80 000 : à 2×, la capacité restante est
  // 2 × 75 000 − 80 000 = 70 000 €.
  // `loanDurationRounds` : sans échéancier déclaré, le moteur n'émet pas de
  // bloc `debt`, et c'est lui qui porte ce que la banque a refusé.
  const avecPlafond = () =>
    scenario({
      finance: { ...scenario().finance, maxDebtToEquity: 2, loanDurationRounds: 8 },
    });

  it("la banque sert la demande tant qu'elle tient sous le plafond", () => {
    const res = jouer({
      scenario: avecPlafond(),
      decisions: { ...base(), finance: { newLoan: 50000 } },
    }).res;
    expect(res.debt!.newLoan).toBe(50000);
    // Rien n'a été refusé : le champ n'existe pas.
    expect(res.debt!.loanRefused).toBeUndefined();
  });

  it("au-delà, elle coupe à la capacité et dit de combien", () => {
    const res = jouer({
      scenario: avecPlafond(),
      decisions: { ...base(), finance: { newLoan: 120000 } },
    }).res;
    expect(res.debt!.newLoan).toBeCloseTo(70000, 6);
    expect(res.debt!.loanRefused).toBeCloseTo(50000, 6);
    // Et l'argent refusé n'est jamais entré : la dette de clôture le dit.
    expect(res.balanceSheet.financialDebt).toBeLessThan(80000 + 120000);
  });

  it("capitaux propres à zéro : plus un euro", () => {
    // LE CAS QUI COMPTE. Une entreprise dont les capitaux propres sont
    // effacés ne trouve plus un prêteur : c'est là que la subvention devient
    // le seul recours, et c'est ce que la règle doit produire.
    const res = jouer({
      scenario: avecPlafond(),
      state: {
        finance: {
          // Actif 120 000 = passif 120 000, capitaux propres effacés.
          fixedAssetsNet: 120000,
          inventoryValue: 0,
          receivables: 0,
          cash: 0,
          equity: 0,
          financialDebt: 80000,
          payables: 0,
          overdraft: 40000,
        },
      },
      decisions: { ...base(), finance: { newLoan: 60000 } },
    }).res;
    expect(res.debt!.newLoan).toBe(0);
    expect(res.debt!.loanRefused).toBeCloseTo(60000, 6);
  });

  it("sans plafond déclaré, la demande passe en entier", () => {
    // Rétro-compatibilité : un scénario qui ne déclare pas la règle garde son
    // comportement, et son instantané doré avec.
    const res = jouer({
      scenario: scenario({ finance: { ...scenario().finance, loanDurationRounds: 8 } }),
      decisions: { ...base(), finance: { newLoan: 120000 } },
    }).res;
    expect(res.debt!.newLoan).toBe(120000);
    expect(res.debt!.loanRefused).toBeUndefined();
  });
});
