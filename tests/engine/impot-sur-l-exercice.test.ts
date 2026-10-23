import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { botDecisions, type BotProfile } from "@/engine/bots";
import { runGame } from "@/engine/simulation/runGame";
import { exerciceDOuverture } from "@/engine/simulation";
import { SCENARIOS, scenarioByCode } from "@/config/scenarios/registry";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "@/config/scenarios/scenario-joue";
import type { CompanyState, EngineScenarioConfig } from "@/engine/types";

/**
 * L'IMPÔT SE CALCULE SUR L'EXERCICE (`impotSurLExercice`, engine/types.ts).
 *
 * L'arène prenait l'impôt trimestre par trimestre : NOVA, en perte de 16 079 € sur sa
 * première année (gestion équilibrée, graine du cours), y payait 3 761 € d'impôt, celui de
 * ses bons trimestres. Avec le réglage, chaque tour verse un acompte, l'impôt du cumul de
 * l'exercice moins les acomptes déjà versés : sur un exercice, l'impôt payé est celui de son
 * résultat, et une année en perte ne paie rien.
 *
 * Décision du propriétaire : le correctif vaut pour les parties créées après lui ; une
 * partie commencée avant finit sous sa règle et se rejoue à l'identique.
 */

const GRAINE = 20260101;

/** Deux exercices joués par les bots, l'entreprise suivie gérée de façon équilibrée. */
function partie(scenario: EngineScenarioConfig, code: string, tours = 8) {
  const def = scenarioByCode(code);
  const s = { ...scenario, roundsCount: tours };
  const entreprises: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const p = runGame({
    scenario: s,
    initialCompanies: entreprises,
    seed: GRAINE,
    providers: Object.fromEntries(
      entreprises.map((e) => [
        e.id,
        (ctx: { state: CompanyState; roundIndex: number }) =>
          botDecisions(e.botProfile as BotProfile, { scenario: s, state: ctx.state, roundIndex: ctx.roundIndex }),
      ]),
    ),
  });
  return p.rounds.map((r) => r.results["joueur"]!.incomeStatement);
}

describe("sur un exercice, l'impôt payé est celui de son résultat", () => {
  for (const def of SCENARIOS) {
    it(`${def.code} : deux exercices, acomptes compris, report d'un exercice à l'autre`, () => {
      const tours = partie({ ...def.scenario, impotSurLExercice: true }, def.code);
      const taux = def.scenario.finance.taxRate;
      let report = 0;
      for (const exercice of [tours.slice(0, 4), tours.slice(4, 8)]) {
        const resultat = exercice.reduce((t, r) => t + r.pretaxIncome, 0);
        const impot = exercice.reduce((t, r) => t + r.tax, 0);
        expect(impot).toBeCloseTo(taux * Math.max(0, resultat - report), 6);
        report = Math.max(0, report - resultat);
      }
    });
  }

  it("NOVA, en perte sur sa première année, ne paie rien sur l'exercice ; un acompte s'y rend", () => {
    const nova = scenarioByCode("nova");
    const avant = partie(nova.scenario, "nova", 4);
    const apres = partie({ ...nova.scenario, impotSurLExercice: true }, "nova", 4);
    const somme = (t: typeof avant, f: (r: (typeof avant)[number]) => number) => t.reduce((s, r) => s + f(r), 0);
    expect(somme(avant, (r) => r.pretaxIncome)).toBeLessThan(0);
    // Le chemin d'avant : l'impôt des bons trimestres, payé malgré la perte de l'année.
    expect(somme(avant, (r) => r.tax)).toBeGreaterThan(0);
    expect(somme(apres, (r) => r.tax)).toBeCloseTo(0, 6);
    expect(apres.some((r) => r.tax < 0)).toBe(true);
  });

  it("sans le réglage, le chemin d'avant au centime : une partie commencée avant le correctif se rejoue à l'identique", () => {
    const nova = scenarioByCode("nova");
    const sans = partie(nova.scenario, "nova", 6);
    const faux = partie({ ...nova.scenario, impotSurLExercice: false }, "nova", 6);
    expect(faux).toEqual(sans);
  });
});

describe("l'exercice compte les tours d'une année depuis le premier tour de la partie", () => {
  const etat = { exerciceFiscal: { avantImpot: 1000, impot: 250, report: 300 }, taxLossCarryforward: 50 };
  it("au trimestre, quatre tours : le cinquième ouvre l'exercice suivant sur le déficit reportable du moment", () => {
    expect(exerciceDOuverture({ roundDays: 90 }, 1, {})).toEqual({ avantImpot: 0, impot: 0, report: 0 });
    expect(exerciceDOuverture({ roundDays: 90 }, 4, etat)).toEqual(etat.exerciceFiscal);
    expect(exerciceDOuverture({ roundDays: 90 }, 5, etat)).toEqual({ avantImpot: 0, impot: 0, report: 50 });
  });
  it("au mois, douze tours", () => {
    expect(exerciceDOuverture({ roundDays: 30 }, 12, etat)).toEqual(etat.exerciceFiscal);
    expect(exerciceDOuverture({ roundDays: 30 }, 13, etat).avantImpot).toBe(0);
  });
});

describe("le réglage se pose à la création d'une partie, et nulle part ailleurs", () => {
  const nova = scenarioByCode("nova");
  const reglages = { scenario: nova.scenario, seed: 11, variableWorld: true, level: 2, concurrents: 3, periodicity: "quarter" as const };

  it("le scénario joué le porte quand on le demande, et seulement alors", () => {
    expect(composerLeScenarioJoue({ ...reglages, impotSurLExercice: true }).impotSurLExercice).toBe(true);
    expect("impotSurLExercice" in composerLeScenarioJoue(reglages)).toBe(false);
  });

  it("la création d'une partie le demande, et le rejeu relit celui de la partie", () => {
    expect(CORRECTIFS_DES_PARTIES_NOUVELLES.impotSurLExercice).toBe(true);
    const rejeu = readFileSync("src/services/merite.service.ts", "utf8");
    expect(rejeu).toMatch(/impotSurLExercice: snapshot\.impotSurLExercice === true/);
  });
});
