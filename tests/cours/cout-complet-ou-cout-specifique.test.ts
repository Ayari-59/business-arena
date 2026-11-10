import { describe, expect, it } from "vitest";
import { COUT_COMPLET_OU_COUT_SPECIFIQUE as CH } from "../../src/config/cours/chapitres/cout-complet-ou-cout-specifique";
import { LA_GO_A_31_EUROS, laGoA31 } from "../../src/config/cours/situations/par-chapitre/la-go-a-31-euros";
import { attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « COÛT COMPLET OU COÛT SPÉCIFIQUE » (gestion et finance de terminale, 3.4, et partie commune, 1.3, cité
 * en second ; lot C STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main sur le mois en gamme : la One, 1 160 × 59 = 68 440 € ; 1 160 × 38 = 44 080 € de coûts
 * variables ; 1 233 € de publicité ; les charges communes (19 700 + 10 650 + 1 562 + 1 666 = 33 578 €)
 * aux heures-machine, 348 h sur 491,6 h : 23 769,62 € ; coût complet 69 082,62 €, résultat − 642,62 €.
 * Marge sur coût variable 24 360 €, sur coûts spécifiques 23 127 € ; le mois, 4 511 €, passerait à
 * − 18 616 € sans la One. La commande : 300 × 38 + 450 = 11 850 €, 39,50 € l'enceinte, plancher 40 € ;
 * à 42 €, 12 600 − 11 850 = 750 €. Le cas : la Go à 31 €, 6 045 − (3 705 + 373 + 2 397,45) = − 430,45 € ;
 * 6 045 − 3 705 − 373 = 1 967 € ; 4 511 − 585 − 1 967 = 1 959 €, le mois sans la Go à − 8 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite d'abord le thème 3 de gestion et finance, puis le thème 1 de la partie commune", () => {
    gardeDuProgrammeT(CH, "STMG Thème 3 · Accompagner la prise de décision", ["STMG Thème 1 · Les organisations et l'activité de production de biens et de services"]);
    expect(CH.parcours).toBe("stmg-gf");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("les trois méthodes", () => {
  it("le coût complet de la One : 69 082,62 €, − 642,62 €", () => {
    expect(attendusT(CH, "le-cout-complet-de-la-one")).toEqual([69_082.62, -642.62]);
  });

  it("les marges de la One, et le mois sans elle", () => {
    expect(attendusT(CH, "les-marges")).toEqual([24_360, 23_127]);
    expect(attendusT(CH, "sans-la-one")).toEqual([4_511 - 23_127]);
  });

  it("le prix plancher de la commande : 40 € ; à 42 €, 750 € de gain", () => {
    gardeDuCurseurT(CH, "le-prix-plancher", 40);
    expect(attendusT(CH, "accepter-la-commande")).toEqual([12_600, 11_850, 750]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-charges"))).toEqual(["directe-variable", "directe-fixe", "commune", "commune"]);
    expect(Object.values(triT(CH, "quelle-methode"))).toEqual(["complet", "specifique", "marginal"]);
    expect(justeT(CH, "arreter-la-one")[0]).toMatch(/^Pas sûr/);
  });
});

describe("le cas du chapitre", () => {
  it("la Go à 31 € perd en coût complet, mais couvre 1 967 € de charges communes", () => {
    gardeDuCasT(LA_GO_A_31_EUROS, CH);
    const { go, sans } = laGoA31();
    expect([go.resultat, go.margeSpecifique]).toEqual([-430.45, 1_967]);
    expect(sans).toBeLessThan(laGoA31().gamme.resultat);
    expect(justeT(LA_GO_A_31_EUROS, "reponse")[0]).toMatch(/^La garder/);
  });
});
