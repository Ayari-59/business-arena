import { describe, expect, it } from "vitest";
import {
  applyEconomicOverrides,
  applyEventIntensity,
  DIFFICULTY_PRESETS,
  LEGACY_PRESET,
  presetFromProfile,
  sanitizeEconomicOverrides,
} from "../src/config/difficulty";
import { novaScenario } from "../src/config/scenarios/nova";
import { parseScenarioConfig } from "../src/config/scenarios/schema";

/**
 * Niveaux de difficulté et paramètres économiques modulables (doc 08 §2) :
 * des DONNÉES, jamais du codage en dur — presets cohérents, overrides bornés,
 * intensité d'événements qui n'invente pas de tirages (les 0 restent 0).
 */

describe("préréglages de difficulté", () => {
  it("six niveaux, progression monotone du plafond d'indices et de l'intensité", () => {
    expect(DIFFICULTY_PRESETS).toHaveLength(6);
    for (let i = 1; i < DIFFICULTY_PRESETS.length; i++) {
      const prev = DIFFICULTY_PRESETS[i - 1]!;
      const cur = DIFFICULTY_PRESETS[i]!;
      expect(cur.level).toBe(prev.level + 1);
      expect(cur.hintMaxLevel).toBeLessThanOrEqual(prev.hintMaxLevel);
      expect(cur.eventProbabilityMultiplier).toBeGreaterThanOrEqual(
        prev.eventProbabilityMultiplier,
      );
    }
    // Executive : conditions réelles
    expect(DIFFICULTY_PRESETS[5]!.hintMaxLevel).toBe(0);
  });

  it("les parties historiques (sans niveau) gardent leur comportement complet", () => {
    const legacy = presetFromProfile({ level: 1, kind: "class" });
    expect(legacy).toBe(LEGACY_PRESET);
    expect(legacy.hintMaxLevel).toBe(5);
    expect(legacy.decisions.finance).toBe(true);
    const explicit = presetFromProfile({ difficulty: { level: 5 } });
    expect(explicit.name).toBe("Stratégie");
    expect(explicit.hintMaxLevel).toBe(2);
  });
});

describe("paramètres économiques modulables", () => {
  it("chaque champ renseigné remplace la valeur du scénario, les absents la conservent", () => {
    const out = applyEconomicOverrides(novaScenario, {
      taxRate: 0.33,
      vatRate: 0.2,
      fixedCostsPerRound: 80000,
    });
    expect(out.finance.taxRate).toBe(0.33);
    expect(out.finance.vatRate).toBe(0.2);
    expect(out.fixedCostsPerRound).toBe(80000);
    expect(out.finance.loanAnnualRate).toBe(novaScenario.finance.loanAnnualRate);
    expect(out.product.materialCostPerUnit).toBe(novaScenario.product.materialCostPerUnit);
    // le scénario modifié reste un scénario valide (zod)
    expect(() => parseScenarioConfig(out)).not.toThrow();
    // et l'original n'est jamais muté
    expect(novaScenario.finance.taxRate).not.toBe(0.33);
  });

  it("une valeur hors bornes est ignorée champ par champ, pas la création", () => {
    const out = sanitizeEconomicOverrides({
      taxRate: 0.9, // > 60 % → ignoré
      vatRate: 0.2, // valide
      supplierPaymentDelayDays: -5, // négatif → ignoré
    });
    expect(out).toEqual({ vatRate: 0.2 });
  });
});

describe("intensité d'événements par niveau", () => {
  it("multiplie les probabilités, plafonne à 0,9, et n'invente jamais de tirage", () => {
    const doubled = applyEventIntensity(novaScenario, 2);
    for (const [i, event] of doubled.events.entries()) {
      const base = novaScenario.events[i]!;
      if (base.probability === 0) expect(event.probability).toBe(0);
      else expect(event.probability).toBeCloseTo(Math.min(0.9, base.probability * 2), 12);
    }
    // multiplicateur 1 : objet inchangé (aucune copie inutile)
    expect(applyEventIntensity(novaScenario, 1)).toBe(novaScenario);
  });
});
