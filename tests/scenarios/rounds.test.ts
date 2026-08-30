import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { applyRoundsCount, toursDeLaPartie } from "../../src/config/scenarios/rounds";

/**
 * La durée d'une partie.
 *
 * Elle venait du secteur et de lui seul : toute partie durait six trimestres,
 * quoi que l'enseignant ait prévu. Un atelier de cinq séances dont la dernière
 * rend compte n'en joue que quatre, et la partie restait ouverte sur deux tours
 * que personne ne jouerait jamais : pas de classement final, pas de relevé
 * complet, et une fiche qui annonçait un troisième nombre encore.
 */
describe("durée d'une partie", () => {
  it("une partie se raccourcit et ne s'allonge jamais", () => {
    for (const d of SCENARIOS) {
      const max = d.scenario.roundsCount;
      expect(toursDeLaPartie(d.scenario, 4), `${d.code}`).toBe(Math.min(4, max));
      expect(toursDeLaPartie(d.scenario, 1), `${d.code}`).toBe(1);
      // Au delà du secteur, les équipes joueraient des tours sans situation ni
      // événement écrits pour eux : la demande est rabotée, pas honorée.
      expect(toursDeLaPartie(d.scenario, max + 5), `${d.code}`).toBe(max);
      expect(toursDeLaPartie(d.scenario, 0), `${d.code}`).toBe(1);
      expect(toursDeLaPartie(d.scenario, -3), `${d.code}`).toBe(1);
      expect(toursDeLaPartie(d.scenario, Number.NaN), `${d.code}`).toBe(max);
      // Absent : la durée du secteur, comportement d'avant ce réglage.
      expect(toursDeLaPartie(d.scenario, undefined), `${d.code}`).toBe(max);
    }
  });

  it("seul le nombre de tours change", () => {
    for (const d of SCENARIOS) {
      const court = applyRoundsCount(d.scenario, 3);
      expect(court.roundsCount).toBe(3);
      expect(court.market).toEqual(d.scenario.market);
      expect(court.product).toEqual(d.scenario.product);
      expect(court.fixedCostsPerRound).toBe(d.scenario.fixedCostsPerRound);
      // Les événements scriptés au delà du dernier tour ne se déclenchent
      // simplement jamais ; on ne les retire pas, pour que rallonger une partie
      // identique redonne exactement la même dramaturgie.
      expect(court.scriptedEvents).toEqual(d.scenario.scriptedEvents);
    }
  });

  it("la création de partie applique la durée demandée", () => {
    // La fonction peut être juste et n'être appelée nulle part : la partie
    // durerait alors six tours comme avant, sans qu'aucun autre test ne bouge.
    const service = readFileSync("src/services/game.service.ts", "utf-8");
    const appel = service.slice(service.indexOf("const scenarioSnapshot"));
    const bloc = appel.slice(0, appel.indexOf(";"));
    expect(bloc, "la durée demandée n'entre pas dans l'instantané du scénario").toContain(
      "applyRoundsCount",
    );
    expect(bloc, "la durée ne vient pas des arguments de création").toContain("args.roundsCount");
    // Et la partie crée bien autant de tours que l'instantané en annonce.
    expect(service).toContain("length: scenarioSnapshot.roundsCount");
  });

  it("l'enseignant peut régler la durée à la création", () => {
    // C'était la remarque d'origine : « ce n'est pas modifiable ». Un réglage
    // qui existe dans le service et pas dans le formulaire reste inaccessible.
    const formulaire = readFileSync("src/app/teacher/page.tsx", "utf-8");
    expect(formulaire, "le formulaire enseignant n'expose pas la durée").toContain(
      'name="roundsCount"',
    );
    const action = readFileSync("src/app/teacher/actions.ts", "utf-8");
    expect(action, "l'action ne lit pas le champ").toContain('formData.get("roundsCount")');
    expect(action, "l'action ne transmet pas la durée au service").toContain(
      "roundsCount: parsed.roundsCount",
    );
  });
});
