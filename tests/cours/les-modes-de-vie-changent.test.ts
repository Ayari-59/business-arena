import { describe, expect, it } from "vitest";
import { LES_MODES_DE_VIE_CHANGENT as CH } from "../../src/config/cours/chapitres/les-modes-de-vie-changent";
import { parcEnLocation } from "../../src/config/cours/monde/modes-de-vie";
import { UN_PARC_DE_STUDIO_EN_LOCATION } from "../../src/config/cours/situations/par-chapitre/un-parc-de-studio-en-location";
import { attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « LES MODES DE VIE CHANGENT » (enseignement commun de terminale, 3.2, lot C STMG), ET SON CAS.
 *
 * Refait à la main : 2 × 2 × 46 = 184 jours, × 50 = 9 200 km. La Studio : 129 − 70 = 59 € par vente ;
 * 15 × 0,8 − 2,50 = 9,50 € par location ; 129 ÷ 9,50 = 13,6 : 14 locations. Le cas : 6 × 3 = 18 locations,
 * 18 × 9,50 − 70 = 101 € par Studio, 2 020 € pour 20, contre 20 × 59 = 1 180 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 3 de la partie commune, se joue chez NOVA", () => {
    gardeDuProgrammeT(CH, "STMG Thème 3 · Les organisations et la société");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("le travail et la consommation", () => {
  it("le télétravail : 184 jours, 9 200 km", () => {
    expect(attendusT(CH, "le-teletravail")).toEqual([184, 9_200]);
  });

  it("le curseur : 14 locations font mieux que la vente", () => {
    gardeDuCurseurT(CH, "le-curseur-de-la-location", 14);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "le-rapport-au-travail"))).toEqual(["temps", "lieu", "lieu", "organisation"]);
    expect(Object.values(triT(CH, "les-modes-de-consommation"))).toEqual(["fonctionnalite", "fonctionnalite", "collaborative", "collaborative", "responsable"]);
    expect(justeT(CH, "la-deconnexion")[0]).toMatch(/déconnexion/);
  });
});

describe("le cas du chapitre", () => {
  it("le parc : 2 020 € en location contre 1 180 € à la vente", () => {
    gardeDuCasT(UN_PARC_DE_STUDIO_EN_LOCATION, CH);
    expect(parcEnLocation()).toMatchObject({ locations: 18, parStudio: 101, location: 2_020, vente: 1_180 });
  });
});
