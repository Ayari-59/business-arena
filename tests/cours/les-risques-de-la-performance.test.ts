import { describe, expect, it } from "vitest";
import { LES_RISQUES_DE_LA_PERFORMANCE as CH } from "../../src/config/cours/chapitres/les-risques-de-la-performance";
import { PART_LA_PLUS_SURE, PRIX_DU_JEU_LE_PLUS_HAUT, anneeDesRisques, diversifier } from "../../src/config/cours/monde/risques-de-nova";
import { DEUX_MOIS_SANS_COMPOSANTS, deuxMoisSansComposants } from "../../src/config/cours/situations/par-chapitre/deux-mois-sans-composants";
import { attendusSgn, gardeDuCasSgn, gardeDuCurseurSgn, gardeDuLaboratoireSgn, gardeDuProgrammeSgn, gardesDeTexteSgn, justeSgn, triSgn } from "./gardes-de-la-sgn";

/**
 * « LES RISQUES DE LA PERFORMANCE » (SGN T4.2), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main sur l'année N : 23 564 enceintes, 100 162,89 € de résultat d'activité, 59 − 38 = 21 € de
 * marge par enceinte. Les risques : 22 × 10 % × 23 564 = 51 840,80 € ; 23 564 × 15 % × 21 = 74 226,60 € ;
 * 23 564 ÷ 12 × 21 = 41 237 €. Le curseur : 22 + 100 162,89 ÷ 23 564 = 26,25 : 26 €. Le laboratoire, pire
 * des cas = résultat − part × 23 564 − max(part, 1 − part) × 41 237 : 0 % → 58 925,89 ; 25 % → 63 344,14 ;
 * 50 % → 67 762,39 ; 75 % → 51 562,14 ; 100 % → 35 361,89. Le cas, deux mois : 17 688,89 € seul,
 * 47 143,89 € à deux.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 4 de la SGN, se joue chez NOVA", () => {
    gardeDuProgrammeSgn(CH, "STMG Thème 4 · Temps et risque");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteSgn(CH);
  });
});

describe("les risques chiffrés", () => {
  it("l'année N et trois risques", () => {
    const a = anneeDesRisques();
    expect([a.quantite, a.resultat, a.margeUnitaire]).toEqual([23_564, 100_162.89, 21]);
    expect(attendusSgn(CH, "trois-risques")).toEqual([51_840.8, 74_226.6, 41_237]);
  });

  it("le curseur : 26 € le jeu au plus", () => {
    expect(PRIX_DU_JEU_LE_PLUS_HAUT).toBe(26);
    gardeDuCurseurSgn(CH, "le-prix-que-supporte-le-resultat", 26);
  });

  it("le laboratoire : la moitié chez le second fournisseur, seule solution", () => {
    expect(PART_LA_PLUS_SURE).toBe(0.5);
    expect([0, 0.25, 0.5, 0.75, 1].map((p) => diversifier(p).pireDesCas)).toEqual([58_925.89, 63_344.14, 67_762.39, 51_562.14, 35_361.89]);
    gardeDuLaboratoireSgn(CH, "diversifier");
  });

  it("les risques internes et externes ; la maturité ; la rupture technologique", () => {
    expect(triSgn(CH, "internes-ou-externes")["Une nouvelle norme sans fil, que les enceintes ne lisent pas"]).toBe("externe");
    expect(justeSgn(CH, "le-cycle-de-vie")[0]).toMatch(/^En maturité/);
  });
});

describe("le cas du chapitre", () => {
  it("deux mois sans composants : 17 688,89 € seul, 47 143,89 € à deux fournisseurs", () => {
    gardeDuCasSgn(DEUX_MOIS_SANS_COMPOSANTS, CH);
    const k = deuxMoisSansComposants();
    expect([k.seul.pireDesCas, k.partage.pireDesCas, k.gain]).toEqual([17_688.89, 47_143.89, 29_455]);
  });
});
