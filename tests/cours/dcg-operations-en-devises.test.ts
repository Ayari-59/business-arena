import { describe, expect, it } from "vitest";
import { LES_OPERATIONS_EN_DEVISES as CH } from "../../src/config/cours/chapitres/les-operations-en-devises";
import { PROGRAMME } from "../../src/config/cours/registre";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { COUVRIR_LA_CREANCE_EN_DOLLARS, creanceCouverte } from "../../src/config/cours/situations/par-chapitre/couvrir-la-creance-en-dollars";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { reponseSansIndice } from "./gardes-de-l-ue10";

/**
 * LES OPÉRATIONS EN DEVISES (DCG UE10), ET LEUR CAS, CHEZ NOVA.
 *
 * Refait à la main : 2 000 enceintes × 70 $ = 140 000 $ ; 1 $ = 0,91 € à la vente, 0,89 € à la
 * clôture, 0,92 € au paiement ; une dette de 50 000 $ à la même échéance.
 */

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 4, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(CH, PROGRAMME["dcg-comptabilite-approfondie"][4]!);
    expect(CH.blocs).toContain("DCG UE10 · Comptabilité approfondie");
    gardeDuCas(COUVRIR_LA_CREANCE_EN_DOLLARS, CH);
    reponseSansIndice(COUVRIR_LA_CREANCE_EN_DOLLARS);
  });

  it("textes propres, une seule bonne réponse, notions existantes, servis par le serveur", () => {
    gardesDeTexte(CH);
    reponseSansIndice(CH);
  });
});

describe("la créance et la dette en dollars", () => {
  it("la créance : 127 400 € à la vente, 124 600 € à la clôture, 2 800 € d'écart", () => {
    expect([140_000 * 0.91, 140_000 * 0.89].map((x) => Math.round(x * 100) / 100)).toEqual([127_400, 124_600]);
    expect(attendus(CH, "la-conversion")).toEqual([124_600, 127_400 - 124_600]);
  });

  it("la dette gagne 50 000 × 0,02 = 1 000 € ; la position globale ne provisionne que 2 800 − 1 000 = 1 800 €", () => {
    expect(juste(CH, "la-dette")).toEqual([`Un écart de ${montantEcrit(Math.round(50_000 * (0.91 - 0.89)))} au 477, sans produit`]);
    expect(attendus(CH, "la-position-globale")).toEqual([2_800, 2_800 - 1_000]);
  });

  it("au paiement, 140 000 × 0,92 = 128 800 € : 1 400 € de gain de change réalisé", () => {
    expect(juste(CH, "le-reglement")).toEqual([`Un gain de change réalisé de ${montantEcrit(Math.round(140_000 * (0.92 - 0.91)))}`]);
  });

  it("le curseur : 910 € pour 1 000 $, le cours de la vente ; à 909 €, la créance perd", () => {
    expect([140 * 910 >= 127_400, 140 * 909 >= 127_400]).toEqual([true, false]);
    gardeDuCurseur(CH, "le-cours-sans-perte", 910);
  });

  it("le laboratoire : 3 600 € de provision à 0,87 €, (140 000 − 50 000) × (0,91 − 0,87)", () => {
    expect(Math.round(90_000 * (0.91 - 0.87))).toBe(3_600);
    const e = gardeDuLaboratoire(CH, "le-laboratoire-du-change");
    expect(e.defi(NOVA).solution).toEqual({ cours: 0.87 });
  });
});

describe("le cas du chapitre", () => {
  it("couverte à 0,90 € : 126 000 € figés, 1 400 € de coût, aucune provision ; 2 800 € manqués au paiement", () => {
    const k = creanceCouverte();
    expect([k.fige, k.coutDeLaCouverture, k.provisionCouverte, k.manqueAuPaiement]).toEqual([140_000 * 0.9, 127_400 - 126_000, 0, 128_800 - 126_000]);
  });
});
