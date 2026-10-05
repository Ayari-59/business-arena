import { describe, expect, it } from "vitest";
import { hasardDuDebrief } from "../../src/config/episodes/debrief";
import { TRACES } from "../../src/config/episodes/traces";
import type { Episode, PartieJouee } from "../../src/config/episodes/types";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/**
 * « Chance » veut dire que le trimestre a donné raison à une décision faible :
 * sous le tirage joué, elle a fait au moins aussi bien que la meilleure option.
 * « Malchance », qu'une autre option aurait battu une bonne décision. C'est le
 * sens du guide de débrief ; un réflexe qui perd n'est jamais « Chance ».
 */
function partie(ep: Episode, chemin: readonly number[], graine: number): PartieJouee {
  return {
    graine,
    chemin,
    consultes: ep.etapes.map(() => []),
    jours: ep.enquete.joursSansPerte,
    diagnostic: ep.diagnostics[0]!.id,
    reevaluation: { choix: "maintient", principal: null },
    prevision: 0,
    confiance: 50,
  };
}

const sous = (ep: Episode, chemin: readonly number[], d: number, k: number, graine: number) => {
  const autre = [...chemin];
  autre[d] = k;
  return ep.simuler(autre, graine, ep.enquete.joursSansPerte).objectif;
};

describe("la chance et la malchance du bilan", () => {
  let reflexes = 0;
  let chances = 0;
  for (const ep of EPISODES) {
    it(`${ep.numero} · ${ep.titre}`, () => {
      const g = hasardDuDebrief(ep.code);
      for (const [d, o] of TRACES[ep.code]!.reflexes) {
        const chemin = [...ep.references[0]!.chemin];
        chemin[d] = o;
        const x = analyser(ep, partie(ep, chemin, g)).decisions[d]!;
        if (x.bonne) continue;
        reflexes += 1;
        const fait = sous(ep, chemin, d, o, g);
        const meilleure = sous(ep, chemin, d, x.meilleur.option, g);
        expect(x.cas === "faible-fav", `D${d + 1} option ${o}`).toBe(fait >= meilleure - 1e-9);
        if (x.cas === "faible-fav") chances += 1;
      }
      // Sur le chemin de la méthode, une bonne décision est malchanceuse quand une autre option fait mieux.
      const methode = ep.references[0]!.chemin;
      for (const x of analyser(ep, partie(ep, methode, g)).decisions) {
        if (!x.bonne) continue;
        const fait = sous(ep, methode, x.d, methode[x.d]!, g);
        const mieux = Array.from({ length: x.n }, (_, k) => k)
          .filter((k) => k !== methode[x.d])
          .some((k) => sous(ep, methode, x.d, k, g) > fait + 1e-9);
        expect(x.cas, `D${x.d + 1}`).toBe(mieux ? "bonne-defav" : "bonne-fav");
      }
    });
  }

  it("ne dit « Chance » que pour un réflexe sur vingt au plus, sous le hasard du débrief", () => {
    expect(reflexes).toBeGreaterThan(300);
    expect(chances * 20).toBeLessThanOrEqual(reflexes);
  });
});
