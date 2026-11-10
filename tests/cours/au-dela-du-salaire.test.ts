import { describe, expect, it } from "vitest";
import { AU_DELA_DU_SALAIRE as CH } from "../../src/config/cours/chapitres/au-dela-du-salaire";
import { interessement, placerSonInteressement, plafondDeLInteressement } from "../../src/config/cours/monde/epargne-salariale-de-nova";
import { PLACER_SON_INTERESSEMENT } from "../../src/config/cours/situations/par-chapitre/placer-son-interessement";
import { THEMES_DES_RESSOURCES_HUMAINES, attendusT, gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « AU-DELÀ DU SALAIRE » (ressources humaines et communication de terminale, 2.3, lot E STMG), ET SON CAS,
 * CHEZ NOVA.
 *
 * Refait à la main sur le premier exercice : B = 79 225,96 €, C = 150 000 € (le capital, sans le résultat),
 * S = 12 × 7 500 = 90 000 €, VA = 254 034 €. 5 % de C = 7 500 € ; B − 7 500 = 71 725,96 € ; ½ × 71 725,96
 * × 90 000 ÷ 254 034 = 12 705,65 €. Le plafond : 20 % × 90 000 = 18 000 €. À 15 % du résultat, 11 883,89 €
 * (moins que la participation) ; à 20 %, 15 845,19 € ; à 25 %, 19 806,49 € (au-dessus du plafond). Le cas :
 * 15 845,19 ÷ 4 = 3 961,30 €, 50 % d'abondement, 1 980,65 €, 5 941,95 € sur le plan.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 2 de ressources humaines, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DES_RESSOURCES_HUMAINES[1]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("primes, participation et intéressement", () => {
  it("la réserve de participation : 7 500 €, 71 725,96 €, 12 705,65 €", () => {
    expect(attendusT(CH, "la-participation")).toEqual([7_500, 71_725.96, 12_705.65]);
  });

  it("le laboratoire : 20 % du résultat, entre la participation et le plafond de 18 000 €", () => {
    const e = gardeDuLaboratoireT(CH, "le-laboratoire-de-l-interessement");
    expect(e.defi(null as never).solution).toEqual({ taux: 20 });
    expect(plafondDeLInteressement()).toBe(18_000);
    expect([15, 20, 25].map((t) => interessement(t).total)).toEqual([11_883.89, 15_845.19, 19_806.49]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-composantes"))).toEqual(["fixe", "individuel", "collectif", "avantage"]);
    expect(Object.values(triT(CH, "trois-dispositifs"))).toEqual(["participation", "participation", "interessement", "epargne"]);
    expect(Object.values(triT(CH, "placer"))).toEqual(["pee", "per", "verse"]);
    expect(justeT(CH, "individuelle-ou-collective")[0]).toMatch(/prime d'équipe/);
    expect(justeT(CH, "la-repartition")[0]).toMatch(/temps de présence/);
  });
});

describe("le cas du chapitre", () => {
  it("3 961,30 € d'intéressement, 1 980,65 € d'abondement, 5 941,95 € sur le plan", () => {
    gardeDuCasT(PLACER_SON_INTERESSEMENT, CH);
    expect(placerSonInteressement()).toEqual({ part: 3_961.3, taux: 50, abondement: 1_980.65, surLePlan: 5_941.95 });
  });
});
