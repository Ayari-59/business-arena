import { describe, expect, it } from "vitest";
import { VERSIONS_DES_MODELES } from "../../src/config/episodes/versions";
import { GRAINES_DU_BILAN, moyenne } from "../../src/engine/episodes/commun";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/**
 * Corriger un moteur change ce que valaient les choix des parties déjà
 * gardées. Ce test échoue dès qu'un moteur change : il faut alors relever la
 * version du modèle de l'épisode, et recopier la nouvelle empreinte.
 */
describe("les versions des modèles d'épisodes", () => {
  it("couvrent les trente épisodes du registre", () => {
    expect(Object.keys(VERSIONS_DES_MODELES).sort()).toEqual(EPISODES.map((e) => e.code).sort());
  });

  it("ont une empreinte à jour : un moteur modifié oblige à relever sa version", () => {
    for (const ep of EPISODES) {
      const empreinte = ep.references.map((r) =>
        Math.round(
          moyenne(
            GRAINES_DU_BILAN.map(
              (g) => ep.simuler(r.chemin, g, ep.enquete.joursSansPerte).objectif,
            ),
          ),
        ),
      );
      expect(empreinte, `${ep.code} : relever la version et recopier l'empreinte`).toEqual(
        VERSIONS_DES_MODELES[ep.code]!.empreinte,
      );
    }
  });
});
