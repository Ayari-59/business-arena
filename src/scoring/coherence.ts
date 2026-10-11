import { PIVOT_FIELDS, memeValeur, type DecisionSourceMap, type PivotField } from "@/config/decision-source";
import type { LeverDirection } from "@/config/scenarios/situation-kit";
import type { RoundDecisions } from "@/engine/types";

/**
 * Cohérence 0..100 des leviers PIVOTS d'un tour : part des leviers attendus
 * (prix, volume) que l'équipe a réellement édités dans le bon sens face à la
 * valeur proposée. `null` quand le tour ne suggère aucun levier pivot.
 */
export function coherencePivots(args: {
  levers: { field: string; direction: LeverDirection }[];
  source: DecisionSourceMap;
  decisions: RoundDecisions;
  proposed: RoundDecisions;
}): number | null {
  const attendus = new Map<PivotField, LeverDirection>();
  for (const l of args.levers) {
    if (!(PIVOT_FIELDS as readonly string[]).includes(l.field)) continue;
    const champ = l.field as PivotField;
    const prev = attendus.get(champ);
    // Deux situations qui tirent le même pivot dans des sens opposés : « à revoir ».
    attendus.set(champ, prev && prev !== l.direction ? "review" : l.direction);
  }
  if (attendus.size === 0) return null;
  let satisfaits = 0;
  for (const [champ, direction] of attendus) {
    if (args.source[champ] !== "edited") continue;
    const now = args.decisions[champ];
    const base = args.proposed[champ];
    const change = !memeValeur(champ, now, base);
    const bonSens =
      direction === "up" ? now > base : direction === "down" ? now < base : change;
    if (bonSens) satisfaits += 1;
  }
  return (satisfaits / attendus.size) * 100;
}
