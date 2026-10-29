import { describe, expect, it } from "vitest";
import { LES_COMPOSANTS_ET_L_AMORTISSEMENT_DEROGATOIRE as CH } from "../../src/config/cours/chapitres/les-composants-et-l-amortissement-derogatoire";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LES_MOTEURS_QUI_S_USENT_PLUS_VITE, moteursQuiSUsent } from "../../src/config/cours/situations/par-chapitre/les-moteurs-qui-s-usent-plus-vite";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { reponseSansIndice } from "./gardes-de-l-ue10";

/**
 * L'APPROCHE PAR COMPOSANTS ET L'AMORTISSEMENT DÉROGATOIRE (DCG UE10), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : la seconde ligne, 60 000 € = 45 000 € de structure sur 6 ans + 15 000 € de
 * moteurs sur 3 ans, en service le 2 janvier N + 1, soit 359 jours sur 360 la première année ; le
 * dégressif fiscal de la structure, 1,75 ÷ 6 = 29,1667 %, sur 12 mois.
 */

const r2 = (x: number) => Math.round(x * 100) / 100;

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 4, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(CH, PROGRAMME["dcg-comptabilite-approfondie"][4]!);
    expect(CH.blocs).toContain("DCG UE10 · Comptabilité approfondie");
    expect(CH.prerequis).toEqual(["immobilisations"]);
    gardeDuCas(LES_MOTEURS_QUI_S_USENT_PLUS_VITE, CH);
    reponseSansIndice(LES_MOTEURS_QUI_S_USENT_PLUS_VITE);
  });

  it("textes propres, une seule bonne réponse, notions existantes, servis par le serveur", () => {
    gardesDeTexte(CH);
    reponseSansIndice(CH);
  });
});

describe("les composants", () => {
  it("les dotations de N + 1 : 7 479,17 € de structure, 4 986,11 € de moteurs, 12 465,28 € en tout", () => {
    const structure = r2(((45_000 / 6) * 359) / 360);
    const composant = r2(((15_000 / 3) * 359) / 360);
    expect([structure, composant]).toEqual([7_479.17, 4_986.11]);
    expect(attendus(CH, "dotations")).toEqual([structure, composant, r2(structure + composant)]);
    expect(juste(CH, "pourquoi-un-composant")).toEqual(["Leur durée d'utilisation diffère de celle de la ligne"]);
  });

  it("le dérogatoire de N + 1 : 45 000 × 1,75 ÷ 6 = 13 125 €, moins 7 479,17 € = 5 645,83 €", () => {
    expect(attendus(CH, "le-derogatoire")).toEqual([13_125, r2(13_125 - 7_479.17)]);
    expect(attendus(CH, "le-derogatoire")[1]).toBe(5_645.83);
  });

  it("le curseur : le dérogatoire se reprend dès l'année 3, où le dégressif (6 585,29 €) passe sous le linéaire", () => {
    // Année 2 : (45 000 − 13 125) × 29,1667 % = 9 296,88 € ; année 3 : (31 875 − 9 296,88) × 29,1667 % = 6 585,29 €.
    const a2 = r2((45_000 - 13_125) * (1.75 / 6));
    const a3 = r2((45_000 - 13_125 - a2) * (1.75 / 6));
    expect([a2, a3]).toEqual([9_296.88, 6_585.29]);
    expect(a2 > 7_500 && a3 < 7_500).toBe(true);
    gardeDuCurseur(CH, "la-premiere-reprise", 3);
  });

  it("le laboratoire : sur 6 ans, le composant ne change rien, la seule durée à un centime de la ligne d'un bloc", () => {
    const e = gardeDuLaboratoire(CH, "le-laboratoire-des-composants");
    expect(e.defi(NOVA).solution).toEqual({ duree: 6 });
    // Sur 6 ans : 7 479,17 + 2 493,06 = 9 972,23 € ; d'un bloc, 60 000 ÷ 6 × 359 ÷ 360 = 9 972,22 €.
    expect([r2(7_479.17 + r2(((15_000 / 6) * 359) / 360)), r2(((60_000 / 6) * 359) / 360)]).toEqual([9_972.23, 9_972.22]);
  });
});

describe("le cas du chapitre", () => {
  it("les moteurs sur 2 ans : 7 479,17 € de composant, 14 958,34 € en tout, 2 493,06 € de plus", () => {
    const k = moteursQuiSUsent();
    expect([k.apres.composant, k.apres.total, k.hausse]).toEqual([r2(((15_000 / 2) * 359) / 360), r2(7_479.17 * 2), r2(14_958.34 - 12_465.28)]);
    expect(k.hausse).toBe(2_493.06);
  });
});
