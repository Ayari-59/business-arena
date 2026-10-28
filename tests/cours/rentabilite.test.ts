import { describe, expect, it } from "vitest";
import {
  RENTABILITE,
  RENTABILITE_DU_DEFI,
  SOLUTION_DE_LA_RENTABILITE,
  enceintesAuTauxDeLEmprunt,
  levierDuLaboratoire,
  rentabilite,
} from "../../src/config/cours/chapitres/rentabilite";
import { CE_QU_EXIGE_LE_FONDS, exigenceDuFonds } from "../../src/config/cours/situations/par-chapitre/ce-qu-exige-le-fonds";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * LA RENTABILITÉ, SUR LE PREMIER EXERCICE DE NOVA DU MONDE DU COURS, ET SON CAS : CE QU'EXIGE LE
 * FONDS.
 *
 * Refait à la main : le résultat net, 79 225,96 € ; le résultat de l'activité, 100 162,89 € ; les
 * capitaux propres, 229 225,96 € ; les capitaux investis, la ligne nette (50 138,89 €) et le besoin
 * en fonds de roulement du bilan fonctionnel (10 627,62 €) ; l'emprunt à 5 %. L'impôt au barème : 15 % jusqu'à 42 500 €,
 * 25 % au-delà.
 */

const ch = chapitreDuCas(RENTABILITE, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const CI = c(50_138.89 + 10_627.62);

describe("la rentabilité de NOVA", () => {
  const r = rentabilite(NOVA);

  it("les deux rentabilités se refont à la main", () => {
    expect(CI).toBe(60_766.51);
    expect(r.capitauxInvestis).toBe(CI);
    expect(r.financiere).toBe(34.6); // 79 225,96 ÷ 229 225,96 = 34,56 %
    expect(r.economique).toBe(164.8); // 100 162,89 ÷ 60 766,51 = 164,83 %
    expect(r.tauxDeLEmprunt).toBe(5);
    expect(etape(ch, "calcul", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([34.6, CI, 164.8]);
    // L'activité rapporte en un an plus que tout ce qu'elle mobilise : la phrase le dit.
    expect(etape(ch, "calcul", "montants").explication(NOVA, VIDE).join(" ")).toMatch(/plus que tout ce qu'elle mobilise/);
  });

  it("les deux comparaisons au taux de l'emprunt suivent les chiffres, une seule bonne réponse", () => {
    const juste = (id: string) => etape(ch, id, "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte);
    expect(juste("associes")).toEqual(["Leur argent rapporte plus que s'ils l'avaient prêté"]);
    expect(juste("emprunter")).toEqual(["Oui : chaque euro investi rapporte plus qu'il ne coûte"]);
  });

  it("le curseur : 18 940 enceintes pour que l'activité rapporte au moins le taux de l'emprunt", () => {
    // 5 % de 60 766,51 € = 3 038,33 € ; 23 564 − (100 162,89 − 3 038,33) ÷ 21 = 18 939,02.
    expect(enceintesAuTauxDeLEmprunt(r)).toBe(18_940);
    const e = gardeDuCurseur(ch, "l-activite-face-a-l-emprunt", 18_940);
    expect(e.lecture(NOVA, 18_940).map((l) => l.montant)).toEqual([c(100_162.89 - 21 * 4_624), 3_038.33, 5]);
  });

  it("le laboratoire : 80 000 € repris par les associés et empruntés portent la rentabilité financière à 52,1 %", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-du-levier");
    expect(SOLUTION_DE_LA_RENTABILITE).toEqual({ emprunt: 80_000, ventes: 0 });
    // 4 000 € d'intérêts de plus : 95 967,96 € avant impôt, 19 742 € d'impôt, 76 225,96 € de résultat.
    const x = levierDuLaboratoire(r, SOLUTION_DE_LA_RENTABILITE);
    expect(x.k.resultatNet).toBe(c(95_967.96 - 19_742));
    expect(x.capitauxPropres).toBe(c(229_225.96 - 80_000 - 3_000));
    expect(x.financiere).toBe(52.1);
    expect(x.financiere >= RENTABILITE_DU_DEFI).toBe(true);
    // 70 000 € ne suffisent pas : 76 600,96 € ÷ 156 600,96 € = 48,9 %.
    expect(levierDuLaboratoire(r, { emprunt: 70_000, ventes: 0 }).financiere).toBe(48.9);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(RENTABILITE);
  });
});

describe("le cas : ce qu'exige le fonds", () => {
  const r = exigenceDuFonds(NOVA);
  it("10 % des capitaux propres, déjà dépassés", () => {
    expect(r.requis).toBe(c(229_225.96 * 0.1));
    expect(r.atteint).toBe(true);
    expect(r.surLesVentes).toBe(c(1_390_276 * 0.1));
    expect(r.surLesInvestis).toBe(c(CI * 0.1));
  });
  it("les textes sont propres, une seule bonne réponse", () => {
    gardesDeTexte(CE_QU_EXIGE_LE_FONDS);
  });
});
