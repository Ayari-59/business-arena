import type { CompanyRoundResult, EngineScenarioConfig, SegmentCode } from "@/engine/types";
import { estUneNouveaute } from "@/engine/groupe/nouveautes";

/**
 * L'ADOPTION CACHÉE D'UNE NOUVEAUTÉ (niveau 7, NOVA Home).
 *
 * L'état d'adoption (lent, moyen ou rapide) se lit dans la taille et la
 * croissance du segment de la nouveauté, dans sa migration, et dans le
 * potentiel que le moteur note chaque tour. L'élève ne le connaît pas tant
 * qu'il n'a pas acheté l'étude de marché, ou qu'il ne vend pas lui-même la
 * nouveauté (le marché lui répond alors). Avant, la vue de partie tait tout ce
 * qui le trahit : ces deux fonctions sont le seul endroit qui en décide.
 */

/** Une ligne de résultat de l'équipe, telle que la base la garde. */
interface LigneDeLEquipe {
  marketDetail: CompanyRoundResult["market"]["bySegment"];
  engineTrace: { studies?: { purchased?: string[] } | null } | null;
}

/**
 * Les études qui disent la demande par segment : l'étude de marché du
 * formulaire (`market`), et la catégorie « marchés » du catalogue enrichi
 * (`marches`). L'une ou l'autre, achetée une fois, révèle l'adoption.
 */
export const ETUDES_DU_MARCHE: readonly string[] = ["market", "marches"];

/** Les segments à taire, pour cette équipe : ceux des nouveautés dont l'adoption ne lui est pas connue. */
export function segmentsDAdoptionCaches(snapshot: EngineScenarioConfig, lignes: readonly LigneDeLEquipe[]): Set<SegmentCode> {
  const caches = new Set<SegmentCode>();
  const etudie = lignes.some((l) => (l.engineTrace?.studies?.purchased ?? []).some((e) => ETUDES_DU_MARCHE.includes(e)));
  if (etudie) return caches;
  for (const p of snapshot.products ?? []) {
    if (!estUneNouveaute(snapshot, p.code)) continue;
    const codes = p.market.segments.map((s) => s.code);
    const vendue = lignes.some((l) => codes.some((c) => (l.marketDetail?.[c]?.sold ?? 0) > 0));
    if (!vendue) for (const c of codes) caches.add(c);
  }
  return caches;
}

/** Le détail du marché d'un tour, le potentiel des segments tus remis à zéro. */
export function marcheSansAdoption<T extends Record<string, { potential: number }>>(detail: T, caches: ReadonlySet<SegmentCode>): T {
  if (caches.size === 0 || !detail) return detail;
  return Object.fromEntries(
    Object.entries(detail).map(([code, d]) => [code, caches.has(code) ? { ...d, potential: 0 } : d]),
  ) as T;
}
