import { describe, expect, it } from "vitest";
import { MARCHE_A_TROIS, MARCHES_DU_COURS, type FicheDuMarche } from "../../src/config/cours/monde/marche-a-trois";
import { QUALITE } from "../../src/config/cours/monde/nova-capacite";
import { AUTRES_COUTS_PAR_ENCEINTE, CAPACITE_DU_TRIMESTRE, CHARGES_FIXES_DU_MOIS, COMPOSANTS_PAR_ENCEINTE, PRIX_DE_L_ENCEINTE } from "../../src/config/cours/monde/nova-gestion";
import {
  allerDansLEspaceLibre,
  anneeAvec,
  anneeDuMarche,
  attractivite,
  battreAuris,
  budgetConstantDuLabel,
  budgetPlancherDuLabel,
  capitalABudgetConstant,
  capitalImage,
  carteDuMarche,
  demiMesure,
  effortRse,
  engagementRse,
  gammePourLaQualite,
  interpoler,
  labelsDeLAnnee,
  lirePosition,
  meilleurPrix,
  offreDeNova,
  partsDeMarche,
  planLeMoinsCherDuLabel,
  poidsDesTrimestres,
  qualitePercue,
  strategiesGeneriques,
  trimestresPourLeSeuil,
  ventesPourAtteindre,
  viserLeLabel,
} from "../../src/config/cours/monde/attractivite";

/**
 * LE MARCHÉ À TROIS DU COURS (monde/attractivite.ts sur monde/marche-a-trois.ts), REFAIT À LA MAIN.
 *
 * Chaque chiffre attendu est recalculé ici sur la fiche, sans les fonctions du modèle ; les valeurs
 * absolues sont épinglées (un changement de la fiche se voit). La fiche est d'abord confrontée aux
 * autres fiches de NOVA (la même enceinte, la même ligne, les mêmes charges fixes, le même budget de
 * prévention). Puis les propriétés qui font voir les notions sont gardées : NOVA à son meilleur prix
 * pour son offre (seul le changement d'offre paie), deux stratégies génériques aux parts ET aux
 * marges différentes qui battent toutes deux le milieu, une demi-mesure qui fait pire que tout, un
 * espace libre qui se lit sur deux axes et ne s'atteint pas par le seul prix, un capital-image où
 * dépenser tard compte plus, et un label que le cas obtient avec une marge nette.
 */

const f = MARCHE_A_TROIS;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const MARCHE_DU_TRIMESTRE = 17_500;
const LN2 = Math.log(2);

/** Les attractivités d'aujourd'hui, refaites : (59 ÷ prix)⁴ × qualité² × (1 + image). */
const A_NOVA = Math.pow(59 / 59, 4) * Math.pow(1.0, 2) * (1 + 0);
const A_SOUNDBOX = Math.pow(59 / 51, 4) * Math.pow(0.96 - 0.06, 2) * (1 + 0.08);
const A_AURIS = Math.pow(59 / 79, 4) * Math.pow(1.31 + 0.03, 2) * (1 + 0.06 + 0.22 * LN2);
const A_CONCURRENTS = A_SOUNDBOX + A_AURIS;

/** Les ventes de NOVA sur l'année, d'une attractivité tenue les quatre trimestres, face aux concurrents d'aujourd'hui. */
const ventesDeNova = (a: number) => 4 * Math.round((a / (a + A_CONCURRENTS)) * MARCHE_DU_TRIMESTRE);
/** Les ventes d'un concurrent, NOVA à l'attractivité donnée. */
const ventesDe = (aConcurrent: number, aNova: number) => 4 * Math.round((aConcurrent / (aNova + A_CONCURRENTS)) * MARCHE_DU_TRIMESTRE);

describe("la fiche du marché à trois tient debout, et c'est la NOVA des autres fiches", () => {
  const nova = f.enseignes[0]!;

  it("NOVA : la NOVA One de nova-gestion.ts (59 €, 22 € et 16 €), la ligne de 7 000 enceintes, les charges fixes de janvier pour douze mois", () => {
    expect(nova.code).toBe("nova");
    expect(nova.offre.prix).toBe(PRIX_DE_L_ENCEINTE);
    expect(nova.offre.composants).toBe(COMPOSANTS_PAR_ENCEINTE);
    expect(nova.offre.autres).toBe(AUTRES_COUTS_PAR_ENCEINTE);
    expect(nova.capacite).toBe(CAPACITE_DU_TRIMESTRE);
    expect(nova.chargesFixes).toBe(12 * (CHARGES_FIXES_DU_MOIS.loyer + CHARGES_FIXES_DU_MOIS.personnel + CHARGES_FIXES_DU_MOIS.amortissement));
    expect(nova.chargesFixes).toBe(374_196);
    expect(59 - 22 - 16).toBe(21);
  });

  it("le budget qualité de NOVA est la prévention de nova-capacite.ts (16 000 € par an) ; NOVA ne fait ni publicité ni RSE", () => {
    expect(nova.offre.budgetQualite * 4).toBe(QUALITE.budgetActuel);
    expect(nova.offre.budgetQualite).toBe(4_000);
    expect(nova.offre.budgetCommunication).toBe(0);
    expect(nova.offre.budgetRse).toBe(0);
    expect(nova.capitalImage).toBe(0);
  });

  it("les réglages du capital-image sont ceux du scénario nova de l'arène, relevés et figés : 0,65, 12 000 €, 0,22, 0,70, 15 % pendant 2 trimestres, dès le trimestre 3", () => {
    expect(f.rse).toEqual({
      inertie: 0.65,
      echelle: 12_000,
      sensibilite: 0.22,
      seuilDuLabel: 0.7,
      bonusDuLabel: 0.15,
      dureeDuLabel: 2,
      premierTrimestreDuLabel: 3,
      budgetDuCours: 12_000,
    });
  });

  it("le marché : 17 500 enceintes par trimestre, 70 000 par an ; l'attractivité en (59 ÷ prix)⁴ × qualité²", () => {
    expect(f.marche.parTrimestre * f.marche.trimestres).toBe(70_000);
    expect(f.attractivite).toEqual({ prixDeReference: 59, elasticiteAuPrix: 4, elasticiteALaQualite: 2 });
  });

  it("les gammes : standard 34 € (0,92), actuelle 38 € (1,00), soignée 43 € (1,28) ; la gamme actuelle est celle de NOVA aujourd'hui", () => {
    expect(f.gammes.map((g) => [g.code, g.composants + g.autres, g.qualiteDeConception])).toEqual([
      ["standard", 34, 0.92],
      ["actuelle", 38, 1],
      ["soignee", 43, 1.28],
    ]);
    // La gamme actuelle est un compromis : la qualité gagnée par euro est plus forte vers le haut.
    expect((1.28 - 1) / (43 - 38)).toBeGreaterThan((1 - 0.92) / (38 - 34));
    expect(offreDeNova(f, { gamme: "actuelle" })).toEqual(nova.offre);
  });

  it("les concurrents : SoundBox à 51 € et Auris à 79 €, Auris au régime permanent de 12 000 € de RSE (capital ln 2)", () => {
    const [, sb, au] = f.enseignes;
    expect([sb!.nom, sb!.offre.prix, sb!.offre.composants + sb!.offre.autres, sb!.chargesFixes, sb!.capacite]).toEqual(["SoundBox", 51, 28, 640_000, 12_000]);
    expect([au!.nom, au!.offre.prix, au!.offre.composants + au!.offre.autres, au!.chargesFixes, au!.capacite]).toEqual(["Auris", 79, 52, 135_000, 5_000]);
    expect(au!.capitalImage).toBeCloseTo(LN2, 12);
    // Au régime permanent, le capital se reproduit : 0,65 × ln 2 + 0,35 × ln 2.
    expect(capitalImage(f, [12_000, 12_000, 12_000, 12_000], au!.capitalImage).fins.every((c) => Math.abs(c - LN2) < 1e-12)).toBe(true);
    expect(MARCHES_DU_COURS.nova).toBe(f);
  });

  it("les stratégies des chapitres", () => {
    expect(f.strategies.map((s) => [s.code, s.gamme, s.prix, s.budgetQualite, s.budgetCommunication])).toEqual([
      ["milieu", "actuelle", 59, 4_000, 0],
      ["couts", "standard", 54, 2_000, 0],
      ["differenciation", "soignee", 69, 8_000, 2_000],
      ["demi-mesure", "actuelle", 54, 4_000, 0],
      ["prix-de-la-place", "actuelle", 69, 4_000, 0],
      ["place-et-qualite", "soignee", 69, 4_000, 0],
    ]);
  });
});

describe("l'attractivité et la part de marché, refaites à la main", () => {
  it("les courbes se lisent en droites entre leurs points, et plafonnent au dernier", () => {
    expect(interpoler(f.courbeDuBudgetQualite, 0)).toBe(-0.06);
    expect(interpoler(f.courbeDuBudgetQualite, 1_000)).toBe(-0.04);
    expect(interpoler(f.courbeDuBudgetQualite, 4_000)).toBe(0);
    expect(interpoler(f.courbeDuBudgetQualite, 6_000)).toBe(0.01);
    expect(interpoler(f.courbeDuBudgetQualite, 40_000)).toBe(0.03);
    expect(interpoler(f.courbeDeLaCommunication, 2_000)).toBe(0.02);
    expect(interpoler(f.courbeDeLaCommunication, 16_000)).toBe(0.08);
    expect(interpoler(f.courbeDeLaCommunication, 20_000)).toBe(0.08);
  });

  it("les qualités perçues : NOVA 1,00, SoundBox 0,96 − 0,06 = 0,90, Auris 1,31 + 0,03 = 1,34", () => {
    expect(f.enseignes.map((e) => qualitePercue(f, e.offre))).toEqual([1, 0.9, 1.34]);
    expect(qualitePercue(f, offreDeNova(f, { gamme: "standard", budgetQualite: 2_000 }))).toBe(0.9);
    expect(qualitePercue(f, offreDeNova(f, { gamme: "soignee", budgetQualite: 8_000 }))).toBe(1.3);
  });

  it("les attractivités et les parts d'aujourd'hui", () => {
    const [n, sb, au] = f.enseignes;
    expect(attractivite(f, n!.offre)).toBe(1);
    expect(attractivite(f, sb!.offre)).toBeCloseTo(A_SOUNDBOX, 12);
    expect(attractivite(f, au!.offre, { capital: au!.capitalImage })).toBeCloseTo(A_AURIS, 12);
    expect(A_SOUNDBOX).toBeCloseTo(1.5669, 4);
    expect(A_AURIS).toBeCloseTo(0.6773, 4);
    const parts = partsDeMarche([A_NOVA, A_SOUNDBOX, A_AURIS]);
    expect(somme(parts)).toBeCloseTo(1, 12);
    expect(parts[0]).toBeCloseTo(1 / (1 + A_SOUNDBOX + A_AURIS), 12);
    expect(parts.map((p) => Math.round(p * 1000) / 10)).toEqual([30.8, 48.3, 20.9]);
  });

  it("le prix compte puissance 4, la qualité puissance 2, le label 15 %", () => {
    const o = offreDeNova(f);
    expect(attractivite(f, offreDeNova(f, { prix: 54 }))).toBeCloseTo(Math.pow(59 / 54, 4), 12);
    expect(Math.pow(59 / 54, 4)).toBeCloseTo(1.4251, 4);
    expect(attractivite(f, offreDeNova(f, { gamme: "soignee" }))).toBeCloseTo(1.28 * 1.28, 12);
    expect(attractivite(f, o, { capital: 0.5 })).toBeCloseTo(1 + 0.22 * 0.5, 12);
    expect(attractivite(f, o, { capital: 0.5, label: true })).toBeCloseTo((1 + 0.11) * 1.15, 12);
  });
});

describe("l'année du marché : ventes, marge, coût complet, résultat, refaits à la main", () => {
  const a = anneeDuMarche(f);

  it("chaque trimestre, la demande est la part du marché à l'enceinte près ; les ventes de l'année sont quatre trimestres égaux", () => {
    const parTrimestre = Math.round((A_NOVA / (A_NOVA + A_CONCURRENTS)) * 17_500);
    expect(parTrimestre).toBe(5_394);
    expect(a.nova.trimestres.map((t) => t.ventes)).toEqual([5_394, 5_394, 5_394, 5_394]);
    expect(a.nova.ventes).toBe(21_576);
    expect(a.soundbox.ventes).toBe(ventesDe(A_SOUNDBOX, A_NOVA));
    expect(a.soundbox.ventes).toBe(33_808);
    expect(a.auris.ventes).toBe(ventesDe(A_AURIS, A_NOVA));
    expect(a.auris.ventes).toBe(14_616);
    expect(a.marche).toBe(70_000);
    expect(a.nova.part).toBeCloseTo(21_576 / 70_000, 12);
    // La capacité ne borne personne : 5 394 < 7 000, 8 452 < 12 000, 3 654 < 5 000.
    expect(a.enseignes.every((e) => e.refusees === 0)).toBe(true);
  });

  it("NOVA : 1 272 984 € de chiffre d'affaires, 453 096 € de marge, 390 196 € de charges, 62 900 € de résultat, 56,08 € de coût complet", () => {
    const n = a.nova;
    expect(n.chiffreDAffaires).toBe(21_576 * 59);
    expect(n.chiffreDAffaires).toBe(1_272_984);
    expect(n.marge).toBe(21_576 * 21);
    expect(n.marge).toBe(453_096);
    expect(n.charges).toBe(374_196 + 4 * 4_000);
    expect(n.charges).toBe(390_196);
    expect(n.resultat).toBe(453_096 - 390_196);
    expect(n.resultat).toBe(62_900);
    expect(n.coutComplet).toBe(auCentime((21_576 * 38 + 390_196) / 21_576));
    expect(n.coutComplet).toBe(56.08);
    expect(auCentime(59 - n.coutComplet)).toBe(2.92);
    expect(n.seuilDeRentabilite).toBe(Math.ceil(390_196 / 21));
    expect(n.seuilDeRentabilite).toBe(18_581);
  });

  it("SoundBox : 73 584 € de résultat ; Auris : 115 632 €, le meilleur des trois", () => {
    expect(a.soundbox.resultat).toBe(33_808 * 23 - (640_000 + 4 * 16_000));
    expect(a.soundbox.resultat).toBe(73_584);
    expect(a.auris.charges).toBe(135_000 + 4 * (16_000 + 8_000 + 12_000));
    expect(a.auris.resultat).toBe(14_616 * 27 - 279_000);
    expect(a.auris.resultat).toBe(115_632);
    expect(a.soundbox.coutComplet).toBe(auCentime((33_808 * 28 + 704_000) / 33_808));
    expect(a.auris.coutComplet).toBe(auCentime((14_616 * 52 + 279_000) / 14_616));
    expect([a.soundbox.coutComplet, a.auris.coutComplet]).toEqual([48.82, 71.09]);
  });

  it("le résultat est (prix − coût complet) × ventes, au centime près de l'arrondi du coût complet", () => {
    for (const e of a.enseignes) expect(Math.abs((e.offre.prix - e.coutComplet) * e.ventes - e.resultat)).toBeLessThan(0.005 * e.ventes + 1e-6);
  });
});

describe("NOVA est aujourd'hui à son meilleur prix pour son offre : seul un changement d'offre paie", () => {
  it("le meilleur prix de l'offre actuelle est 59,50 €, qui ne gagne que 38 € de plus que 59 €", () => {
    const m = meilleurPrix(f);
    expect(m.prix).toBe(59.5);
    expect(m.resultat - 62_900).toBe(38);
  });

  it("le budget qualité de 4 000 € est le meilleur, et la communication ne paierait pas", () => {
    const r = (leviers: Parameters<typeof offreDeNova>[1]) => anneeDuMarche(f, { nova: leviers }).nova.resultat;
    const parBudget = [0, 2_000, 3_000, 4_000, 5_000, 6_000, 8_000, 16_000].map((b) => r({ budgetQualite: b }));
    expect(Math.max(...parBudget)).toBe(r({ budgetQualite: 4_000 }));
    for (const b of [1_000, 2_000, 4_000, 8_000]) expect(r({ budgetCommunication: b })).toBeLessThan(62_900);
  });

  it("monter le prix sans rien d'autre, jusqu'au prix de la place (69 €), fait perdre 35 588 €", () => {
    expect(anneeDuMarche(f, { nova: { prix: 69 } }).nova.resultat).toBe(27_312);
  });
});

describe("domination par les coûts ou différenciation", () => {
  const s = strategiesGeneriques(f);

  it("la domination par les coûts : 54 €, gamme standard, 2 000 € de qualité ; 23 776 enceintes, 33,97 %, 20 € par enceinte, 50,07 € de coût complet, 93 324 €", () => {
    const a = Math.pow(59 / 54, 4) * Math.pow(0.92 - 0.02, 2);
    expect(s.couts.ventes).toBe(ventesDeNova(a));
    expect(s.couts.ventes).toBe(23_776);
    expect(Math.round(s.couts.part * 10_000) / 100).toBe(33.97);
    expect(s.couts.margeUnitaire).toBe(54 - 19 - 15);
    expect(s.couts.charges).toBe(374_196 + 4 * 2_000);
    expect(s.couts.resultat).toBe(23_776 * 20 - 382_196);
    expect(s.couts.resultat).toBe(93_324);
    expect(s.couts.coutComplet).toBe(auCentime((23_776 * 34 + 382_196) / 23_776));
    expect(s.couts.coutComplet).toBe(50.07);
  });

  it("la différenciation : 69 €, gamme soignée, 8 000 € de qualité, 2 000 € de communication ; 20 376 enceintes, 29,11 %, 26 €, 63,33 €, 115 580 €", () => {
    const a = Math.pow(59 / 69, 4) * Math.pow(1.28 + 0.02, 2) * (1 + 0.02);
    expect(s.differenciation.ventes).toBe(ventesDeNova(a));
    expect(s.differenciation.ventes).toBe(20_376);
    expect(Math.round(s.differenciation.part * 10_000) / 100).toBe(29.11);
    expect(s.differenciation.margeUnitaire).toBe(69 - 27 - 16);
    expect(s.differenciation.charges).toBe(374_196 + 4 * (8_000 + 2_000));
    expect(s.differenciation.resultat).toBe(20_376 * 26 - 414_196);
    expect(s.differenciation.resultat).toBe(115_580);
    expect(s.differenciation.coutComplet).toBe(auCentime((20_376 * 43 + 414_196) / 20_376));
    expect(s.differenciation.coutComplet).toBe(63.33);
  });

  it("les parts ET les marges diffèrent : la stratégie de coûts vend le plus et gagne le moins par enceinte, la différenciation l'inverse", () => {
    expect(s.couts.part).toBeGreaterThan(s.milieu.part + 0.02);
    expect(s.milieu.part).toBeGreaterThan(s.differenciation.part + 0.015);
    expect([s.couts.margeUnitaire, s.milieu.margeUnitaire, s.differenciation.margeUnitaire]).toEqual([20, 21, 26]);
    expect([s.couts.coutComplet, s.milieu.coutComplet, s.differenciation.coutComplet]).toEqual([50.07, 56.08, 63.33]);
  });

  it("le milieu est dernier, et il est coincé : ni la part des coûts, ni la marge de la différenciation", () => {
    expect(s.rangDuMilieu).toBe("dernier");
    expect(s.meilleure.code).toBe("differenciation");
    expect(s.coince).toBe(true);
    expect(s.ecartCouts).toBe(93_324 - 62_900);
    expect(s.ecartCouts).toBe(30_424);
    expect(s.ecartDifferenciation).toBe(115_580 - 62_900);
    expect(s.ecartDifferenciation).toBe(52_680);
    // Des écarts nets, loin de l'arrondi.
    expect(Math.min(s.ecartCouts, s.ecartDifferenciation - s.ecartCouts)).toBeGreaterThan(20_000);
  });

  it("les seuils de rentabilité, et les ventes qu'il faudrait à la stratégie de coûts pour égaler la différenciation (24 889)", () => {
    expect([s.couts.seuilDeRentabilite, s.milieu.seuilDeRentabilite, s.differenciation.seuilDeRentabilite]).toEqual([
      Math.ceil(382_196 / 20),
      Math.ceil(390_196 / 21),
      Math.ceil(414_196 / 26),
    ]);
    expect([s.couts.seuilDeRentabilite, s.differenciation.seuilDeRentabilite]).toEqual([19_110, 15_931]);
    expect(s.ventesDesCoutsPourEgalerLaDifferenciation).toBe(Math.ceil((115_580 + 382_196) / 20));
    expect(s.ventesDesCoutsPourEgalerLaDifferenciation).toBe(24_889);
    expect(ventesPourAtteindre(s.couts, s.couts.resultat)).toBe(23_776);
  });

  it("aucune stratégie du chapitre ne bute sur la capacité de la ligne", () => {
    for (const x of [s.couts, s.milieu, s.differenciation]) expect(Math.max(...x.trimestres.map((t) => t.demande))).toBeLessThan(7_000);
  });

  it("chaque stratégie est près de son meilleur prix : 54,50 € pour les coûts, 67,50 € pour la différenciation", () => {
    expect(meilleurPrix(f, { nova: { gamme: "standard", budgetQualite: 2_000 } })).toEqual({ prix: 54.5, resultat: 93_404 });
    expect(meilleurPrix(f, { nova: { gamme: "soignee", budgetQualite: 8_000, budgetCommunication: 2_000 } })).toEqual({ prix: 67.5, resultat: 116_670 });
  });

  it("ce que NOVA fait change les résultats des concurrents : SoundBox perd quand NOVA casse les prix", () => {
    expect(s.annees.couts.soundbox.resultat).toBe(38_256);
    expect(s.annees.differenciation.soundbox.resultat).toBe(92_904);
    expect(s.annees.couts.soundbox.resultat).toBeLessThan(s.annees.milieu.soundbox.resultat);
  });
});

describe("baisser les prix sans rien couper : la demi-mesure", () => {
  const d = demiMesure(f);

  it("54 €, sans rien couper : 27 188 enceintes, 38,84 %, 16 € par enceinte, 52,35 € de coût complet, 44 812 €", () => {
    expect(d.demi.ventes).toBe(ventesDeNova(Math.pow(59 / 54, 4)));
    expect(d.demi.ventes).toBe(27_188);
    expect(d.demi.part).toBeCloseTo(27_188 / 70_000, 12);
    expect(Math.round(d.demi.part * 10_000) / 100).toBe(38.84);
    expect(d.demi.margeUnitaire).toBe(54 - 38);
    expect(d.demi.resultat).toBe(27_188 * 16 - 390_196);
    expect(d.demi.resultat).toBe(44_812);
    expect(d.demi.coutComplet).toBe(auCentime((27_188 * 38 + 390_196) / 27_188));
    expect(d.demi.coutComplet).toBe(52.35);
  });

  it("ni la part ni la marge ne sont celles de la stratégie de coûts (le défaut « 24,4 % contre 24,4 % » est réglé)", () => {
    expect(d.demi.part - d.couts.part).toBeGreaterThan(0.04);
    expect(d.demi.margeUnitaire).toBe(16);
    expect(d.couts.margeUnitaire).toBe(20);
    expect(d.coutVariableEnPlus).toBe(4);
    expect(d.budgetsEnPlus).toBe(8_000);
  });

  it("la demi-mesure fait pire que tout : −48 512 € face aux coûts, −18 088 € face au milieu ; la stratégie de coûts entière gagne", () => {
    expect(d.ecartAvecLesCouts).toBe(44_812 - 93_324);
    expect(d.ecartAvecLesCouts).toBe(-48_512);
    expect(d.ecartAvecLeMilieu).toBe(44_812 - 62_900);
    expect(d.ecartAvecLeMilieu).toBe(-18_088);
    expect(d.verdict).toBe("couts");
  });

  it("elle reste sous la capacité de la ligne : 6 797 enceintes par trimestre pour 7 000", () => {
    expect(d.demi.trimestres.map((t) => t.demande)).toEqual([6_797, 6_797, 6_797, 6_797]);
    expect(d.demi.refusees).toBe(0);
  });
});

describe("battre Auris en résultat", () => {
  it("aucune stratégie du chapitre ne bat Auris : −4 380 € avec les coûts, −9 772 € avec la différenciation", () => {
    const c = battreAuris(f, { nova: { prix: 54, gamme: "standard", budgetQualite: 2_000 } });
    expect(c.auris.ventes).toBe(ventesDe(A_AURIS, Math.pow(59 / 54, 4) * 0.81));
    expect(c.auris.resultat).toBe(c.auris.ventes * 27 - 279_000);
    expect([c.nova.resultat, c.auris.resultat, c.ecart]).toEqual([93_324, 97_704, -4_380]);
    const d = battreAuris(f, { nova: { prix: 69, gamme: "soignee", budgetQualite: 8_000, budgetCommunication: 2_000 } });
    expect([d.nova.resultat, d.auris.resultat, d.ecart]).toEqual([115_580, 125_352, -9_772]);
    expect(battreAuris(f).battue).toBe(false);
  });

  it("la gamme soignée vendue 67 € ou moins, avec les budgets d'aujourd'hui, bat Auris ; à 67 €, c'est aussi le meilleur résultat de NOVA", () => {
    const a = (prix: number) => battreAuris(f, { nova: { gamme: "soignee", prix } });
    expect([64, 65, 66, 67, 68, 69].map((p) => a(p).ecart)).toEqual([22_868, 17_768, 11_768, 4_988, -2_484, -10_536]);
    expect(a(67).nova.resultat).toBe(122_348);
    expect(meilleurPrix(f, { nova: { gamme: "soignee" } })).toEqual({ prix: 67, resultat: 122_348 });
    // Battre Auris n'est pas gagner le plus : à 64 €, l'écart est plus grand, le résultat de NOVA plus petit.
    expect(a(64).nova.resultat).toBeLessThan(a(67).nova.resultat);
  });
});

describe("la carte du marché et l'espace libre", () => {
  const c = carteDuMarche(f);

  it("le prix moyen du marché : 4 151 856 € ÷ 70 000 enceintes = 59,31 € ; la qualité moyenne : 3,24 ÷ 3 = 1,08", () => {
    expect(c.chiffreDAffaires).toBe(1_272_984 + 33_808 * 51 + 14_616 * 79);
    expect(c.chiffreDAffaires).toBe(4_151_856);
    expect(c.ventes).toBe(70_000);
    expect(c.prixMoyen).toBe(auCentime(4_151_856 / 70_000));
    expect(c.prixMoyen).toBe(59.31);
    expect(c.sommeDesQualites).toBe(3.24);
    expect(c.qualiteMoyenne).toBe(1.08);
  });

  it("les indices et les lectures : NOVA (99, 93) intermédiaire, SoundBox (86, 83) les coûts, Auris (133, 124) la différenciation", () => {
    const attendu = [
      ["NOVA", Math.round((59 / 59.31) * 100), Math.round((1 / 1.08) * 100), "intermediaire"],
      ["SoundBox", Math.round((51 / 59.31) * 100), Math.round((0.9 / 1.08) * 100), "couts"],
      ["Auris", Math.round((79 / 59.31) * 100), Math.round((1.34 / 1.08) * 100), "differenciation"],
    ];
    expect(c.enseignes.map((e) => [e.nom, e.indicePrix, e.indiceQualite, e.lecture])).toEqual(attendu);
    expect(attendu.map((x) => [x[1], x[2]])).toEqual([
      [99, 93],
      [86, 83],
      [133, 124],
    ]);
    // Aucune lecture n'est au bord de la règle : chaque indice est à 4 points au moins des seuils (95, 105 en prix ; 100 en qualité).
    for (const e of c.enseignes) {
      expect(Math.min(Math.abs(e.indicePrix - 95), Math.abs(e.indicePrix - 105))).toBeGreaterThanOrEqual(4);
      expect(Math.abs(e.indiceQualite - 100)).toBeGreaterThanOrEqual(7);
    }
    expect(lirePosition(f, 94, 99)).toBe("couts");
    expect(lirePosition(f, 95, 99)).toBe("intermediaire");
    expect(lirePosition(f, 106, 101)).toBe("differenciation");
  });

  it("l'espace libre se lit sur les deux indices : entre NOVA et Auris (46,0 points), pas entre SoundBox et NOVA (16,4)", () => {
    expect(c.voisines.map((v) => [v.bas.nom, v.haut.nom, v.ecartDePrix, v.ecartDeQualite])).toEqual([
      ["SoundBox", "NOVA", 99 - 86, 93 - 83],
      ["NOVA", "Auris", 133 - 99, 124 - 93],
    ]);
    expect(c.voisines[0]!.distance).toBeCloseTo(Math.sqrt(13 * 13 + 10 * 10), 12);
    expect(c.voisines[1]!.distance).toBeCloseTo(Math.sqrt(34 * 34 + 31 * 31), 12);
    expect(c.espaceLibre.entre.bas.nom).toBe("NOVA");
    expect(c.espaceLibre.entre.haut.nom).toBe("Auris");
    expect(c.espaceLibre.prix).toBe((59 + 79) / 2);
    expect(c.espaceLibre.qualite).toBe(auCentime((1 + 1.34) / 2));
    expect([c.espaceLibre.prix, c.espaceLibre.qualite, c.espaceLibre.indicePrix, c.espaceLibre.indiceQualite]).toEqual([69, 1.17, 116, 108.5]);
    // Ici, le plus grand écart de prix seul désigne les mêmes voisines : ce qui change, c'est que la place a une qualité.
    expect(c.plusGrandEcartDePrix).toBe(c.espaceLibre.entre);
  });

  it("le meilleur résultat de l'année est celui d'Auris, la différenciation", () => {
    expect(c.meilleure.nom).toBe("Auris");
    expect(c.meilleure.lecture).toBe("differenciation");
  });

  it("les deux coins vides de la carte ne sont pas des places à prendre", () => {
    // Prix haut, qualité de la gamme actuelle : presque personne n'achète.
    const cher = anneeDuMarche(f, { nova: { prix: 79 } }).nova;
    expect(cher.ventes).toBe(ventesDeNova(Math.pow(59 / 79, 4)));
    expect(cher.resultat).toBe(-40_712);
    // La gamme soignée au prix d'aujourd'hui : la demande dépasse la ligne, et la marge fond.
    const genereux = anneeDuMarche(f, { nova: { gamme: "soignee" } }).nova;
    expect(genereux.ventes).toBe(28_000);
    expect(genereux.refusees).toBeGreaterThan(0);
    expect(genereux.margeUnitaire).toBe(16);
    expect(genereux.resultat).toBe(28_000 * 16 - 390_196);
    expect(genereux.resultat).toBeLessThan(62_900);
  });
});

describe("aller dans l'espace libre", () => {
  const x = allerDansLEspaceLibre(f);

  it("la place : 69 €, +16,9 % sur le prix de NOVA, l'indice 116 ; sa qualité (1,17) demande la gamme soignée", () => {
    expect(x.place.prix).toBe(69);
    expect(Math.round(x.variationDuPrix * 1000) / 10).toBe(16.9);
    expect(x.indiceDePrixDeLaPlace).toBe(Math.round((69 / 59.31) * 100));
    expect(x.indiceDePrixDeLaPlace).toBe(116);
    expect(gammePourLaQualite(f, 1.17)).toBe("soignee");
    expect(gammePourLaQualite(f, 1)).toBe("actuelle");
    expect(gammePourLaQualite(f, 0.9)).toBe("standard");
    expect(gammePourLaQualite(f, 1.5)).toBeNull();
    expect(x.gamme).toBe("soignee");
  });

  it("par le seul prix (l'ancienne lecture), NOVA perd 35 588 € ; avec la gamme soignée, elle gagne 57 856 €", () => {
    expect(x.prixSeul.ventes).toBe(13_468);
    expect(x.prixSeul.resultat).toBe(13_468 * 31 - 390_196);
    expect(x.ecartPrixSeul).toBe(27_312 - 62_900);
    expect(x.ecartPrixSeul).toBe(-35_588);
    expect(x.avecLaQualite!.ventes).toBe(ventesDeNova(Math.pow(59 / 69, 4) * 1.28 * 1.28));
    expect(x.avecLaQualite!.ventes).toBe(19_652);
    expect(Math.round(x.avecLaQualite!.part * 10_000) / 100).toBe(28.07);
    expect(x.avecLaQualite!.resultat).toBe(19_652 * 26 - 390_196);
    expect(x.ecartAvecLaQualite).toBe(120_756 - 62_900);
    expect(x.ecartAvecLaQualite).toBe(57_856);
    expect(x.verdict).toBe("y-aller-avec-la-qualite");
  });

  it("à la place, la gamme soignée sans les budgets en plus fait mieux que la différenciation du chapitre (120 756 € contre 115 580 €)", () => {
    expect(anneeAvec(f, "place-et-qualite").nova.resultat).toBe(120_756);
    expect(anneeAvec(f, "prix-de-la-place").nova.resultat).toBe(27_312);
    expect(anneeAvec(f, "place-et-qualite").nova.resultat).toBeGreaterThan(anneeAvec(f, "differenciation").nova.resultat);
  });
});

describe("le capital-image et le label", () => {
  it("au budget du cours (12 000 €), l'effort vaut ln 2 = 0,69 ; le capital 0,24, 0,40, 0,50 puis 0,57", () => {
    const k = capitalImage(f, [12_000, 12_000, 12_000, 12_000]);
    expect(effortRse(f, 12_000)).toBeCloseTo(LN2, 12);
    const fins = [0.35 * LN2];
    for (let i = 1; i < 4; i++) fins.push(0.65 * fins[i - 1]! + 0.35 * LN2);
    k.fins.forEach((c, i) => expect(c).toBeCloseTo(fins[i]!, 12));
    expect(k.fins.map((c) => auCentime(c))).toEqual([0.24, 0.4, 0.5, 0.57]);
    expect(k.ouvertures[0]).toBe(0);
    expect(k.ouvertures[1]).toBeCloseTo(fins[0]!, 12);
    // À budget constant : effort × (1 − 0,65 puissance n).
    expect(capitalABudgetConstant(f, 12_000, 4)).toBeCloseTo(LN2 * (1 - Math.pow(0.65, 4)), 12);
  });

  it("au budget du cours, le label ne vient jamais : le plafond ln 2 reste sous 0,70 ; il faudrait plus de 12 165,03 € par trimestre", () => {
    expect(LN2).toBeLessThan(0.7);
    expect(trimestresPourLeSeuil(f, 12_000)).toBeNull();
    expect(budgetPlancherDuLabel(f)).toBe(auCentime(12_000 * (Math.exp(0.7) - 1)));
    expect(budgetPlancherDuLabel(f)).toBe(12_165.03);
    // Auris, qui dépense ce budget depuis des années, n'a pas le label.
    expect(anneeDuMarche(f).auris.labels.premier).toBeNull();
  });

  it("dépenser tard compte plus : un euro d'effort au trimestre 3 pèse 0,35 dans le capital de la fin du trimestre 3, au trimestre 1 seulement 0,15", () => {
    const p = poidsDesTrimestres(f, 3);
    expect(p[0]).toBeCloseTo(0.35 * 0.65 * 0.65, 12);
    expect(p[1]).toBeCloseTo(0.35 * 0.65, 12);
    expect(p[2]).toBeCloseTo(0.35, 12);
    expect(somme(p)).toBeCloseTo(1 - Math.pow(0.65, 3), 12);
    expect(somme(p)).toBeCloseTo(0.725375, 12);
  });

  it("les mêmes 56 000 € : dans l'ordre 4 000, 16 000, 36 000 €, le label au T4 ; dans l'ordre inverse, raté", () => {
    const tard = capitalImage(f, [4_000, 16_000, 36_000, 0]);
    const tot = capitalImage(f, [36_000, 16_000, 4_000, 0]);
    const k3 = (b: number[]) => 0.35 * (0.65 * 0.65 * Math.log(1 + b[0]! / 12_000) + 0.65 * Math.log(1 + b[1]! / 12_000) + Math.log(1 + b[2]! / 12_000));
    expect(tard.fins[2]).toBeCloseTo(k3([4_000, 16_000, 36_000]), 12);
    expect(tot.fins[2]).toBeCloseTo(k3([36_000, 16_000, 4_000]), 12);
    expect(auCentime(tard.fins[2]!)).toBe(0.72);
    expect(auCentime(tot.fins[2]!)).toBe(0.5);
    expect(labelsDeLAnnee(f, tard.ouvertures).premier).toBe(4);
    expect(labelsDeLAnnee(f, tot.ouvertures).premier).toBeNull();
  });

  it("le label se lit sur le capital d'ouverture, jamais avant le trimestre 3, et dure 2 trimestres", () => {
    expect(labelsDeLAnnee(f, [0.8, 0.8, 0.1, 0.1])).toEqual({ accordes: [], actifs: [false, false, false, false], premier: null });
    expect(labelsDeLAnnee(f, [0, 0, 0.7, 0.1])).toEqual({ accordes: [3], actifs: [false, false, true, true], premier: 3 });
    expect(labelsDeLAnnee(f, [0, 0, 0.1, 0.75]).actifs).toEqual([false, false, false, true]);
  });

  it("le budget constant qui donne le label au T4 : 19 498,02 € ; à 19 500 €, le capital du T3 ne passe que de 0,00005 (l'ancienne fragilité)", () => {
    expect(budgetConstantDuLabel(f, 3)).toBe(auCentime(12_000 * (Math.exp(0.7 / 0.725375) - 1)));
    expect(budgetConstantDuLabel(f, 3)).toBe(19_498.02);
    expect(capitalABudgetConstant(f, 19_500, 3) - 0.7).toBeLessThan(0.0001);
  });

  it("le plan le moins cher pour le label au T4 : environ 6 158, 15 935 et 30 977 €, 53 070 € ; sous les 58 494 € du budget constant", () => {
    const p = planLeMoinsCherDuLabel(f, 3);
    // Chaque euro rapporte autant : (12 000 + budget) proportionnel au poids du trimestre.
    const w = [0.35 * 0.4225, 0.35 * 0.65, 0.35];
    const lnLambda = (0.7 - somme(w.map((x) => x * Math.log(x / 12_000)))) / somme(w);
    w.forEach((x, i) => expect(p.budgets[i]).toBeCloseTo(Math.exp(lnLambda) * x - 12_000, 6));
    expect(Math.round(p.total)).toBe(53_070);
    expect(capitalImage(f, p.budgets).fins[2]).toBeCloseTo(0.7, 9);
    expect(p.total).toBeLessThan(3 * 19_498.02);
  });
});

describe("l'engagement RSE dans l'année", () => {
  it("au budget du cours : 48 000 €, 915 enceintes de plus, 19 215 € de marge gagnée, −28 785 € : pas encore", () => {
    const r = engagementRse(f, [12_000, 12_000, 12_000, 12_000]);
    const fins = capitalImage(f, [12_000, 12_000, 12_000]).fins;
    const ventes = [0, ...fins].map((k) => Math.round(((1 + 0.22 * k) / (1 + 0.22 * k + A_CONCURRENTS)) * 17_500));
    expect(ventes).toEqual([5_394, 5_590, 5_714, 5_793]);
    expect(r.avec.trimestres.map((t) => t.ventes)).toEqual(ventes);
    expect(r.cout).toBe(48_000);
    expect(r.ventesGagnees).toBe(somme(ventes) - 21_576);
    expect(r.ventesGagnees).toBe(915);
    expect(r.margeGagnee).toBe(915 * 21);
    expect(r.ecart).toBe(915 * 21 - 48_000);
    expect(r.ecart).toBe(-28_785);
    expect(r.verdict).toBe("pas-encore");
    expect(r.haussesDAttractivite[0]).toBe(0);
    expect(Math.round(r.haussesDAttractivite[1]! * 1000) / 10).toBe(5.3);
  });

  it("le plan qui monte (4 000, 16 000, 36 000, 0 €) obtient le label au T4 et finit mieux que le budget du cours (38 337 € contre 34 115 €)", () => {
    const r = engagementRse(f, [4_000, 16_000, 36_000, 0]);
    expect(r.labels.premier).toBe(4);
    expect(r.cout).toBe(56_000);
    expect(r.avec.trimestres[3]!.label).toBe(true);
    const k3 = capitalImage(f, [4_000, 16_000, 36_000]).fins[2]!;
    expect(r.avec.trimestres[3]!.ventes).toBe(Math.round((((1 + 0.22 * k3) * 1.15) / ((1 + 0.22 * k3) * 1.15 + A_CONCURRENTS)) * 17_500));
    expect(r.avec.resultat).toBe(38_337);
    expect(engagementRse(f, [12_000, 12_000, 12_000, 12_000]).avec.resultat).toBe(34_115);
    expect(r.cout).toBeLessThan(58_500);
  });

  it("viser le label avec 24 000 € par trimestre : effort ln 3, capital du T3 0,80, une marge nette sur le seuil ; mais l'année finit 25 383 € sous le budget du cours", () => {
    const v = viserLeLabel(f, 24_000);
    expect(v.effort).toBeCloseTo(Math.log(3), 12);
    expect(v.capitalT3).toBeCloseTo(Math.log(3) * (1 - Math.pow(0.65, 3)), 12);
    expect(auCentime(v.capitalT3)).toBe(0.8);
    expect(v.capitalT3 - 0.7).toBeGreaterThan(0.09);
    expect(trimestresPourLeSeuil(f, 24_000)).toBe(3);
    expect(v.labelAuTrimestre).toBe(4);
    expect(v.cout).toBe(96_000);
    expect(v.coutEnPlus).toBe(48_000);
    expect(v.vers.avec.trimestres.map((t) => t.ventes)).toEqual([5_394, 5_702, 5_894, 6_578]);
    expect(v.vers.avec.resultat).toBe(8_732);
    expect(v.ecartAuSans).toBe(8_732 - 62_900);
    expect(v.ecartAuDepart).toBe(8_732 - 34_115);
    expect(v.ecartAuDepart).toBe(-25_383);
    expect(v.verdict).toBe("pas-cette-annee");
  });

  it("aucun plan RSE ne bute sur la capacité : la demande gagnée se vend", () => {
    for (const plan of [[12_000, 12_000, 12_000, 12_000], [24_000, 24_000, 24_000, 24_000], [4_000, 16_000, 36_000, 0]]) {
      const r = engagementRse(f, plan);
      expect(r.avec.refusees).toBe(0);
      expect(r.verdict).not.toBe("la-demande-ne-se-vend-pas");
    }
  });
});

describe("les leviers sont des paramètres : les laboratoires peuvent tout bouger", () => {
  it("sans la qualité perçue (élasticité 0), la différenciation ne vaut plus rien et la demi-mesure devient la plus vendeuse", () => {
    const sansQualite: FicheDuMarche = { ...f, attractivite: { ...f.attractivite, elasticiteALaQualite: 0 } };
    const s = strategiesGeneriques(sansQualite);
    expect(s.differenciation.resultat).toBeLessThan(s.milieu.resultat);
    expect(s.meilleure.code).toBe("couts");
  });

  it("un concurrent qui change son offre change le marché de NOVA : SoundBox à 48 € lui prend des ventes", () => {
    const a = anneeDuMarche(f, { concurrents: { soundbox: { prix: 48 } } });
    expect(a.nova.ventes).toBeLessThan(21_576);
    expect(a.soundbox.offre.prix).toBe(48);
  });

  it("un marché plus grand fait buter la demi-mesure sur la ligne : la demande en plus est perdue", () => {
    const d = demiMesure(f, { marcheParTrimestre: 20_000 });
    expect(d.demi.ventes).toBe(28_000);
    expect(d.demi.refusees).toBeGreaterThan(0);
  });
});
