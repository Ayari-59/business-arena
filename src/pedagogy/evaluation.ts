import type { QuizQuestionDef } from "../config/scenarios/nova/situations";

/**
 * Évaluation pédagogique (doc 03 §3.1, doc 08 §1.3).
 * Diagnostic (F1) + QCM de mobilisation des connaissances : le joueur n'a
 * plus à désigner le modèle d'analyse — il prouve qu'il maîtrise les
 * connaissances que la situation mobilise.
 */

/**
 * Score du QCM : part de bonnes réponses (une seule bonne réponse par
 * question ; question sans réponse = fausse).
 */
export function evaluateQuiz(
  answers: Record<string, string | undefined>,
  questions: QuizQuestionDef[],
): number {
  if (questions.length === 0) return 0;
  const correct = questions.filter((q) => answers[q.id] === q.correctOptionId).length;
  return correct / questions.length;
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
