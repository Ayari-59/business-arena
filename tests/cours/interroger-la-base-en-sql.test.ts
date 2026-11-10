import { describe, expect, it } from "vitest";
import { INTERROGER_LA_BASE_EN_SQL as CH } from "../../src/config/cours/chapitres/interroger-la-base-en-sql";
import { chiffreDeLExtrait, commandesDAuMoins, enceintesParVille, seuilDeLaMoitie, villeEnTete } from "../../src/config/cours/monde/base-de-donnees-de-nova";
import { OU_OUVRIR_UN_POINT_DE_RETRAIT } from "../../src/config/cours/situations/par-chapitre/ou-ouvrir-un-point-de-retrait";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { etape } from "./gardes-du-lycee";
import { THEMES_DU_SIG, attendusT, gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT } from "./gardes-de-la-terminale";

/**
 * « INTERROGER LA BASE EN SQL » (systèmes d'information de gestion de terminale, 3.1, lot F STMG), ET SON
 * CAS, CHEZ NOVA.
 *
 * Refait à la main sur les 2 tables : Grenoble, 2 clients ; hors de Lyon, 4. Quantite entre 2 et 3 :
 * 102, 106, 108 ; égale à 1 ou 5 : 101, 103, 105, 107, 109, 110. Lyon : 101, 104, 105, 109, soit 7
 * enceintes. COUNT 10, SUM 21, AVG 2,1, MAX 5. Par ville : Lyon 7, Grenoble 11, Annecy 2, Valence 1.
 * Le critère : 21 × 59 = 1 239 € ; Quantite >= 3 garde 12 enceintes, 708 € (>= 619,50 €), >= 4 n'en garde
 * que 9, 531 €. Le cas : Grenoble, 11 × 59 = 649 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 3 du SIG, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DU_SIG[2]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("les requêtes et leurs résultats", () => {
  it("sélection, opérateurs, jointure et agrégats", () => {
    expect(attendusT(CH, "lire-une-requete")).toEqual([2, 4]);
    expect(attendusT(CH, "les-operateurs-logiques")).toEqual([3, 6]);
    expect(attendusT(CH, "lire-la-jointure")).toEqual([4, 7]);
    expect(attendusT(CH, "les-agregats")).toEqual([10, 21, 2.1, 5]);
    expect(justeT(CH, "la-clause-qui-manque")).toEqual(["WHERE"]);
    expect(justeT(CH, "trier")).toEqual(["Grenoble"]);
  });

  it("le regroupement par ville, sans incohérence", () => {
    expect(enceintesParVille()).toEqual([
      { ville: "Lyon", enceintes: 7 },
      { ville: "Grenoble", enceintes: 11 },
      { ville: "Annecy", enceintes: 2 },
      { ville: "Valence", enceintes: 1 },
    ]);
    const g = etape(CH, "le-regroupement", "a-completer").grille(undefined as never);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
  });

  it("le laboratoire : Quantite >= 3 garde la moitié du chiffre d'affaires, une seule solution", () => {
    gardeDuLaboratoireT(CH, "le-laboratoire-du-critere");
    expect(chiffreDeLExtrait()).toBe(1_239);
    expect(seuilDeLaMoitie()).toBe(3);
    expect([commandesDAuMoins(3).chiffre, commandesDAuMoins(4).chiffre]).toEqual([708, 531]);
  });
});

describe("le cas du chapitre", () => {
  it("Grenoble, 11 enceintes, 649 €", () => {
    gardeDuCasT(OU_OUVRIR_UN_POINT_DE_RETRAIT, CH);
    expect(villeEnTete()).toEqual({ ville: "Grenoble", enceintes: 11, chiffre: 649 });
  });
});
