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
  it("reste borné par les bornes du scénario, dans la plage où l'on achète encore", () => {
    const s = segment({ psychThresholds: [] });
    expect(priceEffect(1, s)).toBe(5); // borne max
    // Le plancher joue tant que le prix reste dans la plage où l'on achète
    // encore. Il faut un plancher haut pour l'y voir : à 0,1 et une élasticité
    // de −2, il ne mordrait qu'au-delà de trois fois le prix usuel, c'est-à-dire
    // là où plus personne n'achète — c'était exactement le défaut.
    const plancherHaut = segment({ psychThresholds: [], priceEffectBounds: { min: 0.5, max: 5 } });
    expect(priceEffect(180, plancherHaut)).toBeCloseTo(0.5, 9); // 1,8^-2 = 0,309 relevé à 0,5
  });

  /**
   * LE PRIX DE RUPTURE.
   *
   * Deux gardes se retournaient contre le jeu au-dessus d'un certain prix. Le
   * plancher `priceEffectBounds.min` RELÈVE l'attraction au lieu de la laisser
   * tomber : à dix fois le prix usuel, l'effet brut valait 0,006 chez les
   * étudiants de NOVA et le plancher le remontait à 0,15. Et une élasticité
   * faible — les passionnés à −0,7 — laissait de toute façon un cinquième de
   * l'attraction au même prix.
   *
   * Multiplier ses prix par dix vendait donc encore 918 unités et rapportait
   * 296 000 € là où le prix juste en perdait 17 500 : la stratégie la plus
   * rentable du jeu, et elle n'enseignait rien.
   */
  describe("prix de rupture", () => {
    it("au-delà du prix de rupture, la clientèle n'achète plus du tout", () => {
      const s = segment({ psychThresholds: [] });
      expect(priceEffect(300, s)).toBe(0); // 3 × le prix usuel : le défaut
      expect(priceEffect(1000, s)).toBe(0);
      expect(priceEffect(10000, s)).toBe(0);
    });

    it("le décrochage est progressif, pas un mur", () => {
      const s = segment({ psychThresholds: [] });
      // Rien ne bouge jusqu'à deux fois le prix usuel : c'est ce qui rend la
      // règle sans effet sur une partie normale.
      const aDeux = priceEffect(200, s);
      expect(aDeux).toBeGreaterThan(0);
      // Puis l'attraction s'éteint en descendant, sans saut.
      expect(priceEffect(250, s)).toBeLessThan(aDeux);
      expect(priceEffect(250, s)).toBeGreaterThan(priceEffect(280, s));
      expect(priceEffect(280, s)).toBeGreaterThan(0);
    });

    it("une élasticité faible ne protège plus d'un prix absurde", () => {
      // LE CAS QUI FAISAIT LE DÉFAUT : un segment peu sensible au prix gardait
      // son attraction quel que soit le montant demandé.
      const rigide = segment({ priceElasticity: -0.7, psychThresholds: [] });
      expect(priceEffect(1000, rigide)).toBe(0);
    });

    it("un scénario peut resserrer ou écarter la borne", () => {
      // Une clientèle qui décroche vite, et un produit de luxe qui supporte
      // cinq fois son prix usuel avant que personne n'en veuille.
      const fragile = segment({ psychThresholds: [], walkAwayPriceRatio: 1.5 });
      expect(priceEffect(150, fragile)).toBe(0);
      const luxe = segment({ psychThresholds: [], walkAwayPriceRatio: 5 });
      expect(priceEffect(300, luxe)).toBeGreaterThan(0);
      expect(priceEffect(500, luxe)).toBe(0);
    });
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

describe("porte marketing (e-commerce : le trafic s'achète)", () => {
  it("sans porte, l'effet marketing est celui d'origine : neutre à budget nul", () => {
    expect(marketingEffect(0, segment(), 10000)).toBe(1);
    expect(marketingEffect(10000, segment(), 10000)).toBeCloseTo(1 + 0.2 * Math.log(2), 10);
  });

  it("avec une porte, un budget nul ne garde que la part de la porte, et la porte s'ouvre vite avec le budget", () => {
    const s = segment({ marketingGate: 0.3 });
    expect(marketingEffect(0, s, 10000)).toBeCloseTo(0.3, 10);
    // à un sixième de l'échelle, la porte est ouverte aux deux tiers ; au tiers, en grand
    const sixieme = marketingEffect(10000 / 6, s, 10000) / marketingEffect(10000 / 6, segment(), 10000);
    const tiers = marketingEffect(10000 / 3, s, 10000) / marketingEffect(10000 / 3, segment(), 10000);
    expect(sixieme).toBeGreaterThan(0.7);
    expect(sixieme).toBeLessThan(0.8);
    expect(tiers).toBeGreaterThan(0.9);
    // à l'échelle, l'effet est celui d'origine à un pour cent près
    expect(marketingEffect(10000, s, 10000) / marketingEffect(10000, segment(), 10000)).toBeGreaterThan(0.99);
    // la porte ne fait jamais gagner : toujours au plus l'effet d'origine
    for (const b of [0, 500, 3000, 10000, 50000]) {
      expect(marketingEffect(b, s, 10000)).toBeLessThanOrEqual(marketingEffect(b, segment(), 10000));
    }
  });
});
