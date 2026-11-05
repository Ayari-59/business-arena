import { describe, expect, it } from "vitest";
import { COUT_COMPLET } from "../../src/config/cours/chapitres/cout-complet";
import { LES_COUTS_A_BASE_D_ACTIVITES, fraisDePortQuiCouvrent, janvierABC } from "../../src/config/cours/chapitres/les-couts-a-base-d-activites";
import { moisDeGestion } from "../../src/config/cours/monde/comptabilite-de-gestion";
import { ACTIVITES_DE_NOVA, methodeABC } from "../../src/config/cours/monde/couts-par-activites";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LA_REMISE_DE_SONORA, remiseDeSonora } from "../../src/config/cours/situations/par-chapitre/la-remise-de-sonora";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";

/**
 * LES COÛTS À BASE D'ACTIVITÉS : LA MÉTHODE ABC (janvier N chez NOVA) : chaque chiffre refait à la
 * main, à partir des charges de la comptabilité de gestion de janvier (loyer 19 700 €, personnel
 * 10 650 €, usure 833 €, présidente 4 200 €), des parts des 5 activités, et des ventes de janvier
 * (1 270 enceintes en ligne, 1 270 commandes et 1 270 colis ; 320 à CampusTech, 1 commande et
 * 4 palettes ; 59 € l'enceinte, un quart d'heure de montage, 38 € de charges directes).
 */

const ch = LES_COUTS_A_BASE_D_ACTIVITES;
const cent = (v: number) => (Math.sign(v) * Math.round(Number((Math.abs(v) * 100).toPrecision(15)))) / 100 + 0;

describe("la méthode ABC : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite le BTS CG P5, le DCG UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.blocs.map((b) => b.split(" · ")[0])).toEqual(["BTS CG P5", "DCG UE11", "BUT GEA"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual([COUT_COMPLET.code]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    expect(new Set(ch.etapes.map((e) => e.titre)).size).toBe(ch.etapes.length);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
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

describe("les activités et leurs inducteurs, refaits à la main", () => {
  it("chaque charge fait 100 % sur les 5 activités, et les activités retrouvent les 35 383 € des centres d'analyse", () => {
    for (const k of ["loyer", "personnel", "amortissement", "assurance", "gerante"] as const) expect(cent(ACTIVITES_DE_NOVA.reduce((t, a) => t + a.parts[k], 0)), k).toBe(1);
    const m = methodeABC();
    expect(m.total).toBe(moisDeGestion(0).repartition.total);
    expect(m.total).toBe(35_383);
    expect(cent(m.activites.reduce((t, a) => t + a.cout, 0))).toBe(35_383);
  });

  it("le coût des activités : 4 020 €, 16 540,50 €, 6 070 €, 3 310 €, 5 442,50 €", () => {
    const approvisionner = 19_700 * 0.15 + 10_650 * 0.1;
    const monter = 19_700 * 0.5 + 10_650 * 0.55 + 833;
    const expedier = 19_700 * 0.2 + 10_650 * 0.2;
    const commandes = 19_700 * 0.05 + 10_650 * 0.1 + 4_200 * 0.3;
    const administrer = 19_700 * 0.1 + 10_650 * 0.05 + 4_200 * 0.7;
    expect([approvisionner, monter, expedier, commandes, administrer].map(cent)).toEqual([4_020, 16_540.5, 6_070, 3_310, 5_442.5]);
    expect(methodeABC().activites.map((a) => a.cout)).toEqual([4_020, 16_540.5, 6_070, 3_310, 5_442.5]);
    const g = etape(ch, "le-cout-des-activites", "a-completer").grille(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.at(-1)!.cellules.map((c) => c.valeur)).toEqual([4_020, 16_540.5, 6_070, 3_310, 5_442.5, 35_383]);
  });

  it("les inducteurs : 1 590 jeux, 397,5 heures, 1 274 envois, 1 271 commandes, 938,10 centaines d'euros ; leur coût au centime", () => {
    const m = methodeABC();
    expect(m.activites.map((a) => a.volume)).toEqual([1_590, 1_590 * 0.25, 1_270 + 4, 1_270 + 1, (1_590 * 59) / 100]);
    expect(m.activites.map((a) => a.coutDeLInducteur)).toEqual([cent(4_020 / 1_590), cent(16_540.5 / 397.5), cent(6_070 / 1_274), cent(3_310 / 1_271), cent(5_442.5 / 938.1)]);
    expect(m.activites.map((a) => a.coutDeLInducteur)).toEqual([2.53, 41.61, 4.76, 2.6, 5.8]);
    expect(incoherencesDuTableau(etape(ch, "le-cout-des-inducteurs", "a-completer").grille(NOVA))).toEqual([]);
    expect(triDe(ch, "les-inducteurs")).toEqual({
      "Commander et réceptionner les composants (jeu de composants reçu)": "volume",
      "Monter et tester les enceintes (heure de montage)": "volume",
      "Préparer et expédier les envois (envoi expédié)": "hors-volume",
      "Traiter les commandes et le service client (commande reçue)": "hors-volume",
      "Diriger et administrer (100 € de chiffre d'affaires)": "volume",
    });
  });
});

describe("le coût des deux produits, et la comparaison", () => {
  it("en ligne : 30 117,42 € de charges indirectes, 61,71 € l'enceinte ; CampusTech : 5 255,08 €, 54,42 €", () => {
    const enLigne = 1_270 * 2.53 + 317.5 * 41.61 + 1_270 * 4.76 + 1_270 * 2.6 + 749.3 * 5.8;
    const campustech = 320 * 2.53 + 80 * 41.61 + 4 * 4.76 + 1 * 2.6 + 188.8 * 5.8;
    expect([enLigne, campustech].map(cent)).toEqual([30_117.42, 5_255.08]);
    const { enLigne: l, campustech: c, m } = janvierABC();
    expect([l.indirectes, c.indirectes]).toEqual([30_117.42, 5_255.08]);
    expect([l.coutDeRevient, c.coutDeRevient]).toEqual([cent(30_117.42 + 1_270 * 38), cent(5_255.08 + 320 * 38)]);
    expect([cent(l.unitaire), cent(c.unitaire)]).toEqual([61.71, 54.42]);
    // Les coûts d'inducteur arrondis laissent 10,50 € des activités sans produit.
    expect(m.arrondi).toBe(-10.5);
    expect(incoherencesDuTableau(etape(ch, "le-cout-des-produits", "a-completer").grille(NOVA))).toEqual([]);
  });

  it("par les centres d'analyse : 60,25 € pour les deux ; les résultats de janvier par les deux méthodes", () => {
    const { campustech: c, centres } = janvierABC();
    expect(cent(centres)).toBe(60.25);
    expect(cent(moisDeGestion(0).coutDeRevientUnitaire)).toBe(60.25);
    expect(cent(c.centres.unitaire)).toBe(60.25);
    // 22 € de composants + 15,62 € par 100 € d'achats, 16 €, 12,57 € par enceinte, 10,59 € par 100 € de chiffre d'affaires.
    expect(cent(320 * (22 + 0.22 * 15.62 + 16 + 12.57 + 0.59 * 10.59))).toBe(c.centres.coutDeRevient);
    expect(attendus(ch, "la-comparaison")).toEqual([-3_447.42, 1_464.92, -1_593.22, -401.44]);
    expect(juste(ch, "le-subventionnement")).toEqual(["CampusTech portait des coûts de la vente en ligne"]);
    expect(juste(ch, "predire-le-cout")).toEqual(["Plus que celle de CampusTech"]);
  });

  it("le laboratoire : 2,80 € de frais de port selon la méthode ABC, 1,50 € selon les centres", () => {
    expect(fraisDePortQuiCouvrent(1)).toBe(2.8);
    expect(fraisDePortQuiCouvrent(0)).toBe(1.5);
    expect(methodeABC({ fraisDePort: 2.7 }).produits["en-ligne"].resultat).toBeLessThan(0);
    expect(methodeABC({ fraisDePort: 2.8 }).produits["en-ligne"].resultat).toBeGreaterThanOrEqual(0);
    gardeDuLaboratoire(ch, "le-laboratoire-des-frais-de-port");
  });

  it("CampusTech livrée chaque jour : 16 envois de plus à 4,76 €", () => {
    const indirectes = cent(5_255.08 + 16 * 4.76);
    expect(attendus(ch, "la-livraison-chaque-jour")).toEqual([indirectes, cent(indirectes + 12_160), cent((indirectes + 12_160) / 320)]);
    expect(juste(ch, "les-limites")).toEqual(["Non : le loyer et la paie restent"]);
  });
});

describe("le cas dédié : la remise de Sonora", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LA_REMISE_DE_SONORA);
    gardeDuCas(LA_REMISE_DE_SONORA, ch);
    for (const e of LA_REMISE_DE_SONORA.etapes) if (e.type === "a-completer") expect(incoherencesDuTableau(e.grille(NOVA))).toEqual([]);
  });

  it("400 enceintes à 56,05 €, 1 commande, 1 envoi : 6 480,72 € de charges indirectes, 739,28 € de résultat ; −1 556,84 € par les centres", () => {
    const indirectes = 400 * 2.53 + 100 * 41.61 + 4.76 + 2.6 + 224.2 * 5.8;
    expect(cent(indirectes)).toBe(6_480.72);
    const n = remiseDeSonora();
    expect([n.prix, n.v.indirectes, n.v.coutDeRevient, n.v.resultat]).toEqual([56.05, 6_480.72, cent(6_480.72 + 400 * 38), cent(22_420 - 6_480.72 - 15_200)]);
    expect(n.v.resultat).toBe(739.28);
    expect(cent(400 * (22 + 0.22 * 15.62 + 16 + 12.57 + 0.5605 * 10.59))).toBe(n.v.centres.coutDeRevient);
    expect(n.v.centres.resultat).toBe(-1_556.84);
    expect(attendus(LA_REMISE_DE_SONORA, "le-resultat-de-la-commande")).toEqual([21_680.72, 739.28, -1_556.84]);
    expect(juste(LA_REMISE_DE_SONORA, "reponse").map((t) => t.replace(/\s/g, " "))).toEqual(["Non : la commande laisse 739,28 €"]);
  });
});
