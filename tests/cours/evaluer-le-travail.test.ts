import { describe, expect, it } from "vitest";
import { EVALUER_LE_TRAVAIL as CH } from "../../src/config/cours/chapitres/evaluer-le-travail";
import { noteGlobale, tauxDesDesserts } from "../../src/config/cours/monde/evaluation-a-la-table";
import { UNE_PRIME_SUR_LES_DESSERTS } from "../../src/config/cours/situations/par-chapitre/une-prime-sur-les-desserts";
import { THEMES_DES_RESSOURCES_HUMAINES, attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « ÉVALUER LE TRAVAIL » (ressources humaines et communication de terminale, 1.2, lot E STMG), ET SON CAS,
 * CHEZ LA TABLE D'AUGUSTIN.
 *
 * Refait à la main : Sarah, 16 × 0,3 + 14 × 0,3 = 9 points, 10 × 0,2 + 15 × 0,2 = 5 points, 14 sur 20.
 * Hugo, 15 × 0,3 + 12 × 0,3 + 16 × 0,2 = 11,3 points ; il lui faut 0,2 × e ≥ 2,7, soit e = 14 (à 13 :
 * 13,9). Le cas : 180 ÷ 1 200 = 15 %, 420 ÷ 1 400 = 30 %.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 1 de ressources humaines, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DES_RESSOURCES_HUMAINES[0]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("la grille, les entretiens et le bilan", () => {
  it("la note de Sarah : 9, 5 et 14 sur 20", () => {
    expect(attendusT(CH, "la-note-de-sarah")).toEqual([9, 5, 14]);
  });

  it("le curseur : Hugo atteint 14 avec 14 en entraide, pas avec 13", () => {
    gardeDuCurseurT(CH, "le-curseur-de-l-entraide", 14);
    expect([noteGlobale([15, 12, 16, 13]), noteGlobale([15, 12, 16, 14])]).toEqual([13.9, 14.1]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "ce-qui-s-evalue"))).toEqual(["chiffre", "chiffre", "observe", "echappe"]);
    expect(Object.values(triT(CH, "qui-evalue"))).toEqual(["superieur", "auto", "360"]);
    expect(Object.values(triT(CH, "quel-entretien"))).toEqual(["evaluation", "evaluation", "parcours", "parcours"]);
    expect(justeT(CH, "un-biais")).toEqual(["L'effet de récence"]);
    expect(justeT(CH, "le-bilan-de-competences")[0]).toMatch(/accord de Hugo/);
  });
});

describe("le cas du chapitre", () => {
  it("15 % pour Hugo au déjeuner, 30 % pour Sarah au dîner", () => {
    gardeDuCasT(UNE_PRIME_SUR_LES_DESSERTS, CH);
    expect(tauxDesDesserts()).toEqual({ hugo: 15, sarah: 30, seuil: 25 });
  });
});
