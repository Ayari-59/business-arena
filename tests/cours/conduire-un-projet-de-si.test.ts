import { describe, expect, it } from "vitest";
import { CONDUIRE_UN_PROJET_DE_SI as CH } from "../../src/config/cours/chapitres/conduire-un-projet-de-si";
import { ecartDuBudget, marge, planning, retardsDuCas, tachesCritiques } from "../../src/config/cours/monde/projet-pgi-de-nova";
import { DEMARRER_LE_PGI_A_LA_DATE_PREVUE } from "../../src/config/cours/situations/par-chapitre/demarrer-le-pgi-a-la-date-prevue";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { etape } from "./gardes-du-lycee";
import { THEMES_DU_SIG, attendusT, gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « CONDUIRE UN PROJET DE SYSTÈME D'INFORMATION » (systèmes d'information de gestion de terminale, 2.2,
 * lot F STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : A 0 à 5, B 5 à 8, C 8 à 18, D 8 à 12, E 8 à 11, F 18 à 22 (après C et D), G 22 à
 * 23 (après E et F). Critiques : A, B, C, F, G ; D a 6 jours de marge (18 − 12), E 11 (22 − 11). Le
 * coût : 17 jours × 650 = 11 050 €, 20 × 650 = 13 000 €, 1 950 € d'écart, 17,6 % ; le démarrage passe
 * au jour 26. Le cas : C à 12 jours, E reportée à 20 : F 20 à 24, G 24 à 25 ; 2 × 650 = 1 300 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 2 du SIG, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DU_SIG[1]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("planning, marge, coût et recette", () => {
  it("le planning au plus tôt : fin au jour 23, sans incohérence", () => {
    expect(planning().lignes.map((l) => [l.debut, l.fin])).toEqual([[0, 5], [5, 8], [8, 18], [8, 12], [8, 11], [18, 22], [22, 23]]);
    const g = etape(CH, "le-planning", "a-completer").grille(undefined as never);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
  });

  it("les tâches critiques et les marges", () => {
    expect(tachesCritiques().map((t) => t.lettre)).toEqual(["A", "B", "C", "F", "G"]);
    expect([marge("reprise"), marge("formation")]).toEqual([6, 11]);
    expect(justeT(CH, "le-chemin-critique")).toEqual(["A, B, C, F et G"]);
  });

  it("le laboratoire : la reprise peut perdre 6 jours, une seule solution", () => {
    const e = gardeDuLaboratoireT(CH, "la-marge");
    expect(e.defi(undefined as never).solution).toEqual({ retard: 6 });
  });

  it("l'écart de coût : 11 050 €, 13 000 €, 1 950 €, 17,65 %", () => {
    expect(attendusT(CH, "l-ecart-de-cout")).toEqual([11_050, 13_000, 1_950, 17.65]);
    expect(ecartDuBudget().finReelle).toBe(26);
  });

  it("les tris", () => {
    expect(Object.values(triT(CH, "les-acteurs"))).toEqual(["moa", "moa", "moe", "moe"]);
    expect(Object.values(triT(CH, "agile-ou-classique"))).toEqual(["classique", "classique", "agile", "agile"]);
    expect(Object.values(triT(CH, "les-anomalies"))).toEqual(["bloquante", "bloquante", "mineure", "mineure"]);
  });
});

describe("le cas du chapitre", () => {
  it("le projet finit au jour 25, pour 1 300 € de plus", () => {
    gardeDuCasT(DEMARRER_LE_PGI_A_LA_DATE_PREVUE, CH);
    expect(retardsDuCas()).toMatchObject({ prevue: 23, fin: 25, decalage: 2, surcout: 1_300 });
  });
});
