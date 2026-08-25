import type { ModelRelevance } from "../config/scenarios/nova/situations";

/**
 * Évaluation pédagogique (doc 03 §3.1, doc 08 §1.3).
 * Une décision juste obtenue avec un modèle mal choisi vaut moins qu'une
 * décision correctement raisonnée (§7).
 */

export const RELEVANCE_SCORES: Record<ModelRelevance, number> = {
  optimal: 1,
  acceptable: 0.6,
  misleading: 0.2,
  irrelevant: 0,
};

/** Qualité de justification v0.1 : heuristique de richesse (LLM à l'étape 12). */
export function justificationQuality(text: string | null | undefined): number {
  const trimmed = (text ?? "").trim();
  if (trimmed.length >= 80) return 1;
  if (trimmed.length >= 30) return 0.7;
  if (trimmed.length >= 10) return 0.4;
  return 0.2;
}

/**
 * Score du choix de modèle : pertinence × (0,5 + 0,5 × justification),
 * plafonné à `acceptable` si le modèle a été soufflé par l'indice niveau 4.
 */
export function evaluateModelChoice(args: {
  relevance: ModelRelevance;
  justification: string | null | undefined;
  hinted: boolean;
}): number {
  const base = RELEVANCE_SCORES[args.relevance];
  const capped = args.hinted ? Math.min(base, RELEVANCE_SCORES.acceptable) : base;
  return capped * (0.5 + 0.5 * justificationQuality(args.justification));
}

/**
 * Score de diagnostic : F1 entre options cochées et options correctes
 * (précision ET rappel — cocher tout ne rapporte rien).
 */
export function evaluateDiagnosis(
  selected: string[],
  options: { id: string; correct: boolean }[],
): number {
  const correct = new Set(options.filter((o) => o.correct).map((o) => o.id));
  if (correct.size === 0) return 0;
  const valid = new Set(options.map((o) => o.id));
  const chosen = selected.filter((id) => valid.has(id));
  if (chosen.length === 0) return 0;
  const truePositives = chosen.filter((id) => correct.has(id)).length;
  const precision = truePositives / chosen.length;
  const recall = truePositives / correct.size;
  return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
}
