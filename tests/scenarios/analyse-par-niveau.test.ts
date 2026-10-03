import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { modelQuestionFor } from "../../src/config/scenarios/situation-kit";
import {
  diagnosticAChoixUnique,
  NIVEAU_STANDARD,
  optionsDuDiagnostic,
  PREFIXE_QUESTION_LEVIER,
  profondeurDAnalyse,
  questionDuLevier,
} from "../../src/config/analyse-par-niveau";
import { evaluateDiagnosis, evaluateQuiz } from "../../src/pedagogy/evaluation";

/**
 * LES QUESTIONS D'ANALYSE SUIVENT LE NIVEAU : D'ABORD UN CHOIX ENTRE DEUX.
 *
 * Quatre choses à tenir sur les cent trente-sept situations : les premiers
 * niveaux posent des questions plus courtes SANS jamais retirer la bonne
 * réponse ; l'aide d'un modèle disparaît au palier Standard ; la question du
 * levier ne se pose qu'aux niveaux 1-2 et seulement quand la situation désigne
 * un sens ; et ce qui est affiché est exactement ce qui est noté — sinon une
 * cause juste jamais proposée serait « manquée ».
 */

const ALL = SCENARIOS.flatMap((d) => d.situations.map((s) => ({ sector: d.code, s })));

describe("profondeur d'analyse", () => {
  it("Intuition aux niveaux 1-2, Découverte au 3, Standard de 4 à 6", () => {
    expect([1, 2].map(profondeurDAnalyse)).toEqual(["intuition", "intuition"]);
    expect(profondeurDAnalyse(3)).toBe("decouverte");
    expect([4, 5, 6].map(profondeurDAnalyse)).toEqual(["standard", "standard", "standard"]);
    // Une partie inconnue reçoit le palier complet, jamais une version abrégée.
    expect(profondeurDAnalyse(NIVEAU_STANDARD)).toBe("standard");
  });

  it("seuls les niveaux 1-2 répondent d'un seul geste (boutons radio)", () => {
    expect([1, 2, 3, 4, 6].map(diagnosticAChoixUnique)).toEqual([true, true, false, false, false]);
  });
});

describe("le diagnostic", () => {
  it("niveaux 1-2 : un choix entre deux, une cause juste et une fausse", () => {
    for (const { sector, s } of ALL) {
      const vues = optionsDuDiagnostic(s.diagnosticOptions, 1);
      const fausses = s.diagnosticOptions.filter((o) => !o.correct).length;
      if (fausses >= 1) {
        expect(vues, `${sector}/${s.code}`).toHaveLength(2);
        expect(vues.filter((o) => o.correct), `${sector}/${s.code}`).toHaveLength(1);
      }
      expect(optionsDuDiagnostic(s.diagnosticOptions, 2)).toEqual(vues);
    }
  });

  it("niveau 3 : trois causes dont une seule juste, quand la situation le permet", () => {
    for (const { sector, s } of ALL) {
      const vues = optionsDuDiagnostic(s.diagnosticOptions, 3);
      const fausses = s.diagnosticOptions.filter((o) => !o.correct).length;
      if (fausses >= 2) {
        expect(vues, `${sector}/${s.code}`).toHaveLength(3);
        expect(vues.filter((o) => o.correct), `${sector}/${s.code}`).toHaveLength(1);
      } else {
        // Pas assez de mauvaises options : la question reste entière.
        expect(vues, `${sector}/${s.code}`).toHaveLength(s.diagnosticOptions.length);
      }
    }
  });

  it("jamais sans bonne réponse, jamais sans mauvaise, ordre d'écriture conservé", () => {
    for (const { sector, s } of ALL) {
      for (const niveau of [1, 2, 3]) {
        const vues = optionsDuDiagnostic(s.diagnosticOptions, niveau);
        expect(vues.some((o) => o.correct), `${sector}/${s.code}/n${niveau} : plus de bonne réponse`).toBe(true);
        expect(vues.some((o) => !o.correct), `${sector}/${s.code}/n${niveau} : plus de mauvaise réponse`).toBe(true);
        const ids = s.diagnosticOptions.map((o) => o.id).filter((id) => vues.some((o) => o.id === id));
        expect(vues.map((o) => o.id)).toEqual(ids);
      }
    }
  });

  it("niveaux 4 à 6 : les options d'origine, intactes", () => {
    for (const { s } of ALL) {
      for (const niveau of [4, 5, 6]) {
        expect(optionsDuDiagnostic(s.diagnosticOptions, niveau)).toEqual(s.diagnosticOptions);
      }
    }
  });

  it("ce qui est affiché est ce qui est noté", () => {
    for (const { sector, s } of ALL) {
      for (const niveau of [1, 3]) {
        const vues = optionsDuDiagnostic(s.diagnosticOptions, niveau);
        const justes = vues.filter((o) => o.correct).map((o) => o.id);
        expect(evaluateDiagnosis(justes, vues), `${sector}/${s.code}/n${niveau}`).toBe(1);
        // Une mauvaise cause cochée seule ne rapporte rien.
        const fausse = vues.find((o) => !o.correct)!;
        expect(evaluateDiagnosis([fausse.id], vues), `${sector}/${s.code}/n${niveau}`).toBe(0);
        // Une cause juste qu'on n'a pas proposée ne compte ni en bien ni en mal.
        const cachees = s.diagnosticOptions.filter((o) => o.correct && !vues.some((v) => v.id === o.id));
        expect(evaluateDiagnosis([...justes, ...cachees.map((o) => o.id)], vues), `${sector}/${s.code}`).toBe(1);
      }
    }
  });
});

describe("le choix du modèle", () => {
  it("niveaux 1-2 : deux modèles, chacun avec sa phrase d'objectif ; l'optimal est là", () => {
    for (const { sector, s } of ALL) {
      for (const niveau of [1, 2]) {
        const q = modelQuestionFor(s, niveau, 4242);
        expect(q.options, `${sector}/${s.code}/n${niveau}`).toHaveLength(2);
        expect(s.modelRelevance[q.correctOptionId], `${sector}/${s.code}`).toBe("optimal");
        for (const o of q.options) {
          expect(o.aide, `${sector}/${s.code}/${o.id} : phrase d'objectif manquante`).toBeTruthy();
        }
      }
    }
  });

  it("niveaux 1-2 : le mauvais modèle n'est jamais à moitié juste quand un choix plus net existe", () => {
    for (const { sector, s } of ALL) {
      const q = modelQuestionFor(s, 1, 7);
      const autre = q.options.find((o) => o.id !== q.correctOptionId)!;
      const plusNets = Object.entries(s.modelRelevance).filter(([, r]) => r === "irrelevant" || r === "misleading");
      if (plusNets.length > 0) {
        expect(s.modelRelevance[autre.id], `${sector}/${s.code} : ${autre.id}`).not.toBe("acceptable");
      }
    }
  });

  it("niveau 3 : trois modèles avec leur phrase d'objectif, les plus étrangers d'abord", () => {
    for (const { sector, s } of ALL) {
      const q = modelQuestionFor(s, 3, 4242);
      expect(q.options, `${sector}/${s.code}`).toHaveLength(3);
      for (const o of q.options) expect(o.aide, `${sector}/${s.code}/${o.id}`).toBeTruthy();
      const autres = Object.entries(s.modelRelevance).filter(([, r]) => r === "irrelevant" || r === "acceptable").length;
      if (autres >= 2) {
        expect(
          q.options.some((o) => s.modelRelevance[o.id] === "misleading"),
          `${sector}/${s.code} : un piège au niveau 3 alors que des choix plus simples existent`,
        ).toBe(false);
      }
    }
  });

  it("niveaux 4 à 6 : jusqu'à quatre modèles, sans phrase d'aide", () => {
    for (const { sector, s } of ALL) {
      for (const niveau of [4, 5, 6]) {
        const q = modelQuestionFor(s, niveau, 99);
        expect(q.options.length, `${sector}/${s.code}/n${niveau}`).toBeGreaterThanOrEqual(3);
        expect(q.options.length).toBeLessThanOrEqual(4);
        expect(q.options.some((o) => o.aide), `${sector}/${s.code}/n${niveau}`).toBe(false);
      }
    }
  });
});

describe("la question du levier : augmenter ou diminuer ?", () => {
  it("n'existe qu'aux niveaux 1-2", () => {
    for (const { s } of ALL) {
      for (const niveau of [3, 4, 5, 6]) expect(questionDuLevier(s, niveau)).toBeNull();
    }
  });

  it("existe pour toute situation qui désigne un sens, jamais pour les seuls leviers « à revoir »", () => {
    let posees = 0;
    for (const { sector, s } of ALL) {
      const aUnSens = (s.decisionLevers ?? []).some((l) => l.direction !== "review");
      const q = questionDuLevier(s, 1);
      expect(q !== null, `${sector}/${s.code}`).toBe(aUnSens);
      if (q) posees += 1;
    }
    expect(posees).toBeGreaterThan(50);
  });

  it("un choix entre deux, dont la bonne réponse est le sens du levier, avec sa correction", () => {
    for (const { sector, s } of ALL) {
      const q = questionDuLevier(s, 2);
      if (!q) continue;
      expect(q.id.startsWith(PREFIXE_QUESTION_LEVIER), `${sector}/${s.code}`).toBe(true);
      expect(q.options.map((o) => o.id)).toEqual(["up", "down"]);
      expect(q.options[0]!.label).toMatch(/^Augmenter /);
      expect(q.options[1]!.label).toMatch(/^Diminuer /);
      const levier = s.decisionLevers.find((l) => l.direction !== "review")!;
      expect(q.correctOptionId).toBe(levier.direction);
      expect(q.explain).toBe(levier.hint);
      // Bonne réponse : tout le crédit ; l'autre sens : rien.
      expect(evaluateQuiz({ [q.id]: q.correctOptionId }, [q])).toBe(1);
      expect(evaluateQuiz({ [q.id]: q.correctOptionId === "up" ? "down" : "up" }, [q])).toBe(0);
    }
  });

  it("se lit comme une phrase : « que faites-vous du prix de vente ? »", () => {
    const prix = ALL.map(({ s }) => ({ s, q: questionDuLevier(s, 1) })).find(
      ({ s }) => s.decisionLevers.find((l) => l.direction !== "review")?.field === "price",
    )!;
    expect(prix.q!.prompt).toBe("Pour répondre à cette situation, que faites-vous du prix de vente ?");
    expect(prix.q!.options.map((o) => o.label)).toEqual(["Augmenter le prix de vente", "Diminuer le prix de vente"]);
  });
});
