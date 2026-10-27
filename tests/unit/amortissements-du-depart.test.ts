import { describe, expect, it } from "vitest";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { amortissementsDuDepart } from "../../src/config/scenarios/amortissements-du-depart";
import { economicDefaults, SCENARIOS, scenarioByCode } from "../../src/config/scenarios/registry";

/**
 * LES AMORTISSEMENTS AFFICHÉS SONT CEUX QUE LE MOTEUR COMPTE.
 *
 * Avec un parc typé, le moteur amortit chaque équipement et ignore
 * `finance.depreciationPerRound` (amortissements-du-depart.ts). L'atelier et les situations
 * affichaient ce réglage, que le panneau de l'enseignant proposait encore sans effet.
 */
describe("les amortissements du départ", () => {
  it.each(ENTREPRISES_DU_COURS)("chez %s, ils valent ceux du premier tour joué par le moteur", (code) => {
    const premier = anneeJouee(code).partie.rounds[0]!.results["joueur"]!;
    expect(amortissementsDuDepart(scenarioByCode(code).scenario)).toBeCloseTo(premier.incomeStatement.depreciation, 6);
  });

  it("le panneau de l'enseignant ne propose pas un réglage que le parc typé rend sans effet", () => {
    for (const d of SCENARIOS) {
      const defaut = economicDefaults(d).depreciationPerRound;
      if (d.scenario.equipment) expect(defaut, d.code).toBeNull();
      else expect(defaut, d.code).not.toBeNull();
    }
  });
});
