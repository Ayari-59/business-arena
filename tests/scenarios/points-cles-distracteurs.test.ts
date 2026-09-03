import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import {
  MODEL_QUESTION_ID,
  modelOptionCodes,
  modelQuestionFor,
} from "../../src/config/scenarios/situation-kit";
import { conceptByCode } from "../../src/config/pedagogy/concepts";
import { modelByCode } from "../../src/config/pedagogy/models";

/**
 * DISTRACTEURS PAR NIVEAU ET POINTS CLÉS APRÈS LA RÉPONSE (V1-7, N2/P8).
 *
 * La question du modèle est reconstruite par niveau et par graine : le piège
 * plausible n'apparaît en priorité qu'à partir du niveau 3, l'ordre des options
 * est mélangé par la graine, et chaque modèle candidat porte exactement trois
 * notions à examiner. On le vérifie sur les neuf secteurs.
 */

const ALL = SCENARIOS.flatMap((d) => d.situations.map((s) => ({ sector: d.code, s })));

describe("la question du modèle, sur les neuf secteurs", () => {
  it("l'optimal est toujours présent et reste la bonne réponse, quel que soit le niveau", () => {
    for (const { sector, s } of ALL) {
      const optimal = Object.keys(s.modelRelevance).find((c) => s.modelRelevance[c] === "optimal")!;
      for (const level of [1, 3, 6]) {
        const q = modelQuestionFor(s, level, 12345);
        const ids = q.options.map((o) => o.id);
        expect(ids, `${sector}/${s.code}/n${level}`).toContain(optimal);
        expect(s.modelRelevance[q.correctOptionId], `${sector}/${s.code}`).toBe("optimal");
        expect(q.options.length, `${sector}/${s.code}/n${level}`).toBeGreaterThanOrEqual(3);
        expect(q.options.length).toBeLessThanOrEqual(4);
        // Chaque option porte le crédit de sa pertinence et le nom du modèle.
        for (const o of q.options) {
          expect(modelByCode.get(o.id)?.name, `${sector}/${s.code}/${o.id}`).toBe(o.label);
        }
      }
    }
  });

  it("le piège plausible n'est prioritaire qu'à partir du niveau 3", () => {
    // Une situation qui distingue un « misleading » d'un « acceptable » : au
    // niveau 1 l'acceptable est retenu avant le piège, au niveau 3 l'inverse.
    const distinguantes = ALL.filter(({ s }) => {
      const vals = Object.values(s.modelRelevance);
      return vals.includes("misleading") && vals.includes("acceptable");
    });
    expect(distinguantes.length, "aucune situation ne distingue piège et voisin").toBeGreaterThan(0);
    let observe = false;
    for (const { s } of distinguantes) {
      const facile = new Set(modelOptionCodes(s.modelRelevance, s.distractorPool, 1, 0));
      const dur = new Set(modelOptionCodes(s.modelRelevance, s.distractorPool, 3, 0));
      const misleading = Object.keys(s.modelRelevance).filter((c) => s.modelRelevance[c] === "misleading");
      // S'il y a plus de distracteurs que de places, le niveau change le tri.
      if (misleading.some((m) => dur.has(m) && !facile.has(m))) observe = true;
    }
    expect(observe, "le niveau ne change jamais le choix des distracteurs").toBe(true);
  });

  it("l'ordre des options dépend de la graine", () => {
    // Au moins une situation voit ses options réordonnées selon la graine.
    let reordonne = false;
    for (const { s } of ALL) {
      const a = modelOptionCodes(s.modelRelevance, s.distractorPool, 3, 1).join(",");
      const b = modelOptionCodes(s.modelRelevance, s.distractorPool, 3, 999).join(",");
      if (a !== b) reordonne = true;
    }
    expect(reordonne).toBe(true);
    // Déterminisme : même graine ⇒ même ordre.
    const { s } = ALL[0]!;
    expect(modelOptionCodes(s.modelRelevance, s.distractorPool, 3, 42)).toEqual(
      modelOptionCodes(s.modelRelevance, s.distractorPool, 3, 42),
    );
  });
});

describe("points clés : exactement trois notions par modèle candidat", () => {
  it("chaque modèle optimal/acceptable d'une situation a trois notions nommées", () => {
    for (const { sector, s } of ALL) {
      const candidats = Object.entries(s.modelRelevance)
        .filter(([, r]) => r === "optimal" || r === "acceptable")
        .map(([c]) => c);
      for (const code of candidats) {
        const model = modelByCode.get(code)!;
        const notions: string[] = [];
        const vus = new Set<string>();
        for (const cc of [...model.conceptCodes, ...s.conceptCodes]) {
          const nom = conceptByCode.get(cc)?.name;
          if (nom && !vus.has(nom)) {
            vus.add(nom);
            notions.push(nom);
          }
          if (notions.length === 3) break;
        }
        expect(notions.length, `${sector}/${s.code}/${code}`).toBe(3);
      }
    }
  });
});

describe("la question du modèle reste identifiable", () => {
  it("son identifiant ne change pas", () => {
    for (const { s } of ALL) {
      expect(s.quiz.some((q) => q.id === MODEL_QUESTION_ID), s.code).toBe(true);
    }
  });
});
