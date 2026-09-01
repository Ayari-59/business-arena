import { describe, expect, it } from "vitest";
import { hintScoreMultiplier, nextUnlockableLevel } from "../src/pedagogy/hints";
import { evaluateDiagnosis, evaluateQuiz } from "../src/pedagogy/evaluation";
import { buildTriggerContext, DETECTION_METADATA, detectSituations } from "../src/pedagogy/detection";
import type { TriggerFact } from "../src/pedagogy/detection";
import { updateMastery } from "../src/pedagogy/progress";
import {
  playerStrength,
  hintCostDiscount,
  adaptiveHintMultiplier,
} from "../src/pedagogy/adaptivity";
import { NOVA_SITUATIONS, situationByCode } from "../src/config/scenarios/nova/situations";
import { ALL_SITUATIONS } from "../src/config/scenarios/registry";
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

describe("QCM : connaissances + choix du modèle (§7)", () => {
  const quiz = situationByCode.get("nova_t4_paradox")!.quiz;

  it("score = moyenne des crédits ; sans réponse = 0", () => {
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

  it("le modèle trompeur rapporte un crédit partiel (0,2), pas zéro ni tout", () => {
    const answers = Object.fromEntries(quiz.map((q) => [q.id, q.correctOptionId]));
    answers["model_choice"] = "breakeven_analysis"; // misleading dans le paradoxe de trésorerie
    expect(evaluateQuiz(answers, quiz)).toBeCloseTo((quiz.length - 1 + 0.2) / quiz.length, 9);
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

  describe("trésorerie qui dort", () => {
    // Le seul déclencheur qui ne signale pas une panne : l'entreprise va bien,
    // et c'est justement pour cela que la question du placement se pose.
    const riche = {
      ...base,
      incomeStatement: { netIncome: 10000, fixedCosts: 90000 },
      functionalBalance: { netTreasury: 200000 },
      balanceSheet: { cash: 200000, overdraft: 0 },
    } as unknown as CompanyRoundResult;

    it("se déclenche sur un solde qui dépasse une fois et demie les charges de structure", () => {
      expect(detectSituations(riche, { placement: true })).toContain("idle_cash");
    });

    it("reste fermé aux niveaux qui n'ouvrent pas le placement", () => {
      // Poser l'arbitrage à un joueur qui n'a pas le champ sous les yeux
      // reviendrait à lui demander de trancher sans moyen d'agir.
      expect(detectSituations(riche)).not.toContain("idle_cash");
      expect(detectSituations(riche, { placement: false })).not.toContain("idle_cash");
    });

    it("ne se déclenche pas sur un solde ordinaire", () => {
      const ordinaire = {
        ...riche,
        balanceSheet: { cash: 100000, overdraft: 0 },
      } as unknown as CompanyRoundResult;
      expect(detectSituations(ordinaire, { placement: true })).not.toContain("idle_cash");
    });

    it("ne se déclenche pas si l'entreprise est déjà à découvert", () => {
      const decouvert = {
        ...riche,
        balanceSheet: { cash: 200000, overdraft: 4000 },
      } as unknown as CompanyRoundResult;
      expect(detectSituations(decouvert, { placement: true })).not.toContain("idle_cash");
    });

    it("ne se déclenche pas si le joueur a déjà placé", () => {
      // La leçon a été retenue : inutile de la reposer à chaque tour.
      const dejaPlace = {
        ...riche,
        balanceSheet: { cash: 200000, overdraft: 0, shortTermInvestment: 50000 },
      } as unknown as CompanyRoundResult;
      expect(detectSituations(dejaPlace, { placement: true })).not.toContain("idle_cash");
    });
  });
});

describe("métadonnées de détection (A1 — causalité visible)", () => {
  const base = {
    incomeStatement: { netIncome: 10000, fixedCosts: 90000 },
    functionalBalance: { netTreasury: -5000 },
    market: { bySegment: { s: { sold: 1000, lost: 200 } } },
    production: { utilizationRate: 0.99 },
    balanceSheet: { cash: 200000, overdraft: 0 },
  } as unknown as CompanyRoundResult;

  it("couvre les 5 codes de détection", () => {
    const codes: string[] = [
      "profitable_illiquid",
      "below_breakeven",
      "stockout",
      "capacity_saturated",
      "idle_cash",
    ];
    for (const code of codes) {
      expect(DETECTION_METADATA[code as keyof typeof DETECTION_METADATA], code).toBeDefined();
    }
  });

  it("buildTriggerContext retourne des faits non vides pour chaque code", () => {
    const codes = Object.keys(DETECTION_METADATA) as (keyof typeof DETECTION_METADATA)[];
    for (const code of codes) {
      const facts = buildTriggerContext(code, base);
      expect(facts.length, code).toBeGreaterThan(0);
      for (const fact of facts) {
        expect(fact.label.length, `${code}: label vide`).toBeGreaterThan(0);
        expect(fact.value.length, `${code}: value vide`).toBeGreaterThan(0);
        expect(["positive", "negative", "neutral"]).toContain(fact.direction);
      }
    }
  });

  it("profitable_illiquid : résultat positif, trésorerie négative", () => {
    const facts = buildTriggerContext("profitable_illiquid", base);
    expect(facts).toHaveLength(2);
    expect(facts[0]!.direction).toBe("positive");
    expect(facts[1]!.direction).toBe("negative");
  });

  it("below_breakeven : résultat négatif", () => {
    const losing = {
      ...base,
      incomeStatement: { ...base.incomeStatement, netIncome: -5000 },
    } as unknown as CompanyRoundResult;
    const facts = buildTriggerContext("below_breakeven", losing);
    expect(facts).toHaveLength(1);
    expect(facts[0]!.direction).toBe("negative");
  });

  it("stockout : unités vendues et demande perdue", () => {
    const facts = buildTriggerContext("stockout", base);
    expect(facts).toHaveLength(2);
    expect(facts[0]!.label).toContain("vendues");
    expect(facts[1]!.label).toContain("non servie");
  });

  it("capacity_saturated : taux d'utilisation et demande perdue", () => {
    const facts = buildTriggerContext("capacity_saturated", base);
    expect(facts).toHaveLength(2);
    expect(facts[0]!.label).toContain("utilisation");
    expect(facts[1]!.label).toContain("non servie");
  });

  it("idle_cash : trésorerie, charges, ratio", () => {
    const facts = buildTriggerContext("idle_cash", base);
    expect(facts).toHaveLength(3);
    expect(facts.every((f) => f.direction === "neutral")).toBe(true);
  });

  it("les faits n'utilisent jamais de formulation causale directe", () => {
    const codes = Object.keys(DETECTION_METADATA) as (keyof typeof DETECTION_METADATA)[];
    for (const code of codes) {
      const facts = buildTriggerContext(code, base);
      for (const fact of facts) {
        expect(fact.label).not.toMatch(/votre décision/i);
        expect(fact.label).not.toMatch(/vous avez/i);
        expect(fact.value).not.toMatch(/votre décision/i);
        expect(fact.value).not.toMatch(/a provoqué/i);
      }
    }
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
  it("les référentiels n'ont ni doublon ni trou", () => {
    // Ce test gelait le compte : « 24 concepts, 18 modèles ». Un nombre gelé
    // n'est pas un invariant, c'est un instantané : il devient rouge le jour
    // où le référentiel s'enrichit, c'est à dire le jour où l'on fait
    // exactement ce qu'il faut faire. Les notions du management commercial
    // l'ont fait tomber, et il ne protégeait rien d'autre que l'immobilité.
    //
    // Ce qui compte vraiment est ailleurs : aucun code en double, aucune fiche
    // sans son contenu, et un index qui voit tout le registre.
    expect(conceptByCode.size, "des codes de notion en double").toBe(CONCEPTS.length);
    expect(modelByCode.size, "des codes de modèle en double").toBe(DECISION_MODELS.length);
    expect(CONCEPTS.length, "registre des notions vide").toBeGreaterThan(20);
    expect(DECISION_MODELS.length, "registre des modèles vide").toBeGreaterThan(10);
    for (const c of CONCEPTS) {
      expect(c.name.length, `${c.code} : sans intitulé`).toBeGreaterThan(3);
      expect(c.definition.length, `${c.code} : sans définition`).toBeGreaterThan(30);
      expect(c.intuition.length, `${c.code} : sans intuition`).toBeGreaterThan(40);
      expect(c.method.length, `${c.code} : sans méthode`).toBeGreaterThan(40);
    }
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
  it("chaque situation porte 3 questions QCM bien formées : 2 connaissances + le modèle", () => {
    for (const s of NOVA_SITUATIONS) {
      expect(s.quiz.length, s.code).toBe(3);
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
  it("la question du modèle est en QCM (pas de liste), notée par la matrice de pertinence", () => {
    const credits = { optimal: 1, acceptable: 0.6, misleading: 0.2, irrelevant: 0 } as const;
    for (const s of NOVA_SITUATIONS) {
      const q = s.quiz[s.quiz.length - 1]!;
      expect(q.id, s.code).toBe("model_choice");
      expect(q.options.length, s.code).toBeLessThanOrEqual(4); // un QCM, pas le référentiel entier
      expect(s.modelRelevance[q.correctOptionId], s.code).toBe("optimal");
      for (const o of q.options) {
        expect(o.credit, `${s.code}/${o.id}`).toBe(
          credits[s.modelRelevance[o.id] ?? "irrelevant"],
        );
        expect(modelByCode.get(o.id)?.name, `${s.code}/${o.id}`).toBe(o.label);
      }
    }
  });
  it("chaque situation détectée a ses métadonnées de déclenchement (A1)", () => {
    const detected = ALL_SITUATIONS.filter((s) => "detect" in s.trigger);
    for (const s of detected) {
      const code = (s.trigger as { detect: string }).detect;
      expect(DETECTION_METADATA[code as keyof typeof DETECTION_METADATA], `${s.code} → ${code}`).toBeDefined();
    }
  });
  it("6 situations scriptées (une par tour) + 5 détectées", () => {
    const scripted = NOVA_SITUATIONS.filter((s) => "round" in s.trigger);
    const detected = NOVA_SITUATIONS.filter((s) => "detect" in s.trigger);
    expect(scripted.map((s) => (s.trigger as { round: number }).round).sort()).toEqual([1, 2, 3, 4, 5, 6]);
    // quatre pannes, plus la trésorerie qui dort : la seule qui s'ouvre alors
    // que tout va bien
    expect(detected).toHaveLength(5);
  });
});

describe("difficulté adaptive (§28 bis)", () => {
  const hintDefs = situationByCode.get("nova_t4_paradox")!.hints;

  it("playerStrength : moyenne des axes, 0 sans données", () => {
    expect(playerStrength([])).toBe(0);
    expect(playerStrength([{ value: 80 }, { value: 60 }])).toBe(70);
    expect(playerStrength([{ value: 100 }])).toBe(100);
  });

  it("hintCostDiscount : débutant paie moitié, expert plein tarif", () => {
    expect(hintCostDiscount(0)).toBe(0.5);
    expect(hintCostDiscount(100)).toBe(1.0);
    expect(hintCostDiscount(50)).toBe(0.75);
    expect(hintCostDiscount(-10)).toBe(0.5);
    expect(hintCostDiscount(200)).toBe(1.0);
  });

  it("adaptiveHintMultiplier réduit le coût pour les élèves faibles", () => {
    const levels = [1, 2, 3];
    const expertMultiplier = adaptiveHintMultiplier(levels, hintDefs, 100);
    const beginnerMultiplier = adaptiveHintMultiplier(levels, hintDefs, 0);
    expect(beginnerMultiplier).toBeGreaterThan(expertMultiplier);
    expect(expertMultiplier).toBeCloseTo(hintScoreMultiplier(levels, hintDefs), 9);
  });

  it("le plancher de 0.2 reste en vigueur pour tous les niveaux", () => {
    const allLevels = [1, 2, 3, 4, 5];
    expect(adaptiveHintMultiplier(allLevels, hintDefs, 0)).toBeGreaterThanOrEqual(0.2);
    expect(adaptiveHintMultiplier(allLevels, hintDefs, 100)).toBeCloseTo(0.2, 9);
  });

  it("sans indices débloqués, le discount n'a aucun effet", () => {
    expect(adaptiveHintMultiplier([], hintDefs, 0)).toBe(1);
    expect(adaptiveHintMultiplier([], hintDefs, 100)).toBe(1);
  });
});
