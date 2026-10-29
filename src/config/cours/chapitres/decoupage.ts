import type { Chapitre, Etape } from "../types";

/**
 * DÉCOUPER UN CHAPITRE TROP LONG EN DEUX (audit pédagogique : aucun chapitre de plus de 20 étapes,
 * sur le modèle de « De la création au premier bilan », suivi de « Du résultat à la trésorerie »).
 *
 * Chaque partie est un chapitre à part entière : ses propres objectifs, ses blocs, ses étapes. Les
 * étapes gardent leurs textes et leurs chiffres ; seul le champ `objectifs` de chaque étape change,
 * pour désigner les objectifs de la partie. Une partie ne garde que les objectifs qu'une de ses
 * étapes travaille, dans l'ordre du chapitre d'origine.
 */

/** Les étapes d'un chapitre, de la première jusqu'à `fin` exclue (ou depuis `debut` incluse). */
export function etapesAvant(source: Chapitre, fin: string): Etape[] {
  const k = source.etapes.findIndex((e) => e.id === fin);
  if (k < 0) throw new Error(`${source.code} : pas d'étape « ${fin} »`);
  return source.etapes.slice(0, k);
}

export function etapesDepuis(source: Chapitre, debut: string, fin?: string): Etape[] {
  const k = source.etapes.findIndex((e) => e.id === debut);
  if (k < 0) throw new Error(`${source.code} : pas d'étape « ${debut} »`);
  const j = fin === undefined ? source.etapes.length : source.etapes.findIndex((e) => e.id === fin);
  if (j < 0) throw new Error(`${source.code} : pas d'étape « ${fin} »`);
  return source.etapes.slice(k, j);
}

/**
 * Une partie d'un chapitre : le chapitre d'origine, avec d'autres étapes et ce qui change (code,
 * titre, accroche, prérequis). Les objectifs sont ceux que les étapes travaillent, renumérotés.
 */
export function partieDuChapitre(source: Chapitre, etapes: readonly Etape[], change: Partial<Omit<Chapitre, "etapes" | "objectifs">> = {}): Chapitre {
  const utilises = [...new Set(etapes.flatMap((e) => e.objectifs ?? []))].sort((a, b) => a - b);
  const nouveau = new Map(utilises.map((k, i) => [k, i]));
  return {
    ...source,
    ...change,
    objectifs: utilises.map((k) => source.objectifs[k]!),
    etapes: etapes.map((e) => (e.objectifs ? ({ ...e, objectifs: e.objectifs.map((k) => nouveau.get(k)!) } as Etape) : e)),
  };
}
