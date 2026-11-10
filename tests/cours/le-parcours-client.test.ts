import { describe, expect, it } from "vitest";
import { LE_PARCOURS_CLIENT as CH } from "../../src/config/cours/chapitres/le-parcours-client";
import { moisDuModule, reservationsQuiPaient } from "../../src/config/cours/monde/parcours-client-de-la-boutique";
import { LE_MODULE_AUGMENTE, leModuleAugmente } from "../../src/config/cours/situations/par-chapitre/le-module-augmente";
import { attendusMk, gardeDuCasMk, gardeDuCurseurMk, gardeDuProgrammeMk, gardesDeTexteMk, justeMk, triMk } from "./gardes-de-la-mercatique";

/**
 * « LE PARCOURS CLIENT » (mercatique 2.2), ET SON CAS, CHEZ MAILLE & CO.
 *
 * Refait à la main : 282 ÷ 940 = 30 % ; 48 ÷ (900 + 1 100 + 700 + 1 300) = 1,2 %. Une vente à une passante
 * laisse 19 310 ÷ 600 = 32,18 € ; une réservation, 32,18 × 60 % = 19,31 € ; 20 réservations : 386,20 −
 * 250 = 136,20 € ; 250 ÷ 19,31 = 12,9 : 13 réservations. Le cas : 18 × 19,31 − 400 = −52,42 € ; 400 ÷
 * 19,31 = 20,7 : 21 réservations.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 2 de la mercatique, se joue chez MAILLE & CO", () => {
    gardeDuProgrammeMk(CH, "STMG Thème 2 · La distribution de l'offre");
    expect(CH.entreprises?.codes).toEqual(["boutique"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteMk(CH);
  });
});

describe("le parcours", () => {
  it("30 % des passages préparés par le site, qui ne transforme que 1,2 % de ses visites", () => {
    expect(attendusMk(CH, "le-poids-du-site")).toEqual([30, 1.2]);
    expect(justeMk(CH, "le-ropo")[0]).toMatch(/^Le ROPO/);
  });

  it("multicanal, cross-canal, omnicanal : deux pratiques chacun", () => {
    const t = Object.values(triMk(CH, "trois-facons"));
    for (const k of ["multicanal", "cross-canal", "omnicanal"]) expect(t.filter((x) => x === k)).toHaveLength(2);
  });
});

describe("le module de réservation", () => {
  it("19,31 € par réservation ; 136,20 € avec 20 réservations", () => {
    expect(attendusMk(CH, "la-marge-d-une-reservation")).toEqual([19.31, 136.2]);
  });

  it("le curseur : 13 réservations paient le module, 12 non", () => {
    expect(reservationsQuiPaient()).toBe(13);
    expect(moisDuModule(12).gain).toBeLessThan(0);
    gardeDuCurseurMk(CH, "les-reservations-qui-paient", 13);
  });
});

describe("le cas du chapitre", () => {
  it("à 400 € : −52,42 € avec 18 réservations ; il en faut 21", () => {
    gardeDuCasMk(LE_MODULE_AUGMENTE, CH);
    const r = leModuleAugmente();
    expect([r.gain, r.seuil, r.seuilAvant, r.gainAvant]).toEqual([-52.42, 21, 13, 97.58]);
    expect(justeMk(LE_MODULE_AUGMENTE, "reponse")[0]).toMatch(/^Gardons-le s'il atteint 21/);
  });
});
