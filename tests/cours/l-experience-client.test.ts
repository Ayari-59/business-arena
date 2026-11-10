import { describe, expect, it } from "vitest";
import { L_EXPERIENCE_CLIENT as CH } from "../../src/config/cours/chapitres/l-experience-client";
import { couvertsQuiPaient, soireeDuChef } from "../../src/config/cours/monde/experience-du-bistrot";
import { UNE_SOIREE_LE_MARDI, uneSoireeLeMardi } from "../../src/config/cours/situations/par-chapitre/une-soiree-le-mardi";
import { attendusMk, gardeDuCasMk, gardeDuCurseurMk, gardeDuProgrammeMk, gardesDeTexteMk, justeMk, triMk } from "./gardes-de-la-mercatique";

/**
 * « L'EXPÉRIENCE CLIENT ET LA VALEUR PERÇUE » (mercatique 1.2), ET SON CAS, CHEZ LA TABLE D'AUGUSTIN.
 *
 * Refait à la main : la rapidité, 6,2 − 8 = −1,8 ; la cuisine, 8,8 − 8,5 = 0,3 ; 90 ÷ 120 = 75 %. Un
 * couvert ordinaire, 34 − 10 − 3 = 21 € ; un couvert de la soirée, 52 − 16 − 3 = 33 € ; un jeudi
 * ordinaire, 40 × 21 = 840 € ; à couvrir, 840 + 600 = 1 440 € ; 1 440 ÷ 33 = 43,6 : 44 couverts. Le
 * mardi : 25 × 21 + 600 = 1 125 € ; 1 125 ÷ 33 = 34,1 : 35 couverts ; 38 × 33 − 1 125 = 129 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 1 de la mercatique, et lui seul (la page le range sous la première entrée du référentiel) ; se joue chez LA TABLE D'AUGUSTIN", () => {
    gardeDuProgrammeMk(CH, "STMG Thème 1 · La définition de l'offre");
    expect(CH.blocs).toEqual(["STMG Thème 1 · La définition de l'offre"]);
    expect(CH.entreprises?.codes).toEqual(["bistrot"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteMk(CH);
  });
});

describe("la satisfaction", () => {
  it("les écarts : −1,8 sur la rapidité, 0,3 sur la cuisine ; la déception vient de la rapidité", () => {
    expect(attendusMk(CH, "les-ecarts")).toEqual([-1.8, 0.3]);
    expect(justeMk(CH, "ou-nait-l-insatisfaction")).toEqual(["La rapidité du service"]);
  });

  it("75 % de clients satisfaits", () => {
    expect(attendusMk(CH, "le-taux-de-satisfaits")).toEqual([75]);
  });

  it("les dimensions de l'expérience se rangent, deux moments chacune", () => {
    const t = Object.values(triMk(CH, "les-dimensions"));
    for (const d of ["sensorielle", "affective", "sociale"]) expect(t.filter((x) => x === d)).toHaveLength(2);
  });
});

describe("la soirée du chef", () => {
  it("33 € par couvert, 840 € pour un jeudi ordinaire", () => {
    expect(attendusMk(CH, "la-marge-de-la-soiree")).toEqual([33, 840]);
  });

  it("le curseur : 44 couverts paient la soirée, 43 non", () => {
    expect(couvertsQuiPaient()).toBe(44);
    expect(soireeDuChef(44).gain).toBe(44 * 33 - 1_440);
    expect(soireeDuChef(43).gain).toBeLessThan(0);
    gardeDuCurseurMk(CH, "les-couverts-qui-paient", 44);
  });

  it("toute consommation crée une expérience, mais au midi, on attend la rapidité", () => {
    expect(justeMk(CH, "toute-consommation")[0]).toMatch(/rapidité/);
  });
});

describe("le cas du chapitre", () => {
  it("le mardi : 1 125 € à couvrir, 35 couverts ; 129 € de plus avec 38 réservations, pas le seuil du jeudi", () => {
    gardeDuCasMk(UNE_SOIREE_LE_MARDI, CH);
    const r = uneSoireeLeMardi();
    expect([r.margeDuMardi, r.aCouvrir, r.seuil, r.seuilDuJeudi, r.gain]).toEqual([525, 1_125, 35, 44, 129]);
    expect(justeMk(UNE_SOIREE_LE_MARDI, "reponse")[0]).toMatch(/^Ouvrons-la/);
  });
});
