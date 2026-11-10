import { describe, expect, it } from "vitest";
import { LE_CLIMAT_SOCIAL_ET_LE_CONFLIT as CH } from "../../src/config/cours/chapitres/le-climat-social-et-le-conflit";
import { coutDeLaGreve, journeeDeGreve, leCompromis, revendication } from "../../src/config/cours/monde/climat-social-de-nova";
import { SORTIR_DE_LA_GREVE } from "../../src/config/cours/situations/par-chapitre/sortir-de-la-greve";
import { THEMES_DES_RESSOURCES_HUMAINES, attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « LE CLIMAT SOCIAL ET LE CONFLIT » (ressources humaines et communication de terminale, 3.1, lot E STMG),
 * ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : la hausse demandée, 10 % de 1 875 € = 187,50 € par mois, 187,50 × 12 × 4 × 1,42 =
 * 12 780 € sur l'année. Une journée de grève : 4 × 7 ÷ 0,25 = 112 enceintes, × 21 € = 2 352 € de marge ;
 * 1 875 ÷ 151,67 × 7 × 1,42 = 122,88 € de salaire non versé par opérateur, 491,52 € pour quatre ; 1 860,48 €
 * net. 6 jours : 11 162,88 € ; 7 jours : 13 023,36 €. Le cas : 2 × 1 860,48 = 3 720,96 € ; 5 %, 93,75 € par
 * mois, 6 390 € sur l'année, 6 390 € de moins que la hausse entière.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 3 de ressources humaines, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DES_RESSOURCES_HUMAINES[2]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("climat social, conflit et résolution", () => {
  it("la hausse refusée coûte 12 780 € ; une journée de grève 1 860,48 €", () => {
    expect(revendication()).toEqual({ taux: 10, augmentation: 187.5, coutDeLAnnee: 12_780 });
    expect(journeeDeGreve()).toMatchObject({ enceintes: 112, marge: 2_352, retenueParOperateur: 122.88, salaires: 491.52, cout: 1_860.48 });
  });

  it("le curseur : dès 7 jours, la grève coûte plus que la hausse", () => {
    gardeDuCurseurT(CH, "le-curseur-du-conflit", 7);
    expect([coutDeLaGreve(6), coutDeLaGreve(7)]).toEqual([11_162.88, 13_023.36]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-signaux"))).toEqual(["signal", "signal", "signal", "autre"]);
    expect(Object.values(triT(CH, "individuel-ou-collectif"))).toEqual(["individuel", "individuel", "collectif"]);
    expect(Object.values(triT(CH, "les-modes-de-resolution"))).toEqual(["negociation", "conciliation", "mediation", "arbitrage"]);
    expect(justeT(CH, "remplacer-les-grevistes")).toEqual(["Non, c'est interdit"]);
    expect(justeT(CH, "renforcer-la-cohesion")[0]).toMatch(/dialogue/);
  });
});

describe("le cas du chapitre", () => {
  it("3 720,96 € de grève, 6 390 € de compromis, 6 390 € de moins que la hausse entière", () => {
    gardeDuCasT(SORTIR_DE_LA_GREVE, CH);
    expect(leCompromis()).toMatchObject({ greve: 3_720.96, augmentation: 93.75, compromis: 6_390, economie: 6_390 });
    expect(attendusT(SORTIR_DE_LA_GREVE as never, "le-calcul")).toEqual([3_720.96, 6_390, 6_390]);
  });
});
