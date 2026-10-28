import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  DUREE_DE_STOCKAGE_VISEE,
  STOCK_DU_POINT_DE_VENTE,
  STOCK_MOYEN_PLAFOND,
  stockDeLaBoutique,
  stockDuPointDeVente,
} from "../../src/config/cours/chapitres/stock-du-point-de-vente";
import { MAILLE_ET_CO } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { ALLEGER_LE_STOCK, REDUCTION_DU_STOCK_MOYEN, allegerLeStock } from "../../src/config/cours/situations/par-chapitre/alleger-le-stock";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE STOCK DU POINT DE VENTE, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : ALLÉGER LE STOCK.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de la boutique (monde/maille-et-co.ts),
 * sans les fonctions du chapitre ni le modèle (monde/boutique.ts) : le stock de janvier référence par
 * référence, la rotation, la couverture, le stock de sécurité et le point de commande, le crédit
 * fournisseur, la variante de l'atelier local, le calcul à rebours ; le réassort du laboratoire est
 * rejoué jour par jour par une boucle écrite ici. Les valeurs absolues sont épinglées, les curseurs
 * (attendu, position voisine, droites aux bornes, lecture) et le laboratoire (départ, solution,
 * graphique) aussi, et les verdicts. Puis les gardes de texte de l'étalon (ecarts-indirects-et-ventes).
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("boutique");
const f = MAILLE_ET_CO;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;

// ─────────────────────────────────────────────────────────────────────────────
// LES GARDES DE L'ÉTALON
// ─────────────────────────────────────────────────────────────────────────────

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
      const g = e.graphique?.(c);
      return [
        e.titre,
        e.question(c),
        d.consigne,
        d.indice(depart),
        ...e.explication(c, d.solution),
        ...e.lecture(c, d.solution).map((l) => l.libelle),
        ...e.leviers(c).flatMap((l) => [l.libelle, l.unite]),
        ...(g?.courbes.map((x) => x.libelle) ?? []),
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|vingt|trente|cent) (articles?|pulls?|jours?|références?|commandes?|lignes?|passages?)\b/i);
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
      if (champs.some((x) => /^Écart/.test(x.libelle))) expect(e.question(cas, etat), e.id).toMatch(/Négatif pour un écart (favorable|défavorable)/);
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

/** Un curseur : son attendu (et sa position voisine), ses droites aux deux bornes, et sa lecture à l'attendu. */
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
  return { e, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE, REFAITE À LA MAIN
// ─────────────────────────────────────────────────────────────────────────────

// Janvier, référence par référence : au 1er janvier, livré, vendu, coût d'achat du façonnier.
const R = {
  col: { initial: 400, livre: 500, vendu: 600, cout: 25, prix: 55, cv: 28.5 },
  cardigan: { initial: 120, livre: 240, vendu: 360, cout: 34, prix: 75, demande: 384 },
  merinos: { initial: 70, livre: 60, vendu: 90, cout: 56 },
  echarpe: { initial: 350, livre: 200, vendu: 330, cout: 14 },
  bonnet: { initial: 220, livre: 0, vendu: 150, cout: 9.5 },
};
const refs = Object.values(R);
const final = (r: { initial: number; livre: number; vendu: number }) => r.initial + r.livre - r.vendu;
const valeurInitiale = refs.reduce((t, r) => t + r.initial * r.cout, 0);
const achats = refs.reduce((t, r) => t + r.livre * r.cout, 0);
const valeurFinale = refs.reduce((t, r) => t + final(r) * r.cout, 0);
const stockMoyen = (valeurInitiale + valeurFinale) / 2;
const camv = valeurInitiale + achats - valeurFinale;
const vendus = refs.reduce((t, r) => t + r.vendu, 0);
const quantiteFinale = refs.reduce((t, r) => t + final(r), 0);
// Le façonnier : livre en 21 jours, payé à 45 jours ; 7 jours de stock de sécurité.
const LIVRAISON = 21;
const PAIEMENT = 45;
const SECURITE = 7;

describe("la fiche de la boutique donne les chiffres de la consigne", () => {
  it("la fiche est bien celle que le test refait", () => {
    for (const [code, r] of [["col-rond", R.col], ["cardigan", R.cardigan], ["merinos", R.merinos], ["echarpe", R.echarpe], ["bonnet", R.bonnet]] as const) {
      const g = f.gamme.find((x) => x.code === code)!;
      expect([g.stockInitial, g.livraisons.reduce((t, l) => t + l.quantite, 0), g.ventesDuMois, g.coutDAchat], code).toEqual([r.initial, r.livre, r.vendu, r.cout]);
    }
    const fo = f.fournisseurs.find((x) => x.code === "faconnier")!;
    expect([fo.delaiDeLivraison, fo.delaiDePaiement, f.delaiDeSecurite, f.joursDuMois]).toEqual([LIVRAISON, PAIEMENT, SECURITE, 30]);
  });

  it("le stock de janvier en valeur, sa rotation, sa durée, sa couverture", () => {
    expect([valeurInitiale, achats, valeurFinale]).toEqual([24_990, 26_820, 13_485]);
    expect([stockMoyen, camv]).toEqual([19_237.5, 38_325]);
    // Le coût des vendues est aussi les ventes au coût d'achat.
    expect(refs.reduce((t, r) => t + r.vendu * r.cout, 0)).toBe(camv);
    expect(Math.round((camv / stockMoyen) * 100) / 100).toBe(1.99);
    expect(Math.round(30 / (camv / stockMoyen))).toBe(15);
    expect([vendus, quantiteFinale, vendus / 30]).toEqual([1_530, 630, 51]);
    expect(Math.round((quantiteFinale / 51) * 10) / 10).toBe(12.4);
  });
});

describe("le stock du point de vente : le chapitre", () => {
  const ch = STOCK_DU_POINT_DE_VENTE;

  it("se joue chez MAILLE & CO seule, au palier 3 du parcours MCO, avec ses blocs", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(ALLEGER_LE_STOCK);
    expect(ch.parcours).toBe("mco");
    expect(ch.palier).toBe(3);
    expect(ch.entreprises?.codes).toEqual(["boutique"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(f.entreprise).toBe(cas.entreprise);
    for (const b of ch.blocs) {
      const ref = referentielDeCitation(b);
      expect(ref, b).not.toBeNull();
      expect(blocOfficiel(b, ref!.code), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    const synthese = ch.etapes.at(-1)!;
    if (synthese.type !== "lecture") throw new Error("La synthèse est une lecture");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("les étapes guidées : le stock en valeur, le stock moyen, la rotation", () => {
    expect(attendus(ch, "le-stock-en-valeur")).toEqual({ "Stock au 1er janvier, en valeur": valeurInitiale, "Achats livrés en janvier": achats, "Stock au 31 janvier, en valeur": valeurFinale });
    expect(attendus(ch, "stock-moyen")).toEqual({ "Stock moyen": stockMoyen, "Coût d'achat des marchandises vendues": camv });
    expect(attendus(ch, "rotation")).toEqual({ "Rotation du stock": 1.99, "Durée moyenne de stockage (jours)": 15 });
    expect(juste(ch, "lire-la-rotation")).toBe("Le stock tourne plus vite : moins d'argent dort en réserve pour les mêmes ventes.");
  });

  it("les étapes autonomes : la couverture, le point de commande, le cardigan, qui finance", () => {
    expect(attendus(ch, "couverture")).toEqual({ "Ventes par jour": 51, "Couverture du stock final (jours)": 12.4, "Couverture du pull col rond (jours)": final(R.col) / (R.col.vendu / 30) });
    expect(final(R.col) / 20).toBe(15);
    const parJour = R.col.vendu / 30;
    expect(attendus(ch, "le-point-de-commande")).toEqual({ "Ventes par jour du pull col rond": parJour, "Stock de sécurité": parJour * SECURITE, "Point de commande": parJour * LIVRAISON + parJour * SECURITE });
    expect([parJour, parJour * SECURITE, parJour * (LIVRAISON + SECURITE)]).toEqual([20, 140, 560]);
    const pc = (R.cardigan.vendu / 30) * (LIVRAISON + SECURITE);
    expect(attendus(ch, "le-cardigan")).toEqual({
      "Point de commande du cardigan": pc,
      "Ventes manquées du cardigan": R.cardigan.demande - R.cardigan.vendu,
      "Chiffre d'affaires manqué": (R.cardigan.demande - R.cardigan.vendu) * R.cardigan.prix,
    });
    expect([pc, 24 * 75]).toEqual([336, 1_800]);
    // Le cardigan commence janvier sous son point de commande.
    expect(R.cardigan.initial).toBeLessThan(pc);
    // Qui finance : le façonnier, 30 jours au-delà ; les fins de série, au comptant, laissent 15 jours à la boutique.
    expect(attendus(ch, "qui-finance")).toEqual({
      "Jours financés par le façonnier au-delà du stockage": PAIEMENT - 15,
      "Jours avancés par la boutique avec les fins de série": 15 - 0,
      "Stock moyen avancé avec les fins de série": centime(stockMoyen * 0.82),
    });
    expect(centime(stockMoyen * 0.82)).toBe(15_774.75);
  });

  it("les étapes d'expert : l'atelier local, le calcul à rebours", () => {
    // L'atelier livre en 10 jours, 22 % plus cher ; même stock de sécurité, commandes de 600.
    expect(attendus(ch, "l-atelier-local")).toEqual({
      "Point de commande chez l'atelier local": 20 * 10 + 140,
      "Stock moyen d'un cycle de commande": 140 + 600 / 2,
      "Surcoût d'une commande à l'atelier local": 600 * (25 * 1.22 - 25),
    });
    expect([20 * 10 + 140, 140 + 300, 600 * 5.5]).toEqual([340, 440, 3_300]);
    expect(DUREE_DE_STOCKAGE_VISEE).toBe(10);
    const rotation = 30 / 10;
    expect(attendus(ch, "a-rebours")).toEqual({ "Rotation visée": rotation, "Stock moyen visé": camv / rotation, "Stock final à viser": 2 * (camv / rotation) - valeurFinale });
    expect([camv / rotation, 2 * (camv / rotation) - valeurFinale]).toEqual([12_775, 12_065]);
  });

  it("les verdicts : les paris, le délai court", () => {
    expect(juste(ch, "predire-le-point-de-commande")).toBe("Les ventes du délai, plus une réserve pour le retard");
    expect(juste(ch, "predire-qui-finance")).toBe("La boutique : elle paierait chaque article avant sa vente");
    expect(juste(ch, "le-delai-court")).toBe("Le délai baisse le point de commande, pas le stock moyen : c'est la taille de la commande qui l'allège");
  });

  it("les curseurs, refaits à la main : le point de commande, le délai qui finance le stock", () => {
    // Le stock restant à la livraison, p − 20 × 21, face au stock de sécurité, 140.
    expect(curseur(ch, "le-point-de-commande-au-curseur")).toEqual({
      attendu: 560,
      bornes: [300, 800],
      droites: [300 - 420, 140, 800 - 420, 140],
      lecture: {
        "Stock au moment de commander, au coût d'achat": 560 * 25,
        "Ventes du délai de livraison, au coût d'achat": 420 * 25,
        "Stock restant à la livraison, au coût d'achat": 140 * 25,
        "Chiffre d'affaires perdu avec une semaine de retard": 0,
      },
    });
    // Le crédit moyen, 38 325 ÷ 30 = 1 277,50 € par jour × d, face au stock moyen.
    const parJour = camv / 30;
    expect(parJour).toBe(1_277.5);
    const d = Math.ceil(stockMoyen / parJour);
    expect(d).toBe(16);
    expect(curseur(ch, "le-credit-au-curseur")).toEqual({
      attendu: d,
      bornes: [0, 60],
      droites: [0, stockMoyen, 60 * parJour, stockMoyen],
      lecture: { "Crédit du fournisseur, en moyenne": 16 * parJour, "Stock moyen": stockMoyen, "Stock que la boutique finance elle-même": 0 },
    });
  });

  // Le réassort du pull col rond, rejoué ici jour par jour : chaque matin la livraison attendue
  // arrive, la boutique vend 20 pulls dans la limite de son stock, et le soir, sans commande en
  // route, elle commande si son stock ne dépasse pas le point de commande ; livrée après 21 jours,
  // plus le retard, le matin du jour suivant.
  function reassort(commande: number, quantite: number, retard: number) {
    let stock = 900;
    let arrivee = 0;
    const soirs: number[] = [];
    let manque = 0;
    let rupture = 0;
    let commandes = 0;
    for (let j = 1; j <= 90; j++) {
      if (arrivee === j) {
        stock += quantite;
        arrivee = 0;
      }
      const vendu = Math.min(stock, 20);
      stock -= vendu;
      if (vendu < 20) {
        manque += 20 - vendu;
        rupture++;
      }
      if (arrivee === 0 && stock <= commande) {
        arrivee = j + LIVRAISON + retard + 1;
        commandes++;
      }
      soirs.push(stock);
    }
    return { manque, rupture, commandes, moyen: soirs.reduce((t, x) => t + x, 0) / 90, soirs };
  }

  it("le laboratoire du réassort : 7 jours de retard tenus au point de commande de 560, pas à 420", () => {
    const l = laboratoire(ch, "le-laboratoire-du-reassort");
    expect(l.depart).toEqual({ commande: 420, quantite: 600, retard: 7, jour: 45 });
    expect(l.solution).toEqual({ commande: 560, quantite: 600, retard: 7, jour: 45 });
    expect(l.reussi).toEqual([false, true]);
    const a = reassort(420, 600, 7);
    const b = reassort(560, 600, 7);
    expect([a.manque, a.rupture, a.commandes]).toEqual([280, 14, 2]);
    expect([b.manque, b.rupture, b.commandes, b.moyen]).toEqual([0, 0, 3, 390]);
    expect(b.moyen).toBeLessThanOrEqual(STOCK_MOYEN_PLAFOND);
    const lire = (r: ReturnType<typeof reassort>) => ({
      "Ventes manquées du trimestre": r.manque,
      "Jours de rupture": r.rupture,
      "Commandes passées": r.commandes,
      "Stock moyen du soir": centime(r.moyen),
      "Stock moyen, au coût d'achat": centime(centime(r.moyen) * 25),
      "Stock du soir au jour lu": r.soirs[44],
      "Marge perdue sur les ventes manquées": centime(-r.manque * (55 - 28.5)) + 0,
    });
    expect(l.auDepart).toEqual(lire(a));
    expect(l.aLaSolution).toEqual(lire(b));
    expect(l.auDepart["Marge perdue sur les ventes manquées"]).toBe(-7_420);
    // Une semaine de retard en plus du stock de sécurité, et la même solution rompt.
    expect(reassort(560, 600, 8).manque).toBe(40);
    // Une commande plus petite demande un point de commande plus haut.
    expect(reassort(560, 450, 7).manque).toBeGreaterThan(0);
    expect(reassort(700, 450, 7).manque).toBe(0);
  });

  it("le graphique du laboratoire : le stock en dents de scie, le point de commande, le stock de sécurité", () => {
    const { e } = laboratoire(ch, "le-laboratoire-du-reassort");
    const g = e.graphique!(cas);
    expect(g.levier).toBe("jour");
    expect(g.courbes.map((x) => x.libelle)).toEqual(["Stock du soir", "Point de commande", "Stock de sécurité"]);
    const [stock, pc, ss] = g.courbes;
    const a = (j: number) => stock!.valeur({ commande: 560, quantite: 600, retard: 7, jour: j });
    // Il descend de 20 par jour, touche zéro le 45 au soir, remonte à 580 le 46 (600 livrés, 20 vendus).
    expect([a(1), a(17), a(45), a(46), a(47)]).toEqual([880, 560, 0, 580, 560]);
    expect(reassort(560, 600, 7).soirs.slice(0, 50)).toEqual([...Array.from({ length: 45 }, (_, i) => 880 - 20 * i), 580, 560, 540, 520, 500]);
    // Au départ, sans stock de sécurité, la commande part le 24 et arrive le 53 : rupture du 46 au 52.
    const d = (j: number) => stock!.valeur({ commande: 420, quantite: 600, retard: 7, jour: j });
    expect([d(24), d(45), d(52), d(53)]).toEqual([420, 0, 0, 580]);
    expect(pc!.valeur({ commande: 560, quantite: 600, retard: 7, jour: 1 })).toBe(560);
    expect(ss!.valeur({ commande: 560, quantite: 600, retard: 7, jour: 1 })).toBe(140);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("alleger le stock : le cas", () => {
  const s = ALLEGER_LE_STOCK;
  const ch = STOCK_DU_POINT_DE_VENTE;
  const securite = 20 * SECURITE * 25 + 12 * SECURITE * 34 + 3 * SECURITE * 56 + 11 * SECURITE * 14 + 5 * SECURITE * 9.5;
  const vise = stockMoyen * (1 - 0.2);
  const finalVise = 2 * vise - valeurInitiale;

  it("garde la forme d'un cas dédié, chez MAILLE & CO seule", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le banquier");
    expect(s.entreprises?.codes).toEqual(["boutique"]);
    expect(REDUCTION_DU_STOCK_MOYEN).toBe(0.2);
  });

  it("le stock aujourd'hui, le stock visé : la rotation monte d'un quart, pas d'un cinquième", () => {
    expect(attendus(s, "aujourd-hui")).toEqual({ "Stock moyen": stockMoyen, "Coût d'achat des marchandises vendues": camv, "Rotation du stock": 1.99, "Durée moyenne de stockage (jours)": 15 });
    expect(attendus(s, "le-stock-vise")).toEqual({
      "Stock moyen visé": vise,
      "Trésorerie libérée": stockMoyen - vise,
      "Nouvelle rotation": Math.round((camv / vise) * 100) / 100,
      "Nouvelle durée de stockage (jours)": Math.round(30 / (Math.round((camv / vise) * 100) / 100)),
    });
    expect([vise, stockMoyen - vise, Math.round((camv / vise) * 100) / 100]).toEqual([15_390, 3_847.5, 2.49]);
  });

  it("à rebours : le stock du 31 janvier que la réduction suppose, sous les stocks de sécurité", () => {
    expect([securite, finalVise]).toEqual([8_942.5, 5_790]);
    expect(attendus(s, "la-securite")).toEqual({ "Stock du 31 janvier visé": finalVise, "Stocks de sécurité, au coût d'achat": securite, "Stock visé moins stocks de sécurité": finalVise - securite });
    expect(finalVise - securite).toBe(-3_152.5);
  });

  it("le curseur du cas : 11 % de réduction au plus ce mois-ci", () => {
    // Stock du 31 janvier = 2 × 19 237,50 × (1 − r) − 24 990, face à 8 942,50 €.
    const r = Math.floor((1 - (securite + valeurInitiale) / (2 * stockMoyen)) * 100);
    expect(r).toBe(11);
    const c = curseur(s, "la-reduction-au-curseur");
    expect(c.attendu).toBe(r);
    expect(c.bornes).toEqual([0, 40]);
    expect(c.droites).toEqual([2 * stockMoyen - valeurInitiale, securite, centime(2 * stockMoyen * 0.6 - valeurInitiale), securite]);
    expect(c.lecture["Stock moyen visé"]).toBeCloseTo(stockMoyen * 0.89, 1);
    expect(c.lecture["Trésorerie libérée"]).toBeCloseTo(stockMoyen * 0.11, 1);
    expect(c.lecture["Stock du 31 janvier visé"]).toBeCloseTo(2 * stockMoyen * 0.89 - valeurInitiale, 1);
    expect(c.lecture["Stocks de sécurité"]).toBe(securite);
    expect(allegerLeStock(cas).reductionPossible).toBe(11);
  });

  it("le verdict : pas en un mois", () => {
    expect(juste(s, "reponse")).toBe("Pas en un mois : au-delà de 11 %, le stock passerait sous la sécurité");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

describe("l'export compatible du stock d'un trimestre, pour les chapitres qui le lisent encore", () => {
  it("rend le stock du cas figé, sans rien charger de l'arène", () => {
    const st = stockDuPointDeVente(cas);
    expect(st.camv).toBe(cas.stock!.coutDAchatDesVendues);
    expect(st.rotation).toBeCloseTo(st.camv / st.stockMoyen, 2);
    expect(stockDeLaBoutique(cas).s.stockMoyen).toBe(19_237.5);
  });
});
