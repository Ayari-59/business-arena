import { describe, expect, it } from "vitest";
import { LES_RESSOURCES_POUR_PRODUIRE as CH } from "../../src/config/cours/chapitres/les-ressources-pour-produire";
import { UN_REMPLACEMENT_DE_4_MOIS } from "../../src/config/cours/situations/par-chapitre/un-remplacement-de-4-mois";
import { remplacement } from "../../src/config/cours/monde/ressources-et-gpec-de-nova";
import { attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « LES RESSOURCES POUR PRODUIRE » (enseignement commun de terminale, 1.2, lot C STMG ; le thème 1 de
 * ressources humaines cité en second), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main sur le bilan du 31 décembre N : 323 297,07 − 60 000 = 263 297,07 € de fonds de
 * roulement, − 10 627,62 € de besoin = 252 669,45 € de trésorerie nette. La GPEC de N + 2 : 150 ÷ 0,25 ×
 * 12 = 7 200 enceintes par opérateur, 34 200 ÷ 7 200 = 4,75 : 5 opérateurs ; 4 − 1 = 3 présents, 2
 * recrutements. Le cas : 4 × 2 662,50 + 3 000 = 13 650 € en CDD, 4 × 2 × 1 875 = 15 000 € en intérim.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite d'abord le thème 1 de la partie commune, puis le thème 1 des ressources humaines", () => {
    gardeDuProgrammeT(CH, "STMG Thème 1 · Les organisations et l'activité de production de biens et de services", [
      "STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
    ]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("le financement et la GPEC", () => {
  it("le fonds de roulement et la trésorerie nette du 31 décembre N", () => {
    expect(attendusT(CH, "frng-bfr-tn")).toEqual([263_297.07, 252_669.45]);
  });

  it("le curseur : 5 opérateurs ; 3 présents, 2 recrutements", () => {
    gardeDuCurseurT(CH, "le-curseur-des-operateurs", 5);
    expect(attendusT(CH, "les-recrutements")).toEqual([3, 2]);
  });

  it("les tris et les choix", () => {
    expect(triT(CH, "tangibles-ou-intangibles")["La marque NOVA et ses avis clients"]).toBe("intangible");
    expect(Object.values(triT(CH, "recruter-ou-former"))).toEqual(["recruter", "recruter", "former", "former"]);
    expect(justeT(CH, "financer-l-exploitation")[0]).toMatch(/^Un besoin d'exploitation/);
  });
});

describe("le cas du chapitre", () => {
  it("le CDD coûte 13 650 €, l'intérim 15 000 €", () => {
    gardeDuCasT(UN_REMPLACEMENT_DE_4_MOIS, CH);
    const r = remplacement();
    expect([r.cdd, r.interim, r.ecart]).toEqual([4 * 2_662.5 + 3_000, 4 * 2 * 1_875, 1_350]);
    expect(justeT(UN_REMPLACEMENT_DE_4_MOIS, "reponse")[0]).toMatch(/^Le CDD/);
  });
});
