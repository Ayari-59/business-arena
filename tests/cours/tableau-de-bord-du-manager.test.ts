import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  AXES_DU_TABLEAU,
  ENTREES_DU_CURSEUR,
  FEVRIER_A_REBOURS,
  LEVIERS_DES_VOYANTS,
  TABLEAU_DE_BORD_DU_MANAGER,
} from "../../src/config/cours/chapitres/tableau-de-bord-du-manager";
import { MAILLE_ET_CO } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { LE_TRIMESTRE_FACE_A_L_OBJECTIF, MOIS_RESTANTS, janvierFaceALObjectif } from "../../src/config/cours/situations/par-chapitre/le-trimestre-face-a-l-objectif";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeLecture, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE TABLEAU DE BORD DU MANAGER, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : JANVIER FACE À L'OBJECTIF.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de MAILLE & CO (monde/maille-et-co.ts),
 * sans les fonctions du chapitre ni le modèle (monde/boutique.ts) : janvier N face à janvier N − 1 et à
 * l'objectif (le tiers du budget du trimestre), les voyants, le trafic qui les éteint, la décomposition
 * de l'écart en trafic, transformation et panier, février à rebours, et le reste du trimestre du cas.
 * Les valeurs absolues sont épinglées, les verdicts aussi. Chaque curseur : son attendu, la position
 * voisine, ses droites aux bornes, sa lecture ; le laboratoire : sa lecture au départ et à la solution,
 * les courbes de son graphique en quelques points. Puis les gardes de texte de l'étalon.
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "boutique";
const cas = casDeLEntreprise(code);
const f = MAILLE_ET_CO;
const centime = (x: number) => Math.round(x * 100) / 100;
const dixieme = (x: number) => Math.round(x * 10) / 10;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

// ── La fiche, refaite à la main ────────────────────────────────────────────────
const ca = somme(f.gamme.map((r) => r.ventesDuMois * r.prixHt));
const cv = somme(f.gamme.map((r) => r.ventesDuMois * (r.coutDAchat + r.autresCoutsVariables)));
const entrees = somme(f.clienteles.map((c) => c.entrees));
const tickets = somme(f.clienteles.map((c) => c.tickets));
const panier = ca / tickets;
const n1 = f.moisN1;
const budget = somme(f.gamme.map((r) => f.budget.ventesPrevues[r.code] * r.prixHt));
const objectif = centime(budget / 3);
const chargesFixes = f.charges.loyer + f.charges.publicite + f.charges.entretien + f.charges.amortissement + centime(somme(f.equipe.map((s) => s.brutMensuel)) * 1.42);
const seuil = centime(chargesFixes / ((ca - cv) / ca));
const paie = centime(somme(f.equipe.map((s) => s.brutMensuel)) * 1.42);

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
      return [e.titre, e.question(c), d.consigne, d.indice(depart), ...e.explication(c, d.solution), ...e.lecture(c, d.solution).map((l) => l.libelle), ...e.leviers(c).flatMap((l) => [l.libelle, l.unite])];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "demandé", "servi", "manqué", "perdu"];

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|seize|vingt|trente|cent) (articles?|heures?|entrées?|passages?|vendeurs?|salariés?|créneaux?|jours?)\b/i);
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
      if (champs.some((x) => /^Écart/.test(x.libelle))) expect(e.question(cas, etat), e.id).toMatch(/Négatif pour un écart (favorable|défavorable)/);
    }
    if (e.type === "tri") {
      const codes = e.categories.map((k) => k.code);
      for (const x of e.elements(cas)) expect(codes, `${e.id} : ${x.libelle}`).toContain(x.categorie);
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
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, la position voisine, ses droites aux deux bornes, et sa lecture à l'attendu. */
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
  return { e, lire, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)], atteint: d.atteint };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

describe("le tableau de bord du manager, à la boutique du monde du cours", () => {
  const ch = TABLEAU_DE_BORD_DU_MANAGER;
  const caParEntree = ca / entrees;
  const cible = objectif * 0.95;

  it("se joue chez MAILLE & CO seule, au palier 4 du BTS MCO, et son cas aussi", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(LE_TRIMESTRE_FACE_A_L_OBJECTIF);
    expect(ch.parcours).toBe("mco");
    expect(ch.palier).toBe(4);
    expect(ch.entreprises?.codes).toEqual(["boutique"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(f.entreprise).toBe(cas.entreprise);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect((ch.etapes.at(-1) as EtapeLecture).texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("la fiche donne les chiffres de la consigne", () => {
    expect([ca, entrees, tickets, budget, objectif]).toEqual([87_450, 3_848, 948, 289_850, 96_616.67]);
    expect([n1.trafic, n1.tickets, n1.chiffreDAffaires]).toEqual([4_160, 1_000, 89_600]);
    expect([chargesFixes, seuil]).toEqual([30_695, 60_661.64]);
    expect(dixieme((ca / n1.chiffreDAffaires - 1) * 100)).toBe(-2.4);
  });

  it("les étapes guidées : janvier face à N − 1, puis face à l'objectif", () => {
    expect(attendus(ch, "evolutions")).toEqual({
      "Évolution du chiffre d'affaires (%)": dixieme((ca / n1.chiffreDAffaires - 1) * 100),
      "Évolution des entrées (%)": dixieme((entrees / n1.trafic - 1) * 100),
      "Évolution des passages en caisse (%)": dixieme((tickets / n1.tickets - 1) * 100),
    });
    expect(Object.values(attendus(ch, "evolutions"))).toEqual([-2.4, -7.5, -5.2]);
    expect(attendus(ch, "l-objectif")).toEqual({
      "Objectif du mois": objectif,
      "Écart à l'objectif": centime(ca - objectif),
      "Taux de réalisation (%)": dixieme((ca / objectif) * 100),
    });
    expect([centime(ca - objectif), dixieme((ca / objectif) * 100)]).toEqual([-9_166.67, 90.5]);
  });

  it("le tri : chaque indicateur à sa famille, avec sa valeur de janvier", () => {
    const tri = ch.etapes.find((e) => e.id === "ranger") as EtapeTri;
    expect(tri.categories).toBe(AXES_DU_TABLEAU);
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, x.categorie]))).toEqual({
      "Réalisation de l'objectif : 90,5 %": "vendre",
      "Évolution du trafic sur janvier N − 1 : −7,5 %": "vendre",
      "Taux de transformation : 24,6 %": "vendre",
      "Panier moyen : 92,25 €": "vendre",
      "Indice de vente : 1,61": "vendre",
      "Taux de service : 98,5 %": "stock",
      "Taux de marque : 56,2 %": "rentabilite",
      "Indice de sécurité : 30,6 %": "rentabilite",
      "Part du personnel dans le chiffre d'affaires : 16,4 %": "equipe",
      "Durée moyenne de stockage : 15 jours": "stock",
      "Chiffre d'affaires par heure payée : 122,31 €": "equipe",
    });
  });

  it("le curseur du trafic qui manque : 4 039 entrées, moins que janvier N − 1", () => {
    expect(ENTREES_DU_CURSEUR).toEqual({ min: 3_500, max: 4_500 });
    const attendu = Math.ceil(cible / caParEntree);
    expect(attendu).toBe(4_039);
    expect(curseur(ch, "le-trafic-qui-manque")).toEqual({
      attendu,
      bornes: [3_500, 4_500],
      droites: [3_500 * caParEntree, cible, 4_500 * caParEntree, cible].map(centime),
      lecture: {
        "Chiffre d'affaires du mois": centime(attendu * caParEntree),
        "95 % de l'objectif": centime(cible),
        "Chiffre d'affaires de janvier N − 1": n1.chiffreDAffaires,
        "Marge sur le seuil du voyant": centime(centime(attendu * caParEntree) - centime(cible)),
      },
    });
    expect(juste(ch, "predire-le-trafic")).toBe("Moins d'entrées qu'en janvier N − 1 (4 160)");
  });

  it("les étapes autonomes : les ratios, le voyant qui explique, la transformation qui éteint", () => {
    expect(attendus(ch, "les-ratios")).toEqual({
      "Taux de transformation de janvier N (%)": dixieme((tickets / entrees) * 100),
      "Taux de transformation de janvier N − 1 (%)": dixieme((n1.tickets / n1.trafic) * 100),
      "Panier moyen de janvier N": centime(panier),
      "Panier moyen de janvier N − 1": n1.chiffreDAffaires / n1.tickets,
    });
    expect(Object.values(attendus(ch, "les-ratios"))).toEqual([24.6, 24, 92.25, 89.6]);
    expect(juste(ch, "le-voyant-rouge")).toBe("Le trafic : il faut faire venir, ceux qui entrent achètent mieux");
    expect(juste(ch, "predire-sans-trafic")).toBe("D'environ 5 %, ce qui manque au chiffre d'affaires");
    const passages = Math.ceil(cible / panier);
    expect(attendus(ch, "la-transformation-qui-eteint")).toEqual({
      "Chiffre d'affaires du seuil du voyant": centime(cible),
      "Passages en caisse nécessaires": passages,
      "Taux de transformation nécessaire (%)": dixieme((passages / entrees) * 100),
    });
    expect([centime(cible), passages, dixieme((passages / entrees) * 100)]).toEqual([91_785.84, 996, 25.9]);
  });

  it("le laboratoire des voyants : +5 % de transformation éteint l'objectif, le trafic reste rouge", () => {
    expect(LEVIERS_DES_VOYANTS).toEqual({ min: 80, max: 120, pas: 0.5 });
    const l = laboratoire(ch, "le-laboratoire-des-voyants");
    expect(l.depart).toEqual({ trafic: 100, transformation: 100, panier: 100 });
    expect(l.solution).toEqual({ trafic: 100, transformation: 105, panier: 100 });
    expect(l.reussi).toEqual([false, true]);
    const lire = (k: number, voyants: number) => ({
      Entrées: entrees,
      "Taux de transformation": centime((tickets / entrees) * k * 100),
      "Passages en caisse": dixieme(tickets * k),
      "Panier moyen": centime(panier),
      "Chiffre d'affaires": centime(ca * k),
      "Réalisation de l'objectif": centime(((ca * k) / objectif) * 100),
      "Écart à l'objectif": centime(centime(ca * k) - objectif),
      "Écart sur janvier N − 1": centime(centime(ca * k) - n1.chiffreDAffaires),
      "Voyants allumés": voyants,
    });
    expect(l.auDepart).toEqual(lire(1, 2));
    expect(l.aLaSolution).toEqual(lire(1.05, 1));
    expect(Object.values(lire(1.05, 1))).toEqual([3_848, 25.87, 995.4, 92.25, 91_822.5, 95.04, -4_794.17, 2_222.5, 1]);
    // Un demi-point de moins ne suffit pas ; le panier fait aussi bien ; un client de plus est interdit.
    expect(l.atteint({ trafic: 100, transformation: 104.5, panier: 100 })).toBe(false);
    expect(l.atteint({ trafic: 100, transformation: 100, panier: 105 })).toBe(true);
    expect(l.atteint({ trafic: 102.5, transformation: 102.5, panier: 100 })).toBe(false);
    expect(l.atteint({ trafic: 100, transformation: 102.5, panier: 102.5 })).toBe(true);
  });

  it("le graphique des voyants : la réalisation en droite, l'indice de sécurité et la part du personnel en courbe", () => {
    const g = laboratoire(ch, "le-laboratoire-des-voyants").e.graphique!(cas);
    expect(g.levier).toBe("transformation");
    const [realisation, securite, part] = g.courbes;
    for (const k of [80, 100, 105, 120]) {
      const p = { trafic: 100, transformation: k, panier: 100 };
      const chiffre = centime((ca * k) / 100);
      expect(realisation!.valeur(p), `${k}`).toBe(centime((chiffre / objectif) * 100));
      expect(securite!.valeur(p), `${k}`).toBe(centime(((chiffre - seuil) / chiffre) * 100));
      expect(part!.valeur(p), `${k}`).toBe(centime((paie / chiffre) * 100));
    }
    expect([80, 100, 120].map((k) => part!.valeur({ trafic: 100, transformation: k, panier: 100 }))).toEqual([20.5, 16.4, 13.67]);
  });

  it("les étapes d'expert : l'écart décomposé, février à rebours, la critique de l'objectif", () => {
    const effetTrafic = centime((entrees - n1.trafic) * (n1.chiffreDAffaires / n1.trafic));
    const effetTransformation = centime((tickets - (entrees * n1.tickets) / n1.trafic) * (n1.chiffreDAffaires / n1.tickets));
    const effetPanier = centime(ca - tickets * (n1.chiffreDAffaires / n1.tickets));
    expect(attendus(ch, "decomposer-l-ecart")).toEqual({ "Effet du trafic": effetTrafic, "Effet de la transformation": effetTransformation, "Effet du panier": effetPanier });
    expect([effetTrafic, effetTransformation, effetPanier]).toEqual([-6_720, 2_060.8, 2_509.2]);
    expect(centime(effetTrafic + effetTransformation + effetPanier)).toBe(ca - n1.chiffreDAffaires);

    expect(FEVRIER_A_REBOURS).toEqual({ realisation: 0.97, entrees: 3_700, transformation: 0.25 });
    const caFevrier = centime(objectif * 0.97);
    expect(attendus(ch, "a-rebours")).toEqual({
      "Chiffre d'affaires de février": caFevrier,
      "Passages en caisse de février": 3_700 * 0.25,
      "Panier moyen de février": centime(caFevrier / 925),
    });
    expect([caFevrier, centime(caFevrier / 925)]).toEqual([93_718.17, 101.32]);
    expect(juste(ch, "critique-de-l-objectif")).toBe("Il dit vrai sur l'écart, mais un tiers par mois suppose trois mois égaux : l'objectif se répartit selon la saison");
  });

  it("le cas : le trafic doit revenir, la transformation seule ne rattrape pas le trimestre", () => {
    const s = LE_TRIMESTRE_FACE_A_L_OBJECTIF;
    casDedie(s, ch);
    expect(s.code).toBe("le-trimestre-face-a-l-objectif");
    expect(s.titre).toBe("Janvier face à l'objectif");
    expect(attendus(s, "l-objectif")).toEqual({ "Objectif de janvier": objectif, "Écart à l'objectif": -9_166.67, "Taux de réalisation (%)": 90.5 });
    expect(attendus(s, "ce-qui-explique")).toEqual({ "Effet du trafic": -6_720, "Effet de la transformation": 2_060.8, "Effet du panier": 2_509.2 });
    expect(MOIS_RESTANTS).toBe(2);
    const reste = budget - ca;
    const parMois = reste / 2;
    expect(attendus(s, "ce-qui-reste-a-faire")).toEqual({
      "Reste à faire sur le trimestre": reste,
      "Chiffre d'affaires par mois": parMois,
      "Taux de transformation nécessaire (%)": dixieme((parMois / (entrees * panier)) * 100),
    });
    expect([reste, parMois, dixieme((parMois / (entrees * panier)) * 100)]).toEqual([202_400, 101_200, 28.5]);
    const attendu = Math.ceil(parMois / caParEntree);
    expect(attendu).toBe(4_454);
    expect(curseur(s, "le-trafic-du-rattrapage")).toEqual({
      attendu,
      bornes: [3_800, 4_800],
      droites: [3_800 * caParEntree, parMois, 4_800 * caParEntree, parMois].map(centime),
      lecture: {
        "Chiffre d'affaires du mois": centime(attendu * caParEntree),
        "Part du reste du budget": parMois,
        "Chiffre d'affaires de janvier N − 1": n1.chiffreDAffaires,
        "Avance sur la part du budget": centime(centime(attendu * caParEntree) - parMois),
      },
    });
    expect(janvierFaceALObjectif(cas).verdict).toBe("le-trafic-doit-revenir");
    expect(juste(s, "reponse")).toBe("Manqué à 90,5 % par le trafic : il faut faire revenir des clients");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LE_TRIMESTRE_FACE_A_L_OBJECTIF));
});
