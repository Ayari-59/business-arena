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
 * LES GARDES DES CHAPITRES DU BLOC 1 « TERRAIN » DU BTS NDRC ET DE LEURS CAS (le fichier et la cible,
 * organiser le secteur, l'événement commercial), chez ATLAS CONSEIL : celles de la boutique
 * (gardes-de-la-boutique.ts) et du portefeuille ABC, transposées au cabinet. Textes sans faute de la liste,
 * une seule bonne réponse et jamais la plus longue, notions qui existent, montants au centime, un montant
 * négatif annoncé par la question, aucune phrase de plus de 40 mots, l'arène nommée à la dernière étape
 * seulement ; le curseur à sa frontière ; le laboratoire qui part hors du défi et dont la solution le relève.
 */

export const CABINET = casDeLEntreprise("conseil");
export const VIDE: EtatDuCours = { soldes: {} };

const FAUTES: [string, RegExp][] = [
  ["valeur absente", /undefined|NaN|Infinity|\[object|\bnull\b/],
  ["contraction manquée", /(?<!\p{L})(?:de|à) [Ll]es? (?!\p{L}+(?:er|ir|re)\b)\p{L}/u],
  ["tiret au milieu d'une phrase", / [-–—] /],
  ["élision manquée", /(^|[\s'(«])(de|que) [AEIOUYÉaeiouyé](?![a-zé]*-)/],
  ["signe moins de traits d'union", /(^|[\s(])-\d/],
  ["nombre en lettres", /\b(vingt|trente|quarante|cinquante|soixante|quatre-vingts?|cent|mille)\b/i],
  ["quantité en lettres", /\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze) (journées?|jours|comptes?|trimestres?|consultants?|commerciaux|clientèles?|contacts?|visites?|lignes?|prospects?|contrats?|devis|rendez-vous|mois)\b/i],
  ["journée au masculin", /\bun journée|\bjournées? (vendu|demandé|refusé|gagné|perdu|pris)s?(?![a-zàâçéèêëîïôûù])/i],
  ["espaces doublés ou signes accolés", /− −|\s{2,}|\+−|\+-|\+ −/],
  ["année avec un trait d'union", /\bN-\d/],
  ["lexique de la maison", /évènement|\.\.\.|(?<!\p{L})e[-‑]?mail/iu],
];

const phrases = (t: string) => t.split(/(?<=[.?!])\s+/u);
const mots = (p: string) => p.split(/\s+/u).filter((m) => /\p{L}|\d/u.test(m)).length;

/** Les gardes de texte, de réponse unique et de notions, chez ATLAS CONSEIL. */
export function gardesDeTexte(source: Chapitre) {
  expect(source.entreprises?.codes, source.code).toEqual(["conseil"]);
  const ch = chapitreDuCas(source, CABINET);
  expect(ch.etapes.length, `${source.code} : une étape retirée`).toBe(source.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.id)).size, source.code).toBe(ch.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.titre)).size, source.code).toBe(ch.etapes.length);
  const codes = new Set(CONCEPTS.map((x) => x.code));
  const derniere = ch.etapes.at(-1)!.id;
  for (const x of [ch.titre, ch.accroche, ...ch.objectifs, ch.entreprises?.pourquoi ?? ""]) {
    for (const [nom, re] of FAUTES) expect(x, `en-tête · ${nom} : ${x}`).not.toMatch(re);
    expect(x, "en-tête : l'arène").not.toMatch(/\barène\b/i);
  }
  for (const [i, e] of ch.etapes.entries()) {
    const etat = etatAvant(ch, CABINET, i);
    for (const x of textesDe(ch, e, i, CABINET)) {
      for (const [nom, re] of FAUTES) expect(x, `${e.id} · ${nom} : ${x}`).not.toMatch(re);
      if (e.id !== derniere) expect(x, `${e.id} : l'arène avant la dernière étape`).not.toMatch(/\barène\b/i);
      for (const p of phrases(x)) expect(mots(p), `${e.id} : ${p}`).toBeLessThanOrEqual(40);
    }
    if (e.type === "choix") {
      const options = e.options(CABINET, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      const juste = options.find((o) => o.juste)!;
      expect(juste.texte.length, `${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
    }
    if (e.type === "montants") {
      const champs = e.champs(CABINET, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
      if (champs.some((c) => c.attendu < 0)) expect(e.question(CABINET, etat), e.id).toMatch(/négatif (pour une perte|s'il)/);
    }
    if (e.tableau) {
      const t = e.tableau(CABINET);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
  }
  return ch;
}

/** Les champs attendus d'une étape de montants, et la bonne réponse d'un choix. */
export const attendus = (ch: Chapitre, id: string) => etape(chapitreDuCas(ch, CABINET), id, "montants").champs(CABINET, VIDE).map((c) => c.attendu);
export const juste = (ch: Chapitre, id: string) => etape(chapitreDuCas(ch, CABINET), id, "choix").options(CABINET, VIDE).filter((o) => o.juste).map((o) => o.texte);

/** Le curseur : sa position attendue est dans ses bornes, c'est la frontière, et le serveur lit la même chose. */
export function gardeDuCurseur(source: Chapitre, id: string, attendu: number) {
  const e = etape(chapitreDuCas(source, CABINET), id, "curseur");
  const cible = e.cible(CABINET);
  expect(cible.attendu, id).toBe(attendu);
  expect(attendu).toBeGreaterThanOrEqual(cible.min ?? 0);
  expect(attendu).toBeLessThanOrEqual(cible.max);
  const d = e.droites(CABINET);
  const couvre = (q: number) => d.produit(q) >= d.cout(q) - 1e-9;
  const pas = e.sens === "plus-grande" ? 1 : -1;
  expect(couvre(attendu), `${id} à ${attendu}`).toBe(true);
  expect(couvre(attendu + pas), `${id} à ${attendu + pas}`).toBe(false);
  expect(lireLeCurseur(e, CABINET, attendu).lignes).toEqual(typographier(e.lecture(CABINET, attendu)));
  return e;
}

/** Le laboratoire : le départ ne relève pas le défi, la solution le relève, sur un cran de chaque levier. */
export function gardeDuLaboratoire(source: Chapitre, id: string) {
  const e = etape(chapitreDuCas(source, CABINET), id, "simulation");
  const leviers = e.leviers(CABINET);
  const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
  const d = e.defi(CABINET);
  expect(d.atteint(depart), `${id} : le départ relève déjà le défi`).toBe(false);
  expect(d.atteint(d.solution), `${id} : la solution ne relève pas le défi`).toBe(true);
  for (const l of leviers) {
    const crans = Array.from({ length: Math.round((l.max - l.min) / l.pas) + 1 }, (_, i) => Math.round((l.min + i * l.pas) * 1e6) / 1e6);
    expect(crans, `${l.code} : le départ est un cran`).toContain(l.depart);
    expect(crans, `${l.code} : la solution est un cran`).toContain(d.solution[l.code]);
  }
  for (const x of [d.indice(depart), ...e.lecture(CABINET, depart).map((l) => l.libelle)]) expect(x).not.toMatch(/undefined|NaN|Infinity|\[object/);
  expect(lireLeLaboratoire(e, CABINET, d.solution).atteint).toBe(true);
  const lire = (p: Readonly<Record<string, number>>) => Object.fromEntries(e.lecture(CABINET, p).map((l) => [l.libelle, l.montant]));
  return { e, d, depart, auDepart: lire(depart), aLaSolution: lire(d.solution) };
}

/** Un cas dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours, une réponse au bout. */
export function gardeDuCas(sit: Situation, ch: Chapitre) {
  expect(sit.reprend, sit.code).toEqual([ch.code]);
  expect(sit.palier, sit.code).toBe(ch.palier);
  expect(sit.parcours, sit.code).toBe(ch.parcours);
  expect(sit.entreprises?.codes, sit.code).toEqual(ch.entreprises?.codes);
  expect(sit.libre, sit.code).toBe(false);
  expect(sit.blocs, sit.code).toEqual([]);
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
  for (const bloc of ch.blocs) {
    const cite = referentielDeCitation(bloc);
    expect(cite?.code, bloc).toBe("bts-ndrc");
    expect(blocOfficiel(bloc, cite!.code), bloc).toBe(bloc.replace(/^BTS NDRC /, ""));
  }
}
