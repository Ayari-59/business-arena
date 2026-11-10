import { describe, expect, it } from "vitest";
import { SANTE_ET_SECURITE_AU_TRAVAIL as CH } from "../../src/config/cours/chapitres/sante-et-securite-au-travail";
import { equiperLesPostes, valeurDesJoursEvites } from "../../src/config/cours/monde/sante-et-securite-de-nova";
import { EQUIPER_LES_POSTES_DE_VISSAGE } from "../../src/config/cours/situations/par-chapitre/equiper-les-postes-de-vissage";
import { THEMES_DES_RESSOURCES_HUMAINES, attendusT, gardeDuCasT, gardeDuCurseurT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « SANTÉ ET SÉCURITÉ AU TRAVAIL » (ressources humaines et communication de terminale, 2.2, lot E STMG), ET
 * SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 4 × 150 × 12 = 7 200 heures ; 1 × 1 000 000 ÷ 7 200 = 138,9 ; 9 × 1 000 ÷ 7 200 =
 * 1,25. Une visseuse à 1 800 € se paie à 400 € le jour dès 5 jours (4 : 1 600 €). Le cas : 2 × 1 800 =
 * 3 600 €, 15 × 400 = 6 000 €, 2 400 € qui restent.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 2 de ressources humaines, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DES_RESSOURCES_HUMAINES[1]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("risques, indicateurs et prévention", () => {
  it("le taux de fréquence 138,9 et le taux de gravité 1,25", () => {
    expect(attendusT(CH, "les-taux")).toEqual([138.9, 1.25]);
  });

  it("le curseur : 5 jours évités paient la visseuse", () => {
    gardeDuCurseurT(CH, "le-curseur-de-la-visseuse", 5);
    expect([valeurDesJoursEvites(4), valeurDesJoursEvites(5)]).toEqual([1_600, 2_000]);
  });

  it("les tris et les choix", () => {
    expect(Object.values(triT(CH, "at-trajet-ou-mp"))).toEqual(["at", "at", "trajet", "mp"]);
    expect(Object.values(triT(CH, "les-risques"))).toEqual(["tms", "rps", "rps", "accident"]);
    expect(Object.values(triT(CH, "prevenir"))).toEqual(["primaire", "primaire", "secondaire", "tertiaire"]);
    expect(justeT(CH, "le-harcelement")[0]).toMatch(/^Faire cesser/);
    expect(justeT(CH, "la-mutuelle")[0]).toMatch(/moitié/);
  });
});

describe("le cas du chapitre", () => {
  it("3 600 € de visseuses, 6 000 € d'arrêts évités", () => {
    gardeDuCasT(EQUIPER_LES_POSTES_DE_VISSAGE, CH);
    expect(equiperLesPostes()).toMatchObject({ cout: 3_600, evites: 6_000, gain: 2_400 });
  });
});
