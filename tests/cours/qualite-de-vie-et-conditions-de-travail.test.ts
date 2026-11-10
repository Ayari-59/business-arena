import { describe, expect, it } from "vitest";
import { QUALITE_DE_VIE_ET_CONDITIONS_DE_TRAVAIL as CH } from "../../src/config/cours/chapitres/qualite-de-vie-et-conditions-de-travail";
import { COUT_D_UNE_HEURE_SUPPLEMENTAIRE, COUT_HORAIRE_DE_LA_TABLE, heuresOuTempsPartiel, supprimerLeServiceCoupe } from "../../src/config/cours/monde/conditions-de-travail-de-la-table";
import { SMIC_HORAIRE_BRUT } from "../../src/config/cours/monde/ressources-humaines-de-nova";
import { SUPPRIMER_LE_SERVICE_COUPE } from "../../src/config/cours/situations/par-chapitre/supprimer-le-service-coupe";
import { THEMES_DES_RESSOURCES_HUMAINES, attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « QUALITÉ DE VIE ET CONDITIONS DE TRAVAIL » (ressources humaines et communication de terminale, 2.1, lot E
 * STMG), ET SON CAS, CHEZ LA TABLE D'AUGUSTIN.
 *
 * Refait à la main : 7 200 ÷ (3 × 151,67) = 15,82 € l'heure ; majorée de 25 %, 19,78 €. La semaine de
 * Sarah : 39 − 35 = 4 heures supplémentaires, 35 + 4 × 1,25 = 40 heures payées, 632,80 €. Un temps partiel
 * de 24 heures coûte 379,68 € ; 19 heures supplémentaires 375,82 €, 20 heures 395,60 €. Fin à 23 h 30, plus
 * 11 heures : reprise à 10 h 30. Le cas : 22 × 19,78 × 52 = 22 628,32 €, 24 × 15,82 × 52 = 19 743,36 €,
 * 2 884,96 € d'écart.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 2 de ressources humaines, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DES_RESSOURCES_HUMAINES[1]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("motivation, temps de travail et heures supplémentaires", () => {
  it("l'heure du bistrot : 15,82 €, et 19,78 € en heure supplémentaire", () => {
    expect([COUT_HORAIRE_DE_LA_TABLE, COUT_D_UNE_HEURE_SUPPLEMENTAIRE]).toEqual([15.82, 19.78]);
    // Une heure chargée du bistrot reste au-dessus du SMIC horaire brut du cours.
    expect(COUT_HORAIRE_DE_LA_TABLE).toBeGreaterThan(SMIC_HORAIRE_BRUT);
  });

  it("la semaine de Sarah : 4 heures supplémentaires, 40 heures payées, 632,80 €", () => {
    expect(attendusT(CH, "la-semaine-de-sarah")).toEqual([4, 40, 632.8]);
  });

  it("le curseur : dès 20 heures supplémentaires, le temps partiel coûte moins", () => {
    gardeDuCurseurT(CH, "le-curseur-du-temps-partiel", 20);
    expect([heuresOuTempsPartiel(19).supplementaires, heuresOuTempsPartiel(20).supplementaires, heuresOuTempsPartiel(20).tempsPartiel]).toEqual([375.82, 395.6, 379.68]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "hygiene-ou-motivation"))).toEqual(["hygiene", "hygiene", "motivation", "motivation"]);
    expect(Object.values(triT(CH, "les-leviers"))).toEqual(["ergonomie", "temps", "temps", "expression"]);
    expect(justeT(CH, "le-repos")).toEqual(["10 h 30"]);
    expect(justeT(CH, "la-journee-de-banquet")[0]).toMatch(/10 heures/);
  });
});

describe("le cas du chapitre", () => {
  it("22 628,32 € d'heures supplémentaires, 19 743,36 € de temps partiel", () => {
    gardeDuCasT(SUPPRIMER_LE_SERVICE_COUPE, CH);
    expect(supprimerLeServiceCoupe()).toMatchObject({ supplementaires: 22_628.32, tempsPartiel: 19_743.36, ecart: 2_884.96 });
  });
});
