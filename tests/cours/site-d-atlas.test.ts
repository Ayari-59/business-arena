import { describe, expect, it } from "vitest";
import { ATLAS_CONSEIL } from "../../src/config/cours/monde/atlas-conseil";
import {
  ACHETEURS_DU_SITE,
  AVIS_PAR_NOTE,
  COURBE_DES_LIENS,
  CONTACTS_SELON_LE_RYTHME,
  HEBERGEMENTS,
  PLACE_EN_SESSION,
  PUBLICATIONS,
  SOURCES_DE_TRAFIC,
  avisACinqEtoilesPour,
  ceQuIlFautPour,
  clicsDesLiens,
  commandeMoyenne,
  contactsAuRythme,
  conversionALaNote,
  hebergementsDuTrimestre,
  liensSponsorises,
  marketingEntrant,
  meilleurBudgetDesLiens,
  meilleurRythme,
  noteDesAvis,
  paliersDesLiens,
  publicationsDuTrimestre,
  retractationsDuTrimestre,
  rythmeDePublication,
  traficDuSite,
  valeurDUnContact,
} from "../../src/config/cours/monde/site-d-atlas";

/**
 * LE SITE, LES CONTENUS ET LA COMMUNAUTÉ D'ATLAS CONSEIL (monde/site-d-atlas.ts), REFAITS À LA MAIN.
 *
 * Chaque chiffre attendu est recalculé ici sur les constantes, sans les fonctions du module ; les
 * valeurs absolues sont épinglées (un changement d'hypothèse se voit). Les propriétés qui font voir les
 * notions sont gardées : une source au ROAS supérieur à 1 qui perd de l'argent, une courbe des liens et
 * une courbe des contacts concaves, un meilleur budget qui dépend de la conversion, un meilleur rythme
 * qui dépend de la mesure de la valeur, une note qu'un seul avis fait baisser d'un dixième.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const src = (code: string) => SOURCES_DE_TRAFIC.find((s) => s.code === code)!;

describe("le site qui vend : le premier trimestre de N + 1", () => {
  it("12 000 visites, 120 commandes, 8 100 € de dépenses ; 180 places, 1,5 place et 525 € par commande", () => {
    expect([somme(SOURCES_DE_TRAFIC.map((s) => s.visites)), somme(SOURCES_DE_TRAFIC.map((s) => s.commandes)), somme(SOURCES_DE_TRAFIC.map((s) => s.cout))]).toEqual([12_000, 120, 8_100]);
    expect(somme(ACHETEURS_DU_SITE.map((a) => a.commandes))).toBe(somme(SOURCES_DE_TRAFIC.map((s) => s.commandes)));
    const places = somme(ACHETEURS_DU_SITE.map((a) => a.commandes * a.placesParCommande));
    expect([places, places / 120, (places * PLACE_EN_SESSION.prixHt) / 120]).toEqual([180, 1.5, 525]);
    const t = traficDuSite();
    expect([t.visites, t.commandes, t.cout, t.conversion, t.chiffreDAffaires, t.coutParCommande]).toEqual([12_000, 120, 8_100, 0.01, 63_000, 67.5]);
    expect(t.chiffreDAffaires).toBe(180 * 350);
    expect(t.conversionEnContact).toBe(0.02);
  });

  it("la marge d'une commande : 1,5 × 295 € − 9,70 € de frais = 432,80 € ; le ROAS seuil 1,21", () => {
    const m = commandeMoyenne();
    expect([m.prixTtc, m.coutVariable, m.margeDUnePlace]).toEqual([420, 55, 295]);
    expect(m.acheteurs.map((a) => a.frais)).toEqual([c(420 * 0.015 + 0.25), c(840 * 0.015 + 0.25)]);
    expect([m.frais, m.fraisDuTrimestre, m.margeAvantFrais, m.marge]).toEqual([9.7, 1_164, 442.5, 432.8]);
    expect(c(m.roasSeuil)).toBe(c(525 / 432.8));
  });

  it("les sources : la conversion, le coût d'une commande ; les réseaux sociaux, au ROAS de 1,17, perdent 68,80 €", () => {
    const t = traficDuSite();
    expect(t.sources.map((s) => s.conversion)).toEqual([0.007, 0.015, 0.002, 0.02, 0.016]);
    expect(t.sources.map((s) => s.coutParCommande)).toEqual([68.57, 80, 450, 15, 0]);
    expect(t.sources.map((s) => s.roas && c(s.roas))).toEqual([7.66, 6.56, 1.17, 35, null]);
    const reseaux = t.sources.find((s) => s.code === "reseaux")!;
    expect(reseaux.roas!).toBeGreaterThan(1);
    expect(reseaux.margeNette).toBe(c(4 * 432.8 - 1_800));
    expect(reseaux.margeNette).toBeLessThan(0);
    expect(t.margeNette).toBe(c(120 * 432.8 - 8_100));
  });

  it("à rebours : 75 600 € demandent 14 400 visites, ou 1,2 %, ou 630 €", () => {
    const v = ceQuIlFautPour(75_600);
    expect([Math.round(v.visites), c(v.conversion * 100), v.panier]).toEqual([14_400, 1.2, 630]);
  });

  it("la courbe des liens : concave, interpolée, plate au-delà ; 1,5 % des clics en commandes", () => {
    const marginaux = COURBE_DES_LIENS.slice(1).map((p, i) => (p.clics - COURBE_DES_LIENS[i]!.clics) / (p.budget - COURBE_DES_LIENS[i]!.budget));
    for (let i = 1; i < marginaux.length; i++) expect(marginaux[i]!).toBeLessThan(marginaux[i - 1]!);
    expect([clicsDesLiens(2_700), clicsDesLiens(9_000)]).toEqual([2_500, 3_840]);
    expect(liensSponsorises(src("payant").cout).clics).toBe(src("payant").visites);
    expect(paliersDesLiens().slice(1).map((p) => p.supplement!.coutDuClicEnPlus)).toEqual([0.9, 1.8, 3, 7.5]);
    expect(paliersDesLiens().map((p) => p.gain)).toEqual([0, c(30 * 432.8 - 1_800), c(45 * 432.8 - 3_600), c(54 * 432.8 - 5_400), c(57.6 * 432.8 - 7_200)]);
    expect([0.005, 0.01, 0.015, 0.02, 0.025].map((k) => meilleurBudgetDesLiens(k).budget)).toEqual([3_600, 5_400, 5_400, 7_200, 7_200]);
  });

  it("la rétractation : 6 particuliers sur 60, 2 100 € et 1 770 € perdus, 0,95 % net", () => {
    const r = retractationsDuTrimestre();
    expect([r.commandes, r.chiffreDAffairesPerdu, r.margePerdue, r.conversionNette, r.chiffreDAffairesNet]).toEqual([6, 2_100, 1_770, 0.0095, 60_900]);
  });

  it("l'hébergement : 2 160 heures ; 10,8 et 1,08 heures de panne ; 349,63 € contre 325,96 €", () => {
    const h = hebergementsDuTrimestre();
    expect(HEBERGEMENTS.map((x) => x.prixParMois)).toEqual([30, 100]);
    expect([h.heures, h.margeParHeure]).toEqual([2_160, c((120 * 432.8) / 2_160)]);
    expect(h.offres.map((o) => [o.indisponibilite, o.margePerdue, o.total])).toEqual([
      [10.8, c(10.8 * 24.04), c(90 + c(10.8 * 24.04))],
      [1.08, c(1.08 * 24.04), c(300 + c(1.08 * 24.04))],
    ]);
    expect([h.moinsCher.code, h.ecart]).toEqual(["dedie", c(349.63 - 325.96)]);
  });
});

describe("contenus, communauté et e-réputation", () => {
  it("39 publications, 3 par semaine ; 3,42 % d'engagement ; 1 000 clics, les visites non payées des réseaux sociaux", () => {
    const p = publicationsDuTrimestre();
    expect([p.total.publications, p.total.impressions, p.total.interactions, p.total.clics, p.parSemaine]).toEqual([39, 114_000, 3_900, 1_000, 3]);
    expect(PUBLICATIONS.map((x) => x.interactions / x.impressions)).toEqual([0.04, 0.01, 0.05, 0.03]);
    expect(c(p.total.engagement * 100)).toBe(3.42);
    expect([p.croissanceDesAbonnes, p.coutDuCommunityManager]).toEqual([0.125, 3_900]);
  });

  it("un contact vaut 70, 200 ou 280 € (1 sur 300, comme la campagne de N) ; le marketing entrant en amène 360 à 6,67 €", () => {
    expect(valeurDUnContact(ATLAS_CONSEIL)).toEqual({ contactsParCompte: 300, premiereAnnee: 70, actualisee: 200, simple: 280, coutParContactDeLaCampagne: 40 });
    const e = marketingEntrant(ATLAS_CONSEIL);
    expect([e.tauxDeTelechargement, e.tauxDePresence, e.contacts, e.cout, e.coutParContact, e.comptes, e.coutParCompte, e.contactsDesPublications]).toEqual([0.15, 0.4, 360, 2_400, 6.67, 1.2, 2_000, 65]);
  });

  it("le rythme : une courbe concave ; le meilleur rythme est 2, 4 et 4 selon la mesure", () => {
    const marginaux = CONTACTS_SELON_LE_RYTHME.slice(1).map((n, i) => n - CONTACTS_SELON_LE_RYTHME[i]!);
    expect(marginaux).toEqual([30, 20, 15, 10, 4, 2]);
    expect([70, 200, 280].map((v) => meilleurRythme(v).rythme)).toEqual([2, 4, 4]);
    expect(rythmeDePublication(3, 280)).toEqual({ rythme: 3, publications: 39, contacts: 65, cout: 3_900, coutParContact: 60, valeurCreee: 18_200, gain: 14_300 });
    expect([contactsAuRythme(3.5), contactsAuRythme(6)]).toEqual([70, 81]);
  });

  it("les avis : 40, 4,5 de moyenne ; 1 avis à 1 étoile fait 4,4 affiché, 3 font 4,3 ; il faut 7, puis 21 avis à 5 étoiles", () => {
    expect([somme(AVIS_PAR_NOTE), somme(AVIS_PAR_NOTE.map((n, i) => n * (i + 1)))]).toEqual([40, 180]);
    expect(noteDesAvis()).toEqual({ avis: 40, points: 180, moyenne: 4.5, affichee: 4.5, partDeBonsAvis: 0.9 });
    expect([noteDesAvis([{ note: 1, avis: 1 }]).affichee, noteDesAvis([{ note: 1, avis: 3 }]).affichee]).toEqual([4.4, 4.3]);
    expect([avisACinqEtoilesPour(4.5, [{ note: 1, avis: 1 }]), avisACinqEtoilesPour(4.5, [{ note: 1, avis: 3 }])]).toEqual([7, 21]);
    expect([(181 + 35) / 48 >= 4.5, (181 + 30) / 47 >= 4.5]).toEqual([true, false]);
  });

  it("la note et la conversion : 1 % à 4,5 ; 0,96 % à 4,4 ; 0,92 % à 4,3, et la marge perdue d'un trimestre", () => {
    expect(conversionALaNote(4.5).conversion).toBe(traficDuSite().conversion);
    expect([conversionALaNote(4.4), conversionALaNote(4.3)].map((k) => [c(k.conversion * 100), k.margeEnPlus])).toEqual([
      [0.96, c(-4.8 * 432.8)],
      [0.92, c(-9.6 * 432.8)],
    ]);
  });
});
