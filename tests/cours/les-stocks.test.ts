import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { HAUSSE_DE_LA_SECONDE_LIVRAISON, LES_STOCKS, LE_MOIS_QUI_SUIT, LE_SINISTRE, METHODES_DU_LABORATOIRE } from "../../src/config/cours/chapitres/les-stocks";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CAS_DES_ENTREPRISES } from "../../src/config/cours/monde/cas-des-entreprises";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { DEMARQUE_DU_SECTEUR, LE_STOCK_QUI_MANQUE, TAUX_DE_DEMARQUE } from "../../src/config/cours/situations/par-chapitre/le-stock-qui-manque";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";

/**
 * LES STOCKS ET LEUR CAS « LE STOCK QUI MANQUE », DANS LE MONDE DU COURS.
 *
 * Chaque chiffre attendu est refait ici à la main sur le trimestre figé de chaque entreprise du
 * chapitre (monde/cas-des-entreprises.ts : MAILLE & CO et PIXEL & CO), sans les fonctions du chapitre
 * ni le modèle (monde/stock.ts) : l'arrêté au coût moyen de période, le curseur des ventes, la fiche
 * du mois qui suit dans les trois méthodes, le curseur du prix qui sépare les méthodes, le
 * laboratoire et son graphique, le sinistre retrouvé par le taux de marque ; puis le cas, son calcul à
 * rebours et son curseur. Les valeurs sont épinglées, les verdicts aussi, et les gardes de texte de
 * l'étalon tiennent dans chaque entreprise.
 */

const etatVide: EtatDuCours = { soldes: {} };
const CODES = LES_STOCKS.entreprises!.codes;
/** L'arrondi au centime, sans l'erreur des flottants sur les demis. */
const centime = (x: number) => Math.round((x + Number.EPSILON * Math.sign(x)) * 100) / 100 + 0;
const dizaine = (x: number) => Math.round(x / 10) * 10;
/** Un montant comme le cours l'écrit : « 524,16 € », « 1 404 € ». */
const euros = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 })} €`;

// ─────────────────────────────────────────────────────────────────────────────
// LE TRIMESTRE ET LE MOIS QUI SUIT, REFAITS À LA MAIN
// ─────────────────────────────────────────────────────────────────────────────

function trimestreALaMain(c: Cas) {
  const s = c.stock!;
  const Q0 = s.initial.quantite;
  const V0 = s.initial.valeur;
  const qa = s.achats.quantite;
  const p = s.achats.prixUnitaire;
  const achats = centime(qa * p);
  const v = s.vendues;
  const cump = centime((V0 + achats) / (Q0 + qa));
  const qf = Q0 + qa - v;
  const sf = centime(qf * cump);
  const cout = centime(V0 + achats - sf);
  const marge = centime(s.ventes.ht - cout);
  return { s, Q0, V0, qa, p, achats, v, cump, qf, sf, cout, marge, variation: centime(V0 - sf), taux: marge / s.ventes.ht };
}

/** Le mois qui suit : deux livraisons d'un sixième des achats, deux séries de ventes d'un sixième des ventes, la seconde livraison relevée de 2 €. */
function moisALaMain(c: Cas, prix2?: number, livraison2?: number) {
  const t = trimestreALaMain(c);
  const QE = dizaine(t.qa / 6);
  const QS = dizaine(t.v / 6);
  const p1 = t.p;
  const p2 = prix2 ?? p1 + 2;
  const Q2 = livraison2 ?? QE;
  const c0 = t.sf / t.qf;
  const total = centime(t.sf + QE * p1 + Q2 * p2);
  const qTotal = t.qf + QE + Q2;
  const qf = qTotal - 2 * QS;
  const ventes = centime(2 * QS * t.s.ventes.prixUnitaire);
  // Le coût moyen de la période.
  const cPeriode = centime(total / qTotal);
  const finalPeriode = centime(qf * cPeriode);
  // Le coût moyen après chaque entrée.
  const c1 = centime((t.sf + QE * p1) / (t.qf + QE));
  const s1 = centime(QS * c1);
  const v1 = centime(t.sf + QE * p1 - s1);
  const c2 = centime((v1 + Q2 * p2) / (t.qf + QE - QS + Q2));
  const s2 = centime(QS * c2);
  const finalApres = centime(v1 + Q2 * p2 - s2);
  // Le PEPS : les lots dans l'ordre, le stock du début d'abord.
  const lots = [
    { q: t.qf, prix: c0 },
    { q: QE, prix: p1 },
  ];
  const sortir = (q: number) => {
    let reste = q;
    let valeur = 0;
    while (reste > 0) {
      const lot = lots[0]!;
      const pris = Math.min(reste, lot.q);
      valeur += pris * lot.prix;
      lot.q -= pris;
      reste -= pris;
      if (lot.q === 0) lots.shift();
    }
    return centime(valeur);
  };
  const peps1 = sortir(QS);
  lots.push({ q: Q2, prix: p2 });
  const peps2 = sortir(QS);
  const finalPeps = centime(lots.reduce((x, l) => x + l.q * l.prix, 0));
  const marge = (final: number) => centime(ventes - (total - final));
  return {
    t,
    QE,
    QS,
    p1,
    p2,
    Q2,
    total,
    qf,
    ventes,
    periode: { cout: cPeriode, final: finalPeriode, marge: marge(finalPeriode) },
    apres: { c1, s1, c2, s2, final: finalApres, marge: marge(finalApres) },
    peps: { s1: peps1, s2: peps2, final: finalPeps, marge: marge(finalPeps) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES OUTILS DES GARDES (ceux de l'étalon)
// ─────────────────────────────────────────────────────────────────────────────

function textesDe(e: Etape, c: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(c);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(c), e.repere?.(c) ?? "", ...tableau];
    case "ecriture":
      return [e.titre, e.evenement(c), ...e.indices(c), ...e.explication(c, etat), ...e.ecriture(c).lignes.flatMap((l) => [l.role, l.indice])];
    case "choix":
      return [e.titre, e.question(c, etat), ...e.options(c, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(c, etat), ...e.champs(c, etat).flatMap((x) => [x.libelle, x.calcul, String(x.attendu)]), ...e.explication(c, etat), ...tableau];
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

function verifierLesTextes(ch: Chapitre, cas: Cas) {
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/de l'arène|l'arène (rejoue|joue|garde)/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|trente|cent) (unités?|jours?|mois|livraisons?|lots?|euros?)\b/i);
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

const etapeDe = <T extends Etape>(ch: Chapitre, id: string) => {
  const e = ch.etapes.find((x) => x.id === id);
  if (!e) throw new Error(`${ch.code} : pas d'étape ${id}`);
  return e as T;
};
const attendus = (ch: Chapitre, id: string, cas: Cas) => Object.fromEntries(etapeDe<EtapeMontants>(ch, id).champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
const juste = (ch: Chapitre, id: string, cas: Cas) => etapeDe<EtapeChoix>(ch, id).options(cas, etatVide).find((o) => o.juste)!.texte;

function curseur(ch: Chapitre, id: string, cas: Cas) {
  const e = etapeDe<EtapeCurseur>(ch, id);
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  const couvre = (q: number) => d.produit(q) - d.cout(q) >= -1e-9;
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

const BLOCS = [
  ["BTS CG P2 · Contrôle et production de l'information financière", "bts-cg"],
  ["DCG UE9 · Comptabilité", "dcg"],
  ["BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation", "but-gea"],
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

describe("les stocks : le chapitre, au monde du cours", () => {
  it("s'ouvre exactement dans les entreprises qui ont un stock de marchandises : MAILLE & CO et PIXEL & CO", () => {
    expect(CODES).toEqual(["boutique", "ecommerce"]);
    for (const code of ENTREPRISES_DU_COURS) {
      const cas = casDeLEntreprise(code);
      // Des marchandises : achetées au compte 607 pour être revendues. Le stock du bâtiment, acheté
      // au compte 601, est un chantier en cours, qui se compte autrement.
      expect(cas.stock !== null && cas.achat.compte.startsWith("607"), code).toBe(CODES.includes(code));
    }
    expect(LES_STOCKS.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
  });

  it("au palier 3 de la comptabilité générale, avec ses blocs, au gabarit de l'étalon", () => {
    const ch = LES_STOCKS;
    expect(CHAPITRES).toContain(ch);
    expect(ch.palier).toBe(3);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.libre).toBe(false);
    expect(ch.blocs).toEqual(BLOCS.map(([b]) => b));
    for (const [b, ref] of BLOCS) {
      expect(referentielDeCitation(b)?.code, b).toBe(ref);
      expect(blocOfficiel(b, ref), b).not.toBeNull();
    }
    expect(new Set(ch.etapes.map((e) => e.id)).size).toBe(ch.etapes.length);
    expect(ch.etapes.filter((e) => e.id.startsWith("predire-")).map((e) => e.id)).toEqual(["predire-le-cout-des-ventes", "predire-la-methode"]);
    expect(ch.etapes.filter((e) => e.type === "curseur").map((e) => e.id)).toEqual(["vendre-ce-qu-on-achete", "le-prix-qui-separe-les-methodes"]);
    const labo = etapeDe<EtapeSimulation>(ch, "le-laboratoire-des-methodes");
    const cas = casDeLEntreprise("boutique");
    expect(labo.leviers(cas).find((l) => l.code === "methode")!.choix!.map((x) => x.valeur)).toEqual([0, 1, 2]);
    expect(labo.graphique).toBeDefined();
    for (const id of ["le-peps-du-mois", "le-cmup-apres-chaque-entree", "le-stock-sinistre"]) expect(etapeDe<EtapeMontants>(ch, id).champs(cas, etatVide).length, id).toBeGreaterThanOrEqual(3);
    const fin = ch.etapes.at(-1)!;
    if (fin.type !== "lecture") throw new Error("lecture attendue");
    expect(fin.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("les hypothèses du chapitre et du cas sont des constantes nommées", () => {
    expect(LE_MOIS_QUI_SUIT).toEqual({ partDUneLivraison: 1 / 6, partDUneSerieDeVentes: 1 / 6, jours: { livraison1: 3, ventes1: 14, livraison2: 17, ventes2: 28 } });
    expect(HAUSSE_DE_LA_SECONDE_LIVRAISON).toBe(2);
    expect(METHODES_DU_LABORATOIRE).toEqual({ cmupPeriode: 0, cmupApresChaqueEntree: 1, peps: 2 });
    expect(LE_SINISTRE).toEqual({ partDuTrimestre: 0.5, partSauvee: 0.25 });
    expect([TAUX_DE_DEMARQUE, DEMARQUE_DU_SECTEUR]).toEqual([0.02, 0.01]);
  });

  it("les chiffres épinglés : le trimestre, le mois qui suit dans les trois méthodes", () => {
    const b = trimestreALaMain(casDeLEntreprise("boutique"));
    expect([b.cump, b.qf, b.sf, b.cout, b.marge, b.variation]).toEqual([24.96, 1_073, 26_782.08, 114_827.92, 140_481.57, 727.92]);
    const e = trimestreALaMain(casDeLEntreprise("ecommerce"));
    expect([e.cump, e.qf, e.sf, e.cout, e.marge, e.variation]).toEqual([27, 2_575, 69_525, 86_481, 112_105, -15_525]);
    const mb = moisALaMain(casDeLEntreprise("boutique"));
    expect([mb.QE, mb.QS, mb.p2, mb.qf, mb.ventes]).toEqual([760, 770, 27, 1_053, 85_454.6]);
    expect(mb.periode).toEqual({ cout: 25.57, final: 26_925.21, marge: 46_077.73 });
    expect(mb.apres).toEqual({ c1: 24.98, s1: 19_234.6, c2: 25.82, s2: 19_881.4, final: 27_186.08, marge: 46_338.6 });
    expect(mb.peps).toEqual({ s1: 19_219.2, s2: 19_237.88, final: 27_845, marge: 46_997.52 });
    expect(moisALaMain(casDeLEntreprise("boutique"), 25).periode.marge).toBe(46_976.46);
    const me = moisALaMain(casDeLEntreprise("ecommerce"));
    expect([me.QE, me.QS, me.p2, me.qf, me.ventes]).toEqual([630, 530, 29, 2_775, 65_720]);
    expect(me.periode).toEqual({ cout: 27.33, final: 75_840.75, marge: 36_755.75 });
    expect(me.apres).toEqual({ c1: 27, s1: 14_310, c2: 27.38, s2: 14_511.4, final: 75_983.6, marge: 36_898.6 });
    expect(me.peps).toEqual({ s1: 14_310, s2: 14_310, final: 76_185, marge: 37_100 });
    expect(moisALaMain(casDeLEntreprise("ecommerce"), 27).periode.marge).toBe(37_100);
  });
});

describe.each(CODES)("les stocks chez %s, refaits à la main", (code) => {
  const cas = casDeLEntreprise(code);
  const ch = LES_STOCKS;
  const t = trimestreALaMain(cas);
  const m = moisALaMain(cas);

  it("le cas vient du monde du cours, et le modèle retrouve son coût moyen et son stock final", () => {
    expect(cas).toEqual(CAS_DES_ENTREPRISES[code]);
    expect([t.cump, t.sf, t.cout]).toEqual([cas.stock!.cump, cas.stock!.final.valeur, cas.stock!.coutDAchatDesVendues]);
  });

  it("l'inventaire et la marge du trimestre", () => {
    expect(attendus(ch, "inventaire", cas)).toEqual({
      "Stock final, en unités": t.qf,
      "Coût moyen pondéré d'une unité": t.cump,
      "Valeur du stock final": t.sf,
      "Coût d'achat des marchandises vendues": t.cout,
    });
    expect(attendus(ch, "marge", cas)).toEqual({
      "Coût d'achat des marchandises vendues": t.cout,
      "Marge commerciale": t.marge,
      "Taux de marque, en %": centime(t.taux * 100),
    });
    // Le coût des ventes = achats + variation.
    expect(centime(t.achats + t.variation)).toBe(t.cout);
  });

  it("le curseur des ventes : le coût des ventes atteint les achats quand le stock retrouve sa valeur initiale", () => {
    const attendu = Math.ceil(t.Q0 + t.qa - t.V0 / t.cump - 1e-9);
    const min = Math.floor((t.qa * 0.7) / 100) * 100;
    const max = Math.floor((t.Q0 + t.qa) / 100) * 100;
    const cout = (q: number) => centime(t.V0 + t.achats - (t.Q0 + t.qa - q) * t.cump);
    expect(curseur(ch, "vendre-ce-qu-on-achete", cas)).toEqual({
      attendu,
      bornes: [min, max],
      droites: [cout(min), t.achats, cout(max), t.achats],
      lecture: {
        "Coût d'achat des marchandises vendues": cout(attendu),
        "Achats du trimestre": t.achats,
        "Stock final": centime((t.Q0 + t.qa - attendu) * t.cump),
        "Variation des stocks (6037)": centime(t.V0 - (t.Q0 + t.qa - attendu) * t.cump),
      },
    });
    expect(attendu).toBe({ boutique: 4_572, ecommerce: 3_778 }[code]);
    // Le pari : le coût des ventes est au-dessus des achats si le stock a baissé.
    expect(juste(ch, "predire-le-cout-des-ventes", cas)).toBe(t.variation > 0 ? "Plus élevé : les ventes ont puisé dans le stock du début" : "Plus faible : une part des achats reste en stock");
  });

  it("le curseur du prix qui sépare les méthodes : le PEPS l'emporte dès que la seconde livraison coûte autant que les unités anciennes", () => {
    const min = Math.round((t.p - 3) * 100);
    const max = Math.round((t.p + 5) * 100);
    const stocks = (k: number) => {
      const x = moisALaMain(cas, k / 100);
      return { peps: x.peps.final, cmup: (x.qf * x.total) / (t.qf + 2 * x.QE) };
    };
    let attendu = min;
    while (stocks(attendu).peps < stocks(attendu).cmup - 1e-9) attendu++;
    expect(attendu).toBe({ boutique: 2_497, ecommerce: 2_700 }[code]);
    const r = curseur(ch, "le-prix-qui-separe-les-methodes", cas);
    expect(r.attendu).toBe(attendu);
    expect(r.bornes).toEqual([min, max]);
    expect(r.droites).toEqual([stocks(min).peps, stocks(min).cmup, stocks(max).peps, stocks(max).cmup].map(centime));
    expect(r.lecture).toEqual({
      "Stock final en PEPS": stocks(attendu).peps,
      "Stock final au coût moyen de la période": centime(stocks(attendu).cmup),
      "Écart entre les deux méthodes": centime(stocks(attendu).peps - stocks(attendu).cmup),
    });
    // Au-dessus du croisement, l'écart grandit avec le prix : le PEPS suit les derniers lots.
    expect(stocks(max).peps - stocks(max).cmup).toBeGreaterThan(stocks(attendu).peps - stocks(attendu).cmup);
    expect(juste(ch, "predire-la-methode", cas)).toBe("Le PEPS : le stock final est fait des derniers lots, les plus chers");
  });

  it("la fiche du mois en PEPS, puis au coût moyen après chaque entrée", () => {
    expect(attendus(ch, "le-peps-du-mois", cas)).toEqual({
      "Sortie du 14": m.peps.s1,
      "Sortie du 28": m.peps.s2,
      "Coût d'achat des marchandises vendues du mois": centime(m.peps.s1 + m.peps.s2),
      "Stock final, en PEPS": m.peps.final,
    });
    expect(centime(m.peps.s1 + m.peps.s2 + m.peps.final)).toBe(m.total);
    expect(attendus(ch, "le-cmup-apres-chaque-entree", cas)).toEqual({
      "Coût moyen après la livraison du 3": m.apres.c1,
      "Sortie du 14": m.apres.s1,
      "Coût moyen après la livraison du 17": m.apres.c2,
      "Stock final, au coût moyen après chaque entrée": m.apres.final,
    });
    // En hausse de prix : PEPS > coût moyen après chaque entrée > coût moyen de la période.
    expect(m.peps.final).toBeGreaterThan(m.apres.final);
    expect(m.apres.final).toBeGreaterThan(m.periode.final);
  });

  it("le laboratoire des méthodes : la marge du mois tenue malgré la hausse, en PEPS", () => {
    const e = etapeDe<EtapeSimulation>(ch, "le-laboratoire-des-methodes");
    const d = e.defi(cas);
    const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
    expect(depart).toEqual({ methode: 0, prix: m.p2, unites: m.QE });
    expect(d.solution).toEqual({ methode: 2, prix: m.p2, unites: m.QE });
    expect([d.atteint(depart), d.atteint(d.solution)]).toEqual([false, true]);
    const sans = moisALaMain(cas, t.p).periode.marge;
    const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
    const ligne = (x: { final: number; marge: number }) => ({
      "Stock final, en unités": m.qf,
      "Valeur du stock final": x.final,
      "Coût d'achat des marchandises vendues du mois": centime(m.total - x.final),
      "Marge du mois": x.marge,
      "Marge face au mois sans hausse, au coût moyen de période": centime(x.marge - sans),
    });
    expect(lire(depart)).toEqual(ligne(m.periode));
    expect(lire({ ...d.solution })).toEqual(ligne(m.peps));
    expect(lire({ methode: 1, prix: m.p2, unites: m.QE })).toEqual(ligne(m.apres));
    // Le coût moyen après chaque entrée ne relève pas le défi ; ni baisser le prix, ni réduire la livraison ne sont permis.
    expect(d.atteint({ methode: 1, prix: m.p2, unites: m.QE })).toBe(false);
    expect(d.atteint({ methode: 0, prix: t.p, unites: m.QE })).toBe(false);
    expect(d.atteint({ methode: 0, prix: m.p2, unites: 0 })).toBe(false);
    // Le graphique : la marge en PEPS ne bouge pas avec le prix de la seconde livraison ; au coût moyen, elle baisse.
    const g = e.graphique!(cas);
    expect(g.levier).toBe("prix");
    const [periode, apres, peps] = g.courbes;
    for (const prix of [t.p - 2, t.p, m.p2, t.p + 5]) {
      const x = moisALaMain(cas, prix);
      expect(periode!.valeur({ methode: 0, prix, unites: m.QE }), `${prix}`).toBe(x.periode.marge);
      expect(apres!.valeur({ methode: 0, prix, unites: m.QE }), `${prix}`).toBe(x.apres.marge);
      expect(peps!.valeur({ methode: 0, prix, unites: m.QE }), `${prix}`).toBe(m.peps.marge);
    }
    expect(periode!.valeur({ methode: 0, prix: t.p + 5, unites: m.QE })).toBeLessThan(periode!.valeur({ methode: 0, prix: t.p, unites: m.QE }));
  });

  it("le sinistre du 15 février, retrouvé par le taux de marque", () => {
    const achetees = Math.round(t.qa / 2);
    const vendues = Math.round(t.v / 2);
    const ventes = centime(vendues * t.s.ventes.prixUnitaire);
    const taux = Math.round(t.taux * 100) / 100;
    const cout = centime(ventes * (1 - taux));
    const stock = centime(t.V0 + achetees * t.p - cout);
    expect(attendus(ch, "le-stock-sinistre", cas)).toEqual({
      "Coût d'achat des ventes, estimé par le taux de marque": cout,
      "Stock le jour du sinistre": stock,
      "Valeur du stock détruit": centime(stock * 0.75),
    });
    expect(etapeDe<EtapeMontants>(ch, "le-stock-sinistre").question(cas, etatVide)).toMatch(/^Le 15 février, un dégât des eaux/);
    expect({ boutique: [0.55, 20_327.16], ecommerce: [0.56, 45_975.33] }[code]).toEqual([taux, centime(stock * 0.75)]);
  });

  it("les verdicts : l'effet sur le résultat, la méthode et la marge, l'inventaire permanent", () => {
    expect(juste(ch, "effet-sur-le-resultat", cas)).toBe(`${t.variation < 0 ? "Plus élevé" : "Plus faible"}, de ${euros(Math.abs(t.variation))}.`);
    expect(juste(ch, "la-methode-et-la-marge", cas)).toBe("La marge n'est pas meilleure, la hausse attend dans le stock ; et une méthode ne se change pas pour embellir un mois");
    expect(juste(ch, "inventaire-permanent", cas)).toBe("Oui : la fiche donne le stock théorique, le comptage le stock réel, et l'écart révèle la démarque");
    expect(etapeDe<EtapeChoix>(ch, "la-methode-et-la-marge").question(cas, etatVide)).toContain(`plus forte de ${euros(centime(m.peps.marge - m.periode.marge))}`);
  });

  it("chaque écriture s'équilibre et se corrige juste ; le résultat du chapitre est la marge commerciale", () => {
    for (const e of ch.etapes) {
      if (e.type !== "ecriture") continue;
      const x = e.ecriture(cas);
      expect(equilibree(enEcriture(x)), e.id).toBe(true);
      for (const l of x.lignes) expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
      expect(corriger(enSaisie(x), x).juste, e.id).toBe(true);
    }
    const fin = etatAvant(ch, cas, ch.etapes.length).soldes;
    expect(fin["6037"]).toBeCloseTo(t.variation, 2);
    expect(compteDeResultat(fin).resultat).toBeCloseTo(t.marge, 2);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch, cas));
});

describe("les stocks : le stock final passé à l'envers est refusé", () => {
  it("il entre au bilan, au débit", () => {
    const cas = casDeLEntreprise("boutique");
    const etape = etapeDe(LES_STOCKS, "constatation-stock-final");
    if (etape.type !== "ecriture") throw new Error("écriture attendue");
    const c = corriger(
      [
        { compte: "6037", debit: "26782,08", credit: "" },
        { compte: "37", debit: "", credit: "26782,08" },
      ],
      etape.ecriture(cas),
    );
    expect(c.juste).toBe(false);
    expect(c.remarques.join(" ")).toContain("se passe au débit");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LE CAS
// ─────────────────────────────────────────────────────────────────────────────

function casDedie(s: Situation, ch: Chapitre, cas: Cas) {
  expect(s.reprend).toEqual([ch.code]);
  expect(casDuChapitre(ch.code)).toBe(s);
  expect(SITUATIONS).toContain(s);
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
    const j = options.find((o) => o.juste)!;
    expect(j.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

describe.each(CODES)("le stock qui manque chez %s, refait à la main", (code) => {
  const s = LE_STOCK_QUI_MANQUE;
  const cas = casDeLEntreprise(code);
  const t = trimestreALaMain(cas);
  const manquantes = Math.round(t.qf * 0.02);
  const comptees = t.qf - manquantes;
  const valeurComptee = centime(comptees * t.cump);
  const coutReel = centime(t.V0 + t.achats - valeurComptee);
  const margeAnnoncee = centime(t.s.ventes.ht - coutReel);
  const demarque = centime(t.sf - valeurComptee);
  const norme = centime(t.s.ventes.ht * 0.01);
  const limite = Math.floor(norme / t.cump);

  it("les chiffres épinglés", () => {
    expect({ boutique: [21, 1_052, 26_257.92, 139_957.41, 524.16, 102], ecommerce: [52, 2_523, 68_121, 110_701, 1_404, 73] }[code]).toEqual([
      manquantes,
      comptees,
      valeurComptee,
      margeAnnoncee,
      demarque,
      limite,
    ]);
  });

  it("le théorique, puis le calcul à rebours de la marge annoncée au stock compté", () => {
    expect(attendus(s, "le-theorique", cas)).toEqual({
      "Stock théorique, en unités": t.qf,
      "Coût moyen pondéré d'une unité": t.cump,
      "Valeur du stock théorique": t.sf,
      "Marge théorique": t.marge,
    });
    expect(attendus(s, "a-rebours", cas)).toEqual({
      "Coût d'achat des marchandises vendues, d'après la marge annoncée": centime(t.s.ventes.ht - margeAnnoncee),
      "Valeur du stock compté": valeurComptee,
      "Unités comptées": comptees,
      "Unités manquantes": manquantes,
    });
    // Le rebours retombe sur des unités entières, et l'écart de marge est le coût de la démarque.
    expect(centime((t.V0 + t.achats - (t.s.ventes.ht - margeAnnoncee)) / t.cump)).toBe(comptees);
    expect(centime(t.marge - margeAnnoncee)).toBe(demarque);
  });

  it("les écritures d'inventaire avec le stock compté", () => {
    for (const e of s.etapes) {
      if (e.type !== "ecriture") continue;
      const x = e.ecriture(cas);
      expect(equilibree(enEcriture(x)), e.id).toBe(true);
      expect(corriger(enSaisie(x), x).juste, e.id).toBe(true);
    }
    const fin = etatAvant(s, cas, s.etapes.length).soldes;
    expect(fin["6037"]).toBeCloseTo(t.V0 - valeurComptee, 2);
    expect(fin["37"]).toBeCloseTo(valeurComptee - t.V0, 2);
  });

  it("le curseur de la norme : le plus grand nombre d'unités manquantes dans 1 % des ventes", () => {
    const max = Math.max(10, Math.ceil((2 * limite) / 10) * 10);
    expect(curseur(s, "la-norme-du-secteur", cas)).toEqual({
      attendu: limite,
      bornes: [0, max],
      droites: [norme, 0, norme, centime(max * t.cump)],
      lecture: { "Coût de la démarque": centime(limite * t.cump), "Norme du secteur": norme, "Marge commerciale après démarque": centime(t.marge - limite * t.cump) },
    });
    expect(manquantes).toBeLessThanOrEqual(limite);
  });

  it("la réponse : la démarque au coût d'achat, dans la norme ; la bonne option ne se devine pas", () => {
    expect(juste(s, "reponse", cas)).toBe(`Il manque ${manquantes} unités : ${euros(demarque)} de marge, dans la norme du secteur`);
    casDedie(s, LES_STOCKS, cas);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s, cas));
});
