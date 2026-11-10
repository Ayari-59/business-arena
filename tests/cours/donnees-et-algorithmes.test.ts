import { describe, expect, it } from "vitest";
import { DONNEES_ET_ALGORITHMES as CH } from "../../src/config/cours/chapitres/donnees-et-algorithmes";
import { chiffrement } from "../../src/config/cours/monde/donnees-strategiques-de-maille";
import { CHIFFRER_LES_ORDINATEURS } from "../../src/config/cours/situations/par-chapitre/chiffrer-les-ordinateurs";
import { attendusT, gardeDuCasT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « DONNÉES ET ALGORITHMES » (enseignement commun de terminale, 3.3, lot C STMG), ET SON CAS, CHEZ
 * MAILLE & CO.
 *
 * Refait à la main : 60 × 30 + 1 800 = 3 600 € de perte, 20 × 12 = 240 € de sauvegarde, 15 fois. Le cas :
 * 3 × 6 × 12 = 216 €, ÷ 1 200 clientes = 0,18 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 3 de la partie commune, se joue chez MAILLE & CO", () => {
    gardeDuProgrammeT(CH, "STMG Thème 3 · Les organisations et la société");
    expect(CH.entreprises?.codes).toEqual(["boutique"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("données, algorithmes, chaîne de blocs", () => {
  it("la sauvegarde : 3 600 € de perte, 240 € par an, 15 fois", () => {
    expect(attendusT(CH, "la-sauvegarde")).toEqual([3_600, 240, 15]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "personnelle-ou-strategique"))).toEqual(["personnelle", "personnelle", "strategique", "strategique"]);
    expect(Object.values(triT(CH, "les-obligations"))).toEqual(["respecte", "respecte", "enfreint", "enfreint"]);
    expect(justeT(CH, "une-violation")[0]).toMatch(/72 heures/);
    expect(justeT(CH, "expliquer-l-algorithme")[0]).toMatch(/critères/);
    expect(justeT(CH, "ce-que-change-la-chaine")[0]).toMatch(/modifier/);
  });
});

describe("le cas du chapitre", () => {
  it("chiffrer : 216 € par an, 0,18 € par cliente", () => {
    gardeDuCasT(CHIFFRER_LES_ORDINATEURS, CH);
    expect(chiffrement()).toMatchObject({ parAn: 216, parCliente: 0.18 });
  });
});
