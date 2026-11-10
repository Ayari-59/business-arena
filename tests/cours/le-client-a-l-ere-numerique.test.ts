import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { LE_CLIENT_A_L_ERE_NUMERIQUE as CH } from "../../src/config/cours/chapitres/le-client-a-l-ere-numerique";
import { discussionEnLigne, relances } from "../../src/config/cours/monde/client-numerique-de-maille";
import { UN_CONSEILLER_EN_LIGNE } from "../../src/config/cours/situations/par-chapitre/un-conseiller-en-ligne";
import { attendusT, gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « LE CLIENT À L'ÈRE NUMÉRIQUE » (enseignement commun de terminale, 2.2, lot C STMG), ET SON CAS, CHEZ
 * MAILLE & CO.
 *
 * Refait à la main : 120 ÷ 6 000 = 2 % ; 360 − 120 = 240 paniers abandonnés, 66,67 %. Une fidèle laisse
 * 57,76 € par passage. Les relances : 18 × 57,76 − 1 × 2 × 57,76 = 924,16 € ; 27 × 57,76 − 3 × 115,52 =
 * 1 212,96 € ; 30 × 57,76 − 9 × 115,52 = 693,12 €. Le cas : 15 × 57,76 − 450 = 416,40 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 2 de la partie commune, se joue chez MAILLE & CO", () => {
    gardeDuProgrammeT(CH, "STMG Thème 2 · Les organisations et les acteurs");
    expect(CH.entreprises?.codes).toEqual(["boutique"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé, et le CRM bien écrit", () => {
    const ch = gardesDeTexteT(CH);
    expect(JSON.stringify(ch.etapes.map((e) => (e.type === "lecture" ? e.texte(casDeLEntreprise("boutique")) : [])))).toContain("Customer Relationship Management");
  });
});

describe("le tunnel et les relances", () => {
  it("le tunnel : 2 %, 240 paniers abandonnés, 66,67 %", () => {
    expect(attendusT(CH, "le-tunnel")).toEqual([2, 240, 66.67]);
  });

  it("le laboratoire : 2 relances", () => {
    const e = gardeDuLaboratoireT(CH, "le-laboratoire-des-relances");
    expect(e.defi(null as never).solution).toEqual({ relances: 2 });
    expect([1, 2, 3].map((k) => relances(k).gain)).toEqual([924.16, 1_212.96, 693.12]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "les-facteurs"))).toEqual(["besoin", "motivation", "frein", "attitude"]);
    expect(Object.values(triT(CH, "les-traces"))).toEqual(["volontaire", "volontaire", "trace", "trace"]);
    expect(justeT(CH, "le-consentement")[0]).toMatch(/^Non/);
  });
});

describe("le cas du chapitre", () => {
  it("la discussion en ligne : 15 commandes de plus, 866,40 € de marge, 416,40 € de gain", () => {
    gardeDuCasT(UN_CONSEILLER_EN_LIGNE, CH);
    expect(discussionEnLigne()).toMatchObject({ enPlus: 15, marge: 866.4, gain: 416.4 });
  });
});
