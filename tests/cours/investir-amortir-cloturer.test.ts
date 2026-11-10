import { describe, expect, it } from "vitest";
import { INVESTIR_AMORTIR_CLOTURER as CH } from "../../src/config/cours/chapitres/investir-amortir-cloturer";
import { dureeDeLAssocie } from "../../src/config/cours/monde/investir-et-cloturer";
import { AMORTIR_SUR_8_ANS } from "../../src/config/cours/situations/par-chapitre/amortir-sur-8-ans";
import { attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « INVESTIR, AMORTIR, CLÔTURER » (gestion et finance de terminale, 1.3 et 1.4, la version lycée ; lot C
 * STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 4 × 15 000 = 60 000 € ; 12 000 € de TVA ; 72 000 € réglés. 60 000 ÷ 6 = 10 000 € ;
 * du 6 janvier au 31 décembre, 355 jours : 10 000 × 355 ÷ 360 = 9 861,11 € ; 50 138,89 € fin N,
 * 40 138,89 € fin N + 1. Sonora : 33 630 ÷ 1,2 = 28 025 €, × 40 % = 11 210 €. Le poste : 2 500 × 355 ÷ 360
 * = 2 465,28 €, + 2 × 2 500 = 7 465,28 € ; 15 000 − 7 465,28 = 7 534,72 € ; prix plancher 7 535 € ; à
 * 6 000 €, − 1 534,72 €. Le cas : 7 500 × 355 ÷ 360 = 7 395,83 € ; 9 861,11 − 7 395,83 = 2 465,28 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 1 de gestion et finance, au parcours de gestion et finance", () => {
    gardeDuProgrammeT(CH, "STMG Thème 1 · Appliquer les règles comptables");
    expect(CH.parcours).toBe("stmg-gf");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("investir, amortir, clôturer", () => {
  it("le coût d'acquisition et le plan", () => {
    expect(attendusT(CH, "le-cout-d-acquisition")).toEqual([60_000, 12_000, 72_000]);
    expect(attendusT(CH, "le-plan")).toEqual([10_000, 9_861.11, 50_138.89, 40_138.89]);
  });

  it("la créance de Sonora : 28 025 € hors taxes, 11 210 € de dépréciation", () => {
    expect(attendusT(CH, "la-creance-douteuse")).toEqual([28_025, 11_210]);
  });

  it("la cession : 7 535 € sans moins-value ; à 6 000 €, − 1 534,72 €", () => {
    gardeDuCurseurT(CH, "le-prix-plancher", 7_535);
    expect(attendusT(CH, "le-resultat-de-cession")).toEqual([7_534.72, -1_534.72]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "actif-ou-charge"))).toEqual(["actif", "actif", "charge", "charge", "charge"]);
    expect(Object.values(triT(CH, "les-principes"))).toEqual(["prudence", "independance", "continuite", "permanence"]);
    expect(justeT(CH, "le-stock-final")[0]).toMatch(/bilan/);
  });
});

describe("le cas du chapitre", () => {
  it("sur 8 ans, la dotation de N tombe à 7 395,83 €, le résultat gagnerait 2 465,28 €", () => {
    gardeDuCasT(AMORTIR_SUR_8_ANS, CH);
    expect(dureeDeLAssocie()).toMatchObject({ six: 9_861.11, huit: 7_395.83, effet: 2_465.28 });
    expect(justeT(AMORTIR_SUR_8_ANS, "reponse")[0]).toMatch(/^Non/);
  });
});
