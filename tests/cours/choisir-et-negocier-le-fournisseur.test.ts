import { describe, expect, it } from "vitest";
import { CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR, DEPART_DU_LABORATOIRE, ENTREPRISES_DU_FOURNISSEUR, POIDS_DE_LA_DIRIGEANTE } from "../../src/config/cours/chapitres/choisir-et-negocier-le-fournisseur";
import { CRITERES, DELAI_DE_PAIEMENT_MAXIMAL_EN_JOURS, NOTES, QUATRIEME_FACONNIER, TAUX_DE_RETOUR } from "../../src/config/cours/monde/fournisseurs-de-la-boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { PROGRAMME } from "../../src/config/cours/registre";
import { UN_QUATRIEME_FACONNIER } from "../../src/config/cours/situations/par-chapitre/un-quatrieme-faconnier";
import { BOUTIQUE, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * CHOISIR ET NÉGOCIER AVEC LE FOURNISSEUR (BTS MCO, bloc 2), À LA BOUTIQUE DU MONDE DU COURS, ET SON
 * CAS : UN QUATRIÈME FAÇONNIER.
 *
 * Refait à la main : la grille (poids 30, 15, 15, 10, 10, 20 ; le prix et la qualité se partagent 50
 * points), la mise en avant (40 cols ronds à 26,50 € de marge, 25 mérinos à 74 €), le seuil de revente
 * à perte du col rond (25 € + 0,50 € − 0,50 € − 2 €, × 1,2) et celui du tricoteur italien.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const N = { faconnier: [3, 5, 1, 3, 5, 4], fins: [5, 0, 5, 1, 0, 1], atelier: [1, 3, 3, 5, 5, 5] };
const note = (n: number[], prix = 30) => [prix, 15, 15, 10, 10, 50 - prix].reduce((t, p, i) => t + p * n[i]!, 0) / 100;

describe("choisir et négocier avec le fournisseur : le chapitre et son cas", () => {
  it("au palier 3 du BTS MCO, blocs 2 et 3, au programme, à la boutique seule ; le cas lui est dédié", () => {
    const ch = CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR;
    expect([ch.parcours, ch.palier]).toEqual(["mco", 3]);
    gardeDuProgramme(ch, PROGRAMME.mco[3]!, () => "bts-mco", /^BTS MCO /);
    expect(PROGRAMME.mco[3]![PROGRAMME.mco[3]!.indexOf(ch.titre) - 1]).toBe("Fidéliser la clientèle");
    expect([...ENTREPRISES_DU_FOURNISSEUR]).toEqual(["boutique"]);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    gardeDuCas(UN_QUATRIEME_FACONNIER, ch);
  });

  it("les notes suivent le barème tiré de la fiche : le moins cher, le plus long délai, le plus rapide, le plus petit minimum, le réassort, le moins de retours", () => {
    const fs = f.fournisseurs;
    const meilleur = <T,>(xs: readonly T[], k: (x: T) => number) => [...xs].sort((a, b) => k(a) - k(b))[0]!;
    expect(NOTES[meilleur(fs, (x) => x.multiplicateur).code].prix).toBe(5);
    expect(NOTES[meilleur(fs, (x) => -x.delaiDePaiement).code].paiement).toBe(5);
    expect(NOTES[meilleur(fs, (x) => x.delaiDeLivraison).code].livraison).toBe(5);
    expect(NOTES[meilleur(fs, (x) => x.minimumDeCommande).code].minimum).toBe(5);
    for (const x of fs) expect(NOTES[x.code].reassort).toBe(x.reassort ? 5 : 0);
    expect(NOTES[meilleur(fs, (x) => TAUX_DE_RETOUR[x.code]).code].qualite).toBe(5);
    expect(CRITERES.reduce((t, k) => t + k.poids, 0)).toBe(100);
  });

  it("la grille : 3,40, 2,55, 3,20 ; avec les poids de la dirigeante, 3,50, 2,15, 3,60", () => {
    expect([note(N.faconnier), note(N.fins), note(N.atelier)]).toEqual([3.4, 2.55, 3.2]);
    expect(attendus(CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR, "la-grille")).toEqual([3.4, 2.55, 3.2]);
    expect(POIDS_DE_LA_DIRIGEANTE).toBe(20);
    expect([note(N.faconnier, 20), note(N.fins, 20), note(N.atelier, 20)]).toEqual([3.5, 2.15, 3.6]);
    expect(attendus(CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR, "les-poids-de-la-dirigeante")).toEqual([3.5, 2.15, 3.6]);
  });

  it("le laboratoire : le référent mène seul à partir de 24 points pour le prix (les fins de série à 48)", () => {
    const mene = (p: number) => note(N.faconnier, p) > Math.max(note(N.atelier, p), note(N.fins, p)) + 1e-9;
    expect([mene(23), mene(24), mene(46), mene(47), mene(48)]).toEqual([false, true, true, false, false]);
    const e = gardeDuLaboratoire(CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR, "le-laboratoire-des-poids");
    expect(e.defi(BOUTIQUE).solution).toEqual({ prix: 24 });
    expect(DEPART_DU_LABORATOIRE.prix).toBe(20);
    expect(note(N.fins, 48) > note(N.faconnier, 48) && note(N.fins, 47) <= note(N.faconnier, 47) + 1e-9).toBe(true);
  });

  it("la coopération : 1 060 € gagnés, 1 850 € perdus, 410 € de gain à 1 200 € ; le plancher, 790 €", () => {
    expect([40 * 26.5, 25 * 74, 1_200 + 40 * 26.5 - 25 * 74]).toEqual([1_060, 1_850, 410]);
    expect(attendus(CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR, "la-cooperation")).toEqual([1_060, 1_850, 410]);
    gardeDuCurseur(CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR, "la-remuneration-au-curseur", 790);
  });

  it("le seuil de revente à perte : 23 € hors taxes, 27,60 € toutes taxes comprises, 58,2 % de remise au plus ; −60 % est à perte", () => {
    const ht = c(25 + 0.5 - 0.5 - 1_200 / 600);
    expect([ht, c(ht * 1.2)]).toEqual([23, 27.6]);
    expect(attendus(CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR, "le-seuil-de-revente-a-perte")).toEqual([23, 27.6, 58.2]);
    expect(c(66 * 0.4)).toBe(26.4);
    expect(juste(CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR, "la-fin-de-serie")[0]).toMatch(/^Non : 26,40 € est sous le seuil/);
    expect(juste(CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR, "le-delai-propose")[0]).toMatch(new RegExp(`${DELAI_DE_PAIEMENT_MAXIMAL_EN_JOURS} jours`));
    expect(juste(CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR, "retenir")[0]).toMatch(/^Le référent/);
  });

  it("le cas : l'italien à 3,50 puis 3,40, son seuil à 28,90 €, la clause de prix imposé interdite", () => {
    const n = [4, 3, 3, 3, 5, 3];
    expect(Object.values(QUATRIEME_FACONNIER.notes)).toEqual(n);
    expect(attendus(UN_QUATRIEME_FACONNIER, "sa-note")).toEqual([note(n), note(n, 20)]);
    expect([note(n), note(n, 20)]).toEqual([3.5, 3.4]);
    const prixNet = 25 * 0.96;
    const ht = c(prixNet + 0.8 - c(prixNet * 0.03));
    expect([prixNet, ht, c(ht * 1.2)]).toEqual([24, 24.08, 28.9]);
    expect(attendus(UN_QUATRIEME_FACONNIER, "son-seuil")).toEqual([24.08, 28.9, 56.2]);
    expect(juste(UN_QUATRIEME_FACONNIER, "le-prix-impose")[0]).toMatch(/^Interdite/);
    expect(juste(UN_QUATRIEME_FACONNIER, "reponse")[0]).toMatch(/^Une commande d'essai/);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre et le cas", () => {
    gardesDeTexte(CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR);
    gardesDeTexte(UN_QUATRIEME_FACONNIER);
  });
});
