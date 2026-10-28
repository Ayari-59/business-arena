import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  COEFFICIENT_TTC_DU_CONCURRENT,
  COMMERCES,
  ENTREPRISES_DU_POINT_DE_VENTE,
  MARGE_VISEE_DU_LABORATOIRE,
  TAUX_DE_MARQUE,
  margesDuRayon,
} from "../../src/config/cours/chapitres/taux-de-marque";
import { MAILLE_ET_CO } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { L_ETIQUETTE_DU_CONCURRENT, PRIX_PROPOSE_PAR_LE_FACONNIER, etiquetteDuConcurrent } from "../../src/config/cours/situations/par-chapitre/l-etiquette-du-concurrent";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { champJuste } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * TAUX DE MARQUE, TAUX DE MARGE, COEFFICIENT, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS :
 * L'ÉTIQUETTE DU CONCURRENT.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de la boutique (monde/maille-et-co.ts),
 * sans les fonctions du chapitre ni le modèle (monde/boutique.ts) : la demande qui répond au prix
 * aussi (une droite, à l'article près en dessous). Les valeurs absolues sont épinglées, comme les
 * verdicts, chaque curseur (son attendu, la position voisine, ses droites aux bornes, sa lecture) et le
 * laboratoire (sa lecture au départ et à la solution, sa courbe en quelques points). Puis les gardes de
 * texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "boutique";
const cas = casDeLEntreprise(code);
const f = MAILLE_ET_CO;
const col = f.gamme.find((r) => r.code === "col-rond")!;
const centime = (x: number) => Math.round(x * 100) / 100;
const dixieme = (x: number) => Math.round(x * 10) / 10;
/** La demande du pull col rond au prix p, refaite à la main : une droite, à l'article près en dessous. */
const demande = (p: number) => Math.floor(600 * (1 - 1.5 * ((p - 55) / 55)) + 1e-9);

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
    const ch = TAUX_DE_MARQUE;
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(L_ETIQUETTE_DU_CONCURRENT);
    expect(ch.code).toBe("taux-de-marque-et-coefficient");
    expect(ch.parcours).toBe("mco");
    expect(ch.palier).toBe(2);
    expect(ch.entreprises?.codes).toEqual(["boutique"]);
    expect(ENTREPRISES_DU_POINT_DE_VENTE).toEqual(["boutique"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    for (const b of ch.blocs) {
      const ref = referentielDeCitation(b);
      expect(ref, b).not.toBeNull();
      expect(blocOfficiel(b, ref!.code), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(f.entreprise).toBe(cas.entreprise);
    // L'export gardé pour les chapitres encore joués dans l'arène.
    expect(COMMERCES).toEqual(["boutique", "ecommerce", "bistrot"]);
  });

  it("au moins deux cycles pari, puis curseur, puis formalisation ; un laboratoire ; la synthèse finit par l'arène", () => {
    const ids = TAUX_DE_MARQUE.etapes.map((e) => e.id);
    const avant = (a: string, b: string) => expect(ids.indexOf(a), `${a} avant ${b}`).toBeLessThan(ids.indexOf(b));
    avant("predire-l-etiquette", "l-etiquette-de-l-atelier");
    avant("l-etiquette-de-l-atelier", "le-prix-du-plus-cher");
    avant("predire-le-prix-d-achat", "le-prix-d-achat-au-curseur");
    avant("le-prix-d-achat-au-curseur", "garder-la-marque-ou-la-marge");
    expect(TAUX_DE_MARQUE.etapes.filter((e) => e.type === "simulation")).toHaveLength(1);
    const s = TAUX_DE_MARQUE.etapes.at(-1)!;
    if (s.type !== "lecture") throw new Error("La synthèse est une lecture");
    expect(s.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    // Les hypothèses de la simulation sont dites dans l'intro.
    const intro = TAUX_DE_MARQUE.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("L'intro est une lecture");
    expect(intro.texte(cas).join(" ")).toMatch(/simulation du cours/);
    expect(intro.texte(cas).join(" ")).toMatch(/1,5 %/);
  });
});

describe("taux de marque, taux de marge, coefficient : le pull col rond", () => {
  const ch = TAUX_DE_MARQUE;

  it("la fiche donne les chiffres de la consigne", () => {
    expect([col.prixTtc, col.prixHt, col.coutDAchat, col.ventesDuMois, col.tauxTva]).toEqual([66, 55, 25, 600, 0.2]);
    expect([55 - 25, (55 - 25) * 600]).toEqual([30, 18_000]);
    expect([dixieme((30 / 55) * 100), dixieme((30 / 25) * 100), 55 / 25, 66 / 25]).toEqual([54.5, 120, 2.2, 2.64]);
  });

  it("les étapes guidées attendent ce que la fiche donne", () => {
    expect(attendus(ch, "marge-commerciale")).toEqual({ "Marge commerciale d'un pull": 30, "Marge commerciale du mois": 18_000 });
    expect(attendus(ch, "les-deux-taux")).toEqual({ "Taux de marque (%)": 54.5, "Taux de marge (%)": 120 });
    expect(attendus(ch, "coefficient")).toEqual({ "Coefficient HT": 2.2, "Étiquette TTC": 55 * 1.2, "Coefficient TTC": 2.64 });
    expect(juste(ch, "qui-a-raison")).toBe("Les deux : l'une parle du taux de marque, l'autre du taux de marge.");
  });

  it("les étapes autonomes : la gamme, d'un taux à l'autre, le fournisseur moins cher", () => {
    const ca = 600 * 55 + 360 * 75 + 90 * 135 + 330 * 35 + 150 * 25;
    const achats = 600 * 25 + 360 * 34 + 90 * 56 + 330 * 14 + 150 * 9.5;
    expect([ca, achats, ca - achats]).toEqual([87_450, 38_325, 49_125]);
    expect(attendus(ch, "la-marge-de-la-gamme")).toEqual({
      "Chiffre d'affaires HT du mois": ca,
      "Coût d'achat des articles vendus": achats,
      "Marge commerciale de la gamme": ca - achats,
      "Taux de marque de la boutique (%)": dixieme(((ca - achats) / ca) * 100),
    });
    expect(dixieme(((ca - achats) / ca) * 100)).toBe(56.2);
    // La moyenne non pondérée des cinq taux surestime la marque de la boutique.
    const moyenne = (30 / 55 + 41 / 75 + 79 / 135 + 21 / 35 + 15.5 / 25) / 5;
    expect(dixieme(moyenne * 100)).toBe(57.9);
    expect(juste(ch, "le-taux-de-la-boutique")).toBe("56,2 % : la marge de la gamme sur ses ventes");
    // L'écharpe : 21 € de marge sur 35 €, 60 % de marque.
    expect(attendus(ch, "d-un-taux-a-l-autre")).toEqual({ "Taux de marge (%)": (60 / 40) * 100, "Coefficient multiplicateur HT": 100 / 40 });
    expect(attendus(ch, "moins-cher")).toEqual({
      "Prix d'achat des fins de série": 25 * 0.82,
      "Taux de marque (%)": dixieme(((55 - 20.5) / 55) * 100),
      "Marge commerciale du mois": (55 - 20.5) * 600,
    });
    expect([25 * 0.82, dixieme(((55 - 20.5) / 55) * 100), (55 - 20.5) * 600]).toEqual([20.5, 62.7, 20_700]);
    expect(juste(ch, "le-vrai-prix")).toBe("Payer plus tôt et ne pas pouvoir réassortir");
  });

  it("le premier cycle : l'étiquette de l'atelier local, pariée, cherchée au curseur, puis calculée", () => {
    expect(juste(ch, "predire-l-etiquette")).toBe("De 22 %, comme le prix d'achat");
    const achat = centime(25 * 1.22);
    expect(achat).toBe(30.5);
    // La marge de l'étiquette p (TTC) couvre le taux de marque dès que p ÷ 1,2 × 25 ÷ 55 ≥ 30,50 : p ≥ 80,52.
    const croisement = (30.5 * 1.2 * 55) / 25;
    expect(centime(croisement)).toBe(80.52);
    expect(curseur(ch, "l-etiquette-de-l-atelier")).toEqual({
      attendu: 81,
      bornes: [66, 90],
      droites: [centime(66 / 1.2 - 30.5), centime((66 / 1.2) * (30 / 55)), centime(90 / 1.2 - 30.5), centime((90 / 1.2) * (30 / 55))],
      lecture: {
        "Prix de vente hors taxes": 67.5,
        "Prix d'achat chez l'atelier local": 30.5,
        "Marge commerciale d'un pull": 37,
        "Marge que demande le taux de marque d'aujourd'hui": centime(67.5 * (30 / 55)),
      },
    });
    expect([centime(66 / 1.2 - 30.5), centime((90 / 1.2) * (30 / 55))]).toEqual([24.5, 40.91]);
    const prix = centime(30.5 / (25 / 55));
    expect(attendus(ch, "le-prix-du-plus-cher")).toEqual({
      "Prix d'achat chez l'atelier local": 30.5,
      "Prix de vente HT qui garde le taux de marque": prix,
      "Étiquette TTC": centime(prix * 1.2),
      "Coefficient TTC de l'atelier local": centime((prix * 1.2) / 30.5),
    });
    expect([prix, centime(prix * 1.2), centime((prix * 1.2) / 30.5)]).toEqual([67.1, 80.52, 2.64]);
    // La question donne le taux arrondi, 54,5 % : l'élève qui le garde trouve 30,50 ÷ 0,455 = 67,03 € HT et
    // 80,44 € TTC. Sa réponse est juste ; une vraie erreur (le taux de marge, ou 60 %) reste refusée.
    const champs = (ch.etapes.find((x) => x.id === "le-prix-du-plus-cher") as EtapeMontants).champs(cas, etatVide);
    const champ = (libelle: string) => champs.find((x) => x.libelle === libelle)!;
    expect([centime(30.5 / (1 - 0.545)), centime(centime(30.5 / (1 - 0.545)) * 1.2)]).toEqual([67.03, 80.44]);
    expect(champJuste("67,03", champ("Prix de vente HT qui garde le taux de marque"))).toBe(true);
    expect(champJuste("80,44", champ("Étiquette TTC"))).toBe(true);
    expect(champJuste("67,10", champ("Prix de vente HT qui garde le taux de marque"))).toBe(true);
    expect(champJuste("66,98", champ("Prix de vente HT qui garde le taux de marque"))).toBe(false);
    expect(champJuste("76,25", champ("Prix de vente HT qui garde le taux de marque"))).toBe(false);
    // L'étiquette monte exactement comme le prix d'achat.
    expect(centime(80.52 / 66)).toBe(1.22);
  });

  it("l'expert : le coefficient du concurrent, à rebours", () => {
    expect(COEFFICIENT_TTC_DU_CONCURRENT).toBe(2.4);
    expect(f.concurrent.prixTtc).toBe(60);
    expect(attendus(ch, "le-coefficient-du-concurrent")).toEqual({
      "Prix d'achat du concurrent, hors taxes": 60 / 2.4,
      "Coefficient HT du concurrent": 2.4 / 1.2,
      "Taux de marque du concurrent (%)": (1 - 1 / 2) * 100,
    });
    expect([60 / 2.4, 2.4 / 1.2]).toEqual([25, 2]);
  });

  it("le second cycle : s'aligner, parier sur le prix d'achat, le chercher au curseur, puis garder la marque ou la marge", () => {
    expect(demande(50)).toBe(681);
    expect(attendus(ch, "le-prix-aligne")).toEqual({
      "Prix aligné, hors taxes": 60 / 1.2,
      "Pulls demandés au prix aligné": 681,
      "Taux de marque au prix aligné (%)": 50,
      "Marge commerciale du mois, alignée": 681 * 25,
    });
    expect(681 * 25).toBe(17_025);
    expect(juste(ch, "predire-le-prix-d-achat")).toBe("Moins que pour garder le taux de marque : le prix bas fait vendre plus");
    // 681 × (50 − a) ≥ 18 000 : a ≤ 50 − 26,43… = 23,568 €, soit 2 356 centimes au plus.
    expect(Math.floor((50 - 18_000 / 681) * 100)).toBe(2_356);
    expect(curseur(ch, "le-prix-d-achat-au-curseur")).toEqual({
      attendu: 2_356,
      bornes: [2_000, 2_600],
      droites: [681 * 30, 18_000, 681 * 24, 18_000],
      lecture: {
        "Prix d'achat négocié": 23.56,
        "Marge commerciale d'un pull": 26.44,
        "Marge commerciale du mois, alignée": centime(681 * 26.44),
        "Marge commerciale de janvier": 18_000,
      },
    });
    expect(centime(681 * 26.44)).toBe(18_005.64);
    const marque = centime(50 * (25 / 55));
    expect(attendus(ch, "garder-la-marque-ou-la-marge")).toEqual({
      "Prix d'achat qui garde le taux de marque": marque,
      "Prix d'achat qui garde la marge du mois": 23.56,
      "Baisse qui garde le taux de marque (%)": dixieme(((25 - marque) / 25) * 100),
      "Baisse qui garde la marge du mois (%)": dixieme(((25 - 23.56) / 25) * 100),
    });
    expect([marque, dixieme(((25 - marque) / 25) * 100), dixieme(((25 - 23.56) / 25) * 100)]).toEqual([22.73, 9.1, 5.8]);
  });

  it("le laboratoire des prix : l'atelier local retrouve au moins 15 000 € entre le prix de janvier et celui qui garde le taux", () => {
    const l = laboratoire(ch, "le-laboratoire-des-prix");
    expect(MARGE_VISEE_DU_LABORATOIRE).toBe(15_000);
    expect(l.depart).toEqual({ prix: 55, fournisseur: 1 });
    expect(l.reussi).toEqual([false, true]);
    const fournisseur = l.e.leviers(cas).find((x) => x.code === "fournisseur")!;
    expect(fournisseur.choix).toEqual([
      { valeur: 1, libelle: "Façonnier de référence" },
      { valeur: 2, libelle: "Fins de série" },
      { valeur: 3, libelle: "Atelier local" },
    ]);
    // La meilleure position de l'atelier local sur la grille du prix (de 45 € à 75 €, par 0,10 €), refaite à la main.
    const marge = (p: number, achat: number) => centime(Math.min(demande(p), 900) * centime(p - achat));
    const grille = Array.from({ length: 301 }, (_, i) => centime(45 + i * 0.1));
    const meilleur = (achat: number) => grille.reduce((m, p) => (marge(p, achat) > marge(m, achat) ? p : m), 45);
    expect([meilleur(30.5), marge(meilleur(30.5), 30.5), demande(60.8)]).toEqual([60.8, 15_301.5, 505]);
    expect([meilleur(25), marge(meilleur(25), 25)]).toEqual([58.3, 18_181.8]);
    expect(l.solution).toEqual({ prix: 60.8, fournisseur: 3 });
    expect(l.auDepart).toEqual({
      "Prix d'achat d'un pull": 25,
      "Pulls demandés dans le mois": 600,
      "Taux de marque": 54.5,
      "Marge commerciale d'un pull": 30,
      "Marge commerciale du mois": 18_000,
      "Marge du mois gagnée sur janvier": 0,
    });
    expect(l.aLaSolution).toEqual({
      "Prix d'achat d'un pull": 30.5,
      "Pulls demandés dans le mois": 505,
      "Taux de marque": dixieme((30.3 / 60.8) * 100),
      "Marge commerciale d'un pull": 30.3,
      "Marge commerciale du mois": 505 * 30.3,
      "Marge du mois gagnée sur janvier": centime(505 * 30.3 - 18_000),
    });
    // Ni le prix de janvier, ni le prix qui garde le taux de marque ne relèvent le défi.
    expect([marge(55, 30.5), demande(67.1), marge(67.1, 30.5)]).toEqual([14_700, 402, 14_713.2]);
    expect(l.d.atteint({ prix: 55, fournisseur: 3 })).toBe(false);
    expect(l.d.atteint({ prix: 67.1, fournisseur: 3 })).toBe(false);
    expect(l.d.atteint({ prix: 60.8, fournisseur: 1 })).toBe(false);
    // La courbe de la marge du mois, en quelques points, et la marge de janvier en repère.
    const [courbe, repere] = l.e.graphique!(cas).courbes;
    expect(l.e.graphique!(cas).levier).toBe("prix");
    expect([courbe!.valeur({ prix: 55, fournisseur: 1 }), courbe!.valeur({ prix: 50, fournisseur: 1 }), courbe!.valeur({ prix: 67.1, fournisseur: 3 }), courbe!.valeur({ prix: 55, fournisseur: 2 })]).toEqual([
      18_000, 17_025, 14_713.2, 20_700,
    ]);
    expect(repere!.valeur({ prix: 70, fournisseur: 3 })).toBe(18_000);
  });

  it("la critique du taux : il est gardé, pas la marge", () => {
    expect(juste(ch, "la-critique-du-taux")).toBe("Le taux est gardé, pas la marge : 14 713,20 € au lieu de 15 301,50 € vers 60,80 €");
  });

  it("le modèle du chapitre retombe sur la fiche", () => {
    const m = margesDuRayon(cas);
    expect([m.margeDuMoisDeJanvier, m.achatQuiGardeLaMarque, m.achatQuiGardeLaMarge, m.ventesQuiGardentLaMarge]).toEqual([18_000, 22.73, 23.56, Math.ceil(18_000 / 25)]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : l'étiquette du concurrent", () => {
  const s = L_ETIQUETTE_DU_CONCURRENT;
  const ch = TAUX_DE_MARQUE;

  it("a la forme d'un cas dédié", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("La gérante");
    expect(PRIX_PROPOSE_PAR_LE_FACONNIER).toBe(24);
  });

  it("chaque chiffre, refait à la main", () => {
    expect(attendus(s, "au-prix-du-concurrent")).toEqual({ "Prix du concurrent, hors taxes": 50, "Pulls vendus au prix aligné": 681, "Taux de marque au prix proposé (%)": ((50 - 24) / 50) * 100 });
    expect(attendus(s, "la-marge-alignee")).toEqual({
      "Marge du mois d'aujourd'hui": 18_000,
      "Marge du mois alignée, au prix proposé": 681 * 26,
      "Marge perdue chaque mois": 18_000 - 681 * 26,
    });
    expect([681 * 26, 18_000 - 681 * 26]).toEqual([17_706, 294]);
    // 26 × q ≥ 18 000 : q ≥ 692,3, soit 693 pulls ; la demande en donne 681.
    expect(curseur(s, "les-ventes-au-curseur")).toEqual({
      attendu: 693,
      bornes: [600, 800],
      droites: [600 * 26, 18_000, 800 * 26, 18_000],
      lecture: {
        "Marge d'un pull aligné, au prix proposé": 26,
        "Marge du mois à ces ventes": 693 * 26,
        "Marge du mois de janvier": 18_000,
        "Marge gagnée sur janvier": 693 * 26 - 18_000,
      },
    });
    expect(attendus(s, "a-rebours")).toEqual({
      "Prix d'achat qui garde la marge du mois": 23.56,
      "Baisse à obtenir en plus de l'offre": centime(24 - 23.56),
      "Pulls à vendre au prix proposé": Math.ceil(18_000 / 26),
    });
    expect(centime(24 - 23.56)).toBe(0.44);
  });

  it("le verdict : pas à ce prix ; le bon critère est la marge du mois", () => {
    const x = etiquetteDuConcurrent(cas);
    expect(x.verdict).toBe("pas-a-ce-prix");
    expect([x.ventesQuiManquent, x.margeDesVentesEnPlus]).toEqual([693 - 681, 81 * 26]);
    expect(juste(s, "reponse")).toBe("Pas à 24 € : il faut 23,56 € au plus, ou garder notre prix");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
