import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { EFFORT_DE_FIDELISATION, RAPPORT_VISE, SOLUTION_DU_LABORATOIRE, VALEUR_D_UN_CLIENT } from "../../src/config/cours/chapitres/valeur-d-un-client";
import { ATLAS_CONSEIL } from "../../src/config/cours/monde/atlas-conseil";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import {
  BAISSE_D_ATTRITION_PROMISE,
  LE_PROGRAMME_DE_FIDELITE,
  REMISE_DE_FIDELITE,
  programmeDeFidelite,
} from "../../src/config/cours/situations/par-chapitre/le-programme-de-fidelite";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LA VALEUR D'UN CLIENT, AU CABINET DU MONDE DU COURS, ET SON CAS : LE PROGRAMME DE FIDÉLITÉ.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche d'ATLAS CONSEIL (monde/atlas-conseil.ts),
 * sans les fonctions du chapitre ni le modèle (monde/relation-client.ts) ; les valeurs absolues sont
 * épinglées, la variante (recruter ou fidéliser), le calcul à rebours, les curseurs, le laboratoire
 * (au départ, à la solution, et les courbes de son graphique) refaits comme le reste, et les verdicts
 * aussi. Puis les gardes de texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts) : rien
 * d'indéfini, pas de « de le », pas de tiret au milieu d'une phrase, des élisions faites, le signe
 * moins, une seule bonne réponse, aucune option qui en contient une autre, des libellés uniques, des
 * notions qui existent, des accords avec « journée ».
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

// LA FICHE, REFAITE À LA MAIN : le cabinet de l'année N.
const comptes = f.comptes.length;
const ca = somme(f.comptes.map((c) => c.chiffreDAffaires));
const frais = somme(f.comptes.map((c) => c.frais));
const journees = somme(f.comptes.map((c) => c.journees));
const coutJournalier = f.consultants.coutAnnuel / (f.consultants.joursFacturablesParTrimestre * 4);
const margeDesComptes = ca - frais - journees * coutJournalier;
const marge = margeDesComptes / comptes;
const caMoyen = ca / comptes;
const [n2, n1, n] = f.portefeuilleDesAnnees;
const attrition = (p: typeof n) => p!.perdus / p!.auPremierJanvier;
const a = attrition(n);
const taux = f.tauxDActualisation;
const cac = somme(f.canaux.map((k) => k.cout)) / somme(f.canaux.map((k) => k.contrats));
const simple = marge / a;
const actualisee = centime(marge / (a + taux));
const capacite = f.consultants.nombre * f.consultants.joursFacturablesParTrimestre * 4;
const parCompte = journees / comptes;
const aLaCapacite = capacite / parCompte;
const recrues = n!.nouveaux;

describe("la valeur d'un client, chez ATLAS CONSEIL", () => {
  const ch = VALEUR_D_UN_CLIENT;

  it("se joue chez ATLAS CONSEIL seule, au palier 3 du BTS NDRC, et son cas aussi", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(LE_PROGRAMME_DE_FIDELITE);
    expect(ch.parcours).toBe("ndrc");
    expect(ch.palier).toBe(3);
    expect(ch.entreprises?.codes).toEqual(["conseil"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(LE_PROGRAMME_DE_FIDELITE.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(f.entreprise).toBe(cas.entreprise);
  });

  it("la fiche donne les chiffres du chapitre", () => {
    expect([comptes, journees, ca, frais, coutJournalier, margeDesComptes, marge, caMoyen]).toEqual([32, 1_920, 1_382_400, 288_000, 220, 672_000, 21_000, 43_200]);
    expect([n2, n1, n].map((p) => [p!.auPremierJanvier, p!.perdus, p!.nouveaux])).toEqual([
      [28, 5, 8],
      [31, 7, 8],
      [32, 8, 8],
    ]);
    expect([a, 1 / a, simple, actualisee, cac, taux]).toEqual([0.25, 4, 84_000, 60_000, 15_000, 0.1]);
    expect([capacite, parCompte, aLaCapacite]).toEqual([2_400, 60, 40]);
  });

  it("les étapes guidées : l'attrition, la marge d'un compte, la valeur vie, le coût d'acquisition", () => {
    const auDixieme = (x: number) => Math.round(x * 1_000) / 10;
    expect(attendus(ch, "l-attrition")).toEqual({
      "Taux d'attrition de N − 2 (%)": auDixieme(attrition(n2)),
      "Taux d'attrition de N − 1 (%)": auDixieme(attrition(n1)),
      "Taux d'attrition de N (%)": 25,
      "Taux de fidélisation de N (%)": 75,
    });
    expect([auDixieme(attrition(n2)), auDixieme(attrition(n1))]).toEqual([17.9, 22.6]);
    expect(attendus(ch, "la-marge-d-un-compte")).toEqual({ "Marge sur coûts directs des comptes": 672_000, "Chiffre d'affaires d'un compte moyen": 43_200, "Marge d'un compte moyen": 21_000 });
    expect(attendus(ch, "la-valeur-vie")).toEqual({ "Durée de vie moyenne (années)": 4, "Valeur vie client": 84_000 });
    expect(attendus(ch, "le-cout-d-acquisition")).toEqual({ "Coût des canaux de conquête": 120_000, "Coût d'acquisition d'un compte": 15_000, "Valeur vie ÷ coût d'acquisition": 5.6 });
    // La correction de l'audit : un rapport de 5,6, et non plus de 72.
    expect(centime(simple / cac)).toBe(5.6);
  });

  it("le verdict de la marge : celle des coûts directs, et les deux erreurs chiffrées", () => {
    expect(juste(ch, "quelle-marge")).toBe("La marge sur coûts directs, 21 000 € : le temps des consultants compris");
    const mcv = (ca - frais) / comptes;
    expect([mcv, mcv / a, caMoyen / a]).toEqual([34_200, 136_800, 172_800]);
  });

  it("le premier cycle : le pari, le portefeuille au rythme de N − 2 au curseur, puis l'équilibre", () => {
    expect(juste(ch, "predire-l-equilibre")).toBe("Grossi de moins en moins vite, jusqu'à un plafond");
    // Au rythme de N − 2 : les recrues apportent 8 × 21 000 € ; les départs emportent 5 ÷ 28 × 21 000 € par compte.
    const departsParCompte = (n2!.perdus * marge) / n2!.auPremierJanvier;
    expect(departsParCompte).toBe(3_750);
    const tient = Math.floor((recrues * marge) / departsParCompte);
    expect(tient).toBe(44);
    expect(curseur(ch, "le-portefeuille-au-curseur")).toEqual({
      attendu: tient,
      bornes: [20, 60],
      droites: [recrues * marge, 20 * departsParCompte, recrues * marge, 60 * departsParCompte],
      lecture: {
        "Marge apportée par les recrues": 168_000,
        "Marge emportée par les départs": 44 * 3_750,
        "Marge gagnée ou perdue par le portefeuille": 168_000 - 44 * 3_750,
      },
    });
    expect(attendus(ch, "l-equilibre")).toEqual({
      "Portefeuille d'équilibre au rythme de N": recrues / a,
      "Portefeuille d'équilibre au rythme de N − 2": centime(recrues / attrition(n2)),
      "Comptes d'équilibre perdus": centime(recrues / attrition(n2) - recrues / a),
    });
    expect([recrues / a, centime(recrues / attrition(n2)), centime(recrues / attrition(n2) - recrues / a)]).toEqual([32, 44.8, 12.8]);
  });

  it("le deuxième cycle : recruter ou fidéliser, l'attrition qui remplit les consultants, puis la variante face à la capacité", () => {
    expect(juste(ch, "predire-recruter-ou-fideliser")).toBe("Perdre moins de comptes");
    // Un portefeuille de 40 comptes tient tant que 40 × a × 21 000 € ≤ 8 × 21 000 €, soit a ≤ 20 %.
    expect(curseur(ch, "l-attrition-au-curseur")).toEqual({
      attendu: 20,
      bornes: [10, 30],
      droites: [168_000, aLaCapacite * 10 * 210, 168_000, aLaCapacite * 30 * 210],
      lecture: {
        "Marge apportée par les recrues": 168_000,
        "Marge emportée par les départs": aLaCapacite * 0.2 * marge,
        "Valeur vie d'un compte à cette attrition": marge / 0.2,
        "Marge gagnée ou perdue par le portefeuille": 0,
      },
    });
    expect(EFFORT_DE_FIDELISATION).toBe(0.25);
    const enRecrutant = (recrues * 1.25) / a;
    const enFidelisant = recrues / (a * 0.75);
    expect(attendus(ch, "recruter-ou-fideliser")).toEqual({
      "Portefeuille d'équilibre en recrutant": enRecrutant,
      "Portefeuille d'équilibre en fidélisant": centime(enFidelisant),
      "Journées demandées par le plus grand portefeuille": centime(enFidelisant * parCompte),
    });
    expect([enRecrutant, centime(enFidelisant), centime(enFidelisant * parCompte)]).toEqual([40, 42.67, 2_560]);
    expect(enFidelisant * parCompte).toBeGreaterThan(capacite);
    expect(juste(ch, "la-capacite")).toBe("Fidéliser, en prévoyant un consultant de plus");
  });

  it("le troisième cycle : le pari sur l'actualisation, puis le laboratoire de la valeur", () => {
    expect(juste(ch, "predire-l-actualisation")).toBe("Elle monterait, mais bien moins que du double");
    expect([marge / (a / 2), marge / (a / 2 + taux)].map(centime)).toEqual([168_000, 93_333.33]);
    const l = laboratoire(ch, "le-laboratoire-de-la-valeur");
    expect(l.depart).toEqual({ recrues: 8, attrition: 25, methode: 0 });
    expect(l.solution).toEqual(SOLUTION_DU_LABORATOIRE);
    expect(l.solution).toEqual({ recrues: 7, attrition: 17.5, methode: 1 });
    expect(l.reussi).toEqual([false, true]);
    // La méthode est un levier à choix : la valeur vie simple ou actualisée.
    expect(l.e.leviers(cas).find((x) => x.code === "methode")!.choix!.map((x) => x.valeur)).toEqual([0, 1]);
    const lire = (r: number, att: number, actu: boolean) => {
      const eq = (r * 100) / att;
      const valeur = actu ? marge / (att / 100 + taux) : marge / (att / 100);
      return {
        "Portefeuille d'équilibre": centime(eq),
        "Journées demandées à l'équilibre": centime(eq * parCompte),
        "Journées que les consultants peuvent faire": capacite,
        "Valeur vie d'un compte, à la méthode choisie": centime(valeur),
        "Valeur vie ÷ coût d'acquisition": centime(centime(valeur) / cac),
        "Marge annuelle du portefeuille d'équilibre": centime(eq * marge),
      };
    };
    expect(l.auDepart).toEqual(lire(8, 25, false));
    expect(l.aLaSolution).toEqual(lire(7, 17.5, true));
    expect(Object.values(l.aLaSolution)).toEqual([40, 2_400, 2_400, 76_363.64, 5.09, 840_000]);
    // Le piège : 8 recrues à 20 % remplissent les consultants, et la valeur simple dit 7 fois ; actualisée, 4,67.
    expect([marge / 0.2 / cac, centime(marge / 0.3 / cac)]).toEqual([7, 4.67]);
    expect(l.d.atteint({ recrues: 8, attrition: 20, methode: 0 })).toBe(false);
    expect(l.d.atteint({ recrues: 8, attrition: 20, methode: 1 })).toBe(false);
    expect(l.d.atteint({ recrues: 6, attrition: 15, methode: 0 })).toBe(true);
    expect(l.d.atteint({ recrues: 9, attrition: 22.5, methode: 1 })).toBe(false);
    expect(l.d.indice({ recrues: 8, attrition: 20, methode: 0 })).toMatch(/^En valeur vie simple, le rapport vaut 7 : passez à la valeur actualisée/);
  });

  it("le graphique du laboratoire : la valeur simple et l'actualisée selon l'attrition, et l'objectif de la direction", () => {
    const e = ch.etapes.find((x) => x.id === "le-laboratoire-de-la-valeur") as EtapeSimulation;
    const g = e.graphique!(cas);
    expect(g.levier).toBe("attrition");
    const [s, act, objectif] = g.courbes;
    const p = (att: number) => ({ recrues: 8, attrition: att, methode: 0 });
    // Valeur simple = 21 000 ÷ a ; actualisée = 21 000 ÷ (a + 10 %) ; l'objectif, 5 × 15 000 €.
    expect([10, 25, 28, 30].map((x) => s!.valeur(p(x)))).toEqual([210_000, 84_000, 75_000, 70_000]);
    expect([10, 18, 25, 30].map((x) => act!.valeur(p(x)))).toEqual([105_000, 75_000, 60_000, 52_500]);
    expect(objectif!.valeur(p(10))).toBe(RAPPORT_VISE * cac);
    expect(objectif!.valeur(p(30))).toBe(75_000);
  });

  it("les étapes d'expert : la valeur actualisée année par année, et l'attrition qui tient l'objectif, à rebours", () => {
    const deuxieme = marge * (1 - a);
    expect(attendus(ch, "la-valeur-actualisee")).toEqual({
      "Marge attendue de la deuxième année": deuxieme,
      "Valeur actuelle de la deuxième année": centime(deuxieme / 1.1 ** 2),
      "Valeur vie actualisée": actualisee,
      "Valeur vie actualisée ÷ coût d'acquisition": actualisee / cac,
    });
    expect([deuxieme, centime(deuxieme / 1.1 ** 2), actualisee / cac]).toEqual([15_750, 13_016.53, 4]);
    // Les trois premières années, actualisées : leur somme tend vers 60 000 €.
    expect([marge / 1.1, (marge * 0.75) / 1.1 ** 2, (marge * 0.75 ** 2) / 1.1 ** 3].map(centime)).toEqual([19_090.91, 13_016.53, 8_874.91]);
    const t = ch.etapes.find((x) => x.id === "la-valeur-actualisee")!.tableau!(cas);
    expect(t.lignes.find((x) => x.libelle === "Facteur d'actualisation")!.valeurs).toEqual(["0,9091", "0,8264", "0,7513"]);
    const vise = RAPPORT_VISE * cac;
    expect(attendus(ch, "a-rebours")).toEqual({
      "Valeur vie visée": vise,
      "Attrition la plus haute, en valeur actualisée (%)": centime((marge / vise - taux) * 100),
      "Attrition la plus haute, en valeur simple (%)": centime((marge / vise) * 100),
    });
    expect([vise, centime((marge / vise - taux) * 100), centime((marge / vise) * 100)]).toEqual([75_000, 18, 28]);
  });

  it("la synthèse finit sur l'arène", () => {
    const e = ch.etapes.at(-1)!;
    if (e.type !== "lecture") throw new Error("La synthèse est une lecture");
    expect(e.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("le cas : en valeur simple, le programme paie ; actualisé, il faut remiser moins", () => {
    const s = LE_PROGRAMME_DE_FIDELITE;
    casDedie(s, ch);
    expect(s.commanditaire).toBe("L'associée du cabinet");
    expect([REMISE_DE_FIDELITE, BAISSE_D_ATTRITION_PROMISE]).toEqual([0.08, 0.2]);
    expect(attendus(s, "aujourd-hui")).toEqual({ "Taux d'attrition (%)": 25, "Valeur vie simple": simple, "Valeur vie actualisée": actualisee });
    const remise = caMoyen * 0.08;
    const margeAvec = marge - remise;
    const aAvec = a * 0.8;
    expect(attendus(s, "avec-le-programme")).toEqual({
      "Remise par compte et par an": remise,
      "Marge annuelle avec la remise": margeAvec,
      "Taux d'attrition avec le programme (%)": 20,
      "Valeur vie simple avec le programme": centime(margeAvec / aAvec),
      "Valeur vie actualisée avec le programme": centime(margeAvec / (aAvec + taux)),
    });
    expect([remise, margeAvec, centime(margeAvec / aAvec), centime(margeAvec / (aAvec + taux))]).toEqual([3_456, 17_544, 87_720, 58_480]);
    // Le curseur : la valeur actualisée (21 000 − 432 × r) ÷ 30 % tient 60 000 € tant que r ≤ 6,94 %.
    const auPlus = Math.floor(((marge - actualisee * (aAvec + taux)) / caMoyen) * 100);
    expect(auPlus).toBe(6);
    expect(curseur(s, "jusqu-ou-remiser")).toEqual({
      attendu: auPlus,
      bornes: [0, 15],
      droites: [centime(marge / 0.3), actualisee, centime((marge - caMoyen * 0.15) / 0.3), actualisee],
      lecture: {
        "Marge annuelle avec la remise": marge - caMoyen * 0.06,
        "Valeur vie actualisée avec le programme": centime((marge - caMoyen * 0.06) / 0.3),
        "Valeur vie actualisée aujourd'hui": actualisee,
        "Valeur gagnée ou perdue par compte": centime((marge - caMoyen * 0.06) / 0.3 - actualisee),
      },
    });
    expect([marge - caMoyen * 0.06, centime((marge - caMoyen * 0.06) / 0.3)]).toEqual([18_408, 61_360]);
    // En valeur simple, on aurait cru pouvoir aller jusqu'à 9 % (21 000 − 432 × r ≥ 84 000 × 20 %).
    expect(Math.floor(((marge - simple * aAvec) / caMoyen) * 100)).toBe(9);
    expect(programmeDeFidelite(cas).remiseMaxSimple).toBe(9);
    // À rebours : l'attrition qui, avec 8 %, redonne 60 000 € actualisés.
    expect(attendus(s, "a-rebours")).toEqual({
      "Valeur actualisée perdue par compte": centime(actualisee - margeAvec / (aAvec + taux)),
      "Valeur actualisée perdue sur le portefeuille": centime((actualisee - centime(margeAvec / (aAvec + taux))) * 32),
      "Attrition qu'il faudrait atteindre (%)": centime((margeAvec / actualisee - taux) * 100),
    });
    expect([centime(actualisee - margeAvec / (aAvec + taux)), centime((margeAvec / actualisee - taux) * 100)]).toEqual([1_520, 19.24]);
    expect(programmeDeFidelite(cas).verdict).toBe("remiser-moins");
    expect(juste(s, "reponse")).toBe("Pas à 8 % : le programme ne paie qu'à 6 % de remise au plus");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LE_PROGRAMME_DE_FIDELITE));
});
