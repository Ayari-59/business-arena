import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  BAISSE_DE_PRIX,
  BAISSE_DES_VENTES_DU_LEVIER,
  DEMANDE_AU_DELA_DU_PALIER,
  SEUIL_DE_RENTABILITE,
  SUPPLEMENT_DU_PALIER,
} from "../../src/config/cours/chapitres/seuil-de-rentabilite";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { HAUSSE_DU_LOYER, LE_LOYER_QUI_AUGMENTE, loyerQuiAugmente } from "../../src/config/cours/situations/par-chapitre/le-loyer-qui-augmente";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE SEUIL DE RENTABILITÉ, AU MOIS DE JANVIER DE NOVA DANS LE MONDE DU COURS, ET SON CAS : LE LOYER
 * QUI AUGMENTE.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de gestion (monde/nova-gestion.ts),
 * sans les fonctions du chapitre ni le modèle (monde/couts-et-budgets.ts) ; les valeurs absolues sont
 * épinglées, les variantes (baisse de prix, levier, gamme, paliers, loyer) refaites comme le reste,
 * chaque curseur à son attendu, à sa position voisine, à ses bornes et dans sa lecture, le laboratoire
 * au départ et à la solution, avec les courbes de son graphique, et les verdicts aussi. Puis les
 * gardes de texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "nova";
const cas = casDeLEntreprise(code);
const f = NOVA_GESTION;
const mois = f.moisDeReference;
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const n = (x: number) => x.toLocaleString("fr-FR");

// La fiche, refaite à la main.
const q = mois.quantite;
const p = mois.prix;
const cv = mois.coutVariable.composants + mois.coutVariable.autres;
const cf = mois.chargesFixes.loyer + mois.chargesFixes.personnel + mois.chargesFixes.amortissement;
const mu = p - cv;
const ca = q * p;
const mcv = q * mu;
const resultat = mcv - cf;
const seuilValeur = c((cf * p) / mu);

function textesDe(e: Etape, x: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(x);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(x), e.repere?.(x) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(x, etat), ...e.options(x, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(x, etat), ...e.champs(x, etat).flatMap((y) => [y.libelle, y.calcul, String(y.attendu)]), ...e.explication(x, etat), ...tableau];
    case "tri":
      return [e.titre, e.question(x), ...e.categories.map((k) => k.libelle), ...e.elements(x).flatMap((y) => [y.libelle, y.pourquoi]), ...e.explication(x), ...tableau];
    case "curseur": {
      const k = e.cible(x);
      const g = e.grandeur?.(x);
      const r = e.rates?.(x);
      return [e.titre, e.question(x), ...e.explication(x), ...e.lecture(x, k.attendu).map((l) => l.libelle), ...e.droites(x).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(x);
      const depart = Object.fromEntries(e.leviers(x).map((l) => [l.code, l.depart]));
      const graphique = e.graphique?.(x);
      return [
        e.titre,
        e.question(x),
        d.consigne,
        d.indice(depart),
        ...e.explication(x, d.solution),
        ...e.lecture(x, d.solution).map((l) => l.libelle),
        ...e.leviers(x).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((y) => y.libelle)]),
        ...(graphique?.courbes ?? []).map((y) => y.libelle),
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|Nomade|Salon)\b/i);
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
    for (const no of e.notions ?? []) expect(notions.has(no), `${e.id} : ${no}`).toBe(true);
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
  const couvre = (x: number) => d.produit(x) >= d.cout(x);
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(c),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

/** Un laboratoire : sa lecture au départ et à la solution, par libellé. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (x: Record<string, number>) => Object.fromEntries(e.lecture(cas, x).map((l) => [l.libelle, l.montant]));
  return { e, d, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

describe("le seuil de rentabilité, au mois de janvier de NOVA", () => {
  const ch = SEUIL_DE_RENTABILITE;

  it("se joue chez NOVA seule, au palier 2 du contrôle de gestion, réservé, avec ses blocs", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.palier).toBe(2);
    // Le chapitre pilote, seul libre, est le premier du registre : ce n'est pas celui-ci.
    expect(CHAPITRES[0]!.code).not.toBe(ch.code);
    expect(ch.libre).toBe(false);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    for (const [b, ref] of [
      ["BTS CG P5 · Analyse et prévision de l'activité", "bts-cg"],
      ["DCG UE11 · Contrôle de gestion", "dcg"],
    ] as const) {
      expect(ch.blocs).toContain(b);
      expect(referentielDeCitation(b)?.code, b).toBe(ref);
      expect(blocOfficiel(b, ref), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(f.entreprise).toBe(cas.entreprise);
    expect(SITUATIONS).toContain(LE_LOYER_QUI_AUGMENTE);
  });

  it("le gabarit de l'étalon : deux paris, deux curseurs, un laboratoire, au moins deux étapes d'expert à trois champs", () => {
    expect(ch.etapes.filter((e) => e.type === "choix" && e.titre.startsWith("Pariez"))).toHaveLength(2);
    expect(ch.etapes.filter((e) => e.type === "curseur")).toHaveLength(2);
    expect(ch.etapes.filter((e) => e.type === "simulation")).toHaveLength(1);
    for (const id of ["baisse-de-prix", "le-levier-operationnel", "seuil-de-la-gamme", "charges-fixes-par-paliers"]) {
      expect(Object.keys(attendus(ch, id)).length, id).toBeGreaterThanOrEqual(3);
    }
    // Chaque pari vient avant son curseur, et chaque curseur avant sa formalisation.
    const place = (id: string) => ch.etapes.findIndex((e) => e.id === id);
    expect(place("predire-le-seuil")).toBeLessThan(place("simulation"));
    expect(place("simulation")).toBeLessThan(place("seuil"));
    expect(place("predire-les-fixes")).toBeLessThan(place("les-fixes-au-curseur"));
    expect(place("les-fixes-au-curseur")).toBeLessThan(place("les-fixes-tenables"));
  });

  it("la fiche donne les chiffres de janvier", () => {
    expect([q, p, cv, cf, mu]).toEqual([1_590, 59, 38, 31_183, 21]);
    expect([ca, q * cv, mcv, resultat]).toEqual([93_810, 60_420, 33_390, 2_207]);
    expect(seuilValeur).toBe(87_609.38);
  });

  it("le tri : les charges variables et fixes de janvier", () => {
    const tri = ch.etapes.find((e) => e.id === "classement") as EtapeTri;
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      "Composants consommés": [q * 22, "variable"],
      "Autres coûts par enceinte (emballage, transport et énergie de la chaîne)": [q * 16, "variable"],
      "Loyer du local": [19_700, "fixe"],
      "Personnel (salaires et cotisations)": [10_650, "fixe"],
      "Usure de la ligne de montage (amortissement)": [833, "fixe"],
    });
  });

  it("les étapes guidées : la marge, le compte de résultat différentiel, le seuil", () => {
    expect(attendus(ch, "marge-unitaire")).toEqual({
      "Coût variable unitaire": 38,
      "Marge sur coût variable unitaire": 21,
      "Taux de marge sur coût variable, en %": c((21 / 59) * 100),
    });
    expect(c((21 / 59) * 100)).toBe(35.59);
    expect(attendus(ch, "resultat-differentiel")).toEqual({
      "Chiffre d'affaires": 93_810,
      "Charges variables": 60_420,
      "Marge sur coût variable": 33_390,
      "Charges fixes": 31_183,
      Résultat: 2_207,
    });
    expect(attendus(ch, "seuil")).toEqual({ "En quantité (enceintes, arrondi à l'unité supérieure)": Math.ceil(cf / mu), "En valeur (chiffre d'affaires)": seuilValeur });
    expect(Math.ceil(cf / mu)).toBe(1_485);
    // Le défaut de l'audit : le calcul n'écrit plus « ÷ 35,6 % », qui donnerait 87 592,70 €.
    const e = ch.etapes.find((x) => x.id === "seuil") as EtapeMontants;
    expect(e.champs(cas, etatVide)[1]!.calcul).toBe("31 183 € ÷ (21 € ÷ 59 €) = 31 183 € × 59 € ÷ 21 € = 87 609,38 €");
    expect(c(cf / 0.356)).toBe(87_592.7);
    expect(Math.abs(87_592.7 - seuilValeur)).toBeLessThanOrEqual(e.champs(cas, etatVide)[1]!.tolerance!);
  });

  it("les étapes autonomes : la marge de sécurité, le point mort, les charges fixes tenables", () => {
    const marge = c(ca - seuilValeur);
    expect(attendus(ch, "securite")).toEqual({
      "Marge de sécurité": marge,
      "Indice de sécurité, en %": c((marge / ca) * 100),
      "Point mort, le jour du mois": Math.ceil((seuilValeur / ca) * 31),
    });
    expect([marge, c((marge / ca) * 100), Math.ceil((seuilValeur / ca) * 31)]).toEqual([6_200.62, 6.61, 29]);
    expect(attendus(ch, "les-fixes-tenables")).toEqual({
      "Charges fixes tenables": mcv,
      "Hausse tenable des charges fixes, en %": c(((mcv - cf) / cf) * 100),
      "Seuil en quantité à ce plafond": Math.ceil(mcv / mu),
    });
    expect([c(((mcv - cf) / cf) * 100), Math.ceil(mcv / mu)]).toEqual([7.08, q]);
  });

  it("les étapes d'expert : la baisse de prix, le levier opérationnel", () => {
    expect(BAISSE_DE_PRIX).toBe(0.1);
    const pb = c(p * 0.9);
    const mb = c(pb - cv);
    expect([pb, mb]).toEqual([53.1, 15.1]);
    expect(attendus(ch, "baisse-de-prix")).toEqual({
      "Nouvelle marge sur coût variable unitaire": mb,
      "Nouveau seuil en quantité (enceintes)": Math.ceil(cf / mb),
      "Ventes pour garder le résultat de janvier": Math.ceil((cf + resultat) / mb),
    });
    expect([Math.ceil(cf / mb), Math.ceil((cf + resultat) / mb)]).toEqual([2_066, 2_212]);
    expect(BAISSE_DES_VENTES_DU_LEVIER).toBe(0.05);
    const apres = c(mcv * 0.95 - cf);
    expect(attendus(ch, "le-levier-operationnel")).toEqual({
      "Levier opérationnel": c(mcv / resultat),
      "Résultat avec 5 % de ventes en moins": apres,
      "Variation du résultat, en %": c(((apres - resultat) / resultat) * 100),
    });
    expect([c(mcv / resultat), apres, c(((apres - resultat) / resultat) * 100)]).toEqual([15.13, 537.5, -75.65]);
    // Le levier, c'est l'inverse de l'indice de sécurité, et la variation du résultat, celle des ventes multipliée par le levier.
    expect((mcv / resultat) * ((ca - seuilValeur) / ca)).toBeCloseTo(1, 4);
    expect(-0.05 * (mcv / resultat)).toBeCloseTo((apres - resultat) / resultat, 9);
  });

  it("les étapes d'expert : le seuil de la gamme, refait à la main", () => {
    const g = f.gamme;
    const caG = g.references.reduce((t, r) => t + r.quantite * r.prix, 0);
    const cvG = g.references.reduce((t, r) => t + r.quantite * r.coutVariableUnitaire, 0);
    const pub = g.references.reduce((t, r) => t + r.publicite, 0);
    const communes = g.communes.loyer + g.communes.personnel + g.communes.entretien + g.communes.usure;
    expect([caG, cvG, pub, communes]).toEqual([195 * 34 + 1_160 * 59 + 217 * 129, 195 * 19 + 1_160 * 38 + 217 * 70, 373 + 1_233 + 393, 33_578]);
    expect([caG, cvG, pub]).toEqual([103_063, 62_975, 1_999]);
    const taux = (caG - cvG) / caG;
    const seuilG = c((communes + pub) / taux);
    expect(attendus(ch, "seuil-de-la-gamme")).toEqual({
      "Taux de marge moyen de la gamme, en %": c(taux * 100),
      "Seuil de rentabilité de la gamme": seuilG,
      "Indice de sécurité de la gamme, en %": c(((caG - seuilG) / caG) * 100),
    });
    expect([c(taux * 100), seuilG, c(((caG - seuilG) / caG) * 100)]).toEqual([38.9, 91_465.58, 11.25]);
    // One, la plus vendue, a le plus faible taux : la pousser fait monter le seuil.
    expect(juste(ch, "la-composition-de-la-gamme")).toBe("Il monte : NOVA One a le plus faible taux de marge, 35,6 %");
  });

  it("les étapes d'expert : les charges fixes par paliers, et le verdict du palier", () => {
    expect([SUPPLEMENT_DU_PALIER, DEMANDE_AU_DELA_DU_PALIER, f.centres.activiteNormale]).toEqual([15_000, 2_400, 2_120]);
    const cf2 = cf + 15_000;
    expect(attendus(ch, "charges-fixes-par-paliers")).toEqual({
      [`Résultat à ${n(2_120)} enceintes`]: 2_120 * mu - cf,
      [`Résultat à ${n(2_121)} enceintes`]: 2_121 * mu - cf2,
      "Second seuil de rentabilité": Math.ceil(cf2 / mu),
    });
    expect([2_120 * mu - cf, 2_121 * mu - cf2, Math.ceil(cf2 / mu)]).toEqual([13_337, -1_642, 2_200]);
    // À 2 400 enceintes, le résultat tombe à 4 217 € : il en faut plus de 2 834 pour faire mieux qu'à 2 120.
    expect(2_400 * mu - cf2).toBe(4_217);
    expect(Math.floor((13_337 + cf2) / mu)).toBe(2_834);
    expect(2_835 * mu - cf2).toBeGreaterThan(13_337);
    expect(2_834 * mu - cf2).toBeLessThanOrEqual(13_337);
    expect(juste(ch, "franchir-le-palier")).toBe(`Pas pour ${n(2_400)} : il faut plus de ${n(2_834)} enceintes pour gagner plus qu'à ${n(2_120)}`);
  });

  it("les verdicts des paris et des choix", () => {
    expect(juste(ch, "une-de-plus")).toBe("De 21 € : la marge sur coût variable unitaire.");
    expect(juste(ch, "predire-le-seuil")).toBe("Sous les ventes de janvier : la marge du mois couvre déjà les charges fixes");
    expect(juste(ch, "predire-les-fixes")).toBe(`De ${n(2_207)} €, le résultat de janvier`);
    expect(juste(ch, "leviers")).toBe("Gagner plus sur chaque vente, ou réduire ses charges fixes.");
    expect(juste(ch, "lire-le-levier")).toBe("C'est un signe de fragilité : l'entreprise travaille près de son seuil");
  });

  it("les curseurs, refaits à la main : le seuil sur les ventes, les charges fixes tenables", () => {
    // Le chiffre d'affaires 59 × v face au coût total 31 183 + 38 × v : ils se croisent à 31 183 ÷ 21.
    expect(curseur(ch, "simulation")).toEqual({
      attendu: 1_485,
      bornes: [0, 2_970],
      droites: [0, cf, 2_970 * p, cf + 2_970 * cv],
      lecture: { "Chiffre d'affaires": 1_485 * p, "Charges variables": 1_485 * cv, "Marge sur coût variable": 1_485 * mu, "Charges fixes": cf, Résultat: 1_485 * mu - cf },
    });
    expect(1_485 * mu - cf).toBe(2);
    // La marge de janvier, 33 390 €, face aux charges fixes x : la plus grande qui ne fait pas perdre.
    expect(curseur(ch, "les-fixes-au-curseur")).toEqual({
      attendu: mcv,
      bornes: [25_000, 40_000],
      droites: [mcv, 25_000, mcv, 40_000],
      lecture: { "Marge sur coût variable de janvier": mcv, "Charges fixes du mois": mcv, "Seuil en chiffre d'affaires": c((mcv * p) / mu), "Résultat du mois": 0 },
    });
    expect(c((mcv * p) / mu)).toBe(ca);
  });

  it("le laboratoire du seuil : baisser le prix de 10 % sans monter le seuil", () => {
    const l = laboratoire(ch, "le-laboratoire-du-seuil");
    expect(l.depart).toEqual({ prix: 59, coutVariable: 38, chargesFixes: cf, ventes: q });
    expect(l.solution).toEqual({ prix: 53.1, coutVariable: 32.1, chargesFixes: cf, ventes: q });
    expect(l.reussi).toEqual([false, true]);
    const lire = (prix: number, cvu: number, fixes: number, ventes: number) => {
      const m = c(prix - cvu);
      const sv = c((fixes * prix) / m);
      return {
        "Marge sur coût variable d'une enceinte": m,
        "Seuil de rentabilité": Math.ceil(fixes / m - 1e-9),
        "Seuil en chiffre d'affaires": sv,
        "Indice de sécurité": c(((ventes * prix - sv) / (ventes * prix)) * 100),
        "Résultat du mois": c(ventes * m - fixes),
      };
    };
    expect(l.auDepart).toEqual(lire(59, 38, cf, q));
    expect(Object.values(l.auDepart)).toEqual([21, 1_485, 87_609.38, 6.61, 2_207]);
    expect(l.aLaSolution).toEqual(lire(53.1, 32.1, cf, q));
    expect(Object.values(l.aLaSolution)).toEqual([21, 1_485, 78_848.44, 6.61, 2_207]);
    // Les deux chemins du défi : un coût variable d'au plus 32,10 €, ou des charges fixes d'au plus 22 423 €
    // (1 485 × 15,10 €, le seuil lu à l'unité supérieure ; 22 422,06 € pour le seuil exact).
    expect(Math.floor(1_485 * 15.1)).toBe(22_423);
    expect(l.d.atteint({ prix: 53.1, coutVariable: 38, chargesFixes: 22_423, ventes: q })).toBe(true);
    expect(l.d.atteint({ prix: 53.1, coutVariable: 38, chargesFixes: 22_424, ventes: q })).toBe(false);
    expect(l.d.atteint({ prix: 53.1, coutVariable: 32.2, chargesFixes: cf, ventes: q })).toBe(false);
    // Les ventes ne déplacent pas le seuil : à 2 500 enceintes, le défi n'est toujours pas relevé.
    expect(l.d.atteint({ prix: 53.1, coutVariable: 38, chargesFixes: cf, ventes: 2_500 })).toBe(false);
  });

  it("le graphique du laboratoire : le seuil selon le prix n'est pas une droite, les ventes sont plates", () => {
    const l = laboratoire(ch, "le-laboratoire-du-seuil");
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("prix");
    expect(g.unite).toBe("enceintes");
    const [seuil, ventes] = g.courbes;
    const au = (prix: number) => ({ ...l.depart, prix });
    expect(seuil!.valeur(au(59))).toBe(c(cf / 21));
    expect(seuil!.valeur(au(53.1))).toBe(c(cf / 15.1));
    expect(seuil!.valeur(au(45))).toBe(c(cf / 7));
    expect([c(cf / 21), c(cf / 15.1), c(cf / 7)]).toEqual([1_484.9, 2_065.1, 4_454.71]);
    // Pas une droite : entre 45 € et 59 €, la pente n'est pas celle d'entre 59 € et 70 €.
    expect((seuil!.valeur(au(59)) - seuil!.valeur(au(45))) / 14).not.toBeCloseTo((seuil!.valeur(au(70)) - seuil!.valeur(au(59))) / 11, 0);
    expect([ventes!.valeur(au(45)), ventes!.valeur(au(70))]).toEqual([q, q]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : le loyer qui augmente", () => {
  const s = LE_LOYER_QUI_AUGMENTE;
  const ch = SEUIL_DE_RENTABILITE;
  // La hausse ne touche que le loyer (le défaut de l'audit : elle s'appliquait aux 31 183 €).
  const loyer = c(mois.chargesFixes.loyer * 1.12);
  const cfn = loyer + mois.chargesFixes.personnel + mois.chargesFixes.amortissement;
  const svn = c((cfn * p) / mu);

  it("tient la forme d'un cas dédié", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le dirigeant");
    expect(HAUSSE_DU_LOYER).toBe(0.12);
    const demande = s.etapes[0]!;
    if (demande.type !== "lecture") throw new Error("lecture attendue");
    expect(demande.texte(cas)[0]).toContain("hausse de 12 % du loyer");
    expect(demande.texte(cas).join(" ")).not.toContain("de nos charges fixes au renouvellement");
  });

  it("le nouveau seuil et ce qui reste de sécurité, refaits à la main", () => {
    expect([loyer, cfn]).toEqual([22_064, 33_547]);
    expect(attendus(s, "seuil")).toEqual({
      "Charges fixes avec le nouveau loyer": cfn,
      "Seuil de rentabilité (enceintes)": Math.ceil(cfn / mu),
      "Seuil de rentabilité (chiffre d'affaires)": svn,
    });
    expect([Math.ceil(cfn / mu), svn]).toEqual([1_598, 94_251.1]);
    expect(attendus(s, "securite")).toEqual({
      "Résultat de janvier avec le nouveau loyer": mcv - cfn,
      "Marge de sécurité": c(ca - svn),
      "Indice de sécurité (%)": c(((ca - svn) / ca) * 100),
    });
    expect([mcv - cfn, c(ca - svn), c(((ca - svn) / ca) * 100)]).toEqual([-157, -441.1, -0.47]);
  });

  it("le curseur du loyer et le calcul à rebours", () => {
    const autres = mois.chargesFixes.personnel + mois.chargesFixes.amortissement;
    const maximal = mcv - autres;
    expect(maximal).toBe(21_907);
    expect(curseur(s, "le-loyer-au-curseur")).toEqual({
      attendu: maximal,
      bornes: [18_000, 24_000],
      droites: [mcv, 18_000 + autres, mcv, 24_000 + autres],
      lecture: { "Marge sur coût variable de janvier": mcv, "Charges fixes, ce loyer compris": mcv, "Résultat de janvier": 0 },
    });
    expect(attendus(s, "a-rebours")).toEqual({
      "Hausse maximale du loyer (%)": c(((maximal - 19_700) / 19_700) * 100),
      "Prix de vente qui paierait la hausse": Math.ceil((cv + cfn / q) * 100) / 100,
      "Ventes en plus chaque mois, au prix d'aujourd'hui": Math.ceil((loyer - 19_700) / mu),
    });
    expect([c(((maximal - 19_700) / 19_700) * 100), Math.ceil((cv + cfn / q) * 100) / 100, Math.ceil((loyer - 19_700) / mu)]).toEqual([11.2, 59.1, 113]);
    // La hausse de 12 % dépasse les 11,2 % que janvier peut porter.
    expect(loyer).toBeGreaterThan(maximal);
  });

  it("le verdict : négocier, et les erreurs des mauvaises réponses", () => {
    const r = loyerQuiAugmente(cas);
    expect(r.verdict).toBe("negocier");
    expect(juste(s, "reponse")).toBe(`Négocier : au-delà de ${n(21_907)} € de loyer, janvier passe sous le seuil`);
    // La hausse appliquée à toutes les charges fixes, et les charges divisées par le prix.
    expect(Math.ceil((cf * 1.12) / mu)).toBe(1_664);
    expect(Math.ceil(cfn / p)).toBe(569);
    const options = (s.etapes.find((e) => e.id === "reponse") as EtapeChoix).options(cas, etatVide).map((o) => o.texte);
    expect(options).toContain(`Refuser : il faudrait ${n(1_664)} enceintes par mois, hors de portée`);
    expect(options).toContain("Signer : 569 enceintes suffisent à couvrir nos charges, bien sous nos ventes");
    expect(options).toContain("Signer : la hausse ne nous coûte que 157 € par mois");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
