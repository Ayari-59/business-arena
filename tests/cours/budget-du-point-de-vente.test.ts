import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  BUDGET_DU_POINT_DE_VENTE,
  DELAI_DU_CURSEUR,
  MOIS_DU_CURSEUR,
  PLAFOND_DES_PAIEMENTS,
  STOCK_DE_COLS_RONDS_A_REBOURS,
  budgetDuPointDeVente,
} from "../../src/config/cours/chapitres/budget-du-point-de-vente";
import { MAILLE_ET_CO, type CodeDeFournisseur } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { COMMANDES_DU_CURSEUR, REVISER_LE_BUDGET } from "../../src/config/cours/situations/par-chapitre/reviser-le-budget";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE BUDGET DU POINT DE VENTE, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : RÉVISER LE BUDGET.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de la boutique (monde/maille-et-co.ts),
 * sans les fonctions du chapitre ni le modèle (monde/boutique.ts) : le budget des ventes, des achats et
 * de la TVA, la marge sur ce qui est vendu, les décaissements chez chaque fournisseur, le stock au coût
 * moyen pondéré, l'objectif des mois qui restent, le calcul à rebours et la révision au rythme de
 * janvier. Les valeurs absolues sont épinglées, les curseurs (attendu, position voisine, droites aux
 * bornes, lecture), le laboratoire (départ, solution, courbes du graphique) et les verdicts aussi. Puis
 * les gardes de texte de l'étalon.
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("boutique");
const f = MAILLE_ET_CO;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

// ─── Le budget, refait à la main sur la fiche ────────────────────────────────

const JOURS = 90;
const TVA = 0.2;
const g = f.gamme;
const ventesDuBudget = g.map((r) => f.budget.ventesPrevues[r.code]);
const stockVoulu = g.map((r) => f.budget.stockFinalVoulu[r.code]);
const fournisseur = (code: CodeDeFournisseur) => f.fournisseurs.find((x) => x.code === code)!;

/**
 * Le budget à la main : achats = ventes + stock voulu − stock initial ; le prix d'achat chez le
 * fournisseur, au centime ; le stock du 1er janvier au prix du façonnier, le stock voulu au coût moyen
 * pondéré du trimestre ; la caisse paie 1 − délai ÷ 90 des achats TTC.
 */
function budget(code: CodeDeFournisseur, ventes: readonly number[] = ventesDuBudget, voulu: readonly number[] = stockVoulu) {
  const fo = fournisseur(code);
  const lignes = g.map((r, i) => {
    const achats = ventes[i]! + voulu[i]! - r.stockInitial;
    const prix = centime(r.coutDAchat * fo.multiplicateur);
    const initial = r.stockInitial * r.coutDAchat;
    const achatsHt = centime(achats * prix);
    const moyen = (initial + achatsHt) / (r.stockInitial + achats);
    const final = centime(voulu[i]! * moyen);
    return { achats, prix, initial, achatsHt, moyen, final, vendues: centime(initial + achatsHt - final), ventesHt: ventes[i]! * r.prixHt };
  });
  const achatsHt = centime(somme(lignes.map((l) => l.achatsHt)));
  const ventesHt = somme(lignes.map((l) => l.ventesHt));
  const achatsTtc = centime(achatsHt * (1 + TVA));
  const decaisse = centime(achatsTtc * Math.max(0, 1 - fo.delaiDePaiement / JOURS));
  return {
    lignes,
    achats: somme(lignes.map((l) => l.achats)),
    achatsHt,
    ventesHt,
    marge: centime(ventesHt - somme(lignes.map((l) => l.vendues))),
    achatsTtc,
    decaisse,
    dette: centime(achatsTtc - decaisse),
    stockFinal: somme(voulu),
  };
}
const fac = budget("faconnier");
const atelier = budget("atelier-local");
const fins = budget("fins-de-serie");
const janvier = somme(g.map((r) => r.ventesDuMois * r.prixHt));

// ─── Les aides des gardes, celles de l'étalon ────────────────────────────────

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
  const u = cas.unite;
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (articles?|trimestres?|rangs?|points?|pulls?|jours?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(de|du) le\b/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(new RegExp(`\\bun ${u}\\b`, "i"));
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

// ─── Les gardes ──────────────────────────────────────────────────────────────

describe("le budget du point de vente, à la boutique du monde du cours", () => {
  const ch = BUDGET_DU_POINT_DE_VENTE;

  it("se joue chez MAILLE & CO seule, au palier 3 du BTS MCO, avec ses blocs ; la synthèse finit sur l'arène", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(REVISER_LE_BUDGET);
    expect([ch.parcours, ch.palier]).toEqual(["mco", 3]);
    expect(ch.entreprises?.codes).toEqual(["boutique"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.blocs).toEqual(["BTS MCO Bloc 3 · Assurer la gestion opérationnelle", "BUT TC · Piloter un espace de vente"]);
    for (const [b, ref] of [[ch.blocs[0]!, "bts-mco"], [ch.blocs[1]!, "but-tc"]] as const) {
      expect(referentielDeCitation(b)?.code, b).toBe(ref);
      expect(blocOfficiel(b, ref), b).not.toBeNull();
    }
    expect(f.entreprise).toBe(cas.entreprise);
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    const fin = (ch.etapes.at(-1) as Extract<Etape, { type: "lecture" }>).texte(cas).at(-1);
    expect(fin).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    const intro = (ch.etapes[0] as Extract<Etape, { type: "lecture" }>).texte(cas).join(" ");
    expect(intro).toMatch(/simulation du cours/);
    expect(intro).toMatch(/La simulation suppose/);
  });

  it("la fiche donne les chiffres de la consigne", () => {
    expect([somme(ventesDuBudget), fac.ventesHt, fac.achats, fac.achatsHt, fac.marge]).toEqual([5_070, 289_850, 4_970, 128_340, 162_830]);
    expect([fac.decaisse, atelier.decaisse, fins.decaisse]).toEqual([77_004, 125_259.84, 126_286.56]);
    expect(centime(fac.ventesHt / 3)).toBe(96_616.67);
    expect(janvier).toBe(87_450);
  });

  it("les étapes guidées : le budget des ventes et le budget des achats", () => {
    expect(attendus(ch, "budget-des-ventes")).toEqual({ "Chiffre d'affaires du pull col rond": 1_990 * 55, "Ventes hors taxes du trimestre": fac.ventesHt, "Ventes toutes taxes comprises": fac.ventesHt * 1.2 });
    expect(attendus(ch, "quantites-a-acheter")).toEqual({
      "Pulls col rond à acheter": 1_990 + 400 - 400,
      "Cardigans à acheter": 1_190 + 250 - 120,
      "Articles à acheter, toute la gamme": fac.achats,
      "Achats hors taxes": fac.achatsHt,
    });
    expect(fac.lignes.map((l) => l.achats)).toEqual([1_990, 1_320, 290, 990, 380]);
  });

  it("les étapes autonomes : la marge sur ce qui est vendu, la TVA, les décaissements", () => {
    const initial = somme(g.map((r) => r.stockInitial * r.coutDAchat));
    const final = somme(g.map((r, i) => stockVoulu[i]! * r.coutDAchat));
    expect([initial, final]).toEqual([24_990, 26_310]);
    expect(attendus(ch, "marge-budgetee")).toEqual({
      "Coût d'achat des marchandises vendues": initial + fac.achatsHt - final,
      "Marge commerciale budgétée": fac.ventesHt - (initial + fac.achatsHt - final),
      "Taux de marque budgété (%)": centime(((fac.ventesHt - (initial + fac.achatsHt - final)) / fac.ventesHt) * 100),
    });
    expect(attendus(ch, "marge-budgetee")["Taux de marque budgété (%)"]).toBe(56.18);
    expect(attendus(ch, "la-tva-du-trimestre")).toEqual({ "TVA collectée sur les ventes": 57_970, "TVA déductible sur les achats": 25_668, "TVA à reverser": 57_970 - 25_668 });
    expect(attendus(ch, "les-decaissements")).toEqual({
      "Décaissé chez le façonnier": fac.decaisse,
      "Dû au façonnier au 31 mars": fac.dette,
      "Décaissé chez l'atelier local": atelier.decaisse,
      "Décaissé chez les fins de série": fins.decaisse,
    });
    // Le prix compte moins que le délai : les fins de série, les moins chères, font sortir le plus.
    expect(fins.decaisse).toBeGreaterThan(atelier.decaisse);
    expect(fins.achatsHt).toBeLessThan(fac.achatsHt);
  });

  it("les étapes d'expert : le budget relu à rebours, le stock au coût moyen pondéré", () => {
    expect(STOCK_DE_COLS_RONDS_A_REBOURS).toBe(600);
    const relu = budget("faconnier", ventesDuBudget, [600, ...stockVoulu.slice(1)]);
    expect(relu.decaisse).toBe((128_340 + 200 * 25) * 1.2 * 0.5);
    expect(attendus(ch, "le-budget-relu")).toEqual({ "Achats hors taxes du budget relu": relu.decaisse / 0.5 / 1.2, "Pulls col rond achetés en plus": 200, "Stock de pulls col rond voulu au 31 mars": 600 });
    const col = fins.lignes[0]!;
    expect([col.prix, col.initial, col.achatsHt]).toEqual([20.5, 10_000, 40_795]);
    expect(attendus(ch, "variante-fins-de-serie")).toEqual({
      "Coût moyen pondéré d'un pull col rond": centime(50_795 / 2_390),
      "Valeur du stock de pulls col rond au 31 mars": centime((400 * 50_795) / 2_390),
      "Coût d'achat des pulls col rond vendus": centime(50_795 - centime((400 * 50_795) / 2_390)),
    });
    expect(Object.values(attendus(ch, "variante-fins-de-serie"))).toEqual([21.25, 8_501.26, 42_293.74]);
    expect([fins.marge, centime(fins.marge - fac.marge)]).toEqual([181_969.01, 19_139.01]);
  });

  it("les verdicts sont épinglés", () => {
    expect(juste(ch, "la-marge-du-vendeur")).toBe("Elle est trop basse de 1 320 € : la réserve perd des articles, mais gagne en valeur");
    expect(juste(ch, "predire-le-delai")).toBe("Non : il en sortirait encore plus");
    expect(juste(ch, "predire-l-objectif")).toBe("Plus que l'objectif du mois : il faut rattraper janvier");
    expect(juste(ch, "la-caisse-ou-la-rupture")).toBe("Non : la caisse tient, mais avril commence en rupture, sans réassort possible");
    expect(juste(ch, "si-on-se-trompe")).toBe("Le stock final est plus gros que voulu, et l'argent des achats dort en réserve");
    // Le pari : à 30 jours, les fins de série feraient encore sortir plus que le façonnier.
    expect(centime(fins.achatsTtc * (1 - 30 / 90))).toBe(84_191.04);
  });

  it("le curseur du délai, refait à la main : 36 jours pour ménager la caisse autant que le façonnier", () => {
    expect(DELAI_DU_CURSEUR).toEqual({ min: 0, max: 90 });
    const d = Math.ceil(90 * (1 - fac.decaisse / fins.achatsTtc));
    expect(d).toBe(36);
    expect(fins.achatsTtc * (1 - 35 / 90)).toBeGreaterThan(fac.decaisse);
    expect(curseur(ch, "le-delai-au-curseur")).toEqual({
      attendu: 36,
      bornes: [0, 90],
      droites: [fac.decaisse, fins.achatsTtc, fac.decaisse, 0],
      lecture: {
        "Achats des fins de série, TVA comprise": fins.achatsTtc,
        "Décaissé dans le trimestre": centime(fins.achatsTtc * (1 - 36 / 90)),
        "Dû au tricoteur au 31 mars": centime(fins.achatsTtc - centime(fins.achatsTtc * (1 - 36 / 90))),
        "Décaissé chez le façonnier": fac.decaisse,
        "Ce que la caisse garde de plus qu'avec le façonnier": centime(fac.decaisse - centime(fins.achatsTtc * (1 - 36 / 90))),
      },
    });
  });

  it("le curseur de l'objectif, refait à la main : 101 200 € en février et en mars", () => {
    expect(MOIS_DU_CURSEUR).toEqual({ min: 85_000, max: 115_000 });
    const m = (fac.ventesHt - janvier) / 2;
    expect(m).toBe(101_200);
    expect(curseur(ch, "l-objectif-au-curseur")).toEqual({
      attendu: m,
      bornes: [85_000, 115_000],
      droites: [janvier + 170_000, fac.ventesHt, janvier + 230_000, fac.ventesHt],
      lecture: {
        "Chiffre d'affaires de janvier": janvier,
        "Chiffre d'affaires du trimestre": fac.ventesHt,
        "Budget des ventes du trimestre": fac.ventesHt,
        "Ce que chaque mois fait au-delà de l'objectif du mois": centime(m - centime(fac.ventesHt / 3)),
        "Trimestre moins budget": 0,
      },
    });
    expect(attendus(ch, "le-rattrapage")).toEqual({ "Objectif d'un mois": 96_616.67, "Chiffre d'affaires de février et de mars, chacun": m, "Hausse sur janvier (%)": centime((m / janvier - 1) * 100) });
    expect(centime((m / janvier - 1) * 100)).toBe(15.72);
  });

  it("le laboratoire du budget : plus de marge sous le plafond, au prix d'un stock vide", () => {
    expect(PLAFOND_DES_PAIEMENTS).toBe(105_000);
    const l = laboratoire(ch, "le-laboratoire-du-budget");
    expect(l.depart).toEqual({ fournisseur: 1, stock: 100 });
    expect(l.solution).toEqual({ fournisseur: 3, stock: 10 });
    expect(l.reussi).toEqual([false, true]);
    const voulu = (pct: number) => stockVoulu.map((s) => Math.round((s * pct) / 100));
    const lire = (b: ReturnType<typeof budget>) => ({
      "Articles à acheter": b.achats,
      "Achats hors taxes": b.achatsHt,
      "Marge commerciale": b.marge,
      "Décaissé dans le trimestre": b.decaisse,
      "Dû au fournisseur au 31 mars": b.dette,
      "Stock au 31 mars": b.stockFinal,
      "Marge gagnée sur le façonnier": centime(b.marge - fac.marge),
      "Trésorerie gardée sur le façonnier": centime(fac.decaisse - b.decaisse),
    });
    expect(l.auDepart).toEqual(lire(fac));
    const solution = budget("fins-de-serie", ventesDuBudget, voulu(10));
    expect(l.aLaSolution).toEqual(lire(solution));
    expect(voulu(10)).toEqual([40, 25, 6, 25, 10]);
    expect(Object.values(l.aLaSolution)).toEqual([4_016, 85_822.02, 181_286.98, 102_986.42, 0, 106, 18_456.98, -25_982.42]);
    // Seules les fins de série, avec 0 ou 10 % du stock voulu, relèvent le défi ; à 20 %, la caisse dépasse le plafond.
    const reussites = [1, 2, 3].flatMap((fo) => [0, 10, 20, 50, 100, 150].filter((stock) => l.atteint({ fournisseur: fo, stock })).map((stock) => `${fo}:${stock}`));
    expect(reussites).toEqual(["3:0", "3:10"]);
    expect(budget("fins-de-serie", ventesDuBudget, voulu(20)).decaisse).toBe(105_575.33);
    // Le stock de sécurité du trimestre : 7 jours des ventes prévues.
    expect(Math.ceil((5_070 / 90) * 7)).toBe(395);
  });

  it("le graphique du laboratoire : la sortie de caisse, le plafond et la marge selon le stock voulu", () => {
    const l = laboratoire(ch, "le-laboratoire-du-budget");
    const gr = l.e.graphique!(cas);
    expect(gr.levier).toBe("stock");
    const [caisse, plafond, marge] = gr.courbes;
    const a = (c: typeof caisse, stock: number, fo = 1) => c!.valeur({ fournisseur: fo, stock });
    const voulu = (pct: number) => stockVoulu.map((s) => Math.round((s * pct) / 100));
    expect([a(caisse, 0), a(caisse, 100), a(caisse, 150)]).toEqual([0, 100, 150].map((p) => budget("faconnier", ventesDuBudget, voulu(p)).decaisse));
    expect([a(caisse, 0), a(caisse, 150)]).toEqual([61_218, 84_897]);
    expect([a(plafond, 0), a(plafond, 150, 3)]).toEqual([105_000, 105_000]);
    // Chez le façonnier, la marge ne bouge pas avec le stock voulu ; chez les fins de série, à peine.
    expect([a(marge, 0), a(marge, 150)]).toEqual([fac.marge, fac.marge]);
    expect([a(marge, 0, 3), a(marge, 100, 3)]).toEqual([budget("fins-de-serie", ventesDuBudget, voulu(0)).marge, fins.marge]);
    expect(a(caisse, 0, 3)).toBe(budget("fins-de-serie", ventesDuBudget, voulu(0)).decaisse);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : réviser le budget au rythme de janvier", () => {
  const s = REVISER_LE_BUDGET;
  const rythme = g.map((r) => 3 * r.ventesDuMois);
  const r = budget("faconnier", rythme);
  const initial = somme(g.map((x) => x.stockInitial * x.coutDAchat));
  const final = somme(g.map((x, i) => stockVoulu[i]! * x.coutDAchat));
  const vendues = somme(g.map((x, i) => rythme[i]! * x.coutDAchat));
  const sansReviser = initial + fac.achatsHt - vendues;

  it("est le cas dédié du chapitre, chez MAILLE & CO seule", () => {
    casDedie(s, BUDGET_DU_POINT_DE_VENTE);
    expect(s.commanditaire).toBe("La direction");
  });

  it("les ventes, les achats, la marge et la caisse révisés, refaits à la main", () => {
    expect(rythme).toEqual([1_800, 1_080, 270, 990, 450]);
    expect(attendus(s, "les-ventes-revisees")).toEqual({ "Articles à vendre au rythme de janvier": 4_590, "Ventes hors taxes révisées": 3 * janvier, "Écart sur le budget des ventes": 3 * janvier - fac.ventesHt });
    expect(attendus(s, "les-achats-revises")).toEqual({ "Articles à acheter": r.achats, "Achats hors taxes": r.achatsHt, "Marge commerciale budgétée": r.marge });
    expect([r.achats, r.achatsHt, r.marge]).toEqual([4_490, 116_295, 147_375]);
    expect(r.marge).toBe(3 * janvier - (initial + r.achatsHt - final));
    expect(attendus(s, "ce-que-paiera-la-caisse")).toEqual({ "Achats toutes taxes comprises": r.achatsTtc, "Décaissé dans le trimestre": r.decaisse, "Dû au façonnier au 31 mars": r.dette });
    expect([r.achatsTtc, r.decaisse]).toEqual([139_554, 69_777]);
  });

  it("le curseur des commandes : 12 045 € hors taxes de moins, pas les 27 500 € du chiffre d'affaires", () => {
    expect(COMMANDES_DU_CURSEUR).toEqual({ min: 0, max: 30_000 });
    expect([sansReviser, final]).toEqual([38_355, 26_310]);
    const k = sansReviser - final;
    expect(k).toBe(fac.achatsHt - r.achatsHt);
    expect(curseur(s, "les-commandes-au-curseur")).toEqual({
      attendu: 12_045,
      bornes: [0, 30_000],
      droites: [sansReviser, final, sansReviser - 30_000, final],
      lecture: {
        "Achats du trimestre, hors taxes": fac.achatsHt - k,
        "Valeur du stock au 31 mars": final,
        "Valeur du stock voulu": final,
        "Décaissé dans le trimestre": r.decaisse,
        "Stock en trop au 31 mars": 0,
      },
    });
  });

  it("le croisement : sans réviser, 480 articles en trop et 7 227 € décaissés pour rien", () => {
    expect(attendus(s, "sans-reviser")).toEqual({
      "Stock au 31 mars sans réviser": 1_160 + fac.achats - 4_590,
      "Articles en trop sur le stock voulu": 1_160 + fac.achats - 4_590 - 1_060,
      "Décaissé en trop dans le trimestre": fac.decaisse - r.decaisse,
    });
    expect(Object.values(attendus(s, "sans-reviser"))).toEqual([1_540, 480, 7_227]);
    expect(juste(s, "reponse")).toBe("Commandons 4 490 articles : 12 045 € hors taxes de moins");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

describe("la garde voit le chapitre", () => {
  it("budgetDuPointDeVente lit la fiche : ses chiffres sont ceux de la main", () => {
    const x = budgetDuPointDeVente(cas);
    expect([x.b.achatsHt, x.b.margeCommerciale, x.fins.decaisse, x.delaiQuiTient, x.aFaireParMois]).toEqual([fac.achatsHt, fac.marge, fins.decaisse, 36, 101_200]);
  });
});
