import { describe, expect, it } from "vitest";
import { LE_NUMERIQUE_DANS_LA_PRODUCTION as CH } from "../../src/config/cours/chapitres/le-numerique-dans-la-production";
import { capteurs, facturesElectroniques } from "../../src/config/cours/monde/numerique-de-la-ligne";
import { DES_FACTURES_SANS_PAPIER } from "../../src/config/cours/situations/par-chapitre/des-factures-sans-papier";
import { attendusT, gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « LE NUMÉRIQUE DANS LA PRODUCTION » (enseignement commun de terminale, 1.4, lot C STMG), ET SON CAS.
 *
 * Refait à la main : 7 000 ÷ 4 ÷ 58 = 30,17, soit 30 enceintes par poste et par jour, 630 € de marge.
 * Les capteurs : (4 − 0,5) × 630 − 1 200 = 1 005 € pour un poste ; + (3 − 0,5) × 630 − 1 200 = 1 380 € pour
 * deux ; + 0,5 × 630 − 1 200 = 495 € pour trois ; − 390 € pour quatre. Le cas : 1 800 × 5 ÷ 60 = 150
 * heures × 25 = 3 750 €, − 1 500 = 2 250 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 1 de la partie commune, se joue chez NOVA", () => {
    gardeDuProgrammeT(CH, "STMG Thème 1 · Les organisations et l'activité de production de biens et de services");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("les flux et les capteurs", () => {
  it("un jour d'arrêt d'un poste : 30 enceintes, 630 €", () => {
    expect(attendusT(CH, "un-jour-d-arret")).toEqual([30, 630]);
  });

  it("le laboratoire : équiper les 2 postes les plus fragiles", () => {
    const e = gardeDuLaboratoireT(CH, "le-laboratoire-des-capteurs");
    expect(e.defi(null as never).solution).toEqual({ postes: 2 });
    expect([1, 2, 3, 4].map((n) => capteurs(n).gain)).toEqual([1_005, 1_380, 495, -390]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "le-diagramme-des-flux"))).toEqual(["client", "atelier", "fournisseur", "atelier", "client"]);
    expect(Object.values(triT(CH, "trois-mots"))).toEqual(["dematerialisation", "dematerialisation", "automatisation", "workflow"]);
    expect(justeT(CH, "l-algorithme-prevoit")[0]).toMatch(/apprend/);
  });
});

describe("le cas du chapitre", () => {
  it("la plateforme : 150 heures, 3 750 €, 2 250 € de gain", () => {
    gardeDuCasT(DES_FACTURES_SANS_PAPIER, CH);
    expect(facturesElectroniques()).toMatchObject({ heuresGagnees: 150, economie: 3_750, gain: 2_250 });
  });
});
