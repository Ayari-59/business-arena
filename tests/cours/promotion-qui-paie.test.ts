import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  GAIN_DU_DEFI,
  PROMOTION_QUI_PAIE,
  REMISES_DU_RAYON_PLEIN,
  SOLUTION_DU_LABORATOIRE,
  issueDeLaPromotion,
  optionsDuPourquoi,
  promotion,
  promotionA,
} from "../../src/config/cours/chapitres/promotion-qui-paie";
import { MAILLE_ET_CO } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { HAUSSE_ATTENDUE, JUSQU_OU_REMISER } from "../../src/config/cours/situations/par-chapitre/jusqu-ou-remiser";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LA PROMOTION QUI PAIE, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : JUSQU'OÙ REMISER ?
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de la boutique (monde/maille-et-co.ts),
 * sans les fonctions du chapitre ni le modèle (monde/boutique.ts) : la demande en ligne droite de la
 * remise (à l'unité inférieure), les ventes bornées par le rayon, le prix payé au centime. Les valeurs
 * absolues sont épinglées, la variante rayon plein et les calculs à rebours refaits comme le reste, les
 * verdicts aussi. Les trois issues de l'étape `pourquoi` (la promotion paie ; la demande suit sans
 * atteindre le volume nécessaire ; l'offre bloque) sont vérifiées aux trois positions qui les produisent.
 * Puis les gardes de texte de l'étalon.
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "boutique";
const cas = casDeLEntreprise(code);
const f = MAILLE_ET_CO;
const col = f.gamme.find((r) => r.code === "col-rond")!;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;

// La fiche, refaite à la main.
const cv = col.coutDAchat + col.autresCoutsVariables;
const demande0 = col.demandeDuMois;
const stockPrevu = f.promotion.stockEnRayon;
const rayonPlein = col.capaciteDuRayon;
const margeSans = demande0 * (col.prixHt - cv);
/** La demande à r % de remise : la demande du mois × (1 + 3 × r), à l'unité inférieure. */
const demandeA = (r: number) => Math.floor(demande0 * (1 + (f.elasticiteALaRemise * r) / 100) + 1e-9);
/** Le prix payé à r % de remise, au centime. */
const prixA = (r: number) => centime(col.prixHt * (1 - r / 100));
const venduesA = (r: number, stock: number) => Math.min(demandeA(r), stock);
const margeA = (r: number, stock: number) => centime(venduesA(r, stock) * (prixA(r) - cv));
const gainA = (r: number, stock: number) => centime(margeA(r, stock) - margeSans);
const volumeA = (r: number) => Math.ceil(margeSans / (prixA(r) - cv) - 1e-9);

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
        ...e.leviers(c).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((x) => x.libelle)]),
        ...(g?.courbes ?? []).map((x) => x.libelle),
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (articles?|pulls?|références?|jours?|mois|remises?|clientes?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(le|du) (écharpe|article)\b/i);
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
      // Un montant qui peut être négatif : la question dit avec quel signe le donner.
      if (champs.some((x) => x.attendu < 0)) expect(e.question(cas, etat), e.id).toMatch(/négatif s'il|négatif si elle/);
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

/** Un curseur : son attendu, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  const couvre = (q: number) => d.produit(q) >= d.cout(q) - 1e-9;
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(centime),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
    /** La lecture à la position voisine, celle d'avant (ou d'après, selon le sens). */
    voisine: Object.fromEntries(e.lecture(cas, e.sens === "plus-grande" ? k.attendu + 1 : k.attendu - 1).map((l) => [l.libelle, l.montant])),
  };
}

/** Un laboratoire : sa lecture au départ et à la solution, par libellé. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)], atteint: d.atteint };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

describe("la promotion qui paie, à la boutique du monde du cours", () => {
  const ch = PROMOTION_QUI_PAIE;

  it("se joue chez MAILLE & CO seule, au palier 4 du BTS MCO, avec ses blocs, et le cas est le sien", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("mco");
    expect(ch.palier).toBe(4);
    expect(ch.entreprises?.codes).toEqual(["boutique"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    for (const b of ch.blocs) {
      const ref = referentielDeCitation(b);
      expect(ref, b).toBeDefined();
      expect(blocOfficiel(b, ref!.code), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(f.entreprise).toBe(cas.entreprise);
    expect(SITUATIONS).toContain(JUSQU_OU_REMISER);
    // La synthèse finit par la phrase de l'arène ; l'intro dit les hypothèses de la simulation.
    const synthese = ch.etapes.at(-1)!;
    if (synthese.type !== "lecture") throw new Error("Pas de synthèse");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    const intro = ch.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("Pas d'intro");
    expect(intro.texte(cas).join(" ")).toMatch(/Ce que la simulation suppose/);
  });

  it("la fiche donne les chiffres de la consigne", () => {
    expect([cv, demande0, stockPrevu, rayonPlein, f.promotion.remise, f.elasticiteALaRemise]).toEqual([28.5, 600, 700, 900, 0.1, 3]);
    expect([margeSans, prixA(10), prixA(10) - cv, volumeA(10)]).toEqual([15_900, 49.5, 21, 758]);
    expect([demandeA(10), venduesA(10, 700), gainA(10, 700), gainA(10, 900)]).toEqual([780, 700, -1_200, 480]);
  });

  it("les étapes guidées attendent ce que la fiche donne", () => {
    expect(attendus(ch, "marge-unitaire")).toEqual({
      "Prix payé en promotion, hors taxes": 49.5,
      "Marge d'un pull au prix de l'étiquette": 26.5,
      "Marge d'un pull en promotion": 21,
      "Baisse de la marge d'un pull (%)": Math.round((5.5 / 26.5) * 1000) / 10,
    });
    expect(Math.round((5.5 / 26.5) * 1000) / 10).toBe(20.8);
    expect(attendus(ch, "volume-necessaire")).toEqual({
      "Marge d'un mois sans remise": margeSans,
      "Volume nécessaire en promotion": Math.ceil(15_900 / 21),
      "Hausse des ventes nécessaire (%)": Math.round((758 / 600 - 1) * 1000) / 10,
    });
    expect(Math.round((758 / 600 - 1) * 1000) / 10).toBe(26.3);
  });

  it("le curseur du volume, refait à la main : la marge en promotion rattrape celle d'un mois sans remise à 758", () => {
    expect(curseur(ch, "combien-vendre")).toEqual({
      attendu: 758,
      bornes: [600, 900],
      droites: [600 * 21, margeSans, 900 * 21, margeSans],
      lecture: { "Marge du mois en promotion": 758 * 21, "Marge d'un mois sans remise": margeSans, "Gain de la promotion": 758 * 21 - margeSans },
      voisine: { "Marge du mois en promotion": 757 * 21, "Marge d'un mois sans remise": margeSans, "Gain de la promotion": 757 * 21 - margeSans },
    });
    expect([758 * 21 - margeSans, 757 * 21 - margeSans]).toEqual([18, -3]);
    expect(juste(ch, "predire-le-volume")).toBe("Environ un quart de pulls en plus");
  });

  it("l'étape autonome : la promotion prévue, chiffrée", () => {
    expect(attendus(ch, "la-promotion-jouee")).toEqual({
      "Pulls demandés en promotion": demandeA(10),
      "Pulls vendus en promotion": venduesA(10, stockPrevu),
      "Gain de la promotion": gainA(10, stockPrevu),
    });
    expect(juste(ch, "predire-le-rayon")).toBe("Coûtera de la marge : le rayon ne sert pas le volume nécessaire");
  });

  it("l'étape `pourquoi` : trois issues, et la bonne réponse suit les chiffres de la simulation", () => {
    // La promotion prévue : la demande suit (780 ≥ 758), l'offre bloque (700 en rayon).
    expect(juste(ch, "pourquoi")).toBe("La boutique ne pouvait pas vendre plus : son stock en rayon était épuisé.");
    const positions = [
      { remise: 10, stock: 700, issue: "offre-bloque", texte: /ne pouvait pas vendre plus/ },
      { remise: 10, stock: 900, issue: "paie", texte: /ont répondu à la remise/ },
      { remise: 15, stock: 900, issue: "demande-insuffisante", texte: /pas assez pour payer la remise/ },
      { remise: 20, stock: 900, issue: "demande-insuffisante", texte: /pas assez pour payer la remise/ },
    ] as const;
    for (const x of positions) {
      // L'issue, refaite à la main : paie si les ventes atteignent le volume ; sinon, la demande ou le rayon.
      const vol = volumeA(x.remise);
      const parLaMain = venduesA(x.remise, x.stock) >= vol ? "paie" : demandeA(x.remise) >= vol ? "offre-bloque" : "demande-insuffisante";
      expect(parLaMain, `${x.remise} % / ${x.stock}`).toBe(x.issue);
      const p = promotionA(f, x.remise, x.stock);
      expect(issueDeLaPromotion(p)).toBe(x.issue);
      // Le modèle du monde rend les deux conditions : la demande suit, l'offre suit.
      expect([p.laDemandeSuit, p.lOffreSuit], `${x.remise} % / ${x.stock}`).toEqual([demandeA(x.remise) >= vol, venduesA(x.remise, x.stock) === demandeA(x.remise)]);
      const options = optionsDuPourquoi(p, f.entreprise);
      expect(options.filter((o) => o.juste)).toHaveLength(1);
      expect(options.find((o) => o.juste)!.texte).toMatch(x.texte);
      // Une promotion qui ne paie pas perd de la marge, et l'inverse.
      expect(gainA(x.remise, x.stock) >= 0).toBe(x.issue === "paie");
      for (const o of options) expect(o.retour).not.toMatch(/undefined|NaN|null/);
    }
    expect([volumeA(15), demandeA(15), volumeA(20), demandeA(20)]).toEqual([872, 870, 1_026, 960]);
  });

  it("le laboratoire : remise et rayon, le gain refait à la main au départ et à la solution", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-promotion");
    expect(l.depart).toEqual({ remise: 10, stock: 700 });
    expect(l.solution).toEqual({ ...SOLUTION_DU_LABORATOIRE });
    expect(l.solution).toEqual({ remise: 7.5, stock: 740 });
    expect(l.reussi).toEqual([false, true]);
    const lire = (r: number, s: number) => ({
      "Pulls demandés": demandeA(r),
      "Pulls vendus": venduesA(r, s),
      "Ventes manquées": demandeA(r) - venduesA(r, s),
      "Volume nécessaire": volumeA(r),
      "Marge d'un pull en promotion": centime(prixA(r) - cv),
      "Marge du mois en promotion": margeA(r, s),
      "Gain de la promotion": gainA(r, s),
    });
    expect(l.auDepart).toEqual(lire(10, 700));
    expect(l.aLaSolution).toEqual(lire(7.5, 740));
    expect(Object.values(lire(7.5, 740))).toEqual([735, 735, 0, 711, 22.38, 16_449.3, 549.3]);
    expect(GAIN_DU_DEFI).toBe(540);
    // Avec 700 pulls en rayon, aucune remise du pas ne relève le défi : le meilleur gain est 505,53 €.
    const grille = Array.from({ length: 61 }, (_, i) => i / 2);
    const avec700 = grille.map((r) => gainA(r, 700));
    expect(Math.max(...avec700)).toBe(505.53);
    expect(grille.filter((r) => l.atteint({ remise: r, stock: 700 }))).toEqual([]);
    // Rayon plein, le défi se relève de 6,5 % à 8 % de remise, et le meilleur gain est à 7,5 %.
    expect(grille.filter((r) => gainA(r, 900) >= 540)).toEqual([6.5, 7, 7.5, 8]);
    expect(grille.reduce((a, b) => (gainA(b, 900) > gainA(a, 900) ? b : a))).toBe(7.5);
  });

  it("le graphique du laboratoire : la marge du mois selon la remise, une courbe et non une droite", () => {
    const { e } = laboratoire(ch, "le-laboratoire-de-la-promotion");
    const g = e.graphique!(cas);
    expect(g.levier).toBe("remise");
    const [enPromotion, sans] = g.courbes;
    const a = (r: number, stock: number) => enPromotion!.valeur({ remise: r, stock });
    expect(a(0, 700)).toBe(600 * 26.5);
    expect(a(5, 700)).toBe(690 * (52.25 - cv));
    expect(a(10, 700)).toBe(700 * 21);
    expect(a(20, 700)).toBe(700 * (44 - cv));
    expect(a(7.5, 900)).toBe(16_449.3);
    expect(a(15, 900)).toBe(870 * (46.75 - cv));
    expect(sans!.valeur({ remise: 20, stock: 700 })).toBe(margeSans);
    // Elle monte puis redescend : pas une droite.
    expect(a(5, 900) - a(0, 900)).toBeGreaterThan(0);
    expect(a(15, 900) - a(10, 900)).toBeLessThan(0);
  });

  it("l'expert, la variante rayon plein : trois remises, refaites à la main", () => {
    expect([...REMISES_DU_RAYON_PLEIN]).toEqual([10, 15, 7.5]);
    expect(attendus(ch, "la-meilleure-remise")).toEqual({
      "Gain à 10 % de remise, rayon plein": gainA(10, 900),
      "Gain à 15 % de remise, rayon plein": gainA(15, 900),
      "Gain à 7,5 % de remise, rayon plein": gainA(7.5, 900),
    });
    expect([gainA(10, 900), gainA(15, 900), gainA(7.5, 900)]).toEqual([480, -22.5, 549.3]);
  });

  it("le curseur du prix payé avec 700 pulls, et le calcul à rebours de la remise la plus forte", () => {
    // Sur toute la course du curseur, la demande dépasse 700 : la droite 700 × (p − 28,50) ne ment pas.
    for (const centimes of [4_800, 5_000, 5_122, 5_190]) expect(demandeA(100 * (1 - centimes / 100 / 55))).toBeGreaterThanOrEqual(700);
    expect(curseur(ch, "le-prix-plancher-du-rayon")).toEqual({
      attendu: 5_122,
      bornes: [4_800, 5_190],
      droites: [700 * (48 - cv), margeSans, 700 * (51.9 - cv), margeSans].map(centime),
      lecture: { "Marge d'un pull à ce prix": 22.72, "Marge des pulls en rayon, tous vendus": 700 * 22.72, "Marge d'un mois sans remise": margeSans, "Gain de la promotion": centime(700 * 22.72 - margeSans) },
      voisine: { "Marge d'un pull à ce prix": 22.71, "Marge des pulls en rayon, tous vendus": centime(700 * 22.71), "Marge d'un mois sans remise": margeSans, "Gain de la promotion": centime(700 * 22.71 - margeSans) },
    });
    const marge = Math.ceil((margeSans / 700) * 100) / 100;
    const prix = centime(cv + marge);
    const remise = centime((1 - prix / col.prixHt) * 100);
    expect([marge, prix, remise]).toEqual([22.72, 51.22, 6.87]);
    expect(attendus(ch, "a-rebours")).toEqual({ "Marge d'un pull à garder": marge, "Prix payé le plus bas, hors taxes": prix, "Remise la plus forte (%)": remise });
    // À cette remise, la demande dépasse bien le rayon, et la promotion garde la marge ; à 6,9 %, elle perd.
    expect(demandeA(remise)).toBe(723);
    expect(gainA(remise, 700)).toBeGreaterThanOrEqual(0);
    expect(gainA(6.9, 700)).toBeLessThan(0);
  });

  it("les verdicts : la critique de la méthode, avant de lancer", () => {
    expect(juste(ch, "ce-que-le-calcul-ne-voit-pas")).toBe("Les achats avancés : des clientes qui auraient payé le pull au prix plein en mars l'achètent remisé en février");
    expect(juste(ch, "avant-de-lancer")).toBe("S'assurer que le rayon et la réserve pourront servir le volume nécessaire, et commander en conséquence");
    // Au moins deux étapes d'expert à trois montants.
    for (const id of ["la-meilleure-remise", "a-rebours"]) expect(Object.keys(attendus(ch, id)).length, id).toBeGreaterThanOrEqual(3);
    // La synthèse reprend les promotions, refaites à la main.
    const t = ch.etapes.find((e) => e.id === "synthese")!.tableau!(cas);
    expect(t.lignes.map((l) => l.valeurs.at(-1))).toEqual(["−1 200 €", "480 €", "−22,50 €", "549,30 €"]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : jusqu'où remiser", () => {
  const s = JUSQU_OU_REMISER;
  // Refait à la main sur la fiche.
  const volume = Math.round(demande0 * (1 + HAUSSE_ATTENDUE));
  const marge = Math.ceil((margeSans / volume) * 100 - 1e-9) / 100;
  const plancher = centime(cv + marge);
  const remise = centime((1 - plancher / col.prixHt) * 100);
  const plancherTtc = centime(plancher * 1.2);

  it("tient la forme d'un cas dédié", () => {
    casDedie(s, PROMOTION_QUI_PAIE);
    expect(s.commanditaire).toBe("La responsable de la boutique");
    expect(HAUSSE_ATTENDUE).toBe(0.15);
  });

  it("la marge à garder, le prix plancher au curseur et au calcul, la remise maximale, à rebours", () => {
    expect([volume, marge, plancher, remise, plancherTtc]).toEqual([690, 23.05, 51.55, 6.27, 61.86]);
    expect(attendus(s, "la-marge-a-garder")).toEqual({ "Marge d'un pull au prix de l'étiquette": 26.5, "Marge d'un mois sans remise": margeSans, "Volume attendu en promotion": volume });
    expect(curseur(s, "le-prix-plancher")).toEqual({
      attendu: 5_155,
      bornes: [4_800, 5_500],
      droites: [690 * (48 - cv), margeSans, 690 * (55 - cv), margeSans].map(centime),
      lecture: { "Marge d'un pull à ce prix": 23.05, "Marge des pulls attendus": centime(690 * 23.05), "Marge d'un mois sans remise": margeSans, "Gain de la promotion": centime(690 * 23.05 - margeSans) },
      voisine: { "Marge d'un pull à ce prix": 23.04, "Marge des pulls attendus": centime(690 * 23.04), "Marge d'un mois sans remise": margeSans, "Gain de la promotion": centime(690 * 23.04 - margeSans) },
    });
    // À 51,54 €, l'arrondi au plus proche, il manque 2,40 € : le plancher s'arrondit au centime supérieur.
    expect(centime(690 * 23.04 - margeSans)).toBe(-2.4);
    expect(attendus(s, "la-remise-maximale")).toEqual({ "Marge d'un pull à garder": marge, "Prix plancher, hors taxes": plancher, "Remise maximale (%)": remise });
    // Arrondie au dixième, la remise passerait sous le plancher.
    expect(prixA(6.3)).toBeLessThan(plancher);
  });

  it("l'étiquette ronde, et le jugement : arrondir du côté de la marge", () => {
    const ht62 = centime(62 / 1.2);
    const ht61 = centime(61 / 1.2);
    expect([ht62, ht61]).toEqual([51.67, 50.83]);
    expect(attendus(s, "l-etiquette")).toEqual({
      "Prix plancher, toutes taxes comprises": plancherTtc,
      "Remise affichée à l'étiquette ronde (%)": Math.round((1 - 62 / 66) * 1000) / 10,
      "Marge du mois à l'étiquette ronde": centime(volume * (ht62 - cv)),
    });
    expect([Math.round((1 - 62 / 66) * 1000) / 10, centime(volume * (ht62 - cv)), centime(volume * (ht61 - cv))]).toEqual([6.1, 15_987.3, 15_407.7]);
    expect(juste(s, "reponse")).toBe("Une étiquette à 62 € TTC, soit 6,1 % de remise au plus");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

describe("l'export de compatibilité : la promotion que l'arène rejouait, figée", () => {
  it("rend, à l'identique, les chiffres que lit encore « Commander pour la promotion »", () => {
    const b = promotion({ code: "boutique" });
    expect([b.prix, b.prixPromo, b.mcv, b.mcvPromo, b.margeNormale, b.volumeNecessaire, b.quantitePromo, b.gain, b.perduesPromo]).toEqual([55.49, 49.94, 26.99, 21.44, 124_181, 5_793, 5_431, -7_740, 735]);
    expect(promotion({ code: "ecommerce" }).gain).toBe(4_296);
    expect(promotion({ code: "bistrot" }).gain).toBe(-20_509);
    expect(() => promotion({ code: "nova" })).toThrow();
  });
});
