import { describe, expect, it } from "vitest";
import { applyScenarioVariability } from "../src/config/scenarios/variability";
import { parseScenarioConfig } from "../src/config/scenarios/schema";
import { novaScenario } from "../src/config/scenarios/nova";

/**
 * Monde variable (doc 02 §9bis) : une variante du scénario dérivée de la
 * graine de la partie. La texture économique bouge dans des bornes calibrées,
 * la dramaturgie et les chiffres cités par les textes pédagogiques restent
 * intangibles.
 */

describe("monde variable", () => {
  const varied = applyScenarioVariability(novaScenario, 987654321);

  it("déterministe : même graine, même monde ; graines différentes, mondes différents", () => {
    const again = applyScenarioVariability(novaScenario, 987654321);
    expect(again).toEqual(varied);
    const other = applyScenarioVariability(novaScenario, 111);
    expect(other.market.segments[0]!.size).not.toBe(varied.market.segments[0]!.size);
  });

  it("le scénario de base n'est jamais muté", () => {
    expect(novaScenario.market.segments[0]!.size).toBe(14000);
    expect(novaScenario.fixedCostsPerRound).toBe(91000);
    expect(novaScenario.events.find((e) => e.code === "machine_breakdown")!.probability).toBe(
      0.05,
    );
  });

  it("les perturbations restent dans leurs bornes", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const v = applyScenarioVariability(novaScenario, seed * 7919);
      v.market.segments.forEach((s, i) => {
        const base = novaScenario.market.segments[i]!;
        expect(s.size).toBeGreaterThanOrEqual(base.size * 0.95 - 1e-9);
        expect(s.size).toBeLessThanOrEqual(base.size * 1.05 + 1e-9);
        expect(Math.abs(s.growth)).toBeLessThanOrEqual(Math.abs(base.growth) * 1.2 + 1e-9);
      });
      expect(v.fixedCostsPerRound).toBeGreaterThanOrEqual(91000 * 0.98 - 1e-6);
      expect(v.fixedCostsPerRound).toBeLessThanOrEqual(91000 * 1.02 + 1e-6);
      // le pic T4 reste un pic, la basse saison reste basse
      expect(v.market.seasonality[3]).toBeGreaterThan(1.25);
      expect(v.market.seasonality[0]).toBeLessThan(1);
      // et la variante reste un scénario valide au sens du schéma
      expect(() => parseScenarioConfig(v)).not.toThrow();
    }
  });

  it("les intangibles pédagogiques ne bougent pas", () => {
    // chiffres cités dans les situations, indices et formulaires
    expect(varied.product.materialCostPerUnit).toBe(22);
    expect(varied.product.otherVariableCostPerUnit).toBe(16);
    expect(varied.market.segments[0]!.refPrice).toBe(59);
    expect(varied.market.segments[0]!.psychThresholds).toEqual(
      novaScenario.market.segments[0]!.psychThresholds,
    );
    expect(varied.finance.loanAnnualRate).toBe(0.05);
    expect(varied.finance.overdraftLimit).toBe(30000);
    expect(varied.finance.maxCapitalIncreaseTotal).toBe(100000);
    expect(varied.investment).toEqual(novaScenario.investment);
    expect(varied.subcontracting).toEqual(novaScenario.subcontracting);
    // la saisonnalité PAR SEGMENT (arrivée de CampusTech) est intouchable
    expect(varied.market.segments[2]!.seasonality).toEqual(
      novaScenario.market.segments[2]!.seasonality,
    );
    // le pool de commandes est porté tel quel (le tirage se fait au tour)
    expect(varied.orderOffers).toEqual(novaScenario.orderOffers);
  });

  it("une probabilité 0 reste 0 : cartes enseignant et tirages seedés intacts", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const v = applyScenarioVariability(novaScenario, seed * 104729);
      novaScenario.events.forEach((base, i) => {
        const event = v.events[i]!;
        expect(event.code).toBe(base.code);
        if (base.probability === 0) expect(event.probability).toBe(0);
        else {
          expect(event.probability).toBeGreaterThanOrEqual(base.probability * 0.8 - 1e-12);
          expect(event.probability).toBeLessThanOrEqual(
            Math.min(0.25, base.probability * 1.3) + 1e-12,
          );
        }
      });
    }
  });
});
