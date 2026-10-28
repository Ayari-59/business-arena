import { expect } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { lireLeCurseur, lireLeLaboratoire } from "../../src/pedagogy/cours/chapitre-servi";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES GARDES COMMUNES DES CHAPITRES ET DES CAS DE GESTION ET FINANCE DU BAC STMG, passés sur le
 * monde du cours (monde/comptes-du-lycee.ts) : NOVA seule, une seule bonne réponse, les notions qui
 * existent, des textes propres (ni « undefined », ni « de le », ni tiret au milieu d'une phrase, ni
 * « -12 € », ni un nombre écrit en lettres, ni l'arène avant la dernière étape), un curseur dont la
 * position attendue est la frontière, et un laboratoire dont le départ ne relève pas le défi et dont
 * la solution le relève, lus comme le serveur les lit (chapitre-servi.ts).
 */

export const NOVA = casDeLEntreprise("nova");
export const VIDE: EtatDuCours = { soldes: {} };

/** Tout ce qu'une étape montre à l'élève. */
export function textesDe(ch: Chapitre, e: Etape, i: number, cas: Cas = NOVA): string[] {
  const etat = etatAvant(ch, cas, i);
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  const t: string[] = [e.titre, ...tableau];
  switch (e.type) {
    case "lecture":
      t.push(...e.texte(cas), e.repere?.(cas) ?? "");
      break;
    case "choix":
      t.push(e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]));
      break;
    case "montants":
      t.push(e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul]), ...e.explication(cas, etat));
      break;
    case "tri":
      t.push(e.question(cas), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas));
      break;
    case "curseur": {
      const r = e.rates?.(cas);
      t.push(e.question(cas), r?.dessous ?? "", r?.dessus ?? "", ...(e.zones ?? []), ...e.droites(cas).libelles, ...e.lecture(cas, e.cible(cas).attendu).map((l) => l.libelle), ...e.explication(cas));
      break;
    }
    case "simulation": {
      const leviers = e.leviers(cas);
      const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
      const d = e.defi(cas);
      t.push(e.question(cas), ...leviers.map((l) => l.libelle), d.consigne, d.indice(depart), ...e.lecture(cas, d.solution).map((l) => l.libelle), ...e.explication(cas, d.solution));
      break;
    }
    default:
      break;
  }
  return t;
}

/** Les fautes que la composition des textes produit. */
const FAUTES: [string, RegExp][] = [
  ["valeur absente", /undefined|NaN|Infinity|\[object/],
  // « de le compte », « à les clients » ; pas « de les enchaîner », où « les » est un pronom.
  ["contraction manquée", /(?<!\p{L})(?:de|à) [Ll]es? (?!\p{L}+(?:er|ir|re)\b)\p{L}/u],
  ["tiret au milieu d'une phrase", / [-–—] /],
  ["élision manquée", /(^|[\s'(])(de|que) [AEIOUYÉaeiouyé](?![a-zé]*-)/],
  ["signe moins de traits d'union", /(^|[\s(])-\d/],
  ["nombre en lettres", /\b(vingt|trente|quarante|cinquante|soixante|quatre-vingts?)\b/i],
];

/** Les gardes de texte, de réponse unique et de notions, dans NOVA ; et l'arène seulement à la dernière étape. */
export function gardesDeTexte(source: Chapitre) {
  expect(source.entreprises?.codes, source.code).toEqual(["nova"]);
  const ch = chapitreDuCas(source, NOVA);
  const codes = new Set(CONCEPTS.map((x) => x.code));
  const derniere = ch.etapes.at(-1)!.id;
  for (const [i, e] of ch.etapes.entries()) {
    for (const x of textesDe(ch, e, i)) {
      for (const [nom, re] of FAUTES) expect(x, `${e.id} · ${nom} : ${x}`).not.toMatch(re);
      if (e.id !== derniere) expect(x, `${e.id} : l'arène avant la dernière étape`).not.toMatch(/\barène\b/i);
    }
    if (e.type === "choix") expect(e.options(NOVA, etatAvant(ch, NOVA, i)).filter((o) => o.juste), e.id).toHaveLength(1);
    for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
  }
}

/** L'étape d'un chapitre, de son type. */
export function etape<T extends Etape["type"]>(ch: Chapitre, id: string, type: T): Extract<Etape, { type: T }> {
  const e = ch.etapes.find((x) => x.id === id);
  if (e?.type !== type) throw new Error(`Pas d'étape ${type} ${id}`);
  return e as Extract<Etape, { type: T }>;
}

/**
 * Le curseur : sa position attendue est dans ses bornes, et c'est la frontière ; de son côté, le
 * produit couvre le coût ; un pas plus loin, il ne le couvre plus. Le serveur lit la même chose.
 */
export function gardeDuCurseur(ch: Chapitre, id: string, attendu: number) {
  const e = etape(ch, id, "curseur");
  const cible = e.cible(NOVA);
  expect(cible.attendu, id).toBe(attendu);
  expect(attendu).toBeGreaterThanOrEqual(cible.min ?? 0);
  expect(attendu).toBeLessThanOrEqual(cible.max);
  const d = e.droites(NOVA);
  const couvre = (q: number) => d.produit(q) >= d.cout(q) - 1e-9;
  const pas = e.sens === "plus-grande" ? 1 : -1;
  expect(couvre(attendu), `${id} à ${attendu}`).toBe(true);
  expect(couvre(attendu + pas), `${id} à ${attendu + pas}`).toBe(false);
  expect(lireLeCurseur(e, NOVA, attendu).lignes).toEqual(e.lecture(NOVA, attendu));
  return e;
}

/** Le laboratoire : le départ ne relève pas le défi, la solution le relève, et elle est dans les bornes. */
export function gardeDuLaboratoire(ch: Chapitre, id: string) {
  const e = etape(ch, id, "simulation");
  const leviers = e.leviers(NOVA);
  const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
  const d = e.defi(NOVA);
  expect(d.atteint(depart), `${id} : le départ relève déjà le défi`).toBe(false);
  expect(d.atteint(d.solution), `${id} : la solution ne relève pas le défi`).toBe(true);
  for (const l of leviers) {
    expect(l.depart, l.code).toBeGreaterThanOrEqual(l.min);
    expect(l.depart, l.code).toBeLessThanOrEqual(l.max);
    expect(d.solution[l.code], l.code).toBeGreaterThanOrEqual(l.min);
    expect(d.solution[l.code], l.code).toBeLessThanOrEqual(l.max);
    // La solution et le départ tombent sur un cran du levier.
    if (!l.choix) for (const v of [l.depart, d.solution[l.code]!]) expect(Math.abs(((v - l.min) / l.pas) % 1) < 1e-9 || Math.abs(((v - l.min) / l.pas) % 1) > 1 - 1e-9, `${l.code} ${v}`).toBe(true);
  }
  const lu = lireLeLaboratoire(e, NOVA, d.solution);
  expect(lu.atteint).toBe(true);
  return e;
}
