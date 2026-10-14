import type { SituationHintDef } from "../config/scenarios/nova/situations";

/**
 * Machine à indices (doc 03 §4) : 5 niveaux STRICTEMENT séquentiels, dont les
 * coûts s'additionnent sur le score pédagogique de la situation — jamais sur
 * les résultats économiques.
 *
 * Le barème vit dans `situation-kit` (HINT_COSTS) et laisse 80 % du score
 * quand les cinq indices sont ouverts. Le plancher ci-dessous n'est donc plus
 * atteint par le barème standard : il ne protège plus que d'un scénario sur
 * mesure dont les coûts dépasseraient 80 %.
 */

/** Le prochain niveau déblocable (null si tout est débloqué). */
export function nextUnlockableLevel(unlockedLevels: number[]): 1 | 2 | 3 | 4 | 5 | null {
  const max = unlockedLevels.length === 0 ? 0 : Math.max(...unlockedLevels);
  // séquentialité stricte : le préfixe 1..max doit être complet
  for (let level = 1; level <= max; level++) {
    if (!unlockedLevels.includes(level)) throw new Error("Séquence d'indices corrompue");
  }
  return max >= 5 ? null : ((max + 1) as 1 | 2 | 3 | 4 | 5);
}

/** Multiplicateur de score restant après indices (1 − Σ coûts), filet à 0,2. */
export function hintScoreMultiplier(
  unlockedLevels: number[],
  hintDefs: SituationHintDef[],
): number {
  const totalCost = hintDefs
    .filter((h) => unlockedLevels.includes(h.level))
    .reduce((sum, h) => sum + h.costRatio, 0);
  return Math.max(0.2, 1 - totalCost);
}
