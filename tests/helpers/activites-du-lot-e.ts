import { expect } from "vitest";
import type { Bureau } from "../../src/config/cours/bureaux/types";
import type { Scenario } from "../../src/config/cours/scenarios/types";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { corrigerAuBureau, servirLeBureau } from "../../src/pedagogy/cours/bureau-servi";
import { corrigerAuScenario, servirLeScenario } from "../../src/pedagogy/cours/scenario-servi";
import { LEXIQUE_INTERDIT, espacesOrdinairesFautives, phrasesLongues, tiretsAuMilieu, tutoiements } from "./textes-du-depot";

/**
 * LES AIDES DES GARDES DU LOT E (une activité par chapitre, novembre 2026) : tout ce qu'une activité peut
 * servir, et les règles de la maison qu'on y relit. Les gardes de chaque activité les appellent.
 */

/** Toutes les chaînes d'une valeur, sauf les codes. */
export function chaines(x: unknown, sortie: string[] = []): string[] {
  if (typeof x === "string") sortie.push(x);
  else if (Array.isArray(x)) x.forEach((v) => chaines(v, sortie));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) if (!["code", "id", "type", "nature", "ton", "geste", "refus", "categorie", "raison", "compte", "sens"].includes(k)) chaines(v, sortie);
  return sortie;
}

/** Les suites d'un scénario, complètes ou non, dans l'ordre des décisions. */
export function suitesDe(s: Scenario, n = s.decisions.length): string[][] {
  return n === 0 ? [[]] : suitesDe(s, n - 1).flatMap((x) => s.decisions[n - 1]!.options.map((o) => [...x, o]));
}

/** Tout ce qu'un scénario peut servir : la page, chaque choix de chaque suite, le corrigé des questions. */
export function textesDuScenario(s: Scenario): string[] {
  const out = chaines(servirLeScenario(s));
  for (let n = 1; n <= s.decisions.length; n++) for (const suite of suitesDe(s, n)) out.push(...chaines(corrigerAuScenario(s, { geste: "choisir", suite })));
  out.push(...chaines(corrigerAuScenario(s, { etape: s.questions.id, geste: "montrer" })));
  return [...new Set(out)];
}

/** Tout ce qu'un bureau peut servir : la page, et la correction de chaque étape. */
export function textesDuBureau(b: Bureau): string[] {
  const out = chaines(servirLeBureau(b));
  for (const e of b.etapes) out.push(...chaines(corrigerAuBureau(b, { etape: e.id, geste: "montrer" })));
  return [...new Set(out)];
}

/** Les règles de la maison, sur ce qui est servi. */
export function verifierLaLangue(textes: readonly string[]) {
  const sources = [...new Set(textes.map(espacesOrdinaires))];
  expect(sources.flatMap(tiretsAuMilieu)).toEqual([]);
  expect(sources.flatMap(tutoiements)).toEqual([]);
  for (const { mot, re } of LEXIQUE_INTERDIT) expect(sources.filter((t) => re.test(t)), mot).toEqual([]);
  for (const t of sources) {
    expect(t, t).not.toMatch(/(^|[\s(])-\d/);
    expect(t, t).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
    expect(t, t).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|vingt|trente|quarante|cinquante|soixante|cent|mille)\b/i);
    expect(t, t).not.toMatch(/gérant|gérante|dirigeant/i);
    expect(t, t).not.toMatch(/évènement/i);
    // Un montant n'a jamais plus de deux décimales (un coefficient de structure en a quatre).
    expect(t, t).not.toMatch(/\d,\d{3,}\s?€/);
  }
  expect(sources.some((t) => /le président/i.test(t))).toBe(true);
  expect([...phrasesLongues(sources)]).toEqual([]);
  expect(textes.flatMap(espacesOrdinairesFautives)).toEqual([]);
}

/** Les questions à choix : une seule bonne option, jamais la plus longue, des options distinctes. */
export function verifierLesQuestions(questions: readonly { id: string; options: readonly { texte: string; juste: boolean }[] }[]) {
  for (const q of questions) {
    const justes = q.options.filter((o) => o.juste);
    expect(justes, q.id).toHaveLength(1);
    expect(new Set(q.options.map((o) => o.texte)).size, q.id).toBe(q.options.length);
    const plusLongue = Math.max(...q.options.filter((o) => !o.juste).map((o) => o.texte.length));
    expect(justes[0]!.texte.length, q.id).toBeLessThan(plusLongue);
  }
}
