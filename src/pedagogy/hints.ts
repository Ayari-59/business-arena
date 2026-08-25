import type { SituationHintDef } from "../config/scenarios/nova/situations";

/**
 * Machine à indices (doc 03 §4) : 5 niveaux STRICTEMENT séquentiels, coûts
 * cumulés appliqués au score pédagogique de la situation — jamais aux
 * résultats économiques.
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

/** Multiplicateur de score restant après indices (1 − Σ coûts), plancher 0,2. */
export function hintScoreMultiplier(
  unlockedLevels: number[],
  hintDefs: SituationHintDef[],
): number {
  const totalCost = hintDefs
    .filter((h) => unlockedLevels.includes(h.level))
    .reduce((sum, h) => sum + h.costRatio, 0);
  return Math.max(0.2, 1 - totalCost);
}

/** L'indice de niveau 4 (modèle) a-t-il été utilisé ? (plafonne le score modèle, §7) */
export function modelWasHinted(unlockedLevels: number[]): boolean {
  return unlockedLevels.includes(4) || unlockedLevels.includes(5);
}
