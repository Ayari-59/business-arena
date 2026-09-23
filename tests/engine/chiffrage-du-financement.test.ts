import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import {
  coutDeLEscompte,
  echeancierEmprunt,
  totalDesEtudes,
} from "../../src/config/cout-du-financement";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SimulationInput,
} from "../../src/engine/types";

/**
 * CE QU'ON ANNONCE À L'ÉLÈVE EST CE QUE LE MOTEUR PRÉLÈVE.
 *
 * L'écran de décision chiffre désormais l'emprunt et l'escompte avant que
 * l'élève ne valide : échéance par tour, intérêts cumulés, total à rembourser,
 * agios. Un chiffrage qui divergerait de la simulation serait pire que pas de
 * chiffrage du tout — l'élève apprendrait une règle fausse et la vérifierait
 * au tour suivant.
 *
 * Ces tests font donc tourner de VRAIES simulations et comparent, au centime,
 * ce que le module d'affichage promet à ce que le moteur facture.
 */

const TAUX_EMPRUNT = 0.06;
const JOURS_DU_TOUR = 90;
const DUREE_EN_TOURS = 4;

const scenario = (): EngineScenarioConfig => ({
  code: "test",
  version: "1",
  roundsCount: 6,
  roundDays: JOURS_DU_TOUR,
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
        loyalty: 0.2,
        priceEffectBounds: { min: 0.2, max: 4 },
        paymentDelayDays: 45,
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
    loanAnnualRate: TAUX_EMPRUNT,
    overdraftAnnualRate: 0.12,
    overdraftLimit: 20000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 30,
    depreciationPerRound: 3000,
    loanDurationRounds: DUREE_EN_TOURS,
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
});

/** Une entreprise sans dette, et assez de caisse pour ne jamais passer en découvert. */
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
  loans: [],
  finance: {
    fixedAssetsNet: 135000,
    inventoryValue: 0,
    receivables: 0,
    cash: 600000,
    equity: 735000,
    financialDebt: 0,
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
  companies: [company("avec"), company("sans")],
  decisions: { avec: base(), sans: base() },
  activeEvents: [],
  seed: 42,
  ...over,
});

/**
 * Deux entreprises identiques, l'une emprunte au tour 1 et l'autre pas. La
 * DIFFÉRENCE de charges financières cumulées est le coût du seul emprunt :
 * tout le reste leur est commun, et la caisse de départ exclut le découvert.
 */
function joueLesTours(montantEmprunte: number, tours: number) {
  let etat = input();
  const interets = { avec: 0, sans: 0 };
  const echeances: number[] = [];
  for (let tour = 1; tour <= tours; tour++) {
    const decisions = {
      avec: tour === 1 ? { ...base(), finance: { newLoan: montantEmprunte } } : base(),
      sans: base(),
    };
    const out = simulateRound({ ...etat, roundIndex: tour, decisions });
    interets.avec += out.results["avec"]!.incomeStatement.interest;
    interets.sans += out.results["sans"]!.incomeStatement.interest;
    if (tour > 1) echeances.push(out.results["avec"]!.debt!.mandatoryRepayment);
    etat = { ...etat, companies: out.companies };
  }
  return { coutDeLEmprunt: interets.avec - interets.sans, echeances };
}

describe("l'emprunt chiffré avant de valider", () => {
  it("l'échéance annoncée est celle que le moteur prélève", () => {
    const montant = 80000;
    const annonce = echeancierEmprunt({
      montant,
      dureeEnTours: DUREE_EN_TOURS,
      tauxAnnuel: TAUX_EMPRUNT,
      joursDuTour: JOURS_DU_TOUR,
    });
    expect(annonce.echeanceParTour).toBe(20000);
    expect(annonce.tours).toBe(DUREE_EN_TOURS);

    // Le moteur prélève l'échéance à partir du tour SUIVANT celui où l'emprunt
    // est contracté : l'emprunt n'entre en dette qu'à la clôture.
    const { echeances } = joueLesTours(montant, DUREE_EN_TOURS + 1);
    for (const prelevee of echeances) {
      expect(prelevee).toBeCloseTo(annonce.echeanceParTour, 6);
    }
    expect(echeances).toHaveLength(DUREE_EN_TOURS);
  });

  it("les intérêts annoncés sont ceux que le moteur facture", () => {
    const montant = 80000;
    const annonce = echeancierEmprunt({
      montant,
      dureeEnTours: DUREE_EN_TOURS,
      tauxAnnuel: TAUX_EMPRUNT,
      joursDuTour: JOURS_DU_TOUR,
    });
    // Dette d'ouverture 80 000, 60 000, 40 000, 20 000 sur quatre tours de
    // 90 jours à 6 % : 1 200 + 900 + 600 + 300.
    expect(annonce.interets).toBeCloseTo(3000, 6);
    expect(annonce.totalARembourser).toBeCloseTo(83000, 6);

    const { coutDeLEmprunt } = joueLesTours(montant, DUREE_EN_TOURS + 1);
    expect(coutDeLEmprunt).toBeCloseTo(annonce.interets, 4);
  });

  it("un montant nul ne coûte rien, et la durée reste au moins un tour", () => {
    const rien = echeancierEmprunt({
      montant: 0,
      dureeEnTours: DUREE_EN_TOURS,
      tauxAnnuel: TAUX_EMPRUNT,
      joursDuTour: JOURS_DU_TOUR,
    });
    expect(rien).toMatchObject({ echeanceParTour: 0, interets: 0, totalARembourser: 0 });
    // Une durée absurde ne doit pas produire une division par zéro à l'écran.
    expect(
      echeancierEmprunt({ montant: 1000, dureeEnTours: 0, tauxAnnuel: 0.06, joursDuTour: 90 }).tours,
    ).toBe(1);
  });
});

describe("l'escompte chiffré avant de valider", () => {
  it("les agios annoncés sont ceux que le moteur prélève", () => {
    const montant = 50000;
    const annonce = coutDeLEscompte({
      montant,
      tauxAnnuel: 0.06,
      joursDuTour: JOURS_DU_TOUR,
    });
    expect(annonce.cout).toBeCloseTo(750, 6); // 50 000 × 6 % × 90/360
    expect(annonce.net).toBeCloseTo(49250, 6);

    // Le moteur : mêmes agios, sur un tour où l'entreprise a des créances.
    const premier = simulateRound(input());
    const creances = premier.results["avec"]!.balanceSheet.receivables;
    expect(creances, "il faut des créances à mobiliser").toBeGreaterThan(montant);

    const avec = simulateRound({
      ...input(),
      roundIndex: 2,
      companies: premier.companies,
      decisions: { avec: { ...base(), treasury: { discount: montant } }, sans: base() },
    });
    const sans = simulateRound({
      ...input(),
      roundIndex: 2,
      companies: premier.companies,
      decisions: { avec: base(), sans: base() },
    });
    const preleve =
      avec.results["avec"]!.incomeStatement.interest -
      sans.results["avec"]!.incomeStatement.interest;
    expect(preleve).toBeCloseTo(annonce.cout, 4);
  });
});

describe("le cumul des études", () => {
  it("additionne ce qui est coché, et rien d'autre", () => {
    expect(totalDesEtudes([])).toBe(0);
    expect(totalDesEtudes([1500, 1000, 800, 1200])).toBe(4500);
    expect(totalDesEtudes([1500, 1200])).toBe(2700);
  });
});
