import { describe, expect, it } from "vitest";
import { POSITIONNER_L_OFFRE as CH } from "../../src/config/cours/chapitres/positionner-l-offre";
import { commandeGravee, gammeDuMois, plusPetiteCommandeGravee, positionsDuMarche, supplementQuiPaie } from "../../src/config/cours/monde/offre-de-nova";
import { CAMPUSTECH_VEUT_SON_LOGO, campusTechVeutSonLogo } from "../../src/config/cours/situations/par-chapitre/campustech-veut-son-logo";
import { attendusMk, gardeDuCasMk, gardeDuCurseurMk, gardeDuProgrammeMk, gardesDeTexteMk, justeMk, triMk } from "./gardes-de-la-mercatique";

/**
 * « POSITIONNER L'OFFRE » (mercatique 1.1), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main sur nova-gestion.ts : un mois en gamme, 195 Go à 34 €, 1 160 One à 59 €, 217 Studio
 * à 129 € : 6 630 + 68 440 + 27 993 = 103 063 € ; la One en fait 68 440 ÷ 103 063 = 66,4 %. La gravure :
 * 4 − 1,50 = 2,50 € par enceinte ; 320 × 2,50 − 480 = 320 € ; la plus petite commande : 480 ÷ 2,50 = 192.
 * Le cas : 150 × 2,50 − 480 = −105 € ; le supplément qui paie : 1,50 + 480 ÷ 150 = 4,70 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 1 de la mercatique, se joue chez NOVA", () => {
    gardeDuProgrammeMk(CH, "STMG Thème 1 · La définition de l'offre");
    expect(CH.entreprises?.codes).toEqual(["nova"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteMk(CH);
  });
});

describe("la gamme et le positionnement", () => {
  it("103 063 € de chiffre d'affaires, la One à 66,4 %", () => {
    expect(gammeDuMois().chiffreDAffaires).toBe(6_630 + 68_440 + 27_993);
    expect(attendusMk(CH, "le-poids")).toEqual([103_063, 66.4]);
  });

  it("la One au milieu : SoundBox à 51 €, Auris à 79 €, et une qualité perçue entre les deux", () => {
    const [nova, soundbox, auris] = positionsDuMarche();
    expect([soundbox!.prix, nova!.prix, auris!.prix]).toEqual([51, 59, 79]);
    expect(soundbox!.qualite).toBeLessThan(nova!.qualite);
    expect(nova!.qualite).toBeLessThan(auris!.qualite);
    expect(justeMk(CH, "le-positionnement")[0]).toMatch(/^Au milieu/);
  });

  it("le couple produit-marché, l'offre globale et les quatre marketings se rangent sans ambiguïté", () => {
    expect(Object.values(triMk(CH, "le-couple-produit-marche"))).toEqual(["etudiants", "familles", "melomanes"]);
    expect(new Set(Object.values(triMk(CH, "l-offre-globale")))).toEqual(new Set(["produit", "services", "signes"]));
    expect(Object.values(triMk(CH, "quatre-facons"))).toEqual(["masse", "differencie", "concentre", "individualise"]);
    expect(justeMk(CH, "la-marque")[0]).toMatch(/^Une marque gamme/);
  });
});

describe("la personnalisation", () => {
  it("2,50 € par enceinte ; 320 € sur la commande de 320 enceintes", () => {
    expect(attendusMk(CH, "la-gravure")).toEqual([2.5, 320]);
  });

  it("le curseur : 192 enceintes paient la gravure, 191 non", () => {
    expect(plusPetiteCommandeGravee()).toBe(192);
    expect(commandeGravee(192).gain).toBe(0);
    expect(commandeGravee(191).gain).toBe(-2.5);
    gardeDuCurseurMk(CH, "la-plus-petite-commande", 192);
  });
});

describe("le cas du chapitre", () => {
  it("150 enceintes : −105 € au supplément habituel ; 4,70 € la paient", () => {
    gardeDuCasMk(CAMPUSTECH_VEUT_SON_LOGO, CH);
    const r = campusTechVeutSonLogo();
    expect([r.gain, r.supplement, r.gainAuSupplement]).toEqual([-105, 4.7, 0]);
    expect(supplementQuiPaie(320)).toBe(3);
    expect(justeMk(CAMPUSTECH_VEUT_SON_LOGO, "reponse")[0]).toMatch(/^Proposons 4,70/);
  });
});
