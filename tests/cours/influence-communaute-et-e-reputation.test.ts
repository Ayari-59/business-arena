import { describe, expect, it } from "vitest";
import { INFLUENCE_COMMUNAUTE_ET_E_REPUTATION as CH } from "../../src/config/cours/chapitres/influence-communaute-et-e-reputation";
import { valeurDUnContact } from "../../src/config/cours/monde/volt-fitness";
import { L_INFLUENCEUSE_DU_HAUT_VERDASSE } from "../../src/config/cours/situations/par-chapitre/l-influenceuse-du-haut-verdasse";
import { attendusMk, gardeDuCasMk, gardeDuCurseurMk, gardeDuProgrammeMk, gardesDeTexteMk, justeMk, triMk } from "./gardes-de-la-mercatique";

/**
 * « INFLUENCE, COMMUNAUTÉ ET E-RÉPUTATION » (mercatique 3.2), ET SON CAS, CHEZ VOLT FITNESS.
 *
 * Refait à la main : 450 ÷ 30 000 = 1,5 % ; 1 200 ÷ 60 = 20 € par lead ; 15 ÷ 60 = 25 % ; 1 200 ÷ 15 = 80 €
 * par adhésion. Un contact vaut 25 % × 360 = 90 €. Le cas : 9 000 × 2 % = 180 clics, × 25 % = 45 contacts,
 * 1 500 ÷ 45 = 33,33 € ; 45 × 25 % = 11,25 : 11 adhésions, 11 × 360 − 1 500 = 2 460 €.
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

describe("les mesures de la campagne", () => {
  it("1,5 % de clics, 20 € par lead ; 25 % de transformation, 80 € par adhésion", () => {
    expect(attendusMk(CH, "clic-et-lead")).toEqual([1.5, 20]);
    expect(attendusMk(CH, "jusqu-a-l-adhesion")).toEqual([25, 80]);
  });

  it("le curseur : un contact peut coûter 90 € au plus", () => {
    expect(valeurDUnContact()).toBe(90);
    gardeDuCurseurMk(CH, "ce-qu-un-contact-peut-couter", 90);
  });

  it("la micro-influence, le community management, buzz, viralité, e-réputation, la crise", () => {
    expect(justeMk(CH, "l-influenceuse")).toEqual(["La sportive du territoire"]);
    expect(new Set(Object.values(triMk(CH, "buzz-viral-reputation"))).size).toBe(4);
    expect(justeMk(CH, "la-crise")[0]).toMatch(/^Elle répond vite/);
  });
});

describe("le cas du chapitre", () => {
  it("180 clics, 45 contacts, 33,33 € par lead ; 11 adhésions, 2 460 €", () => {
    gardeDuCasMk(L_INFLUENCEUSE_DU_HAUT_VERDASSE, CH);
    expect(attendusMk(L_INFLUENCEUSE_DU_HAUT_VERDASSE, "les-contacts")).toEqual([180, 45, 33.33]);
    expect(attendusMk(L_INFLUENCEUSE_DU_HAUT_VERDASSE, "les-adhesions")).toEqual([11, 2_460]);
    expect(justeMk(L_INFLUENCEUSE_DU_HAUT_VERDASSE, "reponse")[0]).toMatch(/^Acceptons : un contact coûterait 33,33/);
  });
});
