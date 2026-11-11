import { describe, expect, it } from "vitest";
import { LA_PERFORMANCE_GLOBALE as CH } from "../../src/config/cours/chapitres/la-performance-globale";
import { partageDuBenefice, performanceDeNova } from "../../src/config/cours/monde/performance-de-nova";
import { LES_ASSOCIES_DEMANDENT_PLUS, lesAssociesDemandentPlus } from "../../src/config/cours/situations/par-chapitre/les-associes-demandent-plus";
import { attendusSgn, gardeDuCasSgn, gardeDuLaboratoireSgn, gardeDuProgrammeSgn, gardesDeTexteSgn, triSgn } from "./gardes-de-la-sgn";

/**
 * « LA PERFORMANCE GLOBALE AU TABLEAU DE BORD » (SGN T3.2), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 23 564 ÷ 25 000 = 94,3 % ; 1 390 276 € ÷ 23 564 = 59 € ; 79 225,96 ÷ 229 225,96 = 34,6 %,
 * ÷ 1 390 276 = 5,7 % ; l'électricité, 1,2 × 23 564 + 1 500 × 12 = 46 276,8 kWh, × 0,052 = 2 406,39 kg,
 * 102 g par enceinte. Le laboratoire : la CAF de 105 297,07 € moins 25 000 € laisse 80 297,07 € ; moins
 * 30 000 €, 75 297,07 €. Le cas : 40 000 € laissent 65 297,07 € ; il manque 14 702,93 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 3 de la SGN, se joue chez NOVA", () => {
    gardeDuProgrammeSgn(CH, "STMG Thème 3 · Création de valeur et performance");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteSgn(CH);
  });
});

describe("les quatre performances", () => {
  it("efficacité, rentabilité, profitabilité, émissions", () => {
    const p = performanceDeNova();
    // 23 609 enceintes livrées, dont 900 à Sonora avec 5 % de remise (audit du 11 novembre, P2-2 : 23 564 avant).
    expect([p.enceintes, p.chiffreDAffaires, p.resultatNet, p.capitauxPropres, p.caf]).toEqual([23_609, 1_390_276, 79_225.96, 229_225.96, 105_297.07]);
    // 23 609 ÷ 25 000 ; 1 390 276 € ÷ 23 609 = 58,89 €, un peu sous les 59 € du prix.
    expect(attendusSgn(CH, "efficacite-et-efficience")).toEqual([94.44, 58.89]);
    expect(attendusSgn(CH, "rentabilite-et-profitabilite")).toEqual([34.56, 5.7]);
    expect(p.kwh).toBe(1.2 * 23_609 + 1_500 * 12);
    // 46 330,80 kWh × 0,052 kg ; 2 409,20 kg ÷ 23 609 × 1 000.
    expect(attendusSgn(CH, "l-indicateur-environnemental")).toEqual([2_409.2, 102.05]);
  });

  it("le laboratoire : 25 000 € de dividendes, seule solution ; les 30 000 € retenus laissent 75 297,07 €", () => {
    gardeDuLaboratoireSgn(CH, "partager-le-benefice");
    expect(performanceDeNova().dividendes).toBe(30_000);
    expect(partageDuBenefice(25_000).autofinancement).toBe(80_297.07);
    expect(partageDuBenefice(30_000).autofinancement).toBe(75_297.07);
  });

  it("le tri : l'absentéisme est social, la fidélité commerciale", () => {
    const t = triSgn(CH, "quatre-performances");
    expect(t["Le taux d'absentéisme"]).toBe("sociale");
    expect(t["La part des clients du site qui ont racheté dans l'année"]).toBe("commerciale");
  });
});

describe("le cas du chapitre", () => {
  it("40 000 € de dividendes : 50,49 % du bénéfice, 65 297,07 € d'autofinancement, 14 702,93 € à emprunter", () => {
    gardeDuCasSgn(LES_ASSOCIES_DEMANDENT_PLUS, CH);
    const k = lesAssociesDemandentPlus();
    expect([k.partDistribueePct, k.autofinancement, k.manque]).toEqual([50.49, 65_297.07, 14_702.93]);
  });
});
