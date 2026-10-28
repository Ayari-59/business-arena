import { describe, expect, it } from "vitest";
import { COMPTES, COUT_VARIABLE_D_UNE_JOURNEE, PRIX_CATALOGUE } from "../../src/config/cours/monde/atlas-conseil";
import { anneeDeProduction } from "../../src/config/cours/monde/capacite";
import {
  ATLAS_CONDITIONS,
  DELAI_DE_LA_COMMANDE_PUBLIQUE,
  DELAI_MAXIMAL_CONVENU,
  EXIGIBILITE_DE_DROIT_COMMUN,
  INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT,
  JOURS_DE_L_ANNEE_BANCAIRE,
  JOURS_DE_L_ANNEE_CIVILE,
  JOURS_DU_TRIMESTRE,
  MAJORATION_DU_TAUX_BCE,
  MARTEL_ET_FILS,
  MULTIPLE_DU_TAUX_LEGAL,
  NOVA_DELAIS,
  TAUX_D_INTERET_LEGAL,
  TAUX_DE_REFINANCEMENT_BCE,
  type FicheDeLAffaire,
  type FicheDesDelaisDeNova,
  type FicheDuBatiment,
} from "../../src/config/cours/monde/delais-et-tva";
import {
  affaireAuxConditions,
  choisirUneOffre,
  comparerAvecLHabituelle,
  comparerLesRegimes,
  coutDeLAffacturage,
  creancesDuTrimestre,
  declarationDuTrimestre,
  declarationsDeLAnnee,
  delaiEnPlus,
  delaiFournisseurAllonge,
  delaiMoyen,
  encaisseDansLeTrimestre,
  encoursAuDelai,
  escompteDuFournisseur,
  escompterChaqueTrimestre,
  factureDeCampusTech,
  facturesMensuellesEnCours,
  fluxDeTvaDuTrimestre,
  joursDeDecouvertQuiValentLEscompte,
  mobiliserUneFacture,
  retardDeCampusTech,
  tauxDesPenalites,
  tvaALaCloture,
  ventesDuTrimestre,
  versementSuivant,
} from "../../src/config/cours/monde/delais";
import { BALANCE_AVANT_INVENTAIRE, CAMPUSTECH, FACTURES_DE_COMPOSANTS_HT, PLACEMENT } from "../../src/config/cours/monde/exercice-de-nova";
import { NOVA_CAPACITE } from "../../src/config/cours/monde/nova-capacite";
import { AUTRES_COUTS_PAR_ENCEINTE, COMPOSANTS_PAR_ENCEINTE, JOURS_DU_MOIS_COMMERCIAL, PRIX_DE_L_ENCEINTE, TAUX_DE_TVA, VENTES_A_CAMPUSTECH } from "../../src/config/cours/monde/nova-gestion";

/**
 * LES DÉLAIS ET LA TVA DU COURS (monde/delais.ts sur monde/delais-et-tva.ts), REFAITS À LA MAIN.
 *
 * Chaque chiffre attendu est recalculé ici sur la fiche, sans les fonctions du modèle ; les valeurs
 * absolues sont épinglées (un changement de la fiche se voit). La fiche est d'abord confrontée aux
 * autres fiches du monde (la NOVA de la comptabilité et de la capacité, l'ATLAS CONSEIL du parcours
 * NDRC) et au droit qu'elle pose. Puis les propriétés qui font voir les notions sont gardées : une
 * TVA due qui change selon l'exigibilité, un crédit de TVA qui ne naît qu'à un régime, une TVA de
 * clients que seul le régime des débits fait avancer, un fournisseur moins cher qui coûte plus en
 * trésorerie, un retard dont les pénalités dépassent le coût, un escompte qui coûte moins ou plus que
 * le découvert selon les jours.
 */

const m = MARTEL_ET_FILS;
const n = NOVA_DELAIS;
const a = ATLAS_CONDITIONS;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

/** Les travaux de MARTEL & FILS, HT, aux rangs −1 à 4 (T3 et T4 de N − 1, puis T1 à T4 de N). */
const COMMERCES = [72_000, 90_000, 45_000, 120_000, 75_000, 105_000];
const COLLECTIVITES = [126_000, 120_000, 60_000, 150_000, 135_000, 120_000];
const ENTREPRISES = [117_000, 180_000, 90_000, 210_000, 120_000, 225_000];
const ACHATS = [144_000, 180_000, 90_000, 216_000, 150_000, 216_000];
/** Rang r à l'indice r + 1. */
const ix = (r: number) => r + 1;
const ventes = (r: number) => COMMERCES[ix(r)]! + COLLECTIVITES[ix(r)]! + ENTREPRISES[ix(r)]!;
/** Encaissé dans le trimestre : comptant, 30 jours (2/3 + 1/3 d'avant), 60 jours (1/3 + 2/3 d'avant). */
const encaisse = (r: number) =>
  COMMERCES[ix(r)]! + (COLLECTIVITES[ix(r)]! * 2) / 3 + COLLECTIVITES[ix(r - 1)]! / 3 + ENTREPRISES[ix(r)]! / 3 + (ENTREPRISES[ix(r - 1)]! * 2) / 3;
const creancesHT = (r: number) => COLLECTIVITES[ix(r)]! / 3 + (ENTREPRISES[ix(r)]! * 2) / 3;
const investissement = (r: number) => (r === 2 ? 210_000 : 0);
const deductible = (r: number) => (ACHATS[ix(r)]! + investissement(r)) * 0.2;

/** La facture de CampusTech, refaite : 320 × 59 € HT, 20 % de TVA. */
const CAMPUS_HT = 320 * 59;
const CAMPUS_TTC = CAMPUS_HT * 1.2;

describe("le droit que la fiche pose", () => {
  it("le délai convenu entre professionnels : 60 jours de la facture, ou 45 jours fin de mois ; 30 jours pour une collectivité", () => {
    expect(DELAI_MAXIMAL_CONVENU).toEqual({ joursDeLaFacture: 60, joursFinDeMois: 45 });
    expect(DELAI_DE_LA_COMMANDE_PUBLIQUE).toBe(30);
    expect(JOURS_DU_TRIMESTRE).toBe(3 * 30);
    expect(JOURS_DE_L_ANNEE_BANCAIRE).toBe(360);
    expect(JOURS_DE_L_ANNEE_CIVILE).toBe(365);
  });

  it("les pénalités : le taux BCE de référence (2,15 %) majoré de 10 points, 12,15 % ; le plancher, 3 fois le taux légal (2,76 %), 8,28 % ; 40 € par facture", () => {
    expect(TAUX_DE_REFINANCEMENT_BCE.taux).toBe(0.0215);
    expect(TAUX_DE_REFINANCEMENT_BCE.dateDeReference).toBe("1er juillet 2025");
    expect(MAJORATION_DU_TAUX_BCE).toBe(0.1);
    expect(tauxDesPenalites("bce")).toBeCloseTo(0.0215 + 0.1, 12);
    expect(TAUX_D_INTERET_LEGAL.professionnels).toBe(0.0276);
    expect(MULTIPLE_DU_TAUX_LEGAL).toBe(3);
    expect(tauxDesPenalites("taux-legal")).toBeCloseTo(3 * 0.0276, 12);
    // Le taux BCE majoré respecte le plancher légal.
    expect(tauxDesPenalites("bce")).toBeGreaterThan(tauxDesPenalites("taux-legal"));
    expect(INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT).toBe(40);
  });

  it("l'exigibilité de droit commun : la livraison pour des biens, l'encaissement pour des services et des travaux", () => {
    expect(EXIGIBILITE_DE_DROIT_COMMUN).toEqual({ biens: "debits", services: "encaissements", travaux: "encaissements" });
  });
});

describe("la fiche tient debout, et c'est le monde des autres fiches", () => {
  it("MARTEL & FILS : des travaux, au régime des encaissements nommé, sans option pour les débits ; un taux de 20 %", () => {
    expect(m.code).toBe("batiment");
    expect(m.entreprise).toBe("MARTEL & FILS");
    expect(m.declaration.nature).toBe("travaux");
    expect(m.declaration.regime).toBe("encaissements");
    expect(m.declaration.regime).toBe(EXIGIBILITE_DE_DROIT_COMMUN[m.declaration.nature]);
    expect(m.declaration.optionPourLesDebits).toBe(false);
    expect(m.tauxDeTva).toBe(0.2);
  });

  it("MARTEL & FILS : des délais permis par la loi, des montants en tiers ronds d'un trimestre, des achats proches de 45 % des travaux", () => {
    expect(m.clienteles.map((g) => [g.code, g.delai])).toEqual([
      ["commerces", 0],
      ["collectivites", 30],
      ["entreprises", 60],
    ]);
    expect(m.clienteles.map((g) => g.ventesHT)).toEqual([COMMERCES, COLLECTIVITES, ENTREPRISES]);
    for (const g of m.clienteles) for (const v of g.ventesHT) expect(v % 3_000, g.code).toBe(0);
    expect(m.achatsHT).toEqual(ACHATS);
    expect(m.fournisseur.delai).toBeLessThanOrEqual(60);
    expect(m.fournisseur.delai).toBe(45);
    for (let r = -1; r <= 4; r++) {
      expect(ACHATS[ix(r)]! / ventes(r)).toBeGreaterThan(0.4);
      expect(ACHATS[ix(r)]! / ventes(r)).toBeLessThan(0.5);
    }
    expect(m.investissements).toEqual([{ rang: 2, libelle: "un camion-benne, deux fourgons et un échafaudage", montantHT: 210_000 }]);
    expect(somme([1, 2, 3, 4].map(ventes))).toBe(1_455_000);
  });

  it("NOVA : la NOVA One à 59 € HT, 22 € de composants chez Électro-Composants Lyon, CampusTech à 320 enceintes par mois facturées le 20", () => {
    expect(n.prixHT).toBe(PRIX_DE_L_ENCEINTE);
    expect(n.autresCoutsVariablesHT).toBe(AUTRES_COUTS_PAR_ENCEINTE);
    expect(n.tauxDeTva).toBe(TAUX_DE_TVA);
    expect(n.nature).toBe("biens");
    const ec = n.offres.find((o) => o.code === "electro-composants")!;
    expect(ec.prixHT).toBe(COMPOSANTS_PAR_ENCEINTE);
    expect(ec.delaiDePaiement).toBe(JOURS_DU_MOIS_COMMERCIAL);
    expect(n.campustech.enceintesParFacture).toBe(VENTES_A_CAMPUSTECH[0]);
    expect(n.campustech.jourDeFacturation).toBe(CAMPUSTECH.jourDeFacturation);
    expect(n.banque.tauxDuPlacement).toBe(PLACEMENT.tauxAnnuel);
  });

  it("NOVA : les ventes de N + 1 sont celles du plan de nova-capacite.ts, 26 000 enceintes", () => {
    expect(n.ventes).toEqual(anneeDeProduction(NOVA_CAPACITE).trimestres.map((x) => x.production));
    expect(n.ventes).toEqual([5_800, 7_000, 6_200, 7_000]);
    expect(somme(n.ventes)).toBe(26_000);
  });

  it("CampusTech : un délai convenu de 60 jours, le maximum permis, tenu comme dans les autres fiches ; le retard de 20 jours est une hypothèse", () => {
    expect(n.campustech.delaiConvenu).toBe(60);
    expect(n.campustech.delaiConvenu).toBeLessThanOrEqual(DELAI_MAXIMAL_CONVENU.joursDeLaFacture);
    expect(n.campustech.delaiReel).toBe(CAMPUSTECH.delai);
    expect(n.campustech.delaiReel).toBe(60);
    expect(n.campustech.retardSuppose).toBe(20);
    expect(n.campustech.delaiSiRetard).toBe(60 + 20);
    expect(n.penalites.base).toBe("bce");
  });

  it("Électro-Composants compté à 30 jours : au bilan du 31 décembre N, NOVA doit la facture de son dernier mois, et rien d'autre", () => {
    const dette401 = BALANCE_AVANT_INVENTAIRE.find((l) => l.compte === "401")!.credit;
    expect(dette401).toBe(FACTURES_DE_COMPOSANTS_HT[11]! * 1.2);
    expect(dette401).toBe(39_600);
  });

  it("les offres : toutes dans le délai légal ; la moins chère se paie comptant et demande du stock ; la plus chère fait le plus crédit", () => {
    for (const o of n.offres) expect(o.delaiDePaiement, o.code).toBeLessThanOrEqual(60);
    const [ec, asia, eu] = n.offres;
    expect([ec!.prixHT, asia!.prixHT, eu!.prixHT]).toEqual([22, 19.8, 23.1]);
    expect(asia!.prixHT).toBeCloseTo(22 * 0.9, 12);
    expect(eu!.prixHT).toBeCloseTo(22 * 1.05, 12);
    expect([ec!.delaiDePaiement, asia!.delaiDePaiement, eu!.delaiDePaiement]).toEqual([30, 0, 60]);
    expect([ec!.joursDeStock, asia!.joursDeStock, eu!.joursDeStock]).toEqual([0, 45, 0]);
    expect(asia!.delaiDeLivraison).toBeGreaterThan(ec!.delaiDeLivraison);
    expect(n.offreHabituelle).toBe("electro-composants");
  });

  it("ATLAS CONSEIL : le prix catalogue de 800 € HT, 150 € de coût variable, et Kerval Distribution, un compte payé au catalogue en N", () => {
    expect(a.code).toBe("conseil");
    expect(a.prixHT).toBe(PRIX_CATALOGUE);
    expect(a.coutVariableHT).toBe(COUT_VARIABLE_D_UNE_JOURNEE.fraisDeMission + COUT_VARIABLE_D_UNE_JOURNEE.supports);
    expect(a.coutVariableHT).toBe(150);
    const kerval = COMPTES.find((c) => c.code === a.compte)!;
    expect(kerval.nom).toBe(a.client);
    expect(kerval.chiffreDAffaires / kerval.journees).toBe(800);
    expect(a.nature).toBe("services");
    expect(a.delai).toBe(60);
  });
});

describe("1. les encours au délai", () => {
  it("créance = flux × délai ÷ 90 ; encaissé = flux − sa part due + la part due d'avant ; délai moyen = encours ÷ flux × 90", () => {
    expect(encoursAuDelai(120_000, 30)).toBe(40_000);
    expect(encoursAuDelai(225_000, 60)).toBe(150_000);
    expect(encoursAuDelai(105_000, 0)).toBe(0);
    expect(encoursAuDelai(100_000, 120)).toBe(100_000);
    expect(encaisseDansLeTrimestre(150_000, 60_000, 30)).toBe(150_000 - 50_000 + 20_000);
    expect(delaiMoyen(45_000, 90_000)).toBe(45);
  });

  it("les factures mensuelles du 20 encore dues au 90e jour : 3 à 80 jours, 2 à 60, aucune comptant, 4 à 120", () => {
    // À 80 jours : les factures des jours 20, 50 et 80 (dues aux jours 100, 130, 160) ; celle du jour −10 est payée au jour 70.
    expect(facturesMensuellesEnCours(20, 80)).toBe(3);
    // À 60 jours : la facture du jour 20 est payée au jour 80 ; restent celles des jours 50 et 80.
    expect(facturesMensuellesEnCours(20, 60)).toBe(2);
    expect(facturesMensuellesEnCours(20, 0)).toBe(0);
    expect(facturesMensuellesEnCours(20, 120)).toBe(4);
  });
});

describe("2. la TVA et son exigibilité (MARTEL & FILS)", () => {
  it("les travaux, les encaissements et les créances de chaque trimestre, refaits", () => {
    for (let r = 0; r <= 4; r++) {
      const v = ventesDuTrimestre(m, r);
      expect(v.ventesHT, String(r)).toBe(ventes(r));
      expect(v.encaissementsHT).toBe(encaisse(r));
      expect(v.creancesHT).toBe(creancesHT(r));
      expect(v.creancesTTC).toBe(creancesHT(r) * 1.2);
    }
    expect([1, 2, 3, 4].map(ventes)).toEqual([195_000, 480_000, 330_000, 450_000]);
    expect([0, 1, 2, 3, 4].map(encaisse)).toEqual([350_000, 275_000, 370_000, 395_000, 385_000]);
    // Le rang −1 n'a pas de trimestre d'avant : ses encaissements ne se calculent pas.
    expect(ventesDuTrimestre(m, -1).encaissementsHT).toBeNull();
    expect(() => ventesDuTrimestre(m, 5)).toThrow();
  });

  it("au régime des encaissements, celui de la fiche : 37 000, crédit de 11 200, 49 000, 33 800 ; le crédit s'impute au troisième trimestre", () => {
    const y = declarationsDeLAnnee(m);
    expect(y.regime).toBe("encaissements");
    const nettes = [1, 2, 3, 4].map((r) => encaisse(r) * 0.2 - deductible(r));
    expect(nettes).toEqual([37_000, -11_200, 49_000, 33_800]);
    expect(y.trimestres.map((x) => x.collectee)).toEqual([1, 2, 3, 4].map((r) => encaisse(r) * 0.2));
    expect(y.trimestres.map((x) => x.deductible)).toEqual([18_000, 85_200, 30_000, 43_200]);
    expect(y.trimestres.map((x) => x.nette)).toEqual(nettes);
    expect(y.trimestres.map((x) => x.aPayer)).toEqual([37_000, 0, 49_000 - 11_200, 33_800]);
    expect(y.trimestres.map((x) => x.creditAReporter)).toEqual([0, 11_200, 0, 0]);
    expect(y.trimestresEnCredit).toEqual([2]);
    // L'ouverture : le quatrième trimestre de N − 1, payé en janvier.
    expect(y.ouverture.aPayer).toBe(encaisse(0) * 0.2 - 180_000 * 0.2);
    expect(y.ouverture.aPayer).toBe(34_000);
    expect(y.verseeDansLAnnee).toBe(34_000 + 37_000 + 0 + 37_800);
    expect(y.dueAuBilan).toBe(33_800);
    expect(y.netteDeLAnnee).toBe(108_600);
  });

  it("au régime des débits (l'option) : 21 000, 10 800, 36 000, 46 800 ; aucun crédit", () => {
    const y = declarationsDeLAnnee(m, { regime: "debits" });
    const nettes = [1, 2, 3, 4].map((r) => ventes(r) * 0.2 - deductible(r));
    expect(nettes).toEqual([21_000, 10_800, 36_000, 46_800]);
    expect(y.trimestres.map((x) => x.nette)).toEqual(nettes);
    expect(y.trimestres.map((x) => x.aPayer)).toEqual(nettes);
    expect(y.trimestresEnCredit).toEqual([]);
    expect(ventes(0)).toBe(390_000);
    expect(y.ouverture.aPayer).toBe(ventes(0) * 0.2 - 180_000 * 0.2);
    expect(y.ouverture.aPayer).toBe(42_000);
    expect(y.verseeDansLAnnee).toBe(42_000 + 21_000 + 10_800 + 36_000);
    expect(y.dueAuBilan).toBe(46_800);
    expect(y.netteDeLAnnee).toBe(114_600);
  });

  it("l'exigibilité change la TVA de chaque trimestre ; sur l'année, l'écart est la TVA des créances qui ont grossi (190 000 − 160 000 € HT)", () => {
    const c = comparerLesRegimes(m);
    expect(c.ecartsDeTvaNette).toEqual([16_000, -22_000, 13_000, -13_000]);
    for (const e of c.ecartsDeTvaNette) expect(e).not.toBe(0);
    expect(creancesHT(4) - creancesHT(0)).toBe(190_000 - 160_000);
    expect(c.ecartDeLAnnee).toBe(-(190_000 - 160_000) * 0.2);
    // Les débits font payer plus tôt quand l'activité monte (T2), plus tard quand elle retombe (T3).
    expect(c.debits.trimestres[1]!.nette).toBeGreaterThan(c.encaissements.trimestres[1]!.nette);
    expect(c.debits.trimestres[2]!.nette).toBeLessThan(c.encaissements.trimestres[2]!.nette);
  });

  it("sans l'investissement du printemps, plus de crédit de TVA : c'est lui qui le fait naître", () => {
    expect(declarationDuTrimestre(m, 2, { avecLInvestissement: false }).nette).toBe(370_000 * 0.2 - 216_000 * 0.2);
    expect(declarationsDeLAnnee(m, { avecLInvestissement: false }).trimestresEnCredit).toEqual([]);
  });

  it("le prochain versement face au dernier : plus léger aux encaissements (33 800 contre 37 800), plus lourd aux débits (46 800 contre 36 000)", () => {
    const e = versementSuivant(m, 4);
    expect(e.ecart).toBe(33_800 - 37_800);
    expect(e.verdict).toBe("plus-leger");
    const d = versementSuivant(m, 4, { regime: "debits" });
    expect(d.ecart).toBe(46_800 - 36_000);
    expect(d.verdict).toBe("plus-lourd");
  });

  it("un taux de 10 % : chaque TVA est divisée par deux", () => {
    expect(declarationDuTrimestre(m, 3, { tauxDeTva: 0.1 }).nette).toBe(49_000 / 2);
  });
});

describe("3. la TVA dans la trésorerie (MARTEL & FILS)", () => {
  /** La TVA du négoce à la clôture : achats × 45 ÷ 90 × 20 %. */
  const tvaFournisseur = (r: number) => (ACHATS[ix(r)]! / 2) * 0.2;

  it("aux débits, au 30 juin, l'entreprise avance : 10 800 + 21 600 − 38 000 = −5 600 €", () => {
    const c = tvaALaCloture(m, 2, { regime: "debits" });
    expect(c.tvaDesCreances).toBe(creancesHT(2) * 0.2);
    expect(c.tvaDesCreances).toBe(38_000);
    expect(c.tvaAvancee).toBe(38_000);
    expect(c.dettesTTC).toBe(216_000 * 1.2 * 45 / 90);
    expect(c.tvaDesDettes).toBe(tvaFournisseur(2));
    expect(c.detteEtat).toBe(10_800);
    expect(c.effet).toBe(10_800 + 21_600 - 38_000);
    expect(c.quiFaitCredit).toBe("l-entreprise");
  });

  it("aux encaissements, au 30 juin, la TVA des clients n'est pas due : −11 200 (le crédit) + 21 600 = 10 400 € laissés en trésorerie", () => {
    const c = tvaALaCloture(m, 2);
    expect(c.tvaDesCreances).toBe(38_000);
    expect(c.tvaAvancee).toBe(0);
    expect(c.detteEtat).toBe(-11_200);
    expect(c.effet).toBe(-11_200 + 21_600);
    expect(c.quiFaitCredit).toBe("personne");
  });

  it("aux débits, les autres clôtures : l'État couvre seul la TVA des clients", () => {
    const attendus = [
      [0, 42_000 + 18_000 - 32_000],
      [1, 21_000 + 9_000 - 16_000],
      [3, 36_000 + 15_000 - 25_000],
      [4, 46_800 + 21_600 - 38_000],
    ] as const;
    for (const [r, effet] of attendus) {
      const c = tvaALaCloture(m, r, { regime: "debits" });
      expect(c.tvaDesCreances, String(r)).toBe(creancesHT(r) * 0.2);
      expect(c.tvaDesDettes).toBe(tvaFournisseur(r));
      expect(c.effet).toBe(effet);
      expect(c.quiFaitCredit).toBe("l-etat");
    }
    expect(attendus.map((x) => x[1])).toEqual([28_000, 14_000, 26_000, 30_400]);
  });

  it("les flux de TVA d'un trimestre déplacent exactement ce que la TVA laisse en trésorerie, aux deux régimes", () => {
    for (const regime of ["debits", "encaissements"] as const)
      for (let r = 1; r <= 4; r++) {
        const x = fluxDeTvaDuTrimestre(m, r, { regime });
        expect(auCentime(x.avant + x.solde), `${regime} ${r}`).toBe(x.apres);
      }
    // Le troisième trimestre aux encaissements, refait : encaissée 79 000 ; payée au négoce 216 000 ÷ 2 + 150 000 ÷ 2 ; versée 0 (le crédit).
    const t3 = fluxDeTvaDuTrimestre(m, 3);
    expect(t3.tvaEncaissee).toBe(encaisse(3) * 0.2);
    expect(t3.tvaPayee).toBe(((216_000 + 150_000) / 2) * 0.2);
    expect(t3.tvaVersee).toBe(0);
    expect(t3.solde).toBe(79_000 - 36_600 - 0);
    expect(t3.encaissementsTTC).toBe(395_000 * 1.2);
    // Le deuxième : l'investissement se paie TTC à la livraison, sa TVA sort tout de suite.
    expect(fluxDeTvaDuTrimestre(m, 2).tvaPayee).toBe(((90_000 + 216_000) / 2 + 210_000) * 0.2);
  });

  it("30 jours de plus aux commerces : 42 000 € TTC de créance en plus, dont 7 000 € de TVA, avancée aux débits seulement", () => {
    const e = delaiEnPlus(m, "commerces", 30);
    expect(e.creanceEnPlusHT).toBe(105_000 * 30 / 90);
    expect(e.creanceEnPlusTTC).toBe(35_000 * 1.2);
    expect(e.tvaEnPlus).toBe(7_000);
    expect(e.tvaAvanceeEnPlus).toBe(0);
    expect(e.financeEnPlus).toBe(35_000);
    expect(e.depasseLeDelaiLegal).toBe(false);
    expect(e.ventesDeLAnneeHT).toBe(45_000 + 120_000 + 75_000 + 105_000);
    expect(e.coutDeLAnnee).toBe(auCentime(345_000 * 0.09 * 30 / 360));
    expect(e.coutDeLAnnee).toBe(2_587.5);
    // Aux encaissements, la TVA laissée au 31 décembre ne perd que la TVA de ce qui manque de plus qu'au 30 septembre.
    expect(e.effetSans - e.effetAvec).toBe((105_000 - 75_000) * (30 / 90) * 0.2);
    const d = delaiEnPlus(m, "commerces", 30, { regime: "debits" });
    expect(d.tvaAvanceeEnPlus).toBe(7_000);
    expect(d.financeEnPlus).toBe(42_000);
    expect(d.coutDeLAnnee).toBe(auCentime(345_000 * 1.2 * 0.09 * 30 / 360));
    expect(d.effetSans - d.effetAvec).toBe(7_000);
  });

  it("le curseur : aux débits, la TVA laissée au 30 juin s'annule quand les entreprises paient à 48 jours ; aux encaissements, elle reste positive", () => {
    // Aux débits : 10 800 + 21 600 − (150 000 ÷ 3 + 210 000 × j ÷ 90) × 20 % = 22 400 − 466,67 × j, nulle à j = 48.
    const effet = (j: number) => 10_800 + 21_600 - (150_000 / 3 + (210_000 * j) / 90) * 0.2;
    expect(effet(48)).toBeCloseTo(0, 9);
    expect(tvaALaCloture(m, 2, { regime: "debits", delais: { entreprises: 48 } }).effet).toBe(0);
    expect(tvaALaCloture(m, 2, { regime: "debits", delais: { entreprises: 47 } }).effet).toBe(auCentime(effet(47)));
    expect(tvaALaCloture(m, 2, { regime: "debits", delais: { entreprises: 49 } }).effet).toBeLessThan(0);
    // Aux encaissements : (450 000 − 1 333,33 × j) × 20 % − 85 200 + 21 600, positive jusqu'au-delà de 90 jours.
    for (const j of [0, 30, 60, 90]) expect(tvaALaCloture(m, 2, { delais: { entreprises: j } }).effet, String(j)).toBe(auCentime((450_000 - (120_000 * j) / 90) * 0.2 - 85_200 + 21_600));
    expect(tvaALaCloture(m, 2, { delais: { entreprises: 90 } }).effet).toBeGreaterThan(0);
  });

  it("un délai que la loi ne permet pas se voit : 30 jours de plus aux entreprises (90 jours) ou aux collectivités (60)", () => {
    expect(delaiEnPlus(m, "entreprises", 30).depasseLeDelaiLegal).toBe(true);
    expect(delaiEnPlus(m, "collectivites", 30).depasseLeDelaiLegal).toBe(true);
  });
});

describe("4. les fournisseurs (NOVA en N + 1)", () => {
  const COMPOSANTS_T4 = 7_000;

  it("Électro-Composants : 572 000 € HT de composants, pas de stock, la dette du 31 décembre = un mois d'achats (51 333,33 € HT, 61 600 € TTC)", () => {
    const c = comparerAvecLHabituelle(n, "electro-composants");
    expect(c.offre.coutDesComposantsHT).toBe(26_000 * 22);
    expect(c.offre.stockHT).toBe(0);
    expect(c.offre.dettesHT).toBe(auCentime((COMPOSANTS_T4 * 22) / 3));
    expect(c.offre.dettesTTC).toBe((COMPOSANTS_T4 * 22 * 1.2) / 3);
    expect(c.offre.dettesTTC).toBe(61_600);
    expect(c.ecartDeTresorerie).toBe(0);
  });

  it("AsiaComponents, moins cher, coûte plus en trésorerie : +50 704 € de résultat, −69 929,33 € de trésorerie au 31 décembre", () => {
    const c = comparerAvecLHabituelle(n, "asiacomponents");
    const economie = 26_000 * (22 - 19.8);
    const margePerdue = 4 * 0.1 * 700 * (59 - 19.8 - 16);
    const stock = (COMPOSANTS_T4 * 45) / 90 * 19.8;
    const detteHabituelle = auCentime((COMPOSANTS_T4 * 22) / 3);
    expect(c.economie).toBe(auCentime(economie));
    expect(c.economie).toBe(57_200);
    expect(c.offre.margePerdue).toBe(auCentime(margePerdue));
    expect(c.offre.margePerdue).toBe(6_496);
    expect(c.ecartDeResultat).toBe(57_200 - 6_496);
    expect(c.offre.stockHT).toBe(auCentime(stock));
    expect(c.offre.stockHT).toBe(69_300);
    expect(c.offre.dettesHT).toBe(0);
    expect(c.ecartDeTresorerie).toBe(auCentime(50_704 - 69_300 - detteHabituelle));
    expect(c.ecartDeTresorerie).toBe(-69_929.33);
    expect(c.besoinEnPlus).toBe(auCentime(69_300 + detteHabituelle));
    expect(c.coutDuBesoin).toBe(auCentime(c.besoinEnPlus * 0.09));
    // Ses achats de l'année comptent le stock qu'il faut constituer.
    expect(c.offre.achatsHT).toBe(26_000 * 19.8 + 69_300);
  });

  it("EuroParts, plus cher, améliore la trésorerie : −28 600 € de résultat, +27 866,67 € de trésorerie (60 jours de crédit)", () => {
    const c = comparerAvecLHabituelle(n, "europarts");
    expect(c.economie).toBe(auCentime(-26_000 * 1.1));
    expect(c.offre.dettesHT).toBe((COMPOSANTS_T4 * 23.1 * 60) / 90);
    expect(c.offre.dettesHT).toBe(107_800);
    expect(c.offre.dettesTTC).toBe(129_360);
    expect(c.ecartDeTresorerie).toBe(auCentime(-28_600 + 107_800 - (COMPOSANTS_T4 * 22) / 3));
    expect(c.ecartDeTresorerie).toBe(27_866.67);
  });

  it("le gain de qualité d'EuroParts, compté avec la fiche de capacité : celui d'un demi-point de défaut, 6 318 € (4 680 € de coûts, 1 638 € de ventes)", () => {
    const c = comparerAvecLHabituelle(n, "europarts", { qualite: NOVA_CAPACITE });
    // 26 000 × 0,5 % = 130 défauts de moins, à 36 € ; 26 livrés de moins, 3 ventes chacun, à 21 €.
    expect(c.offre.gainDeQualite).toBe(130 * 36 + 26 * 3 * 21);
    expect(c.offre.gainDeQualite).toBe(6_318);
    expect(c.ecartDeResultat).toBe(-28_600 + 6_318);
  });

  it("le curseur : AsiaComponents rattrape l'offre habituelle en trésorerie s'il se paie à 43 jours (ses achats du T4, 146 520 € HT, × j ÷ 90)", () => {
    // Achats du T4 : 7 000 jeux consommés et 400 de stock en plus (3 500 − 3 100), à 19,80 €.
    const achatsT4 = (7_000 + 3_500 - 3_100) * 19.8;
    expect(achatsT4).toBe(146_520);
    const ecart = (j: number) => auCentime(-69_929.33 + auCentime((achatsT4 * j) / 90));
    expect(comparerAvecLHabituelle(n, "asiacomponents", { delaiDePaiement: 42 }).ecartDeTresorerie).toBe(ecart(42));
    expect(ecart(42)).toBeLessThan(0);
    expect(comparerAvecLHabituelle(n, "asiacomponents", { delaiDePaiement: 43 }).ecartDeTresorerie).toBe(ecart(43));
    expect(ecart(43)).toBeGreaterThan(0);
  });

  it("le choix : AsiaComponents en résultat, EuroParts en trésorerie ; aucune offre ne gagne sur les deux", () => {
    const c = choisirUneOffre(n);
    expect(c.meilleureEnResultat).toBe("asiacomponents");
    expect(c.meilleureEnTresorerie).toBe("europarts");
    expect(c.meilleureApresFinancement).toBe("asiacomponents");
  });

  it("Électro-Composants allonge son délai de 30 jours, à 60 : 51 333,33 € HT de crédit en plus au 31 décembre, 4 290 € de découvert évité sur un an", () => {
    const x = delaiFournisseurAllonge(n, 30);
    expect(x.nouveauDelai).toBe(60);
    expect(x.permis).toBe(true);
    expect(x.creditEnPlusHT).toBe(auCentime((COMPOSANTS_T4 * 22 * 30) / 90));
    expect(x.creditEnPlusTTC).toBe(61_600);
    expect(x.coutEviteParAn).toBe(auCentime((572_000 * 0.09 * 30) / 360));
    expect(x.coutEviteParAn).toBe(4_290);
    expect(delaiFournisseurAllonge(n, 31).permis).toBe(false);
    // Face à AsiaComponents : l'offre allongée garde 121 262,67 € de plus en trésorerie, AsiaComponents gagne 50 704 € de résultat.
    const asia = comparerAvecLHabituelle(n, "asiacomponents", {}, { delaiDePaiement: 60 });
    expect(asia.ecartDeTresorerie).toBe(auCentime(50_704 - 69_300 - (COMPOSANTS_T4 * 22 * 60) / 90));
    expect(asia.ecartDeTresorerie).toBe(-121_262.67);
  });

  it("l'escompte d'Électro-Composants, 1 % à 10 jours au lieu de 30 : 18,18 % l'an, plus que le découvert ; le prendre gagne 2 888,60 € par an", () => {
    const x = escompteDuFournisseur(n, "electro-composants")!;
    expect(x.joursDAvance).toBe(20);
    expect(x.tauxAnnuel).toBeCloseTo((0.01 / 0.99) * (360 / 20), 12);
    expect(x.prendre).toBe(true);
    expect(x.escompteGagne).toBe(5_720);
    expect(x.coutDeLAvance).toBe(auCentime((572_000 * 0.99 * 0.09 * 20) / 360));
    expect(x.gainNet).toBe(auCentime(5_720 - 2_831.4));
    expect(escompteDuFournisseur(n, "asiacomponents")).toBeNull();
  });
});

describe("5. le crédit client et le retard (NOVA et CampusTech)", () => {
  it("la facture de CampusTech : 18 880 € HT, 3 776 € de TVA, 22 656 € TTC", () => {
    expect(factureDeCampusTech(n)).toEqual({ ht: CAMPUS_HT, tva: CAMPUS_HT * 0.2, ttc: CAMPUS_TTC });
    expect(CAMPUS_TTC).toBe(22_656);
  });

  it("les créances du 31 décembre : 2 factures payées à 60 jours (45 312 € TTC) ; 3 si CampusTech payait à 80 jours (67 968 €)", () => {
    const reel = creancesDuTrimestre(n, 4);
    expect(reel.delai).toBe(60);
    expect(reel.caHT).toBe(7_000 * 59);
    expect(reel.caTTC).toBe(7_000 * 59 * 1.2);
    expect(reel.campustechHT).toBe(3 * CAMPUS_HT);
    expect(reel.particuliersHT).toBe((7_000 - 960) * 59);
    expect(reel.factures).toBe(2);
    expect(reel.creancesTTC).toBe(2 * CAMPUS_TTC);
    expect(reel.delaiMoyen).toBeCloseTo((45_312 / 495_600) * 90, 12);
    const enRetard = creancesDuTrimestre(n, 4, { delai: n.campustech.delaiSiRetard });
    expect(enRetard.factures).toBe(3);
    expect(enRetard.creancesTTC).toBe(3 * CAMPUS_TTC);
    expect(enRetard.delaiMoyen).toBeCloseTo((67_968 / 495_600) * 90, 12);
  });

  it("si CampusTech payait 20 jours en retard : 113,28 € par facture au découvert ; NOVA pourrait réclamer 150,83 € de pénalités et 40 € d'indemnité", () => {
    // Par défaut, le modèle du retard chiffre l'hypothèse : un paiement au 80e jour.
    const r = retardDeCampusTech(n);
    expect(r.delaiReel).toBe(80);
    expect(r.joursDeRetard).toBe(20);
    expect(r.enRetard).toBe(true);
    expect(r.coutDuCreditConvenuParFacture).toBe(auCentime((22_656 * 0.09 * 60) / 360));
    expect(r.coutDuRetardParFacture).toBe(auCentime((22_656 * 0.09 * 20) / 360));
    expect(r.coutDuRetardParFacture).toBe(113.28);
    expect(r.penalitesParFacture).toBe(auCentime((22_656 * 0.1215 * 20) / 365));
    expect(r.penalitesParFacture).toBe(150.83);
    expect(r.indemniteParFacture).toBe(40);
    expect(r.coutDuRetardParAn).toBe(auCentime(12 * 113.28));
    expect(r.penalitesParAn).toBe(auCentime(12 * 150.83));
    expect(r.reclamableParAn).toBe(auCentime(12 * (150.83 + 40)));
    expect(r.reclamableParAn).toBe(2_289.96);
    // Ce que la loi permet de réclamer dépasse ce que le retard coûte.
    expect(r.reclamableParAn).toBeGreaterThan(r.coutDuRetardParAn);
    expect(r.creanceEnPlusTTC).toBe(22_656);
  });

  it("au plancher légal (8,28 %), les pénalités baissent ; payé à l'heure, rien à réclamer ; un délai convenu de 80 jours ne serait pas permis", () => {
    expect(retardDeCampusTech(n, { base: "taux-legal" }).penalitesParFacture).toBe(auCentime((22_656 * 0.0828 * 20) / 365));
    // Le paiement réel de la fiche : à l'heure, rien à réclamer.
    const aLHeure = retardDeCampusTech(n, { delaiReel: n.campustech.delaiReel });
    expect(aLHeure.enRetard).toBe(false);
    expect(aLHeure.reclamableParAn).toBe(0);
    expect(aLHeure.creanceEnPlusTTC).toBe(0);
    expect(retardDeCampusTech(n, { delaiConvenu: 80 }).delaiConvenuPermis).toBe(false);
    // Financé par l'argent qui dort (3 %), le retard coûte trois fois moins.
    expect(retardDeCampusTech(n, { tauxDeFinancement: 0.03 }).coutDuRetardParFacture).toBe(auCentime((22_656 * 0.03 * 20) / 360));
  });
});

describe("6. l'escompte, l'affacturage et le découvert", () => {
  it("une facture de CampusTech : escompte puis retard 339,84 €, découvert seul 453,12 €, affacturage 528,64 €", () => {
    // Par défaut, la facture payée au 80e jour, l'hypothèse du retard.
    const x = mobiliserUneFacture(n);
    expect([x.convenu, x.reel, x.retard]).toEqual([60, 80, 20]);
    expect(x.escompte).toBe(auCentime((22_656 * 0.06 * 60) / 360));
    expect(x.retardAuDecouvert).toBe(auCentime((22_656 * 0.09 * 20) / 360));
    expect(x.escompteEtRetard).toBe(auCentime(226.56 + 113.28));
    expect(x.decouvert).toBe(auCentime((22_656 * 0.09 * 80) / 360));
    expect(x.commission).toBe(226.56);
    expect(x.financement).toBe(auCentime((22_656 * 0.06 * 80) / 360));
    expect(x.affacturage).toBe(auCentime(226.56 + 302.08));
    expect(x.leMoinsCher).toBe("escompte");
    expect(x.primeDeLAffacturage).toBe(auCentime(528.64 - 339.84));
    expect(coutDeLAffacturage(10_000, 0.01, 0.06, 90)).toBe(100 + 150);
  });

  it("l'escompte coûte autant que 40 jours de découvert (60 × 6 % ÷ 9 %) : moins de jours de découvert, le découvert coûte moins", () => {
    expect(joursDeDecouvertQuiValentLEscompte(60, 0.06, 0.09)).toBeCloseTo(40, 12);
  });

  it("escompter chaque trimestre coûte 2 718,72 € pour 625 € de découvert évité : inutile ; au mieux, l'escompte au T4 seulement (578,12 €)", () => {
    const x = escompterChaqueTrimestre(n);
    expect(x.parFacture).toBe(226.56);
    expect(x.encoursEscompte).toBe(2 * 22_656);
    expect(x.dansLePlafond).toBe(true);
    expect(x.escompteDeLAnnee).toBe(auCentime(12 * 226.56));
    expect(x.trimestres.map((t) => t.decouvert)).toEqual([0, (25_000 * 0.09 * 20) / 360, 0, (40_000 * 0.09 * 50) / 360]);
    expect(x.decouvertEvite).toBe(125 + 500);
    expect(x.verdict).toBe("inutile");
    expect(x.trimestres.map((t) => t.mieux)).toEqual(["rien", "decouvert", "rien", "escompte"]);
    expect(x.trimestres[3]!.escompteDuBesoin).toBe(2 * 226.56);
    expect(x.auMieux).toBe(auCentime(125 + 453.12));
    expect(x.joursQuiValentLEscompte).toBeCloseTo(40, 12);
  });
});

describe("7. l'affaire aux conditions (ATLAS CONSEIL)", () => {
  it("la facture : 32 000 € brut, 1 600 € de remise, 30 400 € net commercial, 608 € d'escompte, 29 792 € net financier", () => {
    const x = affaireAuxConditions(a);
    expect(x.facture.brut).toBe(40 * 800);
    expect(x.facture.reductions[0]!.montant).toBe(32_000 * 0.05);
    expect(x.facture.netCommercial).toBe(30_400);
    expect(x.facture.escompte).toBe(30_400 * 0.02);
    expect(x.facture.netFinancier).toBe(29_792);
    expect(x.facture.tva).toBe(auCentime(29_792 * 0.2));
    expect(x.netAPayerSansEscompte).toBe(30_400 * 1.2);
  });

  it("la marge : 26 000 € au catalogue, 24 400 € après remise ; 5 % du prix cèdent 6,15 % de la marge", () => {
    const x = affaireAuxConditions(a);
    expect(x.margeCatalogue).toBe(40 * (800 - 150));
    expect(x.marge).toBe(30_400 - 40 * 150);
    expect(x.margeCedee).toBe(1_600);
    expect(x.partDeLaMargeCedee).toBeCloseTo(1_600 / 26_000, 12);
  });

  it("le crédit : 30 400 € HT attendus 60 jours à 9 %, 456 € (des services : la TVA n'est pas avancée) ; résultat 23 944 €", () => {
    const x = affaireAuxConditions(a);
    expect(x.baseDuCredit).toBe(30_400);
    expect(x.coutDuCredit).toBe((30_400 * 0.09 * 60) / 360);
    expect(x.resultat).toBe(24_400 - 456);
    // Si le cabinet vendait des biens, il financerait le TTC.
    expect(affaireAuxConditions(a, { nature: "biens" }).coutDuCredit).toBe(auCentime((36_480 * 0.09 * 60) / 360));
  });

  it("l'escompte face au crédit : 14,69 % l'an pour 9 % ; il coûte 608 € quand le crédit en coûte 456 ; il ne vaut le crédit qu'à 80 jours", () => {
    const x = affaireAuxConditions(a);
    expect(x.tauxAnnuelDeLEscompte!).toBeCloseTo((0.02 / 0.98) * (360 / 50), 12);
    expect(x.tauxAnnuelDeLEscompte!).toBeGreaterThan(0.09);
    expect(x.delaiOuLEscompteVautLeCredit).toBeCloseTo((0.02 * 360) / 0.09, 12);
    expect(x.delaiOuLEscompteVautLeCredit).toBeCloseTo(80, 12);
    expect(x.coutDuCreditAvecEscompte).toBe(auCentime((29_792 * 0.09 * 10) / 360));
    expect(x.resultatAvecEscompte).toBe(auCentime(24_400 - 608 - 74.48));
    expect(x.resultatAvecEscompte).toBeLessThan(x.resultat);
    // L'escompte le plus fort qui ne coûte pas plus que le découvert, pour 50 jours d'avance.
    expect(x.escompteMaximal!).toBeCloseTo(0.0125 / 1.0125, 12);
    // Un client qui paierait à 90 jours (en retard) rendrait l'escompte moins cher que le crédit.
    const tard = affaireAuxConditions(a, { delai: 90 });
    expect(tard.coutDuCredit).toBe(684);
    expect(tard.coutDuCredit).toBeGreaterThan(tard.facture.escompte);
    expect(tard.delaiPermis).toBe(false);
  });

  it("la contrepartie : 43 journées à 760 € pour la marge du catalogue, 3 de plus ; au palier de 8 % sur 48 journées, la marge monte à 28 128 €", () => {
    const x = affaireAuxConditions(a);
    expect(x.prixRemise).toBe(760);
    expect(x.journeesPourLaMemeMarge).toBe(Math.ceil(26_000 / 610));
    expect(x.journeesEnPlus).toBe(3);
    const p = affaireAuxConditions(a, { remise: 0.08, journees: 48 });
    expect(p.facture.netCommercial).toBe(48 * 800 * 0.92);
    expect(p.marge).toBe(35_328 - 48 * 150);
    expect(p.coutDuCredit).toBe(auCentime((35_328 * 0.09 * 60) / 360));
    expect(p.resultat).toBe(auCentime(28_128 - 529.92));
    expect(p.resultat).toBeGreaterThan(x.resultat);
    // La plus petite commande qui, au palier, garde la marge d'aujourd'hui : 24 400 ÷ (736 − 150), arrondi au-dessus.
    expect(Math.ceil(24_400 / (736 - 150))).toBe(42);
  });
});

describe("la garde voit le modèle et la fiche", () => {
  it("une fiche faussée change les chiffres attendus, partout de la même façon", () => {
    // MARTEL & FILS sans l'investissement de 210 000 € : le crédit disparaît, l'effet du 30 juin monte de sa TVA.
    const sansInvestissement: FicheDuBatiment = { ...m, investissements: [] };
    expect(declarationsDeLAnnee(sansInvestissement).trimestresEnCredit).toEqual([]);
    expect(tvaALaCloture(sansInvestissement, 2, { regime: "debits" }).effet).toBe(-5_600 + 42_000);
    // Des entreprises payées comptant : les deux régimes se rejoignent pour elles.
    const comptant: FicheDuBatiment = { ...m, clienteles: m.clienteles.map((g) => ({ ...g, delai: 0 })) };
    expect(comparerLesRegimes(comptant).ecartsDeTvaNette).toEqual([0, 0, 0, 0]);
    // NOVA sans l'hypothèse du retard : plus de retard, plus de pénalités.
    const ponctuel: FicheDesDelaisDeNova = { ...n, campustech: { ...n.campustech, retardSuppose: 0, delaiSiRetard: 60 } };
    expect(retardDeCampusTech(ponctuel).coutDuRetardParAn).toBe(0);
    expect(mobiliserUneFacture(ponctuel).retardAuDecouvert).toBe(0);
    // Une CampusTech qui paierait vraiment à 80 jours : 3 factures dues au 31 décembre.
    const tardive: FicheDesDelaisDeNova = { ...n, campustech: { ...n.campustech, delaiReel: 80 } };
    expect(creancesDuTrimestre(tardive, 4).creancesTTC).toBe(67_968);
    // Une banque qui escompte à 9 % : l'escompte ne vaut plus que 60 jours de découvert, et ne sert plus au T4.
    const escompteCher: FicheDesDelaisDeNova = { ...n, banque: { ...n.banque, escompte: { ...n.banque.escompte, taux: 0.09 } } };
    expect(escompterChaqueTrimestre(escompteCher).trimestres[3]!.mieux).toBe("decouvert");
    // ATLAS CONSEIL financé à 12 % : l'escompte vaut le crédit à 60 jours tout juste.
    const cher: FicheDeLAffaire = { ...a, tauxDeFinancement: 0.12 };
    expect(affaireAuxConditions(cher).coutDuCredit).toBe(608);
    expect(affaireAuxConditions(cher).delaiOuLEscompteVautLeCredit).toBeCloseTo(60, 12);
  });
});
