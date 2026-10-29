import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ACTIVITE_DE_LA_VARIANTE,
  ENTREPRISES_DES_ECARTS,
  LE_COUT_PREETABLI_ET_LES_BUDGETS,
  SEUIL_DE_SIGNIFICATIVITE,
  SURCONSOMMATION_DU_STANDARD_COURANT,
  LE_BUDGET_FLEXIBLE,
} from "../../src/config/cours/chapitres/le-cout-preetabli-et-les-budgets";
import { LES_ECARTS_SUR_CHARGES_DIRECTES, VARIANTE_A_REBOURS } from "../../src/config/cours/chapitres/les-ecarts-sur-charges-directes";
import { L_USINE_DE_NOVA } from "../../src/config/cours/monde/nova-usine";
import { CHAPITRES } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { LE_BUDGET_DEPASSE } from "../../src/config/cours/situations/par-chapitre/le-budget-depasse";
import { LE_FOURNISSEUR_OU_L_ATELIER } from "../../src/config/cours/situations/par-chapitre/le-fournisseur-ou-l-atelier";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE COÛT PRÉÉTABLI ET LES BUDGETS, LES ÉCARTS SUR CHARGES DIRECTES, ET LEURS CAS : À L'USINE DE
 * NOVA DU MONDE DU COURS.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche (monde/nova-usine.ts), sans passer
 * par les fonctions des chapitres ni par le modèle : les valeurs absolues sont épinglées, les
 * variantes (activité sous la normale, standard courant, calcul à rebours) refaites, les verdicts
 * épinglés. Les textes passent les gardes du pilote : rien d'indéfini, pas de « de le », pas de
 * tiret au milieu d'une phrase, des élisions faites, le signe moins, une seule bonne réponse,
 * aucune option qui en contient une autre, des libellés uniques, des notions qui existent, des
 * accords avec « enceinte ».
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "nova";
const cas = casDeLEntreprise(code);
const f = L_USINE_DE_NOVA;
const [nomade, salon] = f.modeles;
const r = f.realise;
const centime = (x: number) => Math.round(x * 100) / 100;
const dixieme = (x: number) => Math.round(x * 10) / 10;
const n = (x: number) => x.toLocaleString("fr-FR");
const eur = (x: number) => `${n(x)} €`;

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
      const g = e.grandeur?.(c);
      const rt = e.rates?.(c);
      const { attendu } = e.cible(c);
      return [e.titre, e.question(c), ...e.explication(c), g?.libelle ?? "", g?.unite ?? "", rt?.dessous ?? "", rt?.dessus ?? "", ...(e.zones ?? []), e.montrer ?? "", ...e.droites(c).libelles, ...e.lecture(c, attendu).map((l) => l.libelle)];
    }
    case "simulation": {
      const leviers = e.leviers(c);
      const d = e.defi(c);
      const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
      return [e.titre, e.question(c), d.consigne, d.indice(depart), ...e.explication(c, d.solution), e.montrer ?? "", ...leviers.flatMap((l) => [l.libelle, l.unite]), ...e.lecture(c, depart).map((l) => l.libelle)];
    }
    default:
      return [e.titre];
  }
}

/** Un laboratoire, refait à la main : la lecture au départ et à la solution, le défi relevé par la solution seule. */
function laboratoire(ch: Chapitre, id: string, attendu: { depart: Record<string, number>; solution: Record<string, number>; auDepart: Record<string, number>; aLaSolution: Record<string, number> }) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e?.type, `${ch.code} : ${id}`).toBe("simulation");
  const leviers = e.leviers(cas);
  const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
  const d = e.defi(cas);
  expect(depart).toEqual(attendu.depart);
  expect(d.solution).toEqual(attendu.solution);
  expect(d.atteint(d.solution)).toBe(true);
  expect(d.atteint(depart)).toBe(false);
  const lu = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  expect(lu(depart)).toEqual(attendu.auDepart);
  expect(lu(d.solution)).toEqual(attendu.aLaSolution);
  // La colonne « Au départ » montre bien la lecture du départ.
  for (const l of e.lecture(cas, d.solution)) if (l.reference !== undefined) expect(l.reference, l.libelle).toBe(attendu.auDepart[l.libelle]);
  return { e, d, depart };
}

/**
 * Un curseur, refait à la main : l'attendu, les bornes, les deux droites aux bornes et à l'attendu,
 * la lecture à l'attendu, et la réponse unique (un pas plus loin, le produit ne couvre plus le coût).
 */
function curseur(ch: Chapitre, id: string, attendu: { attendu: number; min: number; max: number; bornes: [number, number, number, number]; lecture: Record<string, number> }) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e?.type, `${ch.code} : ${id}`).toBe("curseur");
  const k = e.cible(cas);
  expect({ attendu: k.attendu, min: k.min, max: k.max }).toEqual({ attendu: attendu.attendu, min: attendu.min, max: attendu.max });
  const d = e.droites(cas);
  expect([d.produit(k.min!), d.cout(k.min!), d.produit(k.max), d.cout(k.max)]).toEqual(attendu.bornes);
  const couvre = (x: number) => d.produit(x) - d.cout(x) >= -1e-9;
  expect(couvre(k.attendu)).toBe(true);
  expect(couvre(e.sens === "plus-grande" ? k.attendu + 1 : k.attendu - 1)).toBe(false);
  // Les droites sont affines : le milieu des bornes est le milieu des valeurs.
  const mi = (k.min! + k.max) / 2;
  expect(d.produit(mi)).toBeCloseTo((d.produit(k.min!) + d.produit(k.max)) / 2, 6);
  expect(d.cout(mi)).toBeCloseTo((d.cout(k.min!) + d.cout(k.max)) / 2, 6);
  expect(Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant]))).toEqual(attendu.lecture);
  // L'expérience vient avant les calculs qu'elle éclaire, et un pari la précède dans un chapitre.
  return ch.etapes.indexOf(e);
}

const rang = (ch: Chapitre, id: string) => ch.etapes.findIndex((e) => e.id === id);

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "consommé", "acheté"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles du pilote). */
function verifierLesTextes(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix) (enceintes?|trimestres?|heures?|kilos?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(nomades?|salons?) (vendu|fabriqué|produit)s?\b(?!e)/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/À venir/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
    }
    if (e.type === "tri") {
      const codes = new Set(e.categories.map((k) => k.code));
      for (const x of e.elements(cas)) expect(codes.has(x.categorie), `${e.id} : ${x.libelle}`).toBe(true);
      expect(new Set(e.elements(cas).map((x) => x.libelle)).size, e.id).toBe(e.elements(cas).length);
    }
    for (const no of e.notions ?? []) expect(notions.has(no), `${e.id} : ${no}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Ce qu'un cas dédié doit tenir (tests/cours/situations.test.ts), et sa réponse qui ne se devine pas à sa longueur. */
function casDedie(s: Situation, ch: Chapitre) {
  expect(s.reprend).toEqual([ch.code]);
  expect(casDuChapitre(ch.code)).toBe(s);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.libre).toBe(false);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes[0]!.tableau, "la question se lit avec ses documents").toBeDefined();
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
  for (const e of s.etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, etatVide);
    const juste = options.find((o) => o.juste)!;
    const plusLongue = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
    expect(juste.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(plusLongue);
  }
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  return Object.fromEntries(e.champs(cas, etatVide).map((c) => [c.libelle, c.attendu]));
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

/** Le chapitre se donne en trois temps, avec au moins deux étapes d'expert : celles que son en-tête nomme. */
function aSesEtapes(ch: Chapitre, ids: readonly string[]) {
  for (const id of ids) expect(ch.etapes.some((e) => e.id === id), `${ch.code} : ${id}`).toBe(true);
}

// La fiche, refaite à la main : standards, coût standard de l'heure-machine, coûts préétablis.
const cHm = 16 + 120_000 / 5_000;
const coutNomade = 0.8 * 15 + 0.4 * 25 + 0.25 * cHm;
const coutSalon = 2 * 15 + 1 * 25 + 0.5 * cHm;
const budgetStandard = 12_000 * coutNomade + 4_000 * coutSalon;
const preetabliDuReel = 11_000 * coutNomade + 4_600 * coutSalon;
const reelMatiere = centime(18_500 * 15.4);
const reelMOD = 8_800 * 26;
const reelTotal = reelMatiere + reelMOD + 213_000;
const kilosPreetablis = 11_000 * 0.8 + 4_600 * 2;
const heuresPreetablies = 11_000 * 0.4 + 4_600 * 1;

describe("la fiche de NOVA est celle que les chapitres supposent", () => {
  it("standards, quantités et réel du trimestre", () => {
    expect(ENTREPRISES_DES_ECARTS).toEqual(["nova"]);
    expect(f.entreprise).toBe(cas.entreprise);
    expect([nomade!.matiereParUnite, nomade!.heuresParUnite, nomade!.heuresMachineParUnite, nomade!.prixPrevu, nomade!.quantitePrevue]).toEqual([0.8, 0.4, 0.25, 59, 12_000]);
    expect([salon!.matiereParUnite, salon!.heuresParUnite, salon!.heuresMachineParUnite, salon!.prixPrevu, salon!.quantitePrevue]).toEqual([2, 1, 0.5, 119, 4_000]);
    expect([f.prixStandardDuKilo, f.tauxHoraireStandard, f.centre.activiteNormale, f.centre.coutVariableParHeure, f.centre.chargesFixes]).toEqual([15, 25, 5_000, 16, 120_000]);
    expect([r.ventes.nomade.quantite, r.ventes.salon.quantite, r.matiere.kilos, r.matiere.prixDuKilo, r.mainDOeuvre.heures, r.mainDOeuvre.tauxHoraire, r.centre.heuresMachine, r.centre.cout]).toEqual([
      11_000, 4_600, 18_500, 15.4, 8_800, 26, 5_200, 213_000,
    ]);
    expect([cHm, coutNomade, coutSalon, budgetStandard, preetabliDuReel, reelTotal]).toEqual([40, 32, 75, 684_000, 697_000, 726_700]);
    expect([SEUIL_DE_SIGNIFICATIVITE, ACTIVITE_DE_LA_VARIANTE, SURCONSOMMATION_DU_STANDARD_COURANT]).toEqual([0.03, 4_600, 0.025]);
    expect(VARIANTE_A_REBOURS).toEqual({ ecartSurQuantite: -1_500, ecartSurPrix: 5_370 });
  });
});

describe("le coût préétabli, le budget standard et le budget flexible", () => {
  const ch = LE_COUT_PREETABLI_ET_LES_BUDGETS;

  it("est inscrit au registre, et se donne en trois temps", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    // Découpé en deux (aucun chapitre de plus de 20 étapes) : le centre et le choix du standard forment la suite.
    expect(CHAPITRES).toContain(LE_BUDGET_FLEXIBLE);
    expect(LE_BUDGET_FLEXIBLE.prerequis).toEqual([ch.code]);
    aSesEtapes(ch, ["predire-la-production", "experience-production", "laboratoire-production", "heure-machine", "fiche", "budget-standard", "cout-reel", "a-quoi-comparer", "ecart-global", "synthese"]);
    aSesEtapes(LE_BUDGET_FLEXIBLE, ["intro", "predire-l-activite", "experience-activite", "budget-flexible", "flexible-ou-preetabli", "variante-activite", "standard-courant", "quel-standard", "seuil", "gestion-par-exception", "synthese"]);
    for (const partie of [ch, LE_BUDGET_FLEXIBLE]) {
      expect(partie.etapes[0]!.type).toBe("lecture");
      const synthese = partie.etapes.at(-1)!;
      if (synthese.type !== "lecture") throw new Error("la synthèse n'est pas une lecture");
      expect(synthese.texte(cas).at(-1), partie.code).toBe("Dans l'arène, les chiffres de votre usine seront différents : la notion, elle, est la même.");
    }
  });

  it("le coût standard de l'heure-machine et la fiche de chaque enceinte", () => {
    expect(attendus(ch, "heure-machine")).toEqual({ "Charges fixes par heure-machine": 24, "Coût standard de l'heure-machine": 40 });
    expect(attendus(ch, "fiche")).toEqual({
      "Matière d'une Nomade": 12,
      "Main-d'œuvre directe d'une Nomade": 10,
      "Centre de montage d'une Nomade": 10,
      "Coût préétabli d'une Nomade": 32,
      "Coût préétabli d'une Salon": 75,
      "Marge préétablie d'une Nomade": 59 - 32,
      "Marge préétablie d'une Salon": 119 - 75,
    });
  });

  it("budget standard, préétabli de la production réelle, réel et écart global : le piège des 42 700 €", () => {
    expect(attendus(ch, "budget-standard")).toEqual({ "Budget standard": 684_000, "Coût préétabli de la production réelle": 697_000 });
    expect(attendus(ch, "cout-reel")).toEqual({ "Coût réel de la matière": 284_900, "Coût réel de la main-d'œuvre directe": 228_800, "Coût réel total de la production": 726_700 });
    expect(attendus(ch, "ecart-global")).toEqual({
      "Réel moins budget standard": reelTotal - budgetStandard,
      "Effet des quantités produites": preetabliDuReel - budgetStandard,
      "Écart global sur coûts": reelTotal - preetabliDuReel,
    });
    expect([reelTotal - budgetStandard, preetabliDuReel - budgetStandard, reelTotal - preetabliDuReel]).toEqual([42_700, 13_000, 29_700]);
    // Moins d'enceintes que prévu, mais plus de Salon : le préétabli de la production réelle monte.
    expect(11_000 + 4_600).toBeLessThan(12_000 + 4_000);
    expect(juste(ch, "a-quoi-comparer")).toBe("Au coût préétabli de la production réelle : la même production, au standard");
  });

  it("budget flexible contre coût préétabli de l'activité réelle : 203 200 € contre 208 000 €", () => {
    const flexible = 120_000 + 16 * 5_200;
    expect(attendus(LE_BUDGET_FLEXIBLE, "budget-flexible")).toEqual({
      "Budget flexible de l'activité réelle": flexible,
      "Coût préétabli de l'activité réelle": 40 * 5_200,
      "Budget flexible moins coût préétabli de l'activité réelle": flexible - 40 * 5_200,
    });
    expect([flexible, 40 * 5_200, flexible - 40 * 5_200]).toEqual([203_200, 208_000, -4_800]);
    expect(juste(LE_BUDGET_FLEXIBLE, "flexible-ou-preetabli")).toBe("Les fixes ne bougent pas au budget flexible, mais le coût préétabli en impute à chaque heure");
  });

  it("variante : un centre à 4 600 heures-machine, sous son activité normale", () => {
    const h = 4_600;
    expect(attendus(LE_BUDGET_FLEXIBLE, "variante-activite")).toEqual({
      [`Budget flexible à ${n(h)} heures-machine`]: 120_000 + 16 * h,
      [`Coût préétabli de ${n(h)} heures-machine`]: 40 * h,
      "Écart sur activité de la variante": (5_000 - h) * 24,
    });
    expect([120_000 + 16 * h, 40 * h, (5_000 - h) * 24]).toEqual([193_600, 184_000, 9_600]);
  });

  it("variante : un standard courant, 2,5 % de matière en plus par enceinte", () => {
    const kilos = 11_000 * 0.82 + 4_600 * 2.05;
    expect(kilos).toBeCloseTo(18_450, 6);
    expect(attendus(LE_BUDGET_FLEXIBLE, "standard-courant")).toEqual({
      "Kilos préétablis au standard courant": 18_450,
      "Écart sur quantité au standard courant": (18_500 - 18_450) * 15,
      "Écart global sur coûts au standard courant": reelTotal - (preetabliDuReel + 450 * 15),
    });
    expect(reelTotal - (preetabliDuReel + 450 * 15)).toBe(22_950);
    expect(juste(LE_BUDGET_FLEXIBLE, "quel-standard")).toBe("Le standard normal : atteignable, il laisse voir les gaspillages");
  });

  it("le seuil de significativité : la matière et le centre au-dessus de 3 %, la main-d'œuvre en dessous, qui cache ses deux écarts", () => {
    expect(attendus(LE_BUDGET_FLEXIBLE, "seuil")).toEqual({
      "Part de l'écart, matière (%)": dixieme((14_900 / 270_000) * 100),
      "Part de l'écart, main-d'œuvre directe (%)": dixieme((3_800 / 225_000) * 100),
      "Part de l'écart, centre de montage (%)": dixieme((11_000 / 202_000) * 100),
    });
    expect([dixieme((14_900 / 270_000) * 100), dixieme((3_800 / 225_000) * 100), dixieme((11_000 / 202_000) * 100)]).toEqual([5.5, 1.7, 5.4]);
    // L'écart sur taux dépasse à lui seul le seuil que le global ne passe pas.
    expect(8_800).toBeGreaterThan(0.03 * 225_000);
    expect(juste(LE_BUDGET_FLEXIBLE, "gestion-par-exception")).toBe("Pas sur son seul écart global : deux écarts de sens contraire peuvent s'y compenser");
  });

  it("les expériences : la production qui rejoint le budget, le centre qui croise son budget flexible", () => {
    // À 11 000 Nomade (352 000 €), la Salon à 75 € rejoint 684 000 € dès 4 427 : (684 000 − 352 000) ÷ 75 = 4 426,67.
    expect(Math.ceil((684_000 - 11_000 * 32) / 75)).toBe(4_427);
    const iProd = curseur(ch, "experience-production", {
      attendu: 4_427,
      min: 3_000,
      max: 5_000,
      bornes: [11_000 * 32 + 3_000 * 75, 684_000, 11_000 * 32 + 5_000 * 75, 684_000],
      lecture: { "Coût préétabli de la production": 11_000 * 32 + 4_427 * 75, "Budget standard": 684_000, "Effet des quantités produites": 11_000 * 32 + 4_427 * 75 - 684_000 },
    });
    expect(rang(ch, "predire-la-production")).toBe(iProd - 1);
    expect(iProd).toBeLessThan(rang(ch, "trois-references"));
    expect(iProd).toBeLessThan(rang(ch, "budget-standard"));
    expect(juste(ch, "predire-la-production")).toBe("Plus que le budget standard");
    // Coût préétabli 40 × h, budget flexible 120 000 + 16 × h : ils se croisent à 120 000 ÷ 24 = 5 000.
    const iAct = curseur(LE_BUDGET_FLEXIBLE, "experience-activite", {
      attendu: 5_000,
      min: 4_000,
      max: 6_000,
      bornes: [40 * 4_000, 120_000 + 16 * 4_000, 40 * 6_000, 120_000 + 16 * 6_000],
      lecture: { "Coût préétabli des heures": 200_000, "Budget flexible": 200_000, "Charges fixes imputées": 120_000, "Budget flexible moins coût préétabli": 0 },
    });
    expect(rang(LE_BUDGET_FLEXIBLE, "predire-l-activite")).toBe(iAct - 1);
    expect(iAct).toBeLessThan(rang(LE_BUDGET_FLEXIBLE, "budget-flexible"));
    expect(juste(LE_BUDGET_FLEXIBLE, "predire-l-activite")).toBe("Plus que le budget flexible");
  });

  it("le laboratoire : une autre production qui vaut le budget standard", () => {
    const pre = (nn: number, ss: number) => ({ m: nn * 12 + ss * 30, o: nn * 10 + ss * 25, c: nn * 10 + ss * 20, t: nn * 32 + ss * 75, marge: nn * 27 + ss * 44 });
    const a = pre(11_000, 4_600);
    const b = pre(10_600, 4_600);
    expect([a.t, b.t, b.marge]).toEqual([697_000, 684_200, 488_600]);
    const lecture = (x: typeof a) => ({
      "Matière au coût préétabli": x.m,
      "Main-d'œuvre directe au coût préétabli": x.o,
      "Centre au coût préétabli": x.c,
      "Coût préétabli de la production": x.t,
      "Budget standard": 684_000,
      "Production moins budget standard": x.t - 684_000,
      "Marge préétablie de la production": x.marge,
      "Marge préétablie prévue": 12_000 * 27 + 4_000 * 44,
    });
    const { e, d } = laboratoire(ch, "laboratoire-production", {
      depart: { nomade: 11_000, salon: 4_600 },
      solution: { nomade: 10_600, salon: 4_600 },
      auDepart: lecture(a),
      aLaSolution: lecture(b),
    });
    // La production du budget elle-même ne relève pas le défi, ni une production à plus de 500 € du budget.
    expect(d.atteint({ nomade: 12_000, salon: 4_000 })).toBe(false);
    expect(d.atteint({ nomade: 10_700, salon: 4_600 })).toBe(false);
    expect(e.leviers(cas).map((l) => [l.min, l.max, l.pas])).toEqual([
      [8_000, 15_000, 100],
      [0, 7_000, 100],
    ]);
    expect(rang(ch, "laboratoire-production")).toBeGreaterThan(rang(ch, "ecart-global"));
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(ch));
});

describe("le cas : le budget dépassé", () => {
  const s = LE_BUDGET_DEPASSE;
  const ch = LE_COUT_PREETABLI_ET_LES_BUDGETS;

  it("a la forme d'un cas dédié", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le directeur de l'usine");
  });

  it("refait les calculs du chapitre sur les chiffres du directeur", () => {
    expect(attendus(s, "fiche")).toEqual({ "Coût standard de l'heure-machine": 40, "Coût préétabli d'une Nomade": 32, "Coût préétabli d'une Salon": 75 });
    expect(attendus(s, "production-reelle")).toEqual({ "Coût préétabli de la production réelle": 697_000, "Effet des quantités produites": 13_000, "Écart global sur coûts": 29_700 });
    expect(attendus(s, "par-poste")).toEqual({
      "Écart global sur matière": 284_900 - kilosPreetablis * 15,
      "Écart global sur main-d'œuvre directe": 228_800 - heuresPreetablies * 25,
      "Écart global sur le centre de montage": 213_000 - (11_000 * 10 + 4_600 * 20),
    });
    expect([284_900 - kilosPreetablis * 15, 228_800 - heuresPreetablies * 25, 213_000 - (11_000 * 10 + 4_600 * 20)]).toEqual([14_900, 3_800, 11_000]);
  });

  it("reprend l'expérience de la production, sans sa leçon, avant la question sur la composition", () => {
    const i = curseur(s, "experience-production", {
      attendu: 4_427,
      min: 3_000,
      max: 5_000,
      bornes: [577_000, 684_000, 727_000, 684_000],
      lecture: { "Coût préétabli de la production": 684_025, "Budget standard": 684_000, "Effet des quantités produites": 25 },
    });
    expect(i).toBeLessThan(rang(s, "moins-d-enceintes"));
    const e = s.etapes[i] as EtapeCurseur;
    expect(e.explication(cas)).toHaveLength(1);
  });

  it("les verdicts : la composition explique le préétabli, et la réponse annonce l'écart global", () => {
    // 1 000 Nomade de moins à 32 €, 600 Salon de plus à 75 € : +13 000 €.
    expect(-1_000 * 32 + 600 * 75).toBe(13_000);
    expect(juste(s, "moins-d-enceintes")).toBe("Plus de Salon, la plus coûteuse, à la place d'autres enceintes");
    expect(juste(s, "reponse")).toBe(`Annoncez ${eur(29_700)} d'écart, à creuser sur la matière et le centre`);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(s));
});

describe("les écarts sur charges directes", () => {
  const ch = LES_ECARTS_SUR_CHARGES_DIRECTES;

  it("est inscrit au registre, et se donne en trois temps", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    aSesEtapes(ch, ["predire-la-matiere", "experience-matiere", "predire-la-main-d-oeuvre", "experience-main-d-oeuvre", "laboratoire-charges-directes", "quantites-preetablies", "ecart-global-matiere", "prix-et-quantite", "ecart-mod", "global-faible", "qui-agit", "la-somme", "ecart-mixte", "place-du-mixte", "a-rebours", "interdependance", "la-prime", "synthese"]);
    const synthese = ch.etapes.at(-1)!;
    if (synthese.type !== "lecture") throw new Error("la synthèse n'est pas une lecture");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre usine seront différents : la notion, elle, est la même.");
  });

  it("matière : écart global, sur prix, sur quantité", () => {
    expect(attendus(ch, "quantites-preetablies")).toEqual({ "Kilos préétablis de la production réelle": kilosPreetablis, "Heures préétablies de la production réelle": heuresPreetablies });
    expect([kilosPreetablis, heuresPreetablies]).toEqual([18_000, 9_000]);
    expect(attendus(ch, "ecart-global-matiere")).toEqual({ "Coût préétabli de la matière": 270_000, "Coût réel de la matière": 284_900, "Écart global sur matière": 14_900 });
    const prix = centime((15.4 - 15) * 18_500);
    const quantite = (18_500 - 18_000) * 15;
    expect(attendus(ch, "prix-et-quantite")).toEqual({ "Écart sur prix de la matière": prix, "Écart sur quantité de matière": quantite });
    expect([prix, quantite, prix + quantite]).toEqual([7_400, 7_500, 14_900]);
  });

  it("main-d'œuvre directe : un global de 3 800 € qui cache 8 800 € défavorable et 5 000 € favorable", () => {
    const taux = (26 - 25) * 8_800;
    const temps = (8_800 - 9_000) * 25;
    expect(attendus(ch, "ecart-mod")).toEqual({ "Écart global sur main-d'œuvre directe": 228_800 - 225_000, "Écart sur taux": taux, "Écart sur temps": temps });
    expect([taux, temps, taux + temps]).toEqual([8_800, -5_000, 3_800]);
    expect(juste(ch, "global-faible")).toBe("Rien encore : deux écarts de sens contraire peuvent s'y compenser");
  });

  it("qui doit agir, et la somme des quatre écarts avec leur signe", () => {
    const tri = ch.etapes.find((e) => e.id === "qui-agit") as EtapeTri;
    expect(tri.elements(cas).map((x) => [x.categorie, x.montant])).toEqual([
      ["achats", 7_400],
      ["atelier", 7_500],
      ["rh", 8_800],
      ["atelier", 5_000],
    ]);
    expect(7_400 + 7_500 + 8_800 - 5_000).toBe(18_700);
    expect(juste(ch, "la-somme")).toBe(`${eur(18_700)} défavorable, chaque écart pris avec son signe`);
  });

  it("l'écart mixte, compris dans l'écart sur prix", () => {
    const pur = centime(0.4 * 18_000);
    const mixte = centime(0.4 * 500);
    expect(attendus(ch, "ecart-mixte")).toEqual({ "Écart sur prix pur": pur, "Écart mixte": mixte, "Prix pur, quantité et mixte réunis": 14_900 });
    expect([pur, mixte, pur + mixte]).toEqual([7_200, 200, 7_400]);
    expect(juste(ch, "place-du-mixte")).toBe("Pour juger l'atelier au prix standard : il ne maîtrise pas le prix d'achat");
  });

  it("à rebours : 17 900 kilos à 15,30 €, retrouvés à partir de deux écarts", () => {
    const kilos = 18_000 + -1_500 / 15;
    const prix = centime(15 + 5_370 / kilos);
    expect([kilos, prix]).toEqual([17_900, 15.3]);
    // Le prix retrouvé redonne exactement l'écart sur prix transmis.
    expect(centime((prix - 15) * kilos)).toBe(5_370);
    expect(attendus(ch, "a-rebours")).toEqual({ "Kilos réellement consommés": kilos, "Prix réel du kilo": prix, "Écart global sur matière de la variante": centime(kilos * prix - 270_000) });
    expect(centime(kilos * prix - 270_000)).toBe(3_870);
  });

  it("l'interdépendance : l'atelier gagne 200 heures et gâche 500 kilos", () => {
    expect(attendus(ch, "interdependance")).toEqual({ "Écart sur temps en heures": 8_800 - 9_000, "Kilos consommés en trop": 18_500 - 18_000, "Effet net de l'atelier": 7_500 - 5_000 });
    expect(juste(ch, "la-prime")).toBe("Juger l'atelier sur ses deux écarts ensemble, temps et matière");
  });

  it("les expériences : au plus 17 532 kilos au prix réel, au plus 8 653 heures au taux réel", () => {
    expect([Math.floor(270_000 / 15.4), Math.floor(225_000 / 26)]).toEqual([17_532, 8_653]);
    const iMat = curseur(ch, "experience-matiere", {
      attendu: 17_532,
      min: 16_500,
      max: 19_000,
      bornes: [270_000, centime(16_500 * 15.4), 270_000, centime(19_000 * 15.4)],
      lecture: {
        "Coût réel de la matière": centime(17_532 * 15.4),
        "Coût préétabli de la matière": 270_000,
        "Écart sur prix": centime(0.4 * 17_532),
        "Écart sur quantité": (17_532 - 18_000) * 15,
        "Écart global sur matière": centime(17_532 * 15.4 - 270_000),
      },
    });
    expect([centime(0.4 * 17_532), (17_532 - 18_000) * 15, centime(17_532 * 15.4 - 270_000)]).toEqual([7_012.8, -7_020, -7.2]);
    expect(rang(ch, "predire-la-matiere")).toBe(iMat - 1);
    expect(iMat).toBeLessThan(rang(ch, "decomposer"));
    expect(juste(ch, "predire-la-matiere")).toBe(`Moins que les ${n(18_000)} kilos préétablis`);
    const iMod = curseur(ch, "experience-main-d-oeuvre", {
      attendu: 8_653,
      min: 8_000,
      max: 9_500,
      bornes: [225_000, 8_000 * 26, 225_000, 9_500 * 26],
      lecture: {
        "Coût réel de la main-d'œuvre directe": 8_653 * 26,
        "Coût préétabli de la main-d'œuvre directe": 225_000,
        "Écart sur taux": 8_653,
        "Écart sur temps": (8_653 - 9_000) * 25,
        "Écart global sur main-d'œuvre directe": 8_653 * 26 - 225_000,
      },
    });
    expect(rang(ch, "predire-la-main-d-oeuvre")).toBe(iMod - 1);
    expect(iMod).toBeLessThan(rang(ch, "ecart-mod"));
    expect(juste(ch, "predire-la-main-d-oeuvre")).toBe("Non : la hausse du taux l'emporte sur les heures gagnées");
  });

  it("le laboratoire : un écart global nul avec un kilo plus cher que le standard", () => {
    const lecture = (prix: number, kilos: number, taux: number, heures: number) => {
      const ep = centime((prix - 15) * kilos);
      const eq = (kilos - 18_000) * 15;
      const et = (taux - 25) * heures;
      const eh = (heures - 9_000) * 25;
      return {
        "Coût réel des charges directes": centime(prix * kilos + taux * heures),
        "Coût préétabli des charges directes": 270_000 + 225_000,
        "Effet du prix du kilo": -ep + 0,
        "Effet des kilos consommés": -eq + 0,
        "Effet du taux horaire": -et + 0,
        "Effet des heures": -eh + 0,
        "Effet total sur le résultat": -(ep + eq + et + eh) + 0,
      };
    };
    expect(lecture(15.4, 18_500, 26, 8_800)["Effet total sur le résultat"]).toBe(-18_700);
    // 750 kilos gâchés (11 250 €) et la hausse du kilo (7 500 €) compensés par 750 heures gagnées (18 750 €).
    expect(lecture(15.4, 18_750, 25, 8_250)).toMatchObject({ "Coût réel des charges directes": 495_000, "Effet total sur le résultat": 0, "Effet des heures": 18_750 });
    const { d } = laboratoire(ch, "laboratoire-charges-directes", {
      depart: { prix: 15.4, kilos: 18_500, taux: 26, heures: 8_800 },
      solution: { prix: 15.4, kilos: 18_750, taux: 25, heures: 8_250 },
      auDepart: lecture(15.4, 18_500, 26, 8_800),
      aLaSolution: lecture(15.4, 18_750, 25, 8_250),
    });
    // Tout au standard donne aussi zéro, mais le défi exige un kilo plus cher.
    expect(d.atteint({ prix: 15, kilos: 18_000, taux: 25, heures: 9_000 })).toBe(false);
    expect(rang(ch, "laboratoire-charges-directes")).toBeLessThan(rang(ch, "interdependance"));
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(ch));
});

describe("le cas : le fournisseur ou l'atelier", () => {
  const s = LE_FOURNISSEUR_OU_L_ATELIER;
  const ch = LES_ECARTS_SUR_CHARGES_DIRECTES;

  it("a la forme d'un cas dédié", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("La responsable des achats");
  });

  it("refait la décomposition, l'écart mixte et le prix à rebours", () => {
    expect(attendus(s, "global")).toEqual({ "Kilos préétablis de la production réelle": 18_000, "Coût préétabli de la matière": 270_000, "Écart global sur matière": 14_900 });
    expect(attendus(s, "decomposition")).toEqual({ "Écart sur prix de la matière": 7_400, "Écart sur quantité de matière": 7_500, "Part de l'écart sur prix (%)": dixieme((7_400 / 14_900) * 100) });
    expect(dixieme((7_400 / 14_900) * 100)).toBe(49.7);
    expect(attendus(s, "mixte")).toEqual({ "Écart sur prix pur": 7_200, "Écart mixte": 200, "Surcoût matière si l'atelier avait tenu son standard": 18_000 * 15.4 - 270_000 });
    const prix = centime(270_000 / 18_500);
    expect(attendus(s, "a-rebours")).toEqual({ "Prix du kilo qui effacerait l'écart global": prix, "Baisse à obtenir sur le prix payé": centime(15.4 - prix) });
    // Il faudrait payer moins que le standard : le prix paierait le gaspillage.
    expect([prix, centime(15.4 - prix)]).toEqual([14.59, 0.81]);
    expect(prix).toBeLessThan(15);
  });

  it("le prix du kilo au curseur : au plus 1 459 centimes, et l'écart sur quantité ne bouge pas", () => {
    expect(Math.floor((270_000 * 100) / 18_500)).toBe(1_459);
    const i = curseur(s, "prix-au-curseur", {
      attendu: 1_459,
      min: 1_400,
      max: 1_560,
      bornes: [270_000, 18_500 * 14, 270_000, centime(18_500 * 15.6)],
      lecture: {
        "Coût réel de la matière": centime(18_500 * 14.59),
        "Coût préétabli de la matière": 270_000,
        "Écart sur prix": centime((14.59 - 15) * 18_500),
        "Écart sur quantité": 7_500,
        "Écart global sur matière": centime(18_500 * 14.59 - 270_000),
      },
    });
    expect([centime(18_500 * 14.59), centime((14.59 - 15) * 18_500)]).toEqual([269_915, -7_585]);
    expect(i).toBeLessThan(rang(s, "a-rebours"));
  });

  it("la réponse : renégocier ne suffit pas, l'atelier doit agir", () => {
    expect(juste(s, "reponse")).toBe("Renégociez, mais l'atelier doit agir aussi : ses kilos en trop pèsent autant");
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(s));
});
