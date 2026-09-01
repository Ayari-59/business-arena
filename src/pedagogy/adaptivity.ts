/**
 * Difficulté adaptive (§28 bis) : le profil de compétences du joueur
 * modifie la pénalité des indices. Un élève faible paie moins cher
 * ses indices qu'un élève fort, parce que celui qui a le plus besoin
 * d'aide ne doit pas être celui que l'aide pénalise le plus.
 *
 * Module PUR : aucun import base, service ou framework.
 */

/** Force globale du joueur : moyenne des 7 axes, 0 si aucune donnée. */
export function playerStrength(skills: { value: number }[]): number {
  if (skills.length === 0) return 0;
  return skills.reduce((sum, s) => sum + s.value, 0) / skills.length;
}

/**
 * Réduction du coût des indices selon la force du joueur.
 *
 * Force 0 (débutant complet) → 0.5 (moitié du coût)
 * Force 50 (moyen)           → 0.75
 * Force 100 (expert)         → 1.0 (plein tarif)
 *
 * Interpolation linéaire : discount = 0.5 + strength / 200.
 */
export function hintCostDiscount(strength: number): number {
  return 0.5 + Math.min(100, Math.max(0, strength)) / 200;
}

/**
 * Multiplicateur de score après indices, avec discount adaptatif.
 *
 * Même contrat que `hintScoreMultiplier` de hints.ts, mais chaque
 * costRatio est multiplié par le discount avant sommation. Le plancher
 * reste 0.2 : même un débutant ne peut pas annuler tout le coût.
 */
export function adaptiveHintMultiplier(
  unlockedLevels: number[],
  hintDefs: { level: number; costRatio: number }[],
  strength: number,
): number {
  const discount = hintCostDiscount(strength);
  const totalCost = hintDefs
    .filter((h) => unlockedLevels.includes(h.level))
    .reduce((sum, h) => sum + h.costRatio * discount, 0);
  return Math.max(0.2, 1 - totalCost);
}
