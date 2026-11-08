import { describe, expect, it } from "vitest";
import { PREVOIR_SA_TRESORERIE as CH, grilleDuBudget } from "../../src/config/cours/chapitres/prevoir-sa-tresorerie";
import { COMMANDE_LA_PLUS_GROSSE, PAIE_DU_MOIS_DE_MAILLE, budgetDeMaille } from "../../src/config/cours/monde/tresorerie-de-maille";
import { ETALER_OU_DECOUVERT, etalerOuDecouvert } from "../../src/config/cours/situations/par-chapitre/etaler-ou-decouvert";
import { cellulesASaisir, cleDeCellule, corrigerLeTableau, incoherencesDuTableau, valeurASaisir } from "../../src/pedagogy/cours/tableau-a-completer";
import { gardeDuCasSgn, gardeDuCurseurSgn, gardeDuLaboratoireSgn, gardeDuProgrammeSgn, gardesDeTexteSgn, justeSgn, triSgn } from "./gardes-de-la-sgn";

/**
 * « PRÉVOIR SA TRÉSORERIE » (SGN T4.1, la démarche budgétaire), ET SON CAS, CHEZ MAILLE & CO.
 *
 * Refait à la main, hors taxes. Janvier : 38 825 + 38 425 = 77 250 € en caisse, 12 000 € des comités de
 * décembre ; 31 000 € au façonnier pour décembre, 13 600 + 1 500 + 920 = 16 020 € de charges, 10 100 ×
 * 1,42 = 14 342 € de paie, 4 875 € d'emballages : 8 000 + 89 250 − 66 237 = 31 013 €. Février : 61 800 +
 * 10 200 = 72 000 € ; 26 820 + 16 020 + 14 342 + 3 900 = 61 082 € : 41 931 €. Mars : 69 500 + 6 000 =
 * 75 500 € ; 78 000 + 16 020 + 14 342 + 4 300 + 12 000 = 124 662 € : −7 231 €. La plus grosse commande :
 * 78 000 − 7 231 = 70 769 €. En 3 fois : 4 000 € en mars, 769 €. Le cas : 7 231 × 9 % ÷ 12 = 54,23 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 4 de la SGN, se joue chez MAILLE & CO", () => {
    gardeDuProgrammeSgn(CH, "STMG Thème 4 · Temps et risque");
    expect(CH.entreprises?.codes).toEqual(["boutique"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteSgn(CH);
  });
});

describe("le budget du trimestre", () => {
  it("janvier, février, mars : 31 013 €, 41 931 €, −7 231 €", () => {
    expect(PAIE_DU_MOIS_DE_MAILLE).toBe(14_342);
    const b = budgetDeMaille();
    expect(b.janvier).toEqual({ caisse: 77_250, comites: 10_200, achats: 26_820, autresCouts: 4_875 });
    expect(b.mois.map((m) => [m.encaissements, m.decaissements, m.fin])).toEqual([
      [89_250, 66_237, 31_013],
      [72_000, 61_082, 41_931],
      [75_500, 124_662, -7_231],
    ]);
  });

  it("le tableau à compléter : cohérent, et juste quand on y écrit les valeurs justes", () => {
    const g = grilleDuBudget();
    expect(incoherencesDuTableau(g)).toEqual([]);
    const saisies = Object.fromEntries(cellulesASaisir(g).map((x) => [cleDeCellule(x.ligne, x.colonne), valeurASaisir(x.cellule.valeur!)]));
    expect(cellulesASaisir(g).length).toBe(11);
    expect(corrigerLeTableau(g, saisies).juste).toBe(true);
  });

  it("le curseur : 70 769 € de commande au plus", () => {
    expect(COMMANDE_LA_PLUS_GROSSE).toBe(70_769);
    gardeDuCurseurSgn(CH, "la-commande-de-printemps", 70_769);
  });

  it("le laboratoire : le rayonnage en 3 fois, sans report, seule solution", () => {
    gardeDuLaboratoireSgn(CH, "eviter-le-decouvert");
    expect(budgetDeMaille({ rayonnageEnFois: 3 }).mois[2]!.fin).toBe(769);
  });

  it("l'amortissement ne se décaisse pas ; la livraison de janvier se paie en février", () => {
    expect(triSgn(CH, "encaisser-ou-non")["L'usure du rayonnage, amortie sur 48 mois"]).toBe("aucun");
    expect(justeSgn(CH, "quand-payer")[0]).toMatch(/^En février/);
  });
});

describe("le cas du chapitre", () => {
  it("un mois de découvert : 54,23 € d'intérêts, moins que 200 € de frais", () => {
    gardeDuCasSgn(ETALER_OU_DECOUVERT, CH);
    const k = etalerOuDecouvert();
    expect([k.decouvert, k.interets, k.decouvertMoinsCher, k.economie]).toEqual([7_231, 54.23, true, 145.77]);
  });
});
