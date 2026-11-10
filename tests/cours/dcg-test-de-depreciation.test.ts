import { describe, expect, it } from "vitest";
import { LE_TEST_DE_DEPRECIATION as CH } from "../../src/config/cours/chapitres/le-test-de-depreciation";
import { PROGRAMME } from "../../src/config/cours/registre";
import { VENDRE_LA_LIGNE_OU_LA_GARDER, vendreOuGarder } from "../../src/config/cours/situations/par-chapitre/vendre-la-ligne-ou-la-garder";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { reponseSansIndice } from "./gardes-de-l-ue10";

/**
 * LE TEST DE DÉPRÉCIATION D'UNE IMMOBILISATION (DCG UE10), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : la première ligne, 60 000 € en service le 6 janvier N, 6 ans en linéaire :
 * 9 861,11 € en N (355 jours), 10 000 € en N + 1, 40 138,89 € de valeur nette au 31 décembre N + 1 ;
 * 4 flux de 10 000 € à 6 %, valeur vénale 26 000 €.
 */

const etapeQuestion = (id: string) => {
  const e = CH.etapes.find((x) => x.id === id)!;
  if (e.type !== "montants") throw new Error("montants attendus");
  return e.question(NOVA, { soldes: {} });
};
const r2 = (x: number) => Math.round(x * 100) / 100;
const facteur = (t: number, n: number) => (1 - (1 + t) ** -n) / t;

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 4, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(CH, PROGRAMME["dcg-comptabilite-approfondie"][4]!);
    expect(CH.blocs).toContain("DCG UE10 · Comptabilité approfondie");
    gardeDuCas(VENDRE_LA_LIGNE_OU_LA_GARDER, CH);
    reponseSansIndice(VENDRE_LA_LIGNE_OU_LA_GARDER);
  });

  it("K3 : étiqueté BTS CG P2 ; les étapes qui actualisent se disent au-delà du BTS, les autres non", () => {
    expect(CH.blocs).toContain("BTS CG P2 · Contrôle et production de l'information financière");
    expect(CH.blocs.some((b) => b.startsWith("BTS CG P3"))).toBe(false);
    const auDela = CH.etapes.filter((e) => e.titre.includes("(au-delà du BTS)")).map((e) => e.id);
    expect(auDela).toEqual(["la-valeur-d-usage", "le-flux-qui-suffit", "le-laboratoire-du-taux"]);
    const intro = CH.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("lecture attendue");
    expect(intro.texte(NOVA).join(" ")).toContain("Au BTS CG, la valeur actuelle est donnée");
    expect(etapeQuestion("la-depreciation")).toContain("Au BTS CG, l'énoncé donnerait la valeur actuelle");
  });

  it("textes propres, une seule bonne réponse, notions existantes, servis par le serveur", () => {
    gardesDeTexte(CH);
    reponseSansIndice(CH);
  });
});

describe("le test", () => {
  it("valeur nette 40 138,89 €, facteur 3,4651, valeur d'usage 34 651 € (10 000 € × le facteur arrondi), valeur actuelle la valeur d'usage", () => {
    const vnc = r2(60_000 - r2((10_000 * 355) / 360) - 10_000);
    expect(vnc).toBe(40_138.89);
    const f = facteur(0.06, 4);
    expect(Math.round(f * 10_000) / 10_000).toBe(3.4651);
    // Le facteur se donne au dix-millième, et la valeur d'usage part de lui (deux-decimales.ts) : 34 651 €, et non 34 651,06 €.
    expect(attendus(CH, "la-valeur-d-usage")).toEqual([vnc, 3.4651, r2(10_000 * 3.4651), r2(10_000 * 3.4651)]);
    expect(r2(10_000 * 3.4651)).toBe(34_651);
    expect(juste(CH, "l-indice")).toEqual(["Une technique nouvelle fait chuter le prix des lignes"]);
  });

  it("dépréciation 5 487,89 €, puis 34 651 ÷ 4 = 8 662,75 € par an", () => {
    expect(attendus(CH, "la-depreciation")).toEqual([r2(40_138.89 - 34_651)]);
    expect(attendus(CH, "la-depreciation")).toEqual([5_487.89]);
    expect(attendus(CH, "le-nouveau-plan")).toEqual([r2(34_651 / 4)]);
  });

  it("le curseur : 11 584 € par an rejoignent la valeur nette, 11 583 € n'y suffisent pas", () => {
    const f = facteur(0.06, 4);
    expect([11_584 * f >= 40_138.89, 11_583 * f >= 40_138.89]).toEqual([true, false]);
    gardeDuCurseur(CH, "le-flux-qui-suffit", 11_584);
  });

  it("le laboratoire : à 7 %, 6 266,89 € ; à 8 %, 7 017,89 €, le plus petit taux au-dessus de 7 000 €", () => {
    // Chaque facteur au dix-millième (3,3872 et 3,3121), comme sur la copie.
    expect(r2(40_138.89 - r2(10_000 * (Math.round(facteur(0.07, 4) * 10_000) / 10_000)))).toBe(6_266.89);
    expect(r2(40_138.89 - r2(10_000 * (Math.round(facteur(0.08, 4) * 10_000) / 10_000)))).toBe(7_017.89);
    const e = gardeDuLaboratoire(CH, "le-laboratoire-du-taux");
    expect(e.defi(NOVA).solution).toEqual({ taux: 8 });
  });
});

describe("le cas du chapitre", () => {
  it("l'offre de 30 000 € reste sous la valeur d'usage : garder, déprécier de 5 487,89 € ; la vente perdrait 10 138,89 €", () => {
    const k = vendreOuGarder();
    expect([k.valeurActuelle, k.depreciation, k.moinsValue, k.garder]).toEqual([34_651, r2(40_138.89 - 34_651), r2(40_138.89 - 30_000), true]);
  });
});
