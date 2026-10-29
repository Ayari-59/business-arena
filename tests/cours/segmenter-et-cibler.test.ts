import { describe, expect, it } from "vitest";
import { SEGMENTATIONS, SEGMENTER_ET_CIBLER } from "../../src/config/cours/chapitres/segmenter-et-cibler";
import { PROGRAMME } from "../../src/config/cours/registre";
import { POINTS_A_GAGNER, QUEL_SEGMENT_CONQUERIR, segmentAConquerir } from "../../src/config/cours/situations/par-chapitre/quel-segment-conquerir";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte, juste } from "./gardes-du-marche";

/**
 * SEGMENTER ET CIBLER (bac STMG mercatique, palier 1), SUR LES CLIENTÈLES DE NOVA DU MONDE DU COURS,
 * ET SON CAS : QUEL SEGMENT CONQUÉRIR ?
 *
 * Refait à la main sur la fiche (monde/mercatique-de-nova.ts) : à 59 €, les étudiants demandent
 * 9 555 − 140 × 59 = 1 295 enceintes, les familles 5 000 − 55 × 59 = 1 755, les mélomanes
 * 2 200 − 8 × 59 = 1 728 ; les segments achètent 9 000, 5 600 et 3 500 enceintes ; 38 € de coût
 * variable.
 */

const d = (x: number) => Math.round(x * 10) / 10;
const etudiants = (p: number) => 9_555 - 140 * p;
const CA = (1_295 + 1_755 + 1_728) * 59;

describe("segmenter et cibler", () => {
  it("au programme du bac STMG, chez NOVA seule, et son cas lui est dédié", () => {
    expect(PROGRAMME.stmg[1]).toContain(SEGMENTER_ET_CIBLER.titre);
    expect([...SEGMENTATIONS]).toEqual(["nova"]);
    gardeDuCas(QUEL_SEGMENT_CONQUERIR, SEGMENTER_ET_CIBLER);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(SEGMENTER_ET_CIBLER);
  });

  it("les familles pèsent le plus (36,7 %) ; les étudiants gardent la plus grosse réserve (7 705 achats ailleurs) et sont les plus sensibles au prix", () => {
    expect(attendus(SEGMENTER_ET_CIBLER, "poids")).toEqual([d(((1_755 * 59) / CA) * 100), d((1_755 / 5_600) * 100), 5_600 - 1_755]);
    expect(juste(SEGMENTER_ET_CIBLER, "reserve")).toEqual(["Étudiants"]);
    expect(juste(SEGMENTER_ET_CIBLER, "cible-premium")).toEqual(["Mélomanes"]);
    expect(juste(SEGMENTER_ET_CIBLER, "cible-promotion")).toEqual(["Étudiants"]);
  });

  it("le curseur : un tarif étudiant à 48 € garde la marge de 59 € (2 835 × 10 = 28 350 € contre 1 295 × 21 = 27 195 €) ; à 47 €, 26 775 €", () => {
    const e = gardeDuCurseur(SEGMENTER_ET_CIBLER, "le-tarif-etudiant", 48);
    expect(e.droites(NOVA).produit(48)).toBe(etudiants(48) * 10);
    expect(e.droites(NOVA).cout(0)).toBe(etudiants(59) * 21);
    expect(e.droites(NOVA).produit(47)).toBe(2_975 * 9);
  });

  it("le laboratoire : 53 € laisse la plus grande marge sur les étudiants, 2 135 × 15 = 32 025 €", () => {
    const e = gardeDuLaboratoire(SEGMENTER_ET_CIBLER, "le-laboratoire-du-tarif");
    expect(e.defi(NOVA).solution).toEqual({ tarif: 53 });
    expect(etudiants(53) * 15).toBe(32_025);
    expect(etudiants(52.5) * 14.5).toBeLessThan(32_025);
    expect(etudiants(53.5) * 15.5).toBeLessThan(32_025);
  });
});

describe("quel segment conquérir ?", () => {
  it("5 points de chaque segment : 450, 280 et 175 enceintes ; les étudiants, 26 550 € et 9 450 €", () => {
    const r = segmentAConquerir(NOVA);
    expect(r.segments.map((k) => k.ventesEnPlus)).toEqual([9_000, 5_600, 3_500].map((t) => Math.round((t * POINTS_A_GAGNER) / 100)));
    expect([r.meilleur.nom, r.caEnPlus, r.margeEnPlus]).toEqual(["Étudiants", 450 * 59, 450 * 21]);
    expect([r.ventesSurNosVentes, r.plusForte.nom]).toEqual([Math.round(1_295 * 0.05), "Mélomanes"]);
    expect(juste(QUEL_SEGMENT_CONQUERIR, "reponse").length).toBe(1);
  });
});
