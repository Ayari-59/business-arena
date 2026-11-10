import { describe, expect, it } from "vitest";
import { RECRUTER_ET_INTEGRER as CH } from "../../src/config/cours/chapitres/recruter-et-integrer";
import { entonnoir, fidelisation, saisonnierOuInterim } from "../../src/config/cours/monde/recrutement-de-l-escale";
import { UN_SAISONNIER_OU_UN_INTERIMAIRE } from "../../src/config/cours/situations/par-chapitre/un-saisonnier-ou-un-interimaire";
import { THEMES_DES_RESSOURCES_HUMAINES, attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « RECRUTER ET INTÉGRER » (ressources humaines et communication de terminale, 1.1, lot E STMG), ET SON
 * CAS, CHEZ L'ESCALE.
 *
 * Refait à la main : 20 % des candidatures retenues, 50 % des entretiens aboutis, soit 10 % ; 10
 * saisonniers demandent 100 candidatures (99 n'en donnent que 9,9). Un nouveau saisonnier coûte
 * 900 + 70 × 18,90 = 2 223 € ; un saisonnier qui revient 300 + 14 × 18,90 = 564,60 € ; 4 retours
 * économisent 4 × 1 658,40 = 6 633,60 €. Le cas : 8 600 ÷ 3 = 2 866,67 € par mois ; 2 × 2 866,67 + 900 =
 * 6 633,34 € en contrat saisonnier, 2 × 2 866,67 × 1,4 = 8 026,68 € en intérim, 1 393,34 € d'écart.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 1 de ressources humaines, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DES_RESSOURCES_HUMAINES[0]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("le recrutement, l'intégration et la fidélisation", () => {
  it("le curseur : 100 candidatures pour 10 saisonniers", () => {
    gardeDuCurseurT(CH, "le-curseur-des-candidatures", 100);
    expect([entonnoir(99).recrues, entonnoir(100)]).toEqual([9.9, { candidatures: 100, entretiens: 20, recrues: 10 }]);
  });

  it("la fidélisation : 2 223 € pour un nouveau, 564,60 € pour un retour, 6 633,60 € d'économie", () => {
    expect(attendusT(CH, "fideliser")).toEqual([2_223, 564.6, 6_633.6]);
    expect(fidelisation().economie).toBe(4 * (2_223 - 564.6));
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "qualification-competence-potentiel"))).toEqual(["qualification", "competence", "competence", "potentiel"]);
    expect(Object.values(triT(CH, "trouver-les-candidats"))).toEqual(["interne", "externe", "externe", "en-ligne"]);
    expect(Object.values(triT(CH, "la-forme-du-contrat"))).toEqual(["cdi", "saisonnier", "interim", "apprentissage"]);
    expect(justeT(CH, "la-question-d-entretien")[0]).toMatch(/buffet/);
    expect(justeT(CH, "l-indemnite")[0]).toMatch(/ne la prévoit pas/);
  });
});

describe("le cas du chapitre", () => {
  it("6 633,34 € en contrat saisonnier, 8 026,68 € en intérim", () => {
    gardeDuCasT(UN_SAISONNIER_OU_UN_INTERIMAIRE, CH);
    expect(saisonnierOuInterim()).toMatchObject({ mensuel: 2_866.67, saisonnier: 6_633.34, interim: 8_026.68, ecart: 1_393.34 });
  });
});
