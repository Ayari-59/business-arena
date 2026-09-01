/**
 * Score brut d'une situation pédagogique avant pénalité d'indices.
 *
 * Le calcul est identique dans debriefRound (score d'équipe persisté) et dans
 * getGameGradeSheet (décomposition du relevé de notes). L'extraire ici garantit
 * que les deux sites restent synchronisés.
 */

export interface RawScoreInput {
  diagnosisScore: number;
  quizScore: number | null;
  hasQuizQuestions: boolean;
}

export function computeRawSituationScore(input: RawScoreInput): number {
  if (!input.hasQuizQuestions) return input.diagnosisScore;
  const knowledge = input.quizScore ?? 0;
  return 0.5 * input.diagnosisScore + 0.5 * knowledge;
}
