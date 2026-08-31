import { describe, expect, it } from "vitest";
import { computeRawSituationScore, type RawScoreInput } from "../../src/pedagogy/scoring";

describe("computeRawSituationScore", () => {
  it("cas nominal : diagnostic + quiz", () => {
    const input: RawScoreInput = { diagnosisScore: 0.8, quizScore: 0.6, hasQuizQuestions: true };
    expect(computeRawSituationScore(input)).toBeCloseTo(0.7);
  });

  it("diagnostic seul, pas de questions posées", () => {
    const input: RawScoreInput = { diagnosisScore: 0.75, quizScore: null, hasQuizQuestions: false };
    expect(computeRawSituationScore(input)).toBe(0.75);
  });

  it("questions posées mais quiz non soumis : quizScore null vaut 0", () => {
    const input: RawScoreInput = { diagnosisScore: 0.8, quizScore: null, hasQuizQuestions: true };
    expect(computeRawSituationScore(input)).toBeCloseTo(0.4);
  });

  it("questions posées, quiz parfait", () => {
    const input: RawScoreInput = { diagnosisScore: 1, quizScore: 1, hasQuizQuestions: true };
    expect(computeRawSituationScore(input)).toBe(1);
  });

  it("questions posées, tout à zéro", () => {
    const input: RawScoreInput = { diagnosisScore: 0, quizScore: 0, hasQuizQuestions: true };
    expect(computeRawSituationScore(input)).toBe(0);
  });

  it("diagnostic zéro sans quiz", () => {
    const input: RawScoreInput = { diagnosisScore: 0, quizScore: null, hasQuizQuestions: false };
    expect(computeRawSituationScore(input)).toBe(0);
  });

  it("pondération 50/50 exacte", () => {
    const input: RawScoreInput = { diagnosisScore: 0.4, quizScore: 0.9, hasQuizQuestions: true };
    expect(computeRawSituationScore(input)).toBeCloseTo(0.65);
  });

  it("quizScore ignoré quand hasQuizQuestions est false", () => {
    const input: RawScoreInput = { diagnosisScore: 0.6, quizScore: 0.9, hasQuizQuestions: false };
    expect(computeRawSituationScore(input)).toBe(0.6);
  });
});
