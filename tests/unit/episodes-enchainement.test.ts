import { describe, expect, it } from "vitest";
import { TRACES } from "../../src/config/episodes/traces";
import type { Episode, PartieJouee } from "../../src/config/episodes/types";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODES } from "../../src/pedagogy/episodes/registre";
import { observer } from "../../src/pedagogy/profil/observations";

/**
 * Un joueur qui cède à tous les réflexes est corrigé, même quand chaque
 * réflexe, dans la situation que le précédent a créée, devient raisonnable.
 */
function partie(ep: Episode, chemin: readonly number[]): PartieJouee {
  return {
    graine: 1,
    chemin,
    consultes: ep.etapes.map(() => []),
    jours: ep.enquete.joursSansPerte,
    diagnostic: ep.diagnostics[0]!.id,
    reevaluation: { choix: "maintient", principal: null },
    prevision: 0,
    confiance: 50,
  };
}

/** Le premier réflexe de chaque décision qui en offre un ; la méthode ailleurs. */
function cheminDesReflexes(ep: Episode) {
  const chemin = [...ep.references[0]!.chemin];
  const prises = new Set<number>();
  for (const [d, o] of TRACES[ep.code]!.reflexes) {
    if (prises.has(d)) continue;
    chemin[d] = o;
    prises.add(d);
  }
  return { chemin, prises };
}

describe("l'enchaînement des réflexes", () => {
  for (const ep of EPISODES) {
    it(`${ep.numero} · ${ep.titre}`, () => {
      expect(analyser(ep, partie(ep, ep.references[0]!.chemin)).enchainement).toBeNull();

      const { chemin, prises } = cheminDesReflexes(ep);
      const a = analyser(ep, partie(ep, chemin));
      const bonnes = a.decisions.filter((x) => prises.has(x.d) && x.bonne).length;
      // Corrigé : le bilan juge faible la majorité des réflexes, ou montre l'enchaînement.
      expect(bonnes * 2 < prises.size || a.enchainement !== null, "corrigé").toBe(true);
      if (a.enchainement) {
        const [premiere] = a.enchainement.reprises;
        // Reprendre la méthode dès le premier écart, c'est jouer la méthode.
        expect(premiere!.gain).toBeCloseTo(a.enchainement.ecart, 6);
      }

      // Le profil relève chaque réflexe pris : ils se justifient les uns les autres.
      const reflexes = observer(ep, partie(ep, chemin)).observations.filter(
        (o) => o.source === "reflexe",
      );
      expect(reflexes.map((o) => o.valeur)).toEqual([...prises].map(() => 0));
    }, 30_000);
  }

  it("se montre dans les épisodes où les réflexes s'appellent les uns les autres", () => {
    const montres = EPISODES.filter(
      (ep) => analyser(ep, partie(ep, cheminDesReflexes(ep).chemin)).enchainement !== null,
    ).map((ep) => ep.code);
    // Par leur code : un numéro suit la place sur la page et peut changer.
    for (const code of [
      "reorganisation-qui-coince",
      "prix-qui-ne-passe-plus",
      "faire-ou-faire-faire",
      "marche-qui-s-ouvre",
    ])
      expect(montres).toContain(code);
  }, 30_000);
});
