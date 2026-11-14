import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { scenarioByCode } from "@/config/scenarios/registry";
import * as duree from "@/config/duree-du-tour";

/**
 * LA DURÉE ANNONCÉE (séance d'essai, P0-1 ; décision du propriétaire : on garde
 * 6 tours par défaut, mais on annonce la durée en séances).
 *
 * À l'essai, un tour a pris 18 à 20 min au premier, 15 à 18 min ensuite, et
 * une séance de 55 min a tenu 2 tours : la partie par défaut demande 3
 * séances, et rien ne le disait à la création. Le pilotage annonçait 11 min
 * pour les tours suivants : le modèle ne comptait ni la lecture des résultats
 * ni la seconde situation à analyser.
 *
 * Vue rouge sur le code d'avant (11 min, aucune durée en séances), verte après.
 */
const nova = scenarioByCode("nova");
const niveau3 = DIFFICULTY_PRESETS.find((p) => p.level === 3)!;

type Faits = Parameters<typeof duree.dureeDuTour>[0];
const faits = (tour: number): Faits =>
  ({
    signesDeCadrage: duree.signesDeCadrage(nova),
    signesDeSituation: duree.signesDeSituation(nova.situations, tour),
    champs: duree.champsOuverts(niveau3.decisions),
    premierTour: tour === 1,
    avecQuiz: true,
    // Les postes que la partie de classe ajoute, à partir du tour 2.
    enClasse: true,
  }) as Faits;

describe("la durée des tours, recalée sur la séance d'essai", () => {
  it("le premier tour reste autour de 20 min", () => {
    const m = duree.dureeDuTour(faits(1)).minutes;
    expect(m).toBeGreaterThanOrEqual(18);
    expect(m).toBeLessThanOrEqual(20);
  });

  it("les tours suivants comptent la lecture des résultats et la seconde situation : 15 à 18 min", () => {
    for (const tour of [2, 3, 4, 5, 6]) {
      const m = duree.dureeDuTour(faits(tour)).minutes;
      expect(m, `tour ${tour}`).toBeGreaterThanOrEqual(15);
      expect(m, `tour ${tour}`).toBeLessThanOrEqual(18);
    }
  });
});

describe("la partie, en séances de 55 min", () => {
  const plan = (duree as Record<string, unknown>).planDesSeances as
    | ((durees: number[]) => { seances: number; toursParSeance: number[][] })
    | undefined;

  it("6 tours par défaut font environ 3 séances, 2 tours par séance", () => {
    expect(typeof plan).toBe("function");
    const durees = [1, 2, 3, 4, 5, 6].map((t) => duree.dureeDuTour(faits(t)).minutes);
    const p = plan!(durees);
    expect(p.seances).toBe(3);
    expect(p.toursParSeance).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it("suit le nombre de tours", () => {
    const durees = (n: number) => Array.from({ length: n }, (_, i) => duree.dureeDuTour(faits(i + 1)).minutes);
    expect(plan!(durees(2)).seances).toBe(1);
    expect(plan!(durees(4)).seances).toBe(2);
    // Au-delà du tour 6, plus de situation écrite : les tours raccourcissent.
    expect(plan!(durees(12)).seances).toBeGreaterThanOrEqual(5);
  });
});

describe("l'enseignant le lit", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

  it("sous « Tours joués » du formulaire de création", () => {
    const page = lire("src/app/teacher/page.tsx");
    const tours = page.indexOf('name="roundsCount"');
    expect(tours).toBeGreaterThan(0);
    expect(page.indexOf("<DureeDeLaPartie", tours)).toBeGreaterThan(tours);
  });

  it("dans le bandeau du pilotage, avec la séance en cours et la reprise", () => {
    const page = lire("src/app/teacher/games/[gameId]/page.tsx");
    expect(page).toContain("planDesSeances(");
    expect(page).toContain("data-seance-en-cours");
    expect(page).toContain("/reprendre");
  });
});
