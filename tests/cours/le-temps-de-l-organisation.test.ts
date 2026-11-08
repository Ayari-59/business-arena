import { describe, expect, it } from "vitest";
import { LE_TEMPS_DE_L_ORGANISATION as CH } from "../../src/config/cours/chapitres/le-temps-de-l-organisation";
import { COUT_D_UN_MOIS_DE_SAISONNIER, MOIS_POUR_UN_SAISONNIER, SEMAINES_AVANT_LA_SAISON, placementDeLEte, saisonsDeLEscale } from "../../src/config/cours/monde/temps-de-l-escale";
import { BLOQUER_L_ARGENT_DE_L_ETE, bloquerLArgentDeLEte } from "../../src/config/cours/situations/par-chapitre/bloquer-l-argent-de-l-ete";
import { attendusSgn, gardeDuCasSgn, gardeDuCurseurSgn, gardeDuProgrammeSgn, gardesDeTexteSgn, justeSgn, triSgn } from "./gardes-de-la-sgn";

/**
 * « LE TEMPS DE L'ORGANISATION » (SGN T4.1), ET SON CAS, CHEZ L'ESCALE.
 *
 * Refait à la main : l'hiver, 3 400 nuitées sur 5 400 offertes (63 %) ; l'été, 6 400 demandées, 5 400
 * vendues (100 %), 1 000 refusées ; le résultat de l'été, 5 400 × (88 − 21) − 210 000 = 151 800 €. Placé à
 * 2,6 % l'an : 151 800 × 2,6 % × 6 ÷ 12 = 1 973,40 € en 6 mois ; 328,90 € par mois, et un mois de
 * saisonnier à 8 600 ÷ 3 = 2 866,67 € : 9 mois (2 960,10 €), pas 8 (2 631,20 €). Le calendrier : 3 + 2 + 1
 * + 1 = 7 semaines. Le cas : au compte à terme à 2,8 %, 2 125,20 € ; 151,80 € de plus.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 4 de la SGN, se joue chez L'ESCALE", () => {
    gardeDuProgrammeSgn(CH, "STMG Thème 4 · Temps et risque");
    expect(CH.entreprises?.codes).toEqual(["hotel"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteSgn(CH);
  });
});

describe("les saisons, le planning, la valeur du temps", () => {
  it("l'hiver à 63 %, l'été plein, 1 000 nuitées refusées, 151 800 € de résultat d'été", () => {
    expect(saisonsDeLEscale()[2]!.resultat).toBe(151_800);
    expect(attendusSgn(CH, "les-saisons")).toEqual([63, 100, 1_000]);
  });

  it("le calendrier : 7 semaines avant le 1er juillet", () => {
    expect(SEMAINES_AVANT_LA_SAISON).toBe(7);
    expect(attendusSgn(CH, "le-calendrier")).toEqual([7]);
  });

  it("les intérêts de 6 mois : 1 973,40 €", () => {
    expect(attendusSgn(CH, "les-interets")).toEqual([1_973.4, 153_773.4]);
  });

  it("le curseur : 9 mois", () => {
    expect(COUT_D_UN_MOIS_DE_SAISONNIER).toBe(2_866.67);
    expect(MOIS_POUR_UN_SAISONNIER).toBe(9);
    gardeDuCurseurSgn(CH, "le-placement-qui-paie", 9);
    expect([placementDeLEte(8).interets, placementDeLEte(9).interets]).toEqual([2_631.2, 2_960.1]);
  });

  it("l'horizon, les contraintes et l'asymétrie", () => {
    expect(triSgn(CH, "l-horizon")["Construire une aile de 20 chambres"]).toBe("long");
    expect(triSgn(CH, "les-contraintes")["Les dates des vacances scolaires, fixées par l'État"]).toBe("institutionnelle");
    expect(justeSgn(CH, "l-asymetrie")[0]).toMatch(/^Une asymétrie/);
  });
});

describe("le cas du chapitre", () => {
  it("le compte à terme rapporte 151,80 € de plus sur 6 mois", () => {
    gardeDuCasSgn(BLOQUER_L_ARGENT_DE_L_ETE, CH);
    const k = bloquerLArgentDeLEte();
    expect([k.fonds, k.terme, k.ecart]).toEqual([1_973.4, 2_125.2, 151.8]);
  });
});
