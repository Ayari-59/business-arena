import { describe, expect, it } from "vitest";
import { UNE_OFFRE_POUR_UN_BESOIN as CH } from "../../src/config/cours/chapitres/une-offre-pour-un-besoin";
import { LE_PACK_A_390_EUROS, lePackA390 } from "../../src/config/cours/situations/par-chapitre/le-pack-a-390-euros";
import { attendusT, gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « UNE OFFRE POUR UN BESOIN » (enseignement commun de terminale, 1.1, lot C STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 60 ÷ 80 = 75 % de réponses ; 15 ÷ 60 = 25 % ; 320 × 25 % = 80 clubs, 36 000 € à 450 €.
 * Valeur ajoutée de N : 1 390 276 − 1 136 242 = 254 034 € (18,3 %). Le pack : 80 × 450 = 36 000 €,
 * 80 × 210 = 16 800 €, 19 200 € de valeur ajoutée. Le freemium : 9 000 × 6 % = 540 abonnés × 36 € =
 * 19 440 € ≥ 18 000 € ; à 5 %, 450 × 36 = 16 200 €. Le cas : 320 × 21 ÷ 60 = 112 clubs × 180 € = 20 160 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite d'abord le thème 1 de la partie commune, se joue chez NOVA", () => {
    gardeDuProgrammeT(CH, "STMG Thème 1 · Les organisations et l'activité de production de biens et de services");
    expect(CH.entreprises?.codes).toEqual(["nova"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("l'étude, la valeur et le modèle", () => {
  it("le marché potentiel : 75 %, 25 %, 80 clubs, 36 000 €", () => {
    expect(attendusT(CH, "le-marche-potentiel")).toEqual([75, 25, 80, 36_000]);
  });

  it("la valeur ajoutée de N et celle du pack", () => {
    expect(attendusT(CH, "la-valeur-de-n")).toEqual([1_390_276 - 1_136_242, 18.3]);
    expect(attendusT(CH, "la-valeur-du-pack")).toEqual([36_000, 16_800, 19_200]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-approches"))).toEqual(["anticipatrice", "creative", "reactive", "mediatrice"]);
    expect(Object.values(triT(CH, "quatre-modeles"))).toEqual(["plateforme", "low-cost", "gratuite", "freemium"]);
    expect(justeT(CH, "la-demarche")[0]).toMatch(/^Partir du besoin/);
  });

  it("le laboratoire : 6 % d'abonnés paient l'application, 5 % ne la paient pas", () => {
    const e = gardeDuLaboratoireT(CH, "le-laboratoire-du-freemium");
    expect(e.defi(null as never).solution).toEqual({ conversion: 6 });
    expect([540 * 36 >= 18_000, 450 * 36 >= 18_000]).toEqual([true, false]);
  });
});

describe("le cas du chapitre", () => {
  it("à 390 €, 112 clubs et 20 160 € de valeur ajoutée, contre 19 200 € à 450 €", () => {
    gardeDuCasT(LE_PACK_A_390_EUROS, CH);
    const { cher, reduit } = lePackA390();
    expect([cher.clubs, cher.valeurAjoutee, reduit.clubs, reduit.valeurAjoutee]).toEqual([80, 19_200, 112, 20_160]);
    expect(justeT(LE_PACK_A_390_EUROS, "reponse")[0]).toMatch(/^390/);
  });
});
