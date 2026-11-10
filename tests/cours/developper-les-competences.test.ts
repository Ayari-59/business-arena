import { describe, expect, it } from "vitest";
import { DEVELOPPER_LES_COMPETENCES as CH } from "../../src/config/cours/chapitres/developper-les-competences";
import { compteApres, formationDuPoste, projetDeMehdi } from "../../src/config/cours/monde/competences-de-nova";
import { ABONDER_LE_COMPTE_DE_MEHDI } from "../../src/config/cours/situations/par-chapitre/abonder-le-compte-de-mehdi";
import { THEMES_DES_RESSOURCES_HUMAINES, attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « DÉVELOPPER LES COMPÉTENCES » (ressources humaines et communication de terminale, 1.3, lot E STMG), ET
 * SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 1 200 + 500 × 4 = 3 200 € (à 3 ans : 2 700 €). Le laboratoire : 2 × 900 + 2 × 300 =
 * 2 400 €, dans le budget ; 3 en présentiel coûteraient 3 000 €. Le cas : 3 200 − 1 200 = 2 000 €, soit
 * 4 ans de droits.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 1 de ressources humaines, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DES_RESSOURCES_HUMAINES[0]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("le plan, le CPF et l'employabilité", () => {
  it("le curseur : 4 ans pour payer la certification", () => {
    gardeDuCurseurT(CH, "le-curseur-du-compte", 4);
    expect([compteApres(3), compteApres(4), compteApres(10)]).toEqual([2_700, 3_200, 5_000]);
  });

  it("le laboratoire : 2 référents en présentiel, 2 en e-learning, 2 400 €", () => {
    const e = gardeDuLaboratoireT(CH, "le-laboratoire-de-la-formation");
    expect(e.defi(null as never).solution).toEqual({ presentiel: 2, eLearning: 2 });
    expect([formationDuPoste(2, 2).cout, formationDuPoste(3, 1).cout]).toEqual([2_400, 3_000]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "qui-decide"))).toEqual(["plan", "plan", "cpf", "transition"]);
    expect(Object.values(triT(CH, "les-mobilites"))).toEqual(["fonctionnelle", "verticale", "geographique"]);
    expect(justeT(CH, "la-formation-obligatoire")[0]).toMatch(/temps de travail/);
    expect(justeT(CH, "imposer-le-cpf")[0]).toMatch(/accord du salarié/);
    expect(justeT(CH, "l-employabilite")[0]).toMatch(/sans le garantir/);
  });
});

describe("le cas du chapitre", () => {
  it("il manque 2 000 €, soit 4 ans de droits", () => {
    gardeDuCasT(ABONDER_LE_COMPTE_DE_MEHDI, CH);
    expect(projetDeMehdi()).toMatchObject({ manque: 2_000, annees: 4 });
    expect(attendusT(ABONDER_LE_COMPTE_DE_MEHDI as never, "le-calcul")).toEqual([2_000, 4]);
  });
});
