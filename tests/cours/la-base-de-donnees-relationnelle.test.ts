import { describe, expect, it } from "vitest";
import { LA_BASE_DE_DONNEES_RELATIONNELLE as CH } from "../../src/config/cours/chapitres/la-base-de-donnees-relationnelle";
import { casesDeLaTableUnique, casesDesDeuxTables, commandesDe, commandesOuLesDeuxTablesGagnent, moyenneDesAvis } from "../../src/config/cours/monde/base-de-donnees-de-nova";
import { RANGER_LES_AVIS_DES_CLIENTS } from "../../src/config/cours/situations/par-chapitre/ranger-les-avis-des-clients";
import { THEMES_DU_SIG, attendusT, gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « LA BASE DE DONNÉES RELATIONNELLE » (systèmes d'information de gestion de terminale, 3.1, lot F STMG),
 * ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : la table unique, 10 × 6 = 60 cases ; les 2 tables, 6 × 3 + 10 × 4 = 58. Pour n
 * commandes, 18 + 4n < 6n dès n = 10 (à 9 : 54 et 54). Mme Moreau a 2 commandes. Le cas : (5 + 4 + 2 +
 * 5 + 4) ÷ 5 = 4.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 3 du SIG, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DU_SIG[2]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("le modèle relationnel", () => {
  it("la redondance : 60 cases contre 58", () => {
    expect(attendusT(CH, "la-redondance")).toEqual([60, 58]);
  });

  it("le laboratoire : les 2 tables gagnent dès 10 commandes, une seule solution", () => {
    gardeDuLaboratoireT(CH, "le-laboratoire-des-cases");
    expect(commandesOuLesDeuxTablesGagnent()).toBe(10);
    expect([casesDesDeuxTables(9), casesDeLaTableUnique(9)]).toEqual([54, 54]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-sources"))).toEqual(["interne", "partenaire", "ouverte", "objet"]);
    expect(Object.values(triT(CH, "le-vocabulaire"))).toEqual(["relation", "attribut", "primaire", "primaire", "etrangere"]);
    expect(Object.values(triT(CH, "les-contraintes"))).toEqual(["cle", "domaine", "domaine", "referentielle"]);
    expect(Object.values(triT(CH, "les-analyses"))).toEqual(["descriptive", "diagnostique", "predictive", "prescriptive"]);
    expect(justeT(CH, "la-dependance")[0]).toBe("NumClient donne Ville");
    expect(commandesDe("C06")).toBe(2);
    expect(justeT(CH, "adapter-le-schema")[0]).toMatch(/Produit/);
  });
});

describe("le cas du chapitre", () => {
  it("une relation Avis, une note moyenne de 4", () => {
    gardeDuCasT(RANGER_LES_AVIS_DES_CLIENTS, CH);
    expect(moyenneDesAvis()).toBe(4);
  });
});
