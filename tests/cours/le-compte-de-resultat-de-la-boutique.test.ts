import { describe, expect, it } from "vitest";
import { LE_COMPTE_DE_RESULTAT_DE_LA_BOUTIQUE, SOLUTION_DU_LABORATOIRE } from "../../src/config/cours/chapitres/le-compte-de-resultat-de-la-boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { LE_BAIL_REVISE } from "../../src/config/cours/situations/par-chapitre/le-bail-revise";
import { attendus, casDedie, centime, curseur, juste, laboratoire, verifierLesTextes } from "./gardes-de-la-gestion-de-la-boutique";

/**
 * LE COMPTE DE RÉSULTAT DE LA BOUTIQUE, ET SON CAS : LE BAIL RÉVISÉ.
 *
 * L'exercice N − 1 refait à la main : les articles de la série de la fiche, le prix moyen de janvier
 * N − 1, les charges du mois et la paie de l'équipe douze fois, les hypothèses de l'exercice (coût
 * moyen 24,50 €, autres coûts variables 3,20 €, taxes locales 650 € par mois), puis les soldes, la CAF,
 * l'écart d'EBE avec N − 2 cause par cause. Puis les gardes de texte.
 */

const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const articles = (a: string) => somme(f.historique.filter((h) => h.annee === a).map((h) => h.ventes));
const is = (b: number) => 42_500 * 0.15 + (b - 42_500) * 0.25;

// N − 1, à la main.
const q1 = articles("N-1");
const ca1 = q1 * 56;
const mc1 = ca1 - q1 * 24.5;
const ext1 = centime(q1 * 3.2 + 12 * (13_600 - 650) + 12 * 1_500 + 12 * 920);
const perso1 = centime(12 * 10_100 * 1.42);
const ebe1 = centime(mc1 - ext1 - 12 * 650 - perso1);
const rcai1 = centime(ebe1 - 4_000 - 5_000 - 42_000 * 0.052);
const rn1 = centime(rcai1 - is(rcai1));
// N − 2, à la main.
const q2 = articles("N-2");
const ebe2 = centime(q2 * (57.5 - 24.5) - (q2 * 3.2 + 12 * 12_550 + 12 * 1_500 + 12 * 920) - 12 * 650 - 12 * 9_450 * 1.42);

describe("le compte de résultat de la boutique", () => {
  const ch = LE_COMPTE_DE_RESULTAT_DE_LA_BOUTIQUE;

  it("se joue chez MAILLE & CO seule, au palier 4 du BTS MCO, bloc 3, et le cas est le sien", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.parcours, ch.palier, ch.blocs]).toEqual(["mco", 4, ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"]]);
    expect(PROGRAMME.mco[4]).toContain(ch.titre);
    expect(SITUATIONS).toContain(LE_BAIL_REVISE);
    expect([q1, q2, f.moisN1.chiffreDAffaires / f.moisN1.articles]).toEqual([25_992, 24_600, 56]);
  });

  it("les ventes, la marge et le compte de résultat, refaits à la main", () => {
    expect(attendus(ch, "du-mois-a-l-annee")).toEqual({
      "Ventes de marchandises": 1_455_552,
      "Coût d'achat des marchandises vendues": 636_804,
      "Achats de marchandises": 636_804 + 24_990 - 23_400,
      "Marge commerciale": mc1,
    });
    expect(mc1).toBe(818_748);
    const a = attendus(ch, "le-compte");
    expect(a["Résultat d'exploitation"]).toBe(centime(ebe1 - 9_000));
    expect(a["Résultat courant avant impôt"]).toBe(rcai1);
    expect(a["Impôt sur les sociétés"]).toBe(centime(is(rcai1)));
    expect(a["Résultat net"]).toBe(rn1);
    expect(a["Charges d'exploitation"]).toBe(centime(ca1 - (ebe1 - 9_000)));
    expect([rcai1, rn1]).toEqual([360_045.6, 274_284.2]);
  });

  it("les soldes, la CAF et les taux", () => {
    expect(attendus(ch, "les-soldes")).toEqual({ "Valeur ajoutée": centime(mc1 - ext1), "Excédent brut d'exploitation": ebe1 });
    expect([centime(mc1 - ext1), ebe1]).toEqual([551_133.6, 371_229.6]);
    expect(attendus(ch, "la-caf-et-les-taux")).toEqual({
      "Capacité d'autofinancement": centime(rn1 + 9_000),
      "Taux de marge commerciale (%)": centime((mc1 / ca1) * 100),
      "Taux d'EBE (%)": centime((ebe1 / ca1) * 100),
      "Rentabilité nette (%)": centime((rn1 / ca1) * 100),
    });
    expect(centime((ebe1 / ca1) * 100)).toBe(25.5);
  });

  it("l'EBE recule : le curseur des articles, les causes, le laboratoire, refaits à la main", () => {
    expect(ebe2).toBe(384_612);
    expect(juste(ch, "predire-l-ebe")).toBe("A reculé, malgré les ventes");
    const fixes = 12 * (13_600 - 650) + 12 * 1_500 + 12 * 920 + 12 * 650 + perso1;
    const n = Math.ceil((ebe2 + fixes) / (56 - 24.5 - 3.2) - 1e-9);
    expect(n).toBe(26_465);
    expect(curseur(ch, "les-articles-qui-manquent").attendu).toBe(n);
    expect(attendus(ch, "les-causes")).toEqual({
      "Effet du volume": (q1 - q2) * 33,
      "Effet du prix moyen": -1.5 * q1,
      "Effet des autres coûts variables": centime(-(q1 - q2) * 3.2),
      "Effet du loyer": -12 * 400,
      "Effet du personnel": centime(-12 * 650 * 1.42),
    });
    expect(centime((q1 - q2) * 33 - 1.5 * q1 - (q1 - q2) * 3.2 - 4_800 - 12 * 650 * 1.42)).toBe(centime(ebe1 - ebe2));
    const l = laboratoire(ch, "le-laboratoire-de-la-remediation");
    expect(l.reussi).toEqual([false, true]);
    expect(SOLUTION_DU_LABORATOIRE).toEqual({ prix: 56.5, baisse: 1_000 });
    // À la main : EBE = EBE de N − 1 + (prix − 56) × articles + baisse ; au plus 56,50 €.
    const reussit = (p: number, b: number) => p <= 56.5 && ebe1 + (p - 56) * q1 + b >= ebe2 - 1e-6;
    for (const p of [55, 56, 56.25, 56.5, 56.75]) for (const b of [0, 1_000, 6_000, 7_000, 12_000]) expect(l.atteint({ prix: p, baisse: b }), `${p} ${b}`).toBe(reussit(p, b));
  });

  it("l'expert : sans les remises, à rebours, et les verdicts", () => {
    const ebeSans = centime(ebe1 + 1.5 * q1);
    expect(attendus(ch, "sans-les-remises")).toEqual({ "Marge commerciale": q1 * 33, "Excédent brut d'exploitation": ebeSans, "Taux d'EBE (%)": centime((ebeSans / (q1 * 57.5)) * 100) });
    expect(attendus(ch, "le-prix-de-n-moins-2")).toEqual({ "Marge commerciale d'un article": 33, "Prix moyen d'un article": 57.5, "Chiffre d'affaires de N − 2": q2 * 57.5 });
    expect(juste(ch, "ebe-ou-resultat-net")).toBe("La gestion se juge sur l'EBE, pas sur le résultat net");
    expect(juste(ch, "decider")).toBe("Réduire les remises : 38\u202f988 € d'EBE");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : le bail révisé", () => {
  const s = LE_BAIL_REVISE;

  it("tient la forme d'un cas dédié", () => {
    casDedie(s, LE_COMPTE_DE_RESULTAT_DE_LA_BOUTIQUE);
    expect(s.commanditaire).toBe("La gérante");
  });

  it("le loyer révisé, l'EBE, la CAF et le prix qui compense : refaits à la main", () => {
    const loyer = centime(155_400 * 1.06);
    const ebe = centime(ebe1 - (loyer - 155_400));
    expect([loyer, ebe]).toEqual([164_724, 361_905.6]);
    expect(attendus(s, "l-ebe-de-n")).toEqual({ "Loyer de N": loyer, "EBE de N": ebe, "Taux d'EBE (%)": centime((ebe / ca1) * 100) });
    const rcai = centime(ebe - 4_000 - 28_000 * 0.052);
    const rn = centime(rcai - is(rcai));
    expect(attendus(s, "jusqu-a-la-caf")).toEqual({ "Intérêts de N": 1_456, "Résultat courant avant impôt": rcai, "Impôt sur les sociétés": centime(is(rcai)), "Résultat net": rn, "Capacité d'autofinancement": centime(rn + 4_000) });
    expect([rcai, rn]).toEqual([356_449.6, 271_587.2]);
    expect(attendus(s, "le-prix-qui-compense")).toEqual({ "Hausse du prix moyen": 0.36, "Prix moyen à viser": 56.36 });
    expect(juste(s, "reponse")).toMatch(/^L'EBE perd 9 324 €/);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
