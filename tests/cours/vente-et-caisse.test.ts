import { describe, expect, it } from "vitest";
import { moisDeLaReference } from "../../src/config/cours/monde/boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import {
  DECEMBRE_N_MOINS_1,
  anneeDuFichier,
  articleAConseiller,
  articlesDuMois,
  bonDuFaconnier,
  campagne,
  carteDeFidelite,
  cartonsQuiPeuventManquer,
  clientsAvantLeCoffre,
  commandeDeFevrier,
  coutDUnVendeurEnPlus,
  decembreFaceAJanvier,
  enCoupures,
  etiquettesDuRayon,
  fermeturePourTravaux,
  indicePourLObjectif,
  journeeAvecLeCoffre,
  journeeEnCaisse,
  livraisonAvecDeuxEcarts,
  meilleureCampagne,
  moisALIndice,
  moisDuFichier,
  panierDuMois,
  passagesNecessaires,
  passantsDeJanvier,
  progressionAtteinte,
  promotionDeFevrier,
  promotionDuMois,
  rayonDuMois,
  receptionDuFaconnier,
  remiseQuiGardeLeChiffre,
  remiseQuiPaieSansRupture,
  reservePourTousLesServir,
  saisieDeLaReception,
  suiviDeLAnnee,
  suiviDuTrimestre,
  tauxQuiGardeLeFichier,
  ticketDuClient,
  ventesPourLeVendeur,
  ventesPourPayer,
} from "../../src/config/cours/monde/vente-et-caisse";

/**
 * LA VENTE ET LA CAISSE DE MAILLE & CO (monde/vente-et-caisse.ts), REFAITES À LA MAIN.
 *
 * Chaque chiffre attendu est recalculé ici sur la fiche de la boutique (monde/maille-et-co.ts), sans
 * les fonctions du modèle : janvier, 1 530 articles, 948 passages en caisse, 87 450 € hors taxes ;
 * les clientes fidèles (340 passages, 38 825 €), les passants (3 160 entrées, 600 passages,
 * 38 425 €), les comités d'entreprise (8 commandes, 10 200 €, facturés à 45 jours). Les coûts
 * variables d'un article : 28,50 €, 38 €, 61 €, 16 € et 11 €.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const CV = { "col-rond": 25 + 3.5, cardigan: 34 + 4, merinos: 56 + 5, echarpe: 14 + 2, bonnet: 9.5 + 1.5 };
const PRIX = { "col-rond": 55, cardigan: 75, merinos: 135, echarpe: 35, bonnet: 25 };
const ventes = { "col-rond": 600, cardigan: 360, merinos: 90, echarpe: 330, bonnet: 150 };
const somme = (q: Record<string, number>, p: Record<string, number>) => Object.entries(q).reduce((t, [k, n]) => t + n * p[k]!, 0);

describe("les étiquettes et la promotion", () => {
  it("le prix HT × 1,2 tombe sur une étiquette ronde", () => {
    expect(etiquettesDuRayon(f).map((e) => [e.code, e.tva, e.affiche])).toEqual([
      ["col-rond", 11, 66],
      ["cardigan", 15, 90],
      ["merinos", 27, 162],
      ["echarpe", 7, 42],
      ["bonnet", 5, 30],
    ]);
  });

  it("la promotion de février : 10 % sur 66 €, 780 pulls demandés pour 700 en rayon", () => {
    const p = promotionDeFevrier(f);
    expect([p.montantDeLaRemise, p.nouveauPrix, p.prixHtPromo]).toEqual([6.6, 59.4, 49.5]);
    // 600 × (1 + 3 × 0,10) = 780 ; 700 vendus ; 700 × 49,50 = 34 650 € contre 600 × 55 = 33 000 €.
    expect([p.avec.demande, p.avec.vendus, p.avec.manques, p.avec.chiffreDAffaires]).toEqual([780, 700, 80, 34_650]);
    expect([p.sans.vendus, p.sans.chiffreDAffaires, p.ventesEnPlus, p.chiffreEnPlus, p.bilan]).toEqual([600, 33_000, 100, 1_650, "plus-et-plus"]);
    // Le même mois que le modèle de la boutique.
    const m = moisDeLaReference(f, "col-rond", { remise: 0.1, stockEnRayon: 700 });
    expect([m.demande, m.ventes, m.chiffreDAffaires]).toEqual([p.avec.demande, p.avec.vendus, p.avec.chiffreDAffaires]);
  });

  it("la remise la plus forte qui garde 33 000 € : 14 % (700 × 47,30 = 33 110 €) ; 15 % donne 32 725 €", () => {
    expect(remiseQuiGardeLeChiffre(f)).toBe(14);
    expect(promotionDeFevrier(f, 0.14).avec.chiffreDAffaires).toBe(c(700 * 55 * 0.86));
    expect(promotionDeFevrier(f, 0.15).avec.chiffreDAffaires).toBe(32_725);
  });

  it("de 5 en 5 %, seule une remise de 5 % fait mieux sans rupture : 690 pulls à 52,25 €", () => {
    expect([0, 5, 10, 15, 20, 25, 30].filter((r) => remiseQuiPaieSansRupture(f, r / 100))).toEqual([5]);
    expect(promotionDeFevrier(f, 0.05).avec.chiffreDAffaires).toBe(690 * 52.25);
  });

  it("la promotion de Noël : 30 % sur 1 400 pulls demandés, 1 600 en rayon", () => {
    const p = promotionDuMois(f, { reference: "col-rond", demandeDuMois: 1_400, remise: 0.3, stockEnRayon: 1_600 });
    // 1 400 × (1 + 0,9) = 2 660 demandés ; 1 600 × 38,50 = 61 600 € contre 77 000 €.
    expect([p.nouveauPrix, p.avec.demande, p.avec.vendus, p.avec.manques, p.chiffreEnPlus, p.bilan]).toEqual([46.2, 2_660, 1_600, 1_060, -15_400, "plus-mais-moins"]);
  });
});

describe("la caisse", () => {
  it("le ticket : 42 + 30 = 72 €, 28 € rendus sur 100 € (20 + 5 + 2 + 1)", () => {
    const t = ticketDuClient(f);
    expect([t.total, t.rendu]).toEqual([72, 28]);
    expect(t.monnaie).toEqual(enCoupures(28));
    expect(t.monnaie.map((x) => x.valeur)).toEqual([20, 5, 2, 1]);
    expect([t.plus.montant, t.moins.montant]).toEqual([38, 27]);
  });

  it("la journée de janvier : 77 250 € hors taxes réglés en caisse ÷ 30 jours", () => {
    const j = journeeEnCaisse(f);
    const caisse = 200 * 55 + 220 * 75 + 55 * 135 + 90 * 35 + 30 * 25 + (320 * 55 + 140 * 75 + 15 * 135 + 180 * 35 + 80 * 25);
    expect(j.chiffreDuMois).toBe(caisse);
    expect(caisse).toBe(77_250);
    expect([j.htDuJour, j.tvaDuJour, j.ttcDuJour, j.especes, j.attendu, j.compte, j.ecart, j.auCoffre]).toEqual([2_575, 515, 3_090, 772.5, 922.5, 912.5, -10, 762.5]);
    expect(j.chiffreFacture).toBe(80 * 55 + 20 * 135 + 60 * 35 + 40 * 25);
    expect(j.tiroir.reduce((t, x) => t + x.valeur * x.nombre, 0)).toBeCloseTo(912.5, 9);
  });

  it("le tiroir : 3 clients en espèces à 98,62 € avant le plafond de 500 € ; 2 passages au coffre", () => {
    expect(journeeEnCaisse(f).ticketMoyenTtc).toBe(c((77_250 * 1.2) / 940));
    expect(clientsAvantLeCoffre(f)).toBe(3); // (500 − 150) ÷ 98,62 = 3,55
    expect(journeeAvecLeCoffre(f, 1).plusPlein).toBe(c(150 + 772.5 / 2));
    expect(journeeAvecLeCoffre(f, 2).plusPlein).toBe(c(150 + 772.5 / 3));
    expect(passagesNecessaires(f)).toBe(2);
  });

  it("décembre : 231 850 € hors taxes en caisse, 2 318,50 € d'espèces", () => {
    const j = journeeEnCaisse(f, DECEMBRE_N_MOINS_1, 5);
    expect(j.chiffreDuMois).toBe(80_450 + 151_400);
    expect([j.htDuJour, j.ttcDuJour, j.especes, j.attendu, j.compte, j.auCoffre]).toEqual([7_728.33, 9_274, 2_318.5, 2_468.5, 2_473.5, 2_323.5]);
  });
});

describe("la réception", () => {
  it("le bon du façonnier : 500 + 240 + 60 + 200 = 1 000 articles ; 1 160 au 1er janvier", () => {
    const b = bonDuFaconnier(f);
    expect(b.lignes.map((l) => [l.code, l.commandee])).toEqual([
      ["col-rond", 500],
      ["cardigan", 240],
      ["merinos", 60],
      ["echarpe", 200],
    ]);
    expect([b.totalCommande, b.totalAvant]).toEqual([1_000, 400 + 120 + 70 + 350 + 220]);
  });

  it("un carton manque sur les pulls col rond : 990 reçus, 890 pulls, 2 150 articles en réserve", () => {
    const r = receptionDuFaconnier(f);
    expect([r.ecart.code, r.manquants, r.totalRecu, r.apresDeLEcart, r.totalApres, r.factureDeLaLigne]).toEqual(["col-rond", 10, 990, 890, 2_150, 12_500]);
    // 400 + 500 − 10 k ≥ 600 : k ≤ 30.
    expect(cartonsQuiPeuventManquer(f)).toBe(30);
  });

  it("la saisie juste : 490 saisis, 10 réclamés, 12 250 € à payer", () => {
    expect(saisieDeLaReception(f, 490, 10)).toMatchObject({ ecartDInventaire: 0, avoir: 250, aPayer: 12_250, payeSansEtreRecu: 0, juste: true });
    expect(saisieDeLaReception(f, 500, 0)).toMatchObject({ ecartDInventaire: 10, payeSansEtreRecu: 250, juste: false });
  });

  it("les deux écarts : −10 pulls col rond, +10 pulls mérinos, 250 € payés pour rien", () => {
    const s = livraisonAvecDeuxEcarts(f);
    expect([s.manque.code, s.enTrop.code, s.totalSurLeBon, s.totalCompte, s.payesSansEtreRecus]).toEqual(["col-rond", "merinos", 1_000, 1_000, 250]);
  });
});

describe("le rayon", () => {
  it("le cardigan : 384 ÷ 30 = 12,8, soit 13 par jour ; 120 ÷ 13 = 9 jours ; 24 manqués à 75 €", () => {
    const r = rayonDuMois(f);
    expect([r.code, r.parJour, r.joursAvant, r.delai, r.joursSans, r.joursVidesAvantLaLivraison]).toEqual(["cardigan", 13, 9, 21, 12, 2]);
    expect([r.manquees, r.ventesPerdues, r.stockPourLeDelai]).toEqual([24, 1_800, 13 * 21]);
    // Après le 12 : 240 ÷ 13 = 18 jours, 3 de moins que le délai, 39 cardigans en danger.
    expect([r.joursApres, r.joursSansApres, r.articlesEnDanger]).toEqual([18, 3, 39]);
  });

  it("février : 39 cartons, 390 cardigans, servent les 384 clients", () => {
    expect(commandeDeFevrier(f)).toBe(390);
  });
});

describe("le panier", () => {
  it("janvier : 87 450 € ÷ 948 = 92,25 € ; 43 200 € ÷ 948 = 45,57 € ; 46,68 € de marge", () => {
    const p = panierDuMois(f);
    expect(somme(ventes, PRIX)).toBe(87_450);
    expect(somme(ventes, CV)).toBe(43_200);
    expect([p.tickets, p.panier, p.coutDUneVente, p.marge, p.caEnPlus, p.margeEnPlus]).toEqual([948, 92.25, 45.57, 46.68, 60 * 92.25, c(60 * 46.68)]);
  });

  it("les parts du panier, et l'article à proposer : le pull mérinos, 74 € de marge", () => {
    expect(articlesDuMois(f).map((a) => [a.code, a.dansLePanier])).toEqual([
      ["col-rond", c(33_000 / 948)],
      ["cardigan", c(27_000 / 948)],
      ["merinos", c(12_150 / 948)],
      ["echarpe", c(11_550 / 948)],
      ["bonnet", c(3_750 / 948)],
    ]);
    const a = articleAConseiller(f);
    expect([a.meilleur.code, a.meilleur.marge, a.plusVendu.code, a.moinsCher.code]).toEqual(["merinos", 74, "cardigan", "bonnet"]);
  });

  it("un vendeur à 2 000 € brut coûte 2 840 € : 3 ventes de plus par jour le paient, pas 2 (2 800,80 €)", () => {
    expect(coutDUnVendeurEnPlus(f).cout).toBe(2_840);
    expect(ventesPourLeVendeur(f)).toBe(3);
  });

  it("l'indice de vente qui porte le panier à 100 € : 1,75 × 57,16 € = 100,02 € ; 1,74 donne 99,45 €", () => {
    expect(indicePourLObjectif(f)).toBe(1.75);
    expect(moisALIndice(f, 1.75).panier).toBe(c((1.75 * 87_450) / 1_530));
    expect(moisALIndice(f, 1.74).panier).toBe(c((1.74 * 87_450) / 1_530));
  });

  it("décembre : 260 000 € ÷ 3 130 = 83,07 € de panier, 42,72 € de marge, le panier baisse", () => {
    const d = decembreFaceAJanvier(f);
    expect([d.fin.chiffreDAffaires, d.fin.coutDesVentes, d.fin.panier, d.fin.coutDUneVente, d.fin.marge]).toEqual([260_000, 126_300, 83.07, 40.35, 42.72]);
    expect([d.ecartDuPanier, d.ecartDeLaMarge, d.bilan]).toEqual([-9.18, -3.96, "panier-baisse"]);
  });
});

describe("le suivi des ventes", () => {
  it("N − 1 face à N − 2, plus 5 % : atteint, manqué faute de clients, atteint, manqué faute de réserve", () => {
    expect(suiviDeLAnnee(f).map((k) => [k.objectif, k.pendant.ventes, k.tauxDeRealisation, k.verdict])).toEqual([
      [Math.ceil(4_409 * 1.05), 4_772, 103.1, "atteint"],
      [Math.ceil(3_014 * 1.05), 3_132, 99, "clients"],
      [Math.ceil(5_177 * 1.05), 5_588, 102.8, "atteint"],
      [12_600, 12_500, 99.2, "service"],
    ]);
    const k = suiviDuTrimestre(f);
    expect([k.ecart, k.ecartEnPourcentage, k.pendant.repartis, k.demandeFaceALObjectif]).toEqual([-100, -0.8, 1_940, 1_840]);
  });

  it("la plus forte progression tenue : 4 % (12 480) ; 5 % demande 12 600", () => {
    expect(progressionAtteinte(f)).toBe(4);
    expect(reservePourTousLesServir(f)).toBe(2_000);
  });
});

describe("la fidélité", () => {
  it("340 clientes, 19 640 € de marge, 57,76 € par passage, 693,12 € sur l'année", () => {
    const k = carteDeFidelite(f);
    const marge = 200 * 26.5 + 220 * 37 + 55 * 74 + 90 * 19 + 30 * 14;
    expect(k.marge).toBe(marge);
    expect([k.clientes, k.margeDUnPassage, k.margeDeLAnnee, k.margePerdueSiEllePart]).toEqual([340, c(marge / 340), c(12 * 57.76), c(11 * 57.76)]);
  });

  it("février : 17 parties, 323 revenues, 338 en fin de mois ; 17 nouvelles cartes tiennent le fichier", () => {
    expect(moisDuFichier(340)).toEqual({ debut: 340, parties: 17, revenues: 323, nouvelles: 15, fin: 338 });
    expect(moisDuFichier(340, 0.05, 17).fin).toBe(340);
    expect(moisDuFichier(340, 0.05, 16).fin).toBe(339);
  });

  it("le plus haut taux de départ qui garde 340 clientes en décembre : 4 %", () => {
    expect(tauxQuiGardeLeFichier(f)).toBe(4);
    expect(anneeDuFichier(f, 0.04).finDeDecembre).toBeGreaterThanOrEqual(340);
    expect(anneeDuFichier(f, 0.05).finDeDecembre).toBeLessThan(340);
  });

  it("les travaux : 522 articles en mai, 931 en juillet, 34 fidèles perdues", () => {
    const [mai, juillet] = [fermeturePourTravaux(f, 2), fermeturePourTravaux(f, 3)];
    expect([mai.articlesPerdus, juillet.articlesPerdus]).toEqual([Math.round((3_132 / 90) * 15), Math.round((5_588 / 90) * 15)]);
    expect([mai.fidelesAttendues, mai.fidelesPerdues, juillet.fidelesPerdues]).toEqual([170, 34, 34]);
    expect(mai.margeDUnArticle).toBe(c(44_250 / 1_530));
    expect([mai.total, juillet.total]).toEqual([c(522 * 28.92 + 34 * 693.12), c(931 * 28.92 + 34 * 693.12)]);
  });
});

describe("la conquête", () => {
  it("les passants : 600 ÷ 3 160 entrées, 64,04 € de panier, 32,18 € de marge", () => {
    const p = passantsDeJanvier(f);
    expect([p.panier, p.margeDUneVente]).toEqual([c(38_425 / 600), c(19_310 / 600)]);
  });

  it("la campagne à 2 000 € : 95 ventes, 21,05 € la vente, 3 057,10 € de marge, 1 057,10 € laissés", () => {
    const k = campagne(f, 2_000);
    expect([k.ventes, k.coutDUneVente, k.marge, k.laisse, k.nouvellesFideles, k.margeDuMoisSuivant]).toEqual([95, 21.05, c(95 * 32.18), c(95 * 32.18 - 2_000), 19, c(19 * 57.76)]);
    expect(ventesPourPayer(f)).toBe(63); // 2 000 ÷ 32,18 = 62,15
  });

  it("l'offre qui laisse le plus : 2 000 € ; 4 000 € coûte 41,86 € de plus qu'elle ne rapporte", () => {
    expect(meilleureCampagne(f).budget).toBe(2_000);
    expect(campagne(f, 4_000).laisse).toBe(c(123 * 32.18 - 4_000));
    expect(campagne(f, 1_000).laisse).toBe(c(57 * 32.18 - 1_000));
  });
});
