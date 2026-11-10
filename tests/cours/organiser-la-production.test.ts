import { describe, expect, it } from "vitest";
import { ORGANISER_LA_PRODUCTION as CH } from "../../src/config/cours/chapitres/organiser-la-production";
import { repriseDesEnceintes } from "../../src/config/cours/monde/organisation-de-la-production";
import { REPRENDRE_LES_ENCEINTES_USAGEES } from "../../src/config/cours/situations/par-chapitre/reprendre-les-enceintes-usagees";
import { attendusT, gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « ORGANISER LA PRODUCTION » (enseignement commun de terminale, 1.3, lot C STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 1 ÷ 0,25 = 4 enceintes par heure ; 150 × 3 × 4 = 1 800 par opérateur et par
 * trimestre ; 5 800 ÷ 7 000 = 82,9 %. Noël : 7 800 demandées pour 7 000 ; 800 de place libre au 3e
 * trimestre ; 800 d'avance : 800 × 21 − 800 × 1,50 = 15 600 €. Le cas : 2,10 − 1,20 = 0,90 € par
 * reprise ; 900 ÷ 0,90 = 1 000 reprises ; 2 400 × 0,90 − 900 = 1 260 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 1 de la partie commune, se joue chez NOVA", () => {
    gardeDuProgrammeT(CH, "STMG Thème 1 · Les organisations et l'activité de production de biens et de services");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("les modes, la productivité et les flux", () => {
  it("la productivité : 4 enceintes par heure, 1 800 par trimestre, 82,9 %", () => {
    expect(attendusT(CH, "la-productivite")).toEqual([4, 1_800, 82.9]);
  });

  it("le laboratoire : 800 enceintes d'avance servent tout Noël", () => {
    const e = gardeDuLaboratoireT(CH, "le-laboratoire-des-flux");
    expect(e.defi(null as never).solution).toEqual({ avance: 800 });
    expect(800 * 21 - 800 * 1.5).toBe(15_600);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-modes"))).toEqual(["unitaire", "serie", "continu", "continu"]);
    expect(Object.values(triT(CH, "controler-ou-ameliorer"))).toEqual(["controle", "controle", "amelioration", "amelioration"]);
    expect(justeT(CH, "tendus-ou-pousses")[0]).toMatch(/^Les flux tendus/);
  });
});

describe("le cas du chapitre", () => {
  it("la reprise : 0,90 € par enceinte, 1 000 reprises paient la campagne, 1 260 € de gain", () => {
    gardeDuCasT(REPRENDRE_LES_ENCEINTES_USAGEES, CH);
    expect(repriseDesEnceintes()).toMatchObject({ parEnceinte: 0.9, pourPayerLaCampagne: 1_000, gain: 1_260 });
  });
});
