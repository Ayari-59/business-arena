import { describe, expect, it } from "vitest";
import { ASSEZ_VENDRE_POUR_NE_RIEN_PERDRE as CH, seuilDeJanvier } from "../../src/config/cours/chapitres/assez-vendre-pour-ne-rien-perdre";
import { LE_LOYER_AUGMENTE, leLoyerAugmente } from "../../src/config/cours/situations/par-chapitre/le-loyer-augmente";
import { attendusSgn, gardeDuCasSgn, gardeDuCurseurSgn, gardeDuProgrammeSgn, gardesDeTexteSgn, justeSgn, triSgn } from "./gardes-de-la-sgn";

/**
 * « ASSEZ VENDRE POUR NE RIEN PERDRE » (SGN T4.1, la version lycée du seuil), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main sur janvier : 1 590 × 59 = 93 810 € ; 22 + 16 = 38 € par enceinte, 21 € de marge,
 * 33 390 € sur le mois ; 19 700 + 10 650 + 833 = 31 183 € de charges fixes : 2 207 € de résultat.
 * 21 ÷ 59 = 35,59 % ; 31 183 ÷ 21 = 1 484,9 : 1 485 enceintes ; 31 183 × 59 ÷ 21 = 87 609,38 € ;
 * 93 810 − 87 609,95 = 6 200,62 € (6,6 %) ; 87 609,38 ÷ 93 810 × 31 = 28,95 : le 29 janvier.
 * Le cas : 32 483 ÷ 21 = 1 546,8 : 1 547 ; 32 483 × 59 ÷ 21 = 91 261,76 €, × 31 ÷ 93 810 = 30,16 : le 31.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 4 de la SGN, se joue chez NOVA", () => {
    gardeDuProgrammeSgn(CH, "STMG Thème 4 · Temps et risque");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteSgn(CH);
  });
});

describe("le seuil de janvier", () => {
  it("la marge et le résultat", () => {
    expect(attendusSgn(CH, "la-marge")).toEqual([21, 33_390, 2_207]);
    expect(triSgn(CH, "variables-ou-fixes")["Loyer du local"]).toBe("fixe");
  });

  it("le seuil : 35,59 %, 1 485 enceintes, 87 617,31 € (sur le taux à deux décimales)", () => {
    expect(attendusSgn(CH, "le-seuil")).toEqual([35.59, 1_485, 87_617.31]);
  });

  it("le curseur : 1 485 enceintes", () => {
    gardeDuCurseurSgn(CH, "le-curseur-du-seuil", 1_485);
  });

  it("le point mort le 29 janvier, 6 192,69 € de marge de sécurité", () => {
    expect(attendusSgn(CH, "point-mort-et-securite")).toEqual([6_192.69, 6.6, 29]);
    expect(seuilDeJanvier().jours).toBe(31);
    expect(justeSgn(CH, "lire-le-seuil")[0]).toMatch(/sous le seuil/);
  });
});

describe("le cas du chapitre", () => {
  it("le loyer à 21 000 € : 1 547 enceintes, le point mort le 31", () => {
    gardeDuCasSgn(LE_LOYER_AUGMENTE, CH);
    const { apres } = leLoyerAugmente();
    expect([apres.chargesFixes, apres.seuilQuantite, apres.pointMort, apres.resultat]).toEqual([32_483, 1_547, 31, 907]);
  });
});
