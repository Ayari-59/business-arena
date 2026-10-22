import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { composerLeScenarioJoue } from "../../src/config/scenarios/scenario-joue";
import { applyRoundsCount, couvertureDeLaSaisonnalite } from "../../src/config/scenarios/rounds";
import { computePotentialDemand, saisonDuTour } from "../../src/engine/market/demand";
import { probabiliteDeRupture } from "../../src/engine/groupe/import";
import type { EngineScenarioConfig } from "../../src/engine/types";

/**
 * UN TABLEAU DE SAISONNALITÉ SE LIT PAR TOUR, ET JAMAIS AU-DELÀ DE SA FIN.
 *
 * La décision (écrite dans `config/scenarios/periodicity.ts`) : le tableau porte la
 * dramaturgie de la partie TOUR PAR TOUR, comme les situations et les événements
 * scriptés ; il ne change pas avec la périodicité. Ce qui ne doit jamais arriver, c'est
 * qu'il soit lu sur plus de tours qu'il n'a de valeurs : la demande y retombait à 1,
 * en silence, pendant que l'import du niveau 7 y bouclait, en silence aussi — la même
 * partie lisait le même tableau de deux façons.
 */

const tableaux = (s: EngineScenarioConfig): number[][] => [
  s.market.seasonality,
  ...s.market.segments.flatMap((g) => (g.seasonality ? [g.seasonality] : [])),
  ...(s.products ?? []).flatMap((p) => [
    ...(p.market.seasonality ? [p.market.seasonality] : []),
    ...p.market.segments.flatMap((g) => (g.seasonality ? [g.seasonality] : [])),
  ]),
];

describe("la saisonnalité : une seule lecture, par tour", () => {
  it("la périodicité ne touche pas aux tableaux : mêmes valeurs au mois, au trimestre, à l'année", () => {
    for (const def of SCENARIOS) {
      const reglages = { scenario: def.scenario, seed: 1, variableWorld: false, level: 2, concurrents: 3 };
      const trimestre = composerLeScenarioJoue({ ...reglages, periodicity: "quarter" });
      for (const p of ["month", "year"] as const) {
        expect(tableaux(composerLeScenarioJoue({ ...reglages, periodicity: p })), `${def.code} ${p}`).toEqual(
          tableaux(trimestre),
        );
      }
    }
  });

  it("chaque scénario intégré a au moins autant de valeurs de saison que de tours", () => {
    for (const def of SCENARIOS) {
      expect(couvertureDeLaSaisonnalite(def.scenario), def.code).toBeGreaterThanOrEqual(def.scenario.roundsCount);
    }
  });

  it("une partie plus longue que ses tableaux est REFUSÉE à la création, avec la raison", () => {
    const nova = SCENARIOS.find((d) => d.code === "nova")!.scenario;
    // Un scénario qui annonce douze tours écrits n'en a que six de saison : rien à
    // prolonger, puisque ses tours 7 à 12 se disent écrits.
    expect(() => applyRoundsCount({ ...nova, roundsCount: 12 }, 12, "quarter")).toThrow(/saisonnalité/);
    expect(() => applyRoundsCount({ ...nova, roundsCount: 12 }, 6, "quarter")).not.toThrow();
  });

  it("la demande et l'import du niveau 7 lisent le même coefficient à chaque tour", () => {
    const nova = SCENARIOS.find((d) => d.code === "nova")!.scenario;
    const imp = { rupture: { seuilDePic: 1.2, probabiliteAuxPics: 0.5, probabilite: 0.1 } } as never;
    for (let tour = 1; tour <= 12; tour += 1) {
      const saison = saisonDuTour(nova.market.seasonality, tour);
      const segment = { ...nova.market.segments[0]!, seasonality: undefined, growth: 0 };
      expect(computePotentialDemand(segment, tour, nova.market.seasonality, 1)).toBeCloseTo(segment.size * saison, 9);
      expect(probabiliteDeRupture(nova, imp, tour), `tour ${tour}`).toBe(saison >= 1.2 ? 0.5 : 0.1);
    }
  });

  it("aucun code ne lit un tableau de saison modulo sa longueur", () => {
    const SRC = join(process.cwd(), "src");
    const sources = (d: string): string[] =>
      readdirSync(d).flatMap((e) => {
        const c = join(d, e);
        return statSync(c).isDirectory() ? sources(c) : /\.tsx?$/.test(e) ? [c] : [];
      });
    const fautifs = sources(SRC).filter((f) => /%[^;\n]*seasonality[^;\n]*\.length/.test(readFileSync(f, "utf8")));
    expect(fautifs.map((f) => f.slice(SRC.length + 1))).toEqual([]);
  });
});
