import { describe, expect, it } from "vitest";
import { ORGANISER_LE_TRAVAIL_ET_COORDONNER as CH } from "../../src/config/cours/chapitres/organiser-le-travail-et-coordonner";
import { delegation, polyvalence } from "../../src/config/cours/monde/organisation-du-travail-de-nova";
import { DELEGUER_LES_COMMANDES_URGENTES } from "../../src/config/cours/situations/par-chapitre/deleguer-les-commandes-urgentes";
import { attendusT, gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « ORGANISER LE TRAVAIL ET COORDONNER » (enseignement commun de terminale, 1.5, lot C STMG), ET SON CAS.
 *
 * Refait à la main : 30 × 4 = 120 enceintes, × 21 = 2 520 € par jour sans opérateur. La polyvalence :
 * 12 × 2 520 − 6 000 = 24 240 € ; 20 × 2 520 − 12 000 = 38 400 € ; 24 × 2 520 − 18 000 = 42 480 € ;
 * 24 × 2 520 − 24 000 = 36 480 €. Le cas : 30 ÷ 3 ÷ 2 = 5 commandes, × 40 × 21 = 4 200 €, − 150 × 12 =
 * 2 400 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 1 de la partie commune, se joue chez NOVA", () => {
    gardeDuProgrammeT(CH, "STMG Thème 1 · Les organisations et l'activité de production de biens et de services");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("la polyvalence et la coordination", () => {
  it("un jour sans opérateur : 120 enceintes, 2 520 €", () => {
    expect(attendusT(CH, "un-jour-sans-operateur")).toEqual([120, 2_520]);
  });

  it("le laboratoire : former 3 opérateurs", () => {
    const e = gardeDuLaboratoireT(CH, "le-laboratoire-de-la-polyvalence");
    expect(e.defi(null as never).solution).toEqual({ polyvalents: 3 });
    expect([1, 2, 3, 4].map((k) => polyvalence(k).gain)).toEqual([24_240, 38_400, 42_480, 36_480]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-modes-de-coordination"))).toEqual(["ajustement", "supervision", "standardisation", "standardisation", "automatisation"]);
    expect(Object.values(triT(CH, "taylorisme-ou-toyotisme"))).toEqual(["taylorisme", "taylorisme", "toyotisme", "toyotisme"]);
    expect(justeT(CH, "le-lean")[0]).toMatch(/gaspillages/);
  });
});

describe("le cas du chapitre", () => {
  it("déléguer : 5 commandes sauvées, 4 200 € de marge, 2 400 € de gain", () => {
    gardeDuCasT(DELEGUER_LES_COMMANDES_URGENTES, CH);
    expect(delegation()).toMatchObject({ perdues: 5, margePerdue: 4_200, primeDeLAnnee: 1_800, gain: 2_400 });
  });
});
