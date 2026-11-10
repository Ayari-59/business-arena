import { describe, expect, it } from "vitest";
import { COMMUNIQUER_AVEC_CHAQUE_ACTEUR as CH } from "../../src/config/cours/chapitres/communiquer-avec-chaque-acteur";
import { annonceOuCooptation, noteApres } from "../../src/config/cours/monde/communication-de-nova";
import { UNE_ANNONCE_OU_LA_COOPTATION } from "../../src/config/cours/situations/par-chapitre/une-annonce-ou-la-cooptation";
import { gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « COMMUNIQUER AVEC CHAQUE ACTEUR » (enseignement commun de terminale, 2.3, lot C STMG ; le thème 3 de
 * ressources humaines cité en second), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 120 avis à 3,8, soit 456 points ; (456 + 5n) ÷ (120 + n) ≥ 4,2 dès 0,8 n ≥ 48 :
 * n = 60, la moyenne de 756 ÷ 180 = 4,2. Le cas : 2 × 900 = 1 800 € d'annonces, 2 × 500 = 1 000 € de
 * cooptation, 800 € d'écart.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite d'abord le thème 2 de la partie commune, puis le thème 3 des ressources humaines", () => {
    gardeDuProgrammeT(CH, "STMG Thème 2 · Les organisations et les acteurs", [
      "STMG Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
    ]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("formes, identité et information financière", () => {
  it("le curseur : 60 avis à 5 sur 5 portent la note à 4,2", () => {
    gardeDuCurseurT(CH, "le-curseur-des-avis", 60);
    expect([noteApres(59).total / noteApres(59).avis < 4.2, noteApres(60).moyenne]).toEqual([true, 4.2]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-formes"))).toEqual(["descendante", "descendante", "ascendante", "horizontale"]);
    expect(Object.values(triT(CH, "interne-externe"))).toEqual(["interne", "institutionnelle", "institutionnelle", "commerciale"]);
    expect(Object.values(triT(CH, "l-information-financiere"))).toEqual(["banque", "banque", "associes", "salaries"]);
    expect(justeT(CH, "la-normalisation")[0]).toMatch(/confiance/);
  });
});

describe("le cas du chapitre", () => {
  it("1 800 € d'annonces, 1 000 € de cooptation", () => {
    gardeDuCasT(UNE_ANNONCE_OU_LA_COOPTATION, CH);
    expect(annonceOuCooptation()).toMatchObject({ postes: 2, annonce: 1_800, cooptation: 1_000, ecart: 800 });
  });
});
