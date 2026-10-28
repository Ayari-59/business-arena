import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  COUT_D_ACQUISITION,
  LEVIERS_DE_LA_CAMPAGNE,
  TRANSFORMATION_VARIANTE,
  acquisitionDuCabinet,
  campagne,
} from "../../src/config/cours/chapitres/cout-d-acquisition";
import { ATLAS_CONSEIL } from "../../src/config/cours/monde/atlas-conseil";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { BUDGET_ENVISAGE, COUPER_LE_BUDGET_DE_CAMPAGNE, coupeDuBudget } from "../../src/config/cours/situations/par-chapitre/couper-le-budget-de-campagne";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE COÛT D'ACQUISITION, AU CABINET DU MONDE DU COURS, ET SON CAS : COUPER LE BUDGET DE CAMPAGNE ?
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche d'ATLAS CONSEIL (monde/atlas-conseil.ts) :
 * les canaux et leur entonnoir, la courbe de la campagne (interpolée ici à la main entre ses paliers),
 * la valeur vie d'un compte (marge ÷ attrition, et actualisée) ; sans les fonctions du chapitre ni le
 * modèle (monde/relation-client.ts). Les valeurs absolues sont épinglées, la variante (30 % des devis
 * signés), les curseurs, le laboratoire (au départ, à la solution, et les courbes de son graphique)
 * refaits comme le reste, et les verdicts aussi. Puis les gardes de texte de l'étalon
 * (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "conseil";
const cas = casDeLEntreprise(code);
const f = ATLAS_CONSEIL;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

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
  // L'unité des textes est la journée, au féminin, quelle que soit l'unité du cas de l'arène.
  const masculinFautif = /\bun journée\b|\bjournées? (vendu|demandé|refusé|facturé|perdu|gagné)s?(?![\wéèêà])/i;
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (comptes?|journées?|consultants?|années?|ans|canaux|recrues?|trimestres?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
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

// LA FICHE, REFAITE À LA MAIN : les canaux, la courbe et la valeur d'un compte.
const canal = (k: string) => f.canaux.find((x) => x.code === k)!;
const prospection = canal("prospection");
const salons = canal("salons");
const digital = canal("digital");
const apporteurs = canal("apporteurs");
const coutTotal = somme(f.canaux.map((k) => k.cout));
const contratsTotal = somme(f.canaux.map((k) => k.contrats));
const devisTotal = somme(f.canaux.map((k) => k.devis));
const cac = coutTotal / contratsTotal;
const marge = (somme(f.comptes.map((c) => c.chiffreDAffaires)) - somme(f.comptes.map((c) => c.frais)) - somme(f.comptes.map((c) => c.journees)) * 220) / f.comptes.length;
const n = f.portefeuilleDesAnnees.find((p) => p.annee === "N")!;
const a = n.perdus / n.auPremierJanvier;
const simple = marge / a;
const actualisee = centime(marge / (a + f.tauxDActualisation));
/** Les contacts d'un budget, interpolés à la main entre deux paliers de la courbe, plats au-delà du dernier. */
function contactsA(budget: number) {
  const c = f.courbeDeLaCampagne;
  for (let i = 1; i < c.length; i++) if (budget <= c[i]!.budget) return c[i - 1]!.contacts + ((budget - c[i - 1]!.budget) * (c[i]!.contacts - c[i - 1]!.contacts)) / (c[i]!.budget - c[i - 1]!.budget);
  return c.at(-1)!.contacts;
}
/** Les comptes attendus : contacts → rendez-vous → devis au taux de la campagne de N, puis la part de devis signés. */
const comptesA = (budget: number, signes = digital.contrats / digital.devis) => (contactsA(budget) * digital.devis * signes) / digital.contacts;

describe("le coût d'acquisition, chez ATLAS CONSEIL", () => {
  const ch = COUT_D_ACQUISITION;

  it("se joue chez ATLAS CONSEIL seule, au palier 3 du BTS NDRC, et son cas aussi", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(COUPER_LE_BUDGET_DE_CAMPAGNE);
    expect(ch.parcours).toBe("ndrc");
    expect(ch.palier).toBe(3);
    expect(ch.entreprises?.codes).toEqual(["conseil"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(COUPER_LE_BUDGET_DE_CAMPAGNE.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
  });

  it("la fiche donne les chiffres du chapitre", () => {
    expect([coutTotal, contratsTotal, devisTotal, cac]).toEqual([120_000, 8, 35, 15_000]);
    expect([marge, simple, actualisee]).toEqual([21_000, 84_000, 60_000]);
    expect(f.courbeDeLaCampagne.map((p) => [p.budget, p.contacts])).toEqual([
      [0, 0],
      [12_000, 360],
      [24_000, 600],
      [36_000, 720],
      [48_000, 750],
    ]);
    expect([0, 12_000, 24_000, 36_000, 48_000].map((b) => centime(comptesA(b)))).toEqual([0, 1.2, 2, 2.4, 2.5]);
    expect([contactsA(30_000), contactsA(60_000)]).toEqual([660, 750]);
  });

  it("les étapes guidées : le coût d'acquisition par canal, l'entonnoir et le taux de transformation des devis", () => {
    expect(attendus(ch, "cac-par-canal")).toEqual({
      "Coût d'acquisition, prospection téléphonique et visites": prospection.cout / prospection.contrats,
      "Coût d'acquisition, salons professionnels": salons.cout / salons.contrats,
      "Coût d'acquisition, campagne digitale": digital.cout / digital.contrats,
      "Coût d'acquisition, apporteurs d'affaires": apporteurs.cout / apporteurs.contrats,
      "Coût d'acquisition du cabinet": cac,
    });
    expect([prospection, salons, digital, apporteurs].map((k) => k.cout / k.contrats)).toEqual([18_000, 18_600, 12_000, 4_800]);
    expect(attendus(ch, "l-entonnoir")).toEqual({
      "Taux de rendez-vous de la campagne (%)": centime((digital.rendezVous / digital.contacts) * 100),
      "Taux de devis de la campagne (%)": (digital.devis / digital.rendezVous) * 100,
      "Taux de transformation des devis de la campagne (%)": (digital.contrats / digital.devis) * 100,
      "Taux de transformation des devis du cabinet (%)": centime((contratsTotal / devisTotal) * 100),
    });
    expect([centime((50 / 600) * 100), centime((8 / 35) * 100)]).toEqual([8.33, 22.86]);
    // Les taux de transformation des devis, canal par canal : 20 %, 25 %, 20 %, 50 %.
    expect([prospection, salons, digital, apporteurs].map((k) => k.contrats / k.devis)).toEqual([0.2, 0.25, 0.2, 0.5]);
    expect(juste(ch, "le-canal-le-moins-cher")).toBe("L'apporteur, mais il ne présente que quelques entreprises par an");
    // Le distracteur : le contact digital est le moins cher (40 €), mais un sur 300 seulement devient un compte.
    expect([prospection, salons, digital, apporteurs].map((k) => centime(k.cout / k.contacts))).toEqual([45, 93, 40, 1_200]);
  });

  it("le premier cycle : le pari, les rendez-vous de la prospection au curseur, puis le calcul", () => {
    expect(juste(ch, "predire-les-rendez-vous")).toBe("20 % de rendez-vous en plus");
    // Ce que justifient ses comptes : r × 3 ÷ 60 comptes à 15 000 € ; il faut couvrir 54 000 €.
    const justifie = (r: number) => (r * prospection.contrats * cac) / prospection.rendezVous;
    const rdv = Math.ceil((prospection.cout * prospection.rendezVous) / (prospection.contrats * cac));
    expect(rdv).toBe(72);
    expect(curseur(ch, "les-rendez-vous-au-curseur")).toEqual({
      attendu: rdv,
      bornes: [40, 100],
      droites: [justifie(40), prospection.cout, justifie(100), prospection.cout],
      lecture: {
        "Budget que justifient ses comptes": 54_000,
        "Coût de la prospection": 54_000,
        "Coût d'acquisition d'un compte de la prospection": 15_000,
        "Budget justifié moins coût du canal": 0,
      },
    });
    expect([justifie(40), justifie(100)]).toEqual([30_000, 75_000]);
    expect(attendus(ch, "les-rendez-vous-qu-il-faut")).toEqual({
      "Comptes gagnés pour 100 rendez-vous": 100 * (prospection.devis / prospection.rendezVous) * (prospection.contrats / prospection.devis),
      "Comptes à gagner dans l'année": prospection.cout / cac,
      "Rendez-vous nécessaires": rdv,
    });
    expect([prospection.cout / cac, (prospection.cout / cac / 5) * 100]).toEqual([3.6, 72]);
  });

  it("les paliers de la campagne : des comptes attendus, un coût moyen qui monte peu", () => {
    expect(attendus(ch, "les-paliers")).toEqual({
      "Comptes attendus à 12 000 €": 1.2,
      "Comptes attendus à 36 000 €": 2.4,
      "Comptes attendus à 48 000 €": 2.5,
      "Coût d'acquisition moyen au dernier palier": 48_000 / 2.5,
    });
    expect([12_000 / 1.2, 24_000 / 2, 36_000 / 2.4, 48_000 / 2.5].map(centime)).toEqual([10_000, 12_000, 15_000, 19_200]);
    expect(juste(ch, "predire-le-budget")).toBe("Pas forcément : il faut voir ce que coûte le compte en plus");
  });

  it("le laboratoire de la campagne : le budget où le dernier euro ne rapporte plus", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-campagne");
    expect(l.depart).toEqual({ budget: 24_000, transformation: 20, valeur: 2 });
    expect(l.solution).toEqual({ budget: 36_000, transformation: 20, valeur: 2 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.e.leviers(cas).find((x) => x.code === "valeur")!.choix!.map((x) => x.valeur)).toEqual([0, 1, 2]);
    const valeurs = [marge, actualisee, simple];
    const pas = LEVIERS_DE_LA_CAMPAGNE.budget.pas;
    const lire = (b: number, t: number, v: number) => {
      const gain = (x: number) => comptesA(x, t / 100) * valeurs[v]! - x;
      return {
        "Contacts amenés": centime(contactsA(b)),
        "Comptes attendus": centime(comptesA(b, t / 100)),
        "Coût d'acquisition moyen": centime(b / comptesA(b, t / 100)),
        "Valeur créée par les comptes gagnés": centime(comptesA(b, t / 100) * valeurs[v]!),
        "Ce qu'ont rapporté les 2 000 derniers euros": centime(gain(b) - gain(b - pas)),
        "Ce que rapporteraient 2 000 € de plus": centime(gain(b + pas) - gain(b)),
        "Gain de la campagne": centime(gain(b)),
      };
    };
    expect(l.auDepart).toEqual(lire(24_000, 20, 2));
    expect(l.aLaSolution).toEqual(lire(36_000, 20, 2));
    expect(Object.values(l.auDepart)).toEqual([600, 2, 12_000, 168_000, 9_200, 3_600, 144_000]);
    expect(Object.values(l.aLaSolution)).toEqual([720, 2.4, 15_000, 201_600, 3_600, -600, 165_600]);
    // Les autres mesures : le même budget actualisé ; 24 000 € sur la seule première année ; 48 000 € à 30 %.
    expect(l.d.atteint({ budget: 36_000, transformation: 20, valeur: 1 })).toBe(true);
    expect(l.d.atteint({ budget: 24_000, transformation: 20, valeur: 0 })).toBe(true);
    expect(l.d.atteint({ budget: 36_000, transformation: 20, valeur: 0 })).toBe(false);
    expect(l.d.atteint({ budget: 48_000, transformation: 30, valeur: 2 })).toBe(true);
    expect(l.d.atteint({ budget: 36_000, transformation: 30, valeur: 2 })).toBe(false);
    expect([1.2, 2, 2.4, 2.5].map((k, i) => k * marge - (i + 1) * 12_000)).toEqual([13_200, 18_000, 14_400, 4_500]);
    expect(l.d.indice(l.depart)).toBe("2 000 € de plus rapporteraient encore 3 600 € une fois payés : montez le budget.");
  });

  it("le graphique du laboratoire : la valeur créée, concave, le budget, une droite, et le gain entre les deux", () => {
    const e = ch.etapes.find((x) => x.id === "le-laboratoire-de-la-campagne") as EtapeSimulation;
    const g = e.graphique!(cas);
    expect(g.levier).toBe("budget");
    const [valeur, budget, gain] = g.courbes;
    const p = (b: number) => ({ budget: b, transformation: 20, valeur: 2 });
    expect([0, 12_000, 24_000, 36_000, 48_000].map((b) => valeur!.valeur(p(b)))).toEqual([0, 100_800, 168_000, 201_600, 210_000]);
    expect([0, 24_000, 48_000].map((b) => budget!.valeur(p(b)))).toEqual([0, 24_000, 48_000]);
    expect([0, 12_000, 24_000, 36_000, 48_000].map((b) => gain!.valeur(p(b)))).toEqual([0, 88_800, 144_000, 165_600, 162_000]);
  });

  it("les étapes d'expert : le compte en plus, la valeur qui ferait payer le dernier palier, la variante à 30 %", () => {
    expect(attendus(ch, "le-compte-en-plus")).toEqual({
      "Coût du compte en plus, de 24 000 € à 36 000 €": 12_000 / centime(comptesA(36_000) - comptesA(24_000)),
      "Coût du compte en plus, de 36 000 € à 48 000 €": 12_000 / centime(comptesA(48_000) - comptesA(36_000)),
      "Gain du dernier palier": centime(centime(comptesA(48_000) - comptesA(36_000)) * simple - 12_000),
    });
    expect([12_000 / 0.4, 12_000 / 0.1, 0.1 * simple - 12_000].map(centime)).toEqual([30_000, 120_000, -3_600]);
    // Le dernier palier paierait si 0,1 compte valait 12 000 € : un compte à 120 000 €.
    expect(curseur(ch, "le-dernier-palier-au-curseur")).toEqual({
      attendu: 120,
      bornes: [40, 160],
      droites: [0.1 * 40_000, 12_000, 0.1 * 160_000, 12_000],
      lecture: { "Valeur des comptes du dernier palier": 12_000, "Budget du dernier palier": 12_000, "Gain du dernier palier": 0 },
    });
    expect(TRANSFORMATION_VARIANTE).toBe(0.3);
    const avant = centime(comptesA(36_000, 0.3));
    const apres = centime(comptesA(48_000, 0.3));
    expect(attendus(ch, "mieux-transformer")).toEqual({
      "Comptes attendus à 36 000 €": avant,
      "Comptes attendus à 48 000 €": apres,
      "Coût du compte en plus du dernier palier": centime(12_000 / centime(apres - avant)),
      "Gain du dernier palier, variante": centime(centime(apres - avant) * simple - 12_000),
    });
    expect([avant, apres, centime(12_000 / 0.15), centime(0.15 * simple - 12_000)]).toEqual([3.6, 3.75, 80_000, 600]);
    expect(juste(ch, "jusqu-ou")).toBe("36 000 € : au-delà, le compte en plus coûte plus qu'il ne vaut");
  });

  it("la synthèse finit sur l'arène, et l'ancien export `campagne` donne toujours le coût d'acquisition", () => {
    const e = ch.etapes.at(-1)!;
    if (e.type !== "lecture") throw new Error("La synthèse est une lecture");
    expect(e.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    // L'export gardé pour tests/cours/commissions-des-partenaires.test.ts : 15 000 €, lu sur la fiche du cabinet.
    expect(campagne(cas).cac).toBe(cac);
    expect(campagne(casDeLEntreprise("ecommerce")).cac).toBe(cac);
    expect(acquisitionDuCabinet(cas).meilleur.budget).toBe(36_000);
  });

  it("le cas : la coupe fait baisser le coût moyen, et détruit de la valeur", () => {
    const s = COUPER_LE_BUDGET_DE_CAMPAGNE;
    casDedie(s, ch);
    expect(s.commanditaire).toBe("La directrice financière");
    expect(BUDGET_ENVISAGE).toBe(0.5);
    const avant = comptesA(digital.cout);
    const apres = comptesA(digital.cout * 0.5);
    expect(attendus(s, "aujourd-hui")).toEqual({
      "Comptes attendus au budget de N": avant,
      "Comptes attendus à la moitié du budget": centime(apres),
      "Coût d'acquisition moyen au budget de N": digital.cout / avant,
      "Coût d'acquisition moyen à la moitié du budget": centime(12_000 / centime(apres)),
    });
    expect([avant, centime(apres), digital.cout / avant, 12_000 / 1.2]).toEqual([2, 1.2, 12_000, 10_000]);
    const perdus = centime(avant - apres);
    expect(attendus(s, "la-coupe")).toEqual({ "Comptes perdus": perdus, "Coût d'un compte perdu": 12_000 / perdus, "Valeur vie nette perdue": centime(perdus * simple - 12_000) });
    expect([perdus, 12_000 / perdus, centime(perdus * simple - 12_000)]).toEqual([0.8, 15_000, 55_200]);
    // À rebours : la coupe ne paierait que si 0,8 compte valait au plus 12 000 €, soit 15 000 € l'un.
    expect(curseur(s, "le-seuil-de-la-coupe")).toEqual({
      attendu: 15,
      bornes: [0, 40],
      droites: [12_000, 0, 12_000, perdus * 40_000],
      lecture: { "Économie de la coupe": 12_000, "Valeur des comptes perdus": 12_000, "Ce que la coupe rapporte ou fait perdre": 0 },
    });
    expect(attendus(s, "trois-mesures")).toEqual({
      "Marge de la première année perdue": perdus * marge,
      "Effet de la coupe sur la première année": 12_000 - perdus * marge,
      "Valeur vie nette perdue, actualisée": perdus * actualisee - 12_000,
    });
    expect([perdus * marge, 12_000 - perdus * marge, perdus * actualisee - 12_000]).toEqual([16_800, -4_800, 36_000]);
    expect(coupeDuBudget(cas).verdict).toBe("garder");
    expect(juste(s, "reponse")).toBe("Garder : la coupe détruit 55 200 € de valeur vie nette");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(COUPER_LE_BUDGET_DE_CAMPAGNE));
});
