import { describe, expect, it } from "vitest";
import { computePotentialDemand } from "../../src/engine/market/demand";
import {
  loyaltyEffect,
  marketingEffect,
  priceEffect,
  qualityEffect,
} from "../../src/engine/market/attraction";
import { allocateShares } from "../../src/engine/market/allocation";
import { createRng } from "../../src/engine/random";
import type { SegmentConfig } from "../../src/engine/types";

const segment = (over: Partial<SegmentConfig> = {}): SegmentConfig => ({
  code: "test",
  name: "Test",
  size: 1000,
  growth: 0.1,
  priceElasticity: -2,
  refPrice: 100,
  minAcceptablePrice: 40,
  psychThresholds: [{ threshold: 100, penalty: 0.9 }],
  marketingSensitivity: 0.2,
  qualitySensitivity: 0.5,
  loyalty: 0.3,
  priceEffectBounds: { min: 0.1, max: 5 },
  paymentDelayDays: 0,
  ...over,
});

describe("random (PRNG seedé)", () => {
  it("est déterministe et borné dans [0,1)", () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const x = a.next();
      expect(x).toBe(b.next());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(createRng(43).next()).not.toBe(createRng(42).next());
  });
});

describe("demande potentielle (doc 02 §3.1)", () => {
  it("base × croissance × saisonnalité, vérifiable à la main", () => {
    const s = segment({ size: 1000, growth: 0.1 });
    // tour 1 : 1000 × 1.1^0 × 0.9 = 900
    expect(computePotentialDemand(s, 1, [0.9, 1.2], 1)).toBeCloseTo(900, 6);
    // tour 2 : 1000 × 1.1 × 1.2 = 1320
    expect(computePotentialDemand(s, 2, [0.9, 1.2], 1)).toBeCloseTo(1320, 6);
    // multiplicateur d'événement
    expect(computePotentialDemand(s, 1, [0.9], 0.5)).toBeCloseTo(450, 6);
  });
});

describe("effet prix et élasticité (doc 02 §3.2, §11)", () => {
  it("suit l'élasticité autour du prix de référence", () => {
    const s = segment({ priceElasticity: -2, psychThresholds: [] });
    expect(priceEffect(100, s)).toBeCloseTo(1, 9); // prix de référence
    expect(priceEffect(50, s)).toBeCloseTo(4, 9); // (0.5)^-2 = 4
    expect(priceEffect(200, s)).toBeCloseTo(0.25, 9); // (2)^-2
  });
  it("un segment peu élastique réagit moins qu'un segment élastique", () => {
    const elastic = segment({ priceElasticity: -2.2, psychThresholds: [] });
    const rigid = segment({ priceElasticity: -0.7, psychThresholds: [] });
    // baisse de prix de 10 % : gain de demande plus fort pour le segment élastique
    expect(priceEffect(90, elastic)).toBeGreaterThan(priceEffect(90, rigid));
  });
  it("prix psychologique : 99,90 ≠ 100,10 (discontinuité au seuil)", () => {
    const s = segment({ psychThresholds: [{ threshold: 100, penalty: 0.9 }] });
    const below = priceEffect(99.9, s);
    const above = priceEffect(100.1, s);
    // la pénalité crée un décrochage bien supérieur à l'effet élasticité seul
    expect(above).toBeLessThan(below * 0.95);
  });
  it("sous le prix plancher, la méfiance réduit l'attraction", () => {
    const s = segment({ minAcceptablePrice: 40, psychThresholds: [], priceEffectBounds: { min: 0, max: 100 } });
    // 20 € : élasticité seule donnerait (0.2)^-2 = 25, la méfiance divise par 2
    expect(priceEffect(20, s)).toBeCloseTo(25 * 0.5, 6);
  });
  it("reste borné par les bornes du scénario", () => {
    const s = segment({ psychThresholds: [] });
    expect(priceEffect(1, s)).toBe(5); // borne max
    expect(priceEffect(10000, s)).toBe(0.1); // borne min
  });
});

describe("effets marketing, qualité, fidélité", () => {
  it("marketing : budget nul ⇒ effet neutre, rendements décroissants", () => {
    const s = segment();
    expect(marketingEffect(0, s, 10000)).toBe(1);
    const first = marketingEffect(10000, s, 10000) - 1;
    const second = marketingEffect(20000, s, 10000) - marketingEffect(10000, s, 10000);
    expect(second).toBeLessThan(first); // rendement décroissant
  });
  it("qualité : référence 1 ⇒ neutre, sensibilité en exposant", () => {
    const s = segment({ qualitySensitivity: 0.5 });
    expect(qualityEffect(1, s)).toBe(1);
    expect(qualityEffect(1.44, s)).toBeCloseTo(1.2, 9);
  });
  it("fidélité : proportionnelle à la part acquise", () => {
    const s = segment({ loyalty: 0.3 });
    expect(loyaltyEffect(0, s)).toBe(1);
    expect(loyaltyEffect(0.5, s)).toBeCloseTo(1.15, 9);
  });
});

describe("allocation concurrentielle (doc 02 §3.3)", () => {
  it("offres identiques ⇒ parts égales", () => {
    const shares = allocateShares([2, 2, 2], 2, 0);
    expect(shares).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });
  it("meilleure attraction ⇒ part supérieure ; γ accentue l'écart", () => {
    const soft = allocateShares([2, 1], 1, 0);
    const hard = allocateShares([2, 1], 3, 0);
    expect(soft[0]!).toBeGreaterThan(soft[1]!);
    expect(hard[0]!).toBeGreaterThan(soft[0]!); // γ élevé : le meilleur rafle plus
  });
  it("le concurrent extérieur absorbe une part du marché", () => {
    const shares = allocateShares([1, 1], 1, 2);
    expect(shares[0]! + shares[1]!).toBeCloseTo(0.5, 9);
  });
  it("somme des parts ≤ 1 et parts ∈ [0,1]", () => {
    const shares = allocateShares([3, 0.5, 1.2], 2, 0.8);
    const sum = shares.reduce((a, b) => a + b, 0);
    expect(sum).toBeLessThanOrEqual(1 + 1e-9);
    for (const s of shares) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });
});
