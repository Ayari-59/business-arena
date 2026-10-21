import { describe, expect, it } from "vitest";
import { scenarioByCode, SCENARIOS } from "@/config/scenarios/registry";
import { CORRECTIFS_DES_PARTIES_NOUVELLES } from "@/config/scenarios/scenario-joue";
import { PERIODICITE_DE_L_EXAMEN, scenarioDeLExamen } from "@/pedagogy/examen/lot";

/**
 * LE LOT DE L'EXAMEN MESURE LE JEU QUE LE CANDIDAT JOUERA.
 *
 * Le lot choisit des graines d'égale difficulté en simulant la partie du candidat. Il
 * composait son monde sans les correctifs que la création de partie fige : ses
 * concurrents étaient les anciens, son parc l'ancien. L'équivalence annoncée à
 * l'enseignant portait sur un autre jeu que celui passé par ses élèves.
 */

describe("le lot de l'examen compose le monde avec les correctifs des parties nouvelles", () => {
  it("la liste des correctifs est celle qu'on attend (un ajout se voit ici)", () => {
    expect(Object.keys(CORRECTIFS_DES_PARTIES_NOUVELLES).sort()).toEqual([
      "concurrentsAssainis",
      "parcSansDoublon",
      "propositionALaDemande",
    ]);
  });

  for (const d of SCENARIOS.slice(0, 3)) {
    it(`${d.code} : chaque correctif est porté par le monde du lot`, () => {
      const s = scenarioDeLExamen(
        { definition: scenarioByCode(d.code), niveau: 2, tours: 6, bots: 3, periodicite: PERIODICITE_DE_L_EXAMEN },
        4242,
      );
      expect(s.bots?.concurrentsAssainis).toBe(true);
      expect(s.parcSansDoublon).toBe(true);
      expect(s.propositionALaDemande).toBe(true);
    });
  }
});
