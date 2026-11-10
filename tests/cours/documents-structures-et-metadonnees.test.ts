import { describe, expect, it } from "vitest";
import { DOCUMENTS_STRUCTURES_ET_METADONNEES as CH } from "../../src/config/cours/chapitres/documents-structures-et-metadonnees";
import { gainDesRecherches, numeriserLesArchives } from "../../src/config/cours/monde/documents-de-maille";
import { NUMERISER_LES_ARCHIVES } from "../../src/config/cours/situations/par-chapitre/numeriser-les-archives";
import { THEMES_DU_SIG, attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « DOCUMENTS STRUCTURÉS » (systèmes d'information de gestion de terminale, 4.1, lot F STMG), ET SON CAS,
 * CHEZ MAILLE & CO.
 *
 * Refait à la main : la commande du comité, 10 + 6 + 8 = 24 articles ; 10 × 55 + 6 × 35 + 8 × 25 = 960 €.
 * Une recherche fait gagner 7 minutes à 30 € de l'heure, 3,50 € ; la GED à 49 € se paie dès 14
 * recherches (13 : 45,50 €). Le cas : 2 400 × 1 × 30 ÷ 60 = 1 200 € ; 20 × 3,50 × 12 = 840 € ; 840 −
 * 588 = 252 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 4 du SIG, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DU_SIG[3]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("balisage, métadonnées et GED", () => {
  it("la commande du comité lue dans son fichier : 24 articles, 960 €", () => {
    expect(attendusT(CH, "lire-la-commande")).toEqual([24, 960]);
  });

  it("le curseur : 14 recherches paient la GED", () => {
    gardeDuCurseurT(CH, "le-curseur-de-la-ged", 14);
    expect([gainDesRecherches(13), gainDesRecherches(14)]).toEqual([45.5, 49]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "trois-operations"))).toEqual(["numerisation", "structuration", "indexation", "indexation"]);
    expect(Object.values(triT(CH, "contenu-presentation-metadonnees"))).toEqual(["contenu", "contenu", "presentation", "metadonnee", "metadonnee"]);
    expect(justeT(CH, "la-balise-qui-manque")).toEqual(["</prix>"]);
  });
});

describe("le cas du chapitre", () => {
  it("1 200 € de numérisation, 252 € laissés par an", () => {
    gardeDuCasT(NUMERISER_LES_ARCHIVES, CH);
    expect(numeriserLesArchives()).toMatchObject({ numerisation: 1_200, gainDeLAnnee: 840, ged: 588, netDeLAnnee: 252 });
  });
});
