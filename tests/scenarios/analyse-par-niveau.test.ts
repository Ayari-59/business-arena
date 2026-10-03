import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { modelQuestionFor } from "../../src/config/scenarios/situation-kit";
import {
  NIVEAU_STANDARD,
  optionsDuDiagnostic,
  profondeurDAnalyse,
} from "../../src/config/analyse-par-niveau";
import { evaluateDiagnosis } from "../../src/pedagogy/evaluation";

/**
 * LES QUESTIONS D'ANALYSE SONT PLUS SIMPLES AUX PREMIERS NIVEAUX.
 *
 * Trois choses à tenir sur les cent trente-sept situations : le niveau
 * Découverte pose des questions plus courtes SANS jamais retirer la bonne
 * réponse ; l'aide d'un modèle n'apparaît qu'à ce niveau ; et ce qui est
 * affiché est exactement ce qui est noté — sinon une cause juste jamais
 * proposée serait « manquée ».
 */

const ALL = SCENARIOS.flatMap((d) => d.situations.map((s) => ({ sector: d.code, s })));

describe("profondeur d'analyse", () => {
  it("Découverte aux niveaux 1-2, Standard au-delà", () => {
    expect([1, 2].map(profondeurDAnalyse)).toEqual(["decouverte", "decouverte"]);
    expect([3, 4, 5, 6].map(profondeurDAnalyse)).toEqual(["standard", "standard", "standard", "standard"]);
    expect(profondeurDAnalyse(NIVEAU_STANDARD)).toBe("standard");
  });
});

describe("le diagnostic", () => {
  it("Découverte : trois causes dont une seule juste, quand la situation le permet", () => {
    for (const { sector, s } of ALL) {
      const vues = optionsDuDiagnostic(s.diagnosticOptions, 1);
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

  it("Découverte : jamais sans bonne réponse, jamais sans mauvaise, ordre conservé", () => {
    for (const { sector, s } of ALL) {
      const vues = optionsDuDiagnostic(s.diagnosticOptions, 2);
      expect(vues.some((o) => o.correct), `${sector}/${s.code} : plus de bonne réponse`).toBe(true);
      expect(vues.some((o) => !o.correct), `${sector}/${s.code} : plus de mauvaise réponse`).toBe(true);
      const ids = s.diagnosticOptions.map((o) => o.id).filter((id) => vues.some((o) => o.id === id));
      expect(vues.map((o) => o.id)).toEqual(ids);
    }
  });

  it("Standard : les options d'origine, intactes", () => {
    for (const { s } of ALL) {
      for (const niveau of [3, 4, 5, 6]) {
        expect(optionsDuDiagnostic(s.diagnosticOptions, niveau)).toEqual(s.diagnosticOptions);
      }
    }
  });

  it("ce qui est affiché est ce qui est noté : la bonne réponse vaut 1, tout cocher moins", () => {
    for (const { sector, s } of ALL) {
      const vues = optionsDuDiagnostic(s.diagnosticOptions, 1);
      const justes = vues.filter((o) => o.correct).map((o) => o.id);
      expect(evaluateDiagnosis(justes, vues), `${sector}/${s.code}`).toBe(1);
      expect(evaluateDiagnosis(vues.map((o) => o.id), vues), `${sector}/${s.code}`).toBeLessThan(1);
      // Une cause juste qu'on n'a pas proposée ne compte pour rien, ni en bien ni en mal.
      const cachees = s.diagnosticOptions.filter((o) => o.correct && !vues.some((v) => v.id === o.id));
      expect(evaluateDiagnosis([...justes, ...cachees.map((o) => o.id)], vues), `${sector}/${s.code}`).toBe(1);
    }
  });
});

describe("le choix du modèle", () => {
  it("Découverte : trois modèles, chacun avec sa phrase d'objectif ; l'optimal est là", () => {
    for (const { sector, s } of ALL) {
      const q = modelQuestionFor(s, 1, 4242);
      expect(q.options, `${sector}/${s.code}`).toHaveLength(3);
      expect(s.modelRelevance[q.correctOptionId], `${sector}/${s.code}`).toBe("optimal");
      for (const o of q.options) {
        expect(o.aide, `${sector}/${s.code}/${o.id} : phrase d'objectif manquante`).toBeTruthy();
      }
    }
  });

  it("Découverte : le piège plausible n'est proposé que s'il n'y a pas d'autre choix", () => {
    for (const { sector, s } of ALL) {
      const q = modelQuestionFor(s, 1, 7);
      const autres = Object.entries(s.modelRelevance).filter(([, r]) => r === "irrelevant" || r === "acceptable").length;
      if (autres >= 2) {
        expect(
          q.options.some((o) => s.modelRelevance[o.id] === "misleading"),
          `${sector}/${s.code} : un piège pour un débutant alors que des choix plus simples existent`,
        ).toBe(false);
      }
    }
  });

  it("Standard : quatre modèles, sans phrase d'aide", () => {
    for (const { sector, s } of ALL) {
      for (const niveau of [3, 4, 5, 6]) {
        const q = modelQuestionFor(s, niveau, 99);
        expect(q.options.length, `${sector}/${s.code}/n${niveau}`).toBeGreaterThanOrEqual(3);
        expect(q.options.length).toBeLessThanOrEqual(4);
        expect(q.options.some((o) => o.aide), `${sector}/${s.code}/n${niveau}`).toBe(false);
      }
    }
  });
});
