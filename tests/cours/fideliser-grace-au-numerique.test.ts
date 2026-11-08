import { describe, expect, it } from "vitest";
import { FIDELISER_GRACE_AU_NUMERIQUE as CH } from "../../src/config/cours/chapitres/fideliser-grace-au-numerique";
import { relanceDesAnciennes, retoursQuiPaient } from "../../src/config/cours/monde/relation-numerique-de-la-boutique";
import { RELANCER_LES_DORMANTES, relancerLesDormantes } from "../../src/config/cours/situations/par-chapitre/relancer-les-dormantes";
import { attendusMk, gardeDuCasMk, gardeDuCurseurMk, gardeDuProgrammeMk, gardesDeTexteMk, justeMk, triMk } from "./gardes-de-la-mercatique";

/**
 * « FIDÉLISER GRÂCE AU NUMÉRIQUE » (mercatique 3.2), ET SON CAS, CHEZ MAILLE & CO.
 *
 * Refait à la main sur clientele-de-la-boutique.ts : 19 640 € de marge pour 340 passages : 57,76 € ; 1 ÷ 5 % =
 * 20 mois ; 57,76 × 20 = 1 155,20 €. Le fichier : 300 + 110 = 410 clientes à qui écrire, 410 × 0,08 =
 * 32,80 €. La relance : 57,76 − 10 = 47,76 € ; 110 × 0,08 + 120 = 128,80 € ; 128,80 ÷ 47,76 = 2,7 : 3
 * retours. Le cas : 8 × 47,76 − 128,80 = 253,28 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 3 de la mercatique, se joue chez MAILLE & CO", () => {
    gardeDuProgrammeMk(CH, "STMG Thème 3 · La communication de l'offre");
    expect(CH.entreprises?.codes).toEqual(["boutique"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteMk(CH);
  });
});

describe("la fidélité et ce qu'elle vaut", () => {
  it("trois facteurs, deux raisons chacun", () => {
    const t = Object.values(triMk(CH, "ce-qui-retient"));
    for (const k of ["satisfaction", "avantages", "habitude"]) expect(t.filter((x) => x === k)).toHaveLength(2);
  });

  it("20 mois de durée de vie, 1 155,20 € de valeur vie", () => {
    expect(attendusMk(CH, "la-valeur-vie")).toEqual([20, 1_155.2]);
  });

  it("410 clientes à qui écrire, 32,80 € de SMS ; une cliente qui a refusé ne reçoit rien", () => {
    expect(attendusMk(CH, "qui-contacter")).toEqual([410, 32.8]);
    expect(justeMk(CH, "le-consentement")).toEqual(["Non : elle a refusé les offres"]);
  });
});

describe("la relance", () => {
  it("47,76 € par retour, 128,80 € de relance hors bons", () => {
    expect(attendusMk(CH, "la-relance")).toEqual([47.76, 128.8]);
  });

  it("le curseur : 3 retours paient la relance, 2 non", () => {
    expect(retoursQuiPaient()).toBe(3);
    expect(relanceDesAnciennes(2).gain).toBeLessThan(0);
    gardeDuCurseurMk(CH, "les-retours-qui-paient", 3);
  });
});

describe("le cas du chapitre", () => {
  it("253,28 € avec 8 retours ; les dormantes s'effacent", () => {
    gardeDuCasMk(RELANCER_LES_DORMANTES, CH);
    const r = relancerLesDormantes();
    expect([r.gain, r.seuil, r.dormantes.cartes, r.ans]).toEqual([253.28, 3, 240, 3]);
    expect(justeMk(RELANCER_LES_DORMANTES, "reponse")[0]).toMatch(/dormantes s'effacent/);
  });
});
