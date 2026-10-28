import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { TABLEAU_DE_BORD_COMMERCIAL } from "../../src/config/cours/chapitres/tableau-de-bord-commercial";
import { ATLAS_CONSEIL } from "../../src/config/cours/monde/atlas-conseil";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { L_OBJECTIF_DE_TAUX_DE_SERVICE, TAUX_DE_SERVICE_VISE, objectifDeService } from "../../src/config/cours/situations/par-chapitre/l-objectif-de-taux-de-service";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE TABLEAU DE BORD COMMERCIAL, AU CABINET DU MONDE DU COURS, ET SON CAS : L'OBJECTIF DE TAUX DE
 * SERVICE.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche du cabinet (monde/atlas-conseil.ts),
 * sans les fonctions du chapitre ni le modèle (monde/relation-client.ts) : les trimestres du cabinet et
 * de ses 3 commerciaux, en N et en N − 1, le taux de transformation des devis, le panier, la
 * réalisation de l'objectif, le seuil de rentabilité d'un commercial (sans et avec commission), les
 * voyants, et le taux de service du cas. Les curseurs (attendu, position voisine, droites aux bornes,
 * lecture), le laboratoire (au départ et à la solution) et les verdicts sont épinglés. Puis les gardes
 * de texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts). Le test ne dépend plus de
 * negocier-le-prix.
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "conseil";
const cas = casDeLEntreprise(code);
const f = ATLAS_CONSEIL;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const dixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

// La fiche, refaite à la main.
const commercial = (k: string) => f.commerciaux.find((x) => x.code === k)!;
const marc = commercial("grands-comptes");
const nadia = commercial("entreprises");
const hugo = commercial("conquete");
const comptesDe = (k: string) => f.comptes.filter((c) => c.commercial === k);
const tauxDeMarge = (k: string) => somme(comptesDe(k).map((c) => c.marge)) / somme(comptesDe(k).map((c) => c.chiffreDAffaires));
const cout = (k: typeof marc) => k.salaireCharge + k.frais;
const seuil = (k: typeof marc, commission = 0) => cout(k) / (tauxDeMarge(k.code) - commission);
const caN = [0, 1, 2, 3].map((i) => somme(f.commerciaux.map((k) => k.n[i]!.chiffreDAffaires)));
const caN1 = [0, 1, 2, 3].map((i) => somme(f.commerciaux.map((k) => k.nMoins1[i]!.chiffreDAffaires)));
const capacite = f.consultants.nombre * f.consultants.joursFacturablesParTrimestre;

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
      const ra = e.rates?.(c);
      return [e.titre, e.question(c), ...e.explication(c), ...e.lecture(c, k.attendu).map((l) => l.libelle), ...e.droites(c).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", ra?.dessous ?? "", ra?.dessus ?? "", e.montrer ?? ""];
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|vingt|trente|cent) (comptes?|journées?|trimestres?|années?|ans|devis|contrats?|commerciaux|consultants?|points?|canaux|partenaires)\b/i);
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
  return { e, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)], atteint: d.atteint };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

describe("le tableau de bord commercial, au cabinet du monde du cours", () => {
  const ch = TABLEAU_DE_BORD_COMMERCIAL;

  it("se joue chez ATLAS CONSEIL seule, au palier 4 du BTS NDRC", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(L_OBJECTIF_DE_TAUX_DE_SERVICE);
    expect(ch.parcours).toBe("ndrc");
    expect(ch.palier).toBe(4);
    expect(ch.entreprises?.codes).toEqual(["conseil"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.blocs).toEqual(["BTS NDRC Bloc 1 · Relation client et négociation-vente"]);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    // La part de marché et la demande adressée de l'arène ont disparu.
    expect(ch.etapes.map((e) => e.id)).not.toContain("part-de-marche");
  });

  it("la fiche donne les chiffres de la consigne : le cabinet, les commerciaux, leurs seuils", () => {
    expect(caN).toEqual([344_000, 366_200, 237_440, 434_760]);
    expect(caN1).toEqual([354_000, 371_000, 223_000, 410_000]);
    expect([somme(caN), somme(caN1), dixieme((somme(caN) / somme(caN1) - 1) * 100)]).toEqual([1_382_400, 1_358_000, 1.8]);
    expect(caN.map((x, i) => dixieme((x / caN1[i]! - 1) * 100))).toEqual([-2.8, -1.3, 6.5, 6]);
    expect([tauxDeMarge("grands-comptes"), tauxDeMarge("conquete"), dixieme(tauxDeMarge("entreprises") * 100)]).toEqual([0.4, 0.5, 58.1]);
    expect([cout(marc), cout(nadia), cout(hugo)]).toEqual([18_000, 16_500, 12_000]);
    expect([seuil(marc), centime(seuil(nadia)), seuil(hugo)]).toEqual([45_000, 28_400.19, 24_000]);
    expect([centime(seuil(hugo, 0.1)), centime(seuil(marc, 0.1))]).toEqual([30_000, 60_000]);
  });

  it("les étapes guidées : l'année du cabinet, et les indicateurs de Marc au T1", () => {
    expect(attendus(ch, "le-cabinet")).toEqual({
      "Chiffre d'affaires du cabinet en N": 1_382_400,
      "Chiffre d'affaires du cabinet en N − 1": 1_358_000,
      "Évolution de l'année sur N − 1 (%)": 1.8,
      "Taux de service du dernier trimestre (%)": dixieme((f.journeesVendues[3]! / f.journeesDemandees[3]!) * 100),
    });
    expect(dixieme((600 / 680) * 100)).toBe(88.2);
    const q = marc.n[0]!;
    expect(attendus(ch, "les-indicateurs-de-marc")).toEqual({
      "Taux de transformation des devis (%)": dixieme((q.contrats / q.devis) * 100),
      "Panier moyen": q.chiffreDAffaires / q.contrats,
      "Réalisation de l'objectif (%)": dixieme((q.chiffreDAffaires / q.objectif) * 100),
      "Évolution sur N − 1 (%)": dixieme((q.chiffreDAffaires / marc.nMoins1[0]!.chiffreDAffaires - 1) * 100),
    });
    expect([dixieme((q.contrats / q.devis) * 100), q.chiffreDAffaires / q.contrats, dixieme((q.chiffreDAffaires / q.objectif) * 100), dixieme((176_000 / 168_000 - 1) * 100)]).toEqual([32, 22_000, 100.6, 4.8]);
  });

  it("le trimestre qui décroche est le T3 : la saison, pas les commerciaux", () => {
    // La plus forte baisse d'un trimestre au suivant : du T2 au T3, 128 760 €.
    expect(caN[1]! - caN[2]!).toBe(128_760);
    expect(f.journeesDemandees[2]).toBe(f.journeesVendues[2]);
    expect(juste(ch, "le-trimestre-qui-decroche")).toBe("C'est la saison : face au T3 de N − 1, il progresse de 6,5 %");
  });

  it("le pari et le curseur du seuil : 24 000 € pour Hugo, le double de son coût", () => {
    expect(juste(ch, "predire-le-seuil")).toBe("Plus que son coût : seule la marge de ses affaires le paie");
    expect(curseur(ch, "le-seuil-au-curseur")).toEqual({
      attendu: 24,
      bornes: [0, 60],
      droites: [0, 12_000, 60_000 * 0.5, 12_000],
      lecture: { "Chiffre d'affaires du trimestre": 24_000, "Marge de ses affaires": 12_000, "Coût du commercial": 12_000, "Résultat du commercial": 0 },
    });
    expect(attendus(ch, "le-seuil-d-hugo")).toEqual({
      "Taux de marge de ses comptes (%)": 50,
      "Coût du commercial, par trimestre": hugo.salaireCharge + hugo.frais,
      "Seuil de rentabilité du trimestre": 24_000,
      "Seuil de rentabilité de l'année": 96_000,
    });
    expect(attendus(ch, "les-seuils-de-marc-et-de-nadia")).toEqual({
      "Taux de marge des comptes de Marc (%)": 40,
      "Seuil de rentabilité de Marc, par trimestre": 45_000,
      "Taux de marge des comptes de Nadia (%)": 58.1,
      "Seuil de rentabilité de Nadia, par trimestre": centime(seuil(nadia)),
    });
    // Tous deux passent leur seuil à chaque trimestre, même au plus bas.
    expect(Math.min(...marc.n.map((q) => q.chiffreDAffaires))).toBeGreaterThan(seuil(marc));
    expect(Math.min(...nadia.n.map((q) => q.chiffreDAffaires))).toBeGreaterThan(seuil(nadia));
  });

  it("la transformation : le pari des 5 points, le laboratoire d'Hugo avec commission, puis ce qu'il lui manquait", () => {
    expect(juste(ch, "predire-la-transformation")).toBe("25 % : 5 points sur 20 %, c'est 25 % de plus");
    expect((10 * 0.25 * 6_000) / (10 * 0.2 * 6_000) - 1).toBeCloseTo(0.25, 12);
    const l = laboratoire(ch, "le-laboratoire-d-hugo");
    expect(l.depart).toEqual({ devis: 10, taux: 20, panier: 6_000, remuneration: 0 });
    expect(l.solution).toEqual({ devis: 10, taux: 30, panier: 10_000, remuneration: 10 });
    expect(l.reussi).toEqual([false, true]);
    // Sans la commission, la même position réussirait sans relever le défi ; avec 11 devis, non plus.
    expect(l.atteint({ ...l.solution, remuneration: 0 })).toBe(false);
    expect(l.atteint({ ...l.solution, devis: 11 })).toBe(false);
    expect(l.atteint({ ...l.solution, panier: 9_500 })).toBe(false);
    expect(l.atteint({ devis: 10, taux: 25, panier: 12_000, remuneration: 10 })).toBe(true);
    // À la main : contrats = devis × taux ; chiffre d'affaires = contrats × panier ; marge à 50 % ; commission ;
    // seuil = 12 000 ÷ (50 % − commission) ; voyants face à 15 000 € d'objectif et 36 000 € de N − 1.
    const lire = (devis: number, taux: number, panier: number, r: number) => {
      const ventes = devis * (taux / 100) * panier;
      const s = 12_000 / (0.5 - r);
      const voyants = [ventes / 15_000 < 0.95, taux / 100 < 0.25, ventes / 36_000 - 1 < -0.05, ventes < s].filter(Boolean).length;
      return {
        "Contrats signés": centime(devis * (taux / 100)),
        "Chiffre d'affaires du trimestre": centime(ventes),
        "Marge de ses affaires": centime(ventes * 0.5),
        "Commission versée": centime(ventes * r),
        "Seuil de rentabilité du commercial": centime(s),
        "Réalisation de l'objectif": dixieme((ventes / 15_000) * 100),
        "Voyants allumés": voyants,
        "Résultat du commercial": centime(ventes * 0.5 - ventes * r - 12_000),
      };
    };
    expect(l.auDepart).toEqual(lire(10, 20, 6_000, 0));
    expect(l.aLaSolution).toEqual(lire(10, 30, 10_000, 0.1));
    expect(Object.values(l.aLaSolution)).toEqual([3, 30_000, 15_000, 3_000, 30_000, 200, 1, 0]);
    const h = hugo.n[0]!;
    expect(attendus(ch, "la-transformation-d-hugo")).toEqual({
      "Taux de transformation des devis (%)": 20,
      "Panier moyen": h.chiffreDAffaires / h.contrats,
      "Contrats nécessaires pour le seuil": Math.ceil(24_000 / (h.chiffreDAffaires / h.contrats)),
      "Devis nécessaires pour ces contrats": Math.ceil(4 / (h.contrats / h.devis)),
    });
    expect([h.chiffreDAffaires / h.contrats, Math.ceil(24_000 / 6_000), Math.ceil(4 / 0.2)]).toEqual([6_000, 4, 20]);
  });

  it("Nadia : l'objectif tenu cachait la transformation, 18 devis de trop au T4", () => {
    expect(nadia.n.map((q) => dixieme((q.chiffreDAffaires / q.objectif) * 100))).toEqual([100.6, 100.8, 99.8, 99.7]);
    expect(nadia.n.map((q, i) => dixieme((q.chiffreDAffaires / nadia.nMoins1[i]!.chiffreDAffaires - 1) * 100))).toEqual([4, 4, 4.2, 4.3]);
    expect(juste(ch, "predire-nadia")).toBe("Non : elle transforme de moins en moins de devis");
    const q4 = nadia.n[3]!;
    const panier = q4.chiffreDAffaires / q4.contrats;
    const tauxN1 = nadia.nMoins1[3]!.contrats / nadia.nMoins1[3]!.devis;
    expect([panier, tauxN1]).toEqual([13_800, 0.35]);
    const devis = Math.ceil(q4.objectif / (tauxN1 * panier));
    expect(devis).toBe(38);
    expect(curseur(ch, "les-devis-de-nadia")).toEqual({
      attendu: 38,
      bornes: [20, 60],
      droites: [centime(20 * tauxN1 * panier), 180_000, centime(60 * tauxN1 * panier), 180_000],
      lecture: { "Chiffre d'affaires au taux de N − 1": centime(38 * tauxN1 * panier), "Objectif du trimestre": 180_000, "Écart à l'objectif": centime(38 * tauxN1 * panier - 180_000) },
    });
    expect(centime(38 * tauxN1 * panier)).toBe(183_540);
    const n3 = nadia.n[2]!;
    expect(attendus(ch, "les-voyants-de-nadia")).toEqual({
      "Taux de transformation au T3 (%)": dixieme((n3.contrats / n3.devis) * 100),
      "Taux de transformation au T4 (%)": dixieme((q4.contrats / q4.devis) * 100),
      "Taux de transformation au T4 de N − 1 (%)": dixieme(tauxN1 * 100),
      "Devis remis en trop au T4": q4.devis - devis,
    });
    expect([dixieme((n3.contrats / n3.devis) * 100), dixieme((q4.contrats / q4.devis) * 100)]).toEqual([22.2, 23.2]);
    // Les voyants de la transformation s'allument aux T3 et T4, sous 25 %, et celui de l'objectif jamais (au-dessus de 95 %).
    expect(nadia.n.map((q) => q.contrats / q.devis < f.seuilsDAlerte.tauxDeTransformation.seuil)).toEqual([false, false, true, true]);
    expect(nadia.n.some((q) => q.chiffreDAffaires / q.objectif < f.seuilsDAlerte.realisationDeLObjectif.seuil)).toBe(false);
    expect(q4.devis - devis).toBe(18);
    const tri = ch.etapes.find((e) => e.id === "ranger") as EtapeTri;
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      "Rendez-vous": [68, "activite"],
      "Devis remis": [56, "activite"],
      "Taux de transformation des devis (%)": [23.2, "efficacite"],
      "Panier moyen": [13_800, "efficacite"],
      "Réalisation de l'objectif (%)": [99.7, "resultat"],
      "Résultat du commercial": [centime(179_400 * tauxDeMarge("entreprises") - 16_500), "resultat"],
    });
  });

  it("les étapes d'expert : Hugo trimestre après trimestre, la commission pour tous, ce qu'un voyant ne dit pas", () => {
    const resultats = hugo.n.map((q) => q.chiffreDAffaires * 0.5 - cout(hugo));
    expect(resultats).toEqual([-6_000, -1_500, 4_500, 15_000]);
    expect(attendus(ch, "les-trimestres-d-hugo")).toEqual({
      "Résultat du commercial au T1": -6_000,
      "Résultat du commercial au T2": -1_500,
      "Résultat du commercial au T3": 4_500,
      "Résultat du commercial au T4": 15_000,
      "Résultat du commercial sur l'année": somme(hugo.n.map((q) => q.chiffreDAffaires)) * 0.5 - 4 * cout(hugo),
    });
    expect(somme(hugo.n.map((q) => q.chiffreDAffaires)) * 0.5 - 4 * cout(hugo)).toBe(12_000);
    expect(attendus(ch, "la-commission-pour-tous")).toEqual({
      "Seuil d'Hugo par trimestre, avec la commission": 30_000,
      "Commission d'Hugo sur l'année": 120_000 * 0.1,
      "Seuil d'Hugo sur l'année, avec la commission": 120_000,
      "Seuil de Marc par trimestre, avec la commission": 60_000,
    });
    // Avec la commission, Hugo signe pile son seuil de l'année : 120 000 × (50 % − 10 %) − 48 000 = 0.
    expect(120_000 * (0.5 - 0.1) - 48_000).toBeCloseTo(0, 9);
    // Les voyants de N, à la main, sur les seuils d'alerte de la fiche (sans commission).
    const voyants = (k: typeof marc) =>
      k.n.map((q, i) =>
        [
          q.chiffreDAffaires / q.objectif < 0.95 ? "objectif" : "",
          q.contrats / q.devis < 0.25 ? "transformation" : "",
          q.chiffreDAffaires / k.nMoins1[i]!.chiffreDAffaires - 1 < -0.05 ? "évolution" : "",
          q.chiffreDAffaires < seuil(k) ? "seuil" : "",
        ].filter(Boolean),
      );
    expect(voyants(marc)).toEqual([[], [], [], []]);
    expect(voyants(nadia)).toEqual([[], [], ["transformation"], ["transformation"]]);
    expect(voyants(hugo)).toEqual([["objectif", "transformation", "évolution", "seuil"], ["objectif", "évolution", "seuil"], [], []]);
    const question = (ch.etapes.find((e) => e.id === "juger-hugo") as EtapeChoix).question(cas, etatVide);
    expect(question).toContain("4 voyants d'Hugo étaient allumés : l'objectif, la transformation, l'évolution sur N − 1 et le seuil.");
    expect(juste(ch, "juger-hugo")).toBe("Non : sur l'année, il signe 120 000 € pour un seuil de 96 000 €");
  });

  it("la synthèse finit sur l'arène", () => {
    const s = ch.etapes.find((e) => e.id === "synthese");
    if (s?.type !== "lecture") throw new Error("Pas de synthèse");
    expect(s.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("l'objectif de taux de service : 90 % au trimestre plein demande un consultant qui ne se paie pas", () => {
  const s = L_OBJECTIF_DE_TAUX_DE_SERVICE;
  const ch = TABLEAU_DE_BORD_COMMERCIAL;
  const demandees = f.journeesDemandees[3]!;
  const vendues = f.journeesVendues[3]!;
  const marge = f.prixDesJourneesDeplacees - (f.coutVariableDUneJournee.fraisDeMission + f.coutVariableDUneJournee.supports);
  const visees = Math.ceil(demandees * TAUX_DE_SERVICE_VISE - 1e-9);

  it("est le cas dédié du chapitre, à la même entreprise", () => {
    casDedie(s, ch);
    expect(s.code).toBe("l-objectif-de-taux-de-service");
    expect(TAUX_DE_SERVICE_VISE).toBe(0.9);
  });

  it("le taux de service, refait à la main : 96 % sur l'année, 88,2 % au T4", () => {
    expect(attendus(s, "le-service")).toEqual({
      "Taux de service de l'année (%)": dixieme((somme(f.journeesVendues) / somme(f.journeesDemandees)) * 100),
      "Taux de service du T4 (%)": dixieme((vendues / demandees) * 100),
      "Journées refusées au T4": demandees - vendues,
    });
    expect([somme(f.journeesVendues), somme(f.journeesDemandees), demandees - vendues]).toEqual([1_920, 2_000, 80]);
  });

  it("l'objectif, à rebours : 612 journées, 12 de plus que la capacité", () => {
    expect(attendus(s, "l-objectif")).toEqual({ "Journées à vendre": visees, "Journées au-delà de la capacité": visees - capacite, "Taux d'occupation demandé (%)": dixieme((visees / capacite) * 100) });
    expect([visees, visees - capacite, dixieme((visees / capacite) * 100)]).toEqual([612, 12, 102]);
  });

  it("ce que vaut l'objectif face à un consultant, et le curseur à 82 journées", () => {
    const servies = Math.min(demandees - vendues, f.consultants.joursFacturablesParTrimestre);
    expect(attendus(s, "la-valeur")).toEqual({
      "Marge sur coût variable d'une journée refusée": marge,
      "Marge des journées qui manquent pour l'objectif": (visees - capacite) * marge,
      "Marge des journées refusées qu'un consultant de plus servirait": servies * marge,
      "Ce que rapporterait un consultant de plus, son coût payé": servies * marge - f.consultants.coutAnnuel,
    });
    expect([marge, (visees - capacite) * marge, servies * marge, servies * marge - f.consultants.coutAnnuel]).toEqual([650, 7_800, 39_000, -13_800]);
    const j = Math.ceil(f.consultants.coutAnnuel / marge);
    expect(j).toBe(82);
    expect(curseur(s, "le-consultant-au-curseur")).toEqual({
      attendu: j,
      bornes: [0, 120],
      droites: [0, 52_800, 120 * marge, 52_800],
      lecture: { "Marge des journées servies": j * marge, "Coût du consultant": 52_800, "Ce que le consultant rapporte": j * marge - 52_800 },
    });
    // Le consultant devrait servir plus de journées que le T4 n'en a refusé, et plus qu'il n'en peut faire.
    expect(j).toBeGreaterThan(demandees - vendues);
    expect(j).toBeGreaterThan(f.consultants.joursFacturablesParTrimestre);
  });

  it("le verdict : ne pas recruter pour cet objectif", () => {
    expect(objectifDeService(cas).recruter).toBe(false);
    expect(juste(s, "reponse")).toBe("Ne pas recruter : 52 800 € pour 7 800 € de marge");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
