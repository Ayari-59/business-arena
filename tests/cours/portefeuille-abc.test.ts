import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  COMPTE_QUI_ENTRE,
  COMPTE_QUI_SORT,
  CRITERES_DU_LABORATOIRE,
  ENTREPRISES_DU_PORTEFEUILLE,
  PORTEFEUILLE_ABC,
  VARIANTE_DE_VALBRUNE,
} from "../../src/config/cours/chapitres/portefeuille-abc";
import { ATLAS_CONSEIL, type CompteClient } from "../../src/config/cours/monde/atlas-conseil";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import {
  ABANDONNER_LES_PETITS_COMPTES,
  HAUSSE_ESPEREE_SUR_LES_A,
  abandonDesComptesC,
} from "../../src/config/cours/situations/par-chapitre/abandonner-les-petits-comptes";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE PORTEFEUILLE ABC, SUR LE VRAI PORTEFEUILLE DU CABINET DU MONDE DU COURS, ET SON CAS : ABANDONNER
 * LES PETITS COMPTES ?
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche d'ATLAS CONSEIL (monde/atlas-conseil.ts) :
 * le tri des 32 comptes, les parts cumulées et les classes sont recalculés sans les fonctions du chapitre
 * ni le modèle (monde/relation-client.ts), par le chiffre d'affaires puis par la marge ; les valeurs
 * absolues sont épinglées, la variante (le contrat de Valbrune renégocié) refaite comme le reste, et les
 * verdicts aussi. Chaque curseur : son attendu, la position voisine, ses droites aux bornes, sa lecture ;
 * le laboratoire : sa lecture au départ et à la solution, et les courbes de son graphique en quelques
 * points. Puis les gardes de texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
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
        ...(e.graphique?.(c).courbes ?? []).map((x) => x.libelle),
      ];
    }
    default:
      return [e.titre];
  }
}

/** « journée » est féminin : ni « un journée », ni « journées vendus », ni « journées pris ». */
const JOURNEE_AU_MASCULIN = /\bun journée|\bjournées? (vendu|demandé|refusé|déplacé|gagné|perdu|libéré|remisé|payé|facturé|pris)s?(?![a-zàâçéèêëîïôûù])/i;

const DERNIERE_PHRASE = "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.";

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|vingt|trente|quarante|cinquante|cent) (journées?|jours|comptes?|trimestres?|consultants?|commerciaux|clientèles?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(JOURNEE_AU_MASCULIN);
      // Le chapitre ne parle de l'arène que pour finir : la simulation est celle du cours.
      if (/arène/.test(x)) expect(x, e.id).toBe(DERNIERE_PHRASE);
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
      // Un gain ou un bilan peut être négatif : la question dit alors comment l'écrire.
      if (champs.some((x) => x.attendu < 0)) expect(e.question(cas, etat), e.id).toMatch(/négatif pour une perte/i);
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
/** Un nombre tel que le cours l'écrit (espace fine insécable des milliers). */
const nb = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

// La fiche, refaite à la main : le tri, les parts cumulées et les classes, sur chaque critère.
type Critere = "chiffreDAffaires" | "marge";
const classer = (comptes: readonly CompteClient[], critere: Critere) => {
  const tries = [...comptes].sort((x, y) => y[critere] - x[critere]);
  const total = somme(tries.map((x) => x[critere]));
  let cumule = 0;
  return tries.map((x, i) => {
    cumule += x[critere];
    const cumul = cumule / total;
    return { ...x, rang: i + 1, cumul, classe: i === 0 || cumul <= 0.8 + 1e-12 ? "A" : cumul <= 0.95 + 1e-12 ? "B" : "C" };
  });
};
const parCa = classer(f.comptes, "chiffreDAffaires");
const parMarge = classer(f.comptes, "marge");
const total = somme(f.comptes.map((x) => x.chiffreDAffaires));
const margeTotale = somme(f.comptes.map((x) => x.marge));
const classe = (k: typeof parCa, x: string) => k.filter((y) => y.classe === x);
const auDixieme = (part: number) => Math.round(part * 1000) / 10;
const compte = (c: string) => f.comptes.find((x) => x.code === c)!;
const cj = f.consultants.coutAnnuel / (4 * f.consultants.joursFacturablesParTrimestre);

describe("le portefeuille ABC, chez le cabinet du monde du cours", () => {
  const ch = PORTEFEUILLE_ABC;

  it("se joue chez ATLAS CONSEIL seule, au palier 4 du BTS NDRC, avec ses blocs", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("ndrc");
    expect(ch.palier).toBe(4);
    expect(ch.entreprises?.codes).toEqual(["conseil"]);
    expect(ENTREPRISES_DU_PORTEFEUILLE).toEqual(["conseil"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.blocs).toEqual([
      "BTS NDRC Bloc 1 · Relation client et négociation-vente",
      "Bac pro MCV Bloc 4B · Prospecter et valoriser l'offre commerciale",
      "BUT TC · Manager la relation client",
      "BUT GACO · Assurer le développement des affaires, de la prospection à la fidélisation",
    ]);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(f.entreprise).toBe(cas.entreprise);
    expect(SITUATIONS).toContain(ABANDONNER_LES_PETITS_COMPTES);
  });

  it("la fiche donne les chiffres de la consigne : 32 comptes, 8 en A, 8 en B, 16 en C", () => {
    expect([f.comptes.length, total, margeTotale, cj]).toEqual([32, 1_382_400, 672_000, 220]);
    // La marge d'un compte est bien son chiffre d'affaires, moins ses frais, moins ses journées au coût d'un consultant.
    for (const x of f.comptes) expect(x.marge, x.nom).toBe(centime(x.chiffreDAffaires - x.frais - x.journees * cj));
    expect(["A", "B", "C"].map((x) => classe(parCa, x).length)).toEqual([8, 8, 16]);
    expect(["A", "B", "C"].map((x) => auDixieme(somme(classe(parCa, x).map((y) => y.chiffreDAffaires)) / total))).toEqual([77.2, 17.6, 5.2]);
    expect(parCa[8]!.code).toBe("ferrand");
    expect([auDixieme(parCa[7]!.cumul), auDixieme(parCa[8]!.cumul)]).toEqual([77.2, 81.3]);
  });

  it("les étapes guidées : les parts des premiers, et les trois classes", () => {
    const premier = parCa[0]!;
    expect(premier.code).toBe("arveon");
    expect(attendus(ch, "parts")).toEqual({
      "Part du premier compte (%)": auDixieme(premier.chiffreDAffaires / total),
      "Part cumulée des trois premiers (%)": auDixieme(somme(parCa.slice(0, 3).map((x) => x.chiffreDAffaires)) / total),
    });
    expect(Object.values(attendus(ch, "parts"))).toEqual([12.5, 35.4]);
    const tri = ch.etapes.find((e) => e.id === "classer") as EtapeTri;
    expect(tri.elements(cas).map((x) => [x.libelle, x.montant, x.categorie])).toEqual(parCa.map((x) => [x.nom, x.chiffreDAffaires, x.classe]));
  });

  it("le premier cycle : le pari, le curseur du poids du premier compte, puis la concentration", () => {
    expect(juste(ch, "predire-le-poids")).toBe("Plus que doubler");
    // Le premier compte, à 720 € la journée, pèse le quart des ventes quand 720 × j ≥ 25 % × (1 209 600 + 720 × j).
    const p = compte("arveon").chiffreDAffaires / compte("arveon").journees;
    const autres = total - compte("arveon").chiffreDAffaires;
    const j = Math.ceil((0.25 * autres) / (p * 0.75));
    expect([p, autres, j]).toEqual([720, 1_209_600, 560]);
    expect(p * 559).toBeLessThan(0.25 * (autres + p * 559));
    expect(curseur(ch, "le-poids-du-premier")).toEqual({
      attendu: j,
      bornes: [200, 800],
      droites: [p * 200, 0.25 * (autres + p * 200), p * 800, 0.25 * (autres + p * 800)],
      lecture: {
        "Chiffre d'affaires d'Arvéon Aéronautique": p * j,
        "Chiffre d'affaires du portefeuille": autres + p * j,
        "Le quart des ventes": 0.25 * (autres + p * j),
        "Au-delà du quart des ventes": 0,
      },
    });
    expect(p * j).toBe(403_200);
    expect(attendus(ch, "la-concentration")).toEqual({
      "Part des comptes en classe A (%)": 25,
      "Part du chiffre d'affaires en classe A (%)": 77.2,
      "Part des comptes en classe C (%)": 50,
      "Part du chiffre d'affaires en classe C (%)": 5.2,
    });
    expect(juste(ch, "concentration")).toBe("Concentré, sans compte qui pèse trop à lui seul");
  });

  it("la marge d'un compte : le Centre hospitalier de Valbrune, gros par les ventes, mince par la marge", () => {
    const v = compte(COMPTE_QUI_SORT);
    expect(attendus(ch, "la-marge-d-un-compte")).toEqual({
      "Coût des journées de consultant": v.journees * cj,
      "Marge du compte": v.chiffreDAffaires - v.frais - v.journees * cj,
      "Taux de marge du compte (%)": auDixieme(v.marge / v.chiffreDAffaires),
    });
    expect(Object.values(attendus(ch, "la-marge-d-un-compte"))).toEqual([61_600, 14_000, 8.9]);
    expect([v.frais / v.journees, somme(f.comptes.map((x) => x.frais)) / somme(f.comptes.map((x) => x.journees))]).toEqual([290, 150]);
  });

  it("le second cycle : le pari, le laboratoire du classement à deux critères, puis la classe A par la marge", () => {
    expect(juste(ch, "predire-la-classe-a")).toBe("Presque la même : un compte ou deux changent de classe");
    const aCa = new Set(classe(parCa, "A").map((x) => x.code));
    const aMarge = new Set(classe(parMarge, "A").map((x) => x.code));
    expect([...aCa].filter((x) => !aMarge.has(x))).toEqual([COMPTE_QUI_SORT]);
    expect([...aMarge].filter((x) => !aCa.has(x))).toEqual([COMPTE_QUI_ENTRE]);
    const l = laboratoire(ch, "le-laboratoire-du-portefeuille");
    expect(l.depart).toEqual({ critere: CRITERES_DU_LABORATOIRE.chiffreDAffaires, comptes: 3 });
    expect(l.solution).toEqual({ critere: CRITERES_DU_LABORATOIRE.marge, comptes: classe(parMarge, "A").length });
    expect(l.reussi).toEqual([false, true]);
    const lire = (k: typeof parCa, n: number, critere: Critere) => {
      const r = k.slice(0, n);
      const ca = somme(r.map((x) => x.chiffreDAffaires));
      const m = somme(r.map((x) => x.marge));
      return {
        [`Dernier compte retenu : ${r.at(-1)!.nom}`]: r.at(-1)![critere],
        "Chiffre d'affaires des comptes retenus": ca,
        "Part cumulée du chiffre d'affaires": auDixieme(ca / total),
        "Marge des comptes retenus": m,
        "Part cumulée de la marge": auDixieme(m / margeTotale),
      };
    };
    expect(l.auDepart).toEqual(lire(parCa, 3, "chiffreDAffaires"));
    expect(Object.values(l.auDepart)).toEqual([156_800, 489_600, 35.4, 196_800, 29.3]);
    expect(l.aLaSolution).toEqual(lire(parMarge, 8, "marge"));
    expect(Object.values(l.aLaSolution)).toEqual([32_000, 967_040, 70, 514_040, 76.5]);
    // Le même nombre de comptes par le chiffre d'affaires ne relève pas le défi : il faut changer de critère.
    expect(l.d.atteint({ critere: CRITERES_DU_LABORATOIRE.chiffreDAffaires, comptes: 8 })).toBe(false);
    expect(l.d.atteint({ critere: CRITERES_DU_LABORATOIRE.marge, comptes: 9 })).toBe(false);
    // Le graphique : les deux parts cumulées dans l'ordre du critère, et le seuil de la classe A.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("comptes");
    const [pCa, pMarge, seuil] = g.courbes;
    const auCa = (n: number) => ({ critere: CRITERES_DU_LABORATOIRE.chiffreDAffaires, comptes: n });
    const auMarge = (n: number) => ({ critere: CRITERES_DU_LABORATOIRE.marge, comptes: n });
    expect([2, 3, 8, 32].map((n) => [pCa!.valeur(auCa(n)), pMarge!.valeur(auCa(n))])).toEqual([
      [24.1, 27.2],
      [35.4, 29.3],
      [77.2, 73.2],
      [100, 100],
    ]);
    // Au 3e compte par le chiffre d'affaires, la marge marque un palier : Valbrune fait 11,3 % des ventes, 2,1 % de la marge.
    expect(auDixieme(compte(COMPTE_QUI_SORT).marge / margeTotale)).toBe(2.1);
    expect([pCa!.valeur(auMarge(8)), pMarge!.valeur(auMarge(8)), pMarge!.valeur(auMarge(9))]).toEqual([70, 76.5, 81.1]);
    expect(seuil!.valeur(auMarge(1))).toBe(80);
    expect(attendus(ch, "la-classe-a-par-la-marge")).toEqual({
      "Part cumulée de la marge des 8 premiers comptes (%)": auDixieme(parMarge[7]!.cumul),
      "Part cumulée avec le 9e compte (%)": auDixieme(parMarge[8]!.cumul),
      "Marge de la classe A par la marge": somme(classe(parMarge, "A").map((x) => x.marge)),
      "Marge des comptes A par le chiffre d'affaires": somme(classe(parCa, "A").map((x) => x.marge)),
    });
    expect(Object.values(attendus(ch, "la-classe-a-par-la-marge"))).toEqual([76.5, 81.1, 514_040, 491_640]);
    expect(juste(ch, "qui-sort-qui-entre")).toBe("Centre hospitalier de Valbrune sort, Banque Ferrand et Associés entre");
    expect([parCa.find((x) => x.code === COMPTE_QUI_SORT)!.rang, parMarge.find((x) => x.code === COMPTE_QUI_SORT)!.rang]).toEqual([3, 11]);
    expect([parCa.find((x) => x.code === COMPTE_QUI_ENTRE)!.rang, parMarge.find((x) => x.code === COMPTE_QUI_ENTRE)!.rang]).toEqual([9, 7]);
  });

  it("les étapes d'expert : le prix qui rendrait au compte la marge de celui qui l'a remplacé, et le contrat renégocié", () => {
    const v = compte(COMPTE_QUI_SORT);
    const cout = v.frais + v.journees * cj;
    const ferrand = compte(COMPTE_QUI_ENTRE).marge;
    const p = Math.ceil((ferrand + cout) / v.journees);
    expect([cout, ferrand, p]).toEqual([142_800, 36_400, 640]);
    expect(639 * v.journees - cout).toBeLessThan(ferrand);
    expect(curseur(ch, "le-prix-de-valbrune")).toEqual({
      attendu: p,
      bornes: [500, 800],
      droites: [500 * v.journees - cout, ferrand, 800 * v.journees - cout, ferrand],
      lecture: {
        "Chiffre d'affaires du compte": p * v.journees,
        "Frais et temps des consultants": cout,
        "Marge du compte": p * v.journees - cout,
        "Différence avec le compte qui l'a remplacé": 0,
      },
    });
    // 640 €, c'est le prix que paie déjà la Métropole de Granvaux.
    expect(compte("granvaux").chiffreDAffaires / compte("granvaux").journees).toBe(640);
    expect(VARIANTE_DE_VALBRUNE).toEqual({ prix: 600, fraisParJournee: 200 });
    const ca = v.journees * 600;
    const frais = v.journees * 200;
    const marge = ca - frais - v.journees * cj;
    expect(attendus(ch, "valbrune-renegocie")).toEqual({
      "Chiffre d'affaires renégocié": ca,
      "Frais renégociés": frais,
      "Marge renégociée": marge,
      "Taux de marge renégocié (%)": auDixieme(marge / ca),
    });
    expect([ca, frais, marge, auDixieme(marge / ca)]).toEqual([168_000, 56_000, 50_400, 30]);
    // Reclassé par la marge, le compte renégocié est 7e, en classe A.
    const autre = classer(
      f.comptes.map((x) => (x.code === COMPTE_QUI_SORT ? { ...x, chiffreDAffaires: ca, frais, marge } : x)),
      "marge",
    ).find((x) => x.code === COMPTE_QUI_SORT)!;
    expect([autre.rang, autre.classe]).toEqual([7, "A"]);
  });

  it("les verdicts : la valeur vie que le classement ne voit pas, et le traitement de chaque classe", () => {
    const vv = (c: string) => compte(c).marge / compte(c).attrition;
    expect([vv(COMPTE_QUI_SORT), vv(COMPTE_QUI_ENTRE), vv("helianthe")].map(centime)).toEqual([46_666.67, 242_666.67, 104_000]);
    expect(Math.floor(vv(COMPTE_QUI_ENTRE) / vv(COMPTE_QUI_SORT))).toBe(5);
    expect(juste(ch, "la-valeur-vie-des-comptes")).toBe("La durée du compte : un petit compte fidèle peut valoir bien plus qu'un gros");
    // Les comptes de la conquête sont tous en B.
    expect(new Set(parCa.filter((x) => x.commercial === "conquete").map((x) => x.classe))).toEqual(new Set(["B"]));
    expect(juste(ch, "traiter")).toBe("Elle suit les A de près, fait grandir les B, sert les C à moindre coût");
  });

  it("l'intro dit les hypothèses, et la synthèse finit sur l'arène", () => {
    const intro = ch.etapes[0]!;
    const synthese = ch.etapes.at(-1)!;
    if (intro.type !== "lecture" || synthese.type !== "lecture") throw new Error("Pas de lecture");
    expect(intro.texte(cas).join(" ")).toMatch(/Ce que la simulation suppose/);
    expect(synthese.texte(cas).at(-1)).toBe(DERNIERE_PHRASE);
    expect(synthese.texte(cas).join(" ")).toMatch(/Au niveau de l'examen/);
  });

  it("le cas : garder les C, que la hausse sur les A ne compense pas, et dont les journées resteraient payées", () => {
    const s = ABANDONNER_LES_PETITS_COMPTES;
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le directeur commercial");
    expect(attendus(s, "les-classes")).toEqual({ "Comptes en classe A": 8, "Comptes en classe B": 8, "Comptes en classe C": 16 });
    const A = classe(parCa, "A");
    const C = classe(parCa, "C");
    const caC = somme(C.map((x) => x.chiffreDAffaires));
    const margeC = somme(C.map((x) => x.marge));
    const margeA = somme(A.map((x) => x.marge));
    expect(attendus(s, "poids-des-c")).toEqual({
      "Chiffre d'affaires des comptes C": caC,
      "Part du chiffre d'affaires (%)": auDixieme(caC / total),
      "Marge des comptes C": margeC,
      "Part de la marge (%)": auDixieme(margeC / margeTotale),
    });
    expect([caC, auDixieme(caC / total), margeC, auDixieme(margeC / margeTotale)]).toEqual([71_360, 5.2, 40_224, 6]);
    // Le curseur : la marge en plus sur les A, 491 640 € × h, face à la marge des C, 40 224 €.
    expect(curseur(s, "la-hausse-qui-compense")).toEqual({
      attendu: 9,
      bornes: [0, 15],
      droites: [0, margeC, centime(margeA * 0.15), margeC],
      lecture: {
        "Ventes en plus sur les comptes A": centime(somme(A.map((x) => x.chiffreDAffaires)) * 0.09),
        "Marge en plus sur les comptes A": centime(margeA * 0.09),
        "Marge perdue avec les comptes C": margeC,
        "Bilan de la proposition": centime(margeA * 0.09 - margeC),
      },
    });
    expect(margeA * 0.08).toBeLessThan(margeC);
    expect(HAUSSE_ESPEREE_SUR_LES_A).toBe(0.05);
    expect(attendus(s, "hausse-sur-les-a")).toEqual({
      "Marge des comptes A": margeA,
      "Marge en plus sur les comptes A": margeA * 0.05,
      "Bilan de la proposition": margeA * 0.05 - margeC,
      "Hausse nécessaire sur les comptes A (%)": auDixieme(margeC / margeA),
    });
    expect([margeA, margeA * 0.05, margeA * 0.05 - margeC, auDixieme(margeC / margeA)]).toEqual([491_640, 24_582, -15_642, 8.2]);
    // Le croisement des deux marges : les journées libérées, reprises, et restées payées sans emploi.
    const jC = somme(C.map((x) => x.journees));
    const jA = centime(somme(A.map((x) => x.journees)) * 0.05);
    const sansEmploi = centime(jC - jA);
    expect(attendus(s, "le-temps-des-consultants")).toEqual({
      "Journées des comptes C": jC,
      "Journées que demanderait la hausse sur les A": jA,
      "Journées de consultant sans emploi": sansEmploi,
      "Bilan, une fois payées ces journées": centime(margeA * 0.05 - margeC - sansEmploi * cj),
    });
    expect([jC, jA, sansEmploi, centime(margeA * 0.05 - margeC - sansEmploi * cj)]).toEqual([92, 75.7, 16.3, -19_228]);
    // La même perte en marge sur coût variable, où les consultants n'entrent pas.
    const mscvA = (somme(A.map((x) => x.chiffreDAffaires)) - somme(A.map((x) => x.frais))) * 0.05;
    const mscvC = caC - somme(C.map((x) => x.frais));
    expect([mscvA, mscvC, mscvA - mscvC]).toEqual([41_236, 60_464, -19_228]);
    expect(abandonDesComptesC(cas).verdict).toBe("garder-les-c");
    expect(juste(s, "reponse")).toBe(`Garder les C : ils laissent ${nb(40_224)} €, la hausse sur les A ${nb(24_582)} €`);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(ABANDONNER_LES_PETITS_COMPTES));
});
