import { describe, expect, it } from "vitest";
import { referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  COUTS_OU_DIFFERENCIATION,
  ELASTICITE_A_LA_QUALITE_DE_LA_CRITIQUE,
  STRATEGIE_DE_COUTS,
  STRATEGIE_DE_DIFFERENCIATION,
  VARIANTE_DE_L_EXPERT,
  coutsOuDifferenciation,
} from "../../src/config/cours/chapitres/couts-ou-differenciation";
import { LIRE_LA_STRATEGIE_DES_CONCURRENTS, strategiesDesConcurrents } from "../../src/config/cours/chapitres/lire-la-strategie-des-concurrents";
import { MARCHE_A_TROIS } from "../../src/config/cours/monde/marche-a-trois";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { ALLER_DANS_L_ESPACE_LIBRE, espaceLibre } from "../../src/config/cours/situations/par-chapitre/aller-dans-l-espace-libre";
import { BAISSER_LES_PRIX_SANS_RIEN_COUPER, prixBasSansRienCouper } from "../../src/config/cours/situations/par-chapitre/baisser-les-prix-sans-rien-couper";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours, EtapeLecture } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * DOMINATION PAR LES COÛTS OU DIFFÉRENCIATION, ET LIRE LA STRATÉGIE DE SES CONCURRENTS, SUR LE MARCHÉ
 * À TROIS DU MONDE DU COURS, ET LEURS CAS : BAISSER LES PRIX SANS RIEN COUPER, ALLER DANS L'ESPACE LIBRE.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche du marché (monde/marche-a-trois.ts),
 * sans les fonctions des chapitres ni le modèle (monde/attractivite.ts) : l'attractivité (59 ÷ prix)
 * puissance 4 × qualité puissance 2 × (1 + image), la part de chaque trimestre, les ventes arrondies
 * à l'enceinte chaque trimestre, la marge, les charges, le coût complet, le résultat, la carte. Les
 * valeurs absolues sont épinglées, les variantes (la gamme soignée à 65 €, l'autre année de la carte,
 * les coins vides, la critique) refaites comme le reste, et les verdicts aussi. Chaque curseur : son
 * attendu, sa position voisine, ses droites aux bornes, sa lecture. Chaque laboratoire : sa lecture au
 * départ et à la solution, et ses courbes en quelques points. Puis les gardes de texte de l'étalon.
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "nova";
const cas = casDeLEntreprise(code);
const f = MARCHE_A_TROIS;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const LN2 = Math.log(2);

// ─── LA FICHE, À LA MAIN ────────────────────────────────────────────────────
// Le marché : 15 502 enceintes par trimestre, 62 008 sur l'année ; le prix de référence 59 €.
const MARCHE = 15_502;
const ANNEE = 4 * MARCHE;
const CF = 12 * (19_700 + 10_650 + 833);
// Les charges de NOVA : fixes, et le budget qualité d'aujourd'hui, 4 000 € par trimestre.
const CHARGES = CF + 4 * 4_000;
// L'image de la communication : 2 000 € donnent +0,02 (entre 0 et 4 000 €, la droite de 0 à +0,04).
const IMAGE_2000 = 0.02;
// Les concurrents : SoundBox (51 €, 0,96 − 0,06 sans budget qualité, +0,08 d'image pour 16 000 €),
// Auris (79 €, 1,31 + 0,03 pour 16 000 €, +0,06 pour 8 000 € et 0,22 × ln 2 de capital-image).
const Q_SB = 0.96 - 0.06;
const Q_AU = 1.31 + 0.03;
const attr = (prix: number, q: number, image = 0, e = 2) => Math.pow(59 / prix, 4) * Math.pow(q, e) * (1 + image);
const A_SB = attr(51, Q_SB, 0.08);
const A_AU = attr(79, Q_AU, 0.06 + 0.22 * LN2);
// Les ventes d'un trimestre : la part du marché, à l'enceinte, dans la limite de la capacité (NOVA
// 7 000 enceintes par trimestre, SoundBox 12 000, Auris 5 000) ; une demande au-delà est perdue.
const parTrimestre = (a: number, concurrents = A_SB + A_AU) => Math.min(7_000, Math.round((a / (a + concurrents)) * MARCHE));
const ventesDe = (a: number) => 4 * parTrimestre(a);
const ventesSB = (a: number) => 4 * Math.min(12_000, Math.round((A_SB / (a + A_SB + A_AU)) * MARCHE));
const ventesAU = (a: number) => 4 * Math.min(5_000, Math.round((A_AU / (a + A_SB + A_AU)) * MARCHE));
const resultatAU = (a: number) => ventesAU(a) * (79 - 52) - (135_000 + 4 * (16_000 + 8_000 + 12_000));
const resultatSB = (a: number) => ventesSB(a) * (51 - 28) - (640_000 + 4 * 16_000);
/** Le résultat de NOVA à une offre : ventes × (prix − coût variable) − charges fixes et budgets de l'année. */
const resultatNova = (prix: number, cv: number, q: number, image = 0, budgets = 16_000) => ventesDe(attr(prix, q, image)) * (prix - cv) - (CF + budgets);
/** La carte d'une année, à la main : le prix moyen (le chiffre d'affaires des trois ÷ leurs ventes) au centime, la qualité moyenne au centième, les indices. */
function carteMain(prix: number, q: number, image = 0) {
  const a = attr(prix, q, image);
  const ca = ventesDe(a) * prix + ventesSB(a) * 51 + ventesAU(a) * 79;
  const pm = centime(ca / (ventesDe(a) + ventesSB(a) + ventesAU(a)));
  const qm = centime((q + Q_SB + Q_AU) / 3);
  return { ca, pm, qm, ip: Math.round((prix / pm) * 100), iq: Math.round((q / qm) * 100), ipSB: Math.round((51 / pm) * 100), iqSB: Math.round((Q_SB / qm) * 100), ipAU: Math.round((79 / pm) * 100), iqAU: Math.round((Q_AU / qm) * 100) };
}

// Les stratégies, à la main : la gamme standard (34 €, 0,92), actuelle (38 €, 1,00), soignée (43 €, 1,28).
const V_COUTS = ventesDe(attr(54, 0.92 - 0.02));
const V_MILIEU = ventesDe(attr(59, 1));
const V_DIFF = ventesDe(attr(69, 1.28 + 0.02, IMAGE_2000));
const R_COUTS = V_COUTS * 20 - (CF + 4 * 2_000);
const R_MILIEU = V_MILIEU * 21 - CHARGES;
const R_DIFF = V_DIFF * 26 - (CF + 4 * (8_000 + 2_000));

// ─── LES GARDES COMMUNES (celles de l'étalon) ────────────────────────────────

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|ventes?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(quatre|cinq|six|sept|huit|neuf|dix) (entreprises?|enseignes?|points?)\b/i);
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
      }
      // Sur un écart, la question dit avec quel signe le donner.
      if (champs.some((x) => /^Écart/.test(x.libelle))) expect(e.question(cas, etat), e.id).toMatch(/Négatif pour un écart (favorable|défavorable)/);
    }
    if (e.type === "tri") {
      const codes = e.categories.map((k) => k.code);
      for (const x of e.elements(cas)) {
        expect(codes, `${e.id} : ${x.libelle}`).toContain(x.categorie);
        // Le test de bout en bout trouve l'élément par son libellé, dans un attribut entre guillemets.
        expect(x.libelle, e.id).not.toMatch(/"/);
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

/** Un curseur : son attendu, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
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

// ─── LES DEUX CHAPITRES ─────────────────────────────────────────────────────

describe("les deux chapitres et leurs cas, chez NOVA, sur le marché à trois du monde du cours", () => {
  it("portent les titres du programme, au palier 2 de la stratégie, avec des blocs qui existent tels quels", () => {
    for (const ch of [COUTS_OU_DIFFERENCIATION, LIRE_LA_STRATEGIE_DES_CONCURRENTS]) {
      expect(CHAPITRES).toContain(ch);
      expect(PROGRAMME.strategie[2], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("strategie");
      expect(ch.palier).toBe(2);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toContain("STMG Thème 3 · Les choix stratégiques des organisations");
      for (const b of ch.blocs) {
        const cite = referentielDeCitation(b);
        expect(cite, b).not.toBeNull();
        expect(cite!.referentiel.entrees.some((x) => b.endsWith(` ${x}`)), b).toBe(true);
      }
      expect(ch.etapes[0]!.type).toBe("lecture");
      expect(ch.etapes.at(-1)!.id).toBe("synthese");
    }
    expect(SITUATIONS).toContain(BAISSER_LES_PRIX_SANS_RIEN_COUPER);
    expect(SITUATIONS).toContain(ALLER_DANS_L_ESPACE_LIBRE);
  });

  it("se jouent chez NOVA seule, et le disent à l'élève qui arrive d'une autre entreprise", () => {
    for (const ch of [COUTS_OU_DIFFERENCIATION, LIRE_LA_STRATEGIE_DES_CONCURRENTS, BAISSER_LES_PRIX_SANS_RIEN_COUPER, ALLER_DANS_L_ESPACE_LIBRE]) {
      expect(ch.entreprises?.codes, ch.code).toEqual(["nova"]);
      expect(ch.entreprises!.pourquoi, ch.code).toMatch(/^[a-zé].*\.$/);
      expect(ch.entreprises!.pourquoi, ch.code).toMatch(/SoundBox et Auris/);
    }
    expect(f.entreprise).toBe(cas.entreprise);
  });

  it("disent les hypothèses de la simulation dans l'intro, et finissent la synthèse par la phrase de l'arène", () => {
    for (const ch of [COUTS_OU_DIFFERENCIATION, LIRE_LA_STRATEGIE_DES_CONCURRENTS]) {
      const intro = (ch.etapes[0] as EtapeLecture).texte(cas).join(" ");
      expect(intro).toMatch(/l'année de la simulation du cours/);
      expect(intro).toMatch(/ni l'année N ni l'année N \+ 1/);
      expect(intro).toMatch(/15\s502 enceintes/);
      expect(intro).toMatch(/ne grandit pas/);
      expect(intro).toMatch(/ne réagissent pas/);
      expect(intro).toMatch(/puissance 4 × qualité perçue puissance 2/);
      const synthese = (ch.etapes.at(-1) as EtapeLecture).texte(cas);
      expect(synthese.at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
      expect(synthese.join(" ")).toMatch(/Au niveau de l'examen/);
    }
    expect((COUTS_OU_DIFFERENCIATION.etapes[0] as EtapeLecture).texte(cas).join(" ")).toMatch(/374\s196 €.*avant impôt/);
  });

  it("gardent les exports que la mission « jouez » importe (les multiplicateurs de prix de l'arène)", () => {
    expect(STRATEGIE_DE_COUTS.prix).toBe(0.9);
    expect(STRATEGIE_DE_DIFFERENCIATION.prix).toBe(1.15);
  });

  it("ont au moins deux cycles pari, puis curseur ou laboratoire, et un laboratoire avec un graphique et un levier à choix", () => {
    for (const ch of [COUTS_OU_DIFFERENCIATION, LIRE_LA_STRATEGIE_DES_CONCURRENTS]) {
      const ids = ch.etapes.map((e) => e.id);
      const paris = ids.filter((x) => x.startsWith("predire"));
      expect(paris.length, ch.code).toBeGreaterThanOrEqual(3);
      for (const p of paris) expect(["curseur", "simulation"], `${ch.code} / ${p}`).toContain(ch.etapes[ids.indexOf(p) + 1]!.type);
      expect(ch.etapes.filter((e) => e.type === "curseur").length, ch.code).toBeGreaterThanOrEqual(2);
      const labo = ch.etapes.find((e) => e.type === "simulation") as EtapeSimulation;
      expect(labo.graphique, ch.code).toBeDefined();
      expect(labo.leviers(cas).some((l) => l.choix), ch.code).toBe(true);
    }
  });
});

describe("domination par les coûts ou différenciation : les trois stratégies, refaites à la main", () => {
  const ch = COUTS_OU_DIFFERENCIATION;

  it("la fiche donne les chiffres de la consigne : ventes, résultats, coûts complets", () => {
    expect(CF).toBe(374_196);
    expect([V_COUTS, V_MILIEU, V_DIFF]).toEqual([21_060, 19_112, 18_048]);
    expect([R_COUTS, R_MILIEU, R_DIFF]).toEqual([39_004, 11_156, 55_052]);
    expect([centime(34 + 382_196 / V_COUTS), centime(38 + CHARGES / V_MILIEU), centime(43 + 414_196 / V_DIFF)]).toEqual([52.15, 58.42, 65.95]);
    const k = coutsOuDifferenciation(cas);
    expect([k.couts.resultat, k.milieu.resultat, k.differenciation.resultat]).toEqual([R_COUTS, R_MILIEU, R_DIFF]);
  });

  it("les étapes guidées : les parts de marché, la marge, le coût complet et le seuil", () => {
    expect(attendus(ch, "volume")).toEqual({
      "Part de marché, domination par les coûts (%)": centime((V_COUTS / ANNEE) * 100),
      "Part de marché, différenciation (%)": centime((V_DIFF / ANNEE) * 100),
    });
    expect(Object.values(attendus(ch, "volume"))).toEqual([33.96, 29.11]);
    expect(attendus(ch, "marge")).toEqual({
      "Marge par enceinte, domination par les coûts": 54 - 34,
      "Marge par enceinte, différenciation": 69 - 43,
      "Marge sur coût variable de l'année, domination par les coûts": V_COUTS * 20,
      "Marge sur coût variable de l'année, différenciation": V_DIFF * 26,
    });
    expect([V_COUTS * 20, V_DIFF * 26]).toEqual([421_200, 469_248]);
    // L'étape « résultat » fait calculer le coût complet des trois stratégies (le défaut de l'audit).
    expect(attendus(ch, "resultat")).toEqual({
      "Coût complet, domination par les coûts": centime(34 + (CF + 8_000) / V_COUTS),
      "Coût complet, milieu": centime(38 + CHARGES / V_MILIEU),
      "Coût complet, différenciation": centime(43 + (CF + 40_000) / V_DIFF),
      "Seuil de rentabilité, domination par les coûts": Math.ceil((CF + 8_000) / 20),
    });
    expect(Math.ceil((CF + 8_000) / 20)).toBe(19_110);
  });

  it("les étapes autonomes : les résultats et les écarts au milieu ; ce qu'il faudrait vendre", () => {
    expect(attendus(ch, "ecarts-au-milieu")).toEqual({
      "Résultat, domination par les coûts": R_COUTS,
      "Résultat, différenciation": R_DIFF,
      "Écart, domination par les coûts moins milieu": R_COUTS - R_MILIEU,
      "Écart, différenciation moins milieu": R_DIFF - R_MILIEU,
    });
    expect([R_COUTS - R_MILIEU, R_DIFF - R_MILIEU]).toEqual([27_848, 43_896]);
    const v = Math.ceil((R_DIFF + CF + 8_000) / 20);
    expect(attendus(ch, "ce-qu-il-faudrait-vendre")).toEqual({
      "Ventes qu'il faudrait à la stratégie de coûts": v,
      "Ventes de plus qu'avec la stratégie de coûts": v - V_COUTS,
      "Part de marché qu'il faudrait (%)": centime((v / ANNEE) * 100),
    });
    expect([v, v - V_COUTS, centime((v / ANNEE) * 100)]).toEqual([21_863, 803, 35.26]);
  });

  it("les étapes d'expert : le coût qu'il faudrait au milieu, à rebours ; l'année de la gamme soignée à 65 €, à la main", () => {
    const marge = centime((R_DIFF + CHARGES) / V_MILIEU);
    expect(attendus(ch, "a-rebours")).toEqual({
      "Marge par enceinte qu'il faudrait au milieu": marge,
      "Coût variable le plus haut": centime(59 - marge),
      "Baisse du coût variable par enceinte": centime(38 - (59 - marge)),
    });
    expect([marge, centime(59 - marge), centime(38 - (59 - marge))]).toEqual([23.3, 35.7, 2.3]);
    // La gamme standard au prix d'aujourd'hui : 4 € de moins, mais 0,92 de qualité, donc moins de ventes.
    expect(coutsOuDifferenciation(cas).standardAuPrixDuMilieu.resultat).toBe(resultatNova(59, 34, 0.92));
    expect(resultatNova(59, 34, 0.92)).toBeLessThan(R_DIFF);
    // La variante : la gamme soignée à 65 €, les budgets d'aujourd'hui.
    expect(VARIANTE_DE_L_EXPERT).toEqual({ gamme: "soignee", prix: 65 });
    const a = attr(65, 1.28);
    const part = a / (a + A_SB + A_AU);
    expect(attendus(ch, "battre-auris-a-la-main")).toEqual({
      "Part de marché de NOVA, chaque trimestre (%)": centime(part * 100),
      "Ventes de NOVA sur l'année": ventesDe(a),
      "Résultat de NOVA": ventesDe(a) * (65 - 43) - CHARGES,
      "Résultat d'Auris la même année": resultatAU(a),
    });
    expect([centime(part * 100), ventesDe(a), ventesDe(a) * 22 - CHARGES, resultatAU(a)]).toEqual([33.14, 20_548, 61_860, 58_824]);
    // L'élève qui arrondit les attractivités à quatre décimales retrouve les mêmes ventes.
    const a4 = Math.round(a * 10_000) / 10_000;
    expect(Math.round((a4 / (a4 + 1.5669 + 0.6773)) * MARCHE)).toBe(parTrimestre(a));
    expect(Math.round((0.6773 / (a4 + 1.5669 + 0.6773)) * MARCHE) * 4).toBe(ventesAU(a));
  });

  it("les verdicts : la différenciation, le milieu dernier et coincé, les paris, la critique", () => {
    expect(juste(ch, "predire-le-seuil")).toBe("La différenciation");
    expect(juste(ch, "laquelle")).toBe("La différenciation");
    expect(juste(ch, "milieu")).toBe("Dernier des trois");
    expect(juste(ch, "predire-le-rattrapage")).toBe("Moins de 2 000 ventes de plus");
    expect(juste(ch, "predire-auris")).toBe("La gamme soignée à 65 €, sans budget en plus");
    expect(juste(ch, "les-limites")).toBe("Le classement dépend des clients : moins sensibles à la qualité, ils le renverseraient");
    const k = coutsOuDifferenciation(cas);
    expect(k.rangDuMilieu).toBe("dernier");
    expect(k.coince).toBe(true);
    // Les parts ET les marges diffèrent : les coûts vendent le plus, la différenciation gagne le plus par enceinte.
    expect(V_COUTS).toBeGreaterThan(V_MILIEU);
    expect(V_MILIEU).toBeGreaterThan(V_DIFF);
    // La critique, à la main : des clients moins sensibles à la qualité (puissance 1), les concurrents aussi.
    expect(ELASTICITE_A_LA_QUALITE_DE_LA_CRITIQUE).toBe(1);
    const e = 1;
    const conc = attr(51, Q_SB, 0.08, e) + attr(79, Q_AU, 0.06 + 0.22 * LN2, e);
    const r = (prix: number, cv: number, q: number, image: number, budgets: number) => 4 * parTrimestre(attr(prix, q, image, e), conc) * (prix - cv) - (CF + budgets);
    const critique = { couts: r(54, 34, 0.9, 0, 8_000), milieu: r(59, 38, 1, 0, 16_000), differenciation: r(69, 43, 1.3, IMAGE_2000, 40_000) };
    expect([k.critique.couts.resultat, k.critique.milieu.resultat, k.critique.differenciation.resultat]).toEqual([critique.couts, critique.milieu, critique.differenciation]);
    expect(Object.values(critique)).toEqual([68_524, 10_904, -27_524]);
    // Ce que la stratégie de coûts fait à SoundBox, à la main.
    expect([resultatSB(attr(59, 1)), resultatSB(attr(54, 0.9))]).toEqual([-15_196, -46_476]);
    expect([k.soundboxDansLAnnee.milieu, k.soundboxDansLAnnee.couts]).toEqual([-15_196, -46_476]);
  });

  it("les curseurs, refaits à la main : le seuil de la différenciation, le rattrapage par le volume", () => {
    // Marge 26 × q face aux charges 414 196 € : ils se croisent à 414 196 ÷ 26.
    const seuil = Math.ceil((CF + 40_000) / 26);
    expect(seuil).toBe(15_931);
    expect(curseur(ch, "le-seuil-au-curseur")).toEqual({
      attendu: seuil,
      bornes: [10_000, 24_000],
      droites: [26 * 10_000, CF + 40_000, 26 * 24_000, CF + 40_000],
      lecture: {
        "Marge sur coût variable": 26 * seuil,
        "Charges fixes et budgets de l'année": CF + 40_000,
        "Coût complet d'une enceinte vendue": centime(43 + (CF + 40_000) / seuil),
        "Résultat de l'année": 26 * seuil - (CF + 40_000),
      },
    });
    expect([26 * seuil - (CF + 40_000), centime(43 + (CF + 40_000) / seuil)]).toEqual([10, 69]);
    // Résultat des coûts 20 × q − 382 196 € face à celui de la différenciation.
    const v = Math.ceil((R_DIFF + CF + 8_000) / 20);
    expect(curseur(ch, "le-volume-au-curseur")).toEqual({
      attendu: v,
      bornes: [20_000, 28_000],
      droites: [20 * 20_000 - (CF + 8_000), R_DIFF, 20 * 28_000 - (CF + 8_000), R_DIFF],
      lecture: {
        "Marge sur coût variable": 20 * v,
        "Charges fixes et budgets de l'année": CF + 8_000,
        "Résultat de la stratégie de coûts": 20 * v - (CF + 8_000),
        "Écart avec la différenciation": 20 * v - (CF + 8_000) - R_DIFF,
      },
    });
    expect(20 * v - (CF + 8_000) - R_DIFF).toBe(12);
  });

  it("le laboratoire de l'offre : battre Auris, avec la gamme soignée à 65 € ; la gamme standard ne la bat plus", () => {
    const l = laboratoire(ch, "le-laboratoire-de-l-offre");
    expect(l.depart).toEqual({ prix: 59, gamme: 1, qualite: 4_000, communication: 0 });
    expect(l.solution).toEqual({ prix: 65, gamme: 2, qualite: 4_000, communication: 0 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.e.leviers(cas).find((x) => x.code === "gamme")!.choix!.map((x) => x.valeur)).toEqual([0, 1, 2]);
    const aD = attr(59, 1);
    expect(l.auDepart).toEqual({
      "Ventes de NOVA": V_MILIEU,
      "Part de marché de NOVA": centime((V_MILIEU / ANNEE) * 100),
      "Demande perdue, faute de capacité": 0,
      "Marge par enceinte": 21,
      "Résultat de NOVA": R_MILIEU,
      "Résultat d'Auris": resultatAU(aD),
      "Résultat gagné sur aujourd'hui": 0,
      "Avance sur Auris": R_MILIEU - resultatAU(aD),
    });
    const aS = attr(65, 1.28);
    const rS = ventesDe(aS) * 22 - CHARGES;
    expect(l.aLaSolution).toEqual({
      "Ventes de NOVA": ventesDe(aS),
      "Part de marché de NOVA": centime((ventesDe(aS) / ANNEE) * 100),
      "Demande perdue, faute de capacité": 0,
      "Marge par enceinte": 22,
      "Résultat de NOVA": rS,
      "Résultat d'Auris": resultatAU(aS),
      "Résultat gagné sur aujourd'hui": rS - R_MILIEU,
      "Avance sur Auris": rS - resultatAU(aS),
    });
    expect([resultatAU(aD), rS - R_MILIEU, rS - resultatAU(aS)]).toEqual([70_488, 50_704, 3_036]);
    // La gamme standard à 54 €, au budget qualité d'aujourd'hui : depuis la réconciliation d'octobre 2026, elle ne bat plus Auris.
    const aStd = attr(54, 0.92);
    expect(l.d.atteint({ prix: 54, gamme: 0, qualite: 4_000, communication: 0 })).toBe(false);
    expect([ventesDe(aStd) * 20 - CHARGES, resultatAU(aStd)]).toEqual([43_324, 49_644]);
    // La gamme actuelle ne bat Auris à aucun prix de la course, aux budgets d'aujourd'hui.
    for (let p = 50; p <= 80; p++) expect(l.d.atteint({ prix: p, gamme: 1, qualite: 4_000, communication: 0 }), `${p} €`).toBe(false);
  });

  it("le graphique de l'offre : les deux résultats selon le prix, refaits à la main en quelques points", () => {
    const l = laboratoire(ch, "le-laboratoire-de-l-offre");
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("prix");
    const [nova, auris] = g.courbes;
    const p = (prix: number) => ({ ...l.solution, prix });
    for (const prix of [60, 64, 67, 68, 69]) {
      const a = attr(prix, 1.28);
      expect(nova!.valeur(p(prix)), `${prix} €`).toBe(ventesDe(a) * (prix - 43) - CHARGES);
      expect(auris!.valeur(p(prix)), `${prix} €`).toBe(resultatAU(a));
    }
    // Les deux courbes se croisent entre 65 et 66 € : battre Auris n'est possible que sous ce prix.
    const avance = (x: number) => ventesDe(attr(x, 1.28)) * (x - 43) - CHARGES - resultatAU(attr(x, 1.28));
    expect([64, 65, 66, 67, 68, 69].map((x) => nova!.valeur(p(x)) - auris!.valeur(p(x)))).toEqual([64, 65, 66, 67, 68, 69].map(avance));
    expect([64, 65, 66, 67, 68, 69].map(avance)).toEqual([7_568, 3_036, -2_356, -8_320, -14_868, -22_008]);
    // Battre Auris n'est pas gagner le plus : le meilleur résultat de NOVA est à 67 €, où Auris reste devant ; moins cher, l'avance grandit et le résultat baisse.
    expect(nova!.valeur(p(64))).toBe(ventesDe(attr(64, 1.28)) * 21 - CHARGES);
    expect(nova!.valeur(p(64))).toBe(59_372);
    expect(nova!.valeur(p(64))).toBeLessThan(nova!.valeur(p(67)));
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("baisser les prix sans rien couper : la demi-mesure, refaite à la main", () => {
  const s = BAISSER_LES_PRIX_SANS_RIEN_COUPER;
  const a = attr(54, 1);
  const V = ventesDe(a);
  const R = V * 16 - CHARGES;

  it("le cas dédié : sa forme, son commanditaire", () => {
    casDedie(s, COUTS_OU_DIFFERENCIATION);
    expect(s.commanditaire).toBe("Le directeur commercial");
  });

  it("ce que la proposition vend et gagne : ni la part ni la marge de la stratégie de coûts", () => {
    expect(attendus(s, "les-ventes")).toEqual({
      "Part de marché de la proposition, chaque trimestre (%)": centime((a / (a + A_SB + A_AU)) * 100),
      "Ventes de l'année de la proposition": V,
      "Marge par enceinte de la proposition": 54 - 38,
    });
    expect([centime((a / (a + A_SB + A_AU)) * 100), V, parTrimestre(a)]).toEqual([38.84, 24_084, 6_021]);
    // Sous la ligne : 6 021 enceintes par trimestre pour 7 000.
    expect(parTrimestre(a)).toBeLessThan(7_000);
    // Le défaut « 24,4 % contre 24,4 % » est réglé : ni la part ni la marge ne sont celles de la stratégie de coûts.
    expect(V).not.toBe(V_COUTS);
    expect(16).not.toBe(20);
    expect(attendus(s, "le-resultat")).toEqual({
      "Résultat de la proposition": R,
      "Coût complet d'une enceinte vendue": centime(38 + CHARGES / V),
      "Écart avec la stratégie de coûts": R - R_COUTS,
      "Écart avec aujourd'hui": R - R_MILIEU,
    });
    expect([R, centime(38 + CHARGES / V), R - R_COUTS, R - R_MILIEU]).toEqual([-4_852, 54.2, -43_856, -16_008]);
  });

  it("le croisement : la marge perdue, le volume gagné et les budgets gardés refont l'écart", () => {
    const marge = (16 - 20) * V;
    const volume = (V - V_COUTS) * 20;
    const budgets = 4 * 2_000 - 4 * 4_000;
    expect(attendus(s, "le-croisement")).toEqual({ "Effet de la marge par enceinte": marge, "Effet du volume": volume, "Effet des budgets gardés": budgets });
    expect([marge, volume, budgets]).toEqual([-96_336, 60_480, -8_000]);
    expect(marge + volume + budgets).toBe(R - R_COUTS);
  });

  it("le curseur : la ligne pourrait fabriquer ces ventes, mais le marché ne les donne pas", () => {
    const q = Math.ceil((R_COUTS + CHARGES) / 16);
    expect(q).toBe(26_825);
    expect(curseur(s, "rattraper-au-curseur")).toEqual({
      attendu: q,
      bornes: [24_000, 32_000],
      droites: [16 * 24_000 - CHARGES, R_COUTS, 16 * 32_000 - CHARGES, R_COUTS],
      lecture: {
        "Marge sur coût variable": 16 * q,
        "Charges fixes et budgets de l'année": CHARGES,
        "Résultat de la proposition": 16 * q - CHARGES,
        "Écart avec la stratégie de coûts": 16 * q - CHARGES - R_COUTS,
      },
    });
    // Depuis la réconciliation d'octobre 2026, la ligne pourrait les fabriquer ; c'est le marché qui ne suit pas.
    expect(q).toBeLessThan(4 * 7_000);
  });

  it("le verdict : la stratégie de coûts entière", () => {
    expect(prixBasSansRienCouper(cas).verdict).toBe("couts");
    expect(juste(s, "reponse")).toBe("La stratégie de coûts entière");
    expect(Math.max(R, R_COUTS, R_MILIEU)).toBe(R_COUTS);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

describe("lire la stratégie de ses concurrents : la carte, refaite à la main", () => {
  const ch = LIRE_LA_STRATEGIE_DES_CONCURRENTS;
  const c0 = carteMain(59, 1);

  it("la fiche donne les chiffres de la consigne : le prix moyen, la qualité moyenne, les indices", () => {
    expect(c0.ca).toBe(19_112 * 59 + 29_948 * 51 + 12_944 * 79);
    expect([c0.ca, c0.pm, c0.qm]).toEqual([3_677_532, centime(3_677_532 / (19_112 + 29_948 + 12_944)), 1.08]);
    expect(c0.pm).toBe(59.31);
    expect([c0.ip, c0.iq, c0.ipSB, c0.iqSB, c0.ipAU, c0.iqAU]).toEqual([99, 93, 86, 83, 133, 124]);
    expect(attendus(ch, "carte")).toEqual({ "Prix moyen du marché": c0.pm, "Indice de prix de NOVA": c0.ip, "Qualité moyenne du marché": c0.qm, "Indice de qualité de NOVA": c0.iq });
    const tri = ch.etapes.find((e) => e.id === "strategies") as EtapeTri;
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      NOVA: [59, "intermediaire"],
      SoundBox: [51, "couts"],
      Auris: [79, "differenciation"],
    });
  });

  it("la qualité qu'il faut : la moyenne bouge avec NOVA", () => {
    const qm = centime((1.28 + Q_SB + Q_AU) / 3);
    expect(attendus(ch, "la-qualite-qu-il-faut")).toEqual({
      "Qualité moyenne des deux concurrents": centime((Q_SB + Q_AU) / 2),
      "Qualité moyenne du marché, NOVA en gamme soignée": qm,
      "Indice de qualité de NOVA en gamme soignée": Math.round((1.28 / qm) * 100),
    });
    expect([centime((Q_SB + Q_AU) / 2), qm, Math.round((1.28 / qm) * 100)]).toEqual([1.12, 1.17, 109]);
  });

  it("les résultats des concurrents ; l'espace libre mesuré sur les deux indices ; les coins vides", () => {
    expect(attendus(ch, "les-resultats")).toEqual({
      "Marge par enceinte de SoundBox": 51 - 16 - 12,
      "Résultat de SoundBox": resultatSB(attr(59, 1)),
      "Marge par enceinte d'Auris": 79 - 34 - 18,
      "Résultat d'Auris": resultatAU(attr(59, 1)),
    });
    expect([resultatSB(attr(59, 1)), resultatAU(attr(59, 1))]).toEqual([-15_196, 70_488]);
    const dixieme = (x: number) => Math.round(x * 10) / 10;
    expect(attendus(ch, "l-espace-libre")).toEqual({
      "Distance entre SoundBox et NOVA": dixieme(Math.sqrt((c0.ip - c0.ipSB) ** 2 + (c0.iq - c0.iqSB) ** 2)),
      "Distance entre NOVA et Auris": dixieme(Math.sqrt((c0.ipAU - c0.ip) ** 2 + (c0.iqAU - c0.iq) ** 2)),
      "Prix de la place libre": (59 + 79) / 2,
      "Qualité de la place libre": centime((1 + Q_AU) / 2),
    });
    expect(Object.values(attendus(ch, "l-espace-libre"))).toEqual([16.4, 46, 69, 1.17]);
    // Les coins vides : NOVA au prix d'Auris avec son enceinte ; la gamme soignée au prix d'aujourd'hui, que la ligne borne.
    const aCher = attr(79, 1);
    const aGen = attr(59, 1.28);
    // La demande de la gamme soignée à 59 € : 4 × la part du marché ; elle tient dans la ligne (26 168 pour 28 000).
    const demandeGen = 4 * Math.round((aGen / (aGen + A_SB + A_AU)) * MARCHE);
    expect(attendus(ch, "les-coins-vides")).toEqual({
      "Résultat au prix haut, gamme actuelle": ventesDe(aCher) * (79 - 38) - CHARGES,
      "Demande perdue, gamme soignée au prix d'aujourd'hui": Math.max(0, demandeGen - 4 * 7_000),
      "Résultat de la gamme soignée au prix d'aujourd'hui": Math.min(demandeGen, 4 * 7_000) * (59 - 43) - CHARGES,
    });
    expect([ventesDe(aCher), ventesDe(aCher) * 41 - CHARGES, demandeGen - 26_168, ventesDe(aGen), 26_168 * 16 - CHARGES]).toEqual([7_548, -80_728, 0, 26_168, 28_492]);
  });

  it("une autre année : la carte refaite quand NOVA va dans l'espace libre avec la gamme soignée", () => {
    const c1 = carteMain(69, 1.28);
    expect(attendus(ch, "une-autre-annee")).toEqual({
      "Prix moyen du marché de cette année": c1.pm,
      "Qualité moyenne de cette année": c1.qm,
      "Indice de prix de NOVA cette année": c1.ip,
      "Indice de qualité de NOVA cette année": c1.iq,
    });
    expect([c1.ca, c1.pm, c1.qm, c1.ip, c1.iq]).toEqual([3_852_632, 62.13, 1.17, 111, 109]);
    // Le prix moyen monte avec NOVA : la place visée à l'indice 116 au prix moyen d'aujourd'hui est lue à 111.
    expect(Math.round((69 / c0.pm) * 100)).toBe(116);
    expect([c1.ipSB, c1.iqSB, c1.ipAU, c1.iqAU]).toEqual([82, 77, 127, 115]);
  });

  it("les curseurs, refaits à la main : le prix qui passe la barre, le volume qu'il faudrait à SoundBox", () => {
    const barre = 1.05 * c0.pm;
    expect(Math.ceil(barre)).toBe(63);
    expect(curseur(ch, "le-prix-au-curseur")).toEqual({
      attendu: 63,
      bornes: [55, 80],
      droites: [55, centime(barre), 80, centime(barre)],
      lecture: { "Prix de vente": 63, "Prix moyen du marché, tenu": c0.pm, "Prix de l'indice 105": centime(barre), "Au-dessus de la barre de": centime(63 - barre) },
    });
    // La vraie année à 63 € : le prix moyen monte, et l'indice n'est que de 104.
    const c63 = carteMain(63, 1);
    expect([c63.pm, c63.ip, c63.iq]).toEqual([60.36, 104, 93]);
    expect(strategiesDesConcurrents(cas).carteAuPrixQuiPasse.nova.indicePrix).toBe(c63.ip);
    // SoundBox : 23 € × q − 704 000 € face au résultat d'Auris.
    const q = Math.ceil((70_488 + 704_000) / 23);
    expect(q).toBe(33_674);
    expect(curseur(ch, "le-volume-de-soundbox")).toEqual({
      attendu: q,
      bornes: [28_000, 40_000],
      droites: [23 * 28_000 - 704_000, 70_488, 23 * 40_000 - 704_000, 70_488],
      lecture: {
        "Marge sur coût variable de SoundBox": 23 * q,
        "Charges fixes et budgets de l'année": 704_000,
        "Résultat de SoundBox": 23 * q - 704_000,
        "Écart avec Auris": 23 * q - 704_000 - 70_488,
      },
    });
  });

  it("le laboratoire de la carte : lue en différenciation, avec un meilleur résultat qu'aujourd'hui", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-carte");
    expect(l.depart).toEqual({ prix: 59, gamme: 1, qualite: 4_000 });
    expect(l.solution).toEqual({ prix: 69, gamme: 2, qualite: 4_000 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Prix moyen du marché": c0.pm,
      "Indice de prix de NOVA": c0.ip,
      "Indice de qualité de NOVA": c0.iq,
      "Ventes de NOVA": V_MILIEU,
      "Résultat de NOVA": R_MILIEU,
      "Résultat gagné sur aujourd'hui": 0,
    });
    const c1 = carteMain(69, 1.28);
    const r1 = ventesDe(attr(69, 1.28)) * 26 - CHARGES;
    expect(l.aLaSolution).toEqual({
      "Prix moyen du marché": c1.pm,
      "Indice de prix de NOVA": c1.ip,
      "Indice de qualité de NOVA": c1.iq,
      "Ventes de NOVA": ventesDe(attr(69, 1.28)),
      "Résultat de NOVA": r1,
      "Résultat gagné sur aujourd'hui": r1 - R_MILIEU,
    });
    expect([r1, r1 - R_MILIEU]).toEqual([62_412, 51_256]);
    // Au seul prix de 69 €, la gamme d'aujourd'hui reste intermédiaire, et perd ; un budget qualité doublé ne suffit pas non plus.
    const seul = carteMain(69, 1);
    expect([seul.ip, seul.iq]).toEqual([113, 93]);
    expect(l.d.atteint({ prix: 69, gamme: 1, qualite: 4_000 })).toBe(false);
    expect(l.d.atteint({ prix: 59, gamme: 1, qualite: 8_000 })).toBe(false);
    // La gamme standard n'est jamais lue en différenciation ; la gamme soignée l'est dès 65 € au budget d'aujourd'hui.
    for (let p = 50; p <= 80; p++) expect(l.d.atteint({ prix: p, gamme: 0, qualite: 4_000 }), `${p} €`).toBe(false);
    expect([64, 65].map((p) => l.d.atteint({ prix: p, gamme: 2, qualite: 4_000 }))).toEqual([false, true]);
    expect([carteMain(64, 1.28).ip, carteMain(65, 1.28).ip]).toEqual([105, 106]);
  });

  it("le graphique de la carte : le résultat selon le prix, et la ligne d'aujourd'hui", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-carte");
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("prix");
    const [nova, aujourdhui] = g.courbes;
    for (const prix of [55, 62, 67, 69, 75]) {
      expect(nova!.valeur({ ...l.solution, prix }), `${prix} €`).toBe(ventesDe(attr(prix, 1.28)) * (prix - 43) - CHARGES);
      expect(aujourdhui!.valeur({ ...l.solution, prix })).toBe(R_MILIEU);
    }
    expect(nova!.valeur({ ...l.solution, prix: 67 })).toBe(ventesDe(attr(67, 1.28)) * 24 - CHARGES);
    expect(nova!.valeur({ ...l.solution, prix: 67 })).toBe(63_788);
  });

  it("les verdicts : la carte, l'espace libre, la réussite, les paris", () => {
    expect(juste(ch, "predire-le-prix-seul")).toBe("Non : son indice de qualité resterait sous 100");
    expect(juste(ch, "predire-la-reussite")).toBe("Auris, la différenciation");
    expect(juste(ch, "reussite")).toBe("La part de marché ne fait pas le résultat : la marge et les charges le font");
    expect(juste(ch, "espace")).toBe("Entre NOVA et Auris");
    expect(juste(ch, "predire-l-offre")).toBe("Monter sa gamme, et son prix avec elle");
    const options = (ch.etapes.find((e) => e.id === "espace") as EtapeChoix).options(cas, etatVide).map((o) => o.texte);
    expect(options).toEqual(expect.arrayContaining(["Le coin des prix hauts, à qualité basse", "Le coin du meilleur rapport qualité-prix"]));
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("aller dans l'espace libre : par le seul prix, ou en y amenant la qualité", () => {
  const s = ALLER_DANS_L_ESPACE_LIBRE;
  const aSeul = attr(69, 1);
  const aAvec = attr(69, 1.28);
  const VS = ventesDe(aSeul);
  const VA = ventesDe(aAvec);
  const RS = VS * (69 - 38) - CHARGES;
  const RA = VA * (69 - 43) - CHARGES;

  it("le cas dédié : sa forme, son commanditaire", () => {
    casDedie(s, LIRE_LA_STRATEGIE_DES_CONCURRENTS);
    expect(s.commanditaire).toBe("La directrice");
  });

  it("la place : son prix et sa qualité", () => {
    expect(attendus(s, "la-place")).toEqual({
      "Prix de la place": 69,
      "Variation du prix (%)": Math.round((69 / 59 - 1) * 1_000) / 10,
      "Indice de prix de la place": Math.round((69 / 59.31) * 100),
      "Qualité de la place": centime((1 + Q_AU) / 2),
    });
    expect(Object.values(attendus(s, "la-place"))).toEqual([69, 16.9, 116, 1.17]);
  });

  it("les deux façons d'y aller, refaites à la main", () => {
    expect(attendus(s, "par-le-seul-prix")).toEqual({
      "Part de marché par le seul prix, chaque trimestre (%)": centime((aSeul / (aSeul + A_SB + A_AU)) * 100),
      "Ventes de l'année par le seul prix": VS,
      "Résultat par le seul prix": RS,
      "Écart avec aujourd'hui, par le seul prix": RS - R_MILIEU,
    });
    expect([centime((aSeul / (aSeul + A_SB + A_AU)) * 100), VS, RS, RS - R_MILIEU]).toEqual([19.24, 11_928, -20_428, -31_584]);
    expect(attendus(s, "avec-la-qualite")).toEqual({
      "Part de marché avec la qualité, chaque trimestre (%)": centime((aAvec / (aAvec + A_SB + A_AU)) * 100),
      "Ventes de l'année avec la qualité": VA,
      "Résultat avec la qualité": RA,
      "Écart avec aujourd'hui, avec la qualité": RA - R_MILIEU,
    });
    expect([centime((aAvec / (aAvec + A_SB + A_AU)) * 100), VA, RA, RA - R_MILIEU]).toEqual([28.07, 17_408, 62_412, 51_256]);
    // La gamme la moins chère qui atteint 1,17 au budget d'aujourd'hui : la soignée (1,28), pas l'actuelle (1,00).
    expect(espaceLibre(cas).gamme.code).toBe("soignee");
    // À la place, la gamme soignée sans budget en plus fait mieux que la différenciation du chapitre.
    expect(RA).toBeGreaterThan(R_DIFF);
  });

  it("le croisement : les ventes que la qualité retient, le coût de la gamme", () => {
    const volume = (VA - VS) * 26;
    const gamme = (26 - 31) * VS;
    expect(attendus(s, "le-croisement")).toEqual({
      "Effet des ventes retenues par la qualité": volume,
      "Effet du coût de la gamme": gamme,
      "Écart entre les deux façons d'y aller": RA - RS,
    });
    expect([volume, gamme, RA - RS]).toEqual([142_480, -59_640, 82_840]);
    expect(volume + gamme).toBe(RA - RS);
  });

  it("le curseur : les ventes qu'il faut à la place pour égaler aujourd'hui", () => {
    const q = Math.ceil((R_MILIEU + CHARGES) / 26);
    expect(q).toBe(15_437);
    expect(curseur(s, "les-ventes-au-curseur")).toEqual({
      attendu: q,
      bornes: [12_000, 22_000],
      droites: [26 * 12_000 - CHARGES, R_MILIEU, 26 * 22_000 - CHARGES, R_MILIEU],
      lecture: {
        "Marge sur coût variable": 26 * q,
        "Charges fixes et budgets de l'année": CHARGES,
        "Résultat à la place": 26 * q - CHARGES,
        "Écart avec aujourd'hui": 26 * q - CHARGES - R_MILIEU,
      },
    });
    // Par le seul prix, il faudrait (11 156 + 390 196) ÷ 31 ventes, et il n'en vient que 11 928.
    expect(Math.ceil((11_156 + 390_196) / 31)).toBe(12_947);
    expect(Math.ceil((R_MILIEU + CHARGES) / 31)).toBe(12_947);
    expect(VS).toBe(11_928);
    expect(VS).toBeLessThan(12_947);
  });

  it("le verdict : y aller, en y amenant la qualité", () => {
    expect(espaceLibre(cas).reponse).toBe("avec-la-qualite");
    expect(juste(s, "reponse")).toBe("Y aller, en y amenant la qualité");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
