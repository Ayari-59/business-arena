import { describe, expect, it } from "vitest";
import { ETHIQUE_TRANSPARENCE_ET_EGALITE as CH } from "../../src/config/cours/chapitres/ethique-transparence-et-egalite";
import { don, plafondDuMecenat, salon } from "../../src/config/cours/monde/ethique-de-nova";
import { LE_STAND_GRATUIT_DU_SALON } from "../../src/config/cours/situations/par-chapitre/le-stand-gratuit-du-salon";
import { attendusT, gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « ÉTHIQUE, TRANSPARENCE ET ÉGALITÉ » (enseignement commun de terminale, 3.1, lot C STMG), ET SON CAS.
 *
 * Refait à la main : 2 210 − 2 050 = 160 €, 160 ÷ 2 210 = 7,2 %. Le mécénat : 5 ‰ de 1 390 276 € =
 * 6 951,38 €, sous 20 000 € : plafond 20 000 € ; 7 500 × 40 % = 3 000 € net, 8 000 × 40 % = 3 200 €. Le
 * cas : 60 × 59 = 3 540 €, + 2 400 = 5 940 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 3 de la partie commune, se joue chez NOVA", () => {
    gardeDuProgrammeT(CH, "STMG Thème 3 · Les organisations et la société");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("éthique, égalité et mécénat", () => {
  it("l'écart de rémunération : 160 €, 7,24 %", () => {
    expect(attendusT(CH, "l-ecart-de-remuneration")).toEqual([160, 7.24]);
  });

  it("le laboratoire : un don de 7 500 € coûte 3 000 € à NOVA", () => {
    const e = gardeDuLaboratoireT(CH, "le-laboratoire-du-mecenat");
    expect(e.defi(null as never).solution).toEqual({ don: 7_500 });
    expect(plafondDuMecenat()).toMatchObject({ part: 6_951.38, plafond: 20_000 });
    expect([don(7_500).coutNet, don(8_000).coutNet]).toEqual([3_000, 3_200]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "sincere-ou-non"))).toEqual(["sincere", "greenwashing", "socialwashing"]);
    expect(Object.values(triT(CH, "discrimination-ou-non"))).toEqual(["discrimination", "discrimination", "legitime", "legitime"]);
    expect(justeT(CH, "la-creance-de-sonora")[0]).toMatch(/^Non/);
    expect(justeT(CH, "un-cadeau")[0]).toMatch(/interdit/);
  });
});

describe("le cas du chapitre", () => {
  it("le stand rapporterait 5 940 € sur le papier ; la réponse est de refuser", () => {
    gardeDuCasT(LE_STAND_GRATUIT_DU_SALON, CH);
    expect(salon()).toMatchObject({ marge: 3_540, gain: 5_940 });
    expect(justeT(LE_STAND_GRATUIT_DU_SALON, "reponse")[0]).toMatch(/^Refuser/);
  });
});
