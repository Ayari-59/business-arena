import { describe, expect, it } from "vitest";
import { LE_SITE_QUI_VEND, LEVIERS_DES_LIENS, siteDuCabinet } from "../../src/config/cours/chapitres/le-site-qui-vend";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { BUDGET_PROPOSE, DOUBLER_LES_LIENS_SPONSORISES, doublementDesLiens } from "../../src/config/cours/situations/par-chapitre/doubler-les-liens-sponsorises";
import type { EtapeTri } from "../../src/config/cours/types";
import { dureeDuChapitre } from "../../src/config/cours/duree";
import { CONSEIL, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-du-site-d-atlas";

/**
 * LE SITE QUI VEND (BTS NDRC, bloc 2, palier 3), SUR LA BOUTIQUE EN LIGNE D'ATLAS CONSEIL, ET SON CAS :
 * DOUBLER LES LIENS SPONSORISÉS ?
 *
 * Refait à la main sur le premier trimestre du site (monde/site-d-atlas.ts) : 12 000 visites, 120
 * commandes, 180 places à 350 € (420 € TTC), 55 € de supports et de repas par place, 1,5 % + 0,25 € de
 * frais de paiement ; les dépenses des cinq sources ; la courbe des liens (2 000, 3 000, 3 600, 3 840
 * clics à 1 800, 3 600, 5 400, 7 200 €) ; la rétractation (6 particuliers sur 60) ; les hébergements
 * (30 € et 99,5 %, 100 € et 99,95 %). Sans les fonctions du chapitre ni du monde.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
/** Les textes servis portent des espaces fines insécables dans les nombres : on les lit en espaces ordinaires. */
const lu = (t: string) => t.replace(/[\u202f\u00a0]/g, " ");
const ch = LE_SITE_QUI_VEND;
// La commande moyenne, à la main.
const PANIER = (60 * 350 + 60 * 700) / 120;
const FRAIS_P = c(420 * 0.015 + 0.25);
const FRAIS_E = c(840 * 0.015 + 0.25);
const FRAIS = c((60 * FRAIS_P + 60 * FRAIS_E) / 120);
const MARGE = c(1.5 * (350 - 30 - 25) - FRAIS);
// Les liens : la courbe et la conversion de leurs visiteurs.
const COURBE: [number, number][] = [
  [0, 0],
  [1_800, 2_000],
  [3_600, 3_000],
  [5_400, 3_600],
  [7_200, 3_840],
];
const clicsA = (b: number) => {
  for (let i = 1; i < COURBE.length; i++) if (b <= COURBE[i]![0]) return COURBE[i - 1]![1] + ((b - COURBE[i - 1]![0]) * (COURBE[i]![1] - COURBE[i - 1]![1])) / (COURBE[i]![0] - COURBE[i - 1]![0]);
  return COURBE.at(-1)![1];
};
const gainA = (b: number, conv = 0.015) => c(clicsA(b) * conv * MARGE - b);

describe("le site qui vend, à la boutique en ligne d'ATLAS CONSEIL", () => {
  it("se joue chez ATLAS CONSEIL, au palier 3 du BTS NDRC, bloc 2, au programme, avec ses voisins, en 20 étapes au plus", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(DOUBLER_LES_LIENS_SPONSORISES);
    expect([ch.parcours, ch.palier]).toEqual(["ndrc", 3]);
    gardeDuProgramme(ch, PROGRAMME.ndrc[3]!);
    {
      const liste = PROGRAMME.ndrc[3]!;
      expect(liste[liste.indexOf(ch.titre) - 1]).toBe("L'événement commercial : budget, bilan et suivi des contacts");
    }
    expect(ch.blocs).toEqual(["BTS NDRC Bloc 2 · Relation client à distance et digitalisation"]);
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(casDuChapitre(ch.code)).toBe(DOUBLER_LES_LIENS_SPONSORISES);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    expect([ch.etapes[0]!.type, ch.etapes.at(-1)!.id]).toEqual(["lecture", "synthese"]);
    expect(dureeDuChapitre(ch)).toBe(65);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, notions existantes", () => {
    gardesDeTexte(ch);
  });

  it("la conversion, le panier et le chiffre d'affaires, refaits à la main", () => {
    expect([PANIER, FRAIS_P, FRAIS_E, FRAIS, MARGE]).toEqual([525, 6.55, 12.85, 9.7, 432.8]);
    expect(attendus(ch, "la-conversion")).toEqual([1, 2, 525, 12_000 * 0.01 * 525]);
    expect(12_000 * 0.01 * 525).toBe(63_000);
    expect(attendus(ch, "les-sources")).toEqual([c(2_400 / 35), 3_600 / 45, 1_800 / 4, 300 / 20, c(8_100 / 120)]);
    expect(attendus(ch, "les-sources")).toEqual([68.57, 80, 450, 15, 67.5]);
    expect(juste(ch, "la-meilleure-source")).toBe("La garder : c'est la source qui convertit le mieux");
  });

  it("à rebours : 20 % de plus demandent 14 400 visites, ou 1,2 %, ou 630 € de panier", () => {
    expect(juste(ch, "predire-les-visites")).toBe("20 % de visites en plus");
    const e = gardeDuCurseur(ch, "les-visites-au-curseur", 144);
    expect(e.lecture(CONSEIL, 144).map((l) => l.montant)).toEqual([75_600, 75_600, 0]);
    expect(attendus(ch, "ce-qu-il-faut")).toEqual([75_600 / (0.01 * 525), c((75_600 / (12_000 * 525)) * 100), 75_600 / (12_000 * 0.01)]);
    expect(attendus(ch, "ce-qu-il-faut")).toEqual([14_400, 1.2, 630]);
  });

  it("les frais de paiement, la marge d'une commande, le ROAS et son seuil", () => {
    expect(attendus(ch, "le-paiement-en-ligne")).toEqual([6.55, 12.85, 60 * 6.55 + 60 * 12.85, MARGE]);
    expect(attendus(ch, "le-paiement-en-ligne")[2]).toBe(1_164);
    expect(attendus(ch, "le-roas")).toEqual([c((45 * 525) / 3_600), c((4 * 525) / 1_800), c(525 / MARGE), c(4 * MARGE - 1_800)]);
    expect(attendus(ch, "le-roas")).toEqual([6.56, 1.17, 1.21, -68.8]);
    expect(juste(ch, "la-source-qui-perd")).toBe("Non : il faut 1,21, les réseaux sociaux perdent");
  });

  it("le laboratoire des liens : 5 400 € à 1,5 %, 7 200 € à 2 %, 3 600 € à 0,5 %", () => {
    expect(juste(ch, "predire-le-budget")).toBe("Pas forcément : tout dépend du clic en plus");
    const { depart, d } = gardeDuLaboratoire(ch, "le-laboratoire-des-liens");
    expect(depart).toEqual({ budget: 3_600, conversion: 1.5 });
    expect(d.solution).toEqual({ budget: 5_400, conversion: 1.5 });
    const pas = LEVIERS_DES_LIENS.budget.pas;
    const meilleur = (conv: number) => {
      let b = 0;
      for (let x = pas; x <= 7_200; x += pas) if (gainA(x, conv) > gainA(b, conv) + 1e-9) b = x;
      return b;
    };
    expect([0.005, 0.01, 0.015, 0.02, 0.025].map(meilleur)).toEqual([3_600, 5_400, 5_400, 7_200, 7_200]);
    for (const conv of [0.5, 1, 1.5, 2, 2.5]) for (let b = 0; b <= 7_200; b += pas) expect(d.atteint({ budget: b, conversion: conv }), `${b} à ${conv} %`).toBe(b === meilleur(conv / 100));
    expect([0, 1_800, 3_600, 5_400, 7_200].map((b) => gainA(b))).toEqual([0, 11_184, 15_876, 17_971.2, 17_729.28]);
    expect(lu(d.indice(depart))).toBe(lu(`600 € de plus rapporteraient encore ${(gainA(4_200) - gainA(3_600)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € une fois payés : montez le budget.`));
  });

  it("le clic en plus : 3 € puis 7,50 €, pour 6,49 € de marge ; le dernier palier perd 241,92 €", () => {
    expect(attendus(ch, "le-clic-en-plus")).toEqual([1_800 / 600, 1_800 / 240, c(0.015 * MARGE), c(240 * 0.015 * MARGE - 1_800)]);
    expect(attendus(ch, "le-clic-en-plus")).toEqual([3, 7.5, 6.49, -241.92]);
    expect(siteDuCabinet(CONSEIL).margeQuiPaieLeDernier).toBe(Math.ceil(1_800 / (240 * 0.015) - 1e-9));
    expect(siteDuCabinet(CONSEIL).margeQuiPaieLeDernier).toBe(500);
    expect(lu(juste(ch, "le-prochain-euro"))).toBe("Monter les liens à 5 400 €, pas au-delà");
  });

  it("l'hébergement : 10,8 heures de panne contre 1,08, et le serveur dédié revient moins cher", () => {
    const parHeure = c((120 * MARGE) / 2_160);
    expect(parHeure).toBe(24.04);
    expect(attendus(ch, "l-hebergement")).toEqual([c(2_160 * 0.005), c(2_160 * 0.0005), parHeure, c(90 + c(10.8 * parHeure)), c(300 + c(1.08 * parHeure))]);
    expect(attendus(ch, "l-hebergement")).toEqual([10.8, 1.08, 24.04, 349.63, 325.96]);
  });

  it("la rétractation : les particuliers seulement ; 6 commandes, 2 100 €, 1 770 € de marge, 0,95 % de conversion nette", () => {
    const tri = etape(ch, "qui-peut-se-retracter", "tri") as EtapeTri;
    expect(tri.elements(CONSEIL).map((x) => x.categorie)).toEqual(["oui", "oui", "non", "non"]);
    expect(attendus(ch, "la-retractation")).toEqual([60 * 0.1, 6 * 350, 6 * 295, c(((120 - 6) / 12_000) * 100)]);
    expect(attendus(ch, "la-retractation")).toEqual([6, 2_100, 1_770, 0.95]);
    const sites = etape(ch, "ce-qui-fait-tenir-le-site", "tri") as EtapeTri;
    expect(sites.elements(CONSEIL).map((x) => x.categorie)).toEqual(["referencement", "referencement", "hebergement", "hebergement", "communication", "communication"]);
  });

  it("la synthèse finit sur l'arène", () => {
    const e = etape(ch, "synthese", "lecture");
    expect(e.texte(CONSEIL).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });
});

describe("le cas : doubler les liens sponsorisés ?", () => {
  const s = DOUBLER_LES_LIENS_SPONSORISES;

  it("est le cas dédié du chapitre, sans cours, une réponse au bout", () => {
    gardeDuCas(s, ch);
    expect(s.commanditaire).toBe("Le directeur du cabinet");
    expect(BUDGET_PROPOSE).toBe(2);
  });

  it("le ROAS reste de 4,2 au double ; les euros ajoutés n'en ramènent que 1,84 ; le doublement gagne 241,92 € de moins que 5 400 €", () => {
    expect(attendus(s, "les-deux-budgets")).toEqual([45, c((45 * 525) / 3_600), c(3_840 * 0.015), c((57.6 * 525) / 7_200)]);
    expect(attendus(s, "les-deux-budgets")).toEqual([45, 6.56, 57.6, 4.2]);
    const roasAjoute = c(((57.6 - 45) * 525) / 3_600);
    expect(attendus(s, "les-euros-ajoutes")).toEqual([roasAjoute, c(gainA(7_200) - gainA(3_600)), c(gainA(7_200) - gainA(5_400))]);
    expect(attendus(s, "les-euros-ajoutes")).toEqual([1.84, 1_853.28, -241.92]);
    gardeDuCurseur(s, "la-marge-qui-paierait", 500);
    const r = doublementDesLiens(CONSEIL);
    expect([r.verdict, r.manqueAGagner]).toEqual(["le-meilleur-budget", c(gainA(5_400) - gainA(7_200))]);
    expect(lu(juste(s, "reponse"))).toBe("Monter à 5 400 € : le dernier palier perd");
  });
});
