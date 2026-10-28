import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ENTREPRISES_DU_LEVIER,
  LABORATOIRE_DU_LEVIER,
  LEVIER_DU_DEFI,
  L_EFFET_DE_LEVIER,
  RENTABILITE_VISEE,
  RESULTAT_DE_LA_MAUVAISE_ANNEE,
  RESULTAT_DU_CURSEUR,
  TAUX_DU_CURSEUR,
  levierDeLEscale,
} from "../../src/config/cours/chapitres/l-effet-de-levier";
import {
  COMPARABLE_COTE,
  EXIGENCE_DU_CURSEUR,
  LABORATOIRE_DE_LA_STRUCTURE,
  LA_CREATION_DE_VALEUR,
  LEVIER_DE_LA_VARIANTE,
  RESULTAT_DU_CURSEUR_DE_LA_VALEUR,
  valeurDeLEscale,
} from "../../src/config/cours/chapitres/la-creation-de-valeur";
import {
  APPORT_DES_ASSOCIES,
  BETA_DE_L_ACTIF_DE_L_ESCALE,
  BILAN_DE_L_ESCALE,
  EXIGENCE_DU_FONDS,
  MARGE_DE_CREDIT_PAR_UNITE_DE_LEVIER,
  PRIME_DE_RISQUE_DU_MARCHE,
  SALLE_DE_SEMINAIRE,
  TAUX_RELEVE,
  TAUX_SANS_RISQUE,
} from "../../src/config/cours/monde/projets-et-financement";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { CE_QUE_DOIT_RAPPORTER_L_EXPLOITATION, RESULTAT_DU_CURSEUR_DU_FONDS, ceQueDoitRapporterLExploitation } from "../../src/config/cours/situations/par-chapitre/ce-que-doit-rapporter-l-exploitation";
import { LE_LEVIER_FACE_A_LA_HAUSSE_DU_TAUX, RESULTAT_DU_CURSEUR_DU_CAS, levierFaceALaHausse } from "../../src/config/cours/situations/par-chapitre/le-levier-face-a-la-hausse-du-taux";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * DSCG FINANCE : L'EFFET DE LEVIER ET LA CRÉATION DE VALEUR, CHEZ L'ESCALE DU MONDE DU COURS, ET
 * LEURS CAS : LE LEVIER FACE À LA HAUSSE DU TAUX, CE QUE DOIT RAPPORTER L'EXPLOITATION.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche (monde/projets-et-financement.ts,
 * BILAN_DE_L_ESCALE et les constantes du marché), sans les fonctions des chapitres ni le modèle
 * (monde/finance.ts) ; les valeurs absolues sont épinglées. Les scénarios figés (l'apport, le taux
 * relevé, la salle de séminaire, le fonds à 15 %) et les variantes (la mauvaise année, le calcul à
 * rebours, Hamada) sont refaits comme le reste ; chaque curseur a son attendu, sa position voisine,
 * ses droites aux bornes et sa lecture ; chaque laboratoire, sa lecture au départ et à la solution
 * et les courbes de son graphique en quelques points ; les verdicts sont épinglés. Puis les gardes
 * de texte de l'étalon.
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "hotel";
const cas = casDeLEntreprise(code);
const b = BILAN_DE_L_ESCALE;
const centime = (x: number) => Math.round(x * 100) / 100 || 0;
/** Un taux en fraction, en pour cent au centième, comme l'élève le tape. */
const pc = (x: number) => Math.round(x * 10_000) / 100 || 0;
const t = b.tauxDeLImpot;

// La fiche, refaite à la main : le bilan, l'actif économique, le financement, l'année.
const bfr = b.stocks + b.creancesClients - b.dettesFournisseurs - b.dettesFiscalesEtSociales;
const AE = b.immobilisationsNettes + bfr;
const D = b.emprunt - b.disponibilites;
const CP = b.capitauxPropres;
const FF = b.tauxDeLEmprunt * b.empruntAuPremierJanvier;
const REXai = b.resultatDExploitation * (1 - t);
const FFai = FF * (1 - t);
const RN = (b.resultatDExploitation - FF) * (1 - t);
const CPouverture = CP - RN;
const re = pc(REXai / AE);
const i = pc(FFai / D);
const rcp = pc(RN / CP);
/** L'EVA de l'année, refaite à la main : REX après impôt − kcp × CP − charges financières après impôt. */
const evaDeLAnnee = REXai - ((TAUX_SANS_RISQUE + 1.4 * PRIME_DE_RISQUE_DU_MARCHE) * CP + FFai);

function textesDe(e: Etape, c: Cas, etat: EtatDuCours): string[] {
  const tb = e.tableau?.(c);
  const tableau = tb ? [tb.titre, ...tb.colonnes, ...tb.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
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

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu"];
const AFFICHENT_LEUR_TABLEAU: readonly Etape["type"][] = ["lecture", "choix", "montants", "tri"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon, et celles de l'ancien test). */
function verifierLesTextes(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [k, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, k);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])ne [aeiouyéèê]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −|−0 €|−0 %/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-ZÉ] [A-ZÉ] [A-ZÉ]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (nuitées?|heures?|trimestres?|points?|années?|ans)\b/i);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      expect(AFFICHENT_LEUR_TABLEAU, `${e.id} (${e.type})`).toContain(e.type);
      const tb = e.tableau(cas);
      for (const l of tb.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(tb.colonnes.length);
      expect(new Set(tb.lignes.map((l) => l.libelle)).size, e.id).toBe(tb.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      for (const a of options) for (const o of options) if (a !== o) expect(a.texte.toLowerCase().includes(o.texte.toLowerCase()), `${e.id} : ${o.texte}`).toBe(false);
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
  expect(new Set(ch.etapes.map((e) => e.id)).size, ch.code).toBe(ch.etapes.length);
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
    const bonne = options.find((o) => o.juste)!;
    expect(bonne.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
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
  // L'attendu est bien la position que le sens désigne : la plus petite qui couvre, ou la plus grande.
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

describe("les deux chapitres et leurs cas, chez L'ESCALE du monde du cours", () => {
  it("se jouent chez L'ESCALE seule, au palier 4 de la finance du DSCG, avec leur bloc", () => {
    for (const ch of [L_EFFET_DE_LEVIER, LA_CREATION_DE_VALEUR]) {
      expect(CHAPITRES).toContain(ch);
      expect(ch.parcours).toBe("dscg-finance");
      expect(ch.palier).toBe(4);
      expect(ch.entreprises?.codes).toEqual(["hotel"]);
      expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
      expect(ch.entreprises!.pourquoi).toContain("L'ESCALE");
      expect(ch.blocs).toEqual(["DSCG UE2 · Finance"]);
      expect(referentielDeCitation(ch.blocs[0]!)?.code).toBe("dscg");
      expect(blocOfficiel(ch.blocs[0]!, "dscg")).not.toBeNull();
      expect(ch.etapes[0]!.type).toBe("lecture");
      const synthese = ch.etapes.at(-1)!;
      expect(synthese.id).toBe("synthese");
      if (synthese.type !== "lecture") throw new Error("La synthèse est une lecture");
      expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
      // L'intro dit ce que la simulation suppose.
      const intro = ch.etapes[0]!;
      if (intro.type !== "lecture") throw new Error("L'intro est une lecture");
      expect(intro.texte(cas).join(" ")).toMatch(/Ce que la simulation suppose/);
    }
    expect(ENTREPRISES_DU_LEVIER).toEqual(["hotel"]);
    expect(b.entreprise).toBe(cas.entreprise);
    expect(SITUATIONS).toContain(LE_LEVIER_FACE_A_LA_HAUSSE_DU_TAUX);
    expect(SITUATIONS).toContain(CE_QUE_DOIT_RAPPORTER_L_EXPLOITATION);
  });

  it("chaque chapitre a ses trois temps : au moins deux cycles pari, curseur ou laboratoire, formalisation, et deux étapes d'expert à trois champs", () => {
    const cycles = (ch: Chapitre) =>
      ch.etapes.filter((e, k) => e.type === "choix" && e.id.startsWith("predire") && ["curseur", "simulation"].includes(ch.etapes[k + 1]!.type) && ch.etapes[k + 2]!.type !== "lecture").map((e) => e.id);
    expect(cycles(L_EFFET_DE_LEVIER)).toEqual(["predire-le-levier", "predire-le-taux"]);
    expect(cycles(LA_CREATION_DE_VALEUR)).toEqual(["predire-la-valeur", "predire-l-exigence", "predire-la-structure"]);
    const trois = (ch: Chapitre, id: string) => Object.keys(attendus(ch, id)).length;
    expect([trois(L_EFFET_DE_LEVIER, "une-mauvaise-annee"), trois(L_EFFET_DE_LEVIER, "a-rebours")]).toEqual([3, 3]);
    expect([trois(LA_CREATION_DE_VALEUR, "la-salle-de-seminaire"), trois(LA_CREATION_DE_VALEUR, "hamada")]).toEqual([3, 3]);
    for (const ch of [L_EFFET_DE_LEVIER, LA_CREATION_DE_VALEUR]) {
      expect(ch.etapes.filter((e) => e.type === "curseur").length, ch.code).toBeGreaterThanOrEqual(2);
      const labo = ch.etapes.find((e) => e.type === "simulation");
      if (labo?.type !== "simulation") throw new Error(`${ch.code} : pas de laboratoire`);
      expect(labo.graphique, ch.code).toBeDefined();
      // Un levier à choix : avec ou sans la marge de crédit.
      expect(labo.leviers(cas).find((l) => l.code === "marge")!.choix!.map((x) => x.valeur)).toEqual([0, 1]);
    }
  });
});

describe("l'effet de levier chez L'ESCALE, refait à la main", () => {
  const ch = L_EFFET_DE_LEVIER;

  it("la fiche donne les chiffres de la consigne", () => {
    expect([bfr, AE, D, CP, FF, REXai, FFai, RN]).toEqual([20_000, 2_150_000, 1_075_000, 1_075_000, 53_000, 259_425, 39_750, 219_675]);
    expect([re, i, rcp]).toEqual([12.07, 3.7, 20.43]);
    expect(CP + D).toBe(AE);
    expect(D / CP).toBe(1);
  });

  it("les étapes guidées attendent ce que la fiche donne", () => {
    expect(attendus(ch, "actif-economique")).toEqual({ "Besoin en fonds de roulement": bfr, "Actif économique": AE, "Endettement financier net": D });
    expect(attendus(ch, "rentabilite-economique")).toEqual({ "Résultat d'exploitation après impôt": REXai, "Rentabilité économique après impôt, Re (%)": re });
    expect(attendus(ch, "cout-de-la-dette")).toEqual({ "Charges financières de l'année": FF, "Charges financières après impôt": FFai, "Coût de l'endettement net après impôt, i (%)": i });
    // La relation, sur les taux arrondis de l'élève, et directement.
    const parLaRelation = centime(re + (re - i) * 1);
    expect(attendus(ch, "la-relation")).toEqual({ "Levier financier, D/CP": 1, "Rcp par la relation du levier (%)": parLaRelation, "Rcp par le résultat net (%)": rcp });
    expect(parLaRelation).toBe(20.44);
    // Sur les valeurs exactes, la relation tombe juste.
    expect(REXai / AE + (REXai / AE - FFai / D) * (D / CP)).toBeCloseTo(RN / CP, 12);
  });

  it("les étapes autonomes : le seuil de massue, le taux limite, l'apport", () => {
    const seuil = (FF * AE) / D;
    expect(seuil).toBe(106_000);
    expect(attendus(ch, "seuil-de-massue")).toEqual({
      "Seuil de massue": seuil,
      "Marge avant la massue": b.resultatDExploitation - seuil,
      "Baisse du résultat d'exploitation supportable (%)": pc((b.resultatDExploitation - seuil) / b.resultatDExploitation),
    });
    expect([b.resultatDExploitation - seuil, pc((b.resultatDExploitation - seuil) / b.resultatDExploitation)]).toEqual([239_900, 69.36]);
    const limite = centime((4 * re) / i);
    expect(limite).toBe(13.05);
    expect(attendus(ch, "taux-limite")).toEqual({ "Taux limite de l'emprunt (%)": limite, "Marge sous le taux limite (points)": centime(limite - 4) });
    // L'apport du scénario figé : 300 000 € qui remboursent autant d'emprunt au 1er janvier.
    expect(APPORT_DES_ASSOCIES).toBe(300_000);
    const ff = b.tauxDeLEmprunt * (b.empruntAuPremierJanvier - APPORT_DES_ASSOCIES);
    const rn = (b.resultatDExploitation - ff) * (1 - t);
    const cp = CPouverture + APPORT_DES_ASSOCIES + rn;
    const d = AE - cp;
    expect([ff, rn, cp, d]).toEqual([41_000, 228_675, 1_384_000, 766_000]);
    expect(attendus(ch, "apport")).toEqual({ "Levier avec l'apport, D/CP": centime(d / cp), "Rcp avec l'apport (%)": pc(rn / cp), "Variation de la Rcp (points)": centime(pc(rn / cp) - rcp) });
    expect([centime(d / cp), pc(rn / cp), centime(pc(rn / cp) - rcp), pc((ff * (1 - t)) / d)]).toEqual([0.55, 16.52, -3.91, 4.01]);
  });

  it("les étapes d'expert : la mauvaise année, le calcul à rebours", () => {
    expect(RESULTAT_DE_LA_MAUVAISE_ANNEE).toBe(90_000);
    const reM = pc((90_000 * (1 - t)) / AE);
    const rcpM = pc(((90_000 - FF) * (1 - t)) / CP);
    expect(attendus(ch, "une-mauvaise-annee")).toEqual({
      "Re de la mauvaise année (%)": reM,
      "Rcp de la mauvaise année (%)": rcpM,
      "Effet de levier de la mauvaise année (points)": centime(rcpM - reM),
    });
    expect([reM, rcpM, centime(rcpM - reM)]).toEqual([3.14, 2.58, -0.56]);
    expect(RENTABILITE_VISEE).toBe(0.24);
    const rnVise = 0.24 * CP;
    expect(attendus(ch, "a-rebours")).toEqual({
      "Résultat net visé": rnVise,
      "Résultat d'exploitation après impôt nécessaire": rnVise + FFai,
      "Résultat d'exploitation nécessaire": (rnVise + FFai) / (1 - t),
    });
    expect([rnVise, rnVise + FFai, (rnVise + FFai) / (1 - t)]).toEqual([258_000, 297_750, 397_000]);
    // Le résultat retrouvé redonne la rentabilité visée.
    expect(((397_000 - FF) * (1 - t)) / CP).toBeCloseTo(0.24, 12);
  });

  it("les verdicts : la dette joue pour les associés, l'apport, la limite de la relation", () => {
    expect(levierDeLEscale(cas).verdict).toBe("levier");
    expect(juste(ch, "predire-le-levier")).toBe("Plus haute que 12,07 % : la dette rapporte à l'outil plus qu'elle ne coûte");
    expect(juste(ch, "predire-le-taux")).toBe("Un peu au-delà de 12,07 % : les intérêts se déduisent de l'impôt");
    expect(juste(ch, "moins-de-dette")).toBe("Elle baisse : moins de dette, c'est moins de levier sur une rentabilité qui dépasse son coût");
    expect(juste(ch, "la-limite-de-la-relation")).toBe("La Rcp monte avec le levier, mais son risque aussi, et une dette plus chère rapproche le seuil de massue");
  });

  it("les curseurs, refaits à la main : le seuil de massue, le taux limite", () => {
    // Le résultat net (REX − 53 000) × 0,75 face à ce que les associés gagneraient sans dette, REX × 0,75 × CP ÷ AE.
    const net = (rex: number) => (rex - FF) * (1 - t);
    const sansDette = (rex: number) => (rex * (1 - t) * CP) / AE;
    expect(RESULTAT_DU_CURSEUR).toEqual({ min: 50_000, max: 400_000 });
    expect(curseur(ch, "le-resultat-au-curseur")).toEqual({
      attendu: 106_000,
      bornes: [50_000, 400_000],
      droites: [net(50_000), sansDette(50_000), net(400_000), sansDette(400_000)],
      lecture: { "Résultat net des associés": 39_750, "Ce qu'ils gagneraient sans dette": 39_750, "Effet de levier, en euros": 0 },
    });
    expect([net(50_000), sansDette(50_000), net(400_000), sansDette(400_000)]).toEqual([-2_250, 18_750, 260_250, 150_000]);
    expect(net(105_999)).toBeLessThan(sansDette(105_999));
    // Ce que la dette fait rapporter à l'outil, Re × D = 129 712,50 €, face à ce qu'elle coûte, taux × 1 325 000 × 0,75.
    const rapporte = (REXai * D) / AE;
    const coute = (pb: number) => (pb / 10_000) * b.empruntAuPremierJanvier * (1 - t);
    expect(rapporte).toBe(129_712.5);
    expect(TAUX_DU_CURSEUR).toEqual({ min: 100, max: 2_000 });
    const c = curseur(ch, "le-taux-au-curseur");
    expect(c).toEqual({
      attendu: 1_305,
      bornes: [100, 2_000],
      droites: [rapporte, coute(100), rapporte, coute(2_000)],
      lecture: {
        "Charges financières de l'année": centime(0.1305 * b.empruntAuPremierJanvier),
        "Charges financières après impôt": 129_684.38,
        "Ce que la dette fait rapporter à l'outil": rapporte,
        "Résultat net des associés": centime(REXai - 129_684.38),
        "Effet de levier, en euros": centime(rapporte - 129_684.38),
      },
    });
    expect(coute(1_305)).toBeCloseTo(129_684.375, 6);
    expect(coute(1_306)).toBeGreaterThan(rapporte);
    expect([coute(100), coute(2_000)]).toEqual([9_937.5, 198_750]);
  });

  it("le laboratoire du levier : avec la marge de crédit, le seuil de massue monte avec la dette", () => {
    const l = laboratoire(ch, "le-laboratoire-du-levier");
    expect(LABORATOIRE_DU_LEVIER).toEqual({ resultat: { min: 50_000, max: 450_000, pas: 100 }, levier: { min: 0, max: 3, pas: 0.05 }, taux: { min: 1, max: 15, pas: 0.1 } });
    expect(MARGE_DE_CREDIT_PAR_UNITE_DE_LEVIER).toBe(0.01);
    expect(LEVIER_DU_DEFI).toBe(2);
    expect(l.depart).toEqual({ resultat: 345_900, levier: 1, taux: 4, marge: 1 });
    // À la main : le taux monte d'un point par unité de levier au-delà de 1 ; i garde le rapport de la fiche
    // entre les intérêts (sur 1 325 000 €) et l'endettement net (1 075 000 €), après impôt.
    const lab = (rex: number, L: number, taux: number, marge: number) => {
      const tx = taux / 100 + marge * 0.01 * (L - 1);
      const ii = (tx * b.empruntAuPremierJanvier * (1 - t)) / D;
      const rr = (rex * (1 - t)) / AE;
      return { tx, ii, rr, effet: (rr - ii) * L, rcp: rr + (rr - ii) * L, seuil: centime((ii * AE) / (1 - t)) };
    };
    const lire = (x: ReturnType<typeof lab>) => ({
      "Taux de l'emprunt, marge comprise": pc(x.tx),
      "Rentabilité économique, Re": pc(x.rr),
      "Coût de l'endettement net, i": pc(x.ii),
      "Effet de levier, (Re − i) × D/CP": pc(x.effet),
      "Rentabilité des capitaux propres, Rcp": pc(x.rcp),
      "Seuil de massue": x.seuil,
    });
    expect(l.auDepart).toEqual(lire(lab(345_900, 1, 4, 1)));
    expect(Object.values(l.auDepart)).toEqual([4, 12.07, 3.7, 8.37, 20.43, 106_000]);
    // Au levier de 2, avec la marge, la dette coûte 5 % × 1 325 000 × 0,75 ÷ 1 075 000 : Re l'égale à 132 500 €.
    expect(l.solution).toEqual({ resultat: 0.05 * b.empruntAuPremierJanvier * 2, levier: 2, taux: 4, marge: 1 });
    expect(l.solution.resultat).toBe(132_500);
    expect(l.reussi).toEqual([false, true]);
    expect(l.aLaSolution).toEqual(lire(lab(132_500, 2, 4, 1)));
    expect(Object.values(l.aLaSolution)).toEqual([5, 4.62, 4.62, 0, 4.62, 132_500]);
    // Une position voisine ne relève pas le défi, et sans la marge non plus.
    expect(l.d.atteint({ ...l.solution, resultat: 132_400 })).toBe(false);
    expect(l.d.atteint({ ...l.solution, marge: 0 })).toBe(false);
    // Sans la marge, le seuil ne bouge pas avec le levier.
    expect(lab(132_500, 2, 4, 0).seuil).toBe(106_000);
    // Le graphique, à la solution : la Rcp culmine au levier de 1, recoupe Re au levier du défi, passe dessous au-delà.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("levier");
    const [courbeRcp, courbeRe, courbeI] = g.courbes;
    for (const L of [0, 0.5, 1, 2, 3]) {
      const x = lab(132_500, L, 4, 1);
      const p = { ...l.solution, levier: L };
      expect(courbeRcp!.valeur(p)).toBeCloseTo(x.rcp * 100, 9);
      expect(courbeRe!.valeur(p)).toBeCloseTo(x.rr * 100, 9);
      expect(courbeI!.valeur(p)).toBeCloseTo(x.ii * 100, 9);
    }
    expect([0, 1, 2, 3].map((L) => Math.round(courbeRcp!.valeur({ ...l.solution, levier: L }) * 1000) / 1000)).toEqual([4.622, 5.547, 4.622, 1.849]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("la création de valeur chez L'ESCALE, refaite à la main", () => {
  const ch = LA_CREATION_DE_VALEUR;
  const beta = Math.round(BETA_DE_L_ACTIF_DE_L_ESCALE * (1 + (1 - t) * (D / CP)) * 100) / 100;
  const kcp = centime((TAUX_SANS_RISQUE + beta * PRIME_DE_RISQUE_DU_MARCHE) * 100);
  const cmpc = centime(kcp * 0.5 + i * 0.5);
  const exigence = centime((kcp / 100) * CP);
  const coutDuCapital = exigence + FFai;
  const eva = REXai - coutDuCapital;

  it("la fiche donne les chiffres de la consigne", () => {
    expect([BETA_DE_L_ACTIF_DE_L_ESCALE, TAUX_SANS_RISQUE, PRIME_DE_RISQUE_DU_MARCHE]).toEqual([0.8, 0.03, 0.06]);
    expect([beta, kcp, cmpc]).toEqual([1.4, 11.4, 7.55]);
    expect([exigence, coutDuCapital, eva]).toEqual([122_550, 162_300, 97_125]);
    // L'EVA égale le résultat résiduel au centime : les poids sont ceux du bilan.
    expect(RN - exigence).toBe(eva);
    expect(coutDuCapital / (1 - t)).toBe(216_400);
  });

  it("les étapes guidées : kcp et CMPC", () => {
    expect(attendus(ch, "cout-des-capitaux-propres")).toEqual({ "Bêta des capitaux propres, βcp": beta, "Coût des capitaux propres, kcp (%)": kcp });
    expect(attendus(ch, "cmpc")).toEqual({ "Poids des capitaux propres (%)": pc(CP / AE), "Poids de l'endettement net (%)": pc(D / AE), "Coût moyen pondéré du capital, CMPC (%)": cmpc });
  });

  it("les étapes autonomes : l'EVA, le résultat qui l'annule, le résultat résiduel", () => {
    const e = attendus(ch, "eva");
    expect(e).toEqual({ "Re moins CMPC (points)": centime(re - cmpc), "EVA de l'année": eva, "Résultat d'exploitation qui annule l'EVA": coutDuCapital / (1 - t) });
    expect(centime(re - cmpc)).toBe(4.52);
    // La tolérance admet le chemin des taux arrondis : 4,52 % × 2 150 000 € = 97 180 €.
    const champ = (ch.etapes.find((x) => x.id === "eva") as EtapeMontants).champs(cas, etatVide)[1]!;
    expect(Math.abs((4.52 / 100) * AE - eva)).toBeLessThanOrEqual(champ.tolerance!);
    expect(champ.tolerance).toBe(215);
    expect(attendus(ch, "residuel")).toEqual({ "Exigence des associés": exigence, "Résultat résiduel": RN - exigence });
  });

  it("la salle de séminaire, refaite à la main : le résultat net monte, l'EVA baisse", () => {
    expect(SALLE_DE_SEMINAIRE).toMatchObject({ montant: 240_000, dureeDAmortissement: 10, excedentBrutEnPlus: 39_000 });
    const dotation = 240_000 / 10;
    const rex = b.resultatDExploitation + 39_000 - dotation;
    const ff = b.tauxDeLEmprunt * (b.empruntAuPremierJanvier + 240_000);
    const rn = (rex - ff) * (1 - t);
    const ae = AE + 240_000 - dotation;
    const cp = CPouverture + rn;
    const d = ae - cp;
    const k = TAUX_SANS_RISQUE + BETA_DE_L_ACTIF_DE_L_ESCALE * (1 + ((1 - t) * d) / cp) * PRIME_DE_RISQUE_DU_MARCHE;
    const evaAvec = centime(rn - k * cp);
    expect([rex, ff, rn, ae, cp, d]).toEqual([360_900, 62_600, 223_725, 2_366_000, 1_079_050, 1_286_950]);
    expect(evaAvec).toBe(93_228.9);
    expect(attendus(ch, "la-salle-de-seminaire")).toEqual({ "Variation du résultat net": rn - RN, "EVA avec la salle": evaAvec, "Variation de l'EVA": centime(evaAvec - eva) });
    expect([rn - RN, centime(evaAvec - eva)]).toEqual([4_050, -3_896.1]);
    // Le chemin du kcp arrondi (12,09 %) tient dans la tolérance.
    const champ = (ch.etapes.find((x) => x.id === "la-salle-de-seminaire") as EtapeMontants).champs(cas, etatVide)[1]!;
    expect(pc(k)).toBe(12.09);
    expect(Math.abs(rn - 0.1209 * cp - evaAvec)).toBeLessThanOrEqual(champ.tolerance!);
    // La salle rapporte 11 250 € après impôt sur 216 000 € : 5,21 %, sous le CMPC.
    expect([(39_000 - dotation) * (1 - t), 240_000 - dotation, pc(((39_000 - dotation) * (1 - t)) / (240_000 - dotation))]).toEqual([11_250, 216_000, 5.21]);
    expect(juste(ch, "la-salle-cree-t-elle")).toBe("Non : elle rapporte moins que ne coûte le capital qu'elle mobilise, même si le résultat net monte");
  });

  it("Hamada : le bêta du comparable désendetté redonne celui de la fiche, réendetté au levier de 2", () => {
    expect(COMPARABLE_COTE).toEqual({ betaDesCapitauxPropres: 1.1, levier: 0.5 });
    expect(LEVIER_DE_LA_VARIANTE).toBe(2);
    const ba = Math.round((1.1 / (1 + (1 - t) * 0.5)) * 100) / 100;
    const bcp = Math.round(ba * (1 + (1 - t) * 2) * 100) / 100;
    expect(attendus(ch, "hamada")).toEqual({ "Bêta de l'actif du comparable, βa": ba, "Bêta des capitaux propres au levier de 2": bcp, "kcp au levier de 2 (%)": centime(3 + bcp * 6) });
    expect([ba, bcp, centime(3 + bcp * 6)]).toEqual([BETA_DE_L_ACTIF_DE_L_ESCALE, 2, 15]);
  });

  it("les verdicts : la valeur créée, l'exigence couverte, le U, Modigliani et Miller", () => {
    expect(valeurDeLEscale(cas).verdict).toBe("cree");
    expect(juste(ch, "predire-la-valeur")).toBe("Moins que son résultat net : il faut d'abord payer ce qu'exigent les associés");
    expect(juste(ch, "verdict")).toBe("Elle crée de la valeur : son outil rapporte plus que ne coûte le capital");
    expect(juste(ch, "predire-l-exigence")).toBe("Jusqu'à 20,43 %, la rentabilité des capitaux propres");
    expect(juste(ch, "predire-la-structure")).toBe("Baisse, puis remonte : la dette finit par coûter plus cher");
    expect(juste(ch, "modigliani-miller")).toBe("Au-delà d'un certain levier, la dette coûte plus cher et le risque de défaillance a un coût");
  });

  it("les curseurs, refaits à la main : le résultat qui couvre le capital, l'exigence limite", () => {
    expect(RESULTAT_DU_CURSEUR_DE_LA_VALEUR).toEqual({ min: 100_000, max: 400_000 });
    expect(curseur(ch, "le-resultat-qui-couvre-le-capital")).toEqual({
      attendu: 216_400,
      bornes: [100_000, 400_000],
      droites: [100_000 * (1 - t), coutDuCapital, 400_000 * (1 - t), coutDuCapital],
      lecture: { "Résultat d'exploitation après impôt": coutDuCapital, "Exigence des associés": exigence, "Charges financières après impôt": FFai, "Valeur créée sur l'année, l'EVA": 0 },
    });
    // L'exigence que le résultat net couvre : 219 675 € ÷ 1 075 000 € = 20,43 %, soit 2 043 points de base.
    expect(EXIGENCE_DU_CURSEUR).toEqual({ min: 500, max: 3_000 });
    const attendu = Math.floor((RN / CP) * 10_000);
    expect(attendu).toBe(2_043);
    expect(curseur(ch, "l-exigence-au-curseur")).toEqual({
      attendu,
      bornes: [500, 3_000],
      droites: [RN, 0.05 * CP, RN, 0.3 * CP],
      lecture: { "Résultat net de l'année": RN, "Exigence des associés": centime(0.2043 * CP), "Résultat résiduel, l'EVA": centime(RN - 0.2043 * CP) },
    });
    expect(centime(RN - 0.2043 * CP)).toBe(52.5);
  });

  it("le laboratoire de la structure : le CMPC en U, le meilleur levier vers 0,59", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-structure");
    expect(LABORATOIRE_DE_LA_STRUCTURE).toEqual({ beta: { min: 0.5, max: 1.2, pas: 0.05 }, prime: { min: 4, max: 8, pas: 0.5 }, levier: { min: 0, max: 3, pas: 0.01 } });
    // À la main : kcp = 3 % + βa × (1 + 0,75 L) × prime ; le taux monte d'un point par unité de levier au-delà de 1 ;
    // CMPC = (kcp + i × L) ÷ (1 + L) ; EVA = 259 425 € − CMPC × 2 150 000 €.
    const au = (L: number, marge: number, ba = 0.8, prime = 6) => {
      const k = TAUX_SANS_RISQUE + ba * (1 + (1 - t) * L) * (prime / 100);
      const tx = b.tauxDeLEmprunt + marge * 0.01 * (L - 1);
      const ii = (tx * b.empruntAuPremierJanvier * (1 - t)) / D;
      const c = (k + ii * L) / (1 + L);
      return { k, tx, ii, c, rcp: REXai / AE + (REXai / AE - ii) * L, eva: centime(REXai - c * AE) };
    };
    const lire = (x: ReturnType<typeof au>) => ({
      "Coût des capitaux propres, kcp": pc(x.k),
      "Taux de l'emprunt, marge comprise": pc(x.tx),
      "Coût de l'endettement net, i": pc(x.ii),
      "Coût moyen pondéré du capital": pc(x.c),
      "Rentabilité des capitaux propres": pc(x.rcp),
      "EVA de l'année": x.eva,
    });
    expect(l.depart).toEqual({ beta: 0.8, prime: 6, levier: 1, marge: 1 });
    expect(l.auDepart).toEqual(lire(au(1, 1)));
    expect(l.auDepart["EVA de l'année"]).toBe(eva);
    expect(l.solution).toEqual({ beta: 0.8, prime: 6, levier: 0.59, marge: 1 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.aLaSolution).toEqual(lire(au(0.59, 1)));
    expect(Object.values(l.aLaSolution)).toEqual([9.92, 3.59, 3.32, 7.47, 17.23, 98_756.3]);
    // Le meilleur levier au centième : 0,59 fait mieux que 0,58 et que 0,60.
    expect(au(0.59, 1).eva).toBeGreaterThan(au(0.58, 1).eva);
    expect(au(0.59, 1).eva).toBeGreaterThan(au(0.6, 1).eva);
    expect(l.d.atteint({ ...l.solution, levier: 0.6 })).toBe(false);
    expect(l.d.atteint({ ...l.solution, marge: 0 })).toBe(false);
    // Le graphique : avec la marge, un U ; sans, une baisse sans fin.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("levier");
    const [avec, sans] = g.courbes;
    for (const L of [0, 0.59, 1, 2, 3]) {
      expect(avec!.valeur({ ...l.solution, levier: L })).toBeCloseTo(au(L, 1).c * 100, 9);
      expect(sans!.valeur({ ...l.solution, levier: L })).toBeCloseTo(au(L, 0).c * 100, 9);
    }
    expect([0, 1, 3].map((L) => Math.round(au(L, 1).c * 100_000) / 1000)).toEqual([7.8, 7.549, 8.81]);
    expect([0, 1, 3].map((L) => Math.round(au(L, 0).c * 100_000) / 1000)).toEqual([7.8, 7.549, 7.423]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : le levier face à la hausse du taux", () => {
  const s = LE_LEVIER_FACE_A_LA_HAUSSE_DU_TAUX;
  // Le scénario figé du taux relevé, refait à la main : 7 % sur le capital dû au 1er janvier.
  const ff = centime(TAUX_RELEVE * b.empruntAuPremierJanvier);
  const rn = (b.resultatDExploitation - ff) * (1 - t);
  const cp = CPouverture + rn;
  const d = AE - cp;

  it("les rentabilités au taux relevé, le seuil de massue, le taux limite", () => {
    casDedie(s, L_EFFET_DE_LEVIER);
    expect(s.commanditaire).toBe("La directrice financière");
    expect(TAUX_RELEVE).toBe(0.07);
    expect([ff, rn, cp, d]).toEqual([92_750, 189_862.5, 1_045_187.5, 1_104_812.5]);
    expect(attendus(s, "au-taux-releve")).toEqual({ "Re au taux relevé (%)": re, "i au taux relevé (%)": pc((ff * (1 - t)) / d), "Rcp au taux relevé (%)": pc(rn / cp) });
    expect([pc((ff * (1 - t)) / d), pc(rn / cp)]).toEqual([6.3, 18.17]);
    // À endettement net inchangé : 92 750 € × 2 150 000 € ÷ 1 075 000 €.
    const seuil = (ff * AE) / D;
    expect(seuil).toBe(185_500);
    expect(attendus(s, "la-marge-de-securite")).toEqual({
      "Seuil de massue au taux relevé": seuil,
      "Baisse supportable au taux relevé (%)": pc((b.resultatDExploitation - seuil) / b.resultatDExploitation),
      "Baisse supportable au taux actuel (%)": 69.36,
    });
    expect(pc((b.resultatDExploitation - seuil) / b.resultatDExploitation)).toBe(46.37);
    expect(attendus(s, "taux-limite")).toEqual({
      "Coût de l'endettement net au taux actuel, i (%)": i,
      "Taux de l'emprunt où le levier s'inverse (%)": 13.05,
      "Marge sous le taux limite, au taux relevé (points)": centime(13.05 - 7),
    });
  });

  it("le curseur du cas : le seuil de massue au nouveau taux", () => {
    expect(RESULTAT_DU_CURSEUR_DU_CAS).toEqual({ min: 50_000, max: 400_000 });
    const net = (rex: number) => (rex - ff) * (1 - t);
    const sansDette = (rex: number) => (rex * (1 - t) * CP) / AE;
    expect(curseur(s, "le-seuil-au-curseur")).toEqual({
      attendu: 185_500,
      bornes: [50_000, 400_000],
      droites: [net(50_000), sansDette(50_000), net(400_000), sansDette(400_000)],
      lecture: { "Résultat net des associés": 69_562.5, "Ce qu'ils gagneraient sans dette": 69_562.5, "Effet de levier, en euros": 0 },
    });
    expect([net(50_000), net(400_000)]).toEqual([-32_062.5, 230_437.5]);
  });

  it("la réponse : le levier tient, mais sa marge de sécurité a fondu", () => {
    expect(levierFaceALaHausse(cas).verdict).toBe("tient");
    expect(juste(s, "reponse")).toBe("Le levier tient, mais la baisse qu'il supporte passe de 69,36 % à 46,37 %");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

describe("le cas : ce que doit rapporter l'exploitation", () => {
  const s = CE_QUE_DOIT_RAPPORTER_L_EXPLOITATION;
  const exige = EXIGENCE_DU_FONDS * 100;
  const cmpcFonds = centime(exige * 0.5 + i * 0.5);
  const coutFonds = EXIGENCE_DU_FONDS * CP + FFai;
  // L'apport du fonds : le scénario figé de l'apport, à l'exigence du fonds.
  const ffA = b.tauxDeLEmprunt * (b.empruntAuPremierJanvier - APPORT_DES_ASSOCIES);
  const rnA = (b.resultatDExploitation - ffA) * (1 - t);
  const cpA = CPouverture + APPORT_DES_ASSOCIES + rnA;
  const dA = AE - cpA;

  it("le CMPC à l'exigence du fonds, le minimum à rebours", () => {
    casDedie(s, LA_CREATION_DE_VALEUR);
    expect(s.commanditaire).toBe("Le fonds d'investissement");
    expect(EXIGENCE_DU_FONDS).toBe(0.15);
    expect(attendus(s, "cmpc")).toEqual({ "Coût de l'endettement net après impôt, i (%)": i, "Poids des capitaux propres (%)": 50, "CMPC à l'exigence du fonds (%)": cmpcFonds });
    expect([cmpcFonds, coutFonds]).toEqual([9.35, 201_000]);
    expect(attendus(s, "exploitation-minimale")).toEqual({
      "EVA à l'exigence du fonds": REXai - coutFonds,
      "Résultat d'exploitation minimal": coutFonds / (1 - t),
      "Marge au-dessus du minimum": b.resultatDExploitation - coutFonds / (1 - t),
    });
    expect([REXai - coutFonds, coutFonds / (1 - t), b.resultatDExploitation - coutFonds / (1 - t)]).toEqual([58_425, 268_000, 77_900]);
  });

  it("l'apport du fonds remplace de la dette bon marché : l'EVA baisse", () => {
    expect([ffA, rnA, cpA, dA]).toEqual([41_000, 228_675, 1_384_000, 766_000]);
    const cmpcA = centime((exige * pc(cpA / AE) + pc((ffA * (1 - t)) / dA) * pc(dA / AE)) / 100);
    const evaA = rnA - EXIGENCE_DU_FONDS * cpA;
    expect(attendus(s, "avec-l-apport")).toEqual({ "CMPC avec l'apport (%)": cmpcA, "EVA avec l'apport": evaA, "Variation de l'EVA avec l'apport": evaA - (REXai - coutFonds) });
    expect([cmpcA, evaA, evaA - (REXai - coutFonds)]).toEqual([11.08, 21_075, -37_350]);
    // Au MEDAF (une exigence réendettée par Hamada), l'apport fait aussi baisser l'EVA, moins fort.
    const k = TAUX_SANS_RISQUE + BETA_DE_L_ACTIF_DE_L_ESCALE * (1 + ((1 - t) * dA) / cpA) * PRIME_DE_RISQUE_DU_MARCHE;
    const evaMedaf = centime(rnA - k * cpA);
    expect(evaMedaf).toBe(93_147);
    expect(ceQueDoitRapporterLExploitation(cas).variationAuMedaf).toBe(centime(evaMedaf - evaDeLAnnee));
    expect(centime(evaMedaf - evaDeLAnnee)).toBe(-3_978);
  });

  it("le curseur du cas : le résultat d'exploitation qui couvre le capital à l'exigence du fonds", () => {
    expect(RESULTAT_DU_CURSEUR_DU_FONDS).toEqual({ min: 100_000, max: 400_000 });
    expect(curseur(s, "le-minimum-au-curseur")).toEqual({
      attendu: 268_000,
      bornes: [100_000, 400_000],
      droites: [75_000, coutFonds, 300_000, coutFonds],
      lecture: { "Résultat d'exploitation après impôt": coutFonds, "Coût du capital, à l'exigence du fonds": coutFonds, "EVA à l'exigence du fonds": 0 },
    });
  });

  it("la réponse : l'exploitation couvre l'exigence, l'apport ferait baisser l'EVA", () => {
    expect(ceQueDoitRapporterLExploitation(cas).verdict).toBe("couvre-sans-l-apport");
    expect(juste(s, "reponse")).toBe("L'exploitation couvre votre exigence, mais votre apport ferait baisser l'EVA");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
