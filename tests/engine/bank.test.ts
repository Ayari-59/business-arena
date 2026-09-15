import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import {
  BAISSE_MAX_PAR_TOUR,
  CONFIANCE_PLANCHER,
  conditionsBancaires,
  confianceServie,
  confianceSuivante,
  tenueDeTresorerie,
} from "../../src/engine/finance/bank";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * LE DOSSIER BANCAIRE.
 *
 * La banque tient une CONFIANCE, qui fixe au tour suivant le plafond de
 * découvert consenti et son taux. Elle la lit dans la tenue de la trésorerie :
 * un tour clos en crise ou passé par l'affacturage forcé la fait descendre,
 * des tours sains la regagnent. Un plan de trésorerie, s'il arrive par une
 * autre voie que le formulaire (l'arène ne le demande plus), reste jugé sur
 * son exactitude — le pire des deux jugements compte.
 *
 * La confiance agit sur le DÉCOUVERT et jamais sur un emprunt déjà accordé :
 * le découvert est un concours révocable, le prêt en cours ne l'est pas.
 *
 * La fixture est volontairement tendue : le tour de base finit au plafond,
 * créances cédées d'office. C'est là que les conditions se voient.
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

  it("un plan juste laisse parler la trésorerie, un plan faux fait tomber la confiance", () => {
    const reference = jouer({ decisions: plan(0) });
    const juste = jouer({
      decisions: plan(reference.res.functionalBalance.netTreasury, reference.vendu),
    });
    const faux = jouer({ decisions: plan(2_000_000, 1) });

    expect(juste.res.bank!.reliability).toBeCloseTo(1, 6);
    // Le plan est juste, mais le tour a fini en affacturage forcé : c'est la
    // tenue (0,75) que la banque retient — 0,6 × 1 + 0,4 × 0,75.
    expect(juste.res.bank!.treasuryConduct).toBeCloseTo(0.75, 6);
    expect(juste.etat.bankTrust).toBeCloseTo(0.9, 6);
    // L'écart est plafonné à 1 : annoncer n'importe quoi ne vaut jamais pire
    // que zéro de fiabilité, sans quoi un seul tour délirant serait
    // irrattrapable.
    expect(faux.res.bank!.reliability).toBeLessThan(0.001);
    // Le lissage seul donnerait 0,6 ; le pas de baisse est borné : 0,85.
    expect(faux.etat.bankTrust).toBeCloseTo(1 - BAISSE_MAX_PAR_TOUR, 6);
    expect(faux.etat.bankTrust).toBeLessThan(juste.etat.bankTrust!);
  });

  it("sans plan, la banque juge quand même : la trésorerie parle pour l'équipe", () => {
    // Avant, sans plan, la confiance restait figée : trois tours en cessation
    // de paiements ne laissaient aucune trace. Le tour de base finit en
    // affacturage forcé, et la banque le retient.
    const res = jouer({ state: { bankTrust: 1 } });
    expect(res.res.bank!.reliability).toBeNull();
    expect(res.res.treasury!.forcedFactored).toBeGreaterThan(0);
    expect(res.res.bank!.treasuryConduct).toBeCloseTo(0.75, 6);
    expect(res.etat.bankTrust).toBeCloseTo(0.9, 6);
  });

  it("les conditions du tour sont celles de la confiance d'OUVERTURE", () => {
    // Le plan de ce tour n'est jugeable qu'une fois le tour joué : le punir
    // tout de suite reviendrait à sanctionner avant de savoir.
    const res = jouer({ state: { bankTrust: 0.8 }, decisions: plan(2_000_000, 1) }).res;
    expect(res.bank!.trustBefore).toBeCloseTo(0.8, 6);
    expect(res.bank!.overdraftLimit).toBeCloseTo(100000 * (0.4 + 0.6 * 0.8), 6);
    expect(res.bank!.overdraftAnnualRate).toBeCloseTo(0.12 + 0.05 * 0.2, 6);
    expect(res.bank!.trustAfter).toBeLessThan(0.8);
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

/**
 * LE FINANCEMENT VERT (Lot 2B) : un standing RSE établi détend les conditions.
 *
 * Il ne le faisait plus. La prime était ajoutée à la confiance puis rognée par
 * un `Math.min(1, …)` : le plafond avait un sens tant que les plans de
 * trésorerie faisaient DESCENDRE la confiance — la prime servait alors à la
 * regagner. Le plan retiré du formulaire, plus personne ne descendait sous le
 * plein, et la récompense n'avait plus rien à relever. Une équipe qui
 * s'engageait obtenait exactement le découvert de celle qui ne faisait rien.
 *
 * L'atelier DCG-RSE a pourtant une séance entière — « Financement vert et
 * climat social » — dont le livrable est une note reliant le standing RSE aux
 * conditions bancaires. Elle portait sur un lien inexistant.
 *
 * La confiance n'est donc plus bornée à 1 : le plafond nominal du scénario est
 * ce qu'obtient une entreprise SANS engagement, et le standing porte au-dessus.
 */
describe("financement vert", () => {
  const avecBanque = scenario();
  const base = {
    overdraftLimit: avecBanque.finance.overdraftLimit,
    overdraftAnnualRate: avecBanque.finance.overdraftAnnualRate,
  };
  const bank = avecBanque.finance.bank!;

  it("sans engagement, les conditions sont exactement celles du scénario", () => {
    // La garde qui protège tous les énoncés : le plafond annoncé par un
    // scénario est celui qu'on obtient quand on ne fait rien de particulier.
    const c = conditionsBancaires(confianceServie({}, avecBanque), base, bank);
    expect(c.overdraftLimit).toBeCloseTo(base.overdraftLimit, 6);
    expect(c.overdraftAnnualRate).toBeCloseTo(base.overdraftAnnualRate, 6);
  });

  it("un standing établi élargit le découvert et allège son taux", () => {
    const servie = confianceServie({ rseImageCapital: 50 }, avecBanque);
    expect(servie).toBeGreaterThan(1);
    const c = conditionsBancaires(servie, base, bank);
    expect(c.overdraftLimit).toBeGreaterThan(base.overdraftLimit);
    expect(c.overdraftAnnualRate).toBeLessThan(base.overdraftAnnualRate);
  });

  it("l'effet est progressif : un capital mûr vaut mieux qu'un capital jeune", () => {
    const jeune = conditionsBancaires(confianceServie({ rseImageCapital: 1 }, avecBanque), base, bank);
    const mur = conditionsBancaires(confianceServie({ rseImageCapital: 50 }, avecBanque), base, bank);
    expect(mur.overdraftLimit).toBeGreaterThan(jeune.overdraftLimit);
    expect(jeune.overdraftLimit).toBeGreaterThan(base.overdraftLimit);
  });

  it("la prime est bornée : le découvert ne devient pas une ligne de crédit", () => {
    // Un capital-image délirant ne doit pas doubler le découvert. La borne
    // vient du coefficient RSE (asymptote) ET d'un garde-fou dur dans la
    // fonction, pour qu'aucun appelant ne puisse la contourner.
    const enorme = conditionsBancaires(confianceServie({ rseImageCapital: 1e9 }, avecBanque), base, bank);
    expect(enorme.overdraftLimit).toBeLessThan(base.overdraftLimit * 1.2);
    expect(enorme.overdraftAnnualRate).toBeGreaterThan(0);
    // Et même une confiance forgée hors de toute prime reste bornée.
    const force = conditionsBancaires(99, base, bank);
    expect(force.overdraftLimit).toBeLessThan(base.overdraftLimit * 1.25);
  });

  it("un plan peu fiable fait toujours DESCENDRE la confiance sous le plein", () => {
    // La voie en sommeil reste entière : elle sert encore aux ateliers qui
    // déposeraient un plan par une autre porte.
    const basse = conditionsBancaires(confianceServie({ bankTrust: 0.3 }, avecBanque), base, bank);
    expect(basse.overdraftLimit).toBeLessThan(base.overdraftLimit);
    expect(basse.overdraftAnnualRate).toBeGreaterThan(base.overdraftAnnualRate);
  });
});

/**
 * LA BANQUE LIT LA TENUE DE LA TRÉSORERIE.
 *
 * Le plan de trésorerie retiré du formulaire, la confiance s'était figée au
 * plein : une équipe pouvait enchaîner les cessations de paiements sans que sa
 * banque en retienne rien, quand les cartes du jeu promettaient l'inverse.
 * Elle lit maintenant ce que l'équipe a fait de son cash — et parce qu'un
 * plafond plus bas rapproche l'affacturage forcé, qui rabaisse la confiance,
 * la sanction est une spirale : trois garde-fous la freinent.
 */
describe("la banque lit la tenue de la trésorerie", () => {
  const bank = scenario().finance.bank!;
  const saine = { finance: { ...company().finance, cash: 200000, equity: 255000 } };

  it("trois lectures : tenue, cession d'office, cessation de paiements", () => {
    expect(tenueDeTresorerie({ crisis: false, forcedFactored: 0 })).toBe(1);
    expect(tenueDeTresorerie({ crisis: false, forcedFactored: 1 })).toBe(0.75);
    // La crise l'emporte sur tout : la banque est intervenue, et ça n'a pas suffi.
    expect(tenueDeTresorerie({ crisis: true, forcedFactored: 100000 })).toBe(0);
  });

  it("un tour sain laisse la confiance au plein", () => {
    const res = jouer({ state: saine });
    expect(res.res.treasury?.forcedFactored ?? 0).toBe(0);
    expect(res.res.bank!.treasuryConduct).toBe(1);
    expect(res.etat.bankTrust).toBe(1);
  });

  it("un tour en crise fait descendre la confiance, d'un pas borné", () => {
    // Un plafond ridicule force la crise dès le premier tour. Le lissage seul
    // donnerait 0,6 : un seul mauvais trimestre ne vaut pas quarante points.
    const etrangle = scenario();
    etrangle.finance = { ...etrangle.finance, overdraftLimit: 5000 };
    const res = jouer({ scenario: etrangle });
    expect(res.res.treasury!.crisis).toBe(true);
    expect(res.res.bank!.treasuryConduct).toBe(0);
    expect(res.etat.bankTrust).toBeCloseTo(1 - BAISSE_MAX_PAR_TOUR, 6);
  });

  it("garde-fou 1 · la chute est bornée par tour, et s'arrête au plancher", () => {
    // Trajectoire d'une équipe qui ne redresse rien : 1 → 0,85 → 0,70 → 0,55
    // → 0,50, puis plus rien. La banque se méfie, elle ne ferme pas.
    const chemin = [1];
    for (let i = 0; i < 6; i++) chemin.push(confianceSuivante(chemin[i]!, 0, bank));
    expect(chemin.slice(1, 5).map((c) => Math.round(c * 100))).toEqual([85, 70, 55, 50]);
    expect(chemin[5]).toBe(CONFIANCE_PLANCHER);
    expect(chemin[6]).toBe(CONFIANCE_PLANCHER);
  });

  it("garde-fou 2 · au plancher, la banque consent encore 70 % du plafond", () => {
    // La spirale a un fond : au plus bas, il reste de quoi passer un tour,
    // et la chaîne de sauvetage (apport, emprunt, subvention) fait le reste.
    const nominal = { overdraftLimit: 100000, overdraftAnnualRate: 0.12 };
    const c = conditionsBancaires(CONFIANCE_PLANCHER, nominal, bank);
    expect(c.overdraftLimit).toBeCloseTo(70000, 6);
    expect(c.overdraftAnnualRate).toBeCloseTo(0.145, 6);
  });

  it("garde-fou 3 · des tours sains regagnent la confiance, sans dépasser le plein", () => {
    // Sinon une erreur du tour 2 pèserait encore au tour 8.
    const chemin = [CONFIANCE_PLANCHER];
    for (let i = 0; i < 12; i++) chemin.push(confianceSuivante(chemin[i]!, 1, bank));
    expect(chemin[1]).toBeCloseTo(0.7, 6);
    expect(chemin[2]).toBeCloseTo(0.82, 6);
    for (let i = 1; i < chemin.length; i++) expect(chemin[i]).toBeGreaterThan(chemin[i - 1]!);
    expect(chemin[12]).toBeLessThanOrEqual(1);
    expect(chemin[12]).toBeGreaterThan(0.99);
    // Et dans le moteur : une équipe revenue à la santé regagne du crédit.
    const res = jouer({ state: { ...saine, bankTrust: 0.7 } });
    expect(res.res.bank!.treasuryConduct).toBe(1);
    expect(res.etat.bankTrust).toBeCloseTo(0.82, 6);
  });

  it("une confiance héritée sous le plancher n'est ni relevée ni enfoncée par une crise", () => {
    expect(confianceSuivante(0.3, 0, bank)).toBe(0.3);
    // mais un tour sain la relève
    expect(confianceSuivante(0.3, 1, bank)).toBeCloseTo(0.58, 6);
  });

  it("la sanction se paie au tour SUIVANT : plafond plus bas, taux plus haut", () => {
    // Ce que l'équipe voit après un tour en crise : 91 000 € au lieu de
    // 100 000 €, et trois quarts de point de plus.
    const res = jouer({ state: { ...saine, bankTrust: 1 - BAISSE_MAX_PAR_TOUR } }).res;
    expect(res.bank!.overdraftLimit).toBeCloseTo(100000 * (0.4 + 0.6 * 0.85), 6);
    expect(res.bank!.overdraftAnnualRate).toBeCloseTo(0.12 + 0.05 * 0.15, 6);
  });

  it("la prime verte s'ajoute à une confiance entamée : le standing RSE aide à remonter", () => {
    const nue = confianceServie({ bankTrust: 0.85 }, scenario());
    const verte = confianceServie({ bankTrust: 0.85, rseImageCapital: 50 }, scenario());
    expect(nue).toBeCloseTo(0.85, 6);
    expect(verte).toBeGreaterThan(nue);
  });
});
