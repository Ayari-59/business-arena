import { describe, expect, it } from "vitest";
import { LA_FONCTION_SYSTEME_D_INFORMATION as CH } from "../../src/config/cours/chapitres/la-fonction-systeme-d-information";
import { budgetDuSi, infogeranceDe, renouvelerLInfogerance } from "../../src/config/cours/monde/fonction-si-de-nova";
import { RENOUVELER_L_INFOGERANCE } from "../../src/config/cours/situations/par-chapitre/renouveler-l-infogerance";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { etape } from "./gardes-du-lycee";
import { THEMES_DU_SIG, attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « LA FONCTION SYSTÈME D'INFORMATION » (systèmes d'information de gestion de terminale, 2.1, lot F STMG),
 * ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 1 700 ÷ 85 = 20 postes au plus (21 : 1 785 €). Le budget : 6 × 900 ÷ 3 = 1 800 ;
 * 75 × 4 × 12 = 3 600 ; 85 × 6 × 12 = 6 120 ; + 3 000 + 600 = 15 120 €, 2 520 € par poste. Mars :
 * (720 − 3,6) ÷ 720 = 99,5 % ; 30 ÷ 12 = 2,5 heures ; 10 ÷ 12 = 83,3 %. Le cas : 8 × 110 × 12 = 10 560 €,
 * 1 700 × 12 = 20 400 €, 9 840 € d'écart.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 2 du SIG, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DU_SIG[1]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("métiers, infogérance, budget et tableau de bord", () => {
  it("le curseur : l'infogérance coûte moins jusqu'à 20 postes", () => {
    gardeDuCurseurT(CH, "le-curseur-de-l-infogerance", 20);
    expect([infogeranceDe(20), infogeranceDe(21)]).toEqual([1_700, 1_785]);
  });

  it("le budget : 15 120 €, sans incohérence, et 2 520 € par poste", () => {
    const g = etape(CH, "le-budget", "a-completer").grille(undefined as never);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
    expect(budgetDuSi()).toMatchObject({ materiel: 1_800, pgi: 3_600, infogerance: 6_120, total: 15_120, parPoste: 2_520 });
    expect(attendusT(CH, "par-poste")).toEqual([2_520]);
  });

  it("le tableau de bord de mars : 99,5 %, 2,5 heures, 83,3 %", () => {
    expect(attendusT(CH, "le-tableau-de-bord")).toEqual([99.5, 2.5, 83.3]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-metiers"))).toEqual(["technicien", "developpeur", "securite", "donnees", "dpo"]);
    expect(Object.values(triT(CH, "raisons-et-limites"))).toEqual(["raison", "raison", "limite", "limite", "limite"]);
    expect(justeT(CH, "lire-le-tableau-de-bord")[0]).toMatch(/^La disponibilité est tenue/);
  });
});

describe("le cas du chapitre", () => {
  it("10 560 € d'infogérance, 20 400 € de technicien", () => {
    gardeDuCasT(RENOUVELER_L_INFOGERANCE, CH);
    expect(renouvelerLInfogerance()).toMatchObject({ offre: 10_560, technicien: 20_400, ecart: 9_840 });
  });
});
