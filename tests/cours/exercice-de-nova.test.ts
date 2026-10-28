import { describe, expect, it } from "vitest";
import { cession, coefficientDegressif, joursCompris, planDAmortissement, amortissementDerogatoire, valeurNetteALaCloture } from "../../src/config/cours/monde/amortissement";
import { CAS_DES_ENTREPRISES } from "../../src/config/cours/monde/cas-des-entreprises";
import {
  besoinSelonLesDelais,
  chargeConstateeDAvance,
  cloture,
  depreciationDeCreance,
  ajustementDeDepreciation,
  echeanceDUneFacture,
  impotSurLesSocietes,
  perteSurCreance,
  soldesIntermediaires,
  type CodeDeTravail,
} from "../../src/config/cours/monde/cloture";
import { budgetDeTresorerie } from "../../src/config/cours/monde/couts-et-budgets";
import { coutDuCredit, echeanceConstante, empruntALaCloture, interetsCourus, tableauDAmortissement, type ContratDePret } from "../../src/config/cours/monde/emprunt";
import { CLOTURE_DE_LA_FICHE, EXERCICE_DE_NOVA as f, EXERCICES_DU_COURS, MONTANTS_DES_FACTURES_SONORA } from "../../src/config/cours/monde/exercice-de-nova";
import { coutDeLAvance, escompteMaximal, facture, tauxAnnuelDeLEscompte } from "../../src/config/cours/monde/facture";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { brutPourUnCoutEmployeur, brutPourUnNetAPayer, bulletinDePaie, coefficientDuBrutAuNet } from "../../src/config/cours/monde/paie";
import { inventaireDeLaPeriode, valoriserLeStock } from "../../src/config/cours/monde/stock";

/**
 * LE PREMIER EXERCICE DE NOVA (monde/exercice-de-nova.ts) ET SES MODÈLES, REFAITS À LA MAIN.
 *
 * Chaque chiffre attendu est recalculé ici sur les hypothèses de la fiche, sans les fonctions du
 * modèle ; les valeurs absolues sont épinglées (un changement de la fiche ou d'un modèle se voit) ;
 * la balance et les bilans doivent s'équilibrer, les soldes s'enchaîner jusqu'au résultat net, la
 * capacité d'autofinancement tomber au même chiffre par ses deux méthodes, le fonds de roulement
 * moins le besoin faire la trésorerie nette, et chaque tableau d'emprunt solder son capital.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const k = cloture(f);
const ligne = (compte: string) => f.balanceAvantInventaire.find((l) => l.compte === compte)!;
const solde = (compte: string) => c(ligne(compte).debit - ligne(compte).credit);

// Les hypothèses de la fiche, relues une fois.
const PRIX = 59;
const PARTICULIERS = [1_270, 1_130, 1_418, 1_580, 1_710, 1_831, 1_600, 1_150, 1_700, 1_650, 1_750, 2_000];
const LIVRAISONS = [1_590, 1_450, 1_738, 1_900, 2_030, 2_151, 1_920, 1_470, 2_420, 2_470, 2_070, 2_400];
const CAMPUSTECH_TTC = 320 * PRIX * 1.2; // 22 656 €

describe("la chronologie : une seule NOVA, de la création à la clôture", () => {
  it("la création : l'apport, le prêt, la ligne, et la banque une fois l'installation payée", () => {
    expect(f.apport).toEqual({ montant: 150_000, date: { jour: 2, mois: 1 } });
    expect(f.pret).toMatchObject({ capital: 80_000, tauxAnnuel: 0.05, dureeAns: 5, echeancesParAn: 4, versement: { jour: 3, mois: 1 }, premiereEcheance: { jour: 3, mois: 4 } });
    expect(f.equipement.ht).toBe(4 * 15_000);
    expect(f.equipement.tva).toBe(60_000 * 0.2);
    expect(f.equipement.ttc).toBe(60_000 + 12_000);
    expect(150_000 + 80_000 - 72_000).toBe(158_000);
  });

  it("le premier semestre est celui du contrôle de gestion (nova-gestion.ts)", () => {
    const g = NOVA_GESTION;
    expect(f.prixDeLEnceinte).toBe(g.moisDeReference.prix);
    expect(f.ventesAuxParticuliers.slice(0, 6)).toEqual(g.semestre.clienteles[0]!.quantites);
    expect(g.semestre.clienteles[1]!.quantites.every((q) => q === f.campustech.enceintesParFacture)).toBe(true);
    expect([f.campustech.jourDeFacturation, f.campustech.delai]).toEqual([g.semestre.clienteles[1]!.jourDeFacturation, g.semestre.clienteles[1]!.delai]);
    expect([f.fournisseur.prixDuJeu, f.fournisseur.jourDeFacturation, f.fournisseur.delai]).toEqual([g.moisDeReference.coutVariable.composants, 10, 22]);
    expect(f.autresCoutsDeLEnceinte).toBe(g.moisDeReference.coutVariable.autres);
    expect(f.loyer.montant).toBe(g.moisDeReference.chargesFixes.loyer);
    const b = bulletinDePaie(f.paie.brut, f.tauxDeLaPaie);
    expect(b.netAvantImpot).toBe(g.semestre.paie.net);
    expect(c(b.cotisationsSalariales.total + b.cotisationsPatronales.total)).toBe(g.semestre.paie.cotisations);
    expect(b.coutEmployeur).toBe(g.moisDeReference.chargesFixes.personnel);
    expect(f.pret.capital).toBe(g.semestre.emprunt.capitalRestantDu);
    expect(c(f.pret.capital / (f.pret.dureeAns * f.pret.echeancesParAn))).toBe(g.semestre.emprunt.capitalParEcheance);
    // La ligne : 60 000 € sur 72 mois, les 833 € de la gestion.
    expect(Math.round(f.equipement.ht / 72)).toBe(g.moisDeReference.chargesFixes.amortissement);
  });

  it("les livraisons de l'année, trimestre par trimestre, sous la capacité de la ligne", () => {
    expect(f.ventesAuxParticuliers).toEqual(PARTICULIERS);
    expect(f.livraisons).toEqual(LIVRAISONS);
    // Décembre : les particuliers, 200 enceintes de la commande de CampusTech, les 200 de la commande urgente.
    expect(LIVRAISONS[11]).toBe(2_000 + (320 - 120) + 200);
    // Septembre et octobre : Sonora.
    expect([LIVRAISONS[8], LIVRAISONS[9]]).toEqual([1_700 + 320 + 400, 1_650 + 320 + 500]);
    const trimestres = [0, 3, 6, 9].map((m) => somme(LIVRAISONS.slice(m, m + 3)));
    expect(trimestres).toEqual([4_778, 6_081, 5_810, 6_940]);
    expect(trimestres.every((q) => q <= NOVA_GESTION.decision.capacite)).toBe(true);
    // Les deux premiers trimestres sont ceux de la gestion.
    expect(trimestres[0]).toBe(NOVA_GESTION.decision.production);
  });

  it("le placement du 6 janvier : le compte courant part des 25 000 € du budget de gestion", () => {
    expect(f.placement).toMatchObject({ montant: 133_000, tauxAnnuel: 0.03, dureeMois: 12, compte: "508", compteDesInteretsCourus: "5088" });
    expect(150_000 + 80_000 - 72_000 - f.placement.montant).toBe(NOVA_GESTION.semestre.tresorerieDeDepart);
    // Le placement court au-delà de la clôture : ses intérêts sont courus, pas encaissés, au 31 décembre.
    expect(f.placement.echeance).toEqual({ jour: 6, mois: 1, exercice: 1 });
    expect(f.placement.tauxAnnuel).toBeLessThan(f.pret.tauxAnnuel);
  });

  it("le compte courant fin janvier retombe sur le budget de gestion, au prélèvement à la source près", () => {
    // Janvier, à la main : l'apport, le prêt, la ligne, le placement, les particuliers, les autres coûts, le loyer, la paie.
    const banqueDeJanvier = c(150_000 + 80_000 - 72_000 - 133_000 + 1_270 * PRIX * 1.2 - 1_590 * 16 * 1.2 - 19_700 - (700 + 5_028.73));
    expect(banqueDeJanvier).toBe(58_959.27);
    const budget = budgetDeTresorerie(NOVA_GESTION);
    expect(budget.mois[0]!.tresorerieFin).toBe(58_838);
    // Le budget verse le net avant impôt le 28 ; la fiche garde le prélèvement jusqu'au 15 février.
    // La TVA ne joue qu'à partir de février : le budget paie celle de janvier, la fiche reporte son crédit.
    expect(c(banqueDeJanvier - budget.mois[0]!.tresorerieFin)).toBe(121.27);
  });

  it("la fiche est inscrite au registre du monde, par son code", () => {
    expect(EXERCICES_DU_COURS.nova).toBe(f);
    expect(f.entreprise).toBe(CAS_DES_ENTREPRISES.nova!.entreprise);
  });
});

describe("les factures de l'année", () => {
  it("Sonora, septembre : remise, escompte, TVA sur le net financier", () => {
    const brut = 400 * PRIX;
    const remise = c(brut * 0.05);
    const netCommercial = c(brut - remise);
    const escompte = c(netCommercial * 0.02);
    const netFinancier = c(netCommercial - escompte);
    const tva = c(netFinancier * 0.2);
    const attendu = { brut, remise, netCommercial, escompte, netFinancier, tva, netAPayer: c(netFinancier + tva) };
    expect(MONTANTS_DES_FACTURES_SONORA.septembre).toEqual(attendu);
    expect(attendu).toEqual({ brut: 23_600, remise: 1_180, netCommercial: 22_420, escompte: 448.4, netFinancier: 21_971.6, tva: 4_394.32, netAPayer: 26_365.92 });
    const m = facture(f.facturesSonora.septembre);
    expect([m.brut, m.reductions[0]!.montant, m.netCommercial, m.escompte, m.netFinancier, m.tva, m.netAPayer]).toEqual(Object.values(attendu));
  });

  it("Sonora, octobre : la remise sans escompte, la créance litigieuse", () => {
    const m = facture(f.facturesSonora.octobre);
    expect(m.netCommercial).toBe(500 * PRIX * 0.95);
    expect(m.tva).toBe(c(28_025 * 0.2));
    expect(m.netAPayer).toBe(33_630);
    expect(MONTANTS_DES_FACTURES_SONORA.octobre).toMatchObject({ netCommercial: m.netCommercial, tva: m.tva, netAPayer: m.netAPayer });
  });

  it("le taux annuel d'un escompte, et l'escompte le plus fort qu'un découvert permet", () => {
    // Sonora : 2 % pour payer 50 jours plus tôt (10 au lieu de 60).
    expect(tauxAnnuelDeLEscompte(0.02, 60 - 10)).toBeCloseTo((448.4 / 21_971.6) * (360 / 50), 10);
    expect(Math.round(tauxAnnuelDeLEscompte(0.02, 50) * 10_000) / 100).toBe(14.69);
    // Électro-Composants : 2 % pour 12 jours d'avance, plus de 61 % l'an.
    expect(Math.round(tauxAnnuelDeLEscompte(0.02, 12) * 10_000) / 100).toBe(61.22);
    // Le plus fort escompte qui ne coûte pas plus qu'un découvert à 8 % pour 70 jours d'avance.
    const t = escompteMaximal(0.08, 70);
    expect(t).toBeCloseTo((0.08 * 70) / 360 / (1 + (0.08 * 70) / 360), 12);
    expect(tauxAnnuelDeLEscompte(t, 70)).toBeCloseTo(0.08, 12);
    expect(Math.round(t * 10_000) / 100).toBe(1.53);
    expect(coutDeLAvance(34_280.4, 0.05, 12)).toBe(c((34_280.4 * 0.05 * 12) / 360));
  });

  it("l'échéance des factures de CampusTech, en mois de 30 jours", () => {
    expect(f.campustech.delai).toBe(60);
    expect(echeanceDUneFacture({ jour: 20, mois: 1 }, 60)).toEqual({ jour: 20, mois: 3, exercice: 0 });
    // La facture d'octobre tombe le 20 décembre : payée dans l'exercice. Celle de novembre, le 20 janvier N+1.
    expect(echeanceDUneFacture({ jour: 20, mois: 10 }, 60)).toEqual({ jour: 20, mois: 12, exercice: 0 });
    expect(echeanceDUneFacture({ jour: 20, mois: 11 }, 60)).toEqual({ jour: 20, mois: 1, exercice: 1 });
    expect(f.creances.filter((cr) => cr.client === "CampusTech").map((cr) => cr.date.mois)).toEqual([11, 12]);
    for (const cr of f.creances) expect(echeanceDUneFacture(cr.date, 60)).toEqual({ exercice: 0, ...cr.echeance });
  });
});

describe("la paie d'un mois", () => {
  const t = f.tauxDeLaPaie;

  it("du brut au net à payer, et ce que la paie coûte", () => {
    const b = bulletinDePaie(7_500, t, 700);
    expect(b.cotisationsSalariales).toEqual({ urssaf: 7_500 * 0.18, retraite: 7_500 * 0.04, total: 1_650 });
    expect(b.netAvantImpot).toBe(7_500 - 1_650);
    expect(b.csgCrdsNonDeductible).toBe(c(7_500 * 0.9825 * 0.029));
    expect(b.netImposable).toBe(c(5_850 + 213.69));
    expect(b.prelevementALaSource).toBe(c(6_063.69 * 0.02));
    expect(b.netAPayer).toBe(c(5_850 - 121.27 - 700));
    expect(b.cotisationsPatronales).toEqual({ urssaf: 7_500 * 0.36, retraite: 7_500 * 0.06, total: 3_150 });
    expect(b.coutEmployeur).toBe(10_650);
    expect(b.aVerser).toEqual({ urssaf: 1_350 + 2_700, retraite: 300 + 450, etat: 121.27, total: 4_921.27 });
    expect([b.netImposable, b.prelevementALaSource, b.netAPayer, b.verseAuxSalaries]).toEqual([6_063.69, 121.27, 5_028.73, 5_728.73]);
  });

  it("du net au brut : le net à payer est affine en brut", () => {
    const kNet = 0.78 - 0.02 * (0.78 + 0.029 * 0.9825);
    expect(coefficientDuBrutAuNet(t)).toBeCloseTo(kNet, 12);
    // Une prime nette de 500 € : la droite donne 654,60 €, les arrondis du bulletin la ramènent à 654,58 €.
    expect(Math.ceil((500 / kNet) * 100) / 100).toBe(654.6);
    const brut = brutPourUnNetAPayer(500, t);
    expect(brut).toBe(654.58);
    // À la main : 117,82 € + 26,18 € de cotisations, 510,58 € avant impôt, 18,65 € de CSG non déductible, 10,58 € prélevés.
    expect(c(c(654.58 - c(654.58 * 0.18) - c(654.58 * 0.04)) - c(c(c(654.58 - 144) + c(654.58 * 0.9825 * 0.029)) * 0.02))).toBe(500);
    expect(bulletinDePaie(brut, t).netAPayer).toBeGreaterThanOrEqual(500);
    expect(bulletinDePaie(c(brut - 0.01), t).netAPayer).toBeLessThan(500);
    // Le brut le plus élevé pour un coût employeur de 2 800 €.
    expect(brutPourUnCoutEmployeur(2_800, t)).toBe(Math.floor((2_800 / 1.42) * 100) / 100);
  });
});

describe("la balance avant inventaire, refaite sur les opérations de l'année", () => {
  it("les comptes de gestion", () => {
    const sonora = 22_420 + 28_025;
    expect(-solde("701")).toBe(PRIX * somme(PARTICULIERS) + 12 * 18_880 + sonora);
    expect(-solde("701")).toBe(1_385_556);
    expect(solde("601")).toBe(22 * somme(LIVRAISONS.slice(0, 11)) + 1_500 * 22);
    expect(solde("601")).toBe(499_598);
    expect(solde("606")).toBe(16 * somme(LIVRAISONS));
    expect(solde("6132")).toBe(12 * 19_700);
    expect(solde("616")).toBe(6_000);
    expect(solde("641")).toBe(12 * 7_500);
    expect(solde("645")).toBe(12 * 3_150);
    expect(solde("6611")).toBe(80_000 * 0.0125 + 76_000 * 0.0125 + 72_000 * 0.0125);
    expect(solde("665")).toBe(448.4);
  });

  it("les comptes de bilan", () => {
    expect(solde("101")).toBe(-150_000);
    expect(solde("164")).toBe(-(80_000 - 3 * 4_000));
    expect(solde("2154")).toBe(60_000);
    expect(solde("401")).toBe(-c(1_500 * 22 * 1.2));
    expect(solde("411")).toBe(c(2 * CAMPUSTECH_TTC + 33_630));
    expect(solde("411")).toBe(78_942);
    expect(somme(f.creances.map((x) => x.ttc))).toBe(solde("411"));
    for (const cr of f.creances) {
      expect(cr.ht).toBe(cr.client === "Sonora" ? 28_025 : cr.enceintes * PRIX);
      expect(cr.tva).toBe(c(cr.ht * 0.2));
      expect(cr.ttc).toBe(c(cr.ht + cr.tva));
    }
    expect(solde("431")).toBe(-(7_500 * 0.18 + 7_500 * 0.36));
    expect(solde("437")).toBe(-(7_500 * 0.04 + 7_500 * 0.06));
    expect(solde("442")).toBe(-121.27);
    // La TVA de décembre : collectée sur les particuliers et la facture de CampusTech, déductible sur les composants et les autres coûts.
    expect(solde("4455")).toBe(-c((2_000 * PRIX + 18_880) * 0.2 - (1_500 * 22 + 16 * 2_400) * 0.2));
    expect(solde("4455")).toBe(-13_096);
  });

  it("la banque : chaque encaissement et chaque décaissement de l'année", () => {
    // La TVA de chaque mois : collectée moins déductible. Le crédit de janvier (la ligne) s'impute sur février.
    const collectee = PARTICULIERS.map((q, m) => c((q * PRIX + 18_880) * 0.2 + (m === 8 ? 4_394.32 : m === 9 ? 5_605 : 0)));
    const deductible = LIVRAISONS.map((q, m) => c(((m === 11 ? 1_500 * 22 : q * 22) + q * 16) * 0.2 + (m === 0 ? 12_000 : 0)));
    expect(c(collectee[0]! - deductible[0]!)).toBe(-5_322);
    expect(c(collectee[1]! - deductible[1]! - 5_322)).toBe(768);
    // Payée dans l'année : les déclarations de janvier à novembre.
    const tvaPayee = c(somme(collectee.slice(0, 11)) - somme(deductible.slice(0, 11)));
    expect(tvaPayee).toBe(76_457.12);
    // CampusTech : les factures de janvier à octobre, payées à 60 jours (celle d'octobre le 20 décembre).
    const encaissements = c(150_000 + 80_000 + somme(PARTICULIERS) * PRIX * 1.2 + 10 * CAMPUSTECH_TTC + 26_365.92);
    const decaissements = c(
      72_000 +
        somme(LIVRAISONS.slice(0, 11)) * 22 * 1.2 + // les composants de janvier à novembre, payés le 1er du mois suivant
        somme(LIVRAISONS) * 16 * 1.2 + // les autres coûts, payés dans le mois
        12 * 19_700 +
        12 * 5_728.73 + // les salaires nets, acompte de janvier compris
        11 * 4_921.27 + // les organismes et l'État, le 15 du mois suivant
        tvaPayee +
        (5_000 + 4_950 + 4_900) + // les trois échéances de l'emprunt
        6_000, // la prime d'assurance
    );
    expect([encaissements, decaissements]).toEqual([1_813_187.12, 1_541_796.25]);
    // Le compte à terme : 133 000 € sortis du compte courant le 6 janvier.
    expect(solde("508")).toBe(133_000);
    expect(solde("512")).toBe(c(encaissements - decaissements - 133_000));
    expect(solde("512")).toBe(138_390.87);
  });

  it("la balance s'équilibre, et le bilan avant inventaire aussi", () => {
    expect(c(somme(f.balanceAvantInventaire.map((l) => l.debit)))).toBe(c(somme(f.balanceAvantInventaire.map((l) => l.credit))));
    expect(c(somme(f.balanceAvantInventaire.map((l) => l.debit)))).toBe(1_661_173.27);
    const charges = 499_598 + 377_744 + 236_400 + 6_000 + 90_000 + 37_800 + 2_850 + 448.4;
    expect(k.resultatAvantInventaire).toBe(c(1_385_556 - charges));
    expect(k.resultatAvantInventaire).toBe(CLOTURE_DE_LA_FICHE.resultatAvantInventaire);
    const b = k.bilanAvantInventaire;
    expect(b.totalActif).toBe(c(60_000 + 78_942 + 133_000 + 138_390.87));
    expect(b.totalPassif).toBe(c(150_000 + 134_715.6 + 68_000 + 39_600 + 4_050 + 750 + 121.27 + 13_096));
    expect(b.totalActif).toBe(b.totalPassif);
  });
});

describe("les travaux d'inventaire, un par un", () => {
  const montant = (code: CodeDeTravail) => k.travaux.find((t) => t.code === code)!.montant;

  it("chaque montant, refait à la main", () => {
    expect(montant("dotation")).toBe(c((60_000 / 6) * (355 / 360)));
    expect(montant("stock")).toBe(600 * ((1_500 * 22 + 1_500 * 23) / 3_000));
    expect(montant("factureNonParvenue")).toBe(1_500 * 23);
    expect(montant("creanceDouteuse")).toBe(c((33_630 / 1.2) * 0.4));
    expect(montant("provision")).toBe(5_000);
    expect(montant("chargeConstateeDAvance")).toBe((6_000 * 9) / 12);
    expect(montant("factureAEtablir")).toBe(200 * PRIX);
    expect(montant("produitConstateDAvance")).toBe(120 * PRIX);
    expect(montant("interetsCourus")).toBe(c(68_000 * 0.05 * (88 / 360)));
    expect(montant("interetsDuPlacement")).toBe(c(133_000 * 0.03 * (355 / 360)));
    expect(Object.fromEntries(k.travaux.map((t) => [t.code, t.montant]))).toEqual({
      dotation: CLOTURE_DE_LA_FICHE.travaux.dotationAuxAmortissements,
      stock: CLOTURE_DE_LA_FICHE.travaux.stockFinal,
      factureNonParvenue: CLOTURE_DE_LA_FICHE.travaux.factureNonParvenue,
      creanceDouteuse: CLOTURE_DE_LA_FICHE.travaux.depreciationDeLaCreance,
      provision: CLOTURE_DE_LA_FICHE.travaux.provisionPourLitige,
      chargeConstateeDAvance: CLOTURE_DE_LA_FICHE.travaux.chargeConstateeDAvance,
      factureAEtablir: CLOTURE_DE_LA_FICHE.travaux.factureAEtablir,
      produitConstateDAvance: CLOTURE_DE_LA_FICHE.travaux.produitConstateDAvance,
      interetsCourus: CLOTURE_DE_LA_FICHE.travaux.interetsCourus,
      interetsDuPlacement: CLOTURE_DE_LA_FICHE.travaux.interetsDuPlacement,
    });
    expect(Object.values(CLOTURE_DE_LA_FICHE.travaux)).toEqual([9_861.11, 13_500, 34_500, 11_210, 5_000, 4_500, 11_800, 7_080, 831.11, 3_934.58]);
  });

  it("chaque écriture est en partie double, et son effet sur le résultat a le bon signe", () => {
    for (const t of k.travaux) expect(c(somme(t.lignes.map((x) => x.debit)))).toBe(c(somme(t.lignes.map((x) => x.credit))));
    expect(k.travaux.map((t) => t.effetSurLeResultat)).toEqual([-9_861.11, 13_500, -34_500, -11_210, -5_000, 4_500, 11_800, -7_080, -831.11, 3_934.58]);
  });

  it("les jours de la convention du cours : jour de départ et jour d'arrivée compris, mois de 30 jours", () => {
    expect(joursCompris({ jour: 6, mois: 1 }, { jour: 31, mois: 12 })).toBe(25 + 11 * 30);
    expect(joursCompris({ jour: 3, mois: 10 }, { jour: 31, mois: 12 })).toBe(28 + 30 + 30);
    expect(joursCompris({ jour: 1, mois: 12 }, { jour: 31, mois: 12 })).toBe(30);
    expect(joursCompris({ jour: 16, mois: 4 }, { jour: 31, mois: 12 })).toBe(15 + 8 * 30);
    // Les 88 jours de N et les 2 de N+1 font le trimestre que paie l'échéance du 3 janvier.
    expect(joursCompris({ jour: 3, mois: 10 }, { jour: 31, mois: 12 }) + joursCompris({ jour: 1, mois: 1, exercice: 1 }, { jour: 2, mois: 1, exercice: 1 })).toBe(90);
    const cca = chargeConstateeDAvance(6_000, { jour: 1, mois: 10 }, 12, { jour: 31, mois: 12 });
    expect([cca.joursDansLExercice, cca.moisApres, cca.chargeDeLExercice, cca.montant]).toEqual([90, 9, 1_500, 4_500]);
  });

  it("le résultat avant impôt, l'impôt au taux réduit puis normal, le résultat net", () => {
    const rai = c(134_715.6 - 9_861.11 + 13_500 - 34_500 - 11_210 - 5_000 + 4_500 + 11_800 - 7_080 - 831.11 + 3_934.58);
    expect(k.resultatAvantImpot).toBe(rai);
    const is = Math.round(42_500 * 0.15 + (rai - 42_500) * 0.25);
    expect(k.impot).toMatchObject({ baseAuTauxReduit: 42_500, aTauxReduit: 6_375, baseAuTauxNormal: c(rai - 42_500), impot: is });
    expect(k.resultatNet).toBe(c(rai - is));
    expect([k.resultatAvantImpot, k.impot.impot, k.resultatNet]).toEqual([CLOTURE_DE_LA_FICHE.resultatAvantImpot, CLOTURE_DE_LA_FICHE.impot, CLOTURE_DE_LA_FICHE.resultatNet]);
    expect([rai, is]).toEqual([99_967.96, 20_742]);
    // Sans le taux réduit, et pour une perte.
    expect(cloture(f, { eligibleAuTauxReduit: false }).impot.impot).toBe(Math.round(rai * 0.25));
    expect(impotSurLesSocietes(-1_000, f.impot).impot).toBe(0);
    expect(impotSurLesSocietes(30_000, f.impot).impot).toBe(4_500);
  });
});

describe("le compte de résultat et le bilan après inventaire", () => {
  it("le compte de résultat retombe sur le résultat net", () => {
    const cr = k.compteDeResultat;
    expect(cr.produits.exploitation).toBe(1_385_556 + 11_800 - 7_080);
    expect(cr.charges.financieres).toBe(c(2_850 + 831.11 + 448.4));
    expect(cr.produits.financiers).toBe(3_934.58);
    expect(cr.charges.impot).toBe(20_742);
    expect(cr.resultat).toBe(k.resultatNet);
  });

  it("le bilan, poste par poste, s'équilibre", () => {
    const { actif, passif, totalActif, totalPassif } = k.bilan;
    expect(actif.immobilisations).toEqual({ brut: 60_000, amortissements: 9_861.11, net: c(60_000 - 9_861.11) });
    expect(actif.stocks.net).toBe(13_500);
    expect(actif.clients).toEqual({ brut: c(2 * CAMPUSTECH_TTC + 33_630 + 200 * PRIX * 1.2), depreciation: 11_210, net: c(45_312 + 33_630 + 14_160 - 11_210) });
    expect(actif.autresCreances).toBe(6_900);
    expect(actif.valeursMobilieresDePlacement).toBe(c(133_000 + 3_934.58));
    expect(actif.disponibilites).toBe(138_390.87);
    expect(actif.chargesConstateesDAvance).toBe(4_500);
    expect(passif.capitauxPropres).toEqual({ capital: 150_000, resultat: 79_225.96, total: 229_225.96 });
    expect(passif.provisions).toBe(5_000);
    expect(passif.emprunts).toBe(c(68_000 + 831.11));
    expect(passif.fournisseurs).toBe(c(39_600 + 41_400));
    expect(passif.dettesFiscalesEtSociales).toBe(c(4_050 + 750 + 121.27 + 13_096 + 2_360 + 20_742));
    expect(passif.produitsConstatesDAvance).toBe(7_080);
    expect(totalActif).toBe(c(50_138.89 + 13_500 + 81_892 + 6_900 + 136_934.58 + 138_390.87 + 4_500));
    expect(totalActif).toBe(totalPassif);
    expect(totalActif).toBe(CLOTURE_DE_LA_FICHE.totalDuBilan);
  });
});

describe("les soldes intermédiaires de gestion et la capacité d'autofinancement", () => {
  const s = k.sig;

  it("la cascade, à la main, jusqu'au résultat net", () => {
    expect(s.margeCommerciale).toBe(0);
    const production = 1_385_556 + 11_800 - 7_080;
    expect(s.production).toBe(production);
    const consommations = 499_598 + 34_500 - 13_500 + 377_744 + 236_400 + (6_000 - 4_500);
    expect(s.consommations).toBe(consommations);
    expect(s.valeurAjoutee).toBe(production - consommations);
    expect(s.excedentBrutDExploitation).toBe(s.valeurAjoutee - (90_000 + 37_800));
    expect(s.resultatDExploitation).toBe(c(s.excedentBrutDExploitation - (9_861.11 + 11_210 + 5_000)));
    expect(s.produitsFinanciers).toBe(3_934.58);
    expect(s.resultatFinancier).toBe(c(3_934.58 - (2_850 + 831.11 + 448.4)));
    expect(s.resultatCourantAvantImpot).toBe(c(s.resultatDExploitation + s.resultatFinancier));
    expect(s.resultatExceptionnel).toBe(0);
    expect(s.resultatNet).toBe(c(s.resultatCourantAvantImpot - 20_742));
    expect(s.resultatNet).toBe(k.resultatNet);
    expect(s.resultatCourantAvantImpot).toBe(k.resultatAvantImpot);
    const figes = CLOTURE_DE_LA_FICHE.soldes;
    expect([s.production, s.consommations, s.valeurAjoutee, s.excedentBrutDExploitation, s.resultatDExploitation, s.resultatFinancier, s.resultatCourantAvantImpot]).toEqual([
      figes.production,
      figes.consommations,
      figes.valeurAjoutee,
      figes.excedentBrutDExploitation,
      figes.resultatDExploitation,
      figes.resultatFinancier,
      figes.resultatCourantAvantImpot,
    ]);
    expect([figes.valeurAjoutee, figes.excedentBrutDExploitation]).toEqual([254_034, 126_234]);
  });

  it("les retraitements : le personnel extérieur et le crédit-bail ne changent pas le résultat", () => {
    const r = soldesIntermediaires(k.soldes, { personnelExterieur: 10_000, creditBail: { redevances: 12_000, dotationEquivalente: 9_000 } });
    expect(r.valeurAjoutee).toBe(s.valeurAjoutee + 10_000 + 12_000);
    expect(r.excedentBrutDExploitation).toBe(s.excedentBrutDExploitation + 12_000);
    expect(r.resultatDExploitation).toBe(c(s.resultatDExploitation + 12_000 - 9_000));
    expect(r.resultatNet).toBe(s.resultatNet);
  });

  it("la capacité d'autofinancement : la même par les deux méthodes", () => {
    const additive = c(79_225.96 + 9_861.11 + 11_210 + 5_000);
    // Les intérêts du placement sont un produit encaissable (à l'échéance) : la CAF les compte.
    const soustractive = c(126_234 + 3_934.58 - (2_850 + 831.11 + 448.4) - 20_742);
    expect(additive).toBe(soustractive);
    expect(k.caf).toMatchObject({ additive, soustractive });
    expect(additive).toBe(CLOTURE_DE_LA_FICHE.capaciteDAutofinancement);
  });
});

describe("le bilan fonctionnel", () => {
  const b = k.fonctionnel;

  it("les quatre masses, à la main", () => {
    expect(b.emploisStables).toBe(60_000);
    expect(b.ressourcesStables).toEqual({ capitauxPropres: 229_225.96, amortissementsEtDepreciations: c(9_861.11 + 11_210), provisions: 5_000, dettesFinancieres: 68_000, total: c(229_225.96 + 21_071.11 + 5_000 + 68_000) });
    expect(b.fondsDeRoulement).toBe(c(323_297.07 - 60_000));
    // L'exploitation : le stock, les créances brutes, la TVA à récupérer de la facture non parvenue, l'assurance d'avance.
    expect(b.actifDExploitation).toBe(13_500 + (45_312 + 33_630 + 14_160) + 6_900 + 4_500);
    // Les fournisseurs, les dettes sociales, la TVA de décembre et celle de la facture à établir, le produit d'avance.
    expect(b.passifDExploitation).toBe(c(39_600 + 41_400 + 4_050 + 750 + 121.27 + 13_096 + 2_360 + 7_080));
    // Hors exploitation : l'impôt dû et les intérêts courus.
    expect(b.passifHorsExploitation).toBe(c(20_742 + 831.11));
    expect(b.besoinDExploitation).toBe(c(118_002 - 108_457.27));
    expect(b.besoinDExploitation).toBe(9_544.73);
    expect(b.besoinEnFondsDeRoulement).toBe(c(b.besoinDExploitation + b.besoinHorsExploitation));
    // Négatif : l'impôt dû et les intérêts courus dépassent le besoin d'exploitation.
    expect(b.besoinEnFondsDeRoulement).toBe(c(9_544.73 - 21_573.11));
    expect(b.besoinEnFondsDeRoulement).toBe(-12_028.38);
    // La trésorerie active : le compte courant, le compte à terme et ses intérêts courus.
    expect(b.tresorerieActive).toBe(c(138_390.87 + 133_000 + 3_934.58));
    expect(b.tresorerieNette).toBe(275_325.45);
    expect(c(263_297.07 + 12_028.38)).toBe(275_325.45);
    expect(c(b.fondsDeRoulement - b.besoinEnFondsDeRoulement)).toBe(b.tresorerieNette);
    expect(b).toMatchObject({
      fondsDeRoulement: CLOTURE_DE_LA_FICHE.fonctionnel.fondsDeRoulement,
      besoinDExploitation: CLOTURE_DE_LA_FICHE.fonctionnel.besoinDExploitation,
      besoinHorsExploitation: CLOTURE_DE_LA_FICHE.fonctionnel.besoinHorsExploitation,
      besoinEnFondsDeRoulement: CLOTURE_DE_LA_FICHE.fonctionnel.besoinEnFondsDeRoulement,
      tresorerieNette: CLOTURE_DE_LA_FICHE.fonctionnel.tresorerieNette,
    });
  });

  it("les délais en leviers : le résultat ne bouge pas, la banque suit les factures encaissées", () => {
    // CampusTech à 30 jours : seule la facture du 20 décembre reste due ; le fournisseur à 60 jours : novembre et décembre.
    const v = cloture(f, { delaiCampusTech: 30, delaiFournisseur: 60 });
    expect(v.resultatNet).toBe(k.resultatNet);
    expect(v.fonctionnel.tresorerieNette).toBe(c(275_325.45 + CAMPUSTECH_TTC + 2_070 * 22 * 1.2));
    expect(c(v.fonctionnel.fondsDeRoulement - v.fonctionnel.besoinEnFondsDeRoulement)).toBe(v.fonctionnel.tresorerieNette);
    expect(v.bilan.totalActif).toBe(v.bilan.totalPassif);
    // Comptant : CampusTech ne doit plus rien.
    expect(cloture(f, { delaiCampusTech: 0 }).bilan.actif.clients.brut).toBe(c(33_630 + 14_160));
  });

  it("le besoin normatif : affine en délai, et la trésorerie nette qui en découle", () => {
    const p = { fondsDeRoulement: 263_297.07, ventesTtcAnnuelles: 12 * CAMPUSTECH_TTC, achatsTtcAnnuels: 0, delaiFournisseurs: 0, stock: 0, autres: 0 };
    const a = besoinSelonLesDelais({ ...p, delaiClients: 60 });
    const b2 = besoinSelonLesDelais({ ...p, delaiClients: 61 });
    expect(a.creances).toBe(c((271_872 * 60) / 360));
    // À 60 jours, le besoin normatif retrouve les deux factures de CampusTech encore dues.
    expect(a.creances).toBe(2 * CAMPUSTECH_TTC);
    expect(c(b2.besoin - a.besoin)).toBe(c(271_872 / 360));
    expect(a.tresorerieNette).toBe(c(263_297.07 - a.besoin));
  });
});

describe("les leviers de la clôture : tout reste équilibré", () => {
  const combinaisons = [
    { modeDAmortissement: "degressif" as const },
    { methodeDeStock: "peps" as const },
    { methodeDeStock: "cmup-apres-chaque-entree" as const },
    { tauxDePerteProbable: 0.7, provisionPourLitige: 12_000 },
    { travauxOublies: ["stock", "factureNonParvenue", "interetsCourus"] as CodeDeTravail[] },
    { delaiCampusTech: 120, delaiFournisseur: 0, eligibleAuTauxReduit: false },
    { tauxDuPlacement: 0, travauxOublies: ["interetsDuPlacement"] as CodeDeTravail[] },
  ];

  it("le bilan s'équilibre, la CAF est la même par ses deux méthodes, FRNG − BFR = trésorerie nette", () => {
    for (const leviers of combinaisons) {
      const v = cloture(f, leviers);
      expect(v.bilan.totalActif).toBe(v.bilan.totalPassif);
      expect(v.caf.additive).toBe(v.caf.soustractive);
      expect(c(v.fonctionnel.fondsDeRoulement - v.fonctionnel.besoinEnFondsDeRoulement)).toBe(v.fonctionnel.tresorerieNette);
      expect(v.sig.resultatNet).toBe(v.resultatNet);
    }
  });

  it("le dégressif : 17 500 € de dotation au lieu de 9 861,11 €, et l'impôt qui baisse", () => {
    const v = cloture(f, { modeDAmortissement: "degressif" });
    expect(v.resultatAvantImpot).toBe(c(99_967.96 + 9_861.11 - 17_500));
    expect(v.impot.impot).toBe(Math.round(6_375 + (v.resultatAvantImpot - 42_500) * 0.25));
    // La trésorerie ne bouge pas : l'impôt n'est pas encore payé.
    expect(v.fonctionnel.tresorerieNette).toBe(275_325.45);
  });

  it("le PEPS gonfle le stock final quand les prix montent, et le résultat avec lui", () => {
    expect(cloture(f, { methodeDeStock: "peps" }).resultatAvantImpot).toBe(c(99_967.96 + (13_800 - 13_500)));
    expect(cloture(f, { methodeDeStock: "cmup-apres-chaque-entree" }).resultatAvantImpot).toBe(c(99_967.96 + (13_650 - 13_500)));
  });

  it("les travaux oubliés : le résultat de la balance, faux de leurs effets", () => {
    const v = cloture(f, { travauxOublies: ["stock", "factureNonParvenue", "interetsCourus"] });
    expect(v.resultatAvantImpot).toBe(c(99_967.96 - 13_500 + 34_500 + 831.11));
    expect(v.travauxOublies.map((t) => t.code)).toEqual(["stock", "factureNonParvenue", "interetsCourus"]);
  });
});

describe("l'étape d'expert : emprunter à 5 % pour placer à 3 % ?", () => {
  it("sur l'exercice, garder les 80 000 € empruntés au lieu de ne pas emprunter coûte l'écart des taux", () => {
    // Ce que l'emprunt coûte sur l'exercice : trois échéances d'intérêts et les intérêts courus.
    const charge = c(2_850 + 831.11);
    // Ce que les mêmes 80 000 € rapportent placés à 3 %, du 6 janvier au 31 décembre.
    const produit = c(80_000 * 0.03 * (355 / 360));
    expect([charge, produit]).toEqual([3_681.11, 2_366.67]);
    const coutAvantImpot = c(charge - produit);
    expect(coutAvantImpot).toBe(1_314.44);
    // Au taux marginal de l'impôt (25 % : NOVA est au-delà du plafond du taux réduit), il en coûte 75 %.
    expect(c(coutAvantImpot * 0.75)).toBe(985.83);
    // Le modèle le confirme : le placement à 3 % rapporte moins que l'emprunt ne coûte, chaque euro gardé coûte 2 points.
    expect(cloture(f, { tauxDuPlacement: 0.05 }).resultatAvantImpot).toBe(c(99_967.96 + 133_000 * 0.02 * (355 / 360)));
  });
});

describe("l'emprunt", () => {
  it("le tableau en amortissement constant, ligne à ligne, solde le capital", () => {
    const t = tableauDAmortissement(f.pret);
    expect(t).toHaveLength(20);
    t.forEach((l, i) => {
      const du = 80_000 - 4_000 * i;
      expect(l).toMatchObject({ numero: i + 1, capitalDebut: du, interets: c(du * 0.0125), amortissement: 4_000, echeance: c(4_000 + du * 0.0125), capitalFin: du - 4_000 });
    });
    expect(t.map((l) => l.date).slice(0, 5)).toEqual([
      { jour: 3, mois: 4, exercice: 0 },
      { jour: 3, mois: 7, exercice: 0 },
      { jour: 3, mois: 10, exercice: 0 },
      { jour: 3, mois: 1, exercice: 1 },
      { jour: 3, mois: 4, exercice: 1 },
    ]);
    expect(somme(t.map((l) => l.amortissement))).toBe(80_000);
    expect(t.at(-1)!.capitalFin).toBe(0);
    expect(coutDuCredit(f.pret)).toBe(c(somme(Array.from({ length: 20 }, (_, i) => (80_000 - 4_000 * i) * 0.0125))));
    expect(coutDuCredit(f.pret)).toBe(10_500);
  });

  it("le tableau en échéances constantes solde le capital, et coûte plus d'intérêts", () => {
    const a = c((80_000 * 0.0125) / (1 - 1.0125 ** -20));
    expect(echeanceConstante(f.pret)).toBe(a);
    expect(a).toBe(4_545.63);
    const t = tableauDAmortissement(f.pret, "echeances-constantes");
    expect(t[0]).toMatchObject({ interets: 1_000, amortissement: c(a - 1_000), echeance: a });
    expect(t.slice(0, -1).every((l) => l.echeance === a)).toBe(true);
    expect(c(somme(t.map((l) => l.amortissement)))).toBe(80_000);
    expect(t.at(-1)!.capitalFin).toBe(0);
    expect(coutDuCredit(f.pret, "echeances-constantes")).toBe(c(somme(t.map((l) => l.echeance)) - 80_000));
    expect(coutDuCredit(f.pret, "echeances-constantes")).toBeGreaterThan(10_500);
  });

  it("d'autres contrats soldent leur capital aussi (le second prêt du cas, un prêt à taux nul)", () => {
    const contrats: ContratDePret[] = [
      { ...f.pret, capital: 45_000, dureeAns: 6, versement: { jour: 1, mois: 7 }, premiereEcheance: { jour: 1, mois: 10 } },
      { ...f.pret, capital: 80_000, tauxAnnuel: 0.0425, mode: "echeances-constantes" },
      { ...f.pret, capital: 33_333, tauxAnnuel: 0, dureeAns: 3 },
    ];
    for (const contrat of contrats) {
      for (const mode of ["amortissement-constant", "echeances-constantes"] as const) {
        const t = tableauDAmortissement(contrat, mode);
        expect(c(somme(t.map((l) => l.amortissement)))).toBe(contrat.capital);
        expect(t.at(-1)!.capitalFin).toBe(0);
      }
    }
    expect(tableauDAmortissement(contrats[0]!, "amortissement-constant")[0]).toMatchObject({ amortissement: 1_875, interets: 562.5, echeance: 2_437.5 });
  });

  it("l'emprunt au 31 décembre, et les intérêts courus", () => {
    const e = empruntALaCloture(f.pret);
    expect(e.echeances.map((l) => l.echeance)).toEqual([5_000, 4_950, 4_900]);
    expect(e.interetsPayes).toBe(1_000 + 950 + 900);
    expect(e.capitalRestantDu).toBe(80_000 - 3 * 4_000);
    expect(e.partAMoinsDUnAn).toBe(4 * 4_000);
    expect(e.interetsCourus).toMatchObject({ depuis: { jour: 3, mois: 10, exercice: 0 }, jours: 88, joursDeLaPeriode: 90, montant: c((850 * 88) / 90) });
    expect(e.interetsCourus.montant).toBe(c(68_000 * 0.05 * (88 / 360)));
    expect(e.chargeDInterets).toBe(c(2_850 + 831.11));
    // N+1 : quatre échéances, et les intérêts courus de N extournés.
    const n1 = empruntALaCloture(f.pret, 1);
    expect(n1.interetsPayes).toBe(850 + 800 + 750 + 700);
    expect(n1.interetsCourus.montant).toBe(c((650 * 88) / 90));
    expect(n1.chargeDInterets).toBe(c(3_100 + (650 * 88) / 90 - 831.11));
    // Avant la première échéance, les intérêts courent depuis le versement des fonds.
    expect(interetsCourus(f.pret, { jour: 31, mois: 3 }).montant).toBe(c((1_000 * 88) / 90));
  });
});

describe("l'amortissement de la ligne", () => {
  it("le plan linéaire : un prorata de 355 jours, cinq années pleines, le reste la septième", () => {
    const p = planDAmortissement(f.immobilisation, "lineaire");
    expect(p.map((l) => l.dotation)).toEqual([c(10_000 * (355 / 360)), 10_000, 10_000, 10_000, 10_000, 10_000, c(60_000 - 9_861.11 - 50_000)]);
    expect(p.map((l) => l.valeurNette)).toEqual([50_138.89, 40_138.89, 30_138.89, 20_138.89, 10_138.89, 138.89, 0]);
    expect(c(somme(p.map((l) => l.dotation)))).toBe(60_000);
  });

  it("le plan dégressif : 1,75 pour 6 ans, la bascule en linéaire la quatrième année", () => {
    expect([coefficientDegressif(2), coefficientDegressif(4), coefficientDegressif(6), coefficientDegressif(8)]).toEqual([0, 1.25, 1.75, 2.25]);
    const taux = 1.75 / 6;
    const d1 = c(60_000 * taux); // douze mois : le dégressif part du 1er janvier, mois d'acquisition
    const d2 = c((60_000 - d1) * taux);
    const d3 = c((60_000 - d1 - d2) * taux);
    const reste = c(60_000 - d1 - d2 - d3);
    // La quatrième année, le linéaire sur 3 ans (33,33 %) dépasse le dégressif (29,17 %).
    expect(1 / 3).toBeGreaterThan(taux);
    expect(1 / 4).toBeLessThan(taux);
    const d4 = c(reste / 3);
    const p = planDAmortissement(f.immobilisation, "degressif");
    expect(p.map((l) => l.dotation)).toEqual([d1, d2, d3, d4, d4, c(reste - 2 * d4)]);
    expect([d1, d2, d3, d4]).toEqual([17_500, 12_395.83, 8_780.38, 7_107.93]);
    expect(p.at(-1)!.valeurNette).toBe(0);
    expect(valeurNetteALaCloture(f.immobilisation, "degressif", 0)).toBe(42_500);
    expect(amortissementDerogatoire(f.immobilisation)[0]!.ecart).toBe(c(17_500 - 9_861.11));
  });

  it("la revente au 30 juin de la troisième année : le mode déplace le résultat de cession", () => {
    const lin = cession(f.immobilisation, "lineaire", { jour: 30, mois: 6, exercice: 2 }, 14_100);
    expect(lin).toMatchObject({ dotationDeLAnnee: 5_000, cumul: c(9_861.11 + 10_000 + 5_000), valeurNette: 35_138.89, resultat: c(14_100 - 35_138.89), nature: "moins-value" });
    const deg = cession(f.immobilisation, "degressif", { jour: 30, mois: 6, exercice: 2 }, 14_100);
    expect(deg).toMatchObject({ dotationDeLAnnee: c(8_780.38 / 2), valeurNette: c(60_000 - 17_500 - 12_395.83 - 4_390.19), nature: "moins-value" });
    expect(deg.valeurNette).toBe(25_713.98);
    expect(cession(f.immobilisation, "lineaire", { jour: 30, mois: 6, exercice: 2 }, 40_000).nature).toBe("plus-value");
  });
});

describe("le stock", () => {
  it("les composants de décembre : trois méthodes, trois stocks finaux", () => {
    const periode = valoriserLeStock(f.composantsDeDecembre, "cmup-periode");
    expect(periode.coutMoyenDePeriode).toBe((1_500 * 22 + 1_500 * 23) / 3_000);
    expect(periode.final).toEqual({ quantite: 1_500 + 1_500 - 1_000 - 1_400, valeur: 600 * 22.5 });
    // Après chaque entrée : 500 jeux à 22 € restent avant le lot à 23 €.
    const apres = valoriserLeStock(f.composantsDeDecembre, "cmup-apres-chaque-entree");
    expect(apres.lignes[2]!.coutUnitaire).toBe(23);
    expect(apres.final.valeur).toBe(600 * ((500 * 22 + 1_500 * 23) / 2_000));
    // PEPS : les 600 restants sont du dernier lot.
    const peps = valoriserLeStock(f.composantsDeDecembre, "peps");
    expect(peps.final.valeur).toBe(600 * 23);
    expect([periode.final.valeur, apres.final.valeur, peps.final.valeur]).toEqual([13_500, 13_650, 13_800]);
    for (const v of [periode, apres, peps]) expect(c(v.sorties.valeur + v.final.valeur)).toBe(1_500 * 22 + 1_500 * 23);
    expect(periode.sorties.valeur).toBe(2_400 * 22.5);
  });

  it("le trimestre de MAILLE & CO : le CMUP de période et la marge commerciale du chapitre", () => {
    const s = CAS_DES_ENTREPRISES.boutique!.stock!;
    const r = inventaireDeLaPeriode({ initial: s.initial, achats: { quantite: s.achats.quantite, prixUnitaire: s.achats.prixUnitaire }, vendues: s.vendues, ventesHt: s.ventes.ht });
    expect(r.cmup).toBe(c((27_510 + 114_100) / (1_110 + 4_564)));
    expect(r.cmup).toBe(s.cump);
    expect(r.final).toEqual({ quantite: 1_073, valeur: s.final.valeur });
    expect(r.coutDAchatDesVendues).toBe(s.coutDAchatDesVendues);
    expect(r.margeCommerciale).toBe(c(255_309.49 - 114_827.92));
    // En PEPS, les 1 073 unités restantes viennent des achats du trimestre, à 25 €.
    const peps = valoriserLeStock(
      {
        libelle: "MAILLE & CO",
        initial: s.initial,
        mouvements: [
          { date: { jour: 1, mois: 1 }, libelle: "achats", sens: "entree", quantite: s.achats.quantite, prixUnitaire: s.achats.prixUnitaire },
          { date: { jour: 2, mois: 1 }, libelle: "ventes", sens: "sortie", quantite: s.vendues },
        ],
      },
      "peps",
    );
    expect(peps.final.valeur).toBe(1_073 * 25);
  });
});

describe("la prudence, et ce que N+1 dénoue", () => {
  it("la créance de Sonora : dépréciée sur son hors taxes, puis perdue à moitié", () => {
    const d = depreciationDeCreance(33_630, 0.2, 0.4);
    expect(d).toEqual({ ttc: 33_630, ht: 28_025, tva: 5_605, depreciation: 28_025 * 0.4, valeurNette: c(33_630 - 11_210) });
    const p = perteSurCreance(33_630, 33_630 * f.suites.sonora.partEncaissee, 0.2, 11_210);
    expect(p).toEqual({ encaisse: 16_815, perteTtc: 16_815, perteHt: c(16_815 / 1.2), tvaRecuperee: c(16_815 - 14_012.5), reprise: 11_210, chargeNette: c(14_012.5 - 11_210) });
    // Sur les deux années, la créance coûte ce qui est perdu hors taxes.
    expect(c(d.depreciation + p.chargeNette)).toBe(c(28_025 * 0.5));
    expect(ajustementDeDepreciation(11_210, c(28_025 * 0.7))).toEqual({ dotation: c(19_617.5 - 11_210), reprise: 0 });
    expect(ajustementDeDepreciation(11_210, 5_000)).toEqual({ dotation: 0, reprise: 6_210 });
  });

  it("le litige : la provision au montant probable, puis la condamnation", () => {
    expect(f.litige).toEqual({ demande: 12_000, montantProbable: 5_000 });
    expect(c(f.suites.litige.condamnation - f.litige.montantProbable)).toBe(-1_000);
  });
});
