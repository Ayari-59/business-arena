import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { anneeJouee } from "../../src/config/cours/cas";
import { scenarioDuCours } from "../../src/config/cours/arene-du-cours";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CORRECTIFS_DES_PARTIES_NOUVELLES } from "../../src/config/scenarios/scenario-joue";
import { scenarioByCode } from "../../src/config/scenarios/registry";

/**
 * L'ARÈNE DU COURS JOUE COMME UNE PARTIE CRÉÉE AUJOURD'HUI (arene-du-cours.ts).
 *
 * L'année du cours et ses rejeux jouaient l'arène d'avant les correctifs des parties
 * nouvelles : cinq concurrents sur huit y faisaient défaillance, et la gestion équilibrée
 * ne voyait pas ses ventes du tour d'avant. Ces gardes tiennent les trois choses : le
 * scénario du cours porte chaque correctif des parties nouvelles, aucune entreprise de
 * l'année ne fait défaillance, et aucun fichier du cours ne joue l'arène sans passer par
 * l'aide.
 */

const DOSSIER_DU_COURS = join(__dirname, "../../src/config/cours");

function fichiersDuCours(dossier: string): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? fichiersDuCours(join(dossier, f.name)) : f.name.endsWith(".ts") ? [join(dossier, f.name)] : [],
  );
}

describe("l'arène du cours", () => {
  it("porte chaque correctif des parties nouvelles", () => {
    const s = scenarioDuCours(scenarioByCode("nova").scenario, 4);
    expect(Object.keys(CORRECTIFS_DES_PARTIES_NOUVELLES).sort()).toEqual(
      ["concurrentsAssainis", "impotSurLExercice", "parcSansDoublon", "propositionALaDemande"],
    );
    expect(s.bots?.concurrentsAssainis).toBe(true);
    expect(s.parcSansDoublon).toBe(true);
    expect(s.impotSurLExercice).toBe(true);
    expect(s.propositionALaDemande).toBe(true);
    expect(s.roundsCount).toBe(4);
  });

  it.each(ENTREPRISES_DU_COURS)("chez %s, aucune entreprise de l'année ne fait défaillance", (code) => {
    const { partie } = anneeJouee(code);
    for (const tour of partie.rounds) {
      for (const [id, r] of Object.entries(tour.results)) expect(r.defaillant ?? false, `${id}`).toBe(false);
    }
  });

  it("aucun fichier du cours ne joue l'arène sans passer par l'aide", () => {
    for (const f of fichiersDuCours(DOSSIER_DU_COURS)) {
      if (f.endsWith("arene-du-cours.ts")) continue;
      const source = readFileSync(f, "utf8");
      expect(source, f).not.toMatch(/\bbotDecisions\(/);
      if (/\brunGame\(/.test(source)) expect(source, f).toMatch(/\bscenarioDuCours\(/);
    }
  });
});
