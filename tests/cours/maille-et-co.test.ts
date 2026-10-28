import { describe, expect, it } from "vitest";
import {
  assortiment,
  budgetDuTrimestre,
  chargesFixesDuMois,
  chiffreDAffairesParLesIndicateurs,
  coutQuiGardeLeTauxDeMarque,
  demandeDeLaReference,
  equipeDuMois,
  heuresNecessaires,
  indicateursDuMois,
  leviersDuReassort,
  margeDeLArticle,
  margeDuMois,
  margesDeLaGamme,
  moindresCarres,
  moisDeLaReference,
  moyennesMobilesCentrees,
  planningFaceAuBesoin,
  prevoirLesVentes,
  prixDAchatChez,
  prixHtDuTtc,
  prixQuiGardeLeTauxDeMarque,
  promotion,
  remiseMaximale,
  retirerUneReference,
  seuilDuPointDeVente,
  simulerLeReassort,
  stockDuMois,
  tableauDeBordDuManager,
  tauxDeMargeDuTauxDeMarque,
  tauxDeMarqueDuTauxDeMarge,
  tendanceAnnuelle,
} from "../../src/config/cours/monde/boutique";
import { MAILLE_ET_CO, type FicheDeLaBoutique } from "../../src/config/cours/monde/maille-et-co";

/**
 * LE POINT DE VENTE DU COURS (monde/boutique.ts sur monde/maille-et-co.ts), REFAIT À LA MAIN.
 *
 * Chaque chiffre attendu est recalculé ici sur la fiche, sans les fonctions du modèle ; les valeurs
 * absolues de MAILLE & CO sont épinglées (un changement de la fiche se voit). Le chiffre d'affaires
 * de janvier est le même par toutes les voies ; chaque décomposition retombe sur son total ; la
 * droite des moindres carrés passe par le point moyen et les coefficients saisonniers se compensent.
 */

const f = MAILLE_ET_CO;
const ref = (code: string) => f.gamme.find((r) => r.code === code)!;
const CA_DE_JANVIER = 600 * 55 + 360 * 75 + 90 * 135 + 330 * 35 + 150 * 25;

describe("la fiche de MAILLE & CO tient debout", () => {
  it("les étiquettes : le prix hors taxes × 1,2 refait l'étiquette, au centime", () => {
    expect(f.gamme.map((r) => [r.code, r.prixTtc, r.prixHt, r.coutDAchat, r.autresCoutsVariables])).toEqual([
      ["col-rond", 66, 55, 25, 3.5],
      ["cardigan", 90, 75, 34, 4],
      ["merinos", 162, 135, 56, 5],
      ["echarpe", 42, 35, 14, 2],
      ["bonnet", 30, 25, 9.5, 1.5],
    ]);
    for (const r of f.gamme) {
      expect(r.tauxTva).toBe(0.2);
      expect(Math.round(r.prixHt * 1.2 * 100) / 100).toBe(r.prixTtc);
      expect(prixHtDuTtc(r.prixTtc, r.tauxTva)).toBe(r.prixHt);
    }
  });

  it("les ventes du mois : la plus petite de la demande et du stock disponible ; seul le cardigan manque", () => {
    expect(f.gamme.map((r) => [r.demandeDuMois, r.stockInitial + r.livraisons.reduce((t, l) => t + l.quantite, 0), r.ventesDuMois])).toEqual([
      [600, 400 + 500, 600],
      [384, 120 + 240, 360],
      [90, 70 + 60, 90],
      [330, 350 + 200, 330],
      [150, 220, 150],
    ]);
    for (const r of f.gamme) {
      const disponible = r.stockInitial + r.livraisons.reduce((t, l) => t + l.quantite, 0);
      expect(r.ventesDuMois).toBe(Math.min(r.demandeDuMois, disponible));
      expect(disponible).toBeLessThanOrEqual(r.capaciteDuRayon);
    }
  });

  it("les clientèles refont exactement les ventes de chaque référence, et les entrées le trafic de la semaine type", () => {
    for (const r of f.gamme) expect(f.clienteles.reduce((t, c) => t + c.achats[r.code], 0)).toBe(r.ventesDuMois);
    expect(f.clienteles.map((c) => [c.entrees, c.tickets])).toEqual([[680, 340], [3_160, 600], [8, 8]]);
    // 888 entrées dans la semaine type × 52 ÷ 12 = 3 848 entrées dans le mois.
    const semaine = Object.values(f.affluence).reduce((t, j) => t + j.reduce((u, e) => u + e, 0), 0);
    expect(semaine).toBe(90 + 120 + 150 + 120 + 168 + 240);
    expect(semaine).toBe(888);
    expect((888 * 52) / 12).toBe(3_848);
    expect(f.clienteles.reduce((t, c) => t + c.entrees, 0)).toBe(3_848);
  });

  it("l'équipe : 165 heures de contrat par semaine, que le planning d'aujourd'hui remplit avec les tâches hors vente", () => {
    expect(f.equipe.reduce((t, s) => t + s.heuresParSemaine, 0)).toBe(35 + 35 + 35 + 24 + 24 + 12);
    expect(f.equipe.reduce((t, s) => t + s.brutMensuel, 0)).toBe(2_700 + 2_150 + 2_000 + 1_300 + 1_300 + 650);
    const planifie = Object.values(f.planning).reduce((t, j) => t + j.reduce((u, v) => u + v, 0), 0);
    expect(planifie).toBe(5 * 24 + 25);
    expect(planifie + f.reglesDuPlanning.tachesHorsVente).toBe(165);
    for (const jour of Object.keys(f.affluence)) expect(f.affluence[jour as keyof typeof f.affluence]).toHaveLength(f.ouverture.fin - f.ouverture.debut);
  });

  it("l'historique : la demande des trois années, des ventes jamais au-dessus, plafonnées au trimestre 4", () => {
    expect(f.historique.map((h) => h.demande)).toEqual([4_215, 2_741, 4_959, 12_622, 4_409, 3_014, 5_177, 13_647, 4_772, 3_132, 5_588, 14_440]);
    expect(f.historique.filter((h) => h.ventes < h.demande).map((h) => [h.annee, h.trimestre, h.ventes])).toEqual([
      ["N-3", 4, 11_500],
      ["N-2", 4, 12_000],
      ["N-1", 4, 12_500],
    ]);
    for (const h of f.historique) expect(h.ventes).toBeLessThanOrEqual(h.demande);
  });
});

describe("le chiffre d'affaires de janvier est le même partout : 87 450 €", () => {
  it("par les références, les clientèles, les indicateurs, les marges, l'assortiment, le seuil, l'équipe et le tableau de bord", () => {
    expect(CA_DE_JANVIER).toBe(87_450);
    // Les clientèles, référence par référence, au prix de l'étiquette hors taxes.
    const fideles = 200 * 55 + 220 * 75 + 55 * 135 + 90 * 35 + 30 * 25;
    const passants = 320 * 55 + 140 * 75 + 15 * 135 + 180 * 35 + 80 * 25;
    const comites = 80 * 55 + 0 * 75 + 20 * 135 + 60 * 35 + 40 * 25;
    expect([fideles, passants, comites]).toEqual([38_825, 38_425, 10_200]);
    expect(fideles + passants + comites).toBe(CA_DE_JANVIER);

    const m = indicateursDuMois(f);
    expect(m.clienteles.map((c) => c.chiffreDAffaires)).toEqual([38_825, 38_425, 10_200]);
    expect(m.chiffreDAffaires).toBe(CA_DE_JANVIER);
    expect(m.references.reduce((t, r) => t + r.chiffreDAffaires, 0)).toBe(CA_DE_JANVIER);
    expect(chiffreDAffairesParLesIndicateurs(f).chiffreDAffaires).toBe(CA_DE_JANVIER);
    expect(margesDeLaGamme(f).chiffreDAffaires).toBe(CA_DE_JANVIER);
    expect(assortiment(f).chiffreDAffaires).toBe(CA_DE_JANVIER);
    expect(seuilDuPointDeVente(f).chiffreDAffaires).toBe(CA_DE_JANVIER);
    expect(equipeDuMois(f).chiffreDAffaires).toBe(CA_DE_JANVIER);
    expect(tableauDeBordDuManager(f).chiffreDAffaires).toBe(CA_DE_JANVIER);
  });

  it("les articles du mois sont les mêmes partout : 1 530", () => {
    expect(600 + 360 + 90 + 330 + 150).toBe(1_530);
    expect(595 + 735 + 200).toBe(1_530);
    expect(indicateursDuMois(f).articles).toBe(1_530);
    expect(stockDuMois(f).vendus).toBe(1_530);
    expect(assortiment(f).ventes).toBe(1_530);
  });
});

describe("1. les prix et les marges", () => {
  it("le pull col rond : marge commerciale, taux de marque, taux de marge, coefficients", () => {
    const a = margeDeLArticle(ref("col-rond"));
    expect(a.margeCommerciale).toBe(55 - 25);
    expect(a.tauxDeMarque).toBeCloseTo(30 / 55, 12);
    expect(a.tauxDeMarge).toBeCloseTo(30 / 25, 12);
    expect(a.coefficientHt).toBeCloseTo(55 / 25, 12);
    expect(a.coefficientTtc).toBeCloseTo(66 / 25, 12);
    expect([Math.round(a.tauxDeMarque * 1000) / 10, Math.round(a.tauxDeMarge * 1000) / 10, a.coefficientTtc]).toEqual([54.5, 120, 2.64]);
  });

  it("d'un taux à l'autre, et le prix qui garde le taux de marque", () => {
    expect(tauxDeMargeDuTauxDeMarque(30 / 55)).toBeCloseTo(30 / 25, 12);
    expect(tauxDeMarqueDuTauxDeMarge(1.2)).toBeCloseTo(1.2 / 2.2, 12);
    // L'atelier local, 22 % plus cher : 30,50 €, au même taux de marque.
    expect(prixDAchatChez(f, "col-rond", "atelier-local")).toBe(30.5);
    expect(prixQuiGardeLeTauxDeMarque(30.5, 30 / 55)).toBe(Math.round((30.5 / (25 / 55)) * 100) / 100);
    expect(prixQuiGardeLeTauxDeMarque(30.5, 30 / 55)).toBe(67.1);
    // Les fins de série, 18 % moins chères : 20,50 €.
    expect(prixDAchatChez(f, "col-rond", "fins-de-serie")).toBe(20.5);
    expect(prixDAchatChez(f, "merinos", "fins-de-serie")).toBe(45.92);
  });

  it("le concurrent à 60 € TTC : 50 € HT, 50 % de marque, 681 pulls demandés, le prix d'achat qui garderait la marque", () => {
    expect(f.concurrent.prixTtc / 1.2).toBe(50);
    const m = margeDuMois(f, { prixHt: 50 });
    expect(m.tauxDeMarque).toBe(0.5);
    // 600 × (1 − 1,5 × (50 − 55) ÷ 55) = 681,8 : 681 pulls.
    expect(m.demande).toBe(Math.floor(600 * (1 + 1.5 * (5 / 55))));
    expect(m.demande).toBe(681);
    expect(m.margeDuMois).toBe(681 * 25);
    expect(margeDuMois(f, { prixHt: 50, coutDAchat: 20.5 }).margeDuMois).toBe(681 * 29.5);
    expect(coutQuiGardeLeTauxDeMarque(50, 30 / 55)).toBe(22.73);
  });

  it("la gamme : la marge commerciale et le taux de marque moyen du mois", () => {
    const g = margesDeLaGamme(f);
    const achats = 600 * 25 + 360 * 34 + 90 * 56 + 330 * 14 + 150 * 9.5;
    expect(g.achatsVendus).toBe(achats);
    expect(g.achatsVendus).toBe(38_325);
    expect(g.margeCommerciale).toBe(87_450 - 38_325);
    expect(g.tauxDeMarque).toBeCloseTo(49_125 / 87_450, 12);
    expect(g.references.reduce((t, r) => t + r.chiffreDAffaires - r.achatsVendus, 0)).toBe(g.margeCommerciale);
  });
});

describe("2. les indicateurs du point de vente", () => {
  const m = indicateursDuMois(f);

  it("clientèle par clientèle : transformation, indice de vente, panier", () => {
    const [fideles, passants, comites] = m.clienteles;
    expect([fideles!.articles, passants!.articles, comites!.articles]).toEqual([595, 735, 200]);
    expect(fideles!.tauxDeTransformation).toBe(340 / 680);
    expect(passants!.tauxDeTransformation).toBeCloseTo(600 / 3_160, 12);
    expect(fideles!.indiceDeVente).toBe(595 / 340);
    expect(passants!.panierMoyen).toBeCloseTo(38_425 / 600, 12);
    expect(comites!.panierMoyen).toBe(10_200 / 8);
  });

  it("la boutique : 948 passages pour 3 848 entrées, indice de vente, panier, prix moyen, CA au m²", () => {
    expect(m.entrees).toBe(3_848);
    expect(m.tickets).toBe(340 + 600 + 8);
    expect(m.tauxDeTransformation).toBeCloseTo(948 / 3_848, 12);
    expect(m.indiceDeVente).toBeCloseTo(1_530 / 948, 12);
    expect(m.panierMoyen).toBeCloseTo(87_450 / 948, 12);
    expect(m.prixMoyenDeLArticle).toBeCloseTo(87_450 / 1_530, 12);
    expect(m.chiffreDAffairesAuM2).toBe(87_450 / 120);
    expect([Math.round(m.tauxDeTransformation * 1000) / 10, Math.round(m.panierMoyen * 100) / 100, Math.round(m.indiceDeVente * 100) / 100]).toEqual([24.6, 92.25, 1.61]);
  });

  it("le taux de service n'est pas le taux de transformation : 1 530 servis sur 1 554 demandés", () => {
    expect(m.demande).toBe(600 + 384 + 90 + 330 + 150);
    expect(m.ventesManquees).toBe(384 - 360);
    expect(m.chiffreDAffairesManque).toBe(24 * 75);
    expect(m.tauxDeService).toBeCloseTo(1_530 / 1_554, 12);
  });

  it("le chiffre d'affaires par ses quatre leviers : trafic × transformation × indice de vente × prix moyen", () => {
    const l = chiffreDAffairesParLesIndicateurs(f, { trafic: 3_848 * 1.1 });
    expect(l.chiffreDAffaires).toBe(Math.round(87_450 * 1.1 * 100) / 100);
    const p = chiffreDAffairesParLesIndicateurs(f, { prixMoyenDeLArticle: 60 });
    expect(p.chiffreDAffaires).toBe(1_530 * 60);
  });
});

describe("3. la demande, les ventes, la promotion", () => {
  it("la demande est une droite en prix et en remise, à l'unité inférieure", () => {
    expect(demandeDeLaReference(f, "col-rond")).toBe(600);
    expect(demandeDeLaReference(f, "col-rond", { remise: 0.1 })).toBe(600 * 1.3);
    expect(demandeDeLaReference(f, "col-rond", { remise: 0.05 })).toBe(690);
    expect(demandeDeLaReference(f, "cardigan", { prixHt: 70 })).toBe(Math.floor(384 * (1 + 1.5 * (5 / 75))));
    expect(demandeDeLaReference(f, "bonnet", { prixHt: 60 })).toBe(0);
  });

  it("ventes = la plus petite de la demande et du stock en rayon, borné par la capacité du rayon", () => {
    const m = moisDeLaReference(f, "cardigan");
    expect([m.demande, m.stockEnRayon, m.ventes, m.ventesManquees]).toEqual([384, 360, 360, 24]);
    expect(moisDeLaReference(f, "col-rond", { stockEnRayon: 2_000 }).stockEnRayon).toBe(900);
  });

  it("la promotion de février : 10 % de remise, 700 pulls en rayon, la demande suit mais l'offre non", () => {
    const p = promotion(f);
    expect(p.sans.marge).toBe(600 * (55 - 28.5));
    expect(p.avec.prixPaye).toBe(55 * 0.9);
    expect(p.avec.margeUnitaire).toBe(49.5 - 28.5);
    expect(p.baisseDeLaMargeUnitaire).toBeCloseTo((26.5 - 21) / 26.5, 12);
    // 15 900 € ÷ 21 € = 757,1 : 758 pulls.
    expect(p.volumeNecessaire).toBe(Math.ceil(15_900 / 21));
    expect(p.volumeNecessaire).toBe(758);
    expect(p.hausseNecessaire).toBeCloseTo(758 / 600 - 1, 12);
    expect([p.avec.demande, p.avec.ventes, p.avec.ventesManquees]).toEqual([780, 700, 80]);
    expect(p.avec.marge).toBe(700 * 21);
    expect(p.gain).toBe(14_700 - 15_900);
    expect([p.laDemandeSuit, p.lOffreSuit]).toEqual([true, false]);
  });

  it("avec 900 pulls en rayon, la même promotion paie ; à 15 % de remise, elle ne paie plus", () => {
    const p = promotion(f, { stockEnRayon: 900 });
    expect([p.avec.ventes, p.gain, p.lOffreSuit]).toEqual([780, 780 * 21 - 15_900, true]);
    expect(p.gain).toBe(480);
    const q = promotion(f, { stockEnRayon: 900, remise: 0.15 });
    expect(q.avec.ventes).toBe(870);
    expect(q.gain).toBe(Math.round((870 * (55 * 0.85 - 28.5) - 15_900) * 100) / 100);
    expect(q.gain).toBe(-22.5);
  });

  it("jusqu'où remiser pour 15 % de ventes en plus : 690 pulls, 23,05 € de marge, 51,55 €, 6,27 %", () => {
    const r = remiseMaximale(f, "col-rond", 0.15);
    expect(r.volumeAttendu).toBe(690);
    // 15 900 ÷ 690 = 23,043… : la marge à garder s'arrondit au centime supérieur, sinon le plancher la perd.
    expect(r.margeUnitaireAGarder).toBe(23.05);
    expect(r.prixPlancher).toBe(28.5 + 23.05);
    expect(690 * (r.prixPlancher - 28.5)).toBeGreaterThanOrEqual(15_900);
    expect(r.remise).toBeCloseTo(1 - 51.55 / 55, 12);
  });
});

describe("4. le stock", () => {
  const s = stockDuMois(f);

  it("en valeur : stock initial, achats, stock final, coût d'achat des vendues, stock moyen, rotation", () => {
    const initial = 400 * 25 + 120 * 34 + 70 * 56 + 350 * 14 + 220 * 9.5;
    const achats = 500 * 25 + 240 * 34 + 60 * 56 + 200 * 14;
    const final = 300 * 25 + 0 * 34 + 40 * 56 + 220 * 14 + 70 * 9.5;
    expect([s.valeurInitiale, s.achats, s.valeurFinale]).toEqual([initial, achats, final]);
    expect([initial, achats, final]).toEqual([24_990, 26_820, 13_485]);
    expect(s.coutDAchatDesVendues).toBe(initial + achats - final);
    // Le coût des vendues est celui des ventes au prix d'achat : la décomposition retombe juste.
    expect(s.coutDAchatDesVendues).toBe(38_325);
    expect(s.stockMoyen).toBe((24_990 + 13_485) / 2);
    expect(s.rotation).toBeCloseTo(38_325 / 19_237.5, 12);
    expect(s.dureeDeStockage).toBeCloseTo(30 / (38_325 / 19_237.5), 12);
    expect(Math.round(s.dureeDeStockage)).toBe(15);
    expect(s.couverture).toBeCloseTo(630 / (1_530 / 30), 12);
  });

  it("qui finance le stock : le façonnier, payé à 45 jours ; avec les fins de série, payées comptant, la boutique", () => {
    expect(s.joursFinancesParLeFournisseur).toBeCloseTo(45 - s.dureeDeStockage, 12);
    expect(stockDuMois(f, "fins-de-serie").joursFinancesParLeFournisseur).toBeCloseTo(-s.dureeDeStockage, 12);
  });

  it("le stock de sécurité (7 jours de ventes) et le point de commande (21 jours de livraison en plus)", () => {
    expect(s.references.map((r) => [r.ventesParJour, r.stockDeSecurite, r.pointDeCommande])).toEqual([
      [20, 140, 20 * 21 + 140],
      [12, 84, 12 * 21 + 84],
      [3, 21, 3 * 21 + 21],
      [11, 77, 11 * 21 + 77],
      [5, 35, 5 * 21 + 35],
    ]);
    // Le cardigan finit le mois à zéro : le point de commande, 336, était passé dès le 1er janvier.
    expect(s.references[1]!.final).toBe(0);
  });

  it("le réassort jour par jour du col rond : le stock de sécurité absorbe 7 jours de retard, pas 8", () => {
    const l = leviersDuReassort(f);
    expect(l).toEqual({ demandeParJour: 20, stockInitial: 900, pointDeCommande: 560, quantiteCommandee: 600, delaiDeLivraison: 21, retard: 0, jours: 90 });
    // Sans retard : commande le 17 au soir (900 − 17 × 20 = 560), livrée le 39 au matin quand il
    // reste 140 pulls, le stock de sécurité. Aucune rupture.
    expect(simulerLeReassort(l).ventesManquees).toBe(0);
    // 7 jours de retard : livrée le 46, le stock est tombé à 0 le 45 au soir (900 ÷ 20). Aucune rupture.
    expect(simulerLeReassort({ ...l, retard: 7 }).ventesManquees).toBe(0);
    // 8 jours : rupture le 46 ; livrée le 47 (600), recommande le 48 au soir (560), livrée le 78 ;
    // 560 pulls tiennent 28 jours, du 49 au 76 : rupture le 77. Deux jours, 40 pulls manqués.
    const huit = simulerLeReassort({ ...l, retard: 8 });
    expect([huit.ventesManquees, huit.joursDeRupture, huit.commandes]).toEqual([2 * 20, 2, 3]);
    // Sans stock de sécurité (point de commande 420), 7 jours de retard font rompre.
    expect(simulerLeReassort({ ...l, retard: 7, pointDeCommande: 20 * 21 }).ventesManquees).toBeGreaterThan(0);
  });
});

describe("5. la prévision des ventes", () => {
  const y = [4_215, 2_741, 4_959, 12_622, 4_409, 3_014, 5_177, 13_647, 4_772, 3_132, 5_588, 14_440];
  const mmc = (t: number) => (y[t - 3]! / 2 + y[t - 2]! + y[t - 1]! + y[t]! + y[t + 1]! / 2) / 4;

  it("les moyennes mobiles centrées, du trimestre 3 au trimestre 10", () => {
    const m = moyennesMobilesCentrees(y);
    expect(m.slice(0, 2)).toEqual([null, null]);
    expect(m.slice(10)).toEqual([null, null]);
    for (let t = 3; t <= 10; t++) expect(m[t - 1]).toBeCloseTo(mmc(t), 9);
    expect(mmc(3)).toBe((4_215 / 2 + 2_741 + 4_959 + 12_622 + 4_409 / 2) / 4);
    expect(mmc(3)).toBe(6_158.5);
  });

  it("la droite des moindres carrés sur les moyennes mobiles : sa pente, son ordonnée, le point moyen", () => {
    const xs = [3, 4, 5, 6, 7, 8, 9, 10];
    const ys = xs.map(mmc);
    const xMoyen = 52 / 8;
    const yMoyen = ys.reduce((t, v) => t + v, 0) / 8;
    const a = xs.reduce((t, x, i) => t + (x - xMoyen) * (ys[i]! - yMoyen), 0) / xs.reduce((t, x) => t + (x - xMoyen) ** 2, 0);
    const p = prevoirLesVentes(f);
    expect(p.droite.xMoyen).toBe(6.5);
    expect(p.droite.a).toBeCloseTo(a, 9);
    expect(p.droite.b).toBeCloseTo(yMoyen - a * 6.5, 9);
    // Elle passe par le point moyen.
    expect(p.droite.a * p.droite.xMoyen + p.droite.b).toBeCloseTo(p.droite.yMoyen, 9);
    expect(Math.round(p.droite.a * 100) / 100).toBe(107.15);
    expect(Math.round(p.droite.b * 100) / 100).toBe(5_800.88);
  });

  it("les coefficients saisonniers : moyenne des rapports à la tendance, corrigés, qui se compensent sur l'année", () => {
    const p = prevoirLesVentes(f);
    const tendance = (t: number) => p.droite.a * t + p.droite.b;
    const brut = [1, 2, 3, 4].map((q) => (y[q - 1]! / tendance(q) + y[q + 3]! / tendance(q + 4) + y[q + 7]! / tendance(q + 8)) / 3);
    brut.forEach((c, i) => expect(p.coefficientsBruts[i]).toBeCloseTo(c, 12));
    const total = brut.reduce((t, c) => t + c, 0);
    expect(p.sommeBrute).toBeCloseTo(total, 12);
    p.coefficients.forEach((c, i) => expect(c).toBeCloseTo((brut[i]! * 4) / total, 12));
    expect(p.coefficients.reduce((t, c) => t + c, 0)).toBeCloseTo(4, 12);
    expect(p.coefficients.map((c) => Math.round(c * 100) / 100)).toEqual([0.7, 0.46, 0.8, 2.04]);
  });

  it("la prévision de N, et le budget qui la reprend à la dizaine : 5 070 articles au trimestre 1", () => {
    const p = prevoirLesVentes(f);
    p.previsions.forEach((x, k) => expect(x.prevision).toBeCloseTo((p.droite.a * (13 + k) + p.droite.b) * p.coefficients[k]!, 9));
    expect(Math.round(p.previsions[0]!.prevision)).toBe(5_067);
    expect(Math.round(p.previsions[0]!.prevision / 10) * 10).toBe(1_990 + 1_190 + 300 + 1_090 + 500);
    expect(Math.round(p.totalPrevu)).toBe(29_651);
  });

  it("les trimestres bruts : la pente monte à 405, près de quatre fois la tendance, parce que Noël tombe en fin d'année", () => {
    const xMoyen = 6.5;
    const yMoyen = y.reduce((t, v) => t + v, 0) / 12;
    const a = y.reduce((t, v, i) => t + (i + 1 - xMoyen) * (v - yMoyen), 0) / 143;
    const brute = prevoirLesVentes(f, "trimestres-bruts");
    expect(brute.droite.a).toBeCloseTo(a, 9);
    expect(Math.round(a * 100) / 100).toBe(405.37);
    expect(brute.droite.a).toBeGreaterThan(3 * prevoirLesVentes(f).droite.a);
    // Par la droite brute, la prévision du trimestre 1 dépasse celle des moyennes mobiles de 2 000 articles.
    expect(brute.previsions[0]!.prevision - prevoirLesVentes(f).previsions[0]!.prevision).toBeGreaterThan(2_000);
  });

  it("la tendance annuelle : trois totaux, une droite qui passe par (2 ; moyenne), et elle rejoint les moyennes mobiles", () => {
    const totaux = [4_215 + 2_741 + 4_959 + 12_622, 4_409 + 3_014 + 5_177 + 13_647, 4_772 + 3_132 + 5_588 + 14_440];
    const t = tendanceAnnuelle(f);
    expect(t.totaux).toEqual(totaux);
    expect(t.totaux).toEqual([24_537, 26_247, 27_932]);
    expect(t.droite.a).toBe((27_932 - 24_537) / 2);
    expect(t.droite.a * 2 + t.droite.b).toBeCloseTo((24_537 + 26_247 + 27_932) / 3, 9);
    expect(t.anneeN).toBeCloseTo(78_716 / 3 + 2 * 1_697.5, 9);
    expect(t.coefficients.reduce((s, c) => s + c, 0)).toBeCloseTo(4, 12);
    expect(Math.abs(t.anneeN - prevoirLesVentes(f).totalPrevu)).toBeLessThan(20);
  });

  it("moindresCarres : une droite exacte se retrouve exactement", () => {
    const d = moindresCarres([1, 2, 3, 4].map((x) => ({ x, y: 3 * x + 7 })));
    expect([d.a, d.b, d.en(10)]).toEqual([3, 7, 37]);
  });
});

describe("6. le budget du trimestre 1", () => {
  const b = budgetDuTrimestre(f);

  it("quantités à acheter = ventes prévues + stock final voulu − stock initial", () => {
    expect(b.references.map((r) => r.achats)).toEqual([1_990 + 400 - 400, 1_190 + 250 - 120, 300 + 60 - 70, 1_090 + 250 - 350, 500 + 100 - 220]);
    expect(b.achats).toBe(1_990 + 1_320 + 290 + 990 + 380);
    expect(b.ventes).toBe(5_070);
  });

  it("ventes, achats, coût des vendues et marge commerciale budgétés, et ce que la caisse paie à 45 jours sur 90", () => {
    const ventesHt = 1_990 * 55 + 1_190 * 75 + 300 * 135 + 1_090 * 35 + 500 * 25;
    const achatsHt = 1_990 * 25 + 1_320 * 34 + 290 * 56 + 990 * 14 + 380 * 9.5;
    const camv = 1_990 * 25 + 1_190 * 34 + 300 * 56 + 1_090 * 14 + 500 * 9.5;
    expect([b.ventesHt, b.achatsHt, b.coutDAchatDesVendues]).toEqual([ventesHt, achatsHt, camv]);
    expect([ventesHt, achatsHt, camv]).toEqual([289_850, 128_340, 127_020]);
    expect(b.ventesTtc).toBe(289_850 * 1.2);
    expect(b.margeCommerciale).toBe(289_850 - 127_020);
    // Le coût des vendues : stock initial + achats − stock final, en valeur.
    expect(b.coutDAchatDesVendues).toBe(24_990 + 128_340 - (400 * 25 + 250 * 34 + 60 * 56 + 250 * 14 + 100 * 9.5));
    expect(b.achatsTtc).toBe(128_340 * 1.2);
    expect(b.partPayee).toBe(1 - 45 / 90);
    expect(b.decaisse).toBe(154_008 / 2);
    expect(b.decaisse + b.detteFournisseur).toBe(b.achatsTtc);
    expect(b.objectifDuMois).toBe(Math.round((289_850 / 3) * 100) / 100);
  });

  it("chez les fins de série, payées comptant : tout sort de la caisse dans le trimestre", () => {
    const c = budgetDuTrimestre(f, { fournisseur: "fins-de-serie" });
    expect(c.partPayee).toBe(1);
    expect(c.detteFournisseur).toBe(0);
    expect(c.references[0]!.achatsHt).toBe(1_990 * 20.5);
  });
});

describe("7. le seuil de rentabilité du point de vente", () => {
  const s = seuilDuPointDeVente(f);
  const cv = 600 * 28.5 + 360 * 38 + 90 * 61 + 330 * 16 + 150 * 11;

  it("les charges fixes du mois : loyer, personnel, publicité, entretien, usure", () => {
    expect(chargesFixesDuMois(f).total).toBe(13_600 + 14_342 + 1_500 + 920 + 333);
    expect(chargesFixesDuMois(f).total).toBe(30_695);
  });

  it("marge sur coût variable, seuil, marge et indice de sécurité, point mort, résultat", () => {
    expect(cv).toBe(43_200);
    expect(s.marge).toBe(87_450 - 43_200);
    expect(s.tauxDeMarge).toBeCloseTo(44_250 / 87_450, 12);
    expect(s.seuil).toBe(Math.round(((30_695 * 87_450) / 44_250) * 100) / 100);
    expect(s.seuil).toBe(60_661.64);
    expect(s.margeDeSecurite).toBe(87_450 - 60_661.64);
    expect(s.indiceDeSecurite).toBeCloseTo(26_788.36 / 87_450, 12);
    expect(s.pointMort).toBe(Math.ceil((60_661.64 / 87_450) * 30));
    expect(s.pointMort).toBe(21);
    expect(s.resultat).toBe(44_250 - 30_695);
    expect(s.ticketsAuSeuil).toBe(Math.ceil(60_661.64 / (87_450 / 948)));
  });

  it("fermé 5 jours pour travaux : le seuil ne bouge pas, le point mort recule au 26", () => {
    const t = seuilDuPointDeVente(f, { joursDeFermeture: 5 });
    expect(t.chiffreDAffaires).toBe((87_450 * 25) / 30);
    expect(t.marge).toBe((44_250 * 25) / 30);
    expect(t.resultat).toBe(36_875 - 30_695);
    expect(t.seuil).toBe(s.seuil);
    expect(t.pointMort).toBe(5 + 21);
  });

  it("les jours de fermeture qu'elle supporte : 9 (le 10e la fait perdre)", () => {
    expect(seuilDuPointDeVente(f, { joursDeFermeture: 9 }).resultat).toBe((44_250 * 21) / 30 - 30_695);
    expect(seuilDuPointDeVente(f, { joursDeFermeture: 9 }).resultat).toBeGreaterThanOrEqual(0);
    expect(seuilDuPointDeVente(f, { joursDeFermeture: 10 }).resultat).toBeLessThan(0);
  });

  it("le panier plancher : 64 € aux 948 passages en caisse", () => {
    expect(s.panierPlancher).toBeCloseTo(30_695 / (44_250 / 87_450) / 948, 9);
    expect(Math.ceil(s.panierPlancher)).toBe(64);
    expect(seuilDuPointDeVente(f, { panierMoyen: 64 }).resultat).toBeGreaterThanOrEqual(0);
    expect(seuilDuPointDeVente(f, { panierMoyen: 63 }).resultat).toBeLessThan(0);
  });
});

describe("8. l'équipe et le planning", () => {
  it("les heures du mois, le coût et le taux horaire chargé de l'équipe", () => {
    const e = equipeDuMois(f);
    expect(e.salaries.map((s) => s.heuresDuMois)).toEqual([151.67, 151.67, 151.67, 104, 104, 52]);
    expect(e.heuresDuMois).toBe(3 * 151.67 + 2 * 104 + 52);
    expect(e.brut).toBe(10_100);
    expect(e.cout).toBe(10_100 * 1.42);
    expect(e.cout).toBe(14_342);
    expect(e.tauxHoraireCharge).toBeCloseTo(14_342 / 715.01, 12);
    expect(e.partDuPersonnel).toBeCloseTo(14_342 / 87_450, 12);
    expect(e.chiffreDAffairesParHeure).toBeCloseTo(87_450 / 715.01, 12);
    expect(e.salaries[0]!.tauxHoraireCharge).toBeCloseTo((2_700 * 1.42) / 151.67, 12);
  });

  it("les vendeurs nécessaires, créneau par créneau : au moins 2, et un pour 8 entrées", () => {
    const h = heuresNecessaires(f);
    const vendeurs = (e: number) => Math.max(2, Math.ceil(e / 8));
    expect(h.jours.map((j) => j.vendeurs)).toEqual(Object.values(f.affluence).map((j) => j.map(vendeurs)));
    expect(h.jours.find((j) => j.jour === "samedi")!.vendeurs).toEqual([2, 3, 5, 4, 3, 3, 4, 5, 4]);
    expect(h.jours.map((j) => j.heures)).toEqual([18, 20, 23, 20, 26, 33]);
    expect(h.heuresDeVente).toBe(140);
    expect(h.parSemaine).toBe(140 + 20);
    expect(h.parMois).toBe(Math.round(((160 * 52) / 12) * 100) / 100);
    expect(h.cout).toBe(Math.round(693.33 * (14_342 / 715.01) * 100) / 100);
  });

  it("le planning d'aujourd'hui : 145 heures de vente pour 140 nécessaires, mais 11 heures manquent le vendredi et le samedi", () => {
    const p = planningFaceAuBesoin(f);
    expect(p.heuresPlanifiees).toBe(145);
    expect(p.heuresDuPlanning).toBe(165);
    expect(p.jours.map((j) => [j.jour, j.manquantes, j.enTrop])).toEqual([
      ["lundi", 0, 24 - 18],
      ["mardi", 0, 4],
      ["mercredi", 1, 2],
      ["jeudi", 0, 4],
      ["vendredi", 2, 0],
      ["samedi", 8, 0],
    ]);
    expect(p.heuresEnTrop - p.heuresManquantes).toBe(145 - 140);
    // Le samedi : 2 de moins à midi et de 17 h à 19 h, 1 de moins de 13 h à 14 h et de 16 h à 17 h.
    expect(p.jours[5]!.ecarts).toEqual([0, 0, 3 - 5, 3 - 4, 0, 0, 3 - 4, 3 - 5, 2 - 4]);
  });

  it("une affluence plus forte, ou un vendeur pour 10 entrées, change le besoin", () => {
    expect(heuresNecessaires(f, { entreesParVendeur: 10 }).heuresDeVente).toBeLessThan(140);
    expect(heuresNecessaires(f, { affluence: 1.25 }).heuresDeVente).toBeGreaterThan(140);
  });
});

describe("9. l'assortiment", () => {
  const a = assortiment(f);

  it("la marge de chaque référence, et la marge du mois qui retombe sur le total", () => {
    expect(a.references.map((r) => r.marge)).toEqual([600 * 26.5, 360 * 37, 90 * 74, 330 * 19, 150 * 14]);
    expect(a.marge).toBe(15_900 + 13_320 + 6_660 + 6_270 + 2_100);
    expect(a.marge).toBe(87_450 - 43_200);
    expect(a.references.reduce((t, r) => t + r.partDeLaMarge, 0)).toBeCloseTo(1, 12);
  });

  it("le col rond : 37,7 % du chiffre d'affaires, 35,9 % de la marge", () => {
    expect(a.references[0]!.partDuChiffreDAffaires).toBeCloseTo(33_000 / 87_450, 12);
    expect(a.references[0]!.partDeLaMarge).toBeCloseTo(15_900 / 44_250, 12);
  });

  it("les familles, sur les moyennes pondérées : 306 articles, 28,92 € de marge par article", () => {
    expect(a.ventesMoyennes).toBe(1_530 / 5);
    expect(a.margeUnitaireMoyenne).toBeCloseTo(44_250 / 1_530, 12);
    expect(a.references.map((r) => [r.code, r.famille])).toEqual([
      ["col-rond", "volume"],
      ["cardigan", "locomotive"],
      ["merinos", "marge"],
      ["echarpe", "volume"],
      ["bonnet", "a-revoir"],
    ]);
  });

  it("retirer le bonnet avec 30 % de report : 45 articles à 30,54 €, la marge perd 725,54 €", () => {
    const r = retirerUneReference(f, "bonnet", 0.3);
    expect(r.margeDesAutres).toBe(44_250 - 2_100);
    expect(r.ventesDesAutres).toBe(1_530 - 150);
    expect(r.margeUnitaireDesAutres).toBeCloseTo(42_150 / 1_380, 12);
    expect(r.unitesReportees).toBe(45);
    expect(r.margeRecuperee).toBe(Math.round(((45 * 42_150) / 1_380) * 100) / 100);
    expect(r.effetNet).toBe(Math.round((1_374.46 - 2_100) * 100) / 100);
    // Il faudrait 2 100 ÷ (150 × 30,54 €) = 45,8 % de report pour que le retrait ne coûte rien.
    expect(retirerUneReference(f, "bonnet", 0.46).effetNet).toBeGreaterThan(0);
    expect(retirerUneReference(f, "bonnet", 0.45).effetNet).toBeLessThan(0);
    // 150 × 0,57 vaut 85,4999… en virgule flottante : le report compte 86 articles, pas 85.
    expect(retirerUneReference(f, "bonnet", 0.57).unitesReportees).toBe(86);
  });
});

describe("10. le tableau de bord du manager", () => {
  const t = tableauDeBordDuManager(f);
  const v = (code: string) => t.indicateurs.find((i) => i.code === code)!;

  it("les indicateurs du mois, face à janvier N − 1 et à l'objectif", () => {
    expect(t.objectif).toBe(96_616.67);
    expect(v("realisationDeLObjectif").valeur).toBeCloseTo(87_450 / 96_616.67, 12);
    expect(v("evolutionDuTrafic").valeur).toBeCloseTo(3_848 / 4_160 - 1, 12);
    expect(v("tauxDeTransformation").n1).toBe(1_000 / 4_160);
    expect(v("panierMoyen").n1).toBe(89_600 / 1_000);
    expect(v("tauxDeService").n1).toBe(1_600 / 1_610);
    expect(t.evolutionDuChiffreDAffaires).toBeCloseTo(87_450 / 89_600 - 1, 12);
    expect(v("partDuPersonnel").valeur).toBeCloseTo(14_342 / 87_450, 12);
    expect(v("dureeDeStockage").valeur).toBeCloseTo(stockDuMois(f).dureeDeStockage, 12);
  });

  it("deux voyants rouges : l'objectif manqué, et le trafic qui l'explique ; le reste est vert", () => {
    expect(t.voyantsAllumes).toEqual(["realisationDeLObjectif", "evolutionDuTrafic"]);
    // La transformation et le panier montent : ceux qui entrent achètent plus, ils sont moins nombreux.
    expect(v("tauxDeTransformation").valeur).toBeGreaterThan(v("tauxDeTransformation").n1!);
    expect(v("panierMoyen").valeur).toBeGreaterThan(v("panierMoyen").n1!);
  });

  it("le trafic de janvier N − 1 éteint les deux voyants", () => {
    const u = tableauDeBordDuManager(f, { trafic: 4_160 });
    expect(u.chiffreDAffaires).toBe(Math.round(((87_450 * 4_160) / 3_848) * 100) / 100);
    expect(u.voyantsAllumes).toEqual([]);
  });
});

describe("la garde voit le modèle et la fiche", () => {
  it("une fiche faussée change les chiffres attendus, partout de la même façon", () => {
    const faussee: FicheDeLaBoutique = { ...f, gamme: f.gamme.map((r) => (r.code === "cardigan" ? { ...r, prixHt: 74, prixTtc: 88.8 } : r)) };
    const ca = 87_450 - 360;
    expect(indicateursDuMois(faussee).chiffreDAffaires).toBe(ca);
    expect(margesDeLaGamme(faussee).chiffreDAffaires).toBe(ca);
    expect(assortiment(faussee).chiffreDAffaires).toBe(ca);
    expect(seuilDuPointDeVente(faussee).chiffreDAffaires).toBe(ca);
    expect(chiffreDAffairesParLesIndicateurs(faussee).chiffreDAffaires).toBe(ca);
    expect(promotion({ ...f, elasticiteALaRemise: 2 }).avec.demande).toBe(600 * 1.2);
  });
});
