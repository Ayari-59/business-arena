import { describe, expect, it } from "vitest";
import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { presetByLevel } from "@/config/difficulty";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { simulateRound } from "@/engine/simulation";
import { toGamme } from "@/engine/gamme";
import { proposedDecisionsFor, sansDepensesPonctuelles } from "@/services/decision-baseline";
import type { CompanyState, RoundDecisions } from "@/engine/types";

/**
 * LA PROPOSITION NE RECONDUIT AUCUNE DÉPENSE PONCTUELLE.
 *
 * Le diagnostic des crises des niveaux 1 à 6 : une équipe qui finance une fois la
 * référence à bâtir, puis valide les propositions, la refinançait à chaque tour
 * (le formulaire et le serveur reprenaient le budget R&D du tour précédent) et
 * finissait en défaillance, 12 parties sur 12.
 */

const TOUT: RoundDecisions = {
  price: 61.3,
  productionPlan: 5_100,
  marketingBudget: 7_000,
  qualityBudget: 2_500,
  maintenanceBudget: 4_000,
  rdBudget: 25_000,
  brandMarketingBudget: 2_000,
  communicationAxis: "qualite",
  insurance: "base",
  supplierChoice: "premium",
  acceptOrder: true,
  studies: { market: true },
  hr: { hire: 2, fire: 1, trainingBudget: 3_000, salaryIndex: 1.05 },
  qualityActions: [{ actionCode: "iso", level: 1 }],
  investment: { machineCapacityUnits: 300 },
  finance: { newLoan: 40_000, loanRepayment: 5_000, capitalIncrease: 20_000, dividend: 1_000 },
  treasury: { discount: 5_000, factoring: 2_000, placement: 10_000 },
  rse: { budget: 3_000, investment: 8_000 },
  startedRdActionIds: ["rd-1"],
  stoppedModuleItems: [{ module: "qualityActions", id: "iso" }],
  salesEstimate: { byProduct: { x: 4_000 }, units: 4_000 },
  products: {
    a: { price: 40, productionPlan: 3_000, marketingBudget: 3_000, qualityBudget: 1_000, supplierChoice: "premium", rdBudget: 25_000 },
    b: { price: 80, productionPlan: 2_100, marketingBudget: 4_000, qualityBudget: 1_500, rdBudget: 4_000 },
  },
};

describe("ce que la proposition garde d'un tour sur l'autre", () => {
  it("aucune dépense ponctuelle : R&D, études, machines, embauches, formation, financement, trésorerie, modules, RSE, commande", () => {
    const d = sansDepensesPonctuelles(TOUT);
    expect(d.rdBudget).toBe(0);
    expect(d.products!["a"]!.rdBudget).toBe(0);
    expect(d.products!["b"]!.rdBudget).toBe(0);
    for (const champ of [
      "acceptOrder",
      "studies",
      "qualityActions",
      "investment",
      "finance",
      "treasury",
      "rse",
      "startedRdActionIds",
      "stoppedModuleItems",
      "salesEstimate",
    ] as const) {
      expect(d[champ], champ).toBeUndefined();
    }
    expect(d.hr).toEqual({ salaryIndex: 1.05 });
  });

  it("les choix qui durent restent : prix, plan, budgets, fournisseur, assurance, axe, salaires", () => {
    const d = sansDepensesPonctuelles(TOUT);
    expect(d).toMatchObject({
      price: 61.3,
      productionPlan: 5_100,
      marketingBudget: 7_000,
      qualityBudget: 2_500,
      maintenanceBudget: 4_000,
      brandMarketingBudget: 2_000,
      communicationAxis: "qualite",
      insurance: "base",
      supplierChoice: "premium",
    });
    expect(d.products!["a"]).toMatchObject({ price: 40, productionPlan: 3_000, marketingBudget: 3_000, supplierChoice: "premium" });
  });

  it("une R&D portée par les seules références est retirée aussi", () => {
    const { rdBudget: _r, ...sansGlobal } = TOUT;
    void _r;
    const d = sansDepensesPonctuelles(sansGlobal);
    expect(d.rdBudget).toBeUndefined();
    expect(Object.values(d.products!).map((p) => p.rdBudget)).toEqual([0, 0]);
  });
});

describe("l'équipe qui finance une fois sa référence à bâtir, puis valide", () => {
  // Le traiteur du bistrot se bâtit au niveau 5 (la R&D est ouverte) : 18 000 €.
  it("ne la refinance pas au tour suivant", () => {
    const niveau = 5;
    const def = scenarioByCode(scenarioCodeForLevel("bistrot", niveau));
    const leviers = presetByLevel.get(niveau)!.decisions;
    const scenario = composerLeScenarioJoue({
      scenario: def.scenario,
      seed: 8_919,
      variableWorld: true,
      level: niveau,
      concurrents: 1,
      periodicity: "quarter",
      investmentStories: true,
    });
    const aBatir = toGamme(scenario).find((p) => p.development)!;
    expect(aBatir).toBeDefined();
    let etat: CompanyState = applyPeriodicityToCompany(def.company("a", def.playerTeamName, "human"), "quarter", {
      abonnement: false,
    });
    let precedente: RoundDecisions | null = null;
    const rd: number[] = [];
    for (let tour = 1; tour <= 3; tour += 1) {
      let d = proposedDecisionsFor({ snapshot: scenario, state: etat, roundIndex: tour, previousPayload: precedente, leviers });
      if (tour === 1) {
        d = {
          ...d,
          rdBudget: aBatir.development!.cost,
          products: { ...d.products!, [aBatir.code]: { ...d.products![aBatir.code]!, rdBudget: aBatir.development!.cost } },
        };
      }
      const sortie = simulateRound({ scenario, roundIndex: tour, companies: [etat], decisions: { a: d }, activeEvents: [], seed: 8_919 });
      rd.push(sortie.results["a"]!.incomeStatement.rdCost ?? 0);
      precedente = d;
      etat = sortie.companies[0]!;
    }
    expect(rd).toEqual([aBatir.development!.cost, 0, 0]);
  });
});
