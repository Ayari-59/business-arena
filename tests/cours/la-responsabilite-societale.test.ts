import { describe, expect, it } from "vitest";
import { referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  BUDGETS_DU_LABORATOIRE,
  LA_RESPONSABILITE_SOCIETALE,
  PLAFOND_DU_DEFI,
  PLAN_DU_T3,
  PLAN_QUI_MONTE,
  TOUT_AU_T3,
  budgetRse,
} from "../../src/config/cours/chapitres/la-responsabilite-societale";
import { MARCHE_A_TROIS } from "../../src/config/cours/monde/marche-a-trois";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { PROPOSITION_DE_LA_DIRECTION, VISER_LE_LABEL, viserLeLabel } from "../../src/config/cours/situations/par-chapitre/viser-le-label";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LA RESPONSABILITÉ SOCIÉTALE (stratégie et management, palier 4), SUR LE MARCHÉ À TROIS DU MONDE DU
 * COURS, ET SON CAS : VISER LE LABEL.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche (monde/marche-a-trois.ts), sans les
 * fonctions du chapitre ni le modèle (monde/attractivite.ts) : l'effort, le capital trimestre par
 * trimestre, le label, les ventes de chaque trimestre (la part du marché de 15 502 enceintes, face
 * aux attractivités des concurrents refaites comme dans tests/cours/marche-a-trois.test.ts), la
 * marge, le coût complet et le résultat. Les valeurs absolues sont épinglées, les variantes (tout au
 * trimestre 3, le plan du trimestre 3, le calcul à rebours) refaites comme le reste, les curseurs à
 * leur attendu, à leur position voisine et à leurs bornes, le laboratoire à son départ et à sa
 * solution, ses courbes en quelques points, et les verdicts aussi. Puis les gardes de texte de
 * l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "nova";
const cas = casDeLEntreprise(code);
const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

// La fiche, relue à la main.
const E = 12_000;
const K = 0.65;
const S = 0.22;
const SEUIL = 0.7;
const BONUS = 0.15;
const MARCHE = 15_502;
const MARGE = 59 - 38;
const FIXES = 12 * (19_700 + 10_650 + 833);
const QUALITE = 4 * 4_000;
const LN2 = Math.log(2);
/** Les concurrents d'aujourd'hui : (59 ÷ prix)⁴ × qualité² × (1 + image), comme la garde du marché. */
const A_CONCURRENTS = Math.pow(59 / 51, 4) * Math.pow(0.96 - 0.06, 2) * (1 + 0.08) + Math.pow(59 / 79, 4) * Math.pow(1.31 + 0.03, 2) * (1 + 0.06 + S * LN2);

const effort = (b: number) => Math.log(1 + b / E);
/** Le capital de la fin de chaque trimestre, parti de zéro. */
function fins(plan: readonly number[]) {
  const r: number[] = [];
  let c = 0;
  for (const b of plan) {
    c = K * c + (1 - K) * effort(b);
    r.push(c);
  }
  return r;
}
/** L'année de NOVA, refaite : le label accordé dès le trimestre 3 sur le capital d'ouverture, pour 2 trimestres. */
function annee(plan: readonly number[]) {
  const f = fins(plan);
  const ouv = [0, ...f.slice(0, 3)];
  const accordes = [3, 4].filter((t) => ouv[t - 1]! >= SEUIL);
  const label = [1, 2, 3, 4].map((t) => accordes.some((a) => t >= a && t < a + 2));
  const ventes = ouv.map((c, i) => {
    const a = (1 + S * c) * (label[i] ? 1 + BONUS : 1);
    return Math.round((a / (a + A_CONCURRENTS)) * MARCHE);
  });
  const total = somme(ventes);
  const charges = FIXES + QUALITE + somme(plan);
  return { fins: f, ouv, label, ventes, total, marge: total * MARGE, charges, resultat: total * MARGE - charges, coutComplet: centime(38 + charges / total) };
}

const SANS = annee([0, 0, 0, 0]);
const COURS = annee([E, E, E, E]);
const COURS_SANS_T4 = annee([E, E, E, 0]);
const MONTE = annee([...PLAN_QUI_MONTE, 0]);
const DU_T3 = annee([...PLAN_DU_T3, 0]);

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
      const g = e.graphique?.(c);
      return [
        e.titre,
        e.question(c),
        d.consigne,
        d.indice(depart),
        d.indice({ ...d.solution, ordre: 1 }),
        ...e.explication(c, d.solution),
        ...e.explication(c, { t1: PLAN_DU_T3[0]!, t2: PLAN_DU_T3[1]!, t3: PLAN_DU_T3[2]!, ordre: 0 }),
        ...e.lecture(c, d.solution).map((l) => l.libelle),
        ...e.leviers(c).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((x) => x.libelle)]),
        ...(g?.courbes.map((x) => x.libelle) ?? []),
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|enseignes?|Nomade|Salon)\b/i);
      // Ce que la simulation du cours n'a pas ne se dit plus comme si elle l'avait.
      expect(x, `${e.id} : ${x}`).not.toMatch(/bad buzz|process propre|zone tiède|éco-subvention|courrier|l'arène (rejoue|envoie|accorde)/i);
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
  // L'attendu est bien la position que le sens désigne : la plus petite qui couvre ; la position d'avant ne couvre pas.
  const couvre = (q: number) => d.produit(q) >= d.cout(q);
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(centime),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

describe("la responsabilité sociétale : la place dans le parcours et le monde du cours", () => {
  const ch = LA_RESPONSABILITE_SOCIETALE;

  it("au palier 4 du parcours stratégie, avec ses blocs, chez NOVA seule", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("strategie");
    expect(ch.palier).toBe(4);
    expect(PROGRAMME.strategie[4]).toContain(ch.titre);
    expect(ch.libre).toBe(false);
    expect(ch.blocs).toContain("STMG Thème 3 · Les organisations et la société");
    for (const b of ch.blocs) {
      const r = referentielDeCitation(b);
      expect(r, b).not.toBeNull();
      expect(r!.referentiel.entrees.some((x) => b.endsWith(` ${x}`)), b).toBe(true);
    }
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(SITUATIONS).toContain(VISER_LE_LABEL);
    expect(MARCHE_A_TROIS.entreprise).toBe(cas.entreprise);
  });

  it("la fiche donne les réglages du chapitre ; la mission jouée dans l'arène garde le budget du cours, l'échelle du scénario nova", () => {
    expect(MARCHE_A_TROIS.rse).toEqual({ inertie: K, echelle: E, sensibilite: S, seuilDuLabel: SEUIL, bonusDuLabel: BONUS, dureeDuLabel: 2, premierTrimestreDuLabel: 3, budgetDuCours: E });
    expect(budgetRse(code)).toBe(E);
    expect(budgetRse(code)).toBe(scenarioByCode(code).scenario.marketing.scale);
  });

  it("le gabarit : trois temps, au moins deux paris suivis d'un curseur ou du laboratoire, un laboratoire avec graphique et levier à choix, des étapes d'expert à trois champs", () => {
    const ids = ch.etapes.map((e) => e.id);
    for (const [pari, experience] of [
      ["predire-le-label", "l-effort-du-seuil"],
      ["predire-l-ordre", "le-laboratoire-du-label"],
      ["predire-les-ventes", "ce-qu-il-faut-vendre"],
    ] as const)
      expect(ids.indexOf(experience), pari).toBe(ids.indexOf(pari) + 1);
    const labo = ch.etapes.find((e) => e.type === "simulation") as EtapeSimulation;
    expect(labo.graphique).toBeDefined();
    expect(labo.leviers(cas).some((l) => l.choix)).toBe(true);
    for (const id of ["a-rebours", "a-budget-du-t4-egal", "le-label-des-le-t3"]) expect(Object.keys(attendus(ch, id)).length, id).toBeGreaterThanOrEqual(3);
    expect(ch.etapes.filter((e) => e.type === "curseur")).toHaveLength(2);
  });
});

describe("le capital-image et son plafond, refaits à la main", () => {
  const ch = LA_RESPONSABILITE_SOCIETALE;
  const e = Math.round(LN2 * 100) / 100;
  const c1 = Math.round((1 - K) * e * 100) / 100;
  const c2 = Math.round((K * c1 + (1 - K) * e) * 100) / 100;

  it("l'effort ln 2 = 0,69, le capital 0,24 puis 0,40, l'attractivité du trimestre 2 relevée de 5,3 %", () => {
    expect([e, c1, c2]).toEqual([0.69, 0.24, 0.4]);
    expect(attendus(ch, "capital")).toEqual({
      "Effort d'un trimestre": e,
      "Capital-image à la fin du trimestre 1": c1,
      "Capital-image à la fin du trimestre 2": c2,
      "Hausse d'attractivité au trimestre 2 (%)": Math.round(S * c1 * 1000) / 10,
    });
    expect(Math.round(S * c1 * 1000) / 10).toBe(5.3);
    // Sans arrondir, la fin du trimestre 3 et de l'année : 0,50 et 0,57.
    expect(fins([E, E, E, E]).map(centime)).toEqual([0.24, 0.4, 0.5, 0.57]);
  });

  it("le pari : le label ne vient jamais au budget du cours", () => {
    expect(LN2).toBeLessThan(SEUIL);
    expect(juste(ch, "predire-le-label")).toBe("Jamais, à ce budget : le capital plafonne sous le seuil");
  });

  it("le curseur de l'effort : 97 centièmes, le capital du trimestre 3 = (1 − 0,65³) × effort face au seuil de 70", () => {
    const poids = 1 - Math.pow(K, 3);
    expect(poids).toBeCloseTo(0.725375, 12);
    const attendu = Math.ceil(70 / poids);
    expect(attendu).toBe(97);
    expect(poids * 96).toBeLessThan(70);
    const budget = centime(E * (Math.exp(0.97) - 1));
    expect(curseur(ch, "l-effort-du-seuil")).toEqual({
      attendu,
      bornes: [0, 150],
      droites: [0, 70, centime(poids * 150), 70],
      lecture: { "Budget par trimestre qui donne cet effort": budget, "Coût des trimestres 1 à 3": centime(3 * budget), "Budget du cours, pour comparer": E },
    });
    expect([budget, centime(3 * budget)]).toEqual([19_655.33, 58_965.99]);
  });

  it("le plafond : 12 165,03 € par trimestre, il en manque 165,03 € ; le capital finit l'année à 0,57", () => {
    const plancher = centime(E * (Math.exp(SEUIL) - 1));
    expect(attendus(ch, "le-plafond")).toEqual({
      "Budget par trimestre sous lequel le label ne vient jamais": plancher,
      "Ce qu'il manque par trimestre au budget du cours": centime(plancher - E),
      "Capital-image à la fin de l'année": Math.round(e * (1 - Math.pow(K, 4)) * 100) / 100,
    });
    expect([plancher, centime(plancher - E), Math.round(e * (1 - Math.pow(K, 4)) * 100) / 100]).toEqual([12_165.03, 165.03, 0.57]);
  });

  it("le budget constant du label au trimestre 4 : un effort de 0,97, 19 498,02 € par trimestre, 58 494,06 € sur les trimestres 1 à 3", () => {
    const eff = SEUIL / (1 - Math.pow(K, 3));
    const budget = centime(E * (Math.exp(eff) - 1));
    expect(attendus(ch, "le-budget-constant")).toEqual({
      "Effort à tenir chaque trimestre": Math.round(eff * 100) / 100,
      "Budget constant par trimestre": budget,
      "Coût des trimestres 1 à 3": centime(3 * budget),
    });
    expect([Math.round(eff * 100) / 100, budget, centime(3 * budget)]).toEqual([0.97, 19_498.02, 58_494.06]);
    expect(fins([budget, budget, budget])[2]).toBeCloseTo(SEUIL, 6);
  });
});

describe("l'inertie : dépenser tard compte plus, refait à la main", () => {
  const ch = LA_RESPONSABILITE_SOCIETALE;

  it("le pari : le plan qui monte donne le label, le plan qui descend le rate", () => {
    expect(PLAN_QUI_MONTE).toEqual([4_000, 16_000, 36_000]);
    expect(MONTE.label).toEqual([false, false, false, true]);
    expect(annee([36_000, 16_000, 4_000, 0]).label).toEqual([false, false, false, false]);
    expect(juste(ch, "predire-l-ordre")).toBe("Le plan qui monte : la plus grosse dépense est la plus récente");
  });

  it("les poids des trimestres : 0,15, 0,23, 0,35", () => {
    const a = attendus(ch, "le-poids-des-trimestres");
    expect(a).toEqual({ "Poids de l'effort du trimestre 1": 0.15, "Poids de l'effort du trimestre 2": 0.23, "Poids de l'effort du trimestre 3": 0.35 });
    expect(Math.abs((1 - K) * K * K - a["Poids de l'effort du trimestre 1"]!)).toBeLessThan(0.005);
    expect(Math.abs((1 - K) * K - a["Poids de l'effort du trimestre 2"]!)).toBeLessThanOrEqual(0.0051);
    expect((1 - K) * K * K + (1 - K) * K + (1 - K)).toBeCloseTo(1 - Math.pow(K, 3), 12);
  });

  it("deux ordres et tout au trimestre 3 : 0,72, 0,50, 0,56 ; tout au trimestre 3, le seuil demanderait 76 668,67 €", () => {
    expect(TOUT_AU_T3).toBe(48_000);
    const v = {
      "Capital, plan qui monte": centime(fins(PLAN_QUI_MONTE)[2]!),
      "Capital, plan qui descend": centime(fins([...PLAN_QUI_MONTE].reverse())[2]!),
      "Capital, tout au trimestre 3": centime((1 - K) * effort(48_000)),
    };
    expect(attendus(ch, "deux-ordres")).toEqual(v);
    expect(Object.values(v)).toEqual([0.72, 0.5, 0.56]);
    expect(centime(E * (Math.exp(SEUIL / (1 - K)) - 1))).toBe(76_668.67);
  });

  it("à rebours : après 4 000 et 16 000 €, il faut 33 268,77 € au trimestre 3 (53 268,77 € en tout)", () => {
    const k2 = (1 - K) * (K * effort(4_000) + effort(16_000));
    const eff = (SEUIL - K * k2) / (1 - K);
    const budget = centime(E * (Math.exp(eff) - 1));
    expect(attendus(ch, "a-rebours")).toEqual({
      "Capital à la fin du trimestre 2": centime(k2),
      "Effort nécessaire au trimestre 3": centime(eff),
      "Budget du trimestre 3": budget,
      "Coût des trimestres 1 à 3": centime(20_000 + budget),
    });
    expect([centime(k2), centime(eff), budget, centime(20_000 + budget)]).toEqual([0.36, 1.33, 33_268.77, 53_268.77]);
    expect(fins([4_000, 16_000, budget])[2]).toBeCloseTo(SEUIL, 6);
  });

  it("la critique du plan le moins cher : le logarithme, pas le poids seul", () => {
    expect(juste(ch, "le-plan-le-moins-cher")).toBe("Chaque euro de plus dans un même trimestre y rapporte moins que le précédent");
    // Le plan le moins cher, refait : E + budget du trimestre proportionnel à son poids.
    const w = [(1 - K) * K * K, (1 - K) * K, 1 - K];
    const lnLambda = (SEUIL - somme(w.map((x) => x * Math.log(x / E)))) / somme(w);
    const plan = w.map((x) => Math.exp(lnLambda) * x - E);
    expect(plan.map(Math.round)).toEqual([6_158, 15_935, 30_977]);
    expect(Math.round(somme(plan))).toBe(53_070);
    const q = (LA_RESPONSABILITE_SOCIETALE.etapes.find((x) => x.id === "le-plan-le-moins-cher") as EtapeChoix).question(cas, etatVide);
    expect(q).toContain("53 070 €");
  });
});

describe("le laboratoire du label, refait à la main", () => {
  const ch = LA_RESPONSABILITE_SOCIETALE;
  const e = ch.etapes.find((x) => x.id === "le-laboratoire-du-label") as EtapeSimulation;
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  const attendu = (plan: readonly number[]) => {
    const a = annee(plan);
    return {
      "Capital-image à l'ouverture du trimestre 4": centime(a.ouv[3]! * 100),
      "Seuil du label": 70,
      "Trimestres sous label dans l'année": a.label.filter(Boolean).length,
      "Budget RSE des trimestres 1 à 3": somme(plan),
      "Ventes de l'année": a.total,
      "Écart de résultat face à l'année sans engagement": a.resultat - SANS.resultat,
      "Résultat de l'année": a.resultat,
    };
  };

  it("les leviers : trois budgets de 0 à 40 000 € par 500 €, et l'ordre, un levier à choix", () => {
    expect(BUDGETS_DU_LABORATOIRE).toEqual({ min: 0, max: 40_000, pas: 500 });
    expect(depart).toEqual({ t1: E, t2: E, t3: E, ordre: 0 });
    expect(e.leviers(cas).find((l) => l.code === "ordre")!.choix!.map((x) => x.valeur)).toEqual([0, 1]);
  });

  it("au départ (le budget du cours sur trois trimestres) : 50,28 centièmes, pas de label, −7 792 €", () => {
    expect(lire(depart)).toEqual(attendu([E, E, E, 0]));
    // 19 924 enceintes × 21 € − 374 196 € de fixes − 16 000 € de qualité − 36 000 € de RSE ; 11 156 € sans engagement.
    expect(19_924 * 21 - 374_196 - 16_000 - 36_000).toBe(-7_792);
    expect(-7_792 - 11_156).toBe(-18_948);
    expect(Object.values(attendu([E, E, E, 0]))).toEqual([50.28, 70, 0, 36_000, 19_924, -18_948, -7_792]);
  });

  it("la solution (4 000, 16 000, 36 000 €) : 72,05 centièmes, le label au trimestre 4, 56 000 € sous le plafond du défi", () => {
    expect(PLAFOND_DU_DEFI).toBe(58_500);
    expect(d.solution).toEqual({ t1: 4_000, t2: 16_000, t3: 36_000, ordre: 0 });
    expect([d.atteint(depart), d.atteint(d.solution)]).toEqual([false, true]);
    expect(lire({ ...d.solution })).toEqual(attendu([...PLAN_QUI_MONTE, 0]));
    expect(Object.values(attendu([...PLAN_QUI_MONTE, 0]))).toEqual([72.05, 70, 1, 56_000, 20_439, -28_133, -16_977]);
    expect([20_439 * 21 - 390_196 - 56_000, -16_977 - 11_156]).toEqual([-16_977, -28_133]);
    // Les mêmes budgets dans l'autre ordre ratent le défi ; le budget constant au pas du laboratoire (19 500 €) le rate d'un euro.
    expect(d.atteint({ ...d.solution, ordre: 1 })).toBe(false);
    expect(lire({ ...d.solution, ordre: 1 })).toEqual(attendu([36_000, 16_000, 4_000, 0]));
    expect(d.atteint({ t1: 19_500, t2: 19_500, t3: 19_500, ordre: 0 })).toBe(false);
    expect(d.atteint({ t1: 19_000, t2: 19_000, t3: 19_000, ordre: 0 })).toBe(false);
    // Le plan du trimestre 3 relève aussi le défi : le label y joue dès le trimestre 3.
    expect(d.atteint({ t1: 20_000, t2: 36_000, t3: 0, ordre: 0 })).toBe(true);
  });

  it("le graphique : le capital selon le budget du trimestre 3, dans l'ordre choisi et dans l'autre, et le seuil", () => {
    const g = e.graphique!(cas);
    expect(g.levier).toBe("t3");
    expect(g.unite).toBe("centièmes");
    const [ordre, autre, seuil] = g.courbes;
    const p = (t3: number) => ({ ...d.solution, t3 });
    const k = (t1: number, t2: number, t3: number) => centime(100 * (1 - K) * (K * K * effort(t1) + K * effort(t2) + effort(t3)));
    for (const t3 of [0, 20_000, 36_000, 40_000]) {
      expect(ordre!.valeur(p(t3)), `${t3}`).toBe(k(4_000, 16_000, t3));
      expect(autre!.valeur(p(t3)), `${t3}`).toBe(k(t3, 16_000, 4_000));
      expect(seuil!.valeur(p(t3))).toBe(70);
    }
    expect([0, 20_000, 36_000, 40_000].map((t3) => k(4_000, 16_000, t3))).toEqual([23.53, 57.86, 72.05, 74.85]);
    // L'autre ordre ne passe jamais le seuil sur toute la course : dépenser tôt, c'est l'inertie qui oublie.
    expect(autre!.valeur(p(40_000))).toBeLessThan(70);
    // Inverser l'ordre, c'est échanger les deux courbes.
    expect(ordre!.valeur({ ...p(30_000), ordre: 1 })).toBe(autre!.valeur(p(30_000)));
  });
});

describe("l'année engagée : ce que l'engagement coûte et rapporte, refait à la main", () => {
  const ch = LA_RESPONSABILITE_SOCIETALE;

  it("les ventes de chaque trimestre : 4 778 sans engagement ; 4 778, 4 952, 5 062, 5 132 au budget du cours", () => {
    expect(SANS.ventes).toEqual([4_778, 4_778, 4_778, 4_778]);
    expect(COURS.ventes).toEqual([4_778, 4_952, 5_062, 5_132]);
    expect([SANS.total, COURS.total]).toEqual([4 * 4_778, 4_778 + 4_952 + 5_062 + 5_132]);
    expect([SANS.resultat, COURS.resultat]).toEqual([19_112 * 21 - 390_196, 19_924 * 21 - 390_196 - 48_000]);
    expect([SANS.resultat, COURS.resultat]).toEqual([11_156, -19_792]);
    // La ligne de 7 000 enceintes par trimestre ne borne rien.
    expect(Math.max(...COURS.ventes, ...DU_T3.ventes, ...MONTE.ventes)).toBeLessThan(7_000);
  });

  it("le pari : moins de 5 % de ventes en plus, quand l'attractivité monte de 5,3 à 11,1 %", () => {
    const hausses = COURS.ouv.map((c) => Math.round(S * c * 1000) / 10);
    expect(hausses).toEqual([0, 5.3, 8.8, 11.1]);
    expect((COURS.total - SANS.total) / SANS.total).toBeLessThan(0.05);
    expect(juste(ch, "predire-les-ventes")).toBe("De moins de 5 % : une part monte moins vite que l'attractivité");
  });

  it("le curseur des ventes : 2 286 enceintes en plus paieraient les 48 000 €", () => {
    const attendu = Math.ceil(48_000 / MARGE);
    expect(attendu).toBe(2_286);
    expect(curseur(ch, "ce-qu-il-faut-vendre")).toEqual({
      attendu,
      bornes: [0, 4_000],
      droites: [0, 48_000, MARGE * 4_000, 48_000],
      lecture: { "Marge gagnée": MARGE * attendu, "Coût de l'engagement": 48_000, "Écart de résultat": MARGE * attendu - 48_000 },
    });
    expect(MARGE * attendu - 48_000).toBe(6);
  });

  it("l'année engagée : 812 enceintes, 17 052 € de marge, −19 792 €, −30 948 €", () => {
    const gagnees = COURS.total - SANS.total;
    expect(attendus(ch, "l-annee-engagee")).toEqual({
      "Ventes gagnées sur l'année": gagnees,
      "Marge gagnée sur l'année": gagnees * MARGE,
      "Résultat de l'année engagée": COURS.resultat,
      "Écart de résultat avec l'année sans engagement": COURS.resultat - SANS.resultat,
    });
    expect([gagnees, gagnees * MARGE, COURS.resultat - SANS.resultat]).toEqual([19_924 - 19_112, 812 * 21, -19_792 - 11_156]);
    expect([gagnees, gagnees * MARGE, COURS.resultat - SANS.resultat]).toEqual([812, 17_052, -30_948]);
    expect(COURS.resultat - SANS.resultat).toBe(gagnees * MARGE - 48_000);
  });

  it("le coût complet : 58,42 € sans engagement, 59,99 € au budget du cours", () => {
    expect(attendus(ch, "le-cout-complet")).toEqual({
      "Coût complet sans engagement": SANS.coutComplet,
      "Coût complet au budget du cours": COURS.coutComplet,
      "Hausse du coût complet": centime(COURS.coutComplet - SANS.coutComplet),
    });
    expect([SANS.coutComplet, COURS.coutComplet, centime(COURS.coutComplet - SANS.coutComplet)]).toEqual([centime(38 + 390_196 / 19_112), centime(38 + 438_196 / 19_924), centime(59.99 - 58.42)]);
    expect([SANS.coutComplet, COURS.coutComplet]).toEqual([58.42, 59.99]);
  });

  it("le verdict de l'année : pas encore", () => {
    expect(juste(ch, "verdict")).toBe("Pas encore : la demande gagnée se vend, mais pas assez pour payer l'année");
  });

  it("à budget du trimestre 4 égal : le plan qui monte paraît gagner 2 815 €, il perd 9 185 €", () => {
    expect(20_439 * 21 - 390_196 - 56_000).toBe(-16_977);
    expect([MONTE.ventes, MONTE.resultat, COURS_SANS_T4.resultat]).toEqual([[4_778, 4_851, 5_035, 5_775], -16_977, -7_792]);
    expect(attendus(ch, "a-budget-du-t4-egal")).toEqual({
      "Écart du plan qui monte au budget du cours": MONTE.resultat - COURS.resultat,
      "Effet du budget du trimestre 4 sur le résultat de l'année": COURS.resultat - COURS_SANS_T4.resultat,
      "Écart du plan qui monte, à budget du trimestre 4 égal": MONTE.resultat - COURS_SANS_T4.resultat,
    });
    expect([MONTE.resultat - COURS.resultat, COURS.resultat - COURS_SANS_T4.resultat, MONTE.resultat - COURS_SANS_T4.resultat]).toEqual([-16_977 - -19_792, -12_000, -16_977 - -7_792]);
    expect(MONTE.resultat - COURS.resultat).toBe(2_815);
    expect(MONTE.resultat - COURS_SANS_T4.resultat).toBe(-9_185);
    // Le budget du trimestre 4 ne fait rien vendre dans l'année : les ventes sont les mêmes.
    expect(COURS_SANS_T4.ventes).toEqual(COURS.ventes);
  });

  it("le label dès le trimestre 3 : les mêmes 56 000 € aux trimestres 1 et 2, 0,71, 2 trimestres de label, +5 914 € face au budget du cours, −13 034 € face à l'année sans engagement", () => {
    expect(PLAN_DU_T3).toEqual([20_000, 36_000, 0]);
    expect(somme(PLAN_DU_T3)).toBe(somme(PLAN_QUI_MONTE));
    expect(DU_T3.label).toEqual([false, false, true, true]);
    expect(DU_T3.ventes).toEqual([4_778, 5_022, 5_766, 5_592]);
    expect(DU_T3.resultat).toBe((4_778 + 5_022 + 5_766 + 5_592) * 21 - 390_196 - 56_000);
    expect(DU_T3.resultat).toBe(-1_878);
    expect(attendus(ch, "le-label-des-le-t3")).toEqual({
      "Capital à la fin du trimestre 2": centime(DU_T3.fins[1]!),
      "Écart au budget du cours sans le trimestre 4": DU_T3.resultat - COURS_SANS_T4.resultat,
      "Écart à l'année sans engagement": DU_T3.resultat - SANS.resultat,
    });
    expect([centime(DU_T3.fins[1]!), DU_T3.resultat - COURS_SANS_T4.resultat, DU_T3.resultat - SANS.resultat]).toEqual([0.71, -1_878 - -7_792, -1_878 - 11_156]);
    expect([DU_T3.resultat - COURS_SANS_T4.resultat, DU_T3.resultat - SANS.resultat]).toEqual([5_914, -13_034]);
    // Une marge sur le seuil que l'arrondi au centième ne menace pas.
    expect(DU_T3.fins[1]! - SEUIL).toBeGreaterThan(0.005);
  });

  it("les verdicts du label et de fond : plus il vient tôt, plus il rapporte ; un investissement", () => {
    expect(juste(ch, "ce-que-paie-le-label")).toBe("Plus il vient tôt, plus il rapporte : au trimestre 3, il paie son budget");
    expect(juste(ch, "de-fond")).toBe("Un investissement : un capital payé maintenant, qui rapporte ensuite");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : viser le label avec 24 000 € par trimestre, refait à la main", () => {
  const s = VISER_LE_LABEL;
  const B = PROPOSITION_DE_LA_DIRECTION;
  const PROPOSITION = annee([B, B, B, B]);
  const CROISEMENT = annee([...PLAN_QUI_MONTE, B]);

  it("un cas dédié au chapitre, commandé par la direction", () => {
    casDedie(s, LA_RESPONSABILITE_SOCIETALE);
    expect(s.commanditaire).toBe("La direction");
    expect(B).toBe(2 * E);
  });

  it("le capital : un effort de ln 3 = 1,10, 0,80 à la fin du trimestre 3 (0,10 sur le seuil), 96 000 € sur l'année", () => {
    const e = Math.round(Math.log(3) * 100) / 100;
    expect(attendus(s, "capital")).toEqual({
      "Effort d'un trimestre": e,
      "Capital-image à la fin du trimestre 3": Math.round(e * (1 - Math.pow(K, 3)) * 100) / 100,
      "Coût de l'engagement sur l'année": 4 * B,
    });
    expect([e, Math.round(e * (1 - Math.pow(K, 3)) * 100) / 100, 4 * B]).toEqual([1.1, 0.8, 96_000]);
    // Sans arrondir aussi : la marge sur le seuil est nette (l'ancien cas tombait à 0,70005).
    expect(fins([B, B, B])[2]! - SEUIL).toBeGreaterThan(0.09);
    expect(fins([19_500, 19_500, 19_500])[2]! - SEUIL).toBeLessThan(0.0001);
  });

  it("l'année : 4 778, 5 051, 5 221, 5 827 enceintes ; −47 779 €, −58 935 € face à l'année sans engagement, −27 987 € face au budget du cours", () => {
    expect(PROPOSITION.ventes).toEqual([4_778, 5_051, 5_221, 5_827]);
    expect(PROPOSITION.label).toEqual([false, false, false, true]);
    expect(attendus(s, "l-annee")).toEqual({
      "Marge gagnée face à l'année sans engagement": PROPOSITION.marge - SANS.marge,
      "Écart de résultat avec l'année sans engagement": PROPOSITION.resultat - SANS.resultat,
      "Écart de résultat avec le budget du cours": PROPOSITION.resultat - COURS.resultat,
    });
    expect([PROPOSITION.marge - SANS.marge, PROPOSITION.resultat, PROPOSITION.resultat - SANS.resultat, PROPOSITION.resultat - COURS.resultat]).toEqual([(20_877 - 19_112) * 21, 20_877 * 21 - 390_196 - 96_000, -47_779 - 11_156, -47_779 - -19_792]);
    expect([PROPOSITION.marge - SANS.marge, PROPOSITION.resultat, PROPOSITION.resultat - SANS.resultat, PROPOSITION.resultat - COURS.resultat]).toEqual([37_065, -47_779, -58_935, -27_987]);
    expect(viserLeLabel(cas).verdict).toBe("pas-cette-annee");
  });

  it("le curseur du cas : 2 286 enceintes de plus qu'au budget du cours paieraient les 48 000 € en plus ; la proposition en vend 953", () => {
    const enPlus = 4 * B - 4 * E;
    const attendu = Math.ceil(enPlus / MARGE);
    expect(attendu).toBe(2_286);
    expect(PROPOSITION.total - COURS.total).toBe(20_877 - 19_924);
    expect(PROPOSITION.total - COURS.total).toBe(953);
    expect(curseur(s, "ce-qu-il-faudrait-vendre")).toEqual({
      attendu,
      bornes: [0, 4_000],
      droites: [0, enPlus, MARGE * 4_000, enPlus],
      lecture: { "Marge de ces ventes": MARGE * attendu, "Budget en plus": enPlus, "Écart avec le budget du cours": MARGE * attendu - enPlus },
    });
  });

  it("le croisement : le plan qui monte suivi des mêmes 24 000 € au trimestre 4, le même label pour 16 000 € de moins, 6 802 € de mieux", () => {
    expect(CROISEMENT.label).toEqual(PROPOSITION.label);
    expect(CROISEMENT.ventes).toEqual(MONTE.ventes);
    expect(CROISEMENT.resultat).toBe(20_439 * 21 - 390_196 - (56_000 + 24_000));
    expect(CROISEMENT.resultat).toBe(-40_977);
    expect(attendus(s, "le-plan-qui-monte")).toEqual({
      "Capital du plan qui monte à la fin du trimestre 3": centime(CROISEMENT.fins[2]!),
      "Économie sur les trimestres 1 à 3": 3 * B - somme(PLAN_QUI_MONTE),
      "Écart de résultat avec le budget proposé": CROISEMENT.resultat - PROPOSITION.resultat,
    });
    expect([centime(CROISEMENT.fins[2]!), 3 * B - somme(PLAN_QUI_MONTE), CROISEMENT.resultat - PROPOSITION.resultat]).toEqual([0.72, 16_000, -40_977 - -47_779]);
    // Les deux plans gardent le label au début de l'année suivante : leur capital de fin d'année reste au-dessus du seuil.
    expect(CROISEMENT.fins[3]).toBeGreaterThan(SEUIL);
    expect(PROPOSITION.fins[3]).toBeGreaterThan(SEUIL);
    // Et l'année reste sous le budget du cours : le label ne se paie pas cette année.
    expect(CROISEMENT.resultat - COURS.resultat).toBe(-40_977 - -19_792);
    expect(CROISEMENT.resultat - COURS.resultat).toBe(-21_185);
  });

  it("la réponse : le label, mais pas à 24 000 €", () => {
    expect(juste(s, "reponse")).toBe("Le label, oui, mais pas à 24 000 € : il s'obtient pour moins");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
