import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { indicateursDuPointDeVente } from "../../src/config/cours/chapitres/indicateurs-du-point-de-vente";
import { equipeEtPlanning } from "../../src/config/cours/chapitres/equipe-et-planning";
import { seuilDeLaBoutique } from "../../src/config/cours/chapitres/seuil-du-point-de-vente";
import { tableauDeBordDuMois } from "../../src/config/cours/chapitres/tableau-de-bord-du-manager";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { assortiment, chiffreDAffairesParLesIndicateurs, indicateursDuMois, margesDeLaGamme, seuilDuPointDeVente, tableauDeBordDuManager } from "../../src/config/cours/monde/boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { journeeEnCaisse, panierDuMois } from "../../src/config/cours/monde/vente-et-caisse";
import { servirLeChapitre } from "../../src/pedagogy/cours/chapitre-servi";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";

/**
 * UNE SEULE MAILLE & CO DANS LE MONDE DU COURS (comme une-seule-nova). Le bac pro (« Le panier
 * moyen », « Tenir la caisse », vente-et-caisse.ts) et le BTS MCO (les indicateurs, le seuil, le
 * tableau de bord, l'équipe, boutique.ts) lisent le même mois de janvier, et disent les mêmes
 * chiffres : un seul panier moyen, le chiffre d'affaires ENCAISSÉ EN CAISSE divisé par les passages en
 * caisse ; les 8 commandes des comités d'entreprise, facturées à 45 jours, ne sont pas des passages ;
 * leur chiffre d'affaires s'ajoute à celui de la caisse pour faire le chiffre d'affaires du mois.
 */

const centime = (x: number) => Math.round(x * 100) / 100;
const cas = casDeLEntreprise("boutique");
const m = indicateursDuMois(f);
const bacPro = panierDuMois(f);
const caisse = journeeEnCaisse(f);
const PANIER = centime(77_250 / 940);

describe("une seule MAILLE & CO, d'une fiche à l'autre", () => {
  it("un seul panier moyen : 77 250 € encaissés ÷ 940 passages en caisse = 82,18 €, au bac pro comme au BTS MCO", () => {
    expect(PANIER).toBe(82.18);
    expect(bacPro.panier).toBe(PANIER);
    expect(centime(m.panierMoyen)).toBe(PANIER);
    expect(centime(chiffreDAffairesParLesIndicateurs(f).panierMoyen)).toBe(PANIER);
    const tb = tableauDeBordDuManager(f).indicateurs.find((i) => i.code === "panierMoyen")!;
    expect(centime(tb.valeur)).toBe(PANIER);
    expect(centime(seuilDuPointDeVente(f).panierMoyen)).toBe(PANIER);
  });

  it("les mêmes passages en caisse, les mêmes articles et le même chiffre d'affaires en caisse", () => {
    for (const x of [bacPro.tickets, caisse.ticketsDuMois, m.tickets, seuilDuPointDeVente(f).tickets]) expect(x).toBe(940);
    for (const x of [bacPro.articles, caisse.articlesDuMois, m.articlesEnCaisse]) expect(x).toBe(1_330);
    for (const x of [bacPro.chiffreDAffaires, caisse.chiffreDuMois, m.chiffreDAffairesEnCaisse]) expect(x).toBe(77_250);
    expect(caisse.chiffreFacture).toBe(m.commandes.chiffreDAffaires);
    expect(bacPro.indiceDeVente).toBeCloseTo(m.indiceDeVente, 12);
    expect(bacPro.prixMoyenDeLArticle).toBeCloseTo(m.prixMoyenDeLArticle, 12);
  });

  it("le même chiffre d'affaires du mois et les mêmes articles vendus : la caisse plus les commandes des comités", () => {
    const ventes = f.gamme.reduce((t, r) => t + r.ventesDuMois, 0);
    expect(m.articles).toBe(ventes);
    expect(m.articles).toBe(m.articlesEnCaisse + m.commandes.articles);
    const ca = m.chiffreDAffairesEnCaisse + m.commandes.chiffreDAffaires;
    expect(ca).toBe(87_450);
    for (const x of [m.chiffreDAffaires, margesDeLaGamme(f).chiffreDAffaires, assortiment(f).chiffreDAffaires, seuilDuPointDeVente(f).chiffreDAffaires, tableauDeBordDuManager(f).chiffreDAffaires, chiffreDAffairesParLesIndicateurs(f).chiffreDAffaires]) {
      expect(x).toBe(ca);
    }
  });

  it("chaque chapitre du BTS MCO donne le même panier, les mêmes passages et le même chiffre d'affaires", () => {
    const k = indicateursDuPointDeVente(cas);
    const s = seuilDeLaBoutique(cas);
    const t = tableauDeBordDuMois(cas);
    const e = equipeEtPlanning(cas);
    expect([k.panier, s.panier, t.panierN, centime(e.panier)]).toEqual([PANIER, PANIER, PANIER, PANIER]);
    expect([k.m.tickets, s.s.tickets, t.m.tickets, e.tickets]).toEqual([940, 940, 940, 940]);
    expect([k.m.chiffreDAffaires, s.s.chiffreDAffaires, t.ca, e.ca]).toEqual([87_450, 87_450, 87_450, 87_450]);
    expect([k.m.articles, s.m.articles, t.m.articles]).toEqual([1_530, 1_530, 1_530]);
  });

  it("aucun chapitre ni cas de la boutique ne donne l'ancien panier (92,25 €, 948 passages), sauf pour montrer l'erreur", () => {
    // Les étapes qui montrent le panier qu'on obtiendrait en comptant les comités comme des passages.
    const ilsMontrentLErreur = new Set(["le-panier-avec-les-comites", "quel-panier-viser", "synthese"].map((id) => `indicateurs-du-point-de-vente/${id}`));
    const ancienPanier = montantEcrit(centime(87_450 / 948));
    let lus = 0;
    for (const c of [...CHAPITRES, ...SITUATIONS]) {
      if (!c.entreprises?.codes.includes("boutique")) continue;
      lus++;
      for (const etape of servirLeChapitre(c, cas).etapes) {
        if (ilsMontrentLErreur.has(`${c.code}/${etape.id}`)) continue;
        const texte = JSON.stringify(etape);
        expect(texte, `${c.code} / ${etape.id}`).not.toContain(ancienPanier);
        expect(texte, `${c.code} / ${etape.id}`).not.toMatch(/948 passages/);
      }
    }
    expect(lus).toBeGreaterThanOrEqual(10);
  }, 60_000);
});
