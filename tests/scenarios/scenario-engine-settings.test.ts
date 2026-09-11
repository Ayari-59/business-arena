import { describe, expect, it } from "vitest";
import { scenarioByCode, type ScenarioDefinition } from "../../src/config/scenarios/registry";
import { applyEconomicOverrides } from "../../src/config/difficulty";
import { applyMarketSettings, readMarketForm } from "../../src/config/scenarios/engine-settings";
import { essaiABlanc } from "../../src/config/scenarios/essai-a-blanc";

/**
 * Réglages moteur de l'éditeur de scénarios (PR 3) : marché et essai à blanc.
 */

describe("réglages de marché", () => {
  it("readMarketForm expose les segments, applyMarketSettings les modifie", () => {
    const base = scenarioByCode("nova").scenario;
    const form = readMarketForm(base);
    expect(form.segments.length).toBe(base.market.segments.length);
    const cible = form.segments[0]!;

    const next = applyMarketSettings(base, {
      competitionIntensity: 3,
      segments: [{ code: cible.code, size: 12345, refPrice: 99 }],
    });
    expect(next.market.competitionIntensity).toBe(3);
    const modifie = next.market.segments.find((s) => s.code === cible.code)!;
    expect(modifie.size).toBe(12345);
    expect(modifie.refPrice).toBe(99);
    // Les autres segments ne bougent pas.
    for (const s of base.market.segments.filter((s) => s.code !== cible.code)) {
      const apres = next.market.segments.find((x) => x.code === s.code)!;
      expect(apres.size).toBe(s.size);
    }
  });

  it("un segment inconnu est ignoré", () => {
    const base = scenarioByCode("nova").scenario;
    const next = applyMarketSettings(base, { segments: [{ code: "inexistant", size: 1 }] });
    expect(next.market.segments).toEqual(base.market.segments);
  });
});

describe("essai à blanc", () => {
  it("un secteur calibré (nova) est jouable et gagnable", () => {
    const v = essaiABlanc(scenarioByCode("nova"));
    expect(v.gagnable).toBe(true);
    expect(v.meilleure.cumul).toBeGreaterThan(0);
    expect(v.verdict).not.toBe("injouable");
    expect(v.detail).toHaveLength(5);
  });

  it("une config ruineuse (charges de structure démesurées) est déclarée injouable", () => {
    const nova = scenarioByCode("nova");
    const casse: ScenarioDefinition = {
      ...nova,
      scenario: applyEconomicOverrides(nova.scenario, { fixedCostsPerRound: 5_000_000 }),
    };
    const v = essaiABlanc(casse);
    expect(v.gagnable).toBe(false);
    expect(v.verdict).toBe("injouable");
    expect(v.remarques.length).toBeGreaterThan(0);
  });

  it("déterministe : deux essais donnent le même verdict", () => {
    const a = essaiABlanc(scenarioByCode("hotel"));
    const b = essaiABlanc(scenarioByCode("hotel"));
    expect(a.meilleure.cumul).toBe(b.meilleure.cumul);
    expect(a.verdict).toBe(b.verdict);
  });
});

describe("réglages de marché d'un scénario à gamme", () => {
  it("le formulaire liste les clientèles de toutes les références", async () => {
    const { boutiqueScenario } = await import("../../src/config/scenarios/boutique");
    const form = readMarketForm(boutiqueScenario);
    expect(form.segments).toHaveLength(11);
    expect(form.segments.map((s) => s.code)).toContain("bonnet_ce");
  });

  it("un segment d'une référence édité l'est dans le marché de cette référence", async () => {
    const { boutiqueScenario } = await import("../../src/config/scenarios/boutique");
    const { parseScenarioConfig } = await import("../../src/config/scenarios/schema");
    const edited = applyMarketSettings(boutiqueScenario, {
      competitionIntensity: 2.2,
      segments: [{ code: "bonnet_ce", size: 2000, refPrice: 27 }],
    });
    const bonnet = edited.products!.find((p) => p.code === "bonnet")!;
    const ce = bonnet.market.segments.find((s) => s.code === "bonnet_ce")!;
    expect(ce.size).toBe(2000);
    expect(ce.refPrice).toBe(27);
    // Le marché du scénario (cœur de gamme) et les autres références sont intacts.
    expect(edited.market.competitionIntensity).toBe(2.2);
    expect(edited.market.segments).toEqual(boutiqueScenario.market.segments);
    expect(edited.products!.find((p) => p.code === "echarpe")).toEqual(
      boutiqueScenario.products!.find((p) => p.code === "echarpe"),
    );
    expect(() => parseScenarioConfig(edited)).not.toThrow();
  });
});
