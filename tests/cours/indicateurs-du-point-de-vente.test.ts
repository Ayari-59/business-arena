import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { HAUSSE_DU_PRIX_MOYEN, HAUSSE_VISEE, INDICATEURS_DU_POINT_DE_VENTE, indicateursDuPointDeVente } from "../../src/config/cours/chapitres/indicateurs-du-point-de-vente";
import { MAILLE_ET_CO } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { BAISSE_DES_ENTREES, MOINS_DE_CLIENTS_LE_MOIS_PROCHAIN, moinsDeClients } from "../../src/config/cours/situations/par-chapitre/moins-de-clients-le-mois-prochain";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES INDICATEURS DU POINT DE VENTE, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : MOINS DE CLIENTS
 * LE MOIS PROCHAIN.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de la boutique (monde/maille-et-co.ts),
 * clientèle par clientèle, sans les fonctions du chapitre ni le modèle (monde/boutique.ts). Le taux de
 * transformation est celui du BTS MCO (passages ÷ entrées), et il n'est pas le taux de service (ventes
 * ÷ demande). Les valeurs absolues sont épinglées, comme les verdicts, chaque curseur (son attendu, la
 * position voisine, ses droites aux bornes, sa lecture) et le laboratoire (sa lecture au départ et à
 * la solution). Puis les gardes de texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "boutique";
const cas = casDeLEntreprise(code);
const f = MAILLE_ET_CO;
const centime = (x: number) => Math.round(x * 100) / 100;
const dixieme = (x: number) => Math.round(x * 10) / 10;

// Le mois de janvier, refait à la main sur la fiche, clientèle par clientèle.
const CA = 600 * 55 + 360 * 75 + 90 * 135 + 330 * 35 + 150 * 25;
// Les commandes des comités d'entreprise : facturées à 45 jours, elles ne passent pas en caisse.
const COMITES = 80 * 55 + 20 * 135 + 60 * 35 + 40 * 25;
const CA_EN_CAISSE = CA - COMITES;
const ENTREES = 680 + 3_160 + 8;
const PASSAGES = 340 + 600;
const ARTICLES = 600 + 360 + 90 + 330 + 150;
const ARTICLES_EN_CAISSE = ARTICLES - (80 + 20 + 60 + 40);
// Un seul panier dans tout le cours : chiffre d'affaires encaissé en caisse ÷ passages en caisse.
const PANIER = CA_EN_CAISSE / PASSAGES;
const PRIX_MOYEN = CA_EN_CAISSE / ARTICLES_EN_CAISSE;
const VISE = centime(CA_EN_CAISSE * 1.1);
const plafond = (x: number) => Math.ceil(x - 1e-9);

function textesDe(e: Etape, c: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(c);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(c), e.repere?.(c) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(c, etat), ...e.options(c, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(c, etat), ...e.champs(c, etat).flatMap((x) => [x.libelle, x.calcul, String(x.attendu)]), ...e.explication(c, etat), ...tableau];
    case "tri":
      return [e.titre, e.question(c), ...e.categories.map((k) => k.libelle), ...e.elements(c).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(c), ...tableau];
    case "curseur": {
      const k = e.cible(c);
      const g = e.grandeur?.(c);
      const r = e.rates?.(c);
      return [e.titre, e.question(c), ...e.explication(c), ...e.lecture(c, k.attendu).map((l) => l.libelle), ...e.droites(c).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(c);
      const depart = Object.fromEntries(e.leviers(c).map((l) => [l.code, l.depart]));
      return [
        e.titre,
        e.question(c),
        d.consigne,
        d.indice(depart),
        ...e.explication(c, d.solution),
        ...e.lecture(c, d.solution).map((l) => l.libelle),
        ...e.leviers(c).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((x) => x.libelle)]),
        ...(e.graphique?.(c).courbes.map((x) => x.libelle) ?? []),
      ];
    }
    default:
      return [e.titre];
  }
}

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon). */
function verifierLesTextes(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (articles?|pulls?|références?|passages?|jours?|fournisseurs?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\bl'arène (rejoue|joue)\b/i);
    }
    if (e.tableau) {
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((x) => x.libelle)).size, e.id).toBe(champs.length);
      for (const x of champs) {
        expect(Number.isFinite(x.attendu), `${e.id} : ${x.libelle}`).toBe(true);
        expect(Math.round(x.attendu * 100) / 100, `${e.id} : ${x.libelle}`).toBe(x.attendu);
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Ce qu'un cas dédié doit tenir (tests/cours/situations.test.ts), et sa réponse qui ne se devine pas. */
function casDedie(s: Situation, ch: Chapitre) {
  expect(s.reprend).toEqual([ch.code]);
  expect(casDuChapitre(ch.code)).toBe(s);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.libre).toBe(false);
  expect(s.blocs).toEqual([]);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes[0]!.tableau).toBeDefined();
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
  for (const e of s.etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, etatVide);
    const juste = options.find((o) => o.juste)!;
    expect(juste.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, la position voisine, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  const couvre = (q: number) => d.produit(q) >= d.cout(q);
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(centime),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

/** Un laboratoire : sa lecture au départ et à la solution, par libellé. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, d, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

describe("le chapitre et son cas, à la boutique du monde du cours", () => {
  it("se jouent chez MAILLE & CO seule, au palier 2 du parcours MCO", () => {
    const ch = INDICATEURS_DU_POINT_DE_VENTE;
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(MOINS_DE_CLIENTS_LE_MOIS_PROCHAIN);
    expect(ch.parcours).toBe("mco");
    expect(ch.palier).toBe(2);
    expect(ch.entreprises?.codes).toEqual(["boutique"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    for (const b of ch.blocs) {
      const ref = referentielDeCitation(b);
      expect(ref, b).not.toBeNull();
      expect(blocOfficiel(b, ref!.code), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(f.entreprise).toBe(cas.entreprise);
  });

  it("au moins deux cycles pari, puis curseur ou laboratoire, puis formalisation ; la synthèse finit par l'arène", () => {
    const ids = INDICATEURS_DU_POINT_DE_VENTE.etapes.map((e) => e.id);
    const avant = (a: string, b: string) => expect(ids.indexOf(a), `${a} avant ${b}`).toBeLessThan(ids.indexOf(b));
    avant("predire-les-passages", "les-passages-au-curseur");
    avant("les-passages-au-curseur", "deux-leviers");
    avant("predire-les-leviers", "le-laboratoire-des-indicateurs");
    avant("le-laboratoire-des-indicateurs", "la-decomposition");
    const s = INDICATEURS_DU_POINT_DE_VENTE.etapes.at(-1)!;
    if (s.type !== "lecture") throw new Error("La synthèse est une lecture");
    expect(s.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    const intro = INDICATEURS_DU_POINT_DE_VENTE.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("L'intro est une lecture");
    expect(intro.texte(cas).join(" ")).toMatch(/simulation du cours/);
  });
});

describe("les indicateurs du point de vente : le mois de janvier", () => {
  const ch = INDICATEURS_DU_POINT_DE_VENTE;

  it("la fiche donne les chiffres de la consigne", () => {
    expect([CA, COMITES, CA_EN_CAISSE, ENTREES, PASSAGES, ARTICLES, ARTICLES_EN_CAISSE]).toEqual([87_450, 10_200, 77_250, 3_848, 940, 1_530, 1_330]);
    expect([centime(PANIER), centime(ARTICLES_EN_CAISSE / PASSAGES), centime(PRIX_MOYEN), dixieme((PASSAGES / ENTREES) * 100)]).toEqual([82.18, 1.41, 58.08, 24.4]);
    expect([CA / 120, dixieme((1_530 / 1_554) * 100)]).toEqual([728.75, 98.5]);
  });

  it("les étapes guidées : le mois en quatre chiffres, le panier, l'indice de vente, le prix moyen", () => {
    expect(attendus(ch, "le-mois")).toEqual({ "Chiffre d'affaires du mois": CA, "Passages en caisse": PASSAGES, "Articles vendus": ARTICLES, "Chiffre d'affaires au m²": CA / 120 });
    expect(attendus(ch, "le-panier")).toEqual({ "Panier moyen": centime(PANIER), "Indice de vente": centime(ARTICLES_EN_CAISSE / PASSAGES), "Prix moyen d'un article": centime(PRIX_MOYEN) });
  });

  it("les étapes autonomes : la transformation (passages ÷ entrées), le taux de service, le rayon vide", () => {
    expect(attendus(ch, "la-transformation")).toEqual({
      "Taux de transformation de la boutique (%)": dixieme((PASSAGES / ENTREES) * 100),
      "Taux de transformation des passants (%)": dixieme((600 / 3_160) * 100),
      "Taux de transformation des clientes fidèles (%)": (340 / 680) * 100,
    });
    expect(dixieme((600 / 3_160) * 100)).toBe(19);
    const demande = 600 + 384 + 90 + 330 + 150;
    expect(attendus(ch, "le-taux-de-service")).toEqual({
      "Articles demandés": demande,
      "Taux de service (%)": dixieme((ARTICLES / demande) * 100),
      "Ventes manquées": 384 - 360,
      "Chiffre d'affaires manqué": 24 * 75,
    });
    expect(juste(ch, "deux-taux")).toBe("98,5 % est le taux de service ; la transformation vaut 24,4 %");
    expect(juste(ch, "pourquoi-manquees")).toBe("Commander plus de cardigans : le rayon en a eu moins que la demande");
  });

  it("le premier cycle : les passages pariés, cherchés au curseur, puis les deux leviers formalisés", () => {
    expect(HAUSSE_VISEE).toBe(0.1);
    expect(VISE).toBe(84_975);
    expect(juste(ch, "predire-les-passages")).toBe("Environ 10 % de passages en caisse en plus");
    // PANIER × n ≥ 84 975 : n ≥ 1 034 tout juste (10 % de 940), soit 1 034 passages.
    expect(plafond(VISE / PANIER)).toBe(1_034);
    const ca = centime(1_034 * PANIER);
    expect(curseur(ch, "les-passages-au-curseur")).toEqual({
      attendu: 1_034,
      bornes: [900, 1_200],
      droites: [centime(900 * PANIER), VISE, centime(1_200 * PANIER), VISE],
      lecture: { "Chiffre d'affaires de ces passages": ca, "Objectif de la direction": VISE, "Écart à l'objectif": centime(ca - VISE), "Chiffre d'affaires gagné sur janvier": centime(ca - CA_EN_CAISSE) },
    });
    expect(attendus(ch, "deux-leviers")).toEqual({
      "Chiffre d'affaires visé en caisse": VISE,
      "Passages nécessaires, au même panier": 1_034,
      "Panier nécessaire, aux mêmes passages": centime(VISE / PASSAGES),
      "Entrées nécessaires, à la même transformation": plafond((1_034 * ENTREES) / PASSAGES),
    });
    expect([centime(VISE / PASSAGES), plafond((1_034 * ENTREES) / PASSAGES)]).toEqual([90.4, 4_233]);
    expect(juste(ch, "quel-levier")).toBe("Remplir le panier : le client est déjà là");
  });

  it("le second cycle : deux leviers pariés, le laboratoire, puis l'indice de vente à rebours", () => {
    expect(juste(ch, "predire-les-leviers")).toBe("Un peu plus de 10 % : les hausses se multiplient");
    const l = laboratoire(ch, "le-laboratoire-des-indicateurs");
    expect(l.depart).toEqual({ entrees: 0, transformation: 0, indice: 0, prix: 0 });
    expect(l.solution).toEqual({ entrees: 0, transformation: 0, indice: 10, prix: 0 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      Entrées: ENTREES,
      "Taux de transformation": 24.4,
      "Passages en caisse": PASSAGES,
      "Indice de vente": 1.41,
      "Prix moyen d'un article": 58.08,
      "Panier moyen": 82.18,
      "Chiffre d'affaires en caisse": CA_EN_CAISSE,
      "Chiffre d'affaires gagné sur janvier": 0,
    });
    expect(l.aLaSolution).toEqual({
      Entrées: ENTREES,
      "Taux de transformation": 24.4,
      "Passages en caisse": PASSAGES,
      "Indice de vente": centime((ARTICLES_EN_CAISSE / PASSAGES) * 1.1),
      "Prix moyen d'un article": 58.08,
      "Panier moyen": centime(PANIER * 1.1),
      "Chiffre d'affaires en caisse": VISE,
      "Chiffre d'affaires gagné sur janvier": centime(VISE - CA_EN_CAISSE),
    });
    expect([centime((ARTICLES_EN_CAISSE / PASSAGES) * 1.1), centime(PANIER * 1.1), centime(VISE - CA_EN_CAISSE)]).toEqual([1.56, 90.4, 7_725]);
    // Des clients en plus ne relèvent pas le défi ; deux fois 5 % sur le panier, si (1,05² = 1,1025).
    expect(l.d.atteint({ entrees: 10, transformation: 0, indice: 0, prix: 0 })).toBe(false);
    expect(l.d.atteint({ entrees: 0, transformation: 0, indice: 5, prix: 5 })).toBe(true);
    expect(l.d.atteint({ entrees: 0, transformation: 0, indice: 5, prix: 4 })).toBe(false);
    // 10 % de visiteurs en plus, transformés 10 % moins : 0,99 fois les passages ; le panier doit faire le reste.
    expect(l.d.atteint({ entrees: 10, transformation: -10, indice: 10, prix: 1 })).toBe(false);
    expect(l.d.atteint({ entrees: 10, transformation: -10, indice: 10, prix: 2 })).toBe(true);
    expect(HAUSSE_DU_PRIX_MOYEN).toBe(0.04);
    expect(attendus(ch, "la-decomposition")).toEqual({
      "Hausse de l'indice de vente (%)": dixieme((1.1 / 1.04 - 1) * 100),
      "Indice de vente visé": centime((ARTICLES_EN_CAISSE / PASSAGES) * (1.1 / 1.04)),
      "Articles à vendre dans le mois": plafond(VISE / (PRIX_MOYEN * 1.04)),
    });
    expect([dixieme((1.1 / 1.04 - 1) * 100), centime((ARTICLES_EN_CAISSE / PASSAGES) * (1.1 / 1.04)), plafond(VISE / (PRIX_MOYEN * 1.04))]).toEqual([5.8, 1.5, 1_407]);
  });

  it("l'expert : le panier qu'on aurait en comptant les comités, et le panier que l'on vise", () => {
    expect(COMITES).toBe(10_200);
    expect(attendus(ch, "le-panier-avec-les-comites")).toEqual({
      "Panier d'une commande de comité": COMITES / 8,
      "Chiffre d'affaires, comités compris": CA,
      "« Passages », comités compris": PASSAGES + 8,
      "Panier moyen du stagiaire": centime(CA / (PASSAGES + 8)),
    });
    expect([COMITES / 8, centime(CA / (PASSAGES + 8))]).toEqual([1_275, 92.25]);
    expect(juste(ch, "quel-panier-viser")).toBe("82,18 €, celui de la caisse");
    expect(indicateursDuPointDeVente(cas).deuxFoisCinq).toBe(10.3);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : moins de clients le mois prochain", () => {
  const s = MOINS_DE_CLIENTS_LE_MOIS_PROCHAIN;
  const ch = INDICATEURS_DU_POINT_DE_VENTE;
  const entrees = Math.round(ENTREES * 0.85);
  const passages = Math.round((entrees * PASSAGES) / ENTREES);

  it("a la forme d'un cas dédié", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le gérant");
    expect(BAISSE_DES_ENTREES).toBe(0.15);
  });

  it("chaque chiffre, refait à la main", () => {
    expect([entrees, passages]).toEqual([3_271, 799]);
    expect(attendus(s, "le-mois")).toEqual({ "Taux de transformation (%)": 24.4, "Panier moyen": 82.18, "Prix moyen d'un article": 58.08 });
    const ca = centime(passages * PANIER);
    expect(attendus(s, "moins-de-clients")).toEqual({
      "Entrées pendant les travaux": entrees,
      "Passages en caisse pendant les travaux": passages,
      "Chiffre d'affaires au même panier": ca,
      "Chiffre d'affaires perdu": centime(CA_EN_CAISSE - ca),
    });
    expect([ca, centime(CA_EN_CAISSE - ca)]).toEqual([65_662.5, 11_587.5]);
    expect(attendus(s, "le-panier-qui-compense")).toEqual({
      "Panier moyen nécessaire": centime(CA_EN_CAISSE / passages),
      "Hausse du panier (%)": dixieme((PASSAGES / passages - 1) * 100),
      "Indice de vente nécessaire": centime(ARTICLES_EN_CAISSE / passages),
    });
    expect([centime(CA_EN_CAISSE / passages), dixieme((PASSAGES / passages - 1) * 100), centime(ARTICLES_EN_CAISSE / passages)]).toEqual([96.68, 17.6, 1.66]);
    // 3 271 × t ÷ 1 000 × PANIER ≥ 77 250 : t ≥ 940 ÷ 3 271 × 1 000 = 287,4, soit 288 passages pour 1 000 entrées.
    expect(Math.ceil((PASSAGES / entrees) * 1_000)).toBe(288);
    const au = (t: number) => centime(((entrees * t) / 1_000) * PANIER);
    expect(curseur(s, "la-transformation-au-curseur")).toEqual({
      attendu: 288,
      bornes: [240, 320],
      droites: [au(240), CA_EN_CAISSE, au(320), CA_EN_CAISSE],
      lecture: {
        "Chiffre d'affaires en caisse du mois des travaux": au(288),
        "Chiffre d'affaires en caisse de janvier": CA_EN_CAISSE,
        "Écart sur janvier": centime(au(288) - CA_EN_CAISSE),
      },
    });
  });

  it("le verdict : il faut plus que la baisse, sur n'importe quel levier", () => {
    const x = moinsDeClients(cas);
    expect(x.verdict).toBe("il-faut-plus-que-la-baisse");
    expect([x.panierFaux, x.transformationFausse]).toEqual([centime(PANIER * 1.15), dixieme((PASSAGES / ENTREES) * 1.15 * 100)]);
    expect([centime(PANIER * 1.15), dixieme((PASSAGES / ENTREES) * 1.15 * 100)]).toEqual([94.51, 28.1]);
    expect(juste(s, "reponse")).toBe("17,6 % de panier en plus, pas 15 % : 96,68 €");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
