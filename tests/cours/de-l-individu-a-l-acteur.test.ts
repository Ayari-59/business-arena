import { describe, expect, it } from "vitest";
import { DE_L_INDIVIDU_A_L_ACTEUR } from "../../src/config/cours/chapitres/de-l-individu-a-l-acteur";
import { L_ESCALE } from "../../src/config/cours/monde/l-escale";
import { COUT_HORAIRE_DE_L_ESCALE, EFFECTIF_DE_L_ESCALE, TUTORAT_LE_PLUS_LONG, integrationDeLEscale } from "../../src/config/cours/monde/equipe-de-l-escale";
import { UN_TUTEUR_POUR_L_ETE, tuteurPourLEte } from "../../src/config/cours/situations/par-chapitre/un-tuteur-pour-l-ete";
import { attendusSgn, gardeDuCasSgn, gardeDuCurseurSgn, gardeDuProgrammeSgn, gardesDeTexteSgn, justeSgn, triSgn } from "./gardes-de-la-sgn";

/**
 * « DE L'INDIVIDU À L'ACTEUR » (SGN de première, thème 1, question 1), ET SON CAS, CHEZ L'ESCALE.
 *
 * Refait à la main : 14 salariés à 8 600 € par trimestre ; l'heure à 8 600 ÷ (3 × 151,67) = 18,90 € ;
 * un départ coûte 900 € + 70 × 18,90 € = 2 223 € ; 3 départs ramenés à 1 économisent 4 446 € ; le tutorat
 * de 6 arrivants coûte 6 × 18,90 = 113,40 € par heure, donc 39 heures au plus (4 422,60 €), 40 heures
 * coûteraient 4 536 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 1 de la SGN, est au programme, et se joue chez L'ESCALE seule", () => {
    gardeDuProgrammeSgn(DE_L_INDIVIDU_A_L_ACTEUR, "STMG Thème 1 · De l'individu à l'acteur");
    expect(DE_L_INDIVIDU_A_L_ACTEUR.entreprises?.codes).toEqual(["hotel"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé, servi par le serveur", () => {
    gardesDeTexteSgn(DE_L_INDIVIDU_A_L_ACTEUR);
  });
});

describe("l'équipe et ce que coûte un départ", () => {
  it("l'organigramme refait les 14 salariés de la fiche de l'hôtel", () => {
    expect(EFFECTIF_DE_L_ESCALE).toBe(L_ESCALE.equipe.effectif);
    expect(EFFECTIF_DE_L_ESCALE).toBe(1 + 4 + 6 + 3);
  });

  it("l'heure à 18,90 €, un départ à 2 223 €, l'économie du tutorat à 4 446 €", () => {
    expect(COUT_HORAIRE_DE_L_ESCALE).toBe(18.9);
    expect(attendusSgn(DE_L_INDIVIDU_A_L_ACTEUR, "le-cout-d-un-depart")).toEqual([70 * 18.9, 900 + 1_323, 2 * 2_223]);
  });

  it("le curseur : 39 heures de tutorat au plus", () => {
    expect(TUTORAT_LE_PLUS_LONG).toBe(39);
    gardeDuCurseurSgn(DE_L_INDIVIDU_A_L_ACTEUR, "le-tutorat", 39);
    expect(integrationDeLEscale(39).coutDuTutorat).toBe(4_422.6);
    expect(integrationDeLEscale(40).coutDuTutorat).toBe(4_536);
  });

  it("les tris et les choix ont la réponse du programme", () => {
    expect(triSgn(DE_L_INDIVIDU_A_L_ACTEUR, "formel-ou-informel")["Karim lui montre comment calmer un client pressé"]).toBe("informelle");
    expect(justeSgn(DE_L_INDIVIDU_A_L_ACTEUR, "autorite-ou-leadership")[0]).toMatch(/^Un leadership/);
    expect(justeSgn(DE_L_INDIVIDU_A_L_ACTEUR, "le-stereotype")[0]).toMatch(/^Un stéréotype/);
  });
});

describe("le cas du chapitre", () => {
  it("un tuteur pour l'été : 8 892 € d'économie pour 5 670 € de tutorat, le tutorat se paie", () => {
    gardeDuCasSgn(UN_TUTEUR_POUR_L_ETE, DE_L_INDIVIDU_A_L_ACTEUR);
    const k = tuteurPourLEte();
    expect([k.economie, k.coutDuTutorat, k.gain]).toEqual([4 * 2_223, 10 * 30 * 18.9, 8_892 - 5_670]);
  });
});
