import { describe, expect, it } from "vitest";
import {
  LE_COUT_COMPLET_PAS_A_PAS,
  coutCompletDeDecembre,
  laboratoireDuStock,
  meilleureMethode,
} from "../../src/config/cours/chapitres/le-cout-complet-pas-a-pas";
import { COUT_COMPLET } from "../../src/config/cours/chapitres/cout-complet";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { LE_DEPANNAGE_DU_GROSSISTE, depannageDuGrossiste } from "../../src/config/cours/situations/par-chapitre/le-depannage-du-grossiste";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * LE COÛT COMPLET PAS À PAS (décembre N chez NOVA) : chaque chiffre refait à la main, à partir de la
 * fiche (loyer 19 700 €, personnel 10 650 €, usure 833 €, assurance 500 €, gérante 4 200 € ; les clés
 * de janvier ; 1 500 jeux à 22 € le 10 décembre, 1 500 à 23 € le 18 ; les bons de sortie 1 000 et
 * 1 410 jeux ; 2 400 enceintes livrées à 59 € ; 16 € d'autres charges directes par enceinte).
 */

const ch = LE_COUT_COMPLET_PAS_A_PAS;
const x = coutCompletDeDecembre(NOVA);
/** L'arrondi au centime d'un énoncé : la moitié monte, sur la valeur décimale (pas sur son approximation binaire). */
const cent = (v: number) => (Math.sign(v) * Math.round(Number((Math.abs(v) * 100).toPrecision(15)))) / 100 + 0;

describe("le coût complet pas à pas : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite le BTS CG, le DCG UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.blocs.map((b) => b.split(" · ")[0])).toEqual(["BTS CG P5", "DCG UE11", "BUT GEA"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["cout-complet", "les-stocks"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(4);
    expect(ch.objectifs.length).toBeLessThanOrEqual(6);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
  });

  it("le chapitre « Coût complet » y mène, par « Et ensuite »", () => {
    expect(COUT_COMPLET.ensuite).toEqual([ch.code]);
    expect(suitesDuChapitre("cout-complet").ensuite).toEqual([{ code: ch.code, titre: "Le coût complet pas à pas" }]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const e of chapitreDuCas(ch, NOVA).etapes) {
      if (e.type !== "choix") continue;
      const o = e.options(NOVA, VIDE);
      const bonne = o.find((k) => k.juste)!;
      expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
    }
  });
});

describe("le tableau de répartition de décembre, refait à la main", () => {
  it("la répartition primaire : chaque charge par ses clés", () => {
    const g = etape(ch, "repartition-primaire", "a-completer").grille(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const total = g.lignes.at(-1)!.cellules.map((c) => c.valeur);
    const entretien = 19_700 * 0.05 + 10_650 * 0.05 + 833 * 0.1;
    const administration = 19_700 * 0.1 + 10_650 * 0.15 + 833 * 0.05 + 4_200 * 0.7;
    const approvisionnement = 19_700 * 0.15 + 10_650 * 0.1 + 833 * 0.05;
    const production = 19_700 * 0.5 + 10_650 * 0.5 + 833 * 0.75 + 500 * 0.8;
    const distribution = 19_700 * 0.2 + 10_650 * 0.2 + 833 * 0.05 + 500 * 0.2 + 4_200 * 0.3;
    expect(total).toEqual([35_883, 1_600.8, 6_549.15, 4_061.65, 16_199.75, 7_471.65]);
    expect([entretien, administration, approvisionnement, production, distribution].map(cent)).toEqual(total.slice(1));
  });

  it("les prestations réciproques tombent juste : E = (1 600,80 + 10 % × 6 549,15) ÷ 0,98", () => {
    const e = (1_600.8 + 0.1 * 6_549.15) / (1 - 0.1 * 0.2);
    expect(cent(e)).toBe(2_301.75);
    expect(cent(6_549.15 + 0.2 * 2_301.75)).toBe(7_009.5);
    expect(attendus(ch, "prestations-reciproques")).toEqual([2_301.75, 7_009.5]);
  });

  it("la répartition secondaire : les trois centres principaux, et les auxiliaires vides", () => {
    const g = etape(ch, "repartition-secondaire", "a-completer").grille(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const appro = 4_061.65 + 0.2 * 7_009.5;
    const prod = 16_199.75 + 0.6 * 2_301.75 + 0.4 * 7_009.5;
    const dist = 7_471.65 + 0.2 * 2_301.75 + 0.3 * 7_009.5;
    expect([appro, prod, dist].map(cent)).toEqual([5_463.55, 20_384.6, 10_034.85]);
    expect(g.lignes.at(-1)!.cellules.map((c) => c.valeur)).toEqual([35_883, 0, 0, 5_463.55, 20_384.6, 10_034.85]);
    // Une cession négative dans la colonne de son centre : le signe moins s'écrit.
    expect(g.lignes[1]!.cellules[1]!.valeur).toBe(-2_301.75);
  });

  it("les unités d'œuvre : 675 (67 500 € d'achats ÷ 100), 2 400 enceintes, 1 416 (141 600 € ÷ 100), et leur coût au centime", () => {
    const g = etape(ch, "unites-d-oeuvre", "a-completer").grille(NOVA);
    expect(g.lignes[2]!.cellules.map((c) => c.valeur)).toEqual([675, 2_400, 1_416]);
    expect(g.lignes[3]!.cellules.map((c) => c.valeur)).toEqual([cent(5_463.55 / 675), cent(20_384.6 / 2_400), cent(10_034.85 / 1_416)]);
    expect(g.lignes[3]!.cellules.map((c) => c.valeur)).toEqual([8.09, 8.49, 7.09]);
    expect(g.lignes[1]!.cellules.map((c) => c.texte)).toEqual(["100 € d'achats de composants", "une enceinte produite", "100 € de chiffre d'affaires"]);
  });
});

describe("le stock et la chaîne des coûts, refaits à la main", () => {
  it("le coût d'achat des deux livraisons : le prix et 8,09 € par 100 € d'achats", () => {
    expect([1_500 * 22 + 330 * 8.09, 1_500 * 23 + 345 * 8.09].map(cent)).toEqual([35_669.7, 37_291.05]);
    const g = etape(ch, "cout-d-achat", "a-completer").grille(NOVA);
    expect(g.lignes[3]!.cellules.map((c) => c.valeur)).toEqual([35_669.7, 37_291.05, 72_960.75]);
  });

  it("la fiche de stock au coût moyen pondéré de la période : 24,32 €, des sorties de 58 611,20 €, 590 jeux pour 14 348,80 €, 0,75 € d'arrondi", () => {
    const cmup = cent(72_960.75 / 3_000);
    expect(cmup).toBe(24.32);
    const sorties = 1_000 * cmup + 1_410 * cmup;
    expect(cent(sorties)).toBe(58_611.2);
    expect(cent(590 * cmup)).toBe(14_348.8);
    expect(cent(72_960.75 - 58_611.2 - 14_348.8)).toBe(0.75);
    const g = etape(ch, "fiche-de-stock", "a-completer").grille(NOVA);
    expect(g.lignes.at(-1)!.cellules.map((c) => c.valeur)).toEqual([590, 24.32, 14_348.8]);
    expect(g.lignes.find((l) => l.libelle === "Écart d'arrondi du coût moyen")!.cellules[2]!.valeur).toBe(0.75);
    // Les bons : 1 400 jeux consommés le 24 (la fiche de la clôture), 1 410 sur le bon.
    expect(x.sortie24.quantite).toBe(1_410);
  });

  it("le coût de production, le coût de revient et le résultat de décembre", () => {
    const production = 58_611.2 + 2_400 * 16 + 2_400 * 8.49;
    expect(cent(production)).toBe(117_387.2);
    const revient = production + 1_416 * 7.09;
    expect(cent(revient)).toBe(127_426.64);
    expect(cent(2_400 * 59 - revient)).toBe(14_173.36);
    expect([x.d.coutDeProduction, x.d.coutDeRevient, x.d.resultat]).toEqual([117_387.2, 127_426.64, 14_173.36]);
  });

  it("la variante : rebuts, déchets et sous-produit, et le résultat de chaque produit", () => {
    const rebuts = 25 * 24.32;
    const valeurDeRealisation = 2_400 * 1.2 - (2_400 * 0.2 + 600);
    expect([rebuts, 3 * 140, 60 * 5, valeurDeRealisation].map(cent)).toEqual([608, 420, 300, 1_800]);
    const production = 117_387.2 + 608 + 420 - 300 - 1_800;
    expect(cent(production)).toBe(116_315.2);
    expect(cent(141_600 - (production + 10_039.44))).toBe(15_245.36);
    const g = etape(ch, "resultat-par-produit", "a-completer").grille(NOVA);
    expect(g.lignes.at(-1)!.cellules.map((c) => c.valeur)).toEqual([15_245.36, 0, 15_245.36]);
    expect(attendus(ch, "valeur-de-realisation")).toEqual([2_880, 1_080, 1_800]);
  });

  it("les bonnes réponses : garder la fiche, les rebuts restent dans le coût des bonnes, le premier entré premier sorti", () => {
    expect(juste(ch, "les-bons-de-sortie")).toEqual(["Il la garde : l'inventaire physique tranchera"]);
    expect(juste(ch, "les-rebuts")).toEqual(["Restent dans le coût des bonnes enceintes"]);
    expect(juste(ch, "le-pari-de-la-methode")).toEqual(["Le premier entré, premier sorti"]);
  });
});

describe("le curseur et le laboratoire", () => {
  it("le curseur des grilles : 1,25 € par grille contre 600 € + 0,20 € par grille, à partir de 572 grilles", () => {
    expect(600 / (1.2 + 0.05 - 0.2)).toBeCloseTo(571.43, 2);
    gardeDuCurseur(ch, "le-seuil-des-grilles", 572);
  });

  it("le laboratoire : un grossiste à 25 €, le premier entré premier sorti donne le meilleur résultat, seule solution", () => {
    // Au coût moyen de la période, à 25 € : 705 unités d'œuvre à 7,75 €, un coût moyen de 25,32 €.
    const disponible = 1_500 * 22 + 330 * 7.75 + 1_500 * 25 + 375 * 7.75;
    expect(cent(disponible)).toBe(75_963.75);
    expect(cent(141_600 - (2_410 * 25.32 + 38_400 + 20_376 + 10_039.44))).toBe(11_763.36);
    // Au premier entré, premier sorti : 1 000 + 500 jeux du 10 décembre, 910 du 18.
    const peps = (1_500 * 22 + 330 * 7.75) / 1_500 * 1_500 + (910 * (1_500 * 25 + 375 * 7.75)) / 1_500;
    expect(cent(peps)).toBe(60_070.63);
    expect(laboratoireDuStock(2, 25).resultat).toBe(cent(141_600 - (60_070.63 + 38_400 + 20_376 + 10_039.44)));
    expect(laboratoireDuStock(0, 25).resultat).toBe(11_763.36);
    expect(meilleureMethode(25).methode).toBe("peps");
    gardeDuLaboratoire(ch, "le-laboratoire-du-stock");
  });
});

describe("le cas dédié : le dépannage du grossiste", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LE_DEPANNAGE_DU_GROSSISTE);
    gardeDuCas(LE_DEPANNAGE_DU_GROSSISTE, ch);
    for (const e of LE_DEPANNAGE_DU_GROSSISTE.etapes) if (e.type === "a-completer") expect(incoherencesDuTableau(e.grille(NOVA))).toEqual([]);
  });

  it("au prix habituel : 660 unités à 8,28 €, un coût moyen de 23,82 €, 15 378,36 € de résultat ; 1 205 € sur décembre, 295 € en stock", () => {
    expect(cent(5_463.55 / 660)).toBe(8.28);
    const disponible = 2 * (1_500 * 22 + 330 * 8.28);
    expect(cent(disponible)).toBe(71_464.8);
    expect(cent(disponible / 3_000)).toBe(23.82);
    const resultat = 141_600 - (2_410 * 23.82 + 38_400 + 20_376 + 10_039.44);
    expect(cent(resultat)).toBe(15_378.36);
    const n = depannageDuGrossiste(NOVA);
    expect([n.sans.resultat, n.surLeResultat, n.dansLeStock, n.surcoutDesAchats]).toEqual([15_378.36, 1_205, cent(14_348.8 - 590 * 23.82), 1_500]);
    expect(n.surLeResultat + n.dansLeStock).toBe(1_500);
    const r = etape(LE_DEPANNAGE_DU_GROSSISTE, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["Non : 1 205 € sur décembre, le reste est en stock"]);
  });
});
