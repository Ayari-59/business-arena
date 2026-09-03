import { describe, expect, it } from "vitest";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { MODEL_QUESTION_ID } from "../../src/config/scenarios/situation-kit";
import { patchSituationText } from "../../src/config/scenarios/situation-patch";

/**
 * Édition du texte d'une situation (éditeur de scénarios, PR 4) : le texte
 * change, la STRUCTURE (ids, exactitude, niveaux/coûts d'indices, matrice de
 * pertinence) est préservée.
 */

const nova = scenarioByCode("nova");
const base = nova.situations.find((s) => "round" in s.trigger)!;

describe("patchSituationText", () => {
  it("remplace le texte et conserve la structure", () => {
    const patched = patchSituationText(base, {
      title: "Nouveau titre",
      narrative: "Nouveau récit",
      problem: "Nouvelle question ?",
      diagnosticLabels: base.diagnosticOptions.map((_, i) => `Diag ${i}`),
      hintTexts: base.hints.map((_, i) => `Indice ${i}`),
      modelExplain: "Nouvelle correction.",
      weight: 3,
    });

    expect(patched.title).toBe("Nouveau titre");
    expect(patched.narrative).toBe("Nouveau récit");
    expect(patched.weight).toBe(3);

    // Structure inchangée : ids et exactitude des options, niveaux et coûts.
    expect(patched.diagnosticOptions.map((o) => o.id)).toEqual(
      base.diagnosticOptions.map((o) => o.id),
    );
    expect(patched.diagnosticOptions.map((o) => o.correct)).toEqual(
      base.diagnosticOptions.map((o) => o.correct),
    );
    expect(patched.hints.map((h) => [h.level, h.costRatio])).toEqual(
      base.hints.map((h) => [h.level, h.costRatio]),
    );
    expect(patched.modelRelevance).toEqual(base.modelRelevance);
    expect(patched.conceptCodes).toEqual(base.conceptCodes);

    // La correction est portée par la question canonique du modèle.
    const mq = patched.quiz.find((q) => q.id === MODEL_QUESTION_ID)!;
    expect(mq.explain).toBe("Nouvelle correction.");
  });

  it("refuse un champ vide", () => {
    expect(() =>
      patchSituationText(base, {
        title: "  ",
        narrative: "x",
        problem: "x",
        diagnosticLabels: base.diagnosticOptions.map(() => "x"),
        hintTexts: base.hints.map(() => "x"),
        modelExplain: "x",
      }),
    ).toThrow(/titre/);
  });

  it("refuse un mauvais nombre d'options ou d'indices", () => {
    expect(() =>
      patchSituationText(base, {
        title: "x",
        narrative: "x",
        problem: "x",
        diagnosticLabels: ["une seule"],
        hintTexts: base.hints.map(() => "x"),
        modelExplain: "x",
      }),
    ).toThrow(/diagnostic/);
  });

  it("change le tour de déclenchement d'une situation scriptée", () => {
    const patched = patchSituationText(base, {
      title: "x",
      narrative: "x",
      problem: "x",
      diagnosticLabels: base.diagnosticOptions.map(() => "x"),
      hintTexts: base.hints.map(() => "x"),
      modelExplain: "x",
      triggerRound: 4,
    });
    expect(patched.trigger).toEqual({ round: 4 });
  });
});
