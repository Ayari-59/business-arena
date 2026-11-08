import { describe, expect, it } from "vitest";
import { QUALIFICATION_COMPETENCES_ET_LIENS_DE_TRAVAIL as CH } from "../../src/config/cours/chapitres/qualification-competences-et-liens-de-travail";
import { JOURNEES_OU_L_EMBAUCHE_SE_PAIE, MARGE_D_UNE_JOURNEE, activiteDAtlas, servirLeTrimestre4 } from "../../src/config/cours/monde/liens-de-travail-d-atlas";
import { UN_CONTRAT_DE_150_JOURNEES, contratDe150Journees } from "../../src/config/cours/situations/par-chapitre/un-contrat-de-150-journees";
import { attendusSgn, gardeDuCasSgn, gardeDuCurseurSgn, gardeDuLaboratoireSgn, gardeDuProgrammeSgn, gardesDeTexteSgn, triSgn } from "./gardes-de-la-sgn";

/**
 * « QUALIFICATION, COMPÉTENCES ET NOUVEAUX LIENS DE TRAVAIL » (SGN T1.3), ET SON CAS, CHEZ ATLAS CONSEIL.
 *
 * Refait à la main : 10 consultants × 60 jours = 600 journées par trimestre ; 330 vendues l'été (55 %),
 * 600 en fin d'année (100 %), 680 demandées : 80 refusées ; 52 800 € ÷ 240 jours = 220 € la journée ;
 * 52 800 ÷ 480 = 110 journées ; une journée laisse 800 − 150 = 650 € ; 80 journées d'indépendants
 * coûtent 38 400 € et laissent 52 000 € : 13 600 € de gain ; un salarié et 20 journées coûtent 62 400 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 1 de la SGN, se joue chez ATLAS CONSEIL", () => {
    gardeDuProgrammeSgn(CH, "STMG Thème 1 · De l'individu à l'acteur");
    expect(CH.entreprises?.codes).toEqual(["conseil"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteSgn(CH);
  });
});

describe("l'activité et le coût du travail", () => {
  it("55 % et 100 % d'occupation, 220 € la journée de salarié", () => {
    const k = activiteDAtlas();
    expect(k.capacite).toBe(600);
    expect(k.trimestres[3]!.refusees).toBe(80);
    expect(attendusSgn(CH, "l-activite-de-l-equipe")).toEqual([55, 100, 220]);
  });

  it("le curseur : 110 journées", () => {
    expect(JOURNEES_OU_L_EMBAUCHE_SE_PAIE).toBe(110);
    gardeDuCurseurSgn(CH, "quand-l-embauche-se-paie", 110);
  });

  it("le laboratoire : 80 journées d'indépendants, sans embauche, seule solution", () => {
    expect(MARGE_D_UNE_JOURNEE).toBe(650);
    gardeDuLaboratoireSgn(CH, "servir-le-trimestre-4");
    expect(servirLeTrimestre4(0, 80).gain).toBe(80 * 650 - 80 * 480);
    expect(servirLeTrimestre4(1, 20).gain).toBe(80 * 650 - 52_800 - 20 * 480);
  });

  it("les liens de travail : l'intérimaire et le porté sont salariés", () => {
    const t = triSgn(CH, "les-liens-de-travail");
    expect(t["Un formateur envoyé par une agence d'intérim"]).toBe("salarie");
    expect(t["Une consultante en portage salarial"]).toBe("salarie");
    expect(t["Un consultant installé en micro-entreprise"]).toBe("independant");
  });
});

describe("le cas du chapitre", () => {
  it("150 journées : 72 000 € d'indépendants, l'embauche économise 19 200 €", () => {
    gardeDuCasSgn(UN_CONTRAT_DE_150_JOURNEES, CH);
    const k = contratDe150Journees();
    expect([k.independants, k.economie, k.embaucher]).toEqual([150 * 480, 72_000 - 52_800, true]);
  });
});
