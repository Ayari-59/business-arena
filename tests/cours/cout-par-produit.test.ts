import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { COUT_PAR_PRODUIT, PRIX_DE_ONE_EN_VARIANTE, coutsParProduit } from "../../src/config/cours/chapitres/cout-par-produit";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { LA_CLE_CONTESTEE, cleContestee } from "../../src/config/cours/situations/par-chapitre/la-cle-contestee";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE COÛT PAR PRODUIT, SUR LA GAMME DE NOVA DU MONDE DU COURS, ET SON CAS : LA CLÉ CONTESTÉE.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de gestion (monde/nova-gestion.ts,
 * la gamme Go, One, Studio), sans les fonctions du chapitre ni le modèle (monde/couts-et-budgets.ts) ;
 * les valeurs absolues sont épinglées, la variante et le calcul à rebours refaits comme le reste, le
 * curseur (attendu, voisin, droites aux bornes, lecture), le laboratoire (départ, solution, courbes
 * du graphique en quelques points) et les verdicts aussi. Puis les gardes de texte de l'étalon
 * (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("nova");
const g = NOVA_GESTION.gamme;
const [go, one, studio] = g.references;
const c = (x: number) => Math.round(x * 100) / 100 + 0;

// ─── La fiche, refaite à la main ───
const communes = g.communes.loyer + g.communes.personnel + g.communes.entretien + g.communes.usure;
const ca = (r: typeof go) => r!.quantite * r!.prix;
const direct = (r: typeof go) => r!.quantite * r!.coutVariableUnitaire + r!.publicite;
const heures = (r: typeof go) => r!.quantite * r!.heuresMachineParUnite;
const H = heures(go) + heures(one) + heures(studio);
const CA = ca(go) + ca(one) + ca(studio);
const auxHeures = (r: typeof go) => c((communes * heures(r)) / H);
const auChiffre = (r: typeof go) => c((communes * ca(r)) / CA);

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
    case "curseur": {
      const k = e.cible(x);
      const gr = e.grandeur?.(x);
      const r = e.rates?.(x);
      return [e.titre, e.question(x), ...e.explication(x), ...e.lecture(x, k.attendu).map((l) => l.libelle), ...e.droites(x).libelles, ...(e.zones ?? []), gr?.libelle ?? "", gr?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(x);
      const depart = Object.fromEntries(e.leviers(x).map((l) => [l.code, l.depart]));
      const gr = e.graphique?.(x);
      return [
        e.titre,
        e.question(x),
        d.consigne,
        d.indice(depart),
        ...e.explication(x, d.solution),
        ...e.lecture(x, d.solution).map((l) => l.libelle),
        ...e.leviers(x).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((y) => y.libelle)]),
        ...(gr?.courbes ?? []).map((y) => y.libelle),
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/niveau \d+ de l'arène|l'arène (rejoue|joue|a rejoué|simule)/);
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
    const j = options.find((o) => o.juste)!;
    expect(j.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Les tolérances des champs d'une étape de montants, par libellé. */
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
  const couvre = (q: number) => d.produit(q) >= d.cout(q);
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
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, d, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), lire, reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const BLOCS = [
  ["BTS CG P5 · Analyse et prévision de l'activité", "bts-cg"],
  ["DCG UE11 · Contrôle de gestion", "dcg"],
  ["BUT GEA · Concevoir des outils de contrôle de gestion", "but-gea"],
] as const;

describe("le coût par produit, chez NOVA du monde du cours", () => {
  const ch = COUT_PAR_PRODUIT;

  it("se joue chez NOVA seule, au palier 3 du contrôle de gestion, avec ses blocs", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(LA_CLE_CONTESTEE);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.palier).toBe(3);
    expect(ch.libre).toBe(false);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.blocs).toEqual(BLOCS.map(([b]) => b));
    for (const [b, ref] of BLOCS) {
      expect(referentielDeCitation(b)?.code, b).toBe(ref);
      expect(blocOfficiel(b, ref), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(NOVA_GESTION.entreprise).toBe(cas.entreprise);
    // Le gabarit : deux paris, un curseur, un laboratoire, au moins deux étapes d'expert à trois champs ou plus.
    expect(ch.etapes.filter((e) => e.type === "choix" && /^Pariez/.test(e.titre)).length).toBeGreaterThanOrEqual(2);
    expect(ch.etapes.filter((e) => e.type === "curseur")).toHaveLength(1);
    expect(ch.etapes.filter((e) => e.type === "simulation")).toHaveLength(1);
    for (const id of ["les-deux-prix-de-one", "la-marge-par-heure", "le-plan-du-mois-de-pointe"]) expect(Object.keys(attendus(ch, id)).length, id).toBeGreaterThanOrEqual(3);
    // L'intro dit les hypothèses, la synthèse finit par la phrase de l'arène.
    const intro = ch.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("lecture attendue");
    expect(intro.texte(cas).join(" ")).toContain("Ce que la simulation suppose");
    const fin = ch.etapes.at(-1)!;
    if (fin.type !== "lecture") throw new Error("lecture attendue");
    expect(fin.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("la fiche donne les chiffres de la consigne", () => {
    expect(communes).toBe(19_700 + 10_650 + 1_562 + 1_666);
    expect(communes).toBe(33_578);
    expect([ca(go), ca(one), ca(studio), CA]).toEqual([6_630, 68_440, 27_993, 103_063]);
    expect([direct(go), direct(one), direct(studio)]).toEqual([4_078, 45_313, 15_583]);
    expect(H).toBeCloseTo(491.6, 9);
    expect(c(communes / H)).toBe(68.3);
    expect([auxHeures(go), auxHeures(one), auxHeures(studio)]).toEqual([2_397.45, 23_769.62, 7_410.93]);
    expect(c(auxHeures(go) + auxHeures(one) + auxHeures(studio))).toBe(communes);
    expect([auChiffre(go), auChiffre(one), auChiffre(studio)]).toEqual([2_160.06, 22_297.8, 9_120.14]);
    expect(CA - (direct(go) + direct(one) + direct(studio)) - communes).toBe(4_511);
  });

  it("les étapes guidées : coût direct, heures-machine, coût complet", () => {
    expect(attendus(ch, "couts-directs")).toEqual({ "Coût direct : NOVA Go": 195 * 19 + 373, "Coût direct : NOVA One": 1_160 * 38 + 1_233, "Coût direct : NOVA Studio": 217 * 70 + 393 });
    expect(attendus(ch, "heures")).toEqual({ "Heures-machine : NOVA Go": 35.1, "Heures-machine : NOVA One": 348, "Heures-machine : NOVA Studio": 108.5, "Coût d'une heure-machine": 68.3 });
    expect(attendus(ch, "couts-complets")).toEqual({
      "Coût complet : NOVA Go": c(direct(go) + auxHeures(go)),
      "Coût complet : NOVA One": c(direct(one) + auxHeures(one)),
      "Coût complet : NOVA Studio": c(direct(studio) + auxHeures(studio)),
    });
    expect(Object.values(attendus(ch, "couts-complets"))).toEqual([6_475.45, 69_082.62, 22_993.93]);
    // L'élève qui impute au coût de l'heure arrondi (68,30 €) trouve 1,22 € de moins sur One : la tolérance l'admet.
    const arrondi = c(direct(one) + 348 * 68.3);
    expect(c(69_082.62 - arrondi)).toBe(1.22);
    expect(tolerances(ch, "couts-complets")["Coût complet : NOVA One"]).toBeGreaterThanOrEqual(1.3);
    expect(Math.abs(arrondi - 69_082.62)).toBeLessThanOrEqual(tolerances(ch, "couts-complets")["Coût complet : NOVA One"]!);
    // Plus de ligne « qualité » à 0 € : elle n'existe plus nulle part.
    for (const e of ch.etapes) for (const t of textesDe(e, cas, etatVide)) expect(t, e.id).not.toMatch(/qualité/i);
  });

  it("l'étape autonome des résultats : la gamme fait 4 511 €, pas 4 527,47 €", () => {
    const r = (x: typeof go) => c(ca(x) - direct(x) - auxHeures(x));
    expect(attendus(ch, "resultats")).toEqual({ "Résultat : NOVA Go": r(go), "Résultat : NOVA One": r(one), "Résultat : NOVA Studio": r(studio), "Résultat de la gamme": 4_511 });
    expect([r(go), r(one), r(studio)]).toEqual([154.55, -642.62, 4_999.07]);
    // L'élève qui additionne ses trois résultats au coût de l'heure arrondi reste dans la tolérance.
    const somme = c(6_630 - 4_078 - 35.1 * 68.3 + (68_440 - 45_313 - 348 * 68.3) + (27_993 - 15_583 - 108.5 * 68.3));
    expect(Math.abs(somme - 4_511)).toBeLessThanOrEqual(tolerances(ch, "resultats")["Résultat de la gamme"]!);
    for (const e of ch.etapes) for (const t of textesDe(e, cas, etatVide)) expect(t, e.id).not.toMatch(/4\s527/);
  });

  it("le curseur de la clé, refait à la main : One reste bénéficiaire jusqu'à 56 % aux heures", () => {
    const pente = c(auxHeures(one) - auChiffre(one));
    expect(pente).toBe(1_471.82);
    const ms = ca(one) - direct(one);
    expect(ms).toBe(23_127);
    const limite = Math.floor(((ms - auChiffre(one)) / pente) * 100);
    expect(limite).toBe(56);
    // La lecture à 56 % : la part exacte de chaque référence, mélange des deux clés.
    const melange = (x: typeof go, s: number) => c(communes * (s * (heures(x) / H) + (1 - s) * (ca(x) / CA)));
    const k = curseur(ch, "la-part-aux-heures");
    expect(k).toEqual({
      attendu: 56,
      bornes: [0, 100],
      droites: [ms, auChiffre(one), ms, auxHeures(one)],
      lecture: {
        "Charges communes portées par NOVA One": melange(one, 0.56),
        "Résultat de NOVA Go": c(ca(go) - direct(go) - melange(go, 0.56)),
        "Résultat de NOVA One": c(ms - melange(one, 0.56)),
        "Résultat de NOVA Studio": c(ca(studio) - direct(studio) - melange(studio, 0.56)),
        "Résultat de la gamme": 4_511,
      },
    });
    expect(k.lecture["Résultat de NOVA One"]).toBe(4.98);
    // La position voisine : à 57 %, One perd.
    expect(c(ms - melange(one, 0.57))).toBe(-9.74);
    expect(juste(ch, "predire-la-cle")).toBe("Ne bougera pas : les charges communes restent les mêmes");
  });

  it("l'étape autonome au chiffre d'affaires", () => {
    expect(attendus(ch, "au-chiffre-d-affaires")).toEqual({
      "Coût de 100 € de chiffre d'affaires": c(communes / (CA / 100)),
      "Charges communes : NOVA One, au chiffre d'affaires": auChiffre(one),
      "Résultat : NOVA One, au chiffre d'affaires": c(ca(one) - direct(one) - auChiffre(one)),
      "Résultat de la gamme, au chiffre d'affaires": 4_511,
    });
    expect(c(communes / (CA / 100))).toBe(32.58);
    expect(c(ca(one) - direct(one) - auChiffre(one))).toBe(829.2);
    expect([c(ca(go) - direct(go) - auChiffre(go)), c(ca(studio) - direct(studio) - auChiffre(studio))]).toEqual([391.94, 3_289.86]);
  });

  it("le laboratoire de la clé : la clé au chiffre d'affaires rend les trois bénéficiaires, la gamme ne bouge pas", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-cle");
    expect(l.depart).toEqual({ cle: 1, prix: 59, heures: 0.3 });
    expect(l.solution).toEqual({ cle: 0, prix: 59, heures: 0.3 });
    expect(l.reussi).toEqual([false, true]);
    const cle = l.e.leviers(cas).find((x) => x.code === "cle")!;
    expect(cle.choix?.map((x) => x.libelle)).toEqual(["Aux heures-machine", "Au chiffre d'affaires"]);
    const lire = (imp: [number, number, number], ms: number) => ({
      "Charges communes portées par NOVA One": imp[1],
      "Marge sur coûts spécifiques de NOVA One": ms,
      "Résultat de NOVA Go": c(ca(go) - direct(go) - imp[0]),
      "Résultat de NOVA One": c(ca(one) - direct(one) - imp[1]),
      "Résultat de NOVA Studio": c(ca(studio) - direct(studio) - imp[2]),
      "Résultat de la gamme": 4_511,
    });
    expect(l.auDepart).toEqual(lire([auxHeures(go), auxHeures(one), auxHeures(studio)], 23_127));
    expect(l.aLaSolution).toEqual(lire([auChiffre(go), auChiffre(one), auChiffre(studio)], 23_127));
    // Le prix réussit aussi, et fait gagner la gamme : One à 59,60 € aux heures (1 160 × 59,60 − 69 082,62 > 0), pas à 59,50 €.
    expect(c(1_160 * 59.6 - 69_082.62)).toBe(53.38);
    expect(l.d.atteint({ cle: 1, prix: 59.6, heures: 0.3 })).toBe(true);
    expect(l.d.atteint({ cle: 1, prix: 59.5, heures: 0.3 })).toBe(false);
    expect(l.lire({ cle: 1, prix: 60, heures: 0.3 })["Résultat de la gamme"]).toBe(4_511 + 1_160);
    // Les heures seules n'y arrivent jamais : Go bascule quand One redevient bénéficiaire.
    const resultats = (h: number) => {
      const Hh = heures(go) + 1_160 * h + heures(studio);
      return [ca(go) - direct(go) - (communes * heures(go)) / Hh, 23_127 - (communes * 1_160 * h) / Hh, ca(studio) - direct(studio) - (communes * heures(studio)) / Hh];
    };
    for (let i = 0; i <= 20; i++) {
      const h = c(0.2 + i * 0.01);
      expect(resultats(h).every((x) => x > 0), `à ${h} h`).toBe(false);
      expect(l.d.atteint({ cle: 1, prix: 59, heures: h }), `à ${h} h`).toBe(false);
    }
    // À la main, chaque part arrondie seule ; le modèle répartit au centime le plus fort reste (un centime d'écart au plus).
    resultats(0.27).forEach((x, i) => expect(x, `0,27 h : ${i}`).toBeCloseTo([-28.1, 104.61, 4_434.49][i]!, 1));
    resultats(0.28).forEach((x, i) => expect(x, `0,28 h : ${i}`).toBeCloseTo([35.8, -156.8, 4_632][i]!, 1));
    expect(juste(ch, "predire-les-heures")).toBe("Non : les charges qu'elle ne porte plus iront aux autres références");
  });

  it("le graphique du laboratoire : les résultats de Go et de One se croisent selon les heures, la gamme reste droite", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-cle");
    const gr = l.e.graphique!(cas);
    expect(gr.levier).toBe("heures");
    expect(gr.courbes.map((x) => x.libelle)).toEqual(["Résultat de NOVA Go", "Résultat de NOVA One", "Résultat de la gamme"]);
    const [cGo, cOne, cGamme] = gr.courbes;
    const p = (h: number) => ({ cle: 1, prix: 59, heures: h });
    expect([cGo!.valeur(p(0.27)), cOne!.valeur(p(0.27)), cGamme!.valeur(p(0.27))]).toEqual([-28.1, 104.61, 4_511]);
    expect([cGo!.valeur(p(0.28)), cOne!.valeur(p(0.28))]).toEqual([35.8, -156.8]);
    expect([cGo!.valeur(p(0.3)), cOne!.valeur(p(0.3))]).toEqual([154.55, -642.62]);
    // Au chiffre d'affaires, les heures ne comptent plus : les courbes sont plates.
    expect(cOne!.valeur({ cle: 0, prix: 59, heures: 0.2 })).toBe(829.2);
    expect(cOne!.valeur({ cle: 0, prix: 59, heures: 0.4 })).toBe(829.2);
  });

  it("l'abandon et la marge sur coûts spécifiques : sans One, −18 616 €", () => {
    expect(juste(ch, "abandon")).toBe("Il baisse de 23 127 € : ce qu'elle laisse une fois payées ses seules charges propres");
    const ms = (x: typeof go) => ca(x) - direct(x);
    expect(attendus(ch, "marge-specifique")).toEqual({
      "Marge sur coûts spécifiques : NOVA Go": ms(go),
      "Marge sur coûts spécifiques : NOVA One": ms(one),
      "Marge sur coûts spécifiques : NOVA Studio": ms(studio),
      "Résultat de la gamme sans NOVA One": ms(go) + ms(studio) - communes,
    });
    expect([ms(go), ms(one), ms(studio), ms(go) + ms(studio) - communes]).toEqual([2_552, 23_127, 12_410, -18_616]);
  });

  it("l'expert à rebours : les deux prix de One, et la variante à 45 €", () => {
    expect(PRIX_DE_ONE_EN_VARIANTE).toBe(45);
    const a = attendus(ch, "les-deux-prix-de-one");
    expect(a).toEqual({
      "Prix qui annule le résultat de NOVA One": c((direct(one) + auxHeures(one)) / 1_160),
      "Prix qui annule la marge sur coûts spécifiques de NOVA One": c(direct(one) / 1_160),
      "Résultat de la gamme, NOVA One à 45 €": 4_511 - 1_160 * (59 - 45),
    });
    expect(Object.values(a)).toEqual([59.55, 39.06, -11_729]);
    // La garder, même à 45 €, rapporte encore face à l'abandon.
    expect(-11_729 - -18_616).toBe(6_887);
    expect(coutsParProduit(cas).gainAGarderEnVariante).toBe(6_887);
  });

  it("l'expert du facteur rare : la marge par heure-machine et le programme du mois de pointe", () => {
    const m = (x: typeof go) => c((x!.prix - x!.coutVariableUnitaire) / x!.heuresMachineParUnite);
    expect(attendus(ch, "la-marge-par-heure")).toEqual({ "Marge par heure-machine : NOVA Go": m(go), "Marge par heure-machine : NOVA One": m(one), "Marge par heure-machine : NOVA Studio": m(studio) });
    expect([m(go), m(one), m(studio)]).toEqual([83.33, 70, 118]);
    // Studio d'abord (118 €/h), puis Go (83,33 €/h), One avec ce qui reste.
    const demandees = 600 * 0.18 + 1_500 * 0.3 + 400 * 0.5;
    const oneProduites = Math.floor((700 - 400 * 0.5 - 600 * 0.18) / 0.3 + 1e-9);
    const naifGo = Math.floor((700 - 400 * 0.5 - 1_500 * 0.3) / 0.18 + 1e-9);
    expect([demandees, oneProduites, naifGo]).toEqual([758, 1_306, 277]);
    expect(attendus(ch, "le-plan-du-mois-de-pointe")).toEqual({
      "Heures-machine demandées": 758,
      "NOVA One produites": 1_306,
      "Marge du mois de pointe, au meilleur programme": 400 * 59 + 600 * 15 + 1_306 * 21,
      "Marge d'un programme classé par marge par enceinte": 400 * 59 + 1_500 * 21 + 277 * 15,
    });
    expect([400 * 59 + 600 * 15 + 1_306 * 21, 400 * 59 + 1_500 * 21 + 277 * 15]).toEqual([60_026, 59_255]);
    expect(juste(ch, "quelle-reference-sacrifier")).toBe("NOVA One : elle rapporte le moins par heure-machine");
    expect(juste(ch, "le-classement-en-cout-complet")).toBe("Ce classement dépend de la clé : pour décider, il faut des marges");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : la clé contestée", () => {
  const s = LA_CLE_CONTESTEE;

  it("a la forme d'un cas dédié, chez NOVA seule", () => {
    casDedie(s, COUT_PAR_PRODUIT);
    expect(s.code).toBe("la-cle-contestee");
    expect(s.commanditaire).toBe("Le dirigeant");
    expect(s.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
  });

  it("les deux clés, refaites à la main : la gamme fait 4 511 € dans les deux", () => {
    expect(attendus(s, "aux-heures")).toEqual({
      "Coût direct : NOVA One": direct(one),
      "Coût d'une heure-machine": c(communes / H),
      "Charges communes : NOVA One, aux heures": auxHeures(one),
      "Résultat : NOVA One, aux heures": c(ca(one) - direct(one) - auxHeures(one)),
    });
    expect(attendus(s, "au-chiffre-d-affaires")).toEqual({
      "Coût de 100 € de chiffre d'affaires": 32.58,
      "Charges communes : NOVA One, au chiffre d'affaires": auChiffre(one),
      "Résultat : NOVA One, au chiffre d'affaires": 829.2,
      "Résultat de la gamme": 4_511,
    });
  });

  it("le croisement : NOVA Studio paierait plus que tout ce que One ne porte plus", () => {
    const studioEnPlus = c(auChiffre(studio) - auxHeures(studio));
    const goEnPlus = c(auChiffre(go) - auxHeures(go));
    expect(attendus(s, "qui-paie")).toEqual({
      "Charges en plus : NOVA Studio": studioEnPlus,
      "Charges en plus : NOVA Go": goEnPlus,
      "Résultat : NOVA Studio, au chiffre d'affaires": c(ca(studio) - direct(studio) - auChiffre(studio)),
    });
    expect([studioEnPlus, goEnPlus]).toEqual([1_709.21, -237.39]);
    expect(c(studioEnPlus + goEnPlus)).toBe(c(auxHeures(one) - auChiffre(one)));
    // L'élève qui arrondit ses deux coûts d'unité d'œuvre reste dans la tolérance.
    const arrondi = c(279.93 * 32.58 - 108.5 * 68.3);
    expect(Math.abs(arrondi - studioEnPlus)).toBeLessThanOrEqual(tolerances(s, "qui-paie")["Charges en plus : NOVA Studio"]!);
  });

  it("le curseur du cas, à rebours : 56 % aux heures au plus", () => {
    const ms = ca(one) - direct(one);
    const melange = (x: typeof go, sh: number) => c(communes * (sh * (heures(x) / H) + (1 - sh) * (ca(x) / CA)));
    expect(curseur(s, "la-part-tenable")).toEqual({
      attendu: 56,
      bornes: [0, 100],
      droites: [ms, auChiffre(one), ms, auxHeures(one)],
      lecture: { "Charges communes portées par NOVA One": melange(one, 0.56), "Résultat de NOVA One": c(ms - melange(one, 0.56)), "Résultat de la gamme": 4_511 },
    });
  });

  it("le verdict : la clé ne crée rien, One se garde par sa marge", () => {
    expect(cleContestee(cas).verdict).toBe("la-cle-ne-cree-rien");
    expect(juste(s, "reponse")).toBe(
      "Garder les heures, qui suivent l'usage des lignes : la clé déplacerait 1 471,82 €, surtout vers NOVA Studio, sans rien rapporter à la gamme",
    );
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
