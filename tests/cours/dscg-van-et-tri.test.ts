import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { ENTREPRISES_DES_PROJETS, LA_VALEUR_ACTUELLE_NETTE, gammeDuChapitre } from "../../src/config/cours/chapitres/la-valeur-actuelle-nette";
import {
  BUDGET_DU_RATIONNEMENT,
  ECART_ADMIS_AU_DEFI,
  LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS,
  deuxLignes,
  machineSuivante,
} from "../../src/config/cours/chapitres/le-tri-et-le-choix-entre-deux-projets";
import { PROJET_BANC_DE_MESURE, PROJET_LIGNE_MANUELLE, PROJET_LIGNE_SEMI_AUTOMATIQUE, VENTES_DE_GO, VENTES_DE_ONE_PERDUES, VENTES_DE_STUDIO } from "../../src/config/cours/monde/projets-et-financement";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { ACHETER_LES_DEUX_MACHINES, BUDGET_DU_CAS, acheterLesDeux } from "../../src/config/cours/situations/par-chapitre/acheter-les-deux-machines";
import { DUREE_AVANT_LA_REVENTE, REVENDRE_LA_MACHINE_PLUS_TOT, revendrePlusTot } from "../../src/config/cours/situations/par-chapitre/revendre-la-machine-plus-tot";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * DSCG · FINANCE : LA VALEUR ACTUELLE NETTE, LE TRI ET LE CHOIX ENTRE DEUX PROJETS, CHEZ NOVA, DANS
 * LE MONDE DU COURS, ET LEURS CAS : REVENDRE LA MACHINE PLUS TÔT, ACHETER LES DEUX MACHINES.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche (monde/projets-et-financement.ts :
 * les ventes, les prix, les charges, les équipements), sans les fonctions des chapitres ni le modèle
 * (monde/finance.ts) : les flux se recomposent depuis le chiffre d'affaires, une VAN par sa somme,
 * un TRI par la VAN qu'il annule. Les valeurs absolues sont épinglées, les variantes (3 et 4 ans,
 * 80 % des ventes, un autre entretien, un autre budget, d'autres retours évités) refaites comme le
 * reste, et les verdicts aussi. Chaque curseur : son attendu, la position voisine, ses droites aux
 * bornes, sa lecture. Chaque laboratoire : sa lecture au départ et à la solution, et les courbes de
 * son graphique en quelques points. Puis les gardes de texte de l'étalon (tests/cours/
 * ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "nova";
const cas = casDeLEntreprise(code);
const centime = (x: number) => Math.round(x * 100) / 100;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE, REFAITE À LA MAIN
// ─────────────────────────────────────────────────────────────────────────────

const T = 0.09;
const IS = 0.25;
const GO = [1_500, 2_500, 3_000, 3_000, 2_000];
const STUDIO = [1_000, 1_800, 2_400, 2_400, 1_800];
const ONE = [300, 500, 600, 600, 500];
/** Un opérateur de plus : 1 875 € bruts par mois, 42 % de cotisations patronales, 12 mois. */
const OPERATEUR = 1_875 * 1.42 * 12;
const PUBLICITE = (k: number) => 12_000 + (k === 0 ? 15_000 : 0);

interface Ligne {
  montant: number;
  duree: number;
  reprise: number;
  operateurs: number;
  entretien: number;
}
const LIGNE_A: Ligne = { montant: 60_000, duree: 6, reprise: 0.6, operateurs: 2, entretien: 4_000 };
const LIGNE_B: Ligne = { montant: 150_000, duree: 6, reprise: 0.8, operateurs: 1, entretien: 10_000 };
const MOULES = { montant: 40_000, duree: 5 };

/** Les flux de trésorerie disponibles d'une ligne, à la main : ventes en part du plan, prix de Studio, durée, prix de revente de la ligne. */
function fluxALaMain(l: Ligne, o: { ventes?: number; prixStudio?: number; duree?: number; prixDeLaLigne?: number; entretien?: number; bfr?: boolean } = {}) {
  const v = o.ventes ?? 1;
  const p = o.prixStudio ?? 129;
  const n = o.duree ?? 5;
  const e = o.entretien ?? l.entretien;
  const ca = (k: number) => v * (GO[k]! * 34 + STUDIO[k]! * p - ONE[k]! * 59);
  const cv = (k: number) => v * (GO[k]! * 19 + STUDIO[k]! * 70 - ONE[k]! * 38);
  const dot = l.montant / l.duree + MOULES.montant / MOULES.duree;
  const fe = (k: number) => {
    const ebe = ca(k) - cv(k) - PUBLICITE(k) - l.operateurs * OPERATEUR - e;
    return ebe - IS * (ebe - dot);
  };
  const bfr = (k: number) => (o.bfr === false ? 0 : 0.1 * ca(k));
  const vncLigne = l.montant - (n * l.montant) / l.duree;
  const prix = o.prixDeLaLigne ?? l.reprise * vncLigne;
  const vncMoules = MOULES.montant - (n * MOULES.montant) / MOULES.duree;
  const residuelle = prix + IS * (vncLigne - prix) + IS * vncMoules;
  return Array.from({ length: n + 1 }, (_, k) => {
    if (k === 0) return -(l.montant + MOULES.montant) - bfr(0);
    if (k < n) return fe(k - 1) - (bfr(k) - bfr(k - 1));
    return fe(k - 1) + residuelle + bfr(k - 1);
  });
}
/** La VAN à la main : la somme des flux de la date k ÷ (1 + taux)^k. */
const vanALaMain = (f: readonly number[], r: number) => f.reduce((s, x, k) => s + x / (1 + r) ** k, 0);
/** Le banc à la main : (retours × 40 € − 1 400 € − 6 000 € de dotation) × 75 % + 6 000 €, chaque année, pour 30 000 €. */
const fluxDuBanc = (retours: number) => [-30_000, ...Array(5).fill((retours * 40 - 1_400 - 6_000) * 0.75 + 6_000)];
const annuite = (1 - 1.09 ** -5) / 0.09;

const A = fluxALaMain(LIGNE_A);
const B = fluxALaMain(LIGNE_B);
const C = fluxDuBanc(360);
const vanA = vanALaMain(A, T);
const vanB = vanALaMain(B, T);
const vanC = vanALaMain(C, T);

// ─────────────────────────────────────────────────────────────────────────────
// LES OUTILS DE L'ÉTALON
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

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon). */
function verifierLesTextes(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])ne [aeiouyéèê]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −|−0 €/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|opérateurs?|ans|années?|retours?|NOVA)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\barène rejoue|trimestre/i);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
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
        expect(x.tolerance ?? 0.01, `${e.id} : ${x.libelle}`).toBeGreaterThan(0);
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.id)).size, ch.code).toBe(ch.etapes.length);
}

/** Ce qu'un cas dédié doit tenir (tests/cours/situations.test.ts), et sa réponse qui ne se devine pas. */
function casDedie(s: Situation, ch: Chapitre) {
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

/** Les écarts admis des champs d'une étape de montants, par libellé. */
function tolerances(ch: Chapitre, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.tolerance ?? 0.01]));
}

/** Un curseur : son attendu, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  // L'attendu est bien la position que le sens désigne : la plus petite qui couvre, ou la plus grande.
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

/** Un laboratoire : sa lecture au départ et à la solution, par libellé, et son graphique. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, depart, solution: d.solution, atteint: d.atteint, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)], graphique: e.graphique!(cas) };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

// ─────────────────────────────────────────────────────────────────────────────
// LES TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("les deux chapitres et leurs cas, chez NOVA, dans le monde du cours", () => {
  it("se jouent chez NOVA seule, au palier 4 du DSCG, avec leur bloc, et sans lire l'arène", () => {
    for (const ch of [LA_VALEUR_ACTUELLE_NETTE, LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS]) {
      expect(CHAPITRES).toContain(ch);
      expect(PROGRAMME["dscg-finance"][4]).toContain(ch.titre);
      expect(ch.parcours).toBe("dscg-finance");
      expect(ch.palier).toBe(4);
      expect(ch.libre).toBe(false);
      expect(ch.entreprises?.codes).toEqual(["nova"]);
      expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
      expect(ch.entreprises!.pourquoi).toContain("NOVA");
      expect(ch.blocs).toEqual(["DSCG UE2 · Finance"]);
      const r = referentielDeCitation(ch.blocs[0]!)!;
      expect(r.code).toBe("dscg");
      expect(blocOfficiel(ch.blocs[0]!, r.code)).toBe("UE2 · Finance");
      expect(ch.etapes[0]!.type).toBe("lecture");
      expect(ch.etapes.at(-1)!.id).toBe("synthese");
      const fin = (ch.etapes.at(-1) as { texte: (c: Cas) => string[] }).texte(cas);
      expect(fin.at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    }
    expect(ENTREPRISES_DES_PROJETS).toEqual(["nova"]);
    expect(PROJET_LIGNE_MANUELLE.entreprise).toBe(cas.entreprise);
    expect(SITUATIONS).toContain(REVENDRE_LA_MACHINE_PLUS_TOT);
    expect(SITUATIONS).toContain(ACHETER_LES_DEUX_MACHINES);
  });

  it("la fiche refaite à la main est celle du monde du cours", () => {
    expect([GO, STUDIO, ONE]).toEqual([[...VENTES_DE_GO], [...VENTES_DE_STUDIO], [...VENTES_DE_ONE_PERDUES]]);
    expect(OPERATEUR).toBeCloseTo(31_950, 9);
    expect(PROJET_LIGNE_MANUELLE.actifs.map((a) => [a.montant, a.dureeDAmortissement, a.tauxDeReprise])).toEqual([[60_000, 6, 0.6], [40_000, 5, 0]]);
    expect(PROJET_LIGNE_SEMI_AUTOMATIQUE.actifs.map((a) => [a.montant, a.dureeDAmortissement, a.tauxDeReprise])).toEqual([[150_000, 6, 0.8], [40_000, 5, 0]]);
    expect(PROJET_BANC_DE_MESURE.actifs.map((a) => a.montant)).toEqual([30_000]);
    expect(A.map(centime)).toEqual([-116_230, -22_815, 35_625, 75_075, 85_625, 72_920]);
    expect(B.map(centime)).toEqual([-206_230, 397.5, 58_837.5, 98_287.5, 108_837.5, 110_382.5]);
    expect(C.map(centime)).toEqual([-30_000, 11_250, 11_250, 11_250, 11_250, 11_250]);
    expect([vanA, vanB, vanC].map(centime)).toEqual([58_847.24, 68_397.29, 13_758.58]);
  });

  it("la mission « jouez » garde son export : l'équipement du projet B, au nom de la machine de l'arène", () => {
    expect(machineSuivante(code)).toEqual({ code: "ligne-semi-automatique", name: "Ligne semi-automatique" });
  });
});

describe("la valeur actuelle nette : le projet A, la gamme sur une seconde ligne manuelle", () => {
  const ch = LA_VALEUR_ACTUELLE_NETTE;
  const x = gammeDuChapitre(cas);

  it("les étapes guidées : le flux de N+3, l'impôt d'une année en perte, le taux et le prix du temps", () => {
    const ca3 = 3_000 * 34 + 2_400 * 129 - 600 * 59;
    const cv3 = 3_000 * 19 + 2_400 * 70 - 600 * 38;
    const ebe3 = ca3 - cv3 - (12_000 + 2 * 31_950 + 4_000);
    const impot3 = 0.25 * (ebe3 - 18_000);
    expect(attendus(ch, "le-flux-d-une-annee")).toEqual({
      "Chiffre d'affaires différentiel de N+3": ca3,
      "EBE de N+3": ebe3,
      "Impôt sur le résultat d'exploitation de N+3": impot3,
      "Flux d'exploitation après impôt de N+3": ebe3 - impot3,
    });
    expect([ca3, ebe3, impot3, ebe3 - impot3]).toEqual([376_200, 94_100, 19_025, 75_075]);
    // N+1 : l'EBE est négatif, la perte fait économiser 25 % d'impôt sur le reste de NOVA.
    const ebe1 = 1_500 * 15 + 1_000 * 59 - 300 * 21 - (27_000 + 2 * 31_950 + 4_000);
    expect(ebe1).toBe(-19_700);
    expect(juste(ch, "l-annee-de-lancement")).toBe(`${"−9 425 €"} : une économie d'impôt sur le bénéfice du reste de NOVA`);
    expect(0.25 * (ebe1 - 18_000)).toBe(-9_425);
    expect(attendus(ch, "le-taux-et-le-temps")).toEqual({
      "Taux d'actualisation (%)": 3 + 1 * 6,
      "Valeur actuelle de 100 € reçus à la date 5": centime(100 / 1.09 ** 5),
      "Valeur actuelle du flux de N+3": centime(75_075 / 1.09 ** 3),
    });
    expect([centime(100 / 1.09 ** 5), centime(75_075 / 1.09 ** 3)]).toEqual([64.99, 57_971.67]);
  });

  it("les étapes autonomes : le BFR, la valeur résiduelle, la décision", () => {
    const bfr = [0, 1, 2, 3, 4].map((k) => 0.1 * (GO[k]! * 34 + STUDIO[k]! * 129 - ONE[k]! * 59));
    expect(attendus(ch, "le-bfr")).toEqual({
      "BFR avancé à la date 0": bfr[0],
      "Variation du BFR à la date 1": bfr[1]! - bfr[0]!,
      "Variation du BFR à la date 4": bfr[4]! - bfr[3]!,
      "BFR récupéré à la date 5": bfr[4],
    });
    expect([bfr[0], bfr[1]! - bfr[0]!, bfr[4]! - bfr[3]!, bfr[4]]).toEqual([16_230, 12_540, -10_550, 27_070]);
    const vnc = 60_000 - 5 * 10_000;
    expect(attendus(ch, "la-valeur-residuelle")).toEqual({
      "Valeur nette comptable de la ligne à la fin de N+5": vnc,
      "Prix de cession de la ligne": 0.6 * vnc,
      "Valeur résiduelle nette d'impôt du projet": 0.6 * vnc + 0.25 * (vnc - 0.6 * vnc),
    });
    expect(0.6 * vnc + 0.25 * 0.4 * vnc).toBe(7_000);
    expect(juste(ch, "decision")).toBe("Lancer : la VAN est positive, la gamme rend plus que le coût du capital");
    expect(x.verdict).toBe("investir");
  });

  it("les étapes d'expert : le tableau des flux disponibles, ce que coûte le BFR, à rebours le seuil des ventes", () => {
    const f = attendus(ch, "les-flux-disponibles");
    expect(f).toEqual({
      "Flux disponible de la date 0": centime(A[0]!),
      "Flux disponible de la date 1": centime(A[1]!),
      "Flux disponible de la date 4": centime(A[4]!),
      "Flux disponible de la date 5": centime(A[5]!),
      "VAN du projet A": centime(vanA),
    });
    // L'élève qui lit ses coefficients à quatre décimales reste dans l'écart admis.
    const aQuatreDecimales = A.reduce((s, y, k) => s + y * Math.round(1.09 ** -k * 10_000) / 10_000, 0);
    expect(Math.abs(aQuatreDecimales - vanA)).toBeLessThanOrEqual(tolerances(ch, "les-flux-disponibles")["VAN du projet A"]!);
    // Le BFR oublié : les flux sans BFR, et ce qu'il coûte.
    const sans = fluxALaMain(LIGNE_A, { bfr: false });
    expect(sans.map(centime)).toEqual([-100_000, -10_275, 44_475, 75_075, 75_075, 45_850]);
    const vanSans = vanALaMain(sans, T);
    expect(attendus(ch, "ce-que-coute-le-bfr")).toEqual({
      "VAN si l'on oubliait le BFR": centime(vanSans),
      "Valeur actuelle du BFR récupéré à la date 5": centime(27_070 / 1.09 ** 5),
      "Coût du BFR en VAN": centime(centime(vanSans) - centime(vanA)),
    });
    expect([centime(vanSans), centime(27_070 / 1.09 ** 5), centime(centime(vanSans) - centime(vanA))]).toEqual([68_963.16, 17_593.64, 10_115.92]);
    // Le seuil des ventes, à rebours : la VAN est affine dans les ventes.
    const v80 = vanALaMain(fluxALaMain(LIGNE_A, { ventes: 0.8 }), T);
    const pente = (vanA - v80) / 20;
    expect(attendus(ch, "le-seuil-des-ventes")).toEqual({
      "VAN à 80 % du plan": centime(v80),
      "VAN apportée par un point de ventes": centime(pente),
      "Ventes qui annulent la VAN (% du plan)": centime(100 - vanA / pente),
    });
    expect([centime(v80), centime(pente), centime(100 - vanA / pente)]).toEqual([-17_193.31, 3_802.03, 84.52]);
    // L'affinité : un troisième point tombe sur la droite.
    expect(vanALaMain(fluxALaMain(LIGNE_A, { ventes: 0.9 }), T)).toBeCloseTo((vanA + v80) / 2, 4);
    expect(vanALaMain(fluxALaMain(LIGNE_A, { ventes: 1 - (vanA / pente) / 100 }), T)).toBeCloseTo(0, 4);
    expect(juste(ch, "quel-risque-surveiller")).toBe("Le prix de NOVA Studio, qui porte la marge de la gamme");
  });

  it("les deux paris épinglés", () => {
    expect(juste(ch, "predire-le-bfr")).toBe("Il la fait baisser : l'argent avancé revient, mais tard, et il a perdu de sa valeur");
    expect(juste(ch, "predire-les-ventes")).toBe("De 10 % à 25 % : la VAN tient, sans plus");
  });

  it("les curseurs : les ventes qui annulent la VAN, le prix plancher de NOVA Studio", () => {
    const vanV = (q: number) => vanALaMain(fluxALaMain(LIGNE_A, { ventes: q / 100 }), T);
    expect(vanV(85)).toBeGreaterThan(0);
    expect(vanV(84)).toBeLessThan(0);
    const fv = fluxALaMain(LIGNE_A, { ventes: 0.85 });
    expect(curseur(ch, "les-ventes-au-curseur")).toEqual({
      attendu: 85,
      bornes: [60, 120],
      droites: [centime(vanV(60) + 100_000), 100_000, centime(vanV(120) + 100_000), 100_000],
      lecture: {
        "Chiffre d'affaires de N+3": 0.85 * 376_200,
        "Flux d'exploitation de N+3": centime(0.85 * (376_200 - 202_200) - 79_900 - 0.25 * (0.85 * (376_200 - 202_200) - 79_900 - 18_000)),
        "BFR de N+3": centime(0.085 * 376_200),
        "VAN du projet": centime(vanALaMain(fv, T)),
      },
    });
    expect([centime(vanV(60)), centime(vanV(85))]).toEqual([-93_233.86, 1_816.83]);
    const vanP = (p: number) => vanALaMain(fluxALaMain(LIGNE_A, { prixStudio: p }), T);
    expect(vanP(118)).toBeGreaterThan(0);
    expect(vanP(117)).toBeLessThan(0);
    expect(curseur(ch, "le-prix-de-studio")).toEqual({
      attendu: 118,
      bornes: [100, 140],
      droites: [centime(vanP(100) + 100_000), 100_000, centime(vanP(140) + 100_000), 100_000],
      lecture: {
        "Marge sur coût variable d'une NOVA Studio": 118 - 70,
        "Flux d'exploitation de N+3": centime((3_000 * 15 + 2_400 * 48 - 600 * 21 - 79_900) * 0.75 + 0.25 * 18_000),
        "VAN du projet": centime(vanP(118)),
      },
    });
    // Le prix plancher exact : la VAN est affine dans le prix ; 8,6 % de baisse l'effacent.
    const plancher = 129 - vanA / (vanA - vanP(128));
    expect(centime(plancher)).toBe(117.9);
    expect(x.prixPlancher).toBe(117.9);
    expect(centime(((129 - 117.9) / 129) * 100)).toBe(8.6);
  });

  it("le laboratoire : la durée la plus courte qui crée de la valeur, BFR compté, et ce qu'oublier le BFR ferait croire", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-gamme");
    expect(l.depart).toEqual({ bfr: 1, duree: 5, taux: 9, ventes: 100 });
    expect(l.solution).toEqual({ bfr: 1, duree: 4, taux: 9, ventes: 100 });
    expect(l.reussi).toEqual([false, true]);
    const lire = (n: number) => {
      const avec = fluxALaMain(LIGNE_A, { duree: n });
      const sans = fluxALaMain(LIGNE_A, { duree: n, bfr: false });
      const vncLigne = 60_000 - n * 10_000;
      const residuelle = 0.6 * vncLigne + 0.25 * 0.4 * vncLigne + 0.25 * (40_000 - n * 8_000);
      return {
        "Mise de la date 0": 116_230,
        "BFR récupéré à la fin du projet": 0.1 * (GO[n - 1]! * 34 + STUDIO[n - 1]! * 129 - ONE[n - 1]! * 59),
        "Valeur résiduelle nette des équipements": residuelle,
        "Ce qu'oublier le BFR ajoute à la VAN": centime(centime(vanALaMain(sans, T)) - centime(vanALaMain(avec, T))),
        "VAN du projet": centime(vanALaMain(avec, T)),
      };
    };
    expect(l.auDepart).toEqual(lire(5));
    expect(l.aLaSolution).toEqual(lire(4));
    expect(Object.values(lire(4))).toEqual([116_230, 37_620, 16_000, 8_532.5, 41_966.11]);
    // À 3 ans, le projet détruit de la valeur, mais l'oubli du BFR le ferait accepter.
    expect(centime(vanALaMain(fluxALaMain(LIGNE_A, { duree: 3 }), T))).toBe(-850.54);
    expect(centime(vanALaMain(fluxALaMain(LIGNE_A, { duree: 3, bfr: false }), T))).toBe(5_283.37);
    expect(l.atteint({ bfr: 0, duree: 3, taux: 9, ventes: 100 })).toBe(false);
    expect(l.atteint({ bfr: 1, duree: 3, taux: 9, ventes: 100 })).toBe(false);
    expect(l.atteint({ bfr: 1, duree: 4, taux: 8, ventes: 100 })).toBe(false);
    // Le graphique : la VAN selon le taux, BFR compté et oublié ; à 0 %, les deux se confondent (le BFR revient en entier).
    const [compte, oublie] = l.graphique.courbes;
    expect(l.graphique.levier).toBe("taux");
    const au = (taux: number) => ({ ...l.depart, taux });
    expect(compte!.valeur(au(0))).toBe(130_200);
    expect(oublie!.valeur(au(0))).toBe(130_200);
    expect(compte!.valeur(au(9))).toBe(58_847.24);
    expect(oublie!.valeur(au(9))).toBe(68_963.16);
    expect(compte!.valeur(au(20))).toBeCloseTo(vanALaMain(A, 0.2), 1);
    expect(oublie!.valeur(au(20))).toBeCloseTo(vanALaMain(fluxALaMain(LIGNE_A, { bfr: false }), 0.2), 1);
    // Ce n'est pas une droite : la baisse de 0 à 9 % dépasse celle de 9 à 18 %.
    expect(compte!.valeur(au(0)) - compte!.valeur(au(9))).toBeGreaterThan(compte!.valeur(au(9)) - compte!.valeur(au(18)));
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le TRI et le choix entre deux projets : la ligne manuelle, la ligne semi-automatique, le banc", () => {
  const ch = LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS;
  const k = deuxLignes(cas);
  const diff = B.map((y, i) => y - A[i]!);

  it("les étapes guidées : les deux VAN, l'encadrement du TRI de la ligne manuelle", () => {
    expect(attendus(ch, "les-deux-van")).toEqual({ "VAN du projet A": centime(vanA), "VAN du projet B": centime(vanB), "Ce que B crée de plus que le projet A": centime(vanB - vanA) });
    expect(centime(vanB - vanA)).toBe(9_550.05);
    const v20 = vanALaMain(A, 0.2);
    const v21 = vanALaMain(A, 0.21);
    expect(attendus(ch, "encadrer-le-tri")).toEqual({
      "VAN du projet A à 20 %": centime(v20),
      "VAN du projet A à 21 %": centime(v21),
      "TRI du projet A, par interpolation (%)": centime(20 + centime(v20) / (centime(v20) - centime(v21))),
    });
    expect([centime(v20), centime(v21), centime(20 + v20 / (v20 - v21))]).toEqual([3_541.1, -316.63, 20.92]);
    // Le TRI annule la VAN : elle change de signe autour de 20,92 %.
    expect(vanALaMain(A, 0.2091)).toBeGreaterThan(0);
    expect(vanALaMain(A, 0.2093)).toBeLessThan(0);
  });

  it("les étapes autonomes : le TRI de la ligne semi-automatique, le classement, les indices", () => {
    const v18 = vanALaMain(B, 0.18);
    const v19 = vanALaMain(B, 0.19);
    expect(attendus(ch, "le-tri-de-b")).toEqual({
      "Taux entier juste sous le TRI de B (%)": 18,
      "VAN de B à ce taux": centime(v18),
      "TRI de B, par interpolation (%)": centime(18 + centime(v18) / (centime(v18) - centime(v19))),
    });
    expect([centime(v18), centime(v19), centime(18 + v18 / (v18 - v19))]).toEqual([570.23, -5_492.06, 18.09]);
    expect(vanALaMain(B, 0.1808)).toBeGreaterThan(0);
    expect(vanALaMain(B, 0.181)).toBeLessThan(0);
    expect(juste(ch, "le-classement")).toBe("La VAN préfère B, le TRI préfère le projet A");
    // Le délai : les flux actualisés cumulés repassent à zéro dans la quatrième année pour A, la cinquième pour B.
    const delai = (f: readonly number[]) => {
      let cumul = 0;
      for (let i = 0; i < f.length; i++) {
        const a = f[i]! / 1.09 ** i;
        if (cumul < 0 && cumul + a >= 0) return i - 1 + -cumul / a;
        cumul += a;
      }
      return null;
    };
    expect(attendus(ch, "les-indices")).toEqual({
      "Indice de profitabilité du projet A": centime((vanA + 116_230) / 116_230),
      "Indice de profitabilité de B": centime((vanB + 206_230) / 206_230),
      "Délai de récupération actualisé du projet A (années)": centime(delai(A)!),
      "Délai de récupération actualisé de B (années)": centime(delai(B)!),
    });
    expect([centime((vanA + 116_230) / 116_230), centime((vanB + 206_230) / 206_230), centime(delai(A)!), centime(delai(B)!)]).toEqual([1.51, 1.33, 3.81, 4.05]);
  });

  it("les étapes d'expert : le taux de Fisher, l'entretien à rebours, le rationnement, le TRI global", () => {
    expect(diff.map(centime)).toEqual([-90_000, 23_212.5, 23_212.5, 23_212.5, 23_212.5, 37_462.5]);
    // Le taux de Fisher annule la VAN des flux différentiels, et les deux VAN s'y égalent.
    expect(vanALaMain(diff, 0.1273)).toBeGreaterThan(0);
    expect(vanALaMain(diff, 0.1274)).toBeLessThan(0);
    expect(Math.abs(vanALaMain(A, 0.12735) - vanALaMain(B, 0.12735))).toBeLessThan(5);
    expect(attendus(ch, "le-taux-de-fisher")).toEqual({
      "Flux différentiel des dates 1 à 4": 23_212.5,
      "Flux différentiel de la date 5": 37_462.5,
      "Taux de Fisher (%)": 12.73,
      "VAN du projet A à 12,73 %": centime(vanALaMain(A, 0.1273)),
    });
    expect(centime(vanALaMain(A, 0.1273))).toBe(37_044.92);
    // L'entretien qui égale les deux VAN : (VAN B − VAN A) ÷ (75 % × l'annuité), en plus des 10 000 €.
    const max = 10_000 + (vanB - vanA) / (0.75 * annuite);
    expect(attendus(ch, "l-entretien-qui-egalise")).toEqual({
      "Flux après impôt que coûtent 1 000 € d'entretien par an": 750,
      "VAN retirée par 1 000 € d'entretien par an": centime(750 * annuite),
      "Entretien annuel de B qui égale les deux VAN": centime(max),
    });
    expect([centime(750 * annuite), centime(max)]).toEqual([2_917.24, 13_273.66]);
    expect(vanALaMain(fluxALaMain(LIGNE_B, { entretien: max }), T)).toBeCloseTo(vanA, 4);
    // Le rationnement : 240 000 € ; A et C tiennent, B et C aussi ; l'indice classe A, C, B.
    expect(BUDGET_DU_RATIONNEMENT).toBe(240_000);
    expect(attendus(ch, "le-rationnement")).toEqual({
      "Indice de profitabilité du projet C": centime((vanC + 30_000) / 30_000),
      "VAN de la ligne manuelle et du banc": centime(centime(vanA) + centime(vanC)),
      "VAN de la ligne semi-automatique et du banc": centime(centime(vanB) + centime(vanC)),
    });
    expect([centime((vanC + 30_000) / 30_000), centime(centime(vanA) + centime(vanC)), centime(centime(vanB) + centime(vanC))]).toEqual([1.46, 72_605.82, 82_155.87]);
    expect([116_230 + 30_000, 206_230 + 30_000].map((m) => m <= 240_000)).toEqual([true, true]);
    expect(k.parIndice).toEqual(["A", "C", "B"]);
    expect(k.programmeParIndice.nom).toBe("AC");
    expect(k.laisseParIndice).toBe(240_000 - 146_230);
    expect(juste(ch, "le-programme")).toBe("La ligne semi-automatique et le banc : la plus forte VAN qui tient dans le budget");
    // Le TRI global : les flux positifs replacés à 9 % jusqu'à la date 5, un flux négatif ajouté à la mise.
    const global = (f: readonly number[]) => {
      let mise = -f[0]!;
      let acquis = 0;
      f.forEach((y, i) => {
        if (i === 0) return;
        if (y < 0) mise += -y / 1.09 ** i;
        else acquis += y * 1.09 ** (5 - i);
      });
      return ((acquis / mise) ** (1 / 5) - 1) * 100;
    };
    expect(attendus(ch, "la-critique-du-tri")).toEqual({
      "TRI global du projet A (%)": centime(global(A)),
      "TRI global de B (%)": centime(global(B)),
      "TRI global des flux différentiels (%)": centime(global(diff)),
    });
    expect([global(A), global(B), global(diff)].map(centime)).toEqual([17.07, 15.43, 11.22]);
    expect(juste(ch, "le-choix")).toBe("La ligne semi-automatique : sa VAN est la plus forte");
  });

  it("les deux paris épinglés", () => {
    expect(juste(ch, "predire-le-croisement")).toBe("Fond, puis s'inverse : B attend plus longtemps le retour d'une mise plus lourde");
    expect(juste(ch, "predire-l-entretien")).toBe("Jusqu'à 13 000 € ou 14 000 €");
  });

  it("le curseur de l'entretien : la VAN de B, droite de l'entretien, face à celle de la ligne manuelle", () => {
    const vb = (e: number) => vanALaMain(fluxALaMain(LIGNE_B, { entretien: e }), T);
    expect(vb(13_273)).toBeGreaterThan(vanA);
    expect(vb(13_274)).toBeLessThan(vanA);
    expect(curseur(ch, "l-entretien-au-curseur")).toEqual({
      attendu: 13_273,
      bornes: [10_000, 20_000],
      droites: [centime(vanB), centime(vanA), centime(vb(20_000)), centime(vanA)],
      lecture: { "VAN du projet B": centime(vb(13_273)), "VAN du projet A": centime(vanA), "Ce que B crée de plus que le projet A": centime(centime(vb(13_273)) - centime(vanA)) },
    });
    expect(centime(vb(20_000))).toBe(centime(vanB - 10_000 * 0.75 * annuite));
  });

  it("le laboratoire : égaler les deux VAN au dixième de point, et le rendement selon le réinvestissement", () => {
    const l = laboratoire(ch, "le-laboratoire-des-deux-lignes");
    expect(l.depart).toEqual({ taux: 9, reinvestissement: 1 });
    expect(l.solution).toEqual({ taux: 12.7, reinvestissement: 1 });
    expect(l.reussi).toEqual([false, true]);
    expect(ECART_ADMIS_AU_DEFI).toBe(100);
    // Au pas de 0,1 point, seul 12,7 % égale les deux VAN à 100 € près.
    const ecart = (r: number) => centime(centime(vanALaMain(B, r)) - centime(vanALaMain(A, r)));
    expect([ecart(0.126), ecart(0.127), ecart(0.128)]).toEqual([319.58, 82.73, -153.14]);
    expect([12.6, 12.8].map((taux) => l.atteint({ taux, reinvestissement: 1 }))).toEqual([false, false]);
    expect(l.atteint({ taux: 12.7, reinvestissement: 2 })).toBe(true);
    const lire = (r: number, a: number, b: number) => ({
      "VAN du projet A": centime(vanALaMain(A, r)),
      "VAN du projet B": centime(vanALaMain(B, r)),
      "Ce que B crée de plus que le projet A": ecart(r),
      "Rendement du projet A": a,
      "Rendement du projet B": b,
    });
    expect(l.auDepart).toEqual(lire(0.09, 20.92, 18.09));
    expect(l.aLaSolution).toEqual(lire(0.127, 20.92, 18.09));
    // Les flux replacés au taux d'actualisation : à 12,7 %, le TRI global ; replacés à leur propre TRI, il retrouve le TRI.
    const global = (f: readonly number[], r: number) => {
      let mise = -f[0]!;
      let acquis = 0;
      f.forEach((y, i) => {
        if (i === 0) return;
        if (y < 0) mise += -y / (1 + r) ** i;
        else acquis += y * (1 + r) ** (5 - i);
      });
      return ((acquis / mise) ** (1 / 5) - 1) * 100;
    };
    const e = l.e;
    const auTaux = Object.fromEntries(e.lecture(cas, { taux: 12.7, reinvestissement: 2 }).map((y) => [y.libelle, y.montant]));
    expect([auTaux["Rendement du projet A"], auTaux["Rendement du projet B"]]).toEqual([centime(global(A, 0.127)), centime(global(B, 0.127))]);
    expect([centime(global(A, 0.127)), centime(global(B, 0.127))]).toEqual([18.27, 16.51]);
    expect(global(A, k.triA)).toBeCloseTo(k.triA * 100, 4);
    // Le graphique : les deux VAN selon le taux, en quelques points.
    const [ca, cb] = l.graphique.courbes;
    expect(l.graphique.levier).toBe("taux");
    for (const taux of [0, 9, 12.7, 25]) {
      expect(ca!.valeur({ taux, reinvestissement: 1 })).toBeCloseTo(vanALaMain(A, taux / 100), 1);
      expect(cb!.valeur({ taux, reinvestissement: 1 })).toBeCloseTo(vanALaMain(B, taux / 100), 1);
    }
    expect([ca!.valeur({ taux: 0, reinvestissement: 1 }), cb!.valeur({ taux: 0, reinvestissement: 1 })]).toEqual([130_200, 170_512.5]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas « Revendre la machine plus tôt » : la ligne revendue après 3 ans", () => {
  const s = REVENDRE_LA_MACHINE_PLUS_TOT;
  const r = revendrePlusTot(cas);

  it("tient ce qu'un cas dédié doit tenir", () => {
    casDedie(s, LA_VALEUR_ACTUELLE_NETTE);
    expect(s.commanditaire).toBe("Le directeur financier");
    expect(DUREE_AVANT_LA_REVENTE).toBe(3);
  });

  it("la revente, le dernier flux, la VAN raccourcie et celle d'un an de plus, refaits à la main", () => {
    expect(attendus(s, "la-revente")).toEqual({
      "Valeur nette comptable de la ligne à la fin de N+3": 30_000,
      "Valeur résiduelle nette de la ligne": 0.6 * 30_000 + 0.25 * 12_000,
      "Valeur résiduelle nette du projet": 21_000 + 0.25 * (40_000 - 3 * 8_000),
    });
    const trois = fluxALaMain(LIGNE_A, { duree: 3 });
    const quatre = fluxALaMain(LIGNE_A, { duree: 4 });
    expect(trois.map(centime)).toEqual([-116_230, -22_815, 35_625, 75_075 + 25_000 + 37_620]);
    expect(quatre.at(-1)).toBe(75_075 + 16_000 + 37_620);
    expect(attendus(s, "la-van-raccourcie")).toEqual({
      "Flux disponible de la date 3": 137_695,
      "VAN du projet arrêté à la fin de N+3": centime(vanALaMain(trois, T)),
      "VAN du projet arrêté à la fin de N+4": centime(vanALaMain(quatre, T)),
    });
    expect([centime(vanALaMain(trois, T)), centime(vanALaMain(quatre, T))]).toEqual([-850.54, 41_966.11]);
  });

  it("à rebours, le prix de la ligne qui annule la VAN", () => {
    const manque = 850.54 * 1.09 ** 3;
    const prix = (21_000 + centime(manque) - 0.25 * 30_000) / 0.75;
    expect(attendus(s, "a-rebours")).toEqual({
      "Valeur résiduelle nette qui manque à la date 3": centime(manque),
      "Prix de cession minimal de la ligne": centime(prix),
      "Part de la valeur nette comptable (%)": centime((centime(prix) / 30_000) * 100),
    });
    expect([centime(manque), centime(prix), centime((prix / 30_000) * 100)]).toEqual([1_101.47, 19_468.63, 64.9]);
    expect(vanALaMain(fluxALaMain(LIGNE_A, { duree: 3, prixDeLaLigne: 19_468.632 }), T)).toBeCloseTo(0, 1);
  });

  it("le curseur du prix de revente", () => {
    const v = (p: number) => vanALaMain(fluxALaMain(LIGNE_A, { duree: 3, prixDeLaLigne: p }), T);
    expect(v(19_469)).toBeGreaterThan(0);
    expect(v(19_468)).toBeLessThan(0);
    expect(curseur(s, "le-prix-au-curseur")).toEqual({
      attendu: 19_469,
      bornes: [10_000, 30_000],
      droites: [centime(v(10_000) + 100_000), 100_000, centime(v(30_000) + 100_000), 100_000],
      lecture: {
        "Valeur résiduelle nette de la ligne": 19_469 * 0.75 + 7_500,
        "Flux disponible de la date 3": 137_695 + 19_469 * 0.75 + 7_500 - 21_000,
        "VAN du projet de 3 ans": centime(v(19_469)),
      },
    });
  });

  it("le verdict : pas sur 3 ans tel quel", () => {
    expect(r.verdict).toBe("trois-ans-detruisent");
    expect(juste(s, "reponse")).toBe("Pas sur 3 ans tel quel : il faut revendre la ligne au moins 19 468,63 €, ou garder l'atelier un an de plus");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

describe("le cas « Acheter les deux machines » : le rationnement sous un budget de 210 000 €", () => {
  const s = ACHETER_LES_DEUX_MACHINES;
  const k = acheterLesDeux(cas);

  it("tient ce qu'un cas dédié doit tenir", () => {
    casDedie(s, LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS);
    expect(s.commanditaire).toBe("La directrice générale");
    expect(BUDGET_DU_CAS).toBe(210_000);
  });

  it("les programmes qui tiennent dans le budget, refaits à la main", () => {
    expect(attendus(s, "les-programmes")).toEqual({
      "Mise de la ligne semi-automatique et du banc": 206_230 + 30_000,
      "VAN de la ligne manuelle et du banc": centime(centime(vanA) + centime(vanC)),
      "Ce que ce programme crée de plus que la ligne semi-automatique seule": centime(centime(vanA) + centime(vanC) - centime(vanB)),
    });
    expect(206_230 + 30_000).toBeGreaterThan(210_000);
    expect([206_230, 146_230].every((m) => m <= 210_000)).toBe(true);
    expect(centime(centime(vanA) + centime(vanC) - centime(vanB))).toBe(4_208.53);
    expect(k.meilleur.nom).toBe("AC");
    expect(k.verdict).toBe("la-ligne-manuelle-et-le-banc");
  });

  it("à rebours, les retours que le banc doit éviter", () => {
    const vise = vanB - vanA;
    const flux = (centime(vise) + 30_000) / annuite;
    const retours = ((centime(flux) - 6_000) / 0.75 + 6_000 + 1_400) / 40;
    expect(attendus(s, "a-rebours")).toEqual({
      "VAN que le banc doit atteindre": centime(vise),
      "Flux annuel du banc nécessaire": centime(flux),
      "Retours évités par an, au minimum": centime(retours),
    });
    expect([centime(flux), centime(retours)]).toEqual([10_168.02, 323.93]);
    expect(vanALaMain(fluxDuBanc(retours), T)).toBeCloseTo(vise, 1);
  });

  it("le curseur des retours évités", () => {
    const avance = (n: number) => vanA + vanALaMain(fluxDuBanc(n), T) - vanB;
    expect(avance(324)).toBeGreaterThan(0);
    expect(avance(323)).toBeLessThan(0);
    expect(curseur(s, "le-banc-au-curseur")).toEqual({
      attendu: 324,
      bornes: [250, 400],
      droites: [centime(centime(vanA) + centime(vanALaMain(fluxDuBanc(250), T))), centime(vanB), centime(centime(vanA) + centime(vanALaMain(fluxDuBanc(400), T))), centime(vanB)],
      lecture: {
        "VAN du banc": centime(vanALaMain(fluxDuBanc(324), T)),
        "VAN de la ligne manuelle et du banc": centime(centime(vanA) + centime(vanALaMain(fluxDuBanc(324), T))),
        "VAN de la ligne semi-automatique seule": centime(vanB),
        "Avance du programme": centime(centime(vanA) + centime(vanALaMain(fluxDuBanc(324), T)) - centime(vanB)),
      },
    });
    expect(centime(vanALaMain(fluxDuBanc(324), T))).toBe(9_557.75);
  });

  it("le verdict : la ligne manuelle et le banc, sous condition", () => {
    expect(juste(s, "reponse")).toBe("La ligne manuelle et le banc, si le banc évite au moins 324 retours par an");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
