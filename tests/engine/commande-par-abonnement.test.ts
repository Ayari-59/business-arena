import { describe, expect, it } from "vitest";
import { scenarioByCode } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany, type Periodicity } from "@/config/scenarios/periodicity";
import { neutralDecisions } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import type { CompanyRoundResult, EventInstance } from "@/engine/types";

/**
 * UNE COMMANDE PAR ABONNEMENT NE COMPTE PAS LA DURÉE DU TOUR DEUX FOIS.
 *
 * À VOLT FITNESS, une unité est un adhérent qui paie un tour. La convention
 * d'entreprise (`fitness_contrat_surprise`) multipliait ses adhérents par k ET
 * les faisait payer au prix du tour, lui-même × k : 2 333 € au mois, 21 000 € au
 * trimestre, 336 000 € à l'année, soit seize fois le trimestre au lieu de quatre.
 * Les contrats proposés (`orderOffers`) avaient le défaut inverse : des inscrits
 * × k à un prix resté trimestriel. Désormais, les adhérents ne bougent pas et le
 * prix d'un tour suit sa durée, comme le prix de référence.
 */

const DUREES: readonly Periodicity[] = ["month", "quarter", "year"];
const K: Record<Periodicity, number> = { month: 1 / 3, quarter: 1, year: 4 };

function joue(periodicity: Periodicity) {
  const def = scenarioByCode("fitness");
  const scenario = composerLeScenarioJoue({
    scenario: def.scenario,
    seed: 4242,
    variableWorld: false,
    level: 2,
    concurrents: 0,
    periodicity,
  });
  const etat = applyPeriodicityToCompany(def.company("a", def.playerTeamName, "human"), periodicity, {
    abonnement: true,
  });
  const decisions = { a: neutralDecisions({ scenario, state: etat, roundIndex: 1 }) };
  const tour = (activeEvents: EventInstance[]): CompanyRoundResult =>
    simulateRound({ scenario, roundIndex: 1, companies: [etat], decisions, activeEvents, seed: 4242 }).results["a"]!;
  const contrat = scenario.events.find((e) => e.code === "fitness_contrat_surprise")!;
  const evenement: EventInstance = {
    code: contrat.code,
    scope: "company",
    companyId: "a",
    roundsLeft: 1,
    modifiers: contrat.modifiers,
  };
  return { scenario, sans: tour([]), avec: tour([evenement]) };
}

describe("la convention d'entreprise de VOLT FITNESS", () => {
  const trimestre = joue("quarter");
  const recetteAuTrimestre = trimestre.avec.incomeStatement.revenue - trimestre.sans.incomeStatement.revenue;

  it("le cas mord : au trimestre, la commande est livrée et rapporte", () => {
    expect(trimestre.avec.extraOrders?.delivered).toBeGreaterThan(0);
    expect(recetteAuTrimestre).toBeGreaterThan(0);
  });

  for (const p of DUREES) {
    it(`${p} : les mêmes adhérents, une recette au prorata de la durée du tour`, () => {
      const { avec, sans } = joue(p);
      expect(avec.extraOrders?.requested).toBe(trimestre.avec.extraOrders?.requested);
      const recette = avec.incomeStatement.revenue - sans.incomeStatement.revenue;
      // Le prix d'un tour est arrondi à l'euro : un écart d'un euro par adhérent au plus.
      const tolerance = (avec.extraOrders?.delivered ?? 0) * 1;
      expect(Math.abs(recette - recetteAuTrimestre * K[p])).toBeLessThanOrEqual(tolerance);
    });
  }
});

describe("les contrats proposés de VOLT FITNESS", () => {
  const base = scenarioByCode("fitness").scenario.orderOffers!;
  for (const p of DUREES) {
    it(`${p} : les inscrits ne bougent pas, le prix d'un tour suit sa durée`, () => {
      const offres = joue(p).scenario.orderOffers!;
      expect(offres.map((o) => o.units)).toEqual(base.map((o) => o.units));
      offres.forEach((o, i) => expect(o.price).toBe(Math.round(base[i]!.price * K[p])));
    });
  }
});
