import { expect } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { lireLeCurseur, lireLeLaboratoire } from "../../src/pedagogy/cours/chapitre-servi";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { typographier } from "../../src/lib/typographie";
import { etape, textesDe } from "./gardes-du-lycee";

/**
 * LES GARDES DES CHAPITRES DU SITE D'ATLAS CONSEIL ET DE LEURS CAS (BTS NDRC, bloc 2 : « Le site qui
 * vend », « Contenus, communauté et e-réputation »), passés sur le monde du cours (monde/site-d-atlas.ts) :
 * ATLAS CONSEIL seule, une seule bonne réponse, jamais la plus longue, les notions qui existent, des
 * textes propres (ni « undefined », ni « de le », ni tiret au milieu d'une phrase, ni « -12 € », ni un
 * nombre écrit en lettres, ni l'arène avant la dernière étape), aucune phrase de plus de 40 mots, un
 * montant attendu au centime, dont le signe est dit quand il peut être négatif ; un curseur dont la
 * position attendue est la frontière, et un laboratoire dont le départ ne relève pas le défi et dont la
 * solution le relève, lus comme le serveur les lit (chapitre-servi.ts).
 */

export const CONSEIL = casDeLEntreprise("conseil");
export const VIDE: EtatDuCours = { soldes: {} };
export { etape };

/** Les fautes que la composition des textes produit. */
const FAUTES: [string, RegExp][] = [
  ["valeur absente", /undefined|NaN|Infinity|\[object|\bnull\b/],
  ["contraction manquée", /(?<!\p{L})(?:de|à) [Ll]es? (?!\p{L}+(?:er|ir|re)\b)\p{L}/u],
  ["tiret au milieu d'une phrase", / [-–—] /],
  ["élision manquée", /(^|[\s'(«])(de|que) [AEIOUYÉaeiouyé](?![a-zé]*-)/],
  ["signe moins de traits d'union", /(^|[\s(])-\d/],
  ["nombre en lettres", /\b(vingt|trente|quarante|cinquante|soixante|quatre-vingts?)\b/i],
  ["quantité en lettres", /\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze) (visites?|commandes?|clics?|places?|avis|étoiles?|publications?|contacts?|comptes?|sources?|paliers?|heures?|semaines?|participants?|abonnés?)\b/i],
  ["espaces doublés ou signes accolés", /− −|\s{2,}|\+−|\+-/],
  ["année avec un trait d'union", /\bN-\d/],
];

/** Les phrases d'un texte, coupées aux points. */
const phrases = (t: string) => t.split(/(?<=[.?!])\s+/u);
const mots = (p: string) => p.split(/\s+/u).filter((m) => /\p{L}|\d/u.test(m)).length;

/** Les gardes de texte, de réponse unique et de notions, chez ATLAS CONSEIL ; et l'arène seulement à la dernière étape. */
export function gardesDeTexte(source: Chapitre) {
  expect(source.entreprises?.codes, source.code).toEqual(["conseil"]);
  expect(source.entreprises!.pourquoi, source.code).toMatch(/^[a-zé].*\.$/);
  const ch = chapitreDuCas(source, CONSEIL);
  expect(ch.etapes.length, `${source.code} : une étape retirée chez le cabinet`).toBe(source.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.id)).size, source.code).toBe(ch.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.titre)).size, source.code).toBe(ch.etapes.length);
  const codes = new Set(CONCEPTS.map((x) => x.code));
  const derniere = ch.etapes.at(-1)!.id;
  for (const x of [ch.titre, ch.accroche, ...ch.objectifs, ch.entreprises?.pourquoi ?? ""]) {
    for (const [nom, re] of FAUTES) expect(x, `en-tête · ${nom} : ${x}`).not.toMatch(re);
    expect(x, `en-tête : l'arène`).not.toMatch(/\barène\b/i);
  }
  for (const [i, e] of ch.etapes.entries()) {
    const etat = etatAvant(ch, CONSEIL, i);
    for (const x of textesDe(ch, e, i, CONSEIL)) {
      for (const [nom, re] of FAUTES) expect(x, `${e.id} · ${nom} : ${x}`).not.toMatch(re);
      if (e.id !== derniere) expect(x, `${e.id} : l'arène avant la dernière étape`).not.toMatch(/\barène\b/i);
      for (const p of phrases(x)) expect(mots(p), `${e.id} : ${p}`).toBeLessThanOrEqual(40);
    }
    if (e.type === "choix") {
      const options = e.options(CONSEIL, etat);
      const juste = options.filter((o) => o.juste);
      expect(juste, e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      expect(juste[0]!.texte.length, `${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
    }
    if (e.type === "montants") {
      const champs = e.champs(CONSEIL, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
      if (champs.some((c) => c.attendu < 0)) expect(e.question(CONSEIL, etat), e.id).toMatch(/négati(f|ve) s(i|'il)/);
    }
    if (e.tableau) {
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
      const t = e.tableau(CONSEIL);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
  }
  return ch;
}

/** Les champs attendus d'une étape de montants, et la bonne réponse d'un choix. */
export const attendus = (ch: Chapitre, id: string) => etape(chapitreDuCas(ch, CONSEIL), id, "montants").champs(CONSEIL, VIDE).map((c) => c.attendu);
export const juste = (ch: Chapitre, id: string) => etape(chapitreDuCas(ch, CONSEIL), id, "choix").options(CONSEIL, VIDE).find((o) => o.juste)!.texte;

/** Le curseur : sa position attendue est la frontière ; de son côté le produit couvre le coût, un pas plus loin non. */
export function gardeDuCurseur(source: Chapitre, id: string, attendu: number) {
  const e = etape(chapitreDuCas(source, CONSEIL), id, "curseur");
  const cible = e.cible(CONSEIL);
  expect(cible.attendu, id).toBe(attendu);
  expect(attendu).toBeGreaterThanOrEqual(cible.min ?? 0);
  expect(attendu).toBeLessThanOrEqual(cible.max);
  const d = e.droites(CONSEIL);
  const couvre = (q: number) => d.produit(q) >= d.cout(q) - 1e-9;
  const pas = e.sens === "plus-grande" ? 1 : -1;
  expect(couvre(attendu), `${id} à ${attendu}`).toBe(true);
  expect(couvre(attendu + pas), `${id} à ${attendu + pas}`).toBe(false);
  expect(lireLeCurseur(e, CONSEIL, attendu).lignes).toEqual(typographier(e.lecture(CONSEIL, attendu)));
  return e;
}

/** Le laboratoire : le départ ne relève pas le défi, la solution le relève, sur un cran de chaque levier. */
export function gardeDuLaboratoire(source: Chapitre, id: string) {
  const e = etape(chapitreDuCas(source, CONSEIL), id, "simulation");
  const leviers = e.leviers(CONSEIL);
  const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
  const d = e.defi(CONSEIL);
  expect(d.atteint(depart), `${id} : le départ relève déjà le défi`).toBe(false);
  expect(d.atteint(d.solution), `${id} : la solution ne relève pas le défi`).toBe(true);
  for (const l of leviers) {
    for (const v of [l.depart, d.solution[l.code]!]) {
      expect(v, l.code).toBeGreaterThanOrEqual(l.min);
      expect(v, l.code).toBeLessThanOrEqual(l.max);
      if (!l.choix) expect(Math.abs(Math.round((v - l.min) / l.pas) * l.pas + l.min - v) < 1e-9, `${l.code} ${v}`).toBe(true);
    }
  }
  expect(lireLeLaboratoire(e, CONSEIL, d.solution).atteint).toBe(true);
  return { e, d, depart, lire: (p: Record<string, number>) => e.lecture(CONSEIL, p).map((l) => l.montant) };
}

/** Un cas dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours, une réponse au bout. */
export function gardeDuCas(sit: Situation, ch: Chapitre) {
  expect(sit.reprend, sit.code).toEqual([ch.code]);
  expect(sit.palier, sit.code).toBe(ch.palier);
  expect(sit.parcours, sit.code).toBe(ch.parcours);
  expect(sit.entreprises?.codes, sit.code).toEqual(ch.entreprises?.codes);
  expect(sit.libre, sit.code).toBe(false);
  expect(sit.blocs, sit.code).toEqual([]);
  expect(sit.commanditaire.length, sit.code).toBeGreaterThan(3);
  expect(sit.etapes[0]!.type, sit.code).toBe("lecture");
  expect(sit.etapes[0]!.tableau, sit.code).toBeDefined();
  expect(sit.etapes.slice(1).filter((e) => e.type === "lecture"), sit.code).toHaveLength(0);
  expect(sit.etapes.at(-1)!.type, sit.code).toBe("choix");
  gardesDeTexte(sit);
}

/** Les blocs d'un chapitre se résolvent dans le référentiel du BTS NDRC, et son titre est au programme. */
export function gardeDuProgramme(ch: Chapitre, programme: readonly string[]) {
  expect(programme, ch.code).toContain(ch.titre);
  expect(ch.libre).toBe(false);
  expect(ch.blocs.length, ch.code).toBeGreaterThan(0);
  for (const bloc of ch.blocs) {
    const cite = referentielDeCitation(bloc);
    expect(cite?.code, bloc).toBe("bts-ndrc");
    expect(blocOfficiel(bloc, cite!.code), bloc).toBe(bloc.replace(/^BTS NDRC /, ""));
  }
}
