import type { QuizQuestionDef } from "../config/scenarios/nova/situations";

/**
 * Évaluation pédagogique (doc 03 §3.1, doc 08 §1.3).
 * Diagnostic (F1) + QCM sous la même forme : 2 questions de connaissances et
 * la question du modèle d'analyse (notée en crédit partiel via la matrice de
 * pertinence — un modèle « trompeur » rapporte presque rien, §7).
 */

/** Crédit d'une réponse : crédit explicite de l'option, sinon 1 si correcte, 0 sinon. */
export function answerCredit(
  question: QuizQuestionDef,
  answered: string | undefined,
): number {
  const option = question.options.find((o) => o.id === answered);
  if (!option) return 0;
  return option.credit ?? (option.id === question.correctOptionId ? 1 : 0);
}

/**
 * Score du QCM : moyenne des crédits par question (question sans réponse ou
 * hors options = 0).
 */
export function evaluateQuiz(
  answers: Record<string, string | undefined>,
  questions: QuizQuestionDef[],
): number {
  if (questions.length === 0) return 0;
  const total = questions.reduce((sum, q) => sum + answerCredit(q, answers[q.id]), 0);
  return total / questions.length;
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
