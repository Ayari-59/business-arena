import { describe, expect, it } from "vitest";
import { MANAGER_FONCTIONS_ET_DECISIONS } from "../../src/config/cours/chapitres/manager-fonctions-et-decisions";
import { PROGRAMME } from "../../src/config/cours/registre";
import { QUI_DECIDE_DE_QUOI } from "../../src/config/cours/situations/par-chapitre/qui-decide-de-quoi";
import { attendus, gardeDuCas, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { bonneReponseJamaisLaPlusLongue } from "./gardes-du-management";

/**
 * MANAGER : FONCTIONS ET DÉCISIONS (management de première, 1.3, lot B STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : l'objectif de l'année N, 70 % de 7 000 enceintes par trimestre, soit 4 900 × 4 =
 * 19 600 ; 23 609 enceintes vendues ; quatre opérateurs à 1 875 € bruts et 42 % de cotisations
 * patronales, 2 662,50 € par mois chacun, 127 800 € sur l'année.
 */

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 1, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(MANAGER_FONCTIONS_ET_DECISIONS, PROGRAMME["stmg-management"][1]!);
    expect(MANAGER_FONCTIONS_ET_DECISIONS.blocs[0]).toBe("STMG Thème 1 · À la rencontre du management des organisations");
    gardeDuCas(QUI_DECIDE_DE_QUOI, MANAGER_FONCTIONS_ET_DECISIONS);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, servis par le serveur", () => {
    gardesDeTexte(MANAGER_FONCTIONS_ET_DECISIONS);
    bonneReponseJamaisLaPlusLongue(MANAGER_FONCTIONS_ET_DECISIONS);
    bonneReponseJamaisLaPlusLongue(QUI_DECIDE_DE_QUOI);
  });
});

describe("les fonctions et les décisions", () => {
  it("les quatre fonctions ont chacune un geste, et les décisions se partagent à trois et trois", () => {
    expect(new Set(Object.values(triDe(MANAGER_FONCTIONS_ET_DECISIONS, "fonctions")))).toEqual(new Set(["fixer", "organiser", "mobiliser", "evaluer"]));
    expect(Object.values(triDe(MANAGER_FONCTIONS_ET_DECISIONS, "strategique-ou-operationnel")).sort()).toEqual(["operationnel", "operationnel", "operationnel", "strategique", "strategique", "strategique"]);
    expect(Object.values(triDe(MANAGER_FONCTIONS_ET_DECISIONS, "prive-ou-public")).sort()).toEqual(["les-deux", "prive", "prive", "public", "public", "public"]);
  });

  it("l'efficacité de l'année N : 23 609 ÷ 19 600 = 120,5 %, et 127 800 ÷ 23 609 = 5,41 € de personnel par enceinte", () => {
    const cout = 4 * 1_875 * 1.42 * 12;
    expect(cout).toBe(127_800);
    expect(attendus(MANAGER_FONCTIONS_ET_DECISIONS, "evaluer-l-efficacite")).toEqual([Math.round((23_609 / (0.7 * 7_000 * 4)) * 1000) / 10, Math.round((cout / 23_609) * 100) / 100]);
    expect(attendus(MANAGER_FONCTIONS_ET_DECISIONS, "evaluer-l-efficacite")).toEqual([120.5, 5.41]);
    expect(juste(MANAGER_FONCTIONS_ET_DECISIONS, "ce-qui-les-distingue")).toEqual(["Ses effets sur le devenir de l'organisation, et le niveau où elle se prend"]);
  });
});

describe("le cas du chapitre", () => {
  it("qui décide de quoi : trois décisions gardées, trois confiées", () => {
    expect(Object.values(triDe(QUI_DECIDE_DE_QUOI, "ranger")).sort()).toEqual(["operationnel", "operationnel", "operationnel", "strategique", "strategique", "strategique"]);
    expect(juste(QUI_DECIDE_DE_QUOI, "reponse")).toEqual(["Confier les décisions opérationnelles au chef d'atelier, garder les stratégiques"]);
  });
});
