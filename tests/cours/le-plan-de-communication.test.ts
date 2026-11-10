import { describe, expect, it } from "vitest";
import { LE_PLAN_DE_COMMUNICATION as CH } from "../../src/config/cours/chapitres/le-plan-de-communication";
import { adhesionsQuiPaient, campagneAvec, meilleurSupport } from "../../src/config/cours/monde/volt-fitness";
import { TOUTE_LA_CAMPAGNE_A_LA_RADIO, touteLaCampagneALaRadio } from "../../src/config/cours/situations/par-chapitre/toute-la-campagne-a-la-radio";
import { attendusMk, gardeDuCasMk, gardeDuCurseurMk, gardeDuProgrammeMk, gardesDeTexteMk, justeMk, triMk } from "./gardes-de-la-mercatique";

/**
 * « LE PLAN DE COMMUNICATION » (mercatique 3.1), ET SON CAS, CHEZ VOLT FITNESS.
 *
 * Refait à la main sur le cas figé : 105 − 15 = 90 € par mois ; 4 mois : 360 € ; 3 600 ÷ 360 = 10
 * adhésions. Les abribus : 1 200 ÷ 40 000 × 1 000 = 30 € ; la radio : 900 ÷ 60 000 × 1 000 = 15 €. Dans la
 * cible : 1 200 ÷ 12 000, 900 ÷ 9 000 (100 € les mille), 1 500 ÷ 40 000 (37,50 € les mille). Le cas : 3 600 ÷
 * 900 × 9 000 = 36 000 contacts dans la cible à la radio, 3 600 ÷ 1 500 × 40 000 = 96 000 en ligne.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 3 de la mercatique, se joue chez VOLT FITNESS", () => {
    gardeDuProgrammeMk(CH, "STMG Thème 3 · La communication de l'offre");
    expect(CH.entreprises?.codes).toEqual(["fitness"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteMk(CH);
  });
});

describe("objectif, cible, moyens", () => {
  it("un objectif conatif, une cible relais ; six moyens, un chacun", () => {
    expect(justeMk(CH, "l-objectif")).toEqual(["Conatif : faire agir"]);
    expect(justeMk(CH, "la-cible")[0]).toMatch(/relais/);
    expect(new Set(Object.values(triMk(CH, "les-moyens"))).size).toBe(6);
    expect(justeMk(CH, "parrainage-ou-mecenat")).toEqual(["Elle attend une contrepartie"]);
  });

  it("le coût pour mille : 30 € et 15 € ; dans la cible, le réseau social l'emporte", () => {
    expect(attendusMk(CH, "le-cout-pour-mille")).toEqual([30, 15]);
    expect(meilleurSupport()).toMatchObject({ code: "reseau", coutPourMilleUtiles: 37.5 });
    expect(justeMk(CH, "le-bon-support")[0]).toMatch(/^Internet/);
  });

  it("le curseur : 10 adhésions paient la campagne, 9 non", () => {
    expect(adhesionsQuiPaient()).toBe(10);
    expect(campagneAvec(9).gain).toBe(-360);
    gardeDuCurseurMk(CH, "les-adhesions-qui-paient", 10);
  });
});

describe("le cas du chapitre", () => {
  it("100 € et 37,50 € les mille dans la cible ; 36 000 contacts à la radio, 96 000 en ligne", () => {
    gardeDuCasMk(TOUTE_LA_CAMPAGNE_A_LA_RADIO, CH);
    const r = touteLaCampagneALaRadio();
    expect([r.radio.coutPourMilleUtiles, r.meilleur.coutPourMilleUtiles, r.utilesRadio, r.utilesMeilleur]).toEqual([100, 37.5, 36_000, 96_000]);
    expect(justeMk(TOUTE_LA_CAMPAGNE_A_LA_RADIO, "reponse")[0]).toMatch(/^Plutôt internet/);
  });
});
