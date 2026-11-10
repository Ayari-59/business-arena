import { describe, expect, it } from "vitest";
import { COMMUNICATION_INTERNE_ET_MARQUE_EMPLOYEUR as CH } from "../../src/config/cours/chapitres/communication-interne-et-marque-employeur";
import { COUT_D_UNE_JOURNEE, reunionOuOutil, valeurDesMinutes } from "../../src/config/cours/monde/communication-interne-d-atlas";
import { UNE_REUNION_PAR_MOIS_OU_UN_OUTIL } from "../../src/config/cours/situations/par-chapitre/une-reunion-par-mois-ou-un-outil";
import { THEMES_DES_RESSOURCES_HUMAINES, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « COMMUNICATION INTERNE ET MARQUE EMPLOYEUR » (ressources humaines et communication de terminale, 3.3,
 * lot E STMG), ET SON CAS, CHEZ ATLAS CONSEIL.
 *
 * Refait à la main : 52 800 ÷ 240 = 220 € la journée de 7 heures, 0,5238 € la minute ; l'outil à 12 € se
 * paie dès 23 minutes (12,05 €), pas à 22 (11,52 €). Le cas : 10 × 0,5 × 220 = 1 100 € la réunion ; 13 200 €
 * chaque mois ; 10 × 12 × 12 + 4 × 1 100 = 5 840 € ; 7 360 € d'écart.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 3 de ressources humaines, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DES_RESSOURCES_HUMAINES[2]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("outils, déconnexion et marque employeur", () => {
  it("le curseur : 23 minutes par mois paient l'outil", () => {
    expect(COUT_D_UNE_JOURNEE).toBe(220);
    gardeDuCurseurT(CH, "le-curseur-de-l-outil", 23);
    expect([valeurDesMinutes(22), valeurDesMinutes(23)]).toEqual([11.52, 12.05]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-finalites"))).toEqual(["informer", "federer", "cooperer"]);
    expect(Object.values(triT(CH, "quel-outil"))).toEqual(["intranet", "reseau", "collaboratif", "reunion"]);
    expect(Object.values(triT(CH, "attirer-ou-fideliser"))).toEqual(["attirer", "attirer", "fideliser", "fideliser"]);
    expect(justeT(CH, "la-deconnexion")[0]).toMatch(/déconnexion/);
    expect(justeT(CH, "l-avis-negatif")[0]).toMatch(/calme/);
  });
});

describe("le cas du chapitre", () => {
  it("1 100 € la réunion, 13 200 € chaque mois, 5 840 € avec l'outil", () => {
    gardeDuCasT(UNE_REUNION_PAR_MOIS_OU_UN_OUTIL, CH);
    expect(reunionOuOutil()).toMatchObject({ reunion: 1_100, chaqueMois: 13_200, outil: 1_440, outilEtTrimestre: 5_840, ecart: 7_360 });
  });
});
