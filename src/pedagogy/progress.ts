import type { SkillAxis } from "../config/pedagogy/concepts";

/**
 * Progression (doc 03 §6) : la maîtrise d'un concept évolue par événements
 * pondérés ; le profil par axe agrège les concepts (§28).
 */

/**
 * Seuil de maîtrise (échelle 0..100) à partir duquel un prérequis est réputé
 * acquis (doc 03 §6 ; V2 couche 2, chantier #1). Sert de policy au graphe de
 * prérequis (`CONCEPT_PREREQUISITES`) : c'est le filtrage par niveau (#2) qui
 * s'en servira pour ordonner et proposer les situations. Les situations
 * détectées, elles, restent des moments réactifs non filtrés.
 */
export const PREREQUISITE_MASTERY_THRESHOLD = 60;

/** Nouvelle maîtrise après une situation (moyenne mobile vers le score obtenu). */
export function updateMastery(current: number, situationScore: number, weight: number): number {
  const target = situationScore * 100;
  const learningRate = 0.35 * Math.min(1.5, Math.max(0.5, weight));
  const next = current + learningRate * (target - current);
  return Math.max(0, Math.min(100, next));
}

/** Agrège des maîtrises de concepts en valeur d'axe (moyenne simple v0.1). */
export function aggregateAxis(masteries: number[]): number {
  if (masteries.length === 0) return 0;
  return masteries.reduce((a, b) => a + b, 0) / masteries.length;
}

export const AXES: SkillAxis[] = [
  "finance",
  "marketing",
  "production",
  "analysis",
  "strategy",
  "decision",
  "risk",
];
