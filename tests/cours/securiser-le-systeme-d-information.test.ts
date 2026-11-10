import { describe, expect, it } from "vitest";
import { SECURISER_LE_SYSTEME_D_INFORMATION as CH } from "../../src/config/cours/chapitres/securiser-le-systeme-d-information";
import { restaurerOuPayer, unJourDArret, valeurDesJoursDArretEvites } from "../../src/config/cours/monde/securite-du-si-de-nova";
import { PAYER_LA_RANCON } from "../../src/config/cours/situations/par-chapitre/payer-la-rancon";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { etape } from "./gardes-du-lycee";
import { THEMES_DU_SIG, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « SÉCURISER LE SYSTÈME D'INFORMATION » (systèmes d'information de gestion de terminale, 1.2, lot F
 * STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 1 710 ÷ 30 = 57 enceintes par jour, × 21 € = 1 197 € ; le plan à 3 000 € se paie
 * dès 3 jours (2 : 2 394 €). La grille : 4 × 2 = 8, 2 × 4 = 8, 3 × 3 = 9, 1 × 3 = 3. Le cas : 1 197 +
 * 1 500 = 2 697 €, 8 000 − 2 697 = 5 303 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 1 du SIG, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DU_SIG[0]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("risques, sécurité, RGPD et cybersécurité", () => {
  it("la grille des risques : 8, 8, 9 et 3 points, sans incohérence", () => {
    const g = etape(CH, "la-grille", "a-completer").grille(undefined as never);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
    expect(g.lignes.map((l) => l.cellules[2]!.valeur)).toEqual([8, 8, 9, 3]);
  });

  it("le curseur : 3 jours d'arrêt évités paient le plan", () => {
    expect(unJourDArret().cout).toBe(1_197);
    gardeDuCurseurT(CH, "le-curseur-du-plan", 3);
    expect([valeurDesJoursDArretEvites(2), valeurDesJoursDArretEvites(3)]).toEqual([2_394, 3_591]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "trois-sortes-de-risques"))).toEqual(["organisation", "organisation", "personnes", "personnes", "environnement"]);
    expect(Object.values(triT(CH, "les-finalites"))).toEqual(["disponibilite", "integrite", "confidentialite", "tracabilite"]);
    expect(Object.values(triT(CH, "les-mesures"))).toEqual(["prevenir", "prevenir", "detecter", "repartir"]);
    expect(Object.values(triT(CH, "conforme-ou-non"))).toEqual(["conforme", "conforme", "conforme", "non-conforme", "non-conforme"]);
    expect(justeT(CH, "la-solution-technique")[0]).toBe("Chiffrer la base de données");
    expect(justeT(CH, "le-rancongiciel")[0]).toMatch(/^Isoler/);
  });
});

describe("le cas du chapitre", () => {
  it("2 697 € de restauration, 5 303 € de moins que la rançon", () => {
    gardeDuCasT(PAYER_LA_RANCON, CH);
    expect(restaurerOuPayer()).toMatchObject({ restauration: 2_697, ecart: 5_303 });
  });
});
