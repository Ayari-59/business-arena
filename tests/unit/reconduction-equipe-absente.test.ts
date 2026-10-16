import { describe, expect, it } from "vitest";
import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { presetByLevel } from "@/config/difficulty";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { simulateRound } from "@/engine/simulation";
import { toGamme } from "@/engine/gamme";
import { carryOverDecisions } from "@/services/decision.service";
import { proposedDecisionsFor, sansDepensesPonctuelles } from "@/services/decision-baseline";
import type { CompanyState, RoundDecisions } from "@/engine/types";

/**
 * L'ÉQUIPE ABSENTE NE RECONDUIT AUCUNE DÉPENSE PONCTUELLE, COMME LA PROPOSITION.
 *
 * `carryOverDecisions` (la clôture d'un tour qu'une équipe n'a pas rendu)
 * reprenait la R&D, l'engagement RSE et les ventes estimées du tour précédent :
 * une équipe qui avait financé sa référence à bâtir la refinançait à chaque tour
 * d'absence. Elle suit désormais la règle de la proposition.
 */

const PRECEDENTE: RoundDecisions = {
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
  hr: { hire: 2, trainingBudget: 3_000, salaryIndex: 1.05 },
  investment: { machineCapacityUnits: 300 },
  finance: { newLoan: 40_000, capitalIncrease: 20_000 },
  treasury: { placement: 10_000 },
  rse: { budget: 3_000, investment: 8_000 },
  salesEstimate: { byProduct: { x: 4_000 }, units: 4_000 },
  rachat: { cible: "brightwave", part: 0.51 } as unknown as RoundDecisions["rachat"],
  sousTraitance: { a: 500 },
  products: {
    a: { price: 40, productionPlan: 3_000, marketingBudget: 3_000, rdBudget: 25_000 },
    b: { price: 80, productionPlan: 2_100, marketingBudget: 4_000, rdBudget: 4_000 },
  },
};

describe("la reconduction d'une équipe absente", () => {
  it("suit exactement la règle de la proposition", () => {
    expect(carryOverDecisions(PRECEDENTE)).toEqual(sansDepensesPonctuelles(PRECEDENTE));
  });

  it("ne reprend ni R&D, ni RSE, ni financement, ni investissement, ni embauche, ni étude", () => {
    const d = carryOverDecisions(PRECEDENTE);
    expect(d.rdBudget).toBe(0);
    expect(Object.values(d.products!).map((p) => p.rdBudget)).toEqual([0, 0]);
    for (const champ of ["rse", "finance", "investment", "treasury", "studies", "acceptOrder", "salesEstimate", "rachat"] as const) {
      expect(d[champ], champ).toBeUndefined();
    }
    expect(d.hr).toEqual({ salaryIndex: 1.05 });
    expect(d).toMatchObject({ price: 61.3, productionPlan: 5_100, insurance: "base", supplierChoice: "premium", communicationAxis: "qualite" });
    // Niveau 7 : la sous-traitance se reconduit comme le plan ; le rachat, ponctuel, non.
    expect(d.sousTraitance).toEqual({ a: 500 });
  });

  it("l'équipe qui finance sa référence à bâtir puis s'absente ne la refinance pas", () => {
    // Le traiteur du bistrot se bâtit au niveau 5 (la R&D est ouverte).
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
    });
    const aBatir = toGamme(scenario).find((p) => p.development)!;
    let etat: CompanyState = applyPeriodicityToCompany(def.company("a", def.playerTeamName, "human"), "quarter", {
      abonnement: false,
    });
    const premier = proposedDecisionsFor({ snapshot: scenario, state: etat, roundIndex: 1, previousPayload: null, leviers });
    let d: RoundDecisions = {
      ...premier,
      rdBudget: aBatir.development!.cost,
      products: { ...premier.products!, [aBatir.code]: { ...premier.products![aBatir.code]!, rdBudget: aBatir.development!.cost } },
    };
    const rd: number[] = [];
    for (let tour = 1; tour <= 3; tour += 1) {
      const sortie = simulateRound({ scenario, roundIndex: tour, companies: [etat], decisions: { a: d }, activeEvents: [], seed: 8_919 });
      rd.push(sortie.results["a"]!.incomeStatement.rdCost ?? 0);
      etat = sortie.companies[0]!;
      d = carryOverDecisions(d);
    }
    expect(rd).toEqual([aBatir.development!.cost, 0, 0]);
  });
});
