import { describe, expect, it } from "vitest";
import { AUTOMATISER_UN_TRAITEMENT as CH } from "../../src/config/cours/chapitres/automatiser-un-traitement";
import { TICKETS_DE_MME_LAURENT, bonAvecLArrondi, bonDes80Points, bonDuMois, calculALaMain } from "../../src/config/cours/monde/programme-de-fidelite-de-maille";
import { UN_BON_DES_80_POINTS } from "../../src/config/cours/situations/par-chapitre/un-bon-des-80-points";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { etape } from "./gardes-du-lycee";
import { THEMES_DU_SIG, attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « AUTOMATISER UN TRAITEMENT » (systèmes d'information de gestion de terminale, 3.2, lot F STMG), ET SON
 * CAS, CHEZ MAILLE & CO.
 *
 * Refait à la main : 45 + 89 + 32 = 166 points (45, 134, 166 tour par tour) ; avec la carte, 332, donc 3
 * bons, 15 € ; sans, 1 bon, 5 €. La boucle « tant que » : 332, 232, 132, 32, soit 3 tours et 32 points.
 * L'arrondi donnerait 2 bons (10 €) à 166 points. À la main : 300 × 2 × 30 ÷ 60 = 300 € par mois ; le
 * programme à 1 500 € est payé en 5 mois (4 : 1 200 €). Le cas : 1 + 0 + 2 = 3 bons (15 €), 2 + 1 + 3 =
 * 6 bons (30 €), 15 € d'écart.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 3 du SIG, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DU_SIG[2]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("le programme, déroulé et testé", () => {
  it("la boucle déroulée : 45, 134, 166 points, sans incohérence", () => {
    const g = etape(CH, "derouler-la-boucle", "a-completer").grille(undefined as never);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
    expect(g.lignes.slice(1).map((l) => l.cellules[2]!.valeur)).toEqual([45, 134, 166]);
  });

  it("ce que retourne la fonction, et la boucle « tant que »", () => {
    expect(attendusT(CH, "ce-que-retourne-la-fonction")).toEqual([15, 5]);
    expect(attendusT(CH, "la-boucle-tant-que")).toEqual([3, 32]);
    expect([bonDuMois(TICKETS_DE_MME_LAURENT, false), bonAvecLArrondi(166)]).toEqual([5, 10]);
  });

  it("le curseur : le programme est payé en 5 mois", () => {
    gardeDuCurseurT(CH, "le-curseur-de-l-automatisation", 5);
    expect([calculALaMain(4), calculALaMain(5)]).toEqual([1_200, 1_500]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-objets"))).toEqual(["constante", "constante", "variable", "parametre"]);
    expect(Object.values(triT(CH, "les-types"))).toEqual(["entier", "flottant", "booleen", "chaine", "liste"]);
    expect(Object.values(triT(CH, "le-jeu-d-essai"))).toEqual(["normal", "limite", "limite", "erreur"]);
    expect(justeT(CH, "la-condition")).toEqual(["privilege"]);
  });
});

describe("le cas du chapitre", () => {
  it("15 € de bons, puis 30 €", () => {
    gardeDuCasT(UN_BON_DES_80_POINTS, CH);
    expect(bonDes80Points()).toMatchObject({ a100: 15, a80: 30, ecart: 15 });
  });
});
