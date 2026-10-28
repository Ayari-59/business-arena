import { describe, expect, it } from "vitest";
import {
  ASSURANCE,
  BALANCE_AVANT_INVENTAIRE,
  APPORT_EN_CAPITAL,
  CLOTURE_DE_LA_FICHE,
  CONTRAT_DE_PRET,
  EQUIPEMENT,
  IMPOT_SUR_LES_SOCIETES,
  LITIGE,
  LIVRAISONS_DU_MOIS,
  PAIE_DU_MOIS,
  PLACEMENT,
  TAUX_DE_LA_PAIE,
} from "../../src/config/cours/monde/exercice-de-nova";
import { NOVA_CAPACITE, VERSEMENT_A_LA_RESERVE, type FicheDeLaCapacite } from "../../src/config/cours/monde/nova-capacite";
import { AUTRES_COUTS_PAR_ENCEINTE, CAPACITE_DU_TRIMESTRE, COMPOSANTS_PAR_ENCEINTE, PRIX_DE_L_ENCEINTE, SEUILS_D_ALERTE } from "../../src/config/cours/monde/nova-gestion";
import {
  aleasDeLAnnee,
  anneeDeProduction,
  budgetDUnPoint,
  capaciteDAbsorption,
  capaciteDeLEquipe,
  choisirUneAssurance,
  comparerLesMachines,
  coutDUnAlea,
  coutEmployeurMensuel,
  coutMoyenDUnDefaut,
  coutsDeLaQualite,
  courbeDeLaQualite,
  demarcheQualite,
  departDUnSalarie,
  disponibilitesDeLAnnee,
  encaisser,
  enceintesParOperateurEtParMois,
  entretienAuSeuil,
  entretienDeLAnnee,
  equipeMoisParMois,
  facteurDActualisation,
  formuleDAssurance,
  hausseQuiAnnuleLaVan,
  machineEnPlus,
  margeUnitaire,
  partDuMarche,
  planDEmprunt,
  primePlafond,
  probabiliteDEquilibre,
  sansEntretienAuTrimestre,
  seuilDEntretien,
  tauxDeDefaut,
  trimestreDeProduction,
  variationDeDisponibilite,
} from "../../src/config/cours/monde/capacite";

/**
 * LA CAPACITÉ DU COURS (monde/capacite.ts sur monde/nova-capacite.ts), REFAITE À LA MAIN.
 *
 * Chaque chiffre attendu est recalculé ici sur la fiche, sans les fonctions du modèle ; les valeurs
 * absolues de NOVA sont épinglées (un changement de la fiche se voit). La fiche est d'abord
 * confrontée aux autres fiches de NOVA (la même enceinte, la même ligne, la même paie, la même
 * assurance, la même clôture). Puis les propriétés qui font voir les notions sont gardées : un outil
 * qui est le goulot en N + 1 et ne l'était pas en N, un entretien dont l'absence coûte des ventes, un
 * poste vide qui fait de l'équipe le goulot, un pire sinistre que NOVA ne peut pas encaisser, une
 * courbe de la qualité en U dont le minimum n'est pas le meilleur résultat, une machine dont la VAN
 * change de signe avec la demande.
 */

const f = NOVA_CAPACITE;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const MARGE = 59 - 22 - 16;
const DEMANDE_N1 = [5_800, 7_400, 6_200, 7_800];
/** Les ventes du plan de N + 1, refaites : min(demande, 7 000, 7 200). */
const VENTES_N1 = DEMANDE_N1.map((d) => Math.min(d, 7_000, 7_200));
const COUT_EMPLOYEUR = 1_875 * 1.42;
/** Le facteur d'actualisation de 6 ans à 8 %, terme à terme. */
const A6 = somme([1, 2, 3, 4, 5, 6].map((k) => 1 / Math.pow(1.08, k)));

describe("la fiche de NOVA tient debout, et c'est la NOVA des autres fiches", () => {
  it("l'enceinte NOVA One : 59 €, 22 € de composants, 16 € d'autres coûts, 21 € de marge, ceux de nova-gestion.ts", () => {
    expect(f.enceinte.prix).toBe(PRIX_DE_L_ENCEINTE);
    expect(f.enceinte.coutVariable.composants).toBe(COMPOSANTS_PAR_ENCEINTE);
    expect(f.enceinte.coutVariable.autres).toBe(AUTRES_COUTS_PAR_ENCEINTE);
    expect(margeUnitaire(f)).toBe(21);
    expect(MARGE).toBe(21);
  });

  it("la ligne : 4 postes manuels à 15 000 €, la ligne d'exercice-de-nova.ts, et 7 000 enceintes par trimestre, la capacité de nova-gestion.ts", () => {
    expect(f.ligne.postes).toBe(EQUIPEMENT.quantite);
    expect(f.ligne.valeurANeuf).toBe(EQUIPEMENT.ht);
    expect(f.ligne.capaciteParTrimestre).toBe(CAPACITE_DU_TRIMESTRE);
    expect(f.ligne.capaciteParTrimestre).toBe(7_000);
  });

  it("les opérateurs : les 4 salariés de la paie, 1 875 € bruts chacun, 2 662,50 € par mois pour NOVA, 600 enceintes par mois", () => {
    expect(f.operateurs.nombre).toBe(PAIE_DU_MOIS.effectif);
    expect(f.operateurs.nombre * f.operateurs.salaireBrutMensuel).toBe(PAIE_DU_MOIS.brut);
    expect(f.operateurs.tauxDesCotisationsPatronales).toBeCloseTo(TAUX_DE_LA_PAIE.patronalUrssaf + TAUX_DE_LA_PAIE.patronalRetraite, 12);
    expect(coutEmployeurMensuel(f)).toBe(2_662.5);
    expect(COUT_EMPLOYEUR * 12).toBe(31_950);
    // 180 heures par mois ÷ 0,3 heure l'enceinte ; 540 heures par trimestre, celles de l'arène.
    expect(f.operateurs.heuresParMois * 3).toBe(540);
    expect(enceintesParOperateurEtParMois(f)).toBe(600);
    expect(capaciteDeLEquipe(f)).toBe(4 * 600 * 3);
    expect(capaciteDeLEquipe(f)).toBe(7_200);
  });

  it("l'année N : la demande de chaque trimestre est ce qu'exercice-de-nova.ts a livré, 23 609 enceintes, toujours sous l'outil", () => {
    const parTrimestre = [0, 1, 2, 3].map((t) => somme(LIVRAISONS_DU_MOIS.slice(t * 3, t * 3 + 3)));
    expect(parTrimestre).toEqual([...f.anneeN.demande]);
    expect(f.anneeN.demande).toEqual([4_778, 6_081, 5_810, 6_940]);
    expect(somme(f.anneeN.demande)).toBe(23_609);
    for (const d of f.anneeN.demande) expect(d).toBeLessThan(7_000);
  });

  it("l'année N + 1 : 27 200 enceintes demandées, plus que l'outil aux trimestres 2 et 4, moins aux trimestres 1 et 3", () => {
    expect(f.anneeNPlus1.demande).toEqual(DEMANDE_N1);
    expect(somme(f.anneeNPlus1.demande)).toBe(27_200);
    expect(f.anneeNPlus1.demande.map((d) => d > 7_000)).toEqual([false, true, false, true]);
    // Environ 15 % de plus qu'en N.
    expect(27_200 / 23_609 - 1).toBeCloseTo(0.152, 3);
    expect(f.plan.entretien).toEqual([4_500, 4_500, 4_500, 4_500]);
  });

  it("l'assurance de N est la « Basique », 1 500 € par trimestre ; le litige de la batterie est l'aléa de responsabilité civile, qu'elle ne couvre pas", () => {
    const basique = f.formules.find((x) => x.code === "basique")!;
    expect(basique.primeParTrimestre * 4).toBe(ASSURANCE.prime);
    expect(f.aleas.find((a) => a.code === "responsabilite-civile")!.dommages).toBe(LITIGE.demande);
    expect(basique.couverts).not.toContain("responsabilite-civile");
  });

  it("la capacité d'absorption : le compte courant, le placement et les capitaux propres de la clôture de N, le matelas de nova-gestion.ts", () => {
    // Le compte courant du 31 décembre N, moins le versement du 1er janvier N + 1 à la réserve.
    expect(BALANCE_AVANT_INVENTAIRE.find((l) => l.compte === "512")!.debit).toBe(138_390.87);
    expect(VERSEMENT_A_LA_RESERVE.montant).toBe(320 * 59 * 1.2);
    expect(auCentime(138_390.87 - VERSEMENT_A_LA_RESERVE.montant)).toBe(f.absorption.compteCourant);
    expect(f.absorption.compteCourant).toBe(115_734.87);
    expect(PLACEMENT.montant + VERSEMENT_A_LA_RESERVE.montant).toBe(f.absorption.reserve);
    expect(f.absorption.reserve).toBe(155_656);
    expect(APPORT_EN_CAPITAL.montant).toBe(f.absorption.capitalSocial);
    expect(auCentime(APPORT_EN_CAPITAL.montant + CLOTURE_DE_LA_FICHE.resultatNet)).toBe(f.absorption.capitauxPropres);
    expect(SEUILS_D_ALERTE.tresorerie).toBe(f.absorption.matelas);
  });

  it("l'investissement : le taux de l'emprunt de NOVA, le taux normal de l'impôt", () => {
    expect(f.investissement.tauxDeLEmprunt).toBe(CONTRAT_DE_PRET.tauxAnnuel);
    expect(f.investissement.tauxDImpot).toBe(IMPOT_SUR_LES_SOCIETES.tauxNormal);
    const poste = f.machines.find((m) => m.code === "poste-manuel")!;
    expect(poste.prix).toBe(EQUIPEMENT.prixUnitaireHt);
    expect(poste.capaciteEnPlus).toBe(7_000 / 4);
    expect(poste.dureeEnAnnees).toBe(EQUIPEMENT.dureeAns);
    expect(poste.entretienParAn).toBe((4_500 / 4) * 4);
  });

  it("les catalogues : des formules qui couvrent de plus en plus, des franchises qui baissent, une courbe de la qualité qui descend de moins en moins", () => {
    const [b, e, t] = f.formules;
    expect([b!.primeParTrimestre, e!.primeParTrimestre, t!.primeParTrimestre]).toEqual([1_500, 4_500, 7_000]);
    expect([b!.franchise, e!.franchise, t!.franchise]).toEqual([5_000, 2_000, 1_000]);
    for (const x of b!.couverts) expect(e!.couverts).toContain(x);
    for (const x of e!.couverts) expect(t!.couverts).toContain(x);
    expect(t!.couverts).toHaveLength(f.aleas.length);
    for (const a of f.aleas) expect(a.probabilite, a.code).toBeGreaterThan(0);
    // Les quatre budgets du chapitre : aucun, la moitié, l'actuel, le double.
    expect(f.qualite.courbe.map((p) => p.budget)).toEqual([0, 16_000 / 2, 16_000, 16_000 * 2]);
    const c = f.qualite.courbe;
    const pentes = c.slice(1).map((p, i) => (c[i]!.tauxDeDefaut - p.tauxDeDefaut) / (p.budget - c[i]!.budget));
    for (let i = 1; i < pentes.length; i++) expect(pentes[i]!).toBeLessThan(pentes[i - 1]!);
  });
});

describe("1. la production et le goulot", () => {
  it("N + 1 : min(demande, 7 000, 7 200) = 5 800, 7 000, 6 200, 7 000 ; 26 000 enceintes, 1 200 refusées ; l'outil est le goulot aux trimestres 2 et 4", () => {
    const a = anneeDeProduction(f);
    expect(VENTES_N1).toEqual([5_800, 7_000, 6_200, 7_000]);
    expect(a.trimestres.map((x) => x.production)).toEqual(VENTES_N1);
    expect(a.production).toBe(26_000);
    expect(a.trimestres.map((x) => x.refusees)).toEqual([0, 400, 0, 800]);
    expect(a.refusees).toBe(27_200 - 26_000);
    expect(a.goulots).toEqual(["demande", "outil", "demande", "outil"]);
    expect(a.marge).toBe(26_000 * 21);
    expect(a.chiffreDAffaires).toBe(26_000 * 59);
    expect(a.margeRefusee).toBe(1_200 * 21);
    expect(a.tauxDeService).toBe(26_000 / 27_200);
  });

  it("N : toute la demande est servie ; au trimestre 4, l'outil tourne à 99,1 %", () => {
    const n = anneeDeProduction(f, { annee: "N" });
    expect(n.production).toBe(23_609);
    expect(n.refusees).toBe(0);
    expect(n.goulots).toEqual(["demande", "demande", "demande", "demande"]);
    expect(n.trimestres[3]!.occupationDeLOutil).toBe(6_940 / 7_000);
  });

  it("le goulot se déplace : un outil plus grand sans opérateur de plus bute sur l'équipe (7 200)", () => {
    const a = anneeDeProduction(f, { capaciteEnPlus: 1_750 });
    expect(a.trimestres.map((x) => x.production)).toEqual([5_800, 7_200, 6_200, 7_200]);
    expect(a.goulots).toEqual(["demande", "equipe", "demande", "equipe"]);
    // Plus d'équipe sans plus d'outil ne fait rien vendre de plus : l'outil reste le goulot.
    expect(anneeDeProduction(f, { equipeEnPlus: 1_800 }).production).toBe(26_000);
    // À égalité entre l'outil et l'équipe, le cours nomme l'outil.
    expect(trimestreDeProduction(8_000, 7_000, 7_000).goulot).toBe("outil");
    expect(trimestreDeProduction(7_000, 7_000, 7_200).goulot).toBe("demande");
  });
});

describe("2. la disponibilité selon l'entretien", () => {
  it("le seuil : 4 500 € × 5 % ÷ 7,5 % = 3 000 € ; un point de disponibilité réparé pour 600 €", () => {
    expect(seuilDEntretien(f)).toBe(3_000);
    expect(budgetDUnPoint(f)).toBe(4_500 / 7.5);
    expect(variationDeDisponibilite(f, 3_000)).toBe(0);
    expect(variationDeDisponibilite(f, 0)).toBe(-0.05);
    expect(variationDeDisponibilite(f, 4_500)).toBe(0.025);
    // Au-delà de la référence, un euro de plus ne répare rien.
    expect(variationDeDisponibilite(f, 9_000)).toBe(0.025);
    expect(variationDeDisponibilite(f, 2_400)).toBeCloseTo(2_400 / 600 / 100 - 0.05, 12);
  });

  it("un trimestre 1 sans entretien : 100 %, puis 95 %, 97,5 % et 100 % ; 6 650 et 6 825 enceintes d'outil aux trimestres 2 et 3", () => {
    const d = disponibilitesDeLAnnee(f, { budgets: [0, 4_500, 4_500, 4_500] });
    // 100 % − 5 points ; puis 95 % − 5 + 7,5 points ; puis 97,5 % − 5 + 7,5 points, ramené à 100 %.
    expect(d.trimestres).toEqual([1, 0.95, 0.975, 1]);
    expect(0.975 - 0.05 + 0.075).toBeCloseTo(1, 12);
    const s = sansEntretienAuTrimestre(f);
    expect(s.trimestres.map((x) => x.capaciteOutil)).toEqual([7_000, 7_000 * 0.95, 7_000 * 0.975, 7_000]);
  });

  it("l'économie se perd : 4 500 € d'entretien économisés, 350 enceintes perdues au trimestre 2, 7 350 € de marge, −2 850 €", () => {
    const s = sansEntretienAuTrimestre(f);
    expect(s.economie).toBe(4_500);
    // Trimestre 2 : 6 650 enceintes d'outil pour 7 400 demandées, au lieu de 7 000. Trimestre 3 : 6 825 pour 6 200, rien ne se perd.
    expect(s.trimestres.map((x) => x.ventesPerdues)).toEqual([0, 7_000 - 6_650, 0, 0]);
    expect(s.margePerdue).toBe(350 * 21);
    expect(s.ecartParLaDisponibilite).toBe(4_500 - 7_350);
    // Les défauts du trimestre 1 : 5 800 × 3 points, au coût moyen de 0,8 × 20 € + 0,2 × 100 € = 36 €.
    expect(coutMoyenDUnDefaut(f)).toBe(0.8 * 20 + 0.2 * 100);
    expect(s.defautsEnPlus).toBeCloseTo(5_800 * 0.03, 9);
    expect(s.coutDesDefautsEnPlus).toBe(174 * 36);
    expect(s.ventesPerduesParLaQualite).toBeCloseTo(174 * 0.2 * 3, 9);
    expect(s.margePerdueParLaQualite).toBe(auCentime(104.4 * 21));
    expect(s.ecartDeResultat).toBe(auCentime(4_500 - 7_350 - 6_264 - 2_192.4));
  });

  it("le même entretien sauté sur la demande de N ne coûte aucune vente : l'outil n'y est pas le goulot", () => {
    const s = entretienDeLAnnee(f, [0, 4_500, 4_500, 4_500], { demande: f.anneeN.demande });
    expect(s.ventesPerdues).toBe(0);
    expect(s.ecartParLaDisponibilite).toBe(4_500);
  });

  it("au seuil toute l'année : l'outil reste à 100 %, 6 000 € économisés, mais 260 défauts de plus (9 360 €) et 156 ventes perdues (3 276 €)", () => {
    const s = entretienAuSeuil(f);
    expect(s.budgets).toEqual([3_000, 3_000, 3_000, 3_000]);
    expect(s.trimestres.map((x) => x.disponibilite)).toEqual([1, 1, 1, 1]);
    expect(s.disponibiliteApres).toBe(1);
    expect(s.ventesPerdues).toBe(0);
    expect(s.economie).toBe((4_500 - 3_000) * 4);
    // Un point de défaut de plus : 3 % × (1 − 3 000 ÷ 4 500).
    expect(s.trimestres[0]!.pointsDeDefautEnPlus).toBeCloseTo(0.01, 12);
    expect(s.defautsEnPlus).toBeCloseTo(26_000 * 0.01, 9);
    expect(s.coutDesDefautsEnPlus).toBe(260 * 36);
    expect(s.margePerdueParLaQualite).toBe(auCentime(260 * 0.2 * 3 * 21));
    expect(s.ecartParLaDisponibilite).toBe(6_000);
    expect(s.ecartDeResultat).toBe(6_000 - 9_360 - 3_276);
  });

  it("le défi du laboratoire : ne perdre aucune vente et finir l'année à 100 % coûte au moins 12 000 €, le seuil quatre fois", () => {
    let meilleur = Number.POSITIVE_INFINITY;
    const pas = [0, 1_500, 3_000, 4_500];
    for (const a of pas) for (const b of pas) for (const c of pas) for (const d of pas) {
      const budgets = [a, b, c, d];
      const dispo = disponibilitesDeLAnnee(f, { budgets });
      const ventes = anneeDeProduction(f, { disponibilites: dispo.trimestres }).production;
      if (ventes === 26_000 && dispo.apres === 1) meilleur = Math.min(meilleur, a + b + c + d);
    }
    expect(meilleur).toBe(12_000);
    // Deux façons parmi d'autres : le seuil chaque trimestre, ou 3 000, 1 500, 4 500 et 3 000 €.
    for (const budgets of [[3_000, 3_000, 3_000, 3_000], [3_000, 1_500, 4_500, 3_000]]) {
      const s = entretienDeLAnnee(f, budgets);
      expect(s.ventesPerdues, budgets.join()).toBe(0);
      expect(s.disponibiliteApres).toBe(1);
    }
    // Sans entretien au trimestre 2, le trimestre 4 ne revient pas à 100 % : 95 % − 5 % + 7,5 % = 97,5 %.
    expect(entretienDeLAnnee(f, [3_000, 0, 4_500, 3_000]).ventesPerdues).toBe(7_000 - 6_825);
  });
});

describe("3. la vacance d'un poste", () => {
  it("le seuil de démission : 1 875 € font 93,75 % du marché de N + 1, sous 95 % ; en N, 96,2 %", () => {
    const p = partDuMarche(f);
    expect(p.part).toBe(1_875 / 2_000);
    expect(p.sousLeSeuil).toBe(true);
    expect(partDuMarche(f, { marche: 1_950 }).sousLeSeuil).toBe(false);
    expect(1_875 / 1_950).toBeCloseTo(0.962, 3);
    // Le salaire au seuil : 2 000 € × 95 % = 1 900 € ; 25 € de plus, pour les quatre, un an : 1 704 €.
    expect(p.salaireAuSeuil).toBe(1_900);
    expect(p.augmentationParMois).toBe(25);
    expect(p.coutDeLAugmentationParAn).toBe(25 * 1.42 * 12 * 4);
    expect(p.coutDeLAugmentationParAn).toBe(1_704);
  });

  it("recruté au départ : arrivé le 1er juin, le poste reste vide avril et mai ; 5 700 enceintes d'équipe au trimestre 2 ; 1 300 perdues", () => {
    const d = departDUnSalarie(f);
    expect(d.depart).toEqual({ dernierMois: 3, debutDuRecrutement: 4 });
    expect(d.arrivee).toBe(6);
    expect(d.moisVacants).toBe(2);
    expect(d.equipe.trimestres).toEqual([7_200, 3 * 600 + 3 * 600 + (3 * 600 + 0.5 * 600), 7_200, 7_200]);
    expect(d.trimestres[1]!.goulot).toBe("equipe");
    expect(d.ventesPerdues).toBe(7_000 - 5_700);
    expect(d.margePerdue).toBe(1_300 * 21);
    expect(d.salairesNonVerses).toBe(2 * COUT_EMPLOYEUR);
    expect(d.coutDuDepart).toBe(27_300 + 3_000 - 5_325);
    expect(d.coutDuDepart).toBe(24_975);
    expect(d.leDepartCoutePlus).toBe(true);
  });

  it("recruté dès l'annonce : arrivé le 1er mai, un mois de vacance ; 6 300 au trimestre 2 ; 700 perdues ; le départ coûte 9 937,50 € de moins", () => {
    const d = departDUnSalarie(f, { debutDuRecrutement: 3 });
    expect(d.arrivee).toBe(5);
    expect(d.moisVacants).toBe(1);
    expect(d.equipe.trimestres[1]).toBe(1_800 + (1_800 + 300) + 2_400);
    expect(d.ventesPerdues).toBe(7_000 - 6_300);
    expect(d.margePerdue).toBe(14_700);
    expect(d.salairesNonVerses).toBe(COUT_EMPLOYEUR);
    expect(d.coutDuDepart).toBe(14_700 + 3_000 - 2_662.5);
    expect(departDUnSalarie(f).coutDuDepart - d.coutDuDepart).toBe(9_937.5);
  });

  it("le laboratoire : recruter en janvier évite toute perte ; en février, il manque encore 100 enceintes ; sans remplaçant, 4 000", () => {
    const janvier = departDUnSalarie(f, { debutDuRecrutement: 1 });
    expect(janvier.arrivee).toBe(3);
    expect(janvier.ventesPerdues).toBe(0);
    // Le remplaçant et le partant se croisent en mars : un mois de salaire en plus.
    expect(janvier.salairesNonVerses).toBe(-COUT_EMPLOYEUR);
    const fevrier = departDUnSalarie(f, { debutDuRecrutement: 2 });
    expect(fevrier.equipe.trimestres[1]).toBe(2_100 + 2_400 + 2_400);
    expect(fevrier.ventesPerdues).toBe(100);
    const personne = departDUnSalarie(f, { debutDuRecrutement: null });
    expect(personne.equipe.trimestres).toEqual([7_200, 5_400, 5_400, 5_400]);
    expect(personne.ventesPerdues).toBe(7_000 - 5_400 + (6_200 - 5_400) + (7_000 - 5_400));
    expect(personne.recrutement).toBe(0);
    expect(personne.salairesNonVerses).toBe(9 * COUT_EMPLOYEUR);
    // Sans départ, l'équipe est celle du plan.
    expect(equipeMoisParMois(f, null).trimestres).toEqual([7_200, 7_200, 7_200, 7_200]);
  });
});

describe("4. les sinistres et l'assurance", () => {
  it("le coût d'un aléa qui touche l'outil dépend du trimestre : il ne coûte des ventes que là où l'outil ne suffit plus", () => {
    // La panne : 5 600 enceintes d'outil au trimestre touché.
    const panne = coutDUnAlea(f, "panne");
    expect(panne.parTrimestre.map((x) => x.enceintesPerdues)).toEqual([5_800 - 5_600, 7_000 - 5_600, 6_200 - 5_600, 7_000 - 5_600]);
    expect(panne.enceintesPerdues).toBe((200 + 1_400 + 600 + 1_400) / 4);
    expect(panne.cout).toBe(2_000 + 900 * 21);
    // La panne majeure : 3 500 enceintes d'outil.
    const majeure = coutDUnAlea(f, "panne-majeure");
    expect(majeure.parTrimestre.map((x) => x.enceintesPerdues)).toEqual([2_300, 3_500, 2_700, 3_500]);
    expect(majeure.cout).toBe(12_000 + 3_000 * 21);
    // L'incendie : la ligne à l'arrêt, toutes les ventes du trimestre perdues.
    const incendie = coutDUnAlea(f, "incendie");
    expect(incendie.parTrimestre.map((x) => x.enceintesPerdues)).toEqual(VENTES_N1);
    expect(incendie.cout).toBe(83_500 + (26_000 / 4) * 21);
    expect(incendie.cout).toBe(220_000);
    expect(coutDUnAlea(f, "cyberattaque").cout).toBe(4_000 + 1_000 * 21);
  });

  it("l'espérance des sinistres : la somme des probabilités × coûts, 13 330 € ; le pire, l'incendie, 220 000 €", () => {
    const a = aleasDeLAnnee(f);
    expect(a.aleas.map((x) => x.esperance)).toEqual([0.01 * 220_000, 0.05 * 75_000, 0.2 * 20_900, 0.1 * 6_000, 0.05 * 25_000, 0.05 * 12_000, 0.05 * 15_000].map(auCentime));
    expect(a.esperance).toBe(2_200 + 3_750 + 4_180 + 600 + 1_250 + 600 + 750);
    expect(a.esperance).toBe(13_330);
    expect(a.lePire.code).toBe("incendie");
  });

  it("les formules : la prime, la prime pure, le chargement, le reste à charge espéré, le coût moyen et le pire reste à charge", () => {
    const b = formuleDAssurance(f, "basique");
    expect(b.prime).toBe(6_000);
    expect(b.primePure).toBe(0.01 * (220_000 - 5_000) + 0.1 * (6_000 - 5_000));
    expect(b.chargement).toBe(6_000 - 2_250);
    expect(b.resteEspere).toBe(13_330 - 2_250);
    expect(b.coutMoyen).toBe(6_000 + 11_080);
    expect(b.pireResteACharge).toBe(75_000);
    expect(b.aleaDuPire).toBe("panne-majeure");
    const e = formuleDAssurance(f, "etendue");
    expect(e.prime).toBe(18_000);
    expect(e.primePure).toBe(auCentime(0.01 * 218_000 + 0.1 * 4_000 + 0.05 * 73_000 + 0.2 * 18_900 + 0.05 * 23_000 + 0.05 * 10_000));
    expect(e.primePure).toBe(11_660);
    expect(e.coutMoyen).toBe(18_000 + 13_330 - 11_660);
    expect(e.pireResteACharge).toBe(15_000);
    const t = formuleDAssurance(f, "tous-risques");
    expect(t.primePure).toBe(auCentime(0.01 * 219_000 + 0.1 * 5_000 + 0.05 * 74_000 + 0.2 * 19_900 + 0.05 * 24_000 + 0.05 * 11_000 + 0.05 * 14_000));
    expect(t.coutMoyen).toBe(28_000 + 13_330 - 12_820);
    expect(t.pireResteACharge).toBe(1_000);
    const sans = formuleDAssurance(f, null);
    expect(sans.coutMoyen).toBe(13_330);
    expect(sans.pireResteACharge).toBe(220_000);
    // En moyenne, toute assurance coûte : la prime dépasse toujours ce qu'elle rembourse.
    for (const x of [b, e, t]) expect(x.chargement, x.nom).toBeGreaterThan(0);
    // Un sinistre plus petit que la franchise reste entier à NOVA : l'assureur n'en paie rien.
    const haute = formuleDAssurance(f, "basique", { franchise: 10_000 });
    const degat = haute.lignes.find((l) => l.code === "degat-des-eaux")!;
    expect([degat.resteACharge, degat.rembourse]).toEqual([6_000, 0]);
    expect(haute.primePure).toBe(0.01 * (220_000 - 10_000));
  });

  it("la capacité d'absorption : 105 734,87 € par la trésorerie, 154 225,96 € par les capitaux propres ; l'incendie ne s'encaisse pas, la panne majeure si", () => {
    const c = capaciteDAbsorption(f);
    expect(c.parLaTresorerie).toBe(auCentime(115_734.87 - 10_000));
    expect(c.plancherDesCapitaux).toBe(150_000 / 2);
    expect(c.parLesCapitaux).toBe(auCentime(229_225.96 - 75_000));
    expect(c.capacite).toBe(105_734.87);
    const incendie = encaisser(f, 220_000);
    expect(incendie.tresorerieApres).toBe(auCentime(115_734.87 - 220_000));
    expect(incendie.capitauxApres).toBe(auCentime(229_225.96 - 220_000));
    expect([incendie.parLaTresorerie, incendie.parLesCapitaux, incendie.seEncaisse]).toEqual([false, false, false]);
    expect(encaisser(f, 75_000).seEncaisse).toBe(true);
    // Même la réserve comptée, l'incendie emporterait les capitaux propres sous la moitié du capital.
    const avecLaReserve = capaciteDAbsorption(f, { compterLaReserve: true });
    expect(avecLaReserve.parLaTresorerie).toBe(auCentime(115_734.87 + 155_656 - 10_000));
    expect(avecLaReserve.capacite).toBe(154_225.96);
    expect(encaisser(f, 220_000, { compterLaReserve: true }).parLaTresorerie).toBe(true);
    expect(encaisser(f, 220_000, { compterLaReserve: true }).seEncaisse).toBe(false);
  });

  it("le choix : sans assurance est le moins cher en moyenne, mais son pire ne s'encaisse pas ; la « Basique » est retenue", () => {
    const c = choisirUneAssurance(f);
    expect(c.laMoinsChere).toBe("sans-assurance");
    expect(c.options.map((o) => [o.choix, o.coutMoyen, o.seEncaisse])).toEqual([
      ["sans-assurance", 13_330, false],
      ["basique", 17_080, true],
      ["etendue", 19_670, true],
      ["tous-risques", 28_510, true],
    ]);
    expect(c.retenue).toBe("basique");
    // L'ancienne règle « prime de l'année sous le pire sinistre » dit oui à toutes les formules : elle ne choisit rien.
    for (const x of f.formules) expect(x.primeParTrimestre * 4).toBeLessThan(220_000);
  });

  it("la prime augmentée de 20 % : 1 800 € par trimestre, 18 280 € de coût moyen, la « Basique » reste retenue ; son plafond est de 8 590 € par an", () => {
    expect(1_500 * 1.2).toBe(1_800);
    const c = choisirUneAssurance(f, { primes: { basique: 1_800 } });
    expect(c.options.find((o) => o.code === "basique")!.coutMoyen).toBe(7_200 + 11_080);
    expect(c.retenue).toBe("basique");
    const p = primePlafond(f, "basique");
    expect(p.rivale).toBe("etendue");
    expect(p.primeDeLAnnee).toBe(19_670 - 11_080);
    expect(p.primeParTrimestre).toBe(8_590 / 4);
    // Un euro au-dessus du plafond, l'« Étendue » passe devant.
    expect(choisirUneAssurance(f, { primes: { basique: 2_147.5 + 1 } }).retenue).toBe("etendue");
    // La probabilité d'incendie où la « Basique » rapporterait sa prime : 6 000 ÷ 215 000.
    expect(probabiliteDEquilibre(f, "basique", "incendie").probabilite).toBe(6_000 / 215_000);
  });

  it("croître réduit la capacité d'absorption : la ligne automatisée payée par le compte courant fait retenir l'« Étendue »", () => {
    const c = choisirUneAssurance(f, { compteCourant: auCentime(115_734.87 - 60_000) });
    expect(c.capacite).toBe(auCentime(55_734.87 - 10_000));
    expect(c.options.find((o) => o.code === "basique")!.seEncaisse).toBe(false);
    expect(c.retenue).toBe("etendue");
  });
});

describe("5. les coûts de la qualité", () => {
  it("les quatre budgets, refaits : défauts, détectés, livrés, interne, externe, coût total, ventes perdues", () => {
    const c = courbeDeLaQualite(f);
    const main = [
      [0, 0.08],
      [8_000, 0.05],
      [16_000, 0.035],
      [32_000, 0.02],
    ].map(([b, t]) => {
      const d = 26_000 * t!;
      const detectes = d * 0.8;
      const livres = d - detectes;
      const total = b! + 6_000 + detectes * 20 + livres * 100;
      return [b, Math.round(d), Math.round(detectes), Math.round(livres), Math.round(detectes * 20), Math.round(livres * 100), Math.round(total), Math.round(livres * 3)];
    });
    expect(c.points.map((p) => [p.prevention, p.defauts, p.detectes, p.livres, p.interne, p.externe, p.total, p.ventesPerdues])).toEqual(main);
    expect(main.map((x) => x[6])).toEqual([80_880, 60_800, 54_760, 56_720]);
    expect(main.map((x) => x[7])).toEqual([1_248, 780, 546, 312]);
  });

  it("la défaillance externe pèse plus que l'interne, à chaque budget", () => {
    for (const p of courbeDeLaQualite(f).points) expect(p.externe, String(p.prevention)).toBeGreaterThan(p.interne);
  });

  it("le U : le coût total le plus bas est au budget actuel (16 000 €), mais le meilleur résultat au double (32 000 €)", () => {
    const c = courbeDeLaQualite(f);
    expect(c.leMoinsCher).toBe(16_000);
    expect(c.leMeilleur).toBe(32_000);
    const [, huit, seize, trenteDeux] = c.points;
    expect(huit!.total - seize!.total).toBe(60_800 - 54_760);
    expect(trenteDeux!.total - seize!.total).toBe(56_720 - 54_760);
    // Résultat = (26 000 − ventes perdues) × 21 € − coût total.
    expect(seize!.resultat).toBe((26_000 - 546) * 21 - 54_760);
    expect(trenteDeux!.resultat).toBe((26_000 - 312) * 21 - 56_720);
    expect(trenteDeux!.resultat - seize!.resultat).toBe(2_954);
    // Sans les ventes perdues (la qualité perçue ignorée), les deux lectures désigneraient le même budget.
    expect(courbeDeLaQualite(f, undefined, { ventesPerduesParDefautLivre: 0 }).leMeilleur).toBe(16_000);
  });

  it("entre deux points, la courbe est une droite ; au-delà du double, le taux ne baisse plus", () => {
    expect(tauxDeDefaut(f, 12_000)).toBeCloseTo((0.05 + 0.035) / 2, 12);
    expect(tauxDeDefaut(f, 24_000)).toBeCloseTo((0.035 + 0.02) / 2, 12);
    expect(tauxDeDefaut(f, 40_000)).toBe(0.02);
    expect(coutsDeLaQualite(f, { prevention: 24_000 }).total).toBe(24_000 + 6_000 + 26_000 * 0.0275 * 36);
  });

  it("deux démarches : la standardisation récupère son coût en 1,07 an sur les coûts, le contrôle en ligne en 1,65 an, mais gagne plus sur trois ans", () => {
    const s = demarcheQualite(f, "standardisation");
    // 910 défauts au lieu de 780 : 130 de moins, au coût moyen de 36 € ; 78 ventes perdues de moins.
    expect(s.defautsEvites).toBeCloseTo(26_000 * 0.005, 9);
    expect(s.gainDesCouts).toBe(130 * 36);
    expect(s.gainDesVentes).toBe(130 * 0.2 * 3 * 21);
    expect(s.delaiSurLesCouts).toBe(5_000 / 4_680);
    expect(s.gainNetSurLesCouts).toBe(3 * 4_680 - 5_000);
    const c = demarcheQualite(f, "controle-en-ligne");
    // 910 défauts : 819 retouchés au lieu de 728, 91 livrés au lieu de 182.
    expect(c.avec.detectes).toBeCloseTo(819, 9);
    expect(c.gainDesCouts).toBe((182 - 91) * 100 - (819 - 728) * 20);
    expect(c.gainDesVentes).toBe(91 * 3 * 21);
    expect(c.delaiSurLesCouts).toBe(12_000 / 7_280);
    expect(c.gainNetSurLesCouts).toBe(3 * 7_280 - 12_000);
    expect(s.delaiSurLesCouts!).toBeLessThan(c.delaiSurLesCouts!);
    expect(c.gainNetSurLesCouts).toBeGreaterThan(s.gainNetSurLesCouts);
    expect(c.gainNet).toBe(3 * (7_280 + 5_733) - 12_000);
  });
});

describe("6. la machine en plus", () => {
  it("le poste manuel sur la demande de N + 1 : 1 200 ventes gagnées, 39 700 € de charges, −14 500 € ; il en faudrait 1 891", () => {
    const m = machineEnPlus(f, "poste-manuel");
    expect(m.capaciteOutil).toBe(8_750);
    expect(m.capaciteEquipe).toBe(9_000);
    expect(m.trimestres.map((x) => x.ventesGagnees)).toEqual([0, 7_400 - 7_000, 0, 7_800 - 7_000]);
    expect(m.trimestres.map((x) => x.goulotAvec)).toEqual(["demande", "demande", "demande", "demande"]);
    expect(m.ventesGagnees).toBe(1_200);
    expect(m.margeGagnee).toBe(1_200 * 21);
    expect(m.amortissement).toBe(15_000 / 6);
    expect(m.interets).toBe(15_000 * 0.05);
    expect(m.salaires).toBe(31_950);
    expect(m.charges).toBe(2_500 + 750 + 31_950 + 4_500);
    expect(m.resultatGagne).toBe(25_200 - 39_700);
    expect(m.ventesNecessaires).toBe(Math.ceil(39_700 / 21));
    expect(m.ventesNecessaires).toBe(1_891);
  });

  it("la VAN : −54 116,25 € sur la demande de N + 1, 1 219,62 € à 5 % de plus, 56 555,49 € à 10 % de plus", () => {
    expect(facteurDActualisation(0.08, 6)).toBeCloseTo(A6, 12);
    const flux = (gagnees: number) => (gagnees * 21 - 31_950 - 4_500 - 2_500) * 0.75 + 2_500;
    for (const [h, gagnees, van] of [
      [0, 1_200, -54_116.25],
      [0.05, 770 + 1_190, 1_219.62],
      [0.1, 1_140 + 1_580, 56_555.49],
    ] as const) {
      const m = machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: h });
      expect(m.ventesGagnees, String(h)).toBe(gagnees);
      expect(m.fluxAnnuel).toBe(flux(gagnees));
      expect(m.investissement).toBe(15_000 + 3_000);
      expect(m.van).toBe(auCentime(-18_000 + flux(gagnees) * A6));
      expect(m.van).toBe(van);
    }
    // La demande haussée de 5 % : 6 090, 7 770, 6 510, 8 190.
    expect(machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: 0.05 }).trimestres.map((x) => x.demande)).toEqual([6_090, 7_770, 6_510, 8_190]);
    expect(machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: 0.05 }).delaiDeRecuperation).toBe(18_000 / 4_157.5);
    expect(machineEnPlus(f, "poste-manuel").delaiDeRecuperation).toBeNull();
  });

  it("la VAN change de signe avec la demande : nulle vers 4,9 % de plus pour le poste, 8,7 % pour la ligne automatisée", () => {
    expect(hausseQuiAnnuleLaVan(f, "poste-manuel")).toBe(0.049);
    expect(machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: 0.048 }).van).toBeLessThan(0);
    expect(hausseQuiAnnuleLaVan(f, "ligne-automatisee")).toBe(0.087);
  });

  it("sans l'embauche, le goulot passe à l'équipe : 400 ventes gagnées au lieu de 1 200", () => {
    const m = machineEnPlus(f, "poste-manuel", { embauches: 0 });
    expect(m.capaciteEquipe).toBe(7_200);
    expect(m.ventesGagnees).toBe(2 * (7_200 - 7_000));
    expect(m.trimestres.map((x) => x.goulotAvec)).toEqual(["demande", "equipe", "demande", "equipe"]);
  });

  it("voir plus grand : la ligne automatisée vend autant que le poste tant que la demande plafonne, et ne passe devant qu'au-delà de 18 %", () => {
    const g = machineEnPlus(f, "ligne-automatisee");
    expect(g.capaciteOutil).toBe(10_500);
    expect(g.capaciteEquipe).toBe(7_200 + 540 / 0.15);
    expect(g.ventesGagnees).toBe(1_200);
    expect(g.charges).toBe(10_000 + 3_000 + 31_950 + 6_000);
    expect(machineEnPlus(f, "ligne-automatisee", { hausseDeLaDemande: 0.1 }).ventesGagnees).toBe(2_720);
    const vingtCinq = machineEnPlus(f, "ligne-automatisee", { hausseDeLaDemande: 0.25 });
    expect(vingtCinq.ventesGagnees).toBe(7_250 - 7_000 + (9_250 - 7_000) + (7_750 - 7_000) + (9_750 - 7_000));
    expect(machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: 0.25 }).ventesGagnees).toBe(250 + 1_750 + 750 + 1_750);
    expect(comparerLesMachines(f).meilleure).toBeNull();
    expect(comparerLesMachines(f, { hausseDeLaDemande: 0.1 }).meilleure).toBe("poste-manuel");
    expect(comparerLesMachines(f, { hausseDeLaDemande: 0.18 }).meilleure).toBe("poste-manuel");
    expect(comparerLesMachines(f, { hausseDeLaDemande: 0.2 }).meilleure).toBe("ligne-automatisee");
    expect(comparerLesMachines(f, { hausseDeLaDemande: 0.25 }).meilleure).toBe("ligne-automatisee");
  });

  it("le financement change le résultat, pas la VAN : les intérêts ne sont pas des flux de l'investissement", () => {
    expect(planDEmprunt(15_000, 0.05, 6).map((l) => l.interets)).toEqual([750, 625, 500, 375, 250, 125]);
    const cher = machineEnPlus(f, "poste-manuel", { tauxDeLEmprunt: 0.1, hausseDeLaDemande: 0.05 });
    const base = machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: 0.05 });
    expect(cher.resultatGagne).toBe(base.resultatGagne - 750);
    expect(cher.van).toBe(base.van);
  });
});

describe("la garde voit le modèle et la fiche", () => {
  it("une fiche faussée change les chiffres attendus, partout de la même façon", () => {
    const demande: FicheDeLaCapacite = { ...f, anneeNPlus1: { ...f.anneeNPlus1, demande: [5_800, 6_500, 6_200, 6_500] } };
    // Plus de goulot d'outil : l'entretien sauté ne coûte plus de vente, la machine ne vend rien de plus.
    expect(sansEntretienAuTrimestre(demande).ventesPerdues).toBe(0);
    expect(machineEnPlus(demande, "poste-manuel").ventesGagnees).toBe(0);
    expect(coutDUnAlea(demande, "incendie").cout).toBe(83_500 + ((5_800 + 6_500 + 6_200 + 6_500) / 4) * 21);
    const usure: FicheDeLaCapacite = { ...f, entretien: { ...f.entretien, usureParTrimestre: 0.075 } };
    expect(seuilDEntretien(usure)).toBe(4_500);
    const marge: FicheDeLaCapacite = { ...f, enceinte: { ...f.enceinte, prix: 60 } };
    expect(anneeDeProduction(marge).marge).toBe(26_000 * 22);
    expect(coutDUnAlea(marge, "panne").cout).toBe(2_000 + 900 * 22);
    const capitaux: FicheDeLaCapacite = { ...f, absorption: { ...f.absorption, capitauxPropres: 400_000, compteCourant: 300_000 } };
    // Assez de trésorerie et de capitaux propres : garder tous les risques devient le bon choix.
    expect(choisirUneAssurance(capitaux).retenue).toBe("sans-assurance");
  });
});
