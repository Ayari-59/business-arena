import { describe, expect, it } from "vitest";
import { EPISODES, episodeParCode } from "../../src/pedagogy/episodes/registre";
import { GRAINES_DU_BILAN } from "../../src/engine/episodes/commun";

/**
 * Le registre des épisodes : chacun doit pouvoir être joué par l'interface
 * commune sans qu'elle le connaisse. Ces tests vérifient qu'une définition
 * est complète et cohérente avec elle-même.
 */
describe("le registre des épisodes", () => {
  it("numérote et nomme chaque épisode une seule fois", () => {
    expect(EPISODES.length).toBeGreaterThanOrEqual(2);
    expect(new Set(EPISODES.map((e) => e.code)).size).toBe(EPISODES.length);
    expect(EPISODES.map((e) => e.numero)).toEqual(EPISODES.map((_, i) => i + 1));
    for (const e of EPISODES) {
      expect(e.code).toMatch(/^[a-z0-9-]+$/);
      expect(episodeParCode(e.code)).toBe(e);
    }
    expect(episodeParCode("inconnu")).toBeUndefined();
  });

  for (const ep of EPISODES) {
    describe(ep.titre, () => {
      it("a six décisions sur treize semaines, dans l'ordre", () => {
        expect(ep.etapes).toHaveLength(6);
        expect(ep.neutre).toHaveLength(ep.etapes.length);
        expect(ep.etapes.at(-1)!.jusqua).toBe(13);
        for (let i = 1; i < ep.etapes.length; i += 1) {
          expect(ep.etapes[i]!.jusqua).toBeGreaterThan(ep.etapes[i - 1]!.jusqua);
        }
      });

      it("enquête, diagnostique et prévoit en première décision, réévalue en deuxième", () => {
        const [premiere, deuxieme] = ep.etapes;
        expect(premiere!.budget).toBeGreaterThan(0);
        expect(premiere!.diagnostic).toBe(true);
        expect(premiere!.prevision).toBe(true);
        expect(deuxieme!.reevaluation).toBe(true);
        expect(ep.diagnostics.length).toBeGreaterThanOrEqual(3);
      });

      it("donne une réaction à chaque option, et des choix valides aux références", () => {
        for (const e of ep.etapes) {
          expect(e.reactions).toHaveLength(e.options.length);
          if (e.sources.length) expect(e.sources.some((s) => s.nature === "decisive")).toBe(true);
        }
        expect(ep.references).toHaveLength(3);
        for (const r of ep.references) {
          r.chemin.forEach((o, d) => expect(o).toBeLessThan(ep.etapes[d]!.options.length));
        }
        ep.neutre.forEach((o, d) => expect(o).toBeLessThan(ep.etapes[d]!.options.length));
      });

      it("se simule sur treize semaines, et son tableau de bord lit chaque indicateur", () => {
        const t = ep.simuler(ep.neutre, GRAINES_DU_BILAN[0]!, 0);
        expect(t.semaines).toHaveLength(14);
        expect(Number.isFinite(t.objectif)).toBe(true);
        const l = ep.lire([], 1, 0, 4);
        for (const ind of ep.indicateurs) expect(l[ind.cle], ind.cle).not.toBeUndefined();
        expect(t.semaines[5]![ep.courbe.cle]).toBeTypeOf("number");
        expect(ep.bilan.tuiles(t)).toHaveLength(4);
        expect(ep.recap(t, 1, 4)).toHaveLength(3);
      });
    });
  }
});
