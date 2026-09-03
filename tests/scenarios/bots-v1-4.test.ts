import { describe, expect, it } from "vitest";
import {
  BOT_PERSONALITIES,
  botDecisions,
  botPersonalityFromSeed,
  variableCostPerUnit,
  type BotContext,
} from "../../src/engine/bots";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import type { CompanyState } from "../../src/engine/types";

const nova = scenarioByCode("nova");
const novaScenario = nova.scenario;

/**
 * BOTS V1-4 : garde-fou financier, réaction au prix humain, profils.
 *
 * SoundBox finissait à −30 900 € (les humains inactifs à −2 060 €) : plan de
 * production démesuré, aucune réaction aux prix, aucune personnalité. On borne
 * la production et les dépenses, on fait réagir le bot au prix moyen humain, et
 * on tire un profil déterministe de la graine.
 */

const state = nova.company("bot", "SoundBox", "bot") as CompanyState;
const ctx = (over: Partial<BotContext> = {}): BotContext => ({
  scenario: novaScenario,
  state,
  roundIndex: 2,
  lastSoldUnits: 3000,
  ...over,
});

describe("profil tiré de la graine (déterministe)", () => {
  it("toujours l'un des trois profils, stable pour une graine et une stratégie", () => {
    for (const seed of [1, 42, 1000, 2 ** 30]) {
      const p = botPersonalityFromSeed(seed, "price_aggressive");
      expect(BOT_PERSONALITIES).toContain(p);
      expect(botPersonalityFromSeed(seed, "price_aggressive")).toBe(p); // reproductible
    }
  });
  it("des graines différentes donnent des profils différents (couvre les trois)", () => {
    const vus = new Set(
      Array.from({ length: 60 }, (_, i) => botPersonalityFromSeed(i * 2654435761, "balanced")),
    );
    expect(vus.size).toBe(3);
  });
});

describe("garde-fou financier", () => {
  it("borne la production à la demande prévue × 1,2 (et à la capacité)", () => {
    const d = botDecisions("growth", ctx({ lastSoldUnits: 3000 }));
    expect(d.productionPlan).toBeLessThanOrEqual(3000 * 1.2 + 1e-6);
  });
  it("les dépenses discrétionnaires ne dépassent pas trésorerie + découvert", () => {
    // Trésorerie d'ouverture nulle : les budgets sont ramenés dans l'enveloppe.
    const pauvre = { ...state, finance: { ...state.finance, cash: 0 } } as CompanyState;
    const d = botDecisions("growth", ctx({ state: pauvre }));
    const depenses = (d.marketingBudget ?? 0) + (d.qualityBudget ?? 0) + (d.maintenanceBudget ?? 0);
    expect(depenses).toBeLessThanOrEqual(novaScenario.finance.overdraftLimit + 1e-6);
  });
});

describe("réaction au prix moyen humain", () => {
  const cv = variableCostPerUnit(novaScenario);
  it("l'humain casse les prix (>5 % sous le bot) → le bot baisse, jamais sous son coût variable planchonné", () => {
    const base = botDecisions("balanced", ctx({ humanAvgPrice: undefined })).price;
    const humainBas = base * 0.7;
    const reagi = botDecisions("balanced", ctx({ humanAvgPrice: humainBas, personality: "suiveur" })).price;
    expect(reagi).toBeLessThan(base); // il a baissé
    expect(reagi).toBeGreaterThanOrEqual(cv * 1.15 - 1e-6); // plancher « suiveur »
  });
  it("l'humain vend plus cher (>5 % au-dessus) → le bot monte", () => {
    const base = botDecisions("balanced", ctx({ humanAvgPrice: undefined })).price;
    const reagi = botDecisions("balanced", ctx({ humanAvgPrice: base * 1.4, personality: "suiveur" })).price;
    expect(reagi).toBeGreaterThan(base);
  });
  it("écart inférieur à 5 % → aucun mouvement", () => {
    const base = botDecisions("balanced", ctx({ humanAvgPrice: undefined })).price;
    const reagi = botDecisions("balanced", ctx({ humanAvgPrice: base * 1.02 })).price;
    expect(reagi).toBeCloseTo(base, 6);
  });
  it("un profil agressif baisse plus fort qu'un prudent face au même prix cassé", () => {
    const base = botDecisions("balanced", ctx({ humanAvgPrice: undefined })).price;
    const humainBas = base * 0.75;
    const prudent = botDecisions("balanced", ctx({ humanAvgPrice: humainBas, personality: "prudent" })).price;
    const agressif = botDecisions("balanced", ctx({ humanAvgPrice: humainBas, personality: "agressif" })).price;
    expect(agressif).toBeLessThan(prudent);
  });
  it("déterministe : mêmes entrées, même prix", () => {
    const a = botDecisions("balanced", ctx({ humanAvgPrice: 40, personality: "suiveur" })).price;
    const b = botDecisions("balanced", ctx({ humanAvgPrice: 40, personality: "suiveur" })).price;
    expect(a).toBe(b);
  });
});
