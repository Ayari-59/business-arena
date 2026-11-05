import { describe, expect, it } from "vitest";
import { equipeDuMois, seuilDuPointDeVente, stockDuMois } from "../../src/config/cours/monde/boutique";
import {
  FINANCEMENT_DE_L_OUVERTURE,
  PROJET_DE_RENOVATION,
  bilanDeLaBoutique,
  compteDeResultat,
  dateEcrite,
  echeancesDeLaFacture,
  factureDuComite,
  impotSurLesSocietes,
  joursEntre,
  plusDeJours,
  projetDeRenovation,
} from "../../src/config/cours/monde/comptes-de-la-boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { JOURS_DE_FERMETURE, JOURS_DES_TRAVAUX_ACCELERES, SUPPLEMENT_DES_TRAVAUX_ACCELERES, fermePourTravaux } from "../../src/config/cours/situations/par-chapitre/ferme-pour-travaux";
import { BOUTIQUE } from "./gardes-de-la-boutique";

/**
 * LES COMPTES DE MAILLE & CO NE CONTREDISENT PAS SA FICHE (monde/comptes-de-la-boutique.ts).
 *
 * L'exercice, le bilan et la rénovation reprennent la fiche de la boutique (monde/maille-et-co.ts) :
 * mêmes articles par année, même prix moyen de janvier N − 1, mêmes charges du mois, même paie, même
 * stock au 1er janvier N, mêmes délais des comités et du façonnier, même cas de travaux. La garde le
 * vérifie, puis épingle les chiffres que les quatre chapitres lisent.
 */

const centime = (x: number) => Math.round(x * 100) / 100 + 0;

describe("les comptes de la boutique, d'une fiche à l'autre", () => {
  const n1 = compteDeResultat(f, "N-1");
  const b = bilanDeLaBoutique(f);

  it("l'exercice N − 1 lit la fiche : articles, prix moyen, charges du mois et paie douze fois", () => {
    const ventes = f.historique.filter((h) => h.annee === "N-1").reduce((t, h) => t + h.ventes, 0);
    expect(n1.articles).toBe(ventes);
    expect(n1.prixMoyen).toBe(f.moisN1.chiffreDAffaires / f.moisN1.articles);
    expect(n1.loyer + n1.taxesLocales).toBe(12 * f.charges.loyer);
    expect([n1.publicite, n1.entretien]).toEqual([12 * f.charges.publicite, 12 * f.charges.entretien]);
    expect(n1.personnel).toBe(centime(12 * equipeDuMois(f).cout));
    // L'usure du rayonnage : 333 € par mois arrondis, 4 000 € par an.
    expect(Math.round(n1.amortissements / 12)).toBe(f.charges.amortissement);
  });

  it("le bilan lit la fiche : le stock du 1er janvier N, les délais du façonnier et des comités", () => {
    expect(b.stock).toBe(stockDuMois(f).valeurInitiale);
    expect(b.stock).toBe(24_990);
    expect(b.delaiFournisseur).toBe(f.fournisseurs.find((x) => x.code === "faconnier")!.delaiDePaiement);
    expect(f.clienteles.find((c) => c.code === "comites")!.delaiDeReglement).toBe(45);
    expect(b.resultat).toBe(n1.resultatNet);
    expect(b.totalDeLActif).toBe(b.totalDuPassif);
    expect(centime(b.frng - b.bfr)).toBe(b.tresorerieNette);
    expect(b.emprunt).toBe(FINANCEMENT_DE_L_OUVERTURE.emprunt.capital - 3 * FINANCEMENT_DE_L_OUVERTURE.emprunt.remboursementAnnuel);
  });

  it("la rénovation lit le cas « Fermé pour travaux » : mêmes jours, même supplément, même marge perdue", () => {
    const fp = PROJET_DE_RENOVATION.fermeture;
    expect([fp.jours, fp.joursAcceleres, fp.supplement]).toEqual([JOURS_DE_FERMETURE, JOURS_DES_TRAVAUX_ACCELERES, SUPPLEMENT_DES_TRAVAUX_ACCELERES]);
    const x = fermePourTravaux(BOUTIQUE);
    const p = projetDeRenovation(f);
    expect(p.margePerdue).toBe(centime(seuilDuPointDeVente(f).marge - x.cinq.marge));
    expect(p.margePerdue).toBe(7_375);
    expect(p.margeParArticle).toBe(n1.margeParArticle);
  });

  it("la facture lit la gamme ; les délais se comptent sur le calendrier", () => {
    const fa = factureDuComite(f);
    expect(fa.brut).toBe(fa.lignes.reduce((t, l) => t + l.quantite * f.gamme.find((r) => r.code === l.reference)!.prixHt, 0));
    const e = echeancesDeLaFacture(f);
    expect([dateEcrite(e.convenue), dateEcrite(e.plafondDateDeFacture), dateEcrite(e.plafondFinDeMois)]).toEqual(["27 mars", "11 avril", "31 mars"]);
    expect(joursEntre({ jour: 12, mois: 1 }, { jour: 23, mois: 3 })).toBe(70);
    expect(plusDeJours({ jour: 31, mois: 1 }, 1)).toEqual({ jour: 1, mois: 2 });
  });

  it("l'impôt sur les sociétés : 15 % jusqu'à 42 500 €, 25 % au-delà, rien sur une perte", () => {
    expect([impotSurLesSocietes(-1_000), impotSurLesSocietes(40_000), impotSurLesSocietes(100_000)]).toEqual([0, 6_000, 6_375 + 14_375]);
  });

  it("les chiffres épinglés des quatre chapitres", () => {
    const n2 = compteDeResultat(f, "N-2");
    expect([n1.ventes, n1.margeCommerciale, n1.valeurAjoutee, n1.ebe, n1.resultatNet, n1.caf]).toEqual([1_455_552, 818_748, 551_133.6, 371_229.6, 274_284.2, 283_284.2]);
    expect([n2.ventes, n2.ebe, n2.resultatNet]).toEqual([1_414_500, 384_612, 287_525]);
    expect([b.frng, b.bfr, b.tresorerieNette, b.distribuable]).toEqual([415_794.2, -9_074, 424_868.2, 324_533.2]);
    expect(projetDeRenovation(f).van).toBe(7_850.02);
  });
});
