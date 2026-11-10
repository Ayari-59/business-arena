import { describe, expect, it } from "vitest";
import { LES_POLITIQUES_TARIFAIRES as CH } from "../../src/config/cours/chapitres/les-politiques-tarifaires";
import { prixDEteQuiRemplit, trimestreAuPrix } from "../../src/config/cours/monde/tarifs-de-l-escale";
import { LE_CONGRES_DE_JUILLET, leCongresDeJuillet } from "../../src/config/cours/situations/par-chapitre/le-congres-de-juillet";
import { attendusMk, casDuChapitreMk, gardeDuCasMk, gardeDuLaboratoireMk, gardeDuProgrammeMk, gardesDeTexteMk, justeMk } from "./gardes-de-la-mercatique";

/**
 * « LES POLITIQUES TARIFAIRES » (mercatique 1.3), ET SON CAS, CHEZ L'ESCALE.
 *
 * Refait à la main sur l-escale.ts : 88 − 21 = 67 € ; 67 ÷ 21 = 319 %. Une hausse de 10 % : 1 − 1,1 ^ −1,5 =
 * 13,3 %. L'été à 88 € : 700 + 5 300 + 400 = 6 400 demandées pour 60 × 90 = 5 400 : 1 000 refusées ;
 * l'hiver, 1 300 + 1 000 + 1 100 = 3 400 : 2 000 vides. À 98 €, la demande de l'été (arrondie clientèle par
 * clientèle) vaut 5 446 ≥ 5 400 ; à 99 €, 5 364. Le forfait : 2 × 88 + 2 × 34 = 244 € ; 199 − (2 × 21 +
 * 2 × 30) = 97 €. La chambre affaires : 99 − 70 = 29 € de coût cible, 21 + 6 = 27 € prévus. Le congrès :
 * 1 000 × 54 = 54 000 € contre 1 000 × 67 = 67 000 € : −13 000 € ; l'hiver, 2 000 chambres vides : 54 000 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 1 de la mercatique, se joue chez L'ESCALE", () => {
    gardeDuProgrammeMk(CH, "STMG Thème 1 · La définition de l'offre");
    expect(CH.entreprises?.codes).toEqual(["hotel"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteMk(CH);
  });
});

describe("du prix unique au prix différencié", () => {
  it("67 € de marge, 319,05 % de taux de marge ; 13,32 % de demande en moins pour 10 % de hausse", () => {
    expect(attendusMk(CH, "la-marge")).toEqual([67, 319.05]);
    expect(justeMk(CH, "la-sensibilite")[0]).toBe("Elle baisse d'environ 13,32 %");
  });

  it("1 000 nuitées refusées l'été, 2 000 vides l'hiver", () => {
    expect(attendusMk(CH, "refusees-et-vides")).toEqual([1_000, 2_000]);
  });

  it("le laboratoire : 98 € remplissent encore l'été, 99 € non ; une seule solution", () => {
    expect(prixDEteQuiRemplit()).toBe(98);
    expect(trimestreAuPrix(3, 98)).toMatchObject({ demande: 5_446, vides: 0 });
    expect(trimestreAuPrix(3, 99)).toMatchObject({ demande: 5_364, vides: 36 });
    expect(gardeDuLaboratoireMk(CH, "le-laboratoire-de-l-ete").defi(casDuChapitreMk(CH)).solution).toEqual({ prix: 98 });
  });
});

describe("forfait, gratuité, prix cible", () => {
  it("le forfait : 244 € sans forfait, 97 € de marge", () => {
    expect(attendusMk(CH, "le-forfait")).toEqual([244, 97]);
  });

  it("le prix cible : 29 € de coût cible, 27 € prévus", () => {
    expect(attendusMk(CH, "le-prix-cible")).toEqual([29, 27]);
  });
});

describe("le cas du chapitre", () => {
  it("juillet : −13 000 € ; l'hiver, 54 000 € de marge sur des chambres vides", () => {
    gardeDuCasMk(LE_CONGRES_DE_JUILLET, CH);
    const r = leCongresDeJuillet();
    expect([r.margeDuCongres, r.margePerdue, r.ecart, r.videsDeLHiver, r.margeEnHiver]).toEqual([54_000, 67_000, -13_000, 2_000, 54_000]);
    expect(justeMk(LE_CONGRES_DE_JUILLET, "reponse")).toEqual(["Proposons-lui l'hiver, pas juillet"]);
  });
});
