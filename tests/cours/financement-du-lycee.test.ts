import { describe, expect, it } from "vitest";
import { CAPACITE_DE_REMBOURSEMENT_MAXIMALE, INDEPENDANCE_MINIMALE } from "../../src/config/cours/financement";
import { bilanDuLycee, compteDuLycee, exerciceDe } from "../../src/config/cours/monde/comptes-du-lycee";
import {
  COMPTE_COURANT,
  LIGNE_SEMI_AUTOMATIQUE,
  LOYERS_D_UNE_ANNEE,
  PREMIERE_ANNEE_MAXIMALE,
  PRET_BANCAIRE,
  PRET_PARTICIPATIF,
  SURCOUT_ACCEPTE,
  coutDuFinancement,
  dansLesRegles,
  empruntPermisParLaCapacite,
  empruntPermisParLIndependance,
  planDeFinancement,
  planTenable,
  remboursements,
  structureFinanciere,
} from "../../src/config/cours/monde/financement-du-lycee";

/**
 * LA STRUCTURE FINANCIÈRE ET LES FINANCEMENTS DE NOVA, LUS AU LYCÉE (monde/financement-du-lycee.ts),
 * la source des chapitres « La capacité de remboursement et les limites de l'analyse
 * fonctionnelle » et « Financer autrement », et de leurs cas.
 *
 * Refait à la main sur le premier exercice de NOVA : la capacité d'autofinancement (79 225,96 € de
 * résultat, 26 071,11 € de dotations), l'emprunt de 68 000 €, les capitaux propres de 229 225,96 €,
 * les ressources durables de 323 297,07 € ; l'impôt au barème du cours (15 % jusqu'à 42 500 €, 25 %
 * au-delà, arrondi à l'euro) ; 23 609 enceintes vendues, 21 € de marge chacune (59 € moins 38 €).
 */

const f = exerciceDe("nova");
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const impot = (r: number) => (r <= 0 ? 0 : Math.round(c(0.15 * Math.min(r, 42_500) + 0.25 * Math.max(0, r - 42_500))));
const CAF = c(79_225.96 + 26_071.11);
const CP = 229_225.96;
const RD = c(CP + 21_071.11 + 5_000 + 68_000);

describe("les ratios de la banque au 31 décembre", () => {
  const s = structureFinanciere(f);

  it("les règles des banques : 4 ans au plus, la moitié au moins", () => {
    expect(CAPACITE_DE_REMBOURSEMENT_MAXIMALE).toBe(4);
    expect(INDEPENDANCE_MINIMALE).toBe(0.5);
  });

  it("la capacité de remboursement et l'indépendance se refont à la main", () => {
    expect(s.caf).toBe(CAF);
    expect(s.caf).toBe(compteDuLycee(f).caf);
    expect(s.dettesFinancieres).toBe(68_000);
    expect(s.ressourcesDurables).toBe(RD);
    expect(RD).toBe(323_297.07);
    expect(s.capaciteDeRemboursement).toBeCloseTo(68_000 / CAF, 12);
    expect(Math.round(s.capaciteDeRemboursement * 100) / 100).toBe(0.65);
    expect(Math.round(s.independance * 1000) / 10).toBe(70.9);
    expect(dansLesRegles(s)).toBe(true);
  });

  it("l'emprunt permis : 353 188 € par la capacité, 135 154 € par l'indépendance", () => {
    expect(empruntPermisParLaCapacite(s)).toBe(Math.floor(4 * CAF - 68_000));
    expect(empruntPermisParLaCapacite(s)).toBe(353_188);
    expect(empruntPermisParLIndependance(s)).toBe(Math.floor(2 * CP - RD));
    expect(empruntPermisParLIndependance(s)).toBe(135_154);
    // À la frontière, l'indépendance tient ; un euro plus loin, elle ne tient plus.
    expect(structureFinanciere(f, { emprunt: 135_154 }).independance).toBeGreaterThanOrEqual(0.5);
    expect(structureFinanciere(f, { emprunt: 135_155 }).independance).toBeLessThan(0.5);
  });

  it("les loyers d'une année : 12 × 19 700 €", () => {
    expect(LOYERS_D_UNE_ANNEE).toBe(236_400);
  });
});

describe("l'année suivante, rejouée : moins de ventes, des intérêts en plus", () => {
  it("15 % de ventes en moins et 100 000 € empruntés : 3,85 ans et 54,2 %, dans les règles", () => {
    // 15 % des 23 609 enceintes livrées (audit du 11 novembre, P2-2 : 23 564 avant), la remise de Sonora gardée.
    const q = Math.round(23_609 * 0.85);
    expect(q).toBe(20_068);
    const rai = c(99_967.96 - (23_609 - q) * 21 - 100_000 * 0.05);
    expect(rai).toBe(20_606.96);
    expect(impot(rai)).toBe(3_091);
    const caf = c(rai - 3_091 + 26_071.11);
    const s = structureFinanciere(f, { emprunt: 100_000, baisseDesVentes: 0.15 });
    expect(s.quantite).toBe(q);
    expect(s.caf).toBe(caf);
    expect(s.caf).toBe(43_587.07);
    expect(s.dettesFinancieres).toBe(168_000);
    expect(s.ressourcesDurables).toBe(c(RD + 100_000));
    expect(s.capaciteDeRemboursement).toBeCloseTo(168_000 / caf, 12); // 3,85
    expect(s.independance).toBeCloseTo(CP / (RD + 100_000), 12); // 0,542
    expect(dansLesRegles(s)).toBe(true);
    // 10 000 € de plus : 4,12 ans, hors de la règle.
    expect(dansLesRegles(structureFinanciere(f, { emprunt: 110_000, baisseDesVentes: 0.15 }))).toBe(false);
  });

  it("dans tout le laboratoire, la capacité d'autofinancement reste positive", () => {
    expect(structureFinanciere(f, { emprunt: 300_000, baisseDesVentes: 0.2 }).caf).toBeGreaterThan(0);
  });

  it("un emprunt passe par le bilan du lycée : la banque, l'emprunt, les ressources durables", () => {
    const s = structureFinanciere(f, { emprunt: 50_000 });
    const b = bilanDuLycee(f, { emprunt: 50_000 });
    expect(s.dettesFinancieres).toBe(b.poste("emprunt"));
    expect(s.ressourcesDurables).toBe(b.ressourcesDurables);
  });
});

describe("financer autrement la ligne semi-automatique", () => {
  it("la ligne de la gamme, 150 000 €, et la subvention de 20 %", () => {
    expect(LIGNE_SEMI_AUTOMATIQUE.montant).toBe(150_000);
    const p = planDeFinancement(f);
    expect(p.subvention).toBe(30_000);
    expect(p.aFinancer).toBe(120_000);
  });

  it("les tableaux de remboursement : parts égales, in fine", () => {
    expect(remboursements(PRET_BANCAIRE(f), 40_000).map((l) => [l.capital, l.interets])).toEqual([
      [8_000, 2_000],
      [8_000, 1_600],
      [8_000, 1_200],
      [8_000, 800],
      [8_000, 400],
    ]);
    expect(remboursements(COMPTE_COURANT, 40_000).map((l) => l.total)).toEqual([1_200, 1_200, 1_200, 1_200, 41_200]);
    expect(remboursements(PRET_PARTICIPATIF, 40_000).map((l) => l.total)).toEqual([2_400, 2_400, 2_400, 42_400]);
  });

  it("pour 40 000 € : 6 000 €, 6 000 € et 9 600 € d'intérêts ; 10 000 €, 1 200 € et 2 400 € la première année", () => {
    expect([PRET_BANCAIRE(f), COMPTE_COURANT, PRET_PARTICIPATIF].map((s) => coutDuFinancement(s, 40_000)).map((x) => [x.interets, x.premiereAnnee])).toEqual([
      [40_000 * 0.05 * 3, 8_000 + 2_000],
      [40_000 * 0.03 * 5, 1_200],
      [40_000 * 0.06 * 4, 2_400],
    ]);
  });

  it("les échéances constantes : 27 716,98 € par an, 18 584,88 € d'intérêts", () => {
    const x = coutDuFinancement({ taux: 0.05, dureeAns: 5, mode: "echeances-constantes" }, 120_000);
    expect(c((120_000 * 0.05) / (1 - 1.05 ** -5))).toBe(27_716.98);
    expect(x.premiereAnnee).toBe(27_716.98);
    expect(x.interets).toBe(c(x.tableau.reduce((t, l) => t + l.total, 0) - 120_000));
    expect(x.interets).toBe(18_584.88);
  });

  it("tout à la banque : 18 000 € d'intérêts et 30 000 € la première année ; le plan du défi : 20 700 € et 15 500 €", () => {
    const tout = planDeFinancement(f);
    expect([tout.interets, tout.premiereAnnee]).toEqual([18_000, 30_000]);
    expect(planTenable(tout)).toBe(false);
    const x = planDeFinancement(f, { compteCourant: 40_000, participatif: 30_000 });
    expect(x.banque).toBe(50_000);
    expect(x.interets).toBe(7_500 + 6_000 + 7_200);
    expect(x.premiereAnnee).toBe(12_500 + 1_200 + 1_800);
    expect(PREMIERE_ANNEE_MAXIMALE).toBe(16_000);
    expect(SURCOUT_ACCEPTE).toBe(3_000);
    expect(planTenable(x)).toBe(true);
  });

  it("le seul plan tenable, aux crans de 10 000 €, est celui du défi", () => {
    const tenables: [number, number][] = [];
    for (let cc = 0; cc <= 40_000; cc += 10_000) for (let p = 0; p <= 120_000; p += 10_000) if (planTenable(planDeFinancement(f, { compteCourant: cc, participatif: p }))) tenables.push([cc, p]);
    expect(tenables).toEqual([[40_000, 30_000]]);
  });

  it("ce que dira la banque : 188 000 € de dettes, 1,79 an, 54,8 % ; sans subvention, 48,4 %", () => {
    const x = planDeFinancement(f);
    expect(x.dettesFinancieres).toBe(188_000);
    expect(Math.round((188_000 / CAF) * 100) / 100).toBe(1.79);
    expect(x.capitauxPropres).toBe(c(CP + 30_000));
    expect(x.ressourcesDurables).toBe(c(RD + 150_000));
    expect(Math.round(x.independance * 1000) / 10).toBe(54.8);
    expect(Math.round(x.independanceSansSubvention * 1000) / 10).toBe(48.4);
  });
});
