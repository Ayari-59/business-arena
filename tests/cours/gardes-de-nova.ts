import { expect } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, EtatDuCours, LevierDeSimulation } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { lireLeCurseur, lireLeLaboratoire, servirLeChapitre } from "../../src/pedagogy/cours/chapitre-servi";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { NOVA, etape, textesDe } from "./gardes-du-lycee";

/**
 * LES GARDES COMMUNES DES CHAPITRES ET DES CAS DE LA GESTION DE BASE ET DE L'INFORMATION (lot M3),
 * passés sur le monde du cours (monde/gestion-et-information.ts, chez NOVA) : NOVA seule, une seule
 * bonne réponse, les notions qui existent, des textes propres (ni « undefined », ni « de le », ni
 * tiret au milieu d'une phrase, ni « -12 € », ni un nombre écrit en lettres, ni l'arène avant la
 * dernière étape), un curseur dont la position attendue est la frontière, et un laboratoire dont le
 * départ ne relève pas le défi, dont la solution le relève, et dont la solution est LA SEULE position
 * des leviers qui le relève (palier 1 : une solution unique et claire), lus comme le serveur les lit
 * (chapitre-servi.ts).
 *
 * Elles reprennent celles de la boutique (gardes-de-la-boutique.ts), chez NOVA.
 */

export { NOVA, etape };
export const VIDE: EtatDuCours = { soldes: {} };

/** Les fautes que la composition des textes produit. */
const FAUTES: [string, RegExp][] = [
  ["valeur absente", /undefined|NaN|Infinity|\[object|\bnull\b/],
  ["contraction manquée", /(?<!\p{L})(?:de|à) [Ll]es? (?!\p{L}+(?:er|ir|re)\b)\p{L}/u],
  ["tiret au milieu d'une phrase", / [-–—] /],
  ["élision manquée", /(^|[\s'(])(de|que) [AEIOUYÉaeiouyé](?![a-zé]*-)/],
  ["signe moins de traits d'union", /(^|[\s(])-\d/],
  ["nombre en lettres", /\b(vingt|trente|quarante|cinquante|soixante|quatre-vingts?)\b/i],
  ["quantité en lettres", /\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze) (enceintes?|clients|jours|mois|trimestres?|ventes?|salariés|enseignes?|lignes?|utilisateurs|euros?)\b/i],
  ["pluriel après 1", /(?<![\d,.]|\d )(?<!\p{L})1 (?:enceintes|clients|jours|ventes|trimestres|lignes|points)(?!\p{L})/u],
  ["espaces doublés ou signes accolés", /− −|\s{2,}|\+−|\+-/],
  ["année avec un trait d'union", /\bN-\d/],
];

/** Les gardes de texte, de réponse unique et de notions, chez NOVA ; et l'arène seulement à la dernière étape. */
export function gardesDeTexte(source: Chapitre) {
  expect(source.entreprises?.codes, source.code).toEqual(["nova"]);
  const ch = chapitreDuCas(source, NOVA);
  expect(ch.etapes.length, `${source.code} : une étape retirée chez NOVA`).toBe(source.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.id)).size, source.code).toBe(ch.etapes.length);
  const codes = new Set(CONCEPTS.map((x) => x.code));
  const derniere = ch.etapes.at(-1)!.id;
  for (const x of [ch.titre, ch.accroche, ...ch.objectifs, ch.entreprises?.pourquoi ?? ""]) {
    for (const [nom, re] of FAUTES) expect(x, `en-tête · ${nom} : ${x}`).not.toMatch(re);
    expect(x, "en-tête : l'arène").not.toMatch(/\barène\b/i);
  }
  for (const [i, e] of ch.etapes.entries()) {
    for (const x of textesDe(ch, e, i, NOVA)) {
      for (const [nom, re] of FAUTES) expect(x, `${e.id} · ${nom} : ${x}`).not.toMatch(re);
      if (e.id !== derniere) expect(x, `${e.id} : l'arène avant la dernière étape`).not.toMatch(/\barène\b/i);
    }
    if (e.type === "choix") {
      const options = e.options(NOVA, etatAvant(ch, NOVA, i));
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
    }
    if (e.type === "montants") {
      const champs = e.champs(NOVA, etatAvant(ch, NOVA, i));
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    }
    if (e.type === "tri") {
      const el = e.elements(NOVA);
      expect(new Set(el.map((x) => x.libelle)).size, e.id).toBe(el.length);
      for (const x of el) expect(e.categories.map((k) => k.code), `${e.id} : ${x.libelle}`).toContain(x.categorie);
    }
    if (e.tableau) {
      const t = e.tableau(NOVA);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
  }
  // Le serveur sert le chapitre sans erreur : chaque étape passe par chapitre-servi.ts.
  expect(servirLeChapitre(source, NOVA).etapes.length).toBe(ch.etapes.length);
  return ch;
}

/** Les champs attendus d'une étape de montants, et la bonne réponse d'un choix. */
export const attendus = (ch: Chapitre, id: string) => etape(chapitreDuCas(ch, NOVA), id, "montants").champs(NOVA, VIDE).map((c) => c.attendu);
export const juste = (ch: Chapitre, id: string) => etape(chapitreDuCas(ch, NOVA), id, "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte);
export const triDe = (ch: Chapitre, id: string) => Object.fromEntries(etape(chapitreDuCas(ch, NOVA), id, "tri").elements(NOVA).map((x) => [x.libelle, x.categorie]));

/** Le curseur : sa position attendue est dans ses bornes, et c'est la frontière ; le serveur lit la même chose. */
export function gardeDuCurseur(source: Chapitre, id: string, attendu: number) {
  const e = etape(chapitreDuCas(source, NOVA), id, "curseur");
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

/** Toutes les positions d'un levier : ses choix, ou ses crans de min à max. */
const positionsDe = (l: LevierDeSimulation) =>
  l.choix ? l.choix.map((x) => x.valeur) : Array.from({ length: Math.round((l.max - l.min) / l.pas) + 1 }, (_, i) => Math.round((l.min + i * l.pas) * 1e6) / 1e6);

/** Le laboratoire : un ou deux leviers, le départ ne relève pas le défi, la solution le relève, et c'est la seule position qui le relève. */
export function gardeDuLaboratoire(source: Chapitre, id: string) {
  const e = etape(chapitreDuCas(source, NOVA), id, "simulation");
  const leviers = e.leviers(NOVA);
  expect(leviers.length, `${id} : un levier, deux au plus`).toBeLessThanOrEqual(2);
  const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
  const d = e.defi(NOVA);
  expect(d.atteint(depart), `${id} : le départ relève déjà le défi`).toBe(false);
  expect(d.atteint(d.solution), `${id} : la solution ne relève pas le défi`).toBe(true);
  for (const l of leviers) {
    const crans = positionsDe(l);
    expect(crans, `${l.code} : le départ est un cran`).toContain(l.depart);
    expect(crans, `${l.code} : la solution est un cran`).toContain(d.solution[l.code]);
  }
  const positions = leviers.reduce<Record<string, number>[]>((acc, l) => acc.flatMap((p) => positionsDe(l).map((v) => ({ ...p, [l.code]: v }))), [{}]);
  expect(positions.filter((p) => d.atteint(p)), `${id} : une seule solution`).toEqual([d.solution]);
  for (const p of positions) for (const x of [d.indice(p), ...e.lecture(NOVA, p).map((l) => l.libelle)]) expect(x).not.toMatch(/undefined|NaN|Infinity|\[object/);
  for (const [nom, re] of FAUTES) for (const x of [d.consigne, ...e.explication(NOVA, d.solution)]) expect(x, `${id} · ${nom} : ${x}`).not.toMatch(re);
  expect(lireLeLaboratoire(e, NOVA, d.solution).atteint).toBe(true);
  return e;
}

/** Un cas dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours, une réponse au bout. */
export function gardeDuCas(sit: Situation, ch: Chapitre) {
  expect(sit.reprend, sit.code).toContain(ch.code);
  expect(sit.palier, sit.code).toBe(ch.palier);
  expect(sit.parcours, sit.code).toBe(ch.parcours);
  expect(sit.entreprises?.codes, sit.code).toEqual(ch.entreprises?.codes);
  expect(sit.libre, sit.code).toBe(false);
  expect(sit.blocs, sit.code).toEqual([]);
  expect(sit.etapes[0]!.type, sit.code).toBe("lecture");
  expect(sit.etapes.at(-1)!.type, sit.code).toBe("choix");
  gardesDeTexte(sit);
}

/** Les blocs d'un chapitre se résolvent dans le référentiel de leur formation, et son titre est au programme. */
export function gardeDuProgramme(ch: Chapitre, programme: readonly string[]) {
  expect(programme, ch.code).toContain(ch.titre);
  expect(ch.libre).toBe(false);
  for (const bloc of ch.blocs) {
    const cite = referentielDeCitation(bloc);
    expect(cite, bloc).not.toBeNull();
    expect(blocOfficiel(bloc, cite!.code), bloc).toBeTruthy();
  }
}
