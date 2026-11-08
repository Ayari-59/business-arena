import { describe, expect, it } from "vitest";
import { LES_FORMES_DE_LA_VALEUR as CH } from "../../src/config/cours/chapitres/les-formes-de-la-valeur";
import { coutCompletDUneNuitee, prixPlancher, valeurDeLEscale } from "../../src/config/cours/monde/valeur-de-l-escale";
import { LE_COMPTOIR_BAISSE_SON_PRIX, leComptoirBaisse } from "../../src/config/cours/situations/par-chapitre/le-comptoir-baisse-son-prix";
import { attendusSgn, gardeDuCasSgn, gardeDuCurseurSgn, gardeDuProgrammeSgn, gardesDeTexteSgn, justeSgn } from "./gardes-de-la-sgn";

/**
 * « LES FORMES DE LA VALEUR » (SGN T3.1), ET SON CAS, CHEZ L'ESCALE.
 *
 * Refait à la main sur la fiche : la demande de l'année à 88 € est 3 400, 5 000, 6 400 et 3 900 nuitées ;
 * l'été est plafonné à 60 × 90 = 5 400 : 17 700 nuitées, 1 557 600 € ; 17 700 × 21 = 371 700 € de coût
 * variable, 4 × 210 000 € de charges fixes : 345 900 € de résultat. Le personnel : 14 × 8 600 × 4 =
 * 481 600 € (30,9 %) ; les associés : 22,2 %. Les avis : (900 + 560 + 120 + 48 + 16) ÷ 400 = 4,11 ;
 * 320 ÷ 400 = 80 %. L'hiver : 21 + 210 000 ÷ 3 400 = 82,76 € : 83 € au moins. À 72 € : 3 400 × 51 −
 * 210 000 = −36 600 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 3 de la SGN, se joue chez L'ESCALE", () => {
    gardeDuProgrammeSgn(CH, "STMG Thème 3 · Création de valeur et performance");
    expect(CH.entreprises?.codes).toEqual(["hotel"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteSgn(CH);
  });
});

describe("les formes de la valeur", () => {
  it("l'année : 17 700 nuitées, 1 557 600 €, 345 900 € ; 30,9 % aux salariés, 22,2 % aux associés", () => {
    const k = valeurDeLEscale();
    expect([k.vendues, k.chiffreDAffaires, k.resultat, k.personnel]).toEqual([17_700, 1_557_600, 345_900, 481_600]);
    expect(attendusSgn(CH, "le-partage")).toEqual([30.9, 22.2]);
  });

  it("les avis : 4,11 sur 5 et 80 % de satisfaits", () => {
    expect(attendusSgn(CH, "les-avis")).toEqual([4.11, 80]);
  });

  it("le curseur : 83 € au moins l'hiver", () => {
    expect(coutCompletDUneNuitee(1)).toEqual({ vendues: 3_400, coutComplet: 82.76 });
    expect(prixPlancher(1)).toBe(83);
    gardeDuCurseurSgn(CH, "le-prix-plancher", 83);
  });

  it("la valeur actionnariale : les dividendes et la valeur des parts", () => {
    expect(justeSgn(CH, "valeur-actionnariale")[0]).toMatch(/^Les dividendes/);
  });
});

describe("le cas du chapitre", () => {
  it("à 72 €, une nuitée d'hiver perd 10,76 € et l'hiver 36 600 €", () => {
    gardeDuCasSgn(LE_COMPTOIR_BAISSE_SON_PRIX, CH);
    const k = leComptoirBaisse();
    expect([k.coutComplet, k.ecartParNuitee, k.resultat]).toEqual([82.76, -10.76, 3_400 * 51 - 210_000]);
  });
});
