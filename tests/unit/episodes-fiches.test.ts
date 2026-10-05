import { describe, expect, it } from "vitest";
import { FICHES, HASARD_DE_LA_CLASSE, lienDeLaClasse } from "../../src/config/episodes/fiches";
import { formationParCode } from "../../src/config/formations";
import { TRACES } from "../../src/config/episodes/traces";
import { episodeParCode } from "../../src/pedagogy/episodes/registre";

/**
 * Une fiche enseignant donne un corrigé et commente des réflexes : elle doit
 * dire la même chose que l'épisode, sans quoi l'enseignant corrigerait au
 * tableau un chiffre que le bilan contredit.
 */
describe("les fiches enseignant", () => {
  it("couvrent les épisodes 31 à 48, une fois chacun, dans l'ordre", () => {
    expect(FICHES.map((f) => episodeParCode(f.code)?.numero)).toEqual(
      Array.from({ length: 18 }, (_, i) => 31 + i),
    );
  });

  it("donnent à la classe le lien du hasard commun", () => {
    expect(lienDeLaClasse("atelier-sature")).toBe(
      `/entreprises/episode/atelier-sature?hasard=${HASARD_DE_LA_CLASSE}`,
    );
  });

  for (const fiche of FICHES) {
    const ep = episodeParCode(fiche.code)!;
    describe(ep.titre, () => {
      it("vise des formations qui existent, avec un programme nommé", () => {
        expect(fiche.formations.length).toBeGreaterThan(0);
        for (const c of fiche.formations) expect(formationParCode(c), c).toBeDefined();
        expect(fiche.programme.length).toBeGreaterThan(0);
        expect(fiche.programme.length).toBeLessThanOrEqual(3);
      });

      it("tient sa séance dans la durée annoncée", () => {
        expect(fiche.deroule.reduce((s, p) => s + p.minutes, 0)).toBe(fiche.dureeMinutes);
        expect(fiche.deroule.length).toBeGreaterThanOrEqual(5);
      });

      it("corrige le calcul de la semaine 1 avec le chiffre du modèle", () => {
        const t = ep.simuler(
          ep.references[0]!.chemin,
          HASARD_DE_LA_CLASSE,
          ep.enquete.joursSansPerte,
        );
        const juste = TRACES[ep.code]!.prevision.juste;
        expect(Math.abs(fiche.calcul.reponse - ep.prevision.reel(t))).toBeLessThan(juste);
        expect(fiche.calcul.etapes.length).toBeGreaterThanOrEqual(3);
        // Une erreur fréquente est une erreur : elle ne tombe pas dans la marge du « juste ».
        for (const e of fiche.calcul.erreurs) {
          expect(Math.abs(e.valeur - fiche.calcul.reponse), e.cause).toBeGreaterThan(juste);
        }
      });

      it("commente chaque réflexe de l'épisode, et aucun autre", () => {
        expect(fiche.reflexes.map((r) => [r.decision, r.option])).toEqual(
          TRACES[ep.code]!.reflexes.map(([d, o]) => [d, o]),
        );
      });

      it("pose ses questions et ses critères sans noter le résultat", () => {
        expect(fiche.debrief.length).toBeGreaterThanOrEqual(5);
        expect(fiche.debrief.length).toBeLessThanOrEqual(7);
        expect(fiche.evaluation.length).toBeGreaterThanOrEqual(3);
        expect(fiche.evaluation.length).toBeLessThanOrEqual(5);
        expect(fiche.objectifs.length).toBeGreaterThanOrEqual(3);
      });
    });
  }
});
