import { describe, expect, it } from "vitest";
import { MODEL_QUESTION_ID } from "../../src/config/scenarios/situation-kit";
import { buildSituation, type NewSituationInput } from "../../src/config/scenarios/situation-build";

/**
 * Construction d'une situation de zéro (éditeur de scénarios) : le constructeur
 * valide tous les invariants avant qu'une situation bancale n'atteigne une
 * partie, et attache la question du modèle.
 */

const valide = (): NewSituationInput => ({
  category: "decision_strategique",
  title: "Fixer le prix de lancement",
  narrative: "L'atelier ouvre, aucun prix n'est encore posé.",
  problem: "À quel prix lancer la première série ?",
  diagnostic: [
    { label: "Aligner sur le concurrent", correct: false },
    { label: "Partir de la structure de coûts et de la demande", correct: true },
    { label: "", correct: false },
    { label: "", correct: false },
  ],
  modelRelevance: {
    cvp_analysis: "optimal",
    breakeven_analysis: "acceptable",
    elasticity_analysis: "misleading",
  },
  conceptCodes: ["demand_market_share"],
  hints: ["Indice 1", "Indice 2", "Indice 3", "Indice 4", "Indice 5"],
  modelExplain: "Le coût-volume-profit relie prix, volume et marge.",
  trigger: { round: 1 },
  weight: 1,
});

describe("buildSituation", () => {
  it("construit une situation valide et attache la question du modèle", () => {
    const s = buildSituation(valide(), "sc-situ-test");
    expect(s.code).toBe("sc-situ-test");
    expect(s.diagnosticOptions).toHaveLength(2); // les options vides sont écartées
    expect(s.diagnosticOptions.filter((o) => o.correct)).toHaveLength(1);
    expect(s.hints).toHaveLength(5);
    // La question du modèle a été attachée, avec la correction fournie.
    const mq = s.quiz.find((q) => q.id === MODEL_QUESTION_ID)!;
    expect(mq).toBeDefined();
    expect(mq.explain).toContain("coût-volume-profit");
  });

  it("refuse une matrice sans « optimal »", () => {
    const input = valide();
    input.modelRelevance = { cvp_analysis: "acceptable" };
    expect(() => buildSituation(input, "c")).toThrow(/optimal/);
  });

  it("refuse un modèle inconnu", () => {
    const input = valide();
    input.modelRelevance = { modele_bidon: "optimal" };
    expect(() => buildSituation(input, "c")).toThrow(/inconnu/);
  });

  it("refuse une notion inconnue", () => {
    const input = valide();
    input.conceptCodes = ["notion_bidon"];
    expect(() => buildSituation(input, "c")).toThrow(/inconnue/);
  });

  it("refuse moins de deux options ou pas exactement une bonne réponse", () => {
    const uneOption = valide();
    uneOption.diagnostic = [{ label: "seule", correct: true }, { label: "", correct: false }];
    expect(() => buildSituation(uneOption, "c")).toThrow(/deux options/);

    const zeroBonne = valide();
    zeroBonne.diagnostic = [
      { label: "a", correct: false },
      { label: "b", correct: false },
    ];
    expect(() => buildSituation(zeroBonne, "c")).toThrow(/une option/);
  });

  it("refuse un champ texte vide", () => {
    const input = valide();
    input.title = "   ";
    expect(() => buildSituation(input, "c")).toThrow(/titre/);
  });
});
