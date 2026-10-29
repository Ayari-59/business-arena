import { expect } from "vitest";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, LevierDeSimulation } from "../../src/config/cours/types";
import { lireLeLaboratoire } from "../../src/pedagogy/cours/chapitre-servi";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardesDeTexte as gardesDuLycee, textesDe } from "./gardes-du-lycee";

/**
 * LES GARDES COMMUNES DES CHAPITRES ET DES CAS DE L'ÉCONOMIE ET DE LA MERCATIQUE (lot M4 : seconde
 * SES, bac STMG mercatique), passés sur le marché de NOVA du monde du cours
 * (monde/economie-et-marketing.ts). Elles reprennent celles du lycée (gardes-du-lycee.ts : NOVA
 * seule, une seule bonne réponse, des notions qui existent, des textes propres, l'arène à la seule
 * dernière étape, un curseur dont la position attendue est la frontière) et y ajoutent :
 *   · une quantité d'enceintes, de ventes ou de jours jamais écrite en lettres ;
 *   · un laboratoire à un ou deux leviers dont le départ ne relève pas le défi, dont la solution le
 *     relève, et dont la solution est LA SEULE position des leviers qui le relève (palier 1) ;
 *   · un cas dédié : même palier, même parcours, NOVA seule, sans cours, une réponse au bout.
 */

export { NOVA, VIDE, etape };
export { gardeDuCurseur } from "./gardes-du-lycee";

const FAUTES_EN_PLUS: [string, RegExp][] = [
  ["quantité en lettres", /\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze) (enceintes?|ventes?|jours|mois|points?|euros?)\b/i],
  ["signe moins de traits d'union", /(^|[\s(])-\d/],
  ["délai convenu au-delà du plafond", /\b(?:[6-9][1-9]|[7-9]0|1\d\d) jours convenus\b/],
  ["élision manquée devant « le »", /(^|[\s'(])le [aeiouyéèêAEIOUYÉ]/],
  ["l'enceinte au masculin", /\bun enceinte\b|\benceinte (vendu|fabriqué|demandé|servi|perdu|gagné)\b(?!e)|\benceintes (vendu|fabriqué|demandé|servi|perdu|gagné)s\b/i],
  ["trait d'union pris pour un tiret", /[a-zé]-\s|\s-[a-zé]/],
];

/** Les gardes du lycée, et celles du lot. */
export function gardesDeTexte(source: Chapitre) {
  gardesDuLycee(source);
  const ch = chapitreDuCas(source, NOVA);
  expect(new Set(ch.etapes.map((e) => e.id)).size, source.code).toBe(ch.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.titre)).size, source.code).toBe(ch.etapes.length);
  for (const [i, e] of ch.etapes.entries()) {
    // Le test de bout en bout clique les boutons par leur nom : aucun titre ne s'y confond.
    expect(e.titre, e.id).not.toMatch(/v[ée]rifier|étape suivante|terminer|montrer la réponse|changer le signe|valider/i);
    if (e.type === "choix") {
      const options = e.options(NOVA, etatAvant(ch, NOVA, i));
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") for (const c of e.champs(NOVA, etatAvant(ch, NOVA, i))) expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle} au centime`).toBe(c.attendu);
    for (const x of textesDe(ch, e, i)) for (const [nom, re] of FAUTES_EN_PLUS) expect(x, `${e.id} · ${nom} : ${x}`).not.toMatch(re);
    if (e.type === "montants") for (const c of e.champs(NOVA, etatAvant(ch, NOVA, i))) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    if (e.tableau) {
      const t = e.tableau(NOVA);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
    }
  }
  return ch;
}

/** Les champs attendus d'une étape de montants, et la bonne réponse d'un choix. */
export const attendus = (ch: Chapitre, id: string) => etape(chapitreDuCas(ch, NOVA), id, "montants").champs(NOVA, VIDE).map((c) => c.attendu);
export const juste = (ch: Chapitre, id: string) => etape(chapitreDuCas(ch, NOVA), id, "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte);

/** Toutes les positions d'un levier : ses choix, ou ses crans de min à max. */
const positionsDe = (l: LevierDeSimulation) =>
  l.choix ? l.choix.map((x) => x.valeur) : Array.from({ length: Math.round((l.max - l.min) / l.pas) + 1 }, (_, i) => Math.round((l.min + i * l.pas) * 1e6) / 1e6);

/** Le laboratoire : un ou deux leviers, le départ et la solution sur un cran, et une seule position qui relève le défi. */
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
  expect(lireLeLaboratoire(e, NOVA, d.solution).atteint).toBe(true);
  return e;
}

/** Un cas dédié à son chapitre : même palier, même parcours, NOVA seule, sans cours, une réponse au bout. */
export function gardeDuCas(sit: Situation, ch: Chapitre) {
  expect(sit.reprend, sit.code).toEqual([ch.code]);
  expect(sit.palier, sit.code).toBe(ch.palier);
  expect(sit.parcours, sit.code).toBe(ch.parcours);
  expect(sit.entreprises?.codes, sit.code).toEqual(["nova"]);
  expect(sit.libre, sit.code).toBe(false);
  expect(sit.etapes[0]!.type, sit.code).toBe("lecture");
  expect(sit.etapes.slice(1).filter((e) => e.type === "lecture"), sit.code).toHaveLength(0);
  expect(sit.etapes.at(-1)!.type, sit.code).toBe("choix");
  gardesDeTexte(sit);
}
