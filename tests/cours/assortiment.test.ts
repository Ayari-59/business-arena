import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ASSORTIMENT,
  DEPART_DU_LABORATOIRE,
  FAMILLES_D_ASSORTIMENT,
  MARGE_DU_CARDIGAN_HYPOTHETIQUE,
  PART_OBSERVEE_A_REBOURS,
  PART_REPORTEE,
  SOLUTION_DU_LABORATOIRE,
} from "../../src/config/cours/chapitres/assortiment";
import { MAILLE_ET_CO } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { RETIRER_UNE_REFERENCE } from "../../src/config/cours/situations/par-chapitre/retirer-une-reference";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * L'ASSORTIMENT, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : RETIRER UNE RÉFÉRENCE ?
 *
 * Chaque chiffre attendu est refait ici à la main sur la gamme de janvier (monde/maille-et-co.ts), sans
 * les fonctions du chapitre ni le modèle (monde/boutique.ts) : la marge de chaque référence, les
 * repères pondérés du classement, le report d'un retrait (à l'unité la plus proche, à la marge moyenne
 * d'un article des autres références), la part qui le compense. Les valeurs absolues sont épinglées,
 * la variante (l'écharpe) et le calcul à rebours refaits comme le reste, les verdicts aussi. Puis les
 * gardes de texte de l'étalon.
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "boutique";
const cas = casDeLEntreprise(code);
const f = MAILLE_ET_CO;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const dixieme = (x: number) => Math.round(x * 10) / 10 + 0;

// La gamme, refaite à la main : marge d'un article = prix hors taxes − achat − autres coûts variables.
const G = Object.fromEntries(f.gamme.map((r) => [r.code, { ventes: r.ventesDuMois, prix: r.prixHt, mu: r.prixHt - r.coutDAchat - r.autresCoutsVariables }]));
const margeDe = (c: string) => G[c]!.ventes * G[c]!.mu;
const codes = f.gamme.map((r) => r.code);
const margeTotale = codes.reduce((t, c) => t + margeDe(c), 0);
const ventesTotales = codes.reduce((t, c) => t + G[c]!.ventes, 0);
const caTotal = codes.reduce((t, c) => t + G[c]!.ventes * G[c]!.prix, 0);
/** Le retrait de la référence c avec une part p (en %) reportée, refait à la main. */
function retraitALaMain(c: string, p: number) {
  const mu = (margeTotale - margeDe(c)) / (ventesTotales - G[c]!.ventes);
  const reportes = Math.round((G[c]!.ventes * p) / 100);
  const recuperee = centime(reportes * mu);
  return { mu, reportes, recuperee, effet: centime(recuperee - margeDe(c)), compense: (G[c]!.mu / mu) * 100 };
}

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

describe("l'assortiment, à la boutique du monde du cours", () => {
  const ch = ASSORTIMENT;

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
    expect(SITUATIONS).toContain(RETIRER_UNE_REFERENCE);
    const synthese = ch.etapes.at(-1)!;
    if (synthese.type !== "lecture") throw new Error("Pas de synthèse");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    const intro = ch.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("Pas d'intro");
    expect(intro.texte(cas).join(" ")).toMatch(/Ce que la simulation suppose/);
  });

  it("la fiche donne les chiffres de la consigne : les marges, le mois, les deux repères", () => {
    expect(codes.map(margeDe)).toEqual([15_900, 13_320, 6_660, 6_270, 2_100]);
    expect([margeTotale, caTotal, ventesTotales]).toEqual([44_250, 87_450, 1_530]);
    expect([ventesTotales / 5, centime(margeTotale / ventesTotales)]).toEqual([306, 28.92]);
  });

  it("les étapes guidées : la marge de chaque référence, et ses parts", () => {
    expect(attendus(ch, "marges")).toEqual(Object.fromEntries(f.gamme.map((r) => [`Marge · ${r.nom}`, margeDe(r.code)])));
    const part = (x: number, t: number) => dixieme((x / t) * 100);
    expect(attendus(ch, "chiffre-et-marge")).toEqual({
      "Part du chiffre d'affaires · Pull col rond (%)": part(600 * 55, caTotal),
      "Part de la marge · Pull col rond (%)": part(15_900, margeTotale),
      "Part du chiffre d'affaires · Pull mérinos (%)": part(90 * 135, caTotal),
      "Part de la marge · Pull mérinos (%)": part(6_660, margeTotale),
    });
    expect([part(600 * 55, caTotal), part(15_900, margeTotale), part(90 * 135, caTotal), part(6_660, margeTotale)]).toEqual([37.7, 35.9, 13.9, 15.1]);
  });

  it("le curseur du mérinos, refait à la main : sa marge rattrape celle du col rond à 215 articles", () => {
    const n = Math.ceil(15_900 / 74);
    expect(n).toBe(215);
    expect(curseur(ch, "le-merinos-au-curseur")).toEqual({
      attendu: n,
      bornes: [50, 400],
      droites: [50 * 74, 15_900, 400 * 74, 15_900],
      lecture: { "Marge du mérinos": n * 74, "Chiffre d'affaires du mérinos": n * 135, "Marge du col rond": 15_900, "Marge du mérinos, moins celle du col rond": n * 74 - 15_900 },
      voisine: { "Marge du mérinos": 214 * 74, "Chiffre d'affaires du mérinos": 214 * 135, "Marge du col rond": 15_900, "Marge du mérinos, moins celle du col rond": 214 * 74 - 15_900 },
    });
    expect([n * 74 - 15_900, 214 * 74 - 15_900]).toEqual([10, -64]);
    expect(juste(ch, "predire-le-merinos")).toBe("Un peu plus du double de ses ventes");
  });

  it("les étapes autonomes : les deux repères, les familles sur les moyennes pondérées", () => {
    expect(attendus(ch, "les-deux-moyennes")).toEqual({ "Ventes moyennes d'une référence": 306, "Marge moyenne d'un article vendu": 28.92 });
    expect(FAMILLES_D_ASSORTIMENT.map((x) => x.code)).toEqual(["locomotive", "volume", "marge", "a-revoir"]);
    const tri = ch.etapes.find((e) => e.id === "familles") as EtapeTri;
    // Refait à la main : vend beaucoup au-dessus de 306 articles, marge fort au-dessus de 28,92 € par article.
    const famille = (c: string) => {
      const beaucoup = G[c]!.ventes > ventesTotales / 5;
      const fort = G[c]!.mu > margeTotale / ventesTotales;
      return beaucoup && fort ? "locomotive" : beaucoup ? "volume" : fort ? "marge" : "a-revoir";
    };
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, x.categorie]))).toEqual(Object.fromEntries(f.gamme.map((r) => [r.nom, famille(r.code)])));
    expect(codes.map(famille)).toEqual(["volume", "locomotive", "marge", "volume", "a-revoir"]);
  });

  it("l'expert, la critique de la moyenne : la moyenne simple, et un cardigan qui ferait diverger les deux", () => {
    const simple = codes.reduce((t, c) => t + G[c]!.mu, 0) / 5;
    expect(centime(simple)).toBe(34.1);
    expect(MARGE_DU_CARDIGAN_HYPOTHETIQUE).toBe(33);
    const ponderee33 = centime((margeTotale - 360 * (37 - 33)) / ventesTotales);
    const simple33 = centime((simple * 5 - 37 + 33) / 5);
    expect([ponderee33, simple33]).toEqual([27.98, 33.3]);
    // À 33 € par article, le cardigan est au-dessus de l'une et sous l'autre.
    expect(33 > ponderee33 && 33 < simple33).toBe(true);
    expect(juste(ch, "la-moyenne-ponderee")).toBe("La moyenne simple compte chaque référence pour une, quelles que soient ses ventes : elle mesure les étiquettes, pas ce que rapporte un article vendu");
  });

  it("le retrait du bonnet : le curseur de la part reportée et le retrait chiffré, refaits à la main", () => {
    expect(PART_REPORTEE).toBe(0.3);
    const b = retraitALaMain("bonnet", 30);
    expect([centime(b.mu), b.reportes, b.recuperee, b.effet]).toEqual([30.54, 45, 1_374.46, -725.54]);
    expect(juste(ch, "predire-le-retrait")).toBe("Perdre moins de 2\u202f100 € : le report en rattrape une partie");
    const seuil = Math.ceil((2_100 / (150 * b.mu)) * 100);
    expect(seuil).toBe(46);
    expect(curseur(ch, "la-part-reportee")).toEqual({
      attendu: seuil,
      bornes: [0, 100],
      droites: [0, 2_100, centime(150 * b.mu), 2_100],
      lecture: { "Marge récupérée par le report": retraitALaMain("bonnet", 46).recuperee, "Marge perdue avec la référence": 2_100, "Effet net sur la marge du mois": retraitALaMain("bonnet", 46).effet },
      voisine: { "Marge récupérée par le report": retraitALaMain("bonnet", 45).recuperee, "Marge perdue avec la référence": 2_100, "Effet net sur la marge du mois": retraitALaMain("bonnet", 45).effet },
    });
    expect([retraitALaMain("bonnet", 46).effet, retraitALaMain("bonnet", 45).effet]).toEqual([7.5, -23.04]);
    expect(attendus(ch, "le-retrait-chiffre")).toEqual({
      "Marge moyenne d'un article des autres références": centime(b.mu),
      "Articles reportés": b.reportes,
      "Marge récupérée par le report": b.recuperee,
      "Effet net du retrait sur la marge du mois": b.effet,
    });
  });

  it("le laboratoire du retrait : la référence au choix, la part reportée, refaits à la main", () => {
    const l = laboratoire(ch, "le-laboratoire-du-retrait");
    const rang = (c: string) => codes.indexOf(c as (typeof codes)[number]) + 1;
    expect(DEPART_DU_LABORATOIRE).toEqual({ reference: "echarpe", part: 30 });
    expect(SOLUTION_DU_LABORATOIRE).toEqual({ reference: "bonnet", part: 46 });
    expect(l.depart).toEqual({ reference: rang("echarpe"), part: 30 });
    expect(l.solution).toEqual({ reference: rang("bonnet"), part: 46 });
    expect(l.reussi).toEqual([false, true]);
    const lire = (c: string, p: number) => {
      const r = retraitALaMain(c, p);
      return {
        "Marge perdue avec la référence": margeDe(c),
        "Articles reportés": r.reportes,
        "Marge d'un article des autres références": centime(r.mu),
        "Marge récupérée par le report": r.recuperee,
        "Part reportée qui compense le retrait": dixieme(r.compense),
        "Effet net sur la marge du mois": r.effet,
        "Marge du mois après le retrait": centime(margeTotale + r.effet),
      };
    };
    expect(l.auDepart).toEqual(lire("echarpe", 30));
    expect(l.aLaSolution).toEqual(lire("bonnet", 46));
    expect(Object.values(lire("echarpe", 30))).toEqual([6_270, 99, 31.65, 3_133.35, 60, -3_136.65, 41_113.35]);
    // Le défi, à la main : au plus 50 % de report et une marge qui ne baisse pas. Seul le bonnet, de 46 % à 50 %.
    const reussis = codes.flatMap((c) => Array.from({ length: 51 }, (_, p) => p).filter((p) => retraitALaMain(c, p).effet >= 0).map((p) => `${c} ${p}`));
    expect(reussis).toEqual(["bonnet 46", "bonnet 47", "bonnet 48", "bonnet 49", "bonnet 50"]);
    for (const c of codes) for (const p of [0, 30, 46, 50, 51, 100]) expect(l.atteint({ reference: rang(c), part: p }), `${c} ${p}`).toBe(p <= 50 && retraitALaMain(c, p).effet >= 0);
    // La part qui compense : jamais pour le cardigan et le mérinos (au-dessus de 100 %).
    expect(codes.map((c) => dixieme(retraitALaMain(c, 30).compense))).toEqual([86.9, 140, 283.5, 60, 45.8]);
    // Le levier à choix : les cinq références, dans l'ordre de la gamme.
    const levier = l.e.leviers(cas).find((x) => x.code === "reference")!;
    expect(levier.choix!.map((x) => [x.valeur, x.libelle])).toEqual(f.gamme.map((r, i) => [i + 1, r.nom]));
  });

  it("le graphique du laboratoire : les deux marges selon la part reportée, pour la référence choisie", () => {
    const { e } = laboratoire(ch, "le-laboratoire-du-retrait");
    const g = e.graphique!(cas);
    expect(g.levier).toBe("part");
    const [recuperee, perdue] = g.courbes;
    const rang = (c: string) => codes.indexOf(c as (typeof codes)[number]) + 1;
    for (const [c, p] of [["bonnet", 0], ["bonnet", 46], ["bonnet", 100], ["echarpe", 60], ["cardigan", 100]] as const) {
      expect(recuperee!.valeur({ reference: rang(c), part: p }), `${c} ${p}`).toBe(retraitALaMain(c, p).recuperee);
      expect(perdue!.valeur({ reference: rang(c), part: p }), `${c} ${p}`).toBe(margeDe(c));
    }
    // Le cardigan, même tout reporté, ne rattrape pas sa marge.
    expect(retraitALaMain("cardigan", 100).recuperee).toBe(9_516.92);
  });

  it("l'expert : la variante de l'écharpe et le calcul à rebours, refaits à la main", () => {
    const e = retraitALaMain("echarpe", 30);
    expect(attendus(ch, "retirer-l-echarpe")).toEqual({
      "Marge moyenne d'un article des autres références": centime(e.mu),
      "Effet net du retrait sur la marge du mois": e.effet,
      "Part reportée qui compense le retrait (%)": dixieme(e.compense),
    });
    expect([centime(e.mu), e.effet, dixieme(e.compense)]).toEqual([31.65, -3_136.65, 60]);
    // À rebours : 40 % de report observé, l'effet net seul est donné.
    expect(PART_OBSERVEE_A_REBOURS).toBe(0.4);
    const observe = retraitALaMain("bonnet", 40).effet;
    expect(observe).toBe(-267.39);
    const recuperee = centime(2_100 + observe);
    const mu = retraitALaMain("bonnet", 0).mu;
    const reportes = Math.round(recuperee / mu);
    expect(attendus(ch, "a-rebours")).toEqual({ "Marge récupérée par le report": recuperee, "Articles reportés": reportes, "Part des ventes reportée (%)": dixieme((reportes / 150) * 100) });
    expect([recuperee, reportes, dixieme((reportes / 150) * 100)]).toEqual([1_832.61, 60, 40]);
    for (const id of ["retirer-l-echarpe", "a-rebours"]) expect(Object.keys(attendus(ch, id)).length, id).toBeGreaterThanOrEqual(3);
  });

  it("les verdicts : faut-il retirer le bonnet, et la synthèse", () => {
    expect(juste(ch, "retirer")).toBe("Pas pour la marge : retiré, il coûterait 725,54 € par mois, et il faudrait 46 % de report");
    const t = ch.etapes.find((e) => e.id === "synthese")!.tableau!(cas);
    expect(t.lignes.map((l) => l.valeurs.at(-1))).toEqual(["86,9 %", "aucun", "aucun", "60 %", "45,8 %"]);
    expect(t.lignes.map((l) => l.valeurs[3])).toEqual(["Produit de volume", "Locomotive", "Produit de marge", "Produit de volume", "À revoir"]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : retirer une référence ?", () => {
  const s = RETIRER_UNE_REFERENCE;
  const b = retraitALaMain("bonnet", 30);
  const e = retraitALaMain("echarpe", 30);

  it("tient la forme d'un cas dédié", () => {
    casDedie(s, ASSORTIMENT);
    expect(s.commanditaire).toBe("La direction");
  });

  it("les marges, le report, la part qui compense au curseur, l'autre candidate : refaits à la main", () => {
    expect(attendus(s, "les-marges")).toEqual({ "Marge du mois · Bonnet": 2_100, "Marge du mois des autres références": 42_150, "Marge moyenne d'un article des autres références": centime(b.mu) });
    expect(attendus(s, "le-report")).toEqual({ "Articles reportés": b.reportes, "Marge récupérée par le report": b.recuperee, "Effet net sur la marge du mois": b.effet });
    const k = curseur(s, "le-report-qui-compense");
    expect([k.attendu, k.bornes, k.droites]).toEqual([46, [0, 100], [0, 2_100, centime(150 * b.mu), 2_100]]);
    expect(k.lecture["Effet net sur la marge du mois"]).toBe(7.5);
    expect(k.voisine["Effet net sur la marge du mois"]).toBe(-23.04);
    expect(attendus(s, "l-autre-candidate")).toEqual({
      "Marge moyenne d'un article des autres références": centime(e.mu),
      "Effet net du retrait sur la marge du mois": e.effet,
      "Part reportée qui compense le retrait (%)": dixieme(e.compense),
    });
    expect(juste(s, "reponse")).toBe("Garder le bonnet : retiré, il coûterait 725,54 € par mois");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
