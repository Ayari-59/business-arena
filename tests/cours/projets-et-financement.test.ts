import { describe, expect, it } from "vitest";
import { CLOTURE_DE_LA_FICHE, PAIE_DU_MOIS } from "../../src/config/cours/monde/exercice-de-nova";
import {
  acomptes,
  analyseDuBilan,
  betaDesendette,
  betaReendette,
  bilanApres,
  coefficientDActualisation,
  courbeDeLaVan,
  creationDeValeur,
  criteresDuProjet,
  delaiDeRecuperationActualise,
  eligibleAuTauxReduit,
  fluxDifferentiels,
  fluxDuProjet,
  impotDuBenefice,
  indiceDeProfitabilite,
  plafondDImputation,
  rentabiliteParLeLevier,
  reportEnArriere,
  reportEnAvant,
  resultatFiscal,
  solde,
  structureAuLevier,
  suiteDesExercices,
  tauxDeFisher,
  tauxEquivalent,
  tri,
  valeurResiduelleNette,
  van,
} from "../../src/config/cours/monde/finance";
import { L_ESCALE } from "../../src/config/cours/monde/l-escale";
import { GAMME_DE_NOVA, INVESTISSEMENT_ENVISAGE } from "../../src/config/cours/monde/nova-gestion";
import {
  APPORT_DES_ASSOCIES,
  BETA_DE_L_ACTIF_DE_L_ESCALE,
  BETA_DE_L_ACTIF_DE_NOVA,
  BILAN_DE_L_ESCALE,
  COUT_ANNUEL_D_UN_OPERATEUR,
  DEPENSE_DE_FIN_D_ANNEE,
  DEPENSE_DE_L_ANNEE_EN_PERTE,
  EXERCICE_N1_DE_NOVA,
  EXERCICES_DE_PIXEL,
  EXIGENCE_DU_FONDS,
  IMPOT_DE_NOVA_EN_N,
  IMPOT_DE_PIXEL_EN_N_MOINS_1,
  MARGE_DE_CREDIT_PAR_UNITE_DE_LEVIER,
  NOVA_ET_LE_TAUX_REDUIT,
  PIXEL_ET_LE_TAUX_REDUIT,
  PRIME_DE_RISQUE_DU_MARCHE,
  PROJET_BANC_DE_MESURE,
  PROJET_LIGNE_MANUELLE,
  PROJET_LIGNE_SEMI_AUTOMATIQUE,
  RANG_DE_L_EXERCICE_EN_PERTE,
  RESULTAT_D_EXPLOITATION_DE_L_ESCALE,
  SALLE_DE_SEMINAIRE,
  TAUX_DE_L_IMPOT_DES_PROJETS,
  TAUX_D_ACTUALISATION_DE_NOVA,
  TAUX_RELEVE,
  TAUX_SANS_RISQUE,
  VENTES_DE_GO,
  VENTES_DE_ONE_PERDUES,
  VENTES_DE_STUDIO,
} from "../../src/config/cours/monde/projets-et-financement";

/**
 * LES PROJETS ET LE FINANCEMENT DU MONDE DU COURS (monde/projets-et-financement.ts, monde/finance.ts),
 * REFAITS À LA MAIN.
 *
 * Chaque chiffre attendu est recalculé ici sur la fiche, sans les fonctions du modèle (une VAN
 * se refait par sa somme, un TRI par la VAN qu'il annule) ; les valeurs absolues sont épinglées,
 * pour qu'un changement de la fiche ou du modèle se voie. Les propriétés qui font la notion sont
 * vérifiées : la VAN nulle au TRI, les deux VAN égales au taux de Fisher, la rentabilité des
 * capitaux propres égale à la rentabilité économique quand la dette coûte autant qu'elle, les
 * déficits imputés qui retombent sur le déficit total.
 */

const t = TAUX_D_ACTUALISATION_DE_NOVA;
const IS = TAUX_DE_L_IMPOT_DES_PROJETS;
/** La VAN à la main : Σ flux de la date k ÷ (1 + taux)^k. */
const vanALaMain = (flux: readonly number[], taux: number) => flux.reduce((s, f, k) => s + f / (1 + taux) ** k, 0);
const centime = (x: number) => Math.round(x * 100) / 100;

const A = fluxDuProjet(PROJET_LIGNE_MANUELLE, { tauxDeLImpot: IS });
const B = fluxDuProjet(PROJET_LIGNE_SEMI_AUTOMATIQUE, { tauxDeLImpot: IS });
const C = fluxDuProjet(PROJET_BANC_DE_MESURE, { tauxDeLImpot: IS });

describe("la fiche : les hypothèses de NOVA et leur cohérence avec les autres mondes", () => {
  it("le taux d'actualisation de NOVA est le MEDAF de son activité : 3 % + 1 × 6 % = 9 %", () => {
    expect(TAUX_SANS_RISQUE + BETA_DE_L_ACTIF_DE_NOVA * PRIME_DE_RISQUE_DU_MARCHE).toBeCloseTo(0.09, 12);
    expect(t).toBe(0.09);
    expect(IS).toBe(0.25);
  });

  it("un opérateur de plus coûte la paie d'un salarié de NOVA, cotisations patronales comprises", () => {
    expect(PAIE_DU_MOIS.brut / PAIE_DU_MOIS.effectif).toBe(1_875);
    expect(COUT_ANNUEL_D_UN_OPERATEUR).toBe(Math.round(1_875 * 1.42 * 12));
    expect(COUT_ANNUEL_D_UN_OPERATEUR).toBe(31_950);
  });

  it("les produits de la gamme reprennent les prix et coûts variables de nova-gestion.ts", () => {
    const ref = (code: string) => GAMME_DE_NOVA.references.find((r) => r.code === code)!;
    expect([ref("go").prix, ref("go").coutVariableUnitaire, ref("studio").prix, ref("studio").coutVariableUnitaire, ref("one").prix, ref("one").coutVariableUnitaire]).toEqual([34, 19, 129, 70, 59, 38]);
    expect(PROJET_LIGNE_MANUELLE.produits.map((p) => [p.prix, p.coutVariable])).toEqual([[34, 19], [129, 70], [59, 38]]);
    // Les ventes de One perdues entrent en négatif : ce sont des flux différentiels.
    expect(PROJET_LIGNE_MANUELLE.produits[2]!.quantites).toEqual(VENTES_DE_ONE_PERDUES.map((q) => -q));
    // Les deux lignes servent la même gamme : seuls l'équipement et les charges diffèrent.
    expect(PROJET_LIGNE_SEMI_AUTOMATIQUE.produits).toBe(PROJET_LIGNE_MANUELLE.produits);
  });

  it("la seconde ligne manuelle est la même que la première ligne de NOVA, le banc celui que le contrôle de gestion envisageait", () => {
    expect(PROJET_LIGNE_MANUELLE.actifs[0]).toMatchObject({ montant: 60_000, dureeDAmortissement: 6 });
    expect(PROJET_BANC_DE_MESURE.actifs[0]).toMatchObject({ montant: INVESTISSEMENT_ENVISAGE.montantHt, dureeDAmortissement: 5 });
    expect(INVESTISSEMENT_ENVISAGE.montantHt).toBe(30_000);
  });

  it("l'impôt de N, référence des acomptes de N+1, est celui de l'exercice de NOVA", () => {
    expect(IMPOT_DE_NOVA_EN_N).toBe(Math.round(42_500 * 0.15 + (99_967.96 - 42_500) * 0.25));
    expect(IMPOT_DE_NOVA_EN_N).toBe(20_742);
    expect(CLOTURE_DE_LA_FICHE.resultatAvantImpot).toBe(99_967.96);
  });

  it("le résultat d'exploitation de L'ESCALE est son année au prix de l'année dans le monde du cours", () => {
    const offertes = L_ESCALE.chambres * L_ESCALE.joursParTrimestre;
    expect(offertes).toBe(5_400);
    const demandes = [0, 1, 2, 3].map((q) => L_ESCALE.clienteles.reduce((s, c) => s + c.demande[q]!, 0));
    expect(demandes).toEqual([3_400, 5_000, 6_400, 3_900]);
    const vendues = demandes.reduce((s, d) => s + Math.min(d, offertes), 0);
    expect(vendues).toBe(17_700);
    expect(vendues * (88 - 21) - 4 * 210_000).toBe(345_900);
    expect(RESULTAT_D_EXPLOITATION_DE_L_ESCALE).toBe(345_900);
  });

  it("le bilan de L'ESCALE s'équilibre : capitaux propres et emprunt financent l'actif, la trésorerie et le BFR", () => {
    const b = BILAN_DE_L_ESCALE;
    expect(b.capitauxPropres + b.emprunt + b.dettesFournisseurs + b.dettesFiscalesEtSociales).toBe(b.immobilisationsNettes + b.stocks + b.creancesClients + b.disponibilites);
    expect(b.empruntAuPremierJanvier - b.emprunt).toBe(100_000);
  });
});

describe("le projet A, la gamme sur une seconde ligne manuelle : les flux, refaits à la main", () => {
  const ca = [0, 1, 2, 3, 4].map((k) => VENTES_DE_GO[k]! * 34 + VENTES_DE_STUDIO[k]! * 129 - VENTES_DE_ONE_PERDUES[k]! * 59);
  const cv = [0, 1, 2, 3, 4].map((k) => VENTES_DE_GO[k]! * 19 + VENTES_DE_STUDIO[k]! * 70 - VENTES_DE_ONE_PERDUES[k]! * 38);
  const fixes = [0, 1, 2, 3, 4].map((k) => 12_000 + (k === 0 ? 15_000 : 0) + 2 * 31_950 + 4_000);
  const ebe = ca.map((x, k) => x - cv[k]! - fixes[k]!);
  const dotations = 60_000 / 6 + 40_000 / 5;
  const rex = ebe.map((x) => x - dotations);

  it("chiffre d'affaires différentiel, coûts variables, charges fixes, EBE et résultat d'exploitation", () => {
    expect(ca).toEqual([162_300, 287_700, 376_200, 376_200, 270_700]);
    expect(A.annees.map((a) => a.chiffreDAffaires)).toEqual(ca);
    expect(A.annees.map((a) => a.coutsVariables)).toEqual(cv);
    expect(A.annees.map((a) => a.chargesFixes)).toEqual(fixes);
    expect(A.annees.map((a) => a.excedentBrut)).toEqual(ebe);
    expect(ebe).toEqual([-19_700, 53_300, 94_100, 94_100, 45_800]);
    expect(dotations).toBe(18_000);
    expect(A.annees.map((a) => a.resultatDExploitation)).toEqual(rex);
  });

  it("l'impôt porte sur le résultat d'exploitation ; une perte en économise", () => {
    expect(A.annees.map((a) => a.impot)).toEqual(rex.map((r) => r * 0.25));
    expect(A.annees[0]!.impot).toBe(-9_425);
    // Le flux d'exploitation : l'EBE moins l'impôt, ou le résultat après impôt plus les dotations.
    expect(A.annees.map((a) => a.fluxDExploitation)).toEqual(ebe.map((e, k) => e - rex[k]! * 0.25));
    expect(A.annees.map((a) => a.fluxDExploitation)).toEqual(rex.map((r) => r * 0.75 + dotations));
  });

  it("le BFR vaut 10 % du chiffre d'affaires, se constitue au début de chaque année et se récupère à la fin", () => {
    const bfr = ca.map((x) => x * 0.1);
    expect(A.annees.map((a) => a.bfr)).toEqual(bfr);
    expect(A.variationsDuBfr).toEqual([16_230, 28_770 - 16_230, 37_620 - 28_770, 0, 27_070 - 37_620, 0]);
    expect(A.recuperationDuBfr).toBe(27_070);
    // Toutes les variations et la récupération retombent sur zéro : le BFR n'est qu'avancé.
    expect(A.variationsDuBfr.reduce((s, v) => s + v, 0) - A.recuperationDuBfr).toBe(0);
  });

  it("la valeur résiduelle : la ligne revendue 60 % de sa valeur nette comptable, la moins-value fait économiser l'impôt", () => {
    const vnc = 60_000 - 5 * 10_000;
    const prix = 0.6 * vnc;
    expect([vnc, prix]).toEqual([10_000, 6_000]);
    expect(A.residuels[0]).toMatchObject({ vnc, prixDeCession: prix, plusOuMoinsValue: -4_000, impot: -1_000, nette: prix + 0.25 * (vnc - prix) });
    expect(A.residuels[1]).toMatchObject({ vnc: 0, nette: 0 });
    expect(A.valeurResiduelle).toBe(7_000);
  });

  it("les flux de trésorerie disponibles, date par date, et leur valeur actuelle nette à 9 %", () => {
    const fe = rex.map((r) => r * 0.75 + dotations);
    const attendus = [-100_000 - 16_230, fe[0]! - 12_540, fe[1]! - 8_850, fe[2]! - 0, fe[3]! + 10_550, fe[4]! + 7_000 + 27_070];
    expect(A.flux).toEqual(attendus);
    expect(A.flux).toEqual([-116_230, -22_815, 35_625, 75_075, 85_625, 72_920]);
    expect(van(A.flux, t)).toBeCloseTo(vanALaMain(attendus, 0.09), 2);
    expect(van(A.flux, t)).toBe(58_847.24);
    expect(coefficientDActualisation(t, 5)).toBeCloseTo(1 / 1.09 ** 5, 12);
  });

  it("raccourci à 3 ans, il revend la ligne et les moules plus tôt, et ne crée plus de valeur", () => {
    const court = fluxDuProjet(PROJET_LIGNE_MANUELLE, { duree: 3 });
    // La ligne : VNC 30 000 €, revendue 18 000 € ; les moules : VNC 16 000 €, sans prix ; 25 % des moins-values.
    expect(court.valeurResiduelle).toBe(18_000 + 0.25 * 12_000 + 0.25 * 16_000);
    const fe3 = rex[2]! * 0.75 + dotations;
    expect(court.flux).toEqual([-116_230, -22_815, 35_625, fe3 + 25_000 + 37_620]);
    expect(van(court.flux, t)).toBeCloseTo(vanALaMain(court.flux, 0.09), 2);
    expect(van(court.flux, t)).toBe(-850.54);
  });
});

describe("les projets B et C, refaits à la main", () => {
  it("B, la ligne semi-automatique : un opérateur, plus d'entretien, plus d'amortissement, une meilleure revente", () => {
    const dot = 150_000 / 6 + 40_000 / 5;
    expect(dot).toBe(33_000);
    const caA = A.annees.map((a) => a.chiffreDAffaires);
    const cvA = A.annees.map((a) => a.coutsVariables);
    const fixes = [27_000, 12_000, 12_000, 12_000, 12_000].map((p) => p + 31_950 + 10_000);
    const rex = caA.map((x, k) => x - cvA[k]! - fixes[k]! - dot);
    const fe = rex.map((r) => r * 0.75 + dot);
    const vr = 0.8 * 25_000 + 0.25 * (25_000 - 0.8 * 25_000);
    expect(vr).toBe(21_250);
    expect(B.flux).toEqual([-190_000 - 16_230, fe[0]! - 12_540, fe[1]! - 8_850, fe[2]!, fe[3]! + 10_550, fe[4]! + vr + 27_070]);
    expect(B.flux).toEqual([-206_230, 397.5, 58_837.5, 98_287.5, 108_837.5, 110_382.5]);
    expect(van(B.flux, t)).toBeCloseTo(vanALaMain(B.flux, 0.09), 2);
    expect(van(B.flux, t)).toBe(68_397.29);
  });

  it("C, le banc de mesure : 360 retours évités à 40 €, moins l'étalonnage, sans BFR ni revente", () => {
    const ebe = 24_000 * (0.025 - 0.01) * 40 - 1_400;
    expect(ebe).toBeCloseTo(13_000, 9);
    const fe = (13_000 - 6_000) * 0.75 + 6_000;
    expect(fe).toBe(11_250);
    expect(C.flux).toEqual([-30_000, fe, fe, fe, fe, fe]);
    const annuite = (1 - 1.09 ** -5) / 0.09;
    expect(van(C.flux, t)).toBeCloseTo(fe * annuite - 30_000, 2);
    expect(van(C.flux, t)).toBe(13_758.58);
  });
});

describe("le TRI, l'indice de profitabilité, le délai actualisé et le taux de Fisher", () => {
  it("le TRI annule la VAN, à un centième de point près, et la VAN change de signe autour de lui", () => {
    for (const [p, attendu] of [
      [A, 0.2092],
      [B, 0.1809],
      [C, 0.2541],
    ] as const) {
      const r = tri(p.flux)!;
      expect(r).toBeCloseTo(attendu, 4);
      expect(Math.abs(vanALaMain(p.flux, r))).toBeLessThan(0.5);
      expect(vanALaMain(p.flux, r - 0.0001)).toBeGreaterThan(0);
      expect(vanALaMain(p.flux, r + 0.0001)).toBeLessThan(0);
    }
  });

  it("un projet sans changement de signe n'a pas de TRI", () => {
    expect(tri([-100, -10, -10])).toBeNull();
  });

  it("l'indice de profitabilité : la VAN plus la mise, rapportée à la mise de la date 0", () => {
    expect(indiceDeProfitabilite(A.flux, t)).toBeCloseTo((58_847.24 + 116_230) / 116_230, 10);
    expect(indiceDeProfitabilite(A.flux, t)).toBeCloseTo(1.5063, 4);
    expect(indiceDeProfitabilite(B.flux, t)).toBeCloseTo((68_397.29 + 206_230) / 206_230, 10);
    expect(indiceDeProfitabilite(C.flux, t)).toBeCloseTo(43_758.58 / 30_000, 10);
  });

  it("le délai de récupération actualisé, interpolé dans l'année où le cumul repasse à zéro", () => {
    const actualises = A.flux.map((f, k) => f / 1.09 ** k);
    const cumulAuBoutDe3 = actualises.slice(0, 4).reduce((s, x) => s + x, 0);
    expect(cumulAuBoutDe3).toBeLessThan(0);
    expect(cumulAuBoutDe3 + actualises[4]!).toBeGreaterThan(0);
    expect(delaiDeRecuperationActualise(A.flux, t)).toBeCloseTo(3 + -cumulAuBoutDe3 / actualises[4]!, 10);
    expect(delaiDeRecuperationActualise(A.flux, t)).toBeCloseTo(3.81, 2);
    expect(delaiDeRecuperationActualise(B.flux, t)).toBeCloseTo(4.05, 2);
    expect(delaiDeRecuperationActualise(C.flux, t)).toBeCloseTo(3.19, 2);
    expect(delaiDeRecuperationActualise([-100, 10, 10], 0.09)).toBeNull();
  });

  it("la VAN et le TRI se contredisent : B a la plus forte VAN, A le plus fort TRI", () => {
    const a = criteresDuProjet(A.flux, t);
    const b = criteresDuProjet(B.flux, t);
    expect(b.van).toBeGreaterThan(a.van);
    expect(a.tri!).toBeGreaterThan(b.tri!);
    expect(centime(b.van - a.van)).toBe(9_550.05);
  });

  it("le taux de Fisher : le TRI des flux différentiels, où les deux VAN s'égalent", () => {
    const d = fluxDifferentiels(A.flux, B.flux);
    expect(d).toEqual([-90_000, 23_212.5, 23_212.5, 23_212.5, 23_212.5, 23_212.5 + 14_250]);
    const f = tauxDeFisher(A.flux, B.flux)!;
    expect(f).toBeCloseTo(0.1273, 4);
    expect(Math.abs(vanALaMain(A.flux, f) - vanALaMain(B.flux, f))).toBeLessThan(0.5);
    expect(centime(vanALaMain(A.flux, f))).toBeCloseTo(37_018.1, 0);
    // Sous le taux de Fisher, B l'emporte ; au-dessus, A.
    expect(vanALaMain(B.flux, f - 0.01)).toBeGreaterThan(vanALaMain(A.flux, f - 0.01));
    expect(vanALaMain(A.flux, f + 0.01)).toBeGreaterThan(vanALaMain(B.flux, f + 0.01));
    // Le coût du capital, 9 %, est sous le taux de Fisher : la VAN choisit B.
    expect(t).toBeLessThan(f);
  });

  it("la courbe de la VAN selon le taux décroît et n'est pas une droite", () => {
    const c = courbeDeLaVan(A.flux, [0, 0.05, 0.1]);
    expect(c[0]!.van).toBe(130_200);
    expect(c[0]!.van - c[1]!.van).toBeGreaterThan(c[1]!.van - c[2]!.van);
  });

  it("les VAN de projets indépendants s'additionnent, et la VAN est affine en ventes", () => {
    const ensemble = A.flux.map((x, k) => x + C.flux[k]!);
    expect(van(ensemble, t)).toBeCloseTo(58_847.24 + 13_758.58, 1);
    const v = (x: number) => van(fluxDuProjet(PROJET_LIGNE_MANUELLE, { ventes: x }).flux, t);
    expect(v(0.9) - v(0.8)).toBeCloseTo(v(0.8) - v(0.7), 1);
    expect(tauxEquivalent(0.09, 4)).toBeCloseTo(1.09 ** 0.25 - 1, 12);
    expect(valeurResiduelleNette({ libelle: "", montant: 100, dureeDAmortissement: 4, tauxDeReprise: 2 }, 2, 0.25).nette).toBe(100 - 0.25 * 50);
  });
});

describe("l'effet de levier chez L'ESCALE, refait à la main", () => {
  const a = analyseDuBilan(BILAN_DE_L_ESCALE);

  it("l'actif économique, l'endettement net, le levier", () => {
    expect(a.bfr).toBe(8_000 + 72_000 - 26_000 - 34_000);
    expect(a.actifEconomique).toBe(2_130_000 + 20_000);
    expect(a.endettementNet).toBe(1_225_000 - 150_000);
    expect(a.capitauxPropres + a.endettementNet).toBe(a.actifEconomique);
    expect(a.levier).toBe(1);
  });

  it("la rentabilité économique, le coût de l'endettement net, la relation du levier", () => {
    expect(a.chargesFinancieres).toBe(0.04 * 1_325_000);
    expect(a.re).toBeCloseTo((345_900 * 0.75) / 2_150_000, 12);
    expect(a.i).toBeCloseTo((53_000 * 0.75) / 1_075_000, 12);
    expect(a.tauxDuContratApresImpot).toBeCloseTo(0.03, 12);
    expect(a.resultatNet).toBe((345_900 - 53_000) * 0.75);
    expect(a.rcp).toBeCloseTo(219_675 / 1_075_000, 12);
    expect(rentabiliteParLeLevier(a.re, a.i, a.levier)).toBeCloseTo(a.rcp, 12);
    expect([a.re, a.i, a.rcp].map((x) => Math.round(x * 10_000) / 100)).toEqual([12.07, 3.7, 20.43]);
  });

  it("le seuil de massue et le taux limite", () => {
    expect(a.seuilDeMassue).toBe((53_000 * 2_150_000) / 1_075_000);
    expect(a.seuilDeMassue).toBe(106_000);
    expect(a.tauxLimite).toBeCloseTo((0.04 * ((345_900 * 0.75) / 2_150_000)) / ((53_000 * 0.75) / 1_075_000), 12);
    expect(Math.round(a.tauxLimite * 10_000) / 100).toBe(13.05);
  });

  it("quand la dette ne coûte que la rentabilité économique, la rentabilité des associés l'égale", () => {
    const auSeuil = analyseDuBilan({ ...BILAN_DE_L_ESCALE, tauxDeLEmprunt: a.tauxLimite });
    expect(auSeuil.i).toBeCloseTo(a.re, 12);
    expect(auSeuil.rcp).toBeCloseTo(a.re, 12);
    const auRex = analyseDuBilan({ ...BILAN_DE_L_ESCALE, resultatDExploitation: 106_000 });
    expect(auRex.re).toBeCloseTo(auRex.i, 12);
    expect(auRex.rcp).toBeCloseTo(auRex.re, 12);
    for (const L of [0, 0.5, 2]) expect(rentabiliteParLeLevier(0.08, 0.08, L)).toBeCloseTo(0.08, 12);
  });

  it("l'apport : même exploitation, moins de levier, moins de rentabilité pour les associés", () => {
    const apres = analyseDuBilan(bilanApres(BILAN_DE_L_ESCALE, { apport: APPORT_DES_ASSOCIES }));
    const ff = 0.04 * (1_325_000 - 300_000);
    const rn = (345_900 - ff) * 0.75;
    expect([ff, rn]).toEqual([41_000, 228_675]);
    expect(apres.capitauxPropres).toBe(855_325 + 300_000 + rn);
    expect(apres.actifEconomique).toBe(2_150_000);
    expect(apres.endettementNet).toBe(2_150_000 - 1_384_000);
    expect(apres.re).toBeCloseTo(a.re, 12);
    expect(apres.rcp).toBeCloseTo(228_675 / 1_384_000, 12);
    expect(apres.rcp).toBeLessThan(a.rcp);
    // La trésorerie oisive pèse sur une dette plus petite : le coût de l'endettement net monte.
    expect(apres.i).toBeCloseTo((41_000 * 0.75) / 766_000, 12);
    expect(apres.i).toBeGreaterThan(a.i);
  });

  it("le taux relevé : la marge se réduit, le levier tient tant que le taux reste sous le taux limite", () => {
    const apres = analyseDuBilan(bilanApres(BILAN_DE_L_ESCALE, { tauxDeLEmprunt: TAUX_RELEVE }));
    const rn = (345_900 - 0.07 * 1_325_000) * 0.75;
    expect(rn).toBe(189_862.5);
    expect(apres.capitauxPropres).toBe(855_325 + rn);
    expect(apres.endettementNet).toBe(2_150_000 - 855_325 - rn);
    expect(apres.rcp).toBeCloseTo(rn / (855_325 + rn), 12);
    expect(apres.i).toBeLessThan(apres.re);
    expect(TAUX_RELEVE).toBeLessThan(a.tauxLimite);
  });
});

describe("la création de valeur chez L'ESCALE, refaite à la main", () => {
  const r = { tauxSansRisque: TAUX_SANS_RISQUE, prime: PRIME_DE_RISQUE_DU_MARCHE, betaDeLActif: BETA_DE_L_ACTIF_DE_L_ESCALE };
  const v = creationDeValeur(BILAN_DE_L_ESCALE, r);

  it("le bêta des capitaux propres (Hamada) et leur coût (MEDAF)", () => {
    expect(v.betaDesCapitauxPropres).toBeCloseTo(0.8 * (1 + 0.75 * 1), 12);
    expect(v.kcp).toBeCloseTo(0.03 + 1.4 * 0.06, 12);
    expect(betaDesendette(betaReendette(0.8, 0.7, 0.25), 0.7, 0.25)).toBeCloseTo(0.8, 12);
  });

  it("le CMPC, l'EVA, et le résultat résiduel qui la recoupe au centime", () => {
    const cmpc = (0.114 * 1_075_000 + 0.75 * 53_000) / 2_150_000;
    expect(v.cmpc).toBeCloseTo(cmpc, 12);
    expect(v.eva).toBe(259_425 - 0.114 * 1_075_000 - 39_750);
    expect(v.eva).toBe(97_125);
    expect(v.exigenceDesAssocies).toBe(122_550);
    expect(v.resultatResiduel).toBe(219_675 - 122_550);
    expect(v.resultatResiduel).toBe(v.eva);
    expect(v.resultatDExploitationMinimal).toBe((122_550 + 39_750) / 0.75);
    expect(v.resultatDExploitationMinimal).toBe(216_400);
  });

  it("l'exigence d'un fonds à 15 % : un CMPC plus haut, une EVA plus petite", () => {
    const f = creationDeValeur(BILAN_DE_L_ESCALE, r, EXIGENCE_DU_FONDS);
    expect(f.cmpc).toBeCloseTo((0.15 * 1_075_000 + 39_750) / 2_150_000, 12);
    expect(f.eva).toBe(259_425 - 161_250 - 39_750);
    expect(f.resultatDExploitationMinimal).toBe((161_250 + 39_750) / 0.75);
  });

  it("la salle de séminaire fait monter le résultat net et baisser l'EVA", () => {
    const s = creationDeValeur(bilanApres(BILAN_DE_L_ESCALE, { investissement: SALLE_DE_SEMINAIRE }), r);
    const rex = 345_900 + 39_000 - 24_000;
    const ff = 0.04 * (1_325_000 + 240_000);
    const rn = (rex - ff) * 0.75;
    expect([rex, ff, rn]).toEqual([360_900, 62_600, 223_725]);
    expect(s.resultatNet).toBe(rn);
    expect(s.actifEconomique).toBe(2_150_000 + 240_000 - 24_000);
    const cp = 855_325 + rn;
    const d = 2_366_000 - cp;
    const kcp = 0.03 + 0.8 * (1 + (0.75 * d) / cp) * 0.06;
    expect(s.eva).toBeCloseTo(rn - kcp * cp, 1);
    expect(s.eva).toBe(93_228.9);
    expect(s.resultatNet).toBeGreaterThan(v.resultatNet);
    expect(s.eva).toBeLessThan(v.eva);
  });

  it("le coût du capital selon le levier : au levier de la fiche, la structure retrouve le bilan", () => {
    const ici = structureAuLevier(BILAN_DE_L_ESCALE, r, 1, MARGE_DE_CREDIT_PAR_UNITE_DE_LEVIER);
    expect(ici.cmpc).toBeCloseTo(v.cmpc, 12);
    expect(ici.eva).toBe(v.eva);
    expect(ici.tauxDeLEmprunt).toBeCloseTo(0.04, 12);
    // Sans marge de crédit, la dette fait toujours baisser le CMPC (elle coûte moins que les capitaux propres, et se déduit).
    expect(structureAuLevier(BILAN_DE_L_ESCALE, r, 2).cmpc).toBeLessThan(structureAuLevier(BILAN_DE_L_ESCALE, r, 1).cmpc);
    // Avec la marge, l'EVA culmine vers un levier de 0,6 : à la main, kcp = 3 % + 0,8 × (1 + 0,75 × 0,6) × 6 %.
    const L = 0.6;
    const kcp = 0.03 + 0.8 * (1 + 0.75 * L) * 0.06;
    const i = ((53_000 * 0.75) / 1_075_000) * ((0.04 + 0.01 * (L - 1)) / 0.04);
    const cmpc = (kcp + i * L) / (1 + L);
    const au = (x: number) => structureAuLevier(BILAN_DE_L_ESCALE, r, x, MARGE_DE_CREDIT_PAR_UNITE_DE_LEVIER);
    expect(au(L).cmpc).toBeCloseTo(cmpc, 12);
    expect(au(L).eva).toBe(centime(259_425 - cmpc * 2_150_000));
    expect(au(L).eva).toBeGreaterThan(au(0.5).eva);
    expect(au(L).eva).toBeGreaterThan(au(0.7).eva);
    expect(au(L).eva).toBeGreaterThan(au(1).eva);
  });
});

describe("l'impôt sur les sociétés de NOVA en N+1, refait à la main", () => {
  it("le résultat fiscal : le résultat comptable plus les réintégrations", () => {
    const voiture = 36_000 / 5 - 18_300 / 5;
    expect(voiture).toBe(3_540);
    expect(resultatFiscal(EXERCICE_N1_DE_NOVA)).toBe(118_460 + voiture + 480);
    expect(resultatFiscal(EXERCICE_N1_DE_NOVA)).toBe(122_480);
  });

  it("les conditions du taux réduit : NOVA les remplit, PIXEL & CO non", () => {
    expect(eligibleAuTauxReduit(NOVA_ET_LE_TAUX_REDUIT)).toBe(true);
    expect(eligibleAuTauxReduit(PIXEL_ET_LE_TAUX_REDUIT)).toBe(false);
    expect(eligibleAuTauxReduit({ chiffreDAffaires: 10_000_000, capitalEntierementLibere: true, partDesPersonnesPhysiques: 1 })).toBe(false);
    expect(eligibleAuTauxReduit({ chiffreDAffaires: 1_000, capitalEntierementLibere: false, partDesPersonnesPhysiques: 1 })).toBe(false);
  });

  it("l'impôt au taux réduit puis normal, le taux effectif, l'économie du taux réduit", () => {
    const impot = 42_500 * 0.15 + (122_480 - 42_500) * 0.25;
    expect(impot).toBe(26_370);
    const d = impotDuBenefice(122_480, true);
    expect(d.impot).toBe(impot);
    expect(d.tauxEffectif).toBeCloseTo(26_370 / 122_480, 12);
    expect(impotDuBenefice(122_480, false).impot).toBe(122_480 * 0.25);
    expect(impotDuBenefice(122_480, false).impot - impot).toBe(42_500 * (0.25 - 0.15));
    // Le taux effectif passe sous 20 % jusqu'à 85 000 € : 6 375 + 25 % × (b − 42 500) = 20 % × b.
    expect(impotDuBenefice(85_000, true).tauxEffectif).toBeCloseTo(0.2, 12);
    expect(impotDuBenefice(84_000, true).tauxEffectif).toBeLessThan(0.2);
    expect(impotDuBenefice(-5_000, true).impot).toBe(0);
  });

  it("les acomptes de N+1 sur l'impôt de N, le solde au 15 mai N+2", () => {
    expect(acomptes(IMPOT_DE_NOVA_EN_N)).toEqual([20_742 / 4, 20_742 / 4, 20_742 / 4, 20_742 / 4]);
    expect(20_742 / 4).toBe(5_185.5);
    expect(solde(26_370, acomptes(IMPOT_DE_NOVA_EN_N))).toBe(26_370 - 20_742);
    expect(acomptes(2_999)).toEqual([0, 0, 0, 0]);
  });

  it("la dépense de fin d'année ne coûte que 75 % de son montant : le taux marginal est le taux normal", () => {
    const sans = impotDuBenefice(122_480, true).impot;
    const avec = impotDuBenefice(122_480 - DEPENSE_DE_FIN_D_ANNEE, true).impot;
    expect(sans - avec).toBe(DEPENSE_DE_FIN_D_ANNEE * 0.25);
    expect(sans - avec).toBe(1_200);
  });
});

describe("le déficit de PIXEL & CO, refait à la main", () => {
  const rf = EXERCICES_DE_PIXEL.map(resultatFiscal);

  it("les résultats fiscaux : la dépréciation forfaitaire réintégrée en N, sa reprise déduite en N+1", () => {
    expect(rf).toEqual([36_000, -64_400 + 3_000 + 1_400, 30_000 - 3_000, 48_000]);
    expect(rf[RANG_DE_L_EXERCICE_EN_PERTE]).toBe(-60_000);
  });

  it("les acomptes de N, sur l'impôt de N−1, sont rendus : l'exercice en perte ne doit rien", () => {
    expect(IMPOT_DE_PIXEL_EN_N_MOINS_1).toBe(36_000 * 0.25);
    expect(acomptes(9_000)).toEqual([2_250, 2_250, 2_250, 2_250]);
    expect(solde(0, acomptes(9_000))).toBe(-9_000);
  });

  it("le report en avant : N+1 absorbe 27 000 €, N+2 les 33 000 € restants", () => {
    const s = suiteDesExercices(EXERCICES_DE_PIXEL);
    expect(s.exercices.map((e) => e.deficitImpute)).toEqual([0, 0, 27_000, 33_000]);
    expect(s.exercices.map((e) => e.beneficeImposable)).toEqual([36_000, 0, 0, 48_000 - 33_000]);
    expect(s.exercices.map((e) => e.impot)).toEqual([9_000, 0, 0, 15_000 * 0.25]);
    expect(s.exercices.map((e) => e.deficitRestant)).toEqual([0, 60_000, 33_000, 0]);
    // Les déficits imputés retombent sur le déficit total.
    expect(s.exercices.reduce((x, e) => x + e.deficitImpute, 0)).toBe(60_000);
    // L'impôt évité : 25 % du déficit, sur ce que N+1 et N+2 auraient payé sans lui.
    expect((27_000 + 48_000) * 0.25 - 3_750).toBe(60_000 * 0.25);
  });

  it("le report en arrière : 36 000 € sur N−1, une créance de 9 000 €, le reste en avant ; même impôt en tout", () => {
    const s = suiteDesExercices(EXERCICES_DE_PIXEL, { enArriere: RANG_DE_L_EXERCICE_EN_PERTE });
    const n = s.exercices[1]!;
    expect(n.creanceNee).toBe(36_000 * 0.25);
    expect(n.deficitRestant).toBe(60_000 - 36_000);
    expect(s.exercices.map((e) => e.deficitImpute)).toEqual([0, 0, 24_000, 0]);
    expect(s.exercices.map((e) => e.impot)).toEqual([9_000, 0, 3_000 * 0.25, 48_000 * 0.25]);
    expect(s.exercices.map((e) => e.creanceUtilisee)).toEqual([0, 0, 750, 9_000 - 750]);
    expect(s.exercices.map((e) => e.impotPaye)).toEqual([9_000, 0, 0, 12_000 - 8_250]);
    // Reporté en arrière et imputé en avant, le déficit retombe sur son total.
    expect(36_000 + s.exercices.reduce((x, e) => x + e.deficitImpute, 0)).toBe(60_000);
    expect(s.creanceRestante).toBe(0);
    expect(s.impotNet).toBe(suiteDesExercices(EXERCICES_DE_PIXEL).impotNet);
    expect(s.impotNet).toBe(9_000 + 3_750);
  });

  it("la dépense de l'année en perte grossit le déficit et fait baisser l'impôt de N+2 de 25 % de son montant", () => {
    const avec = EXERCICES_DE_PIXEL.map((e, k) => (k === 1 ? { ...e, resultatComptable: e.resultatComptable - DEPENSE_DE_L_ANNEE_EN_PERTE } : e));
    const s = suiteDesExercices(avec);
    expect(s.exercices[1]!.deficitRestant).toBe(65_000);
    expect(s.exercices[3]!.impot).toBe((48_000 - 38_000) * 0.25);
    expect(3_750 - s.exercices[3]!.impot).toBe(5_000 * 0.25);
  });

  it("le plafond d'imputation ne joue qu'au-delà du million, le report en arrière s'arrête au million", () => {
    expect(plafondDImputation(27_000)).toBe(1_000_000);
    expect(plafondDImputation(1_600_000)).toBe(1_000_000 + 0.5 * 600_000);
    expect(reportEnAvant(1_600_000, 2_000_000)).toEqual({ impute: 1_300_000, beneficeImposable: 300_000, deficitRestant: 700_000 });
    expect(reportEnAvant(27_000, 60_000)).toEqual({ impute: 27_000, beneficeImposable: 0, deficitRestant: 33_000 });
    expect(reportEnAvant(-5_000, 60_000)).toEqual({ impute: 0, beneficeImposable: 0, deficitRestant: 65_000 });
    expect(reportEnArriere(1_500_000, 1_200_000)).toEqual({ reporte: 1_000_000, creance: 250_000, deficitEnAvant: 500_000 });
    expect(reportEnArriere(60_000, 36_000)).toEqual({ reporte: 36_000, creance: 9_000, deficitEnAvant: 24_000 });
  });
});
