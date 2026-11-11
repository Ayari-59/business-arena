import { describe, expect, it } from "vitest";
import { egalitesDuCorrige } from "../helpers/chaines-des-corriges";
import { textesDuCours } from "../helpers/corriges-du-cours";

/**
 * LES ÉGALITÉS DES CORRIGÉS TIENNENT SUR LES NOMBRES AFFICHÉS (audit pédagogique du 11 novembre 2026,
 * P0-1 et P1-3 ; décision du propriétaire : une garde qui refait chaque égalité « a op b = c »).
 *
 * Le cas libre du DSCG écrivait « 150 heures ÷ 0,13 × 3 mois = 3 600 » : sur les nombres affichés,
 * 3 461,54. La donnée valait 0,125 heure, écrite au centième ; l'élève qui suivait l'énoncé trouvait
 * 10 661 au lieu de 10 800, et la correction lui montrait une division fausse. Deux corrigés écrivaient
 * de même une donnée arrondie à l'unité (« (720 − 4) ÷ 720 × 100 = 99,50 % » pour 3,60 heures,
 * « 300 × 80 % ÷ 3 = 96 » pour 2,5 Mbit/s).
 *
 * Chaque texte où un calcul s'écrit (le corrigé de chaque champ et de chaque cellule, les explications,
 * les retours des options, les lectures), dans chaque entreprise où le contenu se joue, est relu par
 * tests/helpers/chaines-des-corriges.ts : chaque égalité doit tenir au dernier chiffre affiché près
 * (« ≈ » ne se juge pas). Un nombre que l'énoncé arrondit dans un calcul s'écrit avec ses décimales
 * (0,125 heure), ou le corrigé dit « ≈ » et d'où vient l'écart.
 */

const TEXTES = textesDuCours();
const lues = TEXTES.map((t) => ({ t, egalites: egalitesDuCorrige(t.texte) }));
const fausses = [
  ...new Set(
    lues.flatMap(({ t, egalites }) =>
      egalites
        .filter((e) => !e.tient)
        .map((e) => `${t.ou}, ${t.quoi} : « ${e.gauche} = ${e.droiteEcrite} » donne ${e.refait.toLocaleString("fr-FR", { maximumFractionDigits: 4 })}`),
    ),
  ),
];

describe("l'outil relit une égalité comme l'élève", () => {
  const tient = (t: string) => egalitesDuCorrige(t).map((e) => e.tient);

  it("refait le calcul sur les nombres affichés", () => {
    expect(tient("150 heures ÷ 0,13 × 3 mois = 3 600 ; 7 200 + 3 600 = 10 800")).toEqual([false, true]);
    expect(tient("150 heures ÷ 0,125 × 3 mois = 3 600 ; 7 200 + 3 600 = 10 800")).toEqual([true, true]);
    expect(tient("(720 − 4) ÷ 720 × 100 = 99,50 %")).toEqual([false]);
    expect(tient("(720 − 3,60) ÷ 720 × 100 = 99,50 %")).toEqual([true]);
    expect(tient("30,50 € × 2,64 = 80,53 €")).toEqual([false]);
  });

  it("lit les pourcentages en fraction ou en points, les mots qui nomment les nombres, les chaînes", () => {
    expect(tient("1 875 € × 22 % = 412,50 €")).toEqual([true]);
    expect(tient("24,42 % − 26,40 % = −1,98 points")).toEqual([true]);
    expect(tient("60 % ÷ (100 − 60 %) × 100 = 150 %")).toEqual([true]);
    expect(tient("2,15 % + 10 points = 12,15 %")).toEqual([true]);
    expect(tient("résultat 28 480 € − créance 22 656 € + dettes 46 776 € − équipement hors taxes 60 000 € − 234 € de TVA à récupérer = −7 634 €")).toEqual([true]);
    expect(tient("7 000 × 45 ÷ 90 = 3 500 jeux × 19,80 € = 69 300 €")).toEqual([true]);
    expect(tient("84 975 € ÷ (58,08 € × 1,04) = 84 975 € ÷ 60,40 € = 1 406,87")).toEqual([true]);
    expect(tient("696 € ÷ 1,10 = 632,72 € (au centime inférieur)")).toEqual([true]);
    // Le logarithme et la racine carrée, que des corrigés écrivent.
    expect(tient("0,35 × ln(1 + 48 000 € ÷ 12 000 €) = 0,35 × 1,61 = 0,56")).toEqual([true]);
    expect(tient("√(2 × 7 200 × 60 ÷ 5) = 415,69")).toEqual([true]);
  });

  it("ne juge pas ce qu'il ne lit pas en entier", () => {
    // Une fonction que l'outil ne lit pas, un calcul commencé avant, une approximation : rien à juger.
    expect(egalitesDuCorrige("(59 ÷ 65) puissance 4 × 1,28 au carré = 1,1122")).toEqual([]);
    expect(egalitesDuCorrige("174 × 36 € (80 % × 20 € + 20 % × 100 €) = 6 264 €")).toEqual([]);
    expect(egalitesDuCorrige("4 778 vendues (la plus petite de 5 975 et 4 778) × (53,10 € − 38 €) − 93 549 € = −21 401,20 €")).toEqual([]);
    expect(egalitesDuCorrige("22 064 € de loyer, plus 10 650 € + 833 € = 33 547 €")).toEqual([]);
    expect(egalitesDuCorrige("76 000 € ÷ 2 000 ≈ 38 €")).toEqual([]);
  });
});

describe("chaque égalité des corrigés du cours tient sur les nombres affichés", () => {
  it(`${TEXTES.length} textes lus, dans chaque entreprise où ils se jouent`, () => {
    expect(TEXTES.length).toBeGreaterThan(15_000);
    expect(lues.reduce((n, l) => n + l.egalites.length, 0)).toBeGreaterThan(6_000);
  });

  it("aucune égalité fausse", () => {
    expect(fausses).toEqual([]);
  });
});
