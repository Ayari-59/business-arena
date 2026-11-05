import { describe, expect, it } from "vitest";
import { LE_FICHIER_ET_LA_CIBLE } from "../../src/config/cours/chapitres/le-fichier-et-la-cible";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { OBJECTIF_RELEVE, OFFRE_DU_LOUEUR, UN_FICHIER_A_ACHETER, achatDuFichier } from "../../src/config/cours/situations/par-chapitre/un-fichier-a-acheter";
import type { EtapeTri } from "../../src/config/cours/types";
import { CABINET, attendus, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-du-terrain-d-atlas";

/**
 * LE FICHIER : QUALIFIER, SEGMENTER, CIBLER (BTS NDRC, blocs 1 et 2, palier 4), CHEZ ATLAS CONSEIL, ET SON
 * CAS : UN FICHIER À ACHETER ?
 *
 * Refait à la main : le marché (3 900 × 8 % × 5 = 1 560 journées ; 1 300 × 30 % × 30 = 11 700), la part du
 * cabinet (68 et 848 journées), la valeur vie d'une petite PME (32 640 € ÷ 13 ÷ 30 %) et d'une PME moyenne
 * gagnée en N (77 136 € ÷ 7 ÷ 30 %), le fichier (2 200 lignes, 1 320 utilisables), les scores RFM, l'entonnoir
 * à rebours (8 ÷ 35 % → 23 devis → 92 rendez-vous → 920 contacts), le laboratoire, la variante à 20 % de
 * rendez-vous, et le cas (12 comptes : 35 devis, 140 rendez-vous, 700 contacts ; 600 lignes utiles).
 */

const ch = LE_FICHIER_ET_LA_CIBLE;
const c = (x: number) => Math.round(x * 100) / 100 + 0;

describe("le fichier et la cible, chez le cabinet du monde du cours", () => {
  it("se joue chez ATLAS CONSEIL, au palier 4 du BTS NDRC, blocs 1 et 2, au programme, avec ses voisins", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.parcours, ch.palier]).toEqual(["ndrc", 4]);
    expect(ch.blocs).toEqual(["BTS NDRC Bloc 1 · Relation client et négociation-vente", "BTS NDRC Bloc 2 · Relation client à distance et digitalisation"]);
    gardeDuProgramme(ch, PROGRAMME.ndrc[4]!);
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(casDuChapitre(ch.code)).toBe(UN_FICHIER_A_ACHETER);
    expect(SITUATIONS).toContain(UN_FICHIER_A_ACHETER);
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, notions existantes", () => {
    gardesDeTexte(ch);
  });

  it("le marché, la cible et la valeur d'un compte, refaits à la main", () => {
    expect(attendus(ch, "le-marche")).toEqual([1_300 * 0.3 * 30, 3_900 * 0.08 * 5, c((848 / 11_700) * 100), c((68 / 1_560) * 100)].map(c));
    expect(attendus(ch, "le-marche")).toEqual([11_700, 1_560, 7.25, 4.36]);
    expect(juste(ch, "la-cible")).toEqual(["Les PME moyennes et les ETI"]);
    const petite = c(32_640 / 13);
    const moyenne = c(77_136 / 7);
    expect(attendus(ch, "la-valeur-d-un-compte")).toEqual([petite, c(petite / 0.3), moyenne, c(moyenne / 0.3)]);
    expect(attendus(ch, "la-valeur-d-un-compte")).toEqual([2_510.77, 8_369.23, 11_019.43, 36_731.43]);
  });

  it("le fichier : le pari, le tri des lignes, puis sa qualité", () => {
    expect(juste(ch, "predire-le-fichier")).toEqual(["Environ 6 lignes sur 10"]);
    const tri = ch.etapes.find((e) => e.id === "trier-le-fichier") as EtapeTri;
    expect(tri.elements(CABINET).map((x) => x.categorie)).toEqual(["fusionner", "completer", "ecarter", "supprimer", "supprimer", "garder"]);
    expect(new Set(tri.elements(CABINET).map((x) => x.categorie))).toEqual(new Set(tri.categories.map((k) => k.code)));
    expect(attendus(ch, "la-qualite-du-fichier")).toEqual([2_000, 85, 1_500, 1_320, 60]);
  });

  it("le score RFM et ce qu'il voit que la méthode ABC ne voit pas", () => {
    // Ferrand : 1 mois (3), 2 commandes (2), 56 000 € (3) ; Lumen : 4 mois (2), 1 commande (1), 8 000 € (1) ; Garance : 4 mois (2), 3 commandes (2), 7 200 € (1).
    expect(attendus(ch, "le-score-rfm")).toEqual([3 + 2 + 3, 2 + 1 + 1, 2 + 2 + 1, 9]);
    expect(juste(ch, "rfm-et-abc")).toEqual(["La relancer vite : un compte neuf qui ne recommande pas part"]);
  });

  it("à rebours : le pari, le laboratoire, les contacts qu'il faut, puis la variante qualifiée", () => {
    expect(juste(ch, "predire-les-contacts")).toEqual(["Environ 900"]);
    const l = gardeDuLaboratoire(ch, "le-laboratoire-du-ciblage");
    expect(l.depart).toEqual({ rendezVous: 10, signature: 35 });
    expect(l.d.solution).toEqual({ rendezVous: 20, signature: 35 });
    expect(l.auDepart).toEqual({ "Devis à remettre": 23, "Rendez-vous à obtenir": 92, "Contacts à appeler": 920, "Contacts utilisables du fichier": 480, "Contacts qui manquent": 440 });
    expect(l.aLaSolution).toEqual({ "Devis à remettre": 23, "Rendez-vous à obtenir": 92, "Contacts à appeler": 460, "Contacts utilisables du fichier": 480, "Contacts qui manquent": 0 });
    // Un point de moins ne suffit pas : 92 ÷ 19 % = 485 contacts.
    expect(l.d.atteint({ rendezVous: 19, signature: 35 })).toBe(false);
    const g = l.e.graphique!(CABINET);
    expect([5, 10, 20, 25].map((r) => g.courbes[0]!.valeur({ rendezVous: r, signature: 35 }))).toEqual([1_840, 920, 460, 368]);
    expect(attendus(ch, "a-rebours")).toEqual([Math.ceil(8 / 0.35), 92, 920, 440]);
    expect(attendus(ch, "mieux-qualifier")).toEqual([460, c(480 * 0.2 * 0.25 * 0.35)]);
    expect(attendus(ch, "mieux-qualifier")).toEqual([460, 8.4]);
    expect(juste(ch, "le-segment-de-hugo")).toEqual(["Les PME moyennes, en qualifiant chaque contact avant l'appel"]);
  });
});

describe("son cas : un fichier à acheter ?", () => {
  const s = UN_FICHIER_A_ACHETER;

  it("tient comme un cas dédié, et la réponse ne se devine pas à sa longueur", () => {
    gardeDuCas(s, ch);
  });

  it("l'offre, les contacts qu'il faut et ce que rapporte l'achat, refaits à la main", () => {
    const utiles = OFFRE_DU_LOUEUR.lignes - 150 - 170 - 80;
    expect(attendus(s, "les-lignes-utiles")).toEqual([utiles, 60, 1_200, c(1_200 / utiles)]);
    const devis = Math.ceil(OBJECTIF_RELEVE / 0.35);
    const rdv = Math.ceil(devis / 0.25);
    const contacts = Math.ceil(rdv / 0.2 - 1e-9);
    expect([devis, rdv, contacts]).toEqual([35, 140, 700]);
    expect(attendus(s, "les-contacts-qu-il-faut")).toEqual([35, 140, 700, 220]);
    const comptes = c(220 * 0.2 * 0.25 * 0.35);
    const valeur = c(comptes * 36_731.43);
    expect(attendus(s, "ce-que-rapporte-l-achat")).toEqual([comptes, valeur, 1_200 + 220 * 45, c(valeur - 11_100)]);
    expect(achatDuFichier(CABINET).couvre).toBe(true);
    expect(juste(s, "le-premier-appel")).toEqual(["D'où vient son contact, et qu'il peut s'y opposer"]);
    expect(juste(s, "reponse")[0]).toMatch(/^L'acheter : 220 lignes qualifiées/);
  });
});
