import { describe, expect, it } from "vitest";
import { botDecisions, neutralDecisions } from "../../src/engine/bots";
import type { BotProfile } from "../../src/engine/bots";
import { novaScenario, novaCompany } from "../../src/config/scenarios/nova";
import type { BotContext, RoundDecisions } from "../../src/engine/types";

/**
 * Tests unitaires des bots : vérifient le déterminisme (même input + même seed
 * = même décision) et les comportements distinctifs par profil sur NOVA.
 */

const ALL_PROFILES: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

function ctx(profile: BotProfile, round = 1, lastSoldUnits?: number): BotContext {
  const state = novaCompany("bot", "Bot", "bot", profile);
  return { scenario: novaScenario, state, roundIndex: round, lastSoldUnits };
}

describe("déterminisme des bots", () => {
  for (const profile of ALL_PROFILES) {
    it(`${profile} : même context → même décision`, () => {
      const a = botDecisions(profile, ctx(profile));
      const b = botDecisions(profile, ctx(profile));
      expect(a).toEqual(b);
    });
  }

  it("neutralDecisions ≡ balanced", () => {
    const c = ctx("balanced");
    expect(neutralDecisions(c)).toEqual(botDecisions("balanced", c));
  });
});

describe("comportements distinctifs par profil", () => {
  const refPrice = 59; // NOVA main segment refPrice

  it("price_aggressive : prix < référence", () => {
    const d = botDecisions("price_aggressive", ctx("price_aggressive"));
    expect(d.price).toBeLessThan(refPrice);
    expect(d.price).toBeCloseTo(refPrice * 0.88, 0);
  });

  it("premium : prix > référence et qualité significative", () => {
    const d = botDecisions("premium", ctx("premium"));
    expect(d.price).toBeGreaterThan(refPrice);
    expect(d.price).toBeCloseTo(refPrice * 1.3, 0);
    expect(d.qualityBudget).toBeGreaterThan(0);
  });

  it("passive : marketing et qualité à zéro", () => {
    const d = botDecisions("passive", ctx("passive"));
    expect(d.price).toBe(refPrice);
    expect(d.marketingBudget).toBe(0);
    expect(d.qualityBudget).toBe(0);
  });

  it("balanced : prix = référence, budgets modérés", () => {
    const d = botDecisions("balanced", ctx("balanced"));
    expect(d.price).toBe(refPrice);
    expect(d.marketingBudget).toBeGreaterThan(0);
    expect(d.qualityBudget).toBeGreaterThan(0);
  });

  it("growth : prix légèrement sous la référence, marketing élevé", () => {
    const d = botDecisions("growth", ctx("growth"));
    expect(d.price).toBeLessThan(refPrice);
    expect(d.price).toBeCloseTo(refPrice * 0.95, 0);
    expect(d.marketingBudget).toBeGreaterThan(
      botDecisions("balanced", ctx("balanced")).marketingBudget,
    );
  });
});

describe("plan de production adaptatif", () => {
  it("tour 1 sans historique → production basée sur capacité", () => {
    for (const profile of ALL_PROFILES) {
      const d = botDecisions(profile, ctx(profile));
      expect(d.productionPlan).toBeGreaterThan(0);
      expect(d.productionPlan).toBeLessThanOrEqual(7000); // machineCapacity
    }
  });

  it("avec historique de ventes → adapte la production", () => {
    const d1 = botDecisions("balanced", ctx("balanced", 2, 3000));
    const d2 = botDecisions("balanced", ctx("balanced", 2, 6000));
    expect(d2.productionPlan).toBeGreaterThan(d1.productionPlan);
  });
});

describe("décisions enrichies (enrichedBots)", () => {
  it("sans enrichedBots : pas de HR, assurance, fournisseur", () => {
    const d = botDecisions("premium", ctx("premium"));
    expect(d.hr).toBeUndefined();
    expect(d.insurance).toBeUndefined();
    expect(d.supplierChoice).toBeUndefined();
  });

  it("avec enrichedBots : décisions RH, assurance, fournisseur présentes", () => {
    const enrichedScenario = { ...novaScenario, enrichedBots: true };
    const state = novaCompany("bot", "Bot", "bot", "premium");
    const d = botDecisions("premium", {
      scenario: enrichedScenario,
      state,
      roundIndex: 1,
    });
    expect(d.hr).toBeDefined();
    expect(d.insurance).toBeDefined();
    expect(d.supplierChoice).toBeDefined();
  });
});

describe("chaque profil produit des décisions valides", () => {
  for (const profile of ALL_PROFILES) {
    it(`${profile} : champs obligatoires présents et positifs`, () => {
      const d = botDecisions(profile, ctx(profile));
      expect(d.price).toBeGreaterThan(0);
      expect(d.productionPlan).toBeGreaterThanOrEqual(0);
      expect(d.marketingBudget).toBeGreaterThanOrEqual(0);
      expect(d.qualityBudget).toBeGreaterThanOrEqual(0);
      expect(d.maintenanceBudget).toBeGreaterThanOrEqual(0);
    });
  }
});
