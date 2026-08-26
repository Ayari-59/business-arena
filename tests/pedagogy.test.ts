import { describe, expect, it } from "vitest";
import { hintScoreMultiplier, nextUnlockableLevel } from "../src/pedagogy/hints";
import { evaluateDiagnosis, evaluateQuiz } from "../src/pedagogy/evaluation";
import { detectSituations } from "../src/pedagogy/detection";
import { updateMastery } from "../src/pedagogy/progress";
import { NOVA_SITUATIONS, situationByCode } from "../src/config/scenarios/nova/situations";
import { CONCEPTS, conceptByCode } from "../src/config/pedagogy/concepts";
import { DECISION_MODELS, modelByCode } from "../src/config/pedagogy/models";
import type { CompanyRoundResult } from "../src/engine/types";

describe("système d'indices (doc 03 §4)", () => {
  const hintDefs = situationByCode.get("nova_t4_paradox")!.hints;

  it("déblocage strictement séquentiel", () => {
    expect(nextUnlockableLevel([])).toBe(1);
    expect(nextUnlockableLevel([1, 2])).toBe(3);
    expect(nextUnlockableLevel([1, 2, 3, 4, 5])).toBeNull();
    expect(() => nextUnlockableLevel([2])).toThrow(); // séquence corrompue
  });

  it("coûts cumulés : 5 %, 15 %, 35 %, 70 %... plancher à 20 % de score restant", () => {
    expect(hintScoreMultiplier([], hintDefs)).toBe(1);
    expect(hintScoreMultiplier([1], hintDefs)).toBeCloseTo(0.95, 9);
    expect(hintScoreMultiplier([1, 2, 3], hintDefs)).toBeCloseTo(0.65, 9);
    expect(hintScoreMultiplier([1, 2, 3, 4, 5], hintDefs)).toBeCloseTo(0.2, 9); // plancher
  });

});

describe("QCM de mobilisation des connaissances", () => {
  const quiz = situationByCode.get("nova_t4_paradox")!.quiz;

  it("score = part de bonnes réponses ; sans réponse = faux", () => {
    const perfect = Object.fromEntries(quiz.map((q) => [q.id, q.correctOptionId]));
    expect(evaluateQuiz(perfect, quiz)).toBe(1);
    expect(evaluateQuiz({}, quiz)).toBe(0);
    const [first, ...rest] = quiz;
    const partial = { [first!.id]: first!.correctOptionId };
    expect(evaluateQuiz(partial, quiz)).toBeCloseTo(1 / quiz.length, 9);
    void rest;
  });

  it("une réponse hors options compte comme fausse", () => {
    const wrong = Object.fromEntries(quiz.map((q) => [q.id, "zzz"]));
    expect(evaluateQuiz(wrong, quiz)).toBe(0);
  });
});

describe("évaluation du diagnostic (F1)", () => {
  const options = [
    { id: "a", correct: true },
    { id: "b", correct: true },
    { id: "c", correct: false },
    { id: "d", correct: false },
  ];
  it("parfait = 1, tout cocher est pénalisé, rien = 0", () => {
    expect(evaluateDiagnosis(["a", "b"], options)).toBe(1);
    expect(evaluateDiagnosis(["a", "b", "c", "d"], options)).toBeCloseTo(2 / 3, 9);
    expect(evaluateDiagnosis([], options)).toBe(0);
    expect(evaluateDiagnosis(["c"], options)).toBe(0);
  });
});

describe("détection de situations (doc 03 §1.1)", () => {
  const base = {
    incomeStatement: { netIncome: 10000 },
    functionalBalance: { netTreasury: -5000 },
    market: { bySegment: { s: { sold: 1000, lost: 50 } } },
    production: { utilizationRate: 0.8 },
  } as unknown as CompanyRoundResult;

  it("rentable mais illiquide", () => {
    expect(detectSituations(base)).toContain("profitable_illiquid");
  });
  it("rupture au-delà de 10 % des ventes", () => {
    const stockout = {
      ...base,
      market: { bySegment: { s: { sold: 1000, lost: 200 } } },
    } as unknown as CompanyRoundResult;
    expect(detectSituations(stockout)).toContain("stockout");
    expect(detectSituations(base)).not.toContain("stockout");
  });
  it("atelier saturé : machine à plein ET demande perdue ⇒ la question d'investir", () => {
    const saturated = {
      ...base,
      production: { utilizationRate: 0.99 },
      market: { bySegment: { s: { sold: 1000, lost: 80 } } },
    } as unknown as CompanyRoundResult;
    expect(detectSituations(saturated)).toContain("capacity_saturated");
    // machine à plein mais demande servie : pas de situation
    const served = {
      ...base,
      production: { utilizationRate: 0.99 },
      market: { bySegment: { s: { sold: 1000, lost: 10 } } },
    } as unknown as CompanyRoundResult;
    expect(detectSituations(served)).not.toContain("capacity_saturated");
    // demande perdue mais machine sous-utilisée (mauvais plan) : rupture, pas investissement
    expect(detectSituations(base)).not.toContain("capacity_saturated");
  });

  it("sous le seuil", () => {
    const losing = {
      ...base,
      incomeStatement: { netIncome: -1 },
    } as unknown as CompanyRoundResult;
    expect(detectSituations(losing)).toContain("below_breakeven");
    expect(detectSituations(losing)).not.toContain("profitable_illiquid");
  });
});

describe("progression (doc 03 §6)", () => {
  it("la maîtrise converge vers le score obtenu, bornée 0..100", () => {
    const after = updateMastery(50, 1, 1);
    expect(after).toBeGreaterThan(50);
    expect(updateMastery(50, 0, 1)).toBeLessThan(50);
    expect(updateMastery(100, 1, 1.5)).toBeLessThanOrEqual(100);
  });
});

describe("cohérence des référentiels", () => {
  it("24 concepts (20 MVP + investissement + trésorerie), 18 modèles, codes uniques", () => {
    expect(CONCEPTS).toHaveLength(24);
    expect(DECISION_MODELS).toHaveLength(18);
    expect(conceptByCode.size).toBe(24);
    expect(modelByCode.size).toBe(18);
  });
  it("chaque situation référence des concepts et modèles existants, avec 5 indices", () => {
    for (const s of NOVA_SITUATIONS) {
      expect(s.hints.map((h) => h.level)).toEqual([1, 2, 3, 4, 5]);
      for (const code of s.conceptCodes) expect(conceptByCode.has(code), code).toBe(true);
      for (const code of Object.keys(s.modelRelevance)) expect(modelByCode.has(code), code).toBe(true);
      expect(s.diagnosticOptions.some((o) => o.correct)).toBe(true);
      expect(s.diagnosticOptions.some((o) => !o.correct)).toBe(true); // toujours des leurres
      expect(Object.values(s.modelRelevance)).toContain("optimal");
    }
  });
  it("chaque situation porte 2 à 3 questions QCM bien formées", () => {
    for (const s of NOVA_SITUATIONS) {
      expect(s.quiz.length, s.code).toBeGreaterThanOrEqual(2);
      expect(s.quiz.length, s.code).toBeLessThanOrEqual(3);
      const questionIds = new Set(s.quiz.map((q) => q.id));
      expect(questionIds.size, s.code).toBe(s.quiz.length); // ids uniques
      for (const q of s.quiz) {
        expect(q.options.length, `${s.code}/${q.id}`).toBeGreaterThanOrEqual(3);
        expect(
          q.options.some((o) => o.id === q.correctOptionId),
          `${s.code}/${q.id}`,
        ).toBe(true); // la bonne réponse existe parmi les options
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        expect(q.explain.length, `${s.code}/${q.id}`).toBeGreaterThan(20); // correction expliquée
      }
    }
  });
  it("6 situations scriptées (une par tour) + 4 détectées", () => {
    const scripted = NOVA_SITUATIONS.filter((s) => "round" in s.trigger);
    const detected = NOVA_SITUATIONS.filter((s) => "detect" in s.trigger);
    expect(scripted.map((s) => (s.trigger as { round: number }).round).sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(detected).toHaveLength(4);
  });
});
