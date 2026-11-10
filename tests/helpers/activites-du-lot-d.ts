import { expect } from "vitest";
import type { Bureau, EtapeDeClassement, EtapeDeReponse, EtapeDEtat } from "../../src/config/cours/bureaux/types";
import { CHAPITRES } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { servirLeBureau } from "../../src/pedagogy/cours/bureau-servi";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { LEXIQUE_INTERDIT, espacesOrdinairesFautives, phrasesLongues, tiretsAuMilieu, tutoiements } from "./textes-du-depot";
import { NOMBRE_DE_CAS_DEDIES } from "./nombre-de-cas-dedies";

/**
 * LES GARDES COMMUNES DES ACTIVITÉS DU LOT D (novembre 2026) : trois bureaux, trois enquêtes, une par
 * chapitre de la comptabilité générale. Chaque garde d'activité refait ses chiffres à la main ; ces
 * fonctions vérifient ce que toutes partagent : l'enregistrement, la taille, les règles des questions,
 * la cohérence des tableaux, la langue de la maison.
 */

/** L'étape d'un type donné, par son identifiant. */
export function etapeDe<T extends Bureau["etapes"][number]["type"]>(b: Bureau, id: string, type: T) {
  const e = b.etapes.find((x) => x.id === id)!;
  expect(e?.type, id).toBe(type);
  return e as Extract<Bureau["etapes"][number], { type: T }>;
}

/** Enregistrée, réservée, reprise de son chapitre, au palier de son chapitre, hors des cas dédiés. */
export function verifierLEnregistrement(b: Bureau, chapitre: string, registre: readonly Bureau[], parCode: (code: string) => Bureau | undefined, duChapitre: (c: string) => readonly Bureau[]) {
  expect(registre).toContain(b);
  expect(parCode(b.code)).toBe(b);
  expect(duChapitre(chapitre)).toContain(b);
  expect(b.libre).toBe(false);
  expect(b.reprend).toEqual([chapitre]);
  const ch = CHAPITRES.find((x) => x.code === chapitre)!;
  expect(ch, chapitre).toBeDefined();
  expect([b.parcours, b.palier]).toEqual([ch.parcours, ch.palier]);
  expect(CAS_PAR_CHAPITRE.length).toBe(NOMBRE_DE_CAS_DEDIES);
  expect(CAS_PAR_CHAPITRE.some((c) => c.code === b.code)).toBe(false);
  expect(b.entreprise.nom).toBe("NOVA");
  expect(b.commanditaire.length).toBeGreaterThan(3);
  // Chaque pièce que montre une étape ou un élément existe, et les codes sont uniques.
  expect(new Set(b.pile.map((p) => p.code)).size).toBe(b.pile.length);
  for (const e of b.etapes) for (const p of e.pieces) expect(b.pile.map((x) => x.code), `${e.id} ${p}`).toContain(p);
  for (const e of b.etapes) if (e.type === "classement") for (const x of e.elements) if (x.piece) expect(b.pile.map((y) => y.code), `${e.id} ${x.code}`).toContain(x.piece);
  expect(new Set(b.etapes.map((e) => e.id)).size).toBe(b.etapes.length);
}

/** Un bureau : 5 à 9 pièces, 3 à 6 étapes. */
export function verifierLaTailleDuBureau(b: Bureau) {
  expect(b.format ?? "bureau").toBe("bureau");
  expect(b.pile.length).toBeGreaterThanOrEqual(5);
  expect(b.pile.length).toBeLessThanOrEqual(9);
  expect(b.etapes.length).toBeGreaterThanOrEqual(3);
  expect(b.etapes.length).toBeLessThanOrEqual(6);
  expect(b.pile[0]!.nature).toBe("courriel");
}

/** Une enquête : 6 à 10 lignes contrôlées, dont 2 ou 3 justes, et 4 à 6 erreurs de natures toutes différentes. */
export function verifierLaTailleDeLEnquete(b: Bureau, controle: EtapeDeClassement) {
  expect(b.format).toBe("enquete");
  const n = controle.elements.length;
  expect(n).toBeGreaterThanOrEqual(6);
  expect(n).toBeLessThanOrEqual(10);
  const justes = controle.elements.filter((x) => x.categorie === "juste");
  expect(justes.length).toBeGreaterThanOrEqual(2);
  expect(justes.length).toBeLessThanOrEqual(3);
  const fausses = controle.elements.filter((x) => x.categorie !== "juste");
  expect(fausses.length).toBeGreaterThanOrEqual(4);
  expect(fausses.length).toBeLessThanOrEqual(6);
  expect(new Set(fausses.map((x) => x.categorie)).size, "des erreurs de natures différentes").toBe(fausses.length);
  // Des leurres parmi les raisons, dont la plus longue.
  const raisons = controle.categories.filter((k) => k.code !== "juste");
  const leurres = raisons.filter((k) => !fausses.some((x) => x.categorie === k.code));
  expect(leurres.length).toBeGreaterThanOrEqual(2);
  const plusLongue = [...raisons].sort((a, c) => c.libelle.length - a.libelle.length)[0]!;
  expect(leurres).toContain(plusLongue);
}

/** Un classement : chaque catégorie de verdict sert, chaque élément a son pourquoi. */
export function verifierLeClassement(e: EtapeDeClassement) {
  for (const x of e.elements) {
    expect(e.categories.map((k) => k.code), x.code).toContain(x.categorie);
    expect(x.pourquoi.length, x.code).toBeGreaterThan(10);
  }
  expect(new Set(e.elements.map((x) => x.code)).size).toBe(e.elements.length);
}

/** Un tableau à compléter : cohérent, juste avec ses propres valeurs, des cases à saisir qui ont un calcul et une piste. */
export function verifierLeTableau(e: EtapeDEtat) {
  expect(incoherencesDuTableau(e.grille)).toEqual([]);
  expect(corrigerLeTableau(e.grille, solutionsDuTableau(e.grille)).juste).toBe(true);
  const cases = e.grille.lignes.flatMap((l) => l.cellules.filter((c) => c.saisir));
  expect(cases.length).toBeGreaterThan(0);
  for (const c of cases) {
    expect(c.calcul, JSON.stringify(c)).toBeTruthy();
    expect(c.indice, JSON.stringify(c)).toBeTruthy();
  }
  expect(e.reussite).toBeTruthy();
}

/** Des questions : une seule bonne option, jamais la plus longue, des textes tous différents. */
export function verifierLesQuestions(e: EtapeDeReponse) {
  expect(e.questions.length).toBeGreaterThanOrEqual(2);
  for (const q of e.questions) {
    const justes = q.options.filter((o) => o.juste);
    expect(justes, q.id).toHaveLength(1);
    expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
    expect(new Set(q.options.map((o) => o.texte)).size, q.id).toBe(q.options.length);
    const plusLongue = Math.max(...q.options.filter((o) => !o.juste).map((o) => o.texte.length));
    expect(justes[0]!.texte.length, q.id).toBeLessThan(plusLongue);
  }
}

/** Toutes les chaînes d'une valeur, sauf les codes. */
export function chaines(x: unknown, sortie: string[] = []): string[] {
  if (typeof x === "string") sortie.push(x);
  else if (Array.isArray(x)) x.forEach((v) => chaines(v, sortie));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) if (!["code", "id", "categorie", "piece", "pieces", "compte", "sens", "type", "nature", "unite", "format"].includes(k)) chaines(v, sortie);
  return sortie;
}

/** La langue de la maison, sur toute l'activité et sur ce qui est servi. */
export function verifierLaLangue(b: Bureau) {
  const textes = chaines(b);
  const servis = chaines(servirLeBureau(b));
  expect(textes.length).toBeGreaterThan(80);
  expect(textes.flatMap(tiretsAuMilieu)).toEqual([]);
  expect(textes.flatMap(tutoiements)).toEqual([]);
  for (const { mot, re } of LEXIQUE_INTERDIT) expect(textes.filter((t) => re.test(t)), mot).toEqual([]);
  for (const t of textes) {
    expect(t, t).not.toMatch(/(^|[\s(])-\d/);
    expect(t, t).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
    expect(t, t).not.toMatch(/(?<!pour )\b(vingt|trente|quarante|cinquante|soixante|cent|mille)\b/i);
    expect(t, t).not.toMatch(/évènement/i);
    expect(t, t).not.toMatch(/\bla présidente\b|\ble directeur général\b|\bla gérante\b|\ble gérant\b/i);
  }
  expect([...phrasesLongues(textes)]).toEqual([]);
  expect(servis.flatMap(espacesOrdinairesFautives)).toEqual([]);
}
