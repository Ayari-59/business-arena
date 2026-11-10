import { describe, expect, it } from "vitest";
import { LE_SYSTEME_D_INFORMATION_DE_NOVA as CH } from "../../src/config/cours/chapitres/le-systeme-d-information-de-nova";
import { controleDeJuin, coutDesAdressesFausses } from "../../src/config/cours/monde/systeme-d-information-de-nova";
import { CONTROLER_LES_ADRESSES_A_LA_SAISIE } from "../../src/config/cours/situations/par-chapitre/controler-les-adresses-a-la-saisie";
import { THEMES_DU_SIG, attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « LE SYSTÈME D'INFORMATION DE NOVA » (systèmes d'information de gestion de terminale, 1.1, lot F STMG),
 * ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 28 ÷ 1 270 = 2,2 % ; 28 × 9 = 252 €. Au taux de janvier, n commandes coûtent
 * n × 252 ÷ 1 270 € : 45 × 1 270 ÷ 252 = 226,8, donc 227 commandes paient les 45 € du contrôle (226 :
 * 44,84 €). Le cas : 40 × 9 = 360 €, 360 − 45 = 315 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 1 du SIG, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DU_SIG[0]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("ressources, fonctions, qualité des données, processus", () => {
  it("le taux d'adresses fausses 2,2 % et leur coût 252 €", () => {
    expect(attendusT(CH, "les-adresses-fausses")).toEqual([2.2, 252]);
  });

  it("le curseur : 227 commandes paient le contrôle", () => {
    gardeDuCurseurT(CH, "le-curseur-du-controle", 227);
    expect([coutDesAdressesFausses(226), coutDesAdressesFausses(227)]).toEqual([44.84, 45.04]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-ressources"))).toEqual(["acteurs", "donnees", "outils", "procedures"]);
    expect(Object.values(triT(CH, "les-fonctions"))).toEqual(["acquisition", "traitement", "stockage", "diffusion", "diffusion"]);
    expect(Object.values(triT(CH, "les-si-fonctionnels"))).toEqual(["commercial", "production", "finance", "rh"]);
    expect(Object.values(triT(CH, "le-systeme-informatique"))).toEqual(["materiel", "materiel", "logiciel", "reseau"]);
    expect(justeT(CH, "les-niveaux")[0]).toBe("Inter-organisationnel");
    expect(justeT(CH, "la-synchronisation")[0]).toBe("Une synchronisation");
    expect(justeT(CH, "adapter-le-processus")[0]).toMatch(/^À l'activité 1/);
  });
});

describe("le cas du chapitre", () => {
  it("360 € de colis revenus, 315 € qui restent", () => {
    gardeDuCasT(CONTROLER_LES_ADRESSES_A_LA_SAISIE, CH);
    expect(controleDeJuin()).toMatchObject({ cout: 360, gain: 315 });
  });
});
