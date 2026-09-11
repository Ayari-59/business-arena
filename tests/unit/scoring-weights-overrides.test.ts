import { describe, expect, it } from "vitest";
import {
  applyScoringWeightOverrides,
  sanitizeScoringWeightOverrides,
} from "@/config/difficulty";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { scoringWeightsV2 } from "@/scoring/bpi";
import { scenarioByCode } from "@/config/scenarios/registry";

/**
 * BPI paramétrable par l'enseignant (V2 couche 2, #3).
 *
 * Le réglage vit HORS moteur : il ne fait que réécrire `scoring.weights` du
 * scénario. Ce qui doit tenir : le résultat reste un scénario valide (poids
 * sommant à 1), les réglages sont RELATIFS (renormalisés), et « pilotage » —
 * qui n'existe qu'en interne comme somme stratégie + opérationnel — se retrouve
 * bien à la valeur demandée après recomposition v2.
 */

const base = scenarioByCode("nova").scenario;
const somme = (w: Record<string, number>) => Object.values(w).reduce((a, b) => a + b, 0);

describe("applyScoringWeightOverrides", () => {
  it("laisse le scénario intact sans réglage", () => {
    expect(applyScoringWeightOverrides(base, undefined)).toBe(base);
    expect(applyScoringWeightOverrides(base, {})).toBe(base);
  });

  it("produit toujours des poids valides (somme = 1) que le schéma accepte", () => {
    const out = applyScoringWeightOverrides(base, { decisionMastery: 0.4, financial: 0.4 });
    expect(somme(out.scoring.weights)).toBeCloseTo(1, 6);
    // Le snapshot repasse par le schéma de scénario au chargement : il doit valider.
    expect(() => parseScenarioConfig(out)).not.toThrow();
  });

  it("traite les réglages comme des poids relatifs (renormalisation)", () => {
    // On ne fournit que decisionMastery, à une valeur énorme : sa part effective
    // doit dominer, sans qu'aucune autre dimension ne parte à zéro.
    const out = applyScoringWeightOverrides(base, { decisionMastery: 10 });
    const v2 = scoringWeightsV2(out.scoring);
    expect(v2.decision_mastery).toBeGreaterThan(0.9);
    expect(v2.economic).toBeGreaterThan(0);
    expect(somme(v2)).toBeCloseTo(1, 6);
  });

  it("recompose « pilotage » à la valeur demandée après renormalisation", () => {
    // pilotage = 0.5 sur un total 0.3+0.2+0.5 = 1.0 → part effective 0.5.
    const out = applyScoringWeightOverrides(base, {
      economic: 0.3,
      financial: 0.2,
      commercial: 0,
      profitability: 0,
      pilotage: 0.5,
      decisionMastery: 0,
    });
    const v2 = scoringWeightsV2(out.scoring);
    expect(v2.pilotage).toBeCloseTo(0.5, 6);
    // La somme stratégie + opérationnel du scénario EST le poids de pilotage.
    expect(out.scoring.weights.strategy + out.scoring.weights.operational).toBeCloseTo(0.5, 6);
  });

  it("ignore un réglage entièrement nul (retour au scénario)", () => {
    const out = applyScoringWeightOverrides(base, {
      economic: 0,
      financial: 0,
      commercial: 0,
      profitability: 0,
      pilotage: 0,
      decisionMastery: 0,
    });
    expect(out).toBe(base);
  });

  it("écarte les valeurs hors bornes à la désinfection", () => {
    const clean = sanitizeScoringWeightOverrides({
      financial: 0.5,
      economic: 2, // hors [0,1]
      commercial: -1, // hors [0,1]
    });
    expect(clean).toEqual({ financial: 0.5 });
  });
});
