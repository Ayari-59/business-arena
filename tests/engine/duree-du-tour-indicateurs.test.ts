import { describe, expect, it } from "vitest";
import { scenarioByCode } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany, type Periodicity } from "@/config/scenarios/periodicity";
import { neutralDecisions } from "@/engine/bots";
import { libelleDeLEbeRetenu, tailleDeLaFenetre } from "@/engine/groupe/valorisation";
import { simulateRound } from "@/engine/simulation";
import type { CompanyRoundResult } from "@/engine/types";

/**
 * DEUX INDICATEURS QUI IGNORAIENT LA DURÉE DU TOUR (groupe D, « réparer le mode mois »).
 *
 *  · La robustesse financière rapportait la trésorerie au chiffre du tour divisé par
 *    quatre, quelle que soit sa durée : au mois, le dénominateur était trois fois trop
 *    petit, et une même caisse paraissait trois fois plus solide.
 *  · L'EBE qui fait la valeur du niveau 7 s'appelait « des douze derniers mois » alors
 *    qu'au mois sa fenêtre n'en couvre que quatre, annualisés.
 */

const DUREES: readonly Periodicity[] = ["month", "quarter", "year"];

function premierTour(periodicity: Periodicity): CompanyRoundResult {
  const def = scenarioByCode("nova");
  const scenario = composerLeScenarioJoue({
    scenario: def.scenario,
    seed: 4242,
    variableWorld: true,
    level: 2,
    concurrents: 0,
    periodicity,
  });
  const etat = applyPeriodicityToCompany(def.company("a", def.playerTeamName, "human"), periodicity, {
    abonnement: false,
  });
  const sortie = simulateRound({
    scenario,
    roundIndex: 1,
    companies: [etat],
    decisions: { a: neutralDecisions({ scenario, state: etat, roundIndex: 1 }) },
    activeEvents: [],
    seed: 4242,
  });
  return sortie.results["a"]!;
}

/** La robustesse attendue : la caisse rapportée au quart du chiffre d'un TRIMESTRE. */
function robustesseAttendue(r: CompanyRoundResult, roundDays: number): number {
  const b = r.balanceSheet;
  const dette = b.equity > 0 ? b.financialDebt / b.equity : b.financialDebt > 0 ? 2 : 0;
  const trimestre = (r.incomeStatement.revenue * 90) / roundDays / 4;
  const caisse = trimestre > 0 ? b.cash / trimestre : 0;
  return Math.max(
    0,
    Math.min(1, 0.4 * Math.max(0, 1 - dette / 3) + 0.4 * Math.max(0, Math.min(1, caisse / 2)) + 0.2 * (b.equity > 0 ? 1 : 0)),
  );
}

describe("la robustesse financière suit la durée du tour", () => {
  for (const p of DUREES) {
    it(`${p} : la trésorerie se rapporte au chiffre d'un trimestre`, () => {
      const r = premierTour(p);
      const roundDays = { month: 30, quarter: 90, year: 360 }[p];
      // Le cas mord : l'indicateur est publié, et la caisse ne sature pas le terme.
      expect(r.performanceMetrics).toBeDefined();
      expect(robustesseAttendue(r, roundDays)).toBeLessThan(1);
      expect(r.performanceMetrics!.financialRobustness).toBeCloseTo(robustesseAttendue(r, roundDays), 9);
    });
  }
});

describe("l'EBE qui fait la valeur se nomme selon sa fenêtre", () => {
  it("au trimestre et à l'année, douze mois", () => {
    expect(libelleDeLEbeRetenu(90)).toBe("EBE des douze derniers mois");
    expect(libelleDeLEbeRetenu(360)).toBe("EBE des douze derniers mois");
  });

  it("au mois, le nombre de mois que la fenêtre lit vraiment", () => {
    const mois = tailleDeLaFenetre(30);
    expect(mois).toBeLessThan(12);
    expect(libelleDeLEbeRetenu(30)).not.toMatch(/douze/);
    expect(libelleDeLEbeRetenu(30)).toBe("EBE des quatre derniers mois, annualisé");
  });
});
