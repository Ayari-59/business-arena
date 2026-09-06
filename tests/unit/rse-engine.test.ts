import { describe, expect, it } from "vitest";
import {
  DEFAULT_RSE_CONFIG,
  rseEffort,
  updateRseCapital,
  imageAttractionFactor,
  cleanDefectReduction,
  financingTrustBonus,
  socialAttritionRelief,
  evaluateRseCards,
  RSE_CARD_CODES,
} from "@/engine/rse";

/**
 * Le module RSE moteur (Lot 2) est PUR : ses briques se testent isolément, sans
 * moteur ni scénario. L'intégration (charge décaissée, demande différée, rebuts)
 * est vérifiée à part dans tests/engine/rse.test.ts.
 */

describe("rseEffort", () => {
  it("une dépense nulle ou une échelle nulle ne produit aucun effort", () => {
    expect(rseEffort(0, 10000)).toBe(0);
    expect(rseEffort(-500, 10000)).toBe(0);
    expect(rseEffort(5000, 0)).toBe(0);
  });
  it("l'effort croît avec la dépense, à rendements décroissants (comme le marketing)", () => {
    const e1 = rseEffort(10000, 10000); // budget = échelle
    const e2 = rseEffort(20000, 10000); // double budget
    expect(e1).toBeCloseTo(Math.log(2), 6);
    expect(e2).toBeGreaterThan(e1);
    // rendements décroissants : doubler la dépense n'a pas doublé l'effort
    expect(e2).toBeLessThan(2 * e1);
  });
});

describe("updateRseCapital", () => {
  it("à effort constant, le capital converge vers cet effort (point fixe)", () => {
    const inertia = 0.6;
    const effort = 1;
    let cap = 0;
    for (let i = 0; i < 50; i += 1) cap = updateRseCapital(cap, effort, inertia);
    expect(cap).toBeCloseTo(effort, 4);
  });
  it("le capital monte lentement : un tour d'effort ne le porte qu'à (1 − inertie)", () => {
    expect(updateRseCapital(0, 1, 0.6)).toBeCloseTo(0.4, 6);
  });
  it("sans effort, le capital retombe par inertie, jamais sous zéro", () => {
    const decayed = updateRseCapital(1, 0, 0.6);
    expect(decayed).toBeCloseTo(0.6, 6);
    expect(updateRseCapital(-5, 0, 0.6)).toBe(0);
  });
});

describe("imageAttractionFactor", () => {
  it("neutre sans capital, > 1 dès qu'un capital existe", () => {
    expect(imageAttractionFactor(0, 0.2)).toBe(1);
    expect(imageAttractionFactor(1, 0.2)).toBeCloseTo(1.2, 6);
  });
  it("une sensibilité nulle annule l'effet même avec du capital", () => {
    expect(imageAttractionFactor(5, 0)).toBe(1);
  });
});

describe("cleanDefectReduction", () => {
  it("nulle sans capital, saturante et bornée par le maximum", () => {
    expect(cleanDefectReduction(0, 0.4)).toBe(0);
    expect(cleanDefectReduction(1, 0.4)).toBeCloseTo(0.2, 6); // 1/(1+1) × 0,4
    expect(cleanDefectReduction(1e9, 0.4)).toBeLessThanOrEqual(0.4);
    expect(cleanDefectReduction(1e9, 0.4)).toBeGreaterThan(0.39);
  });
});

describe("financingTrustBonus (Lot 2B)", () => {
  it("nul sans capital, positif et saturant avec capital", () => {
    expect(financingTrustBonus(0, 0.15)).toBe(0);
    expect(financingTrustBonus(2, 0.15)).toBeCloseTo(0.15 * (2 / 3), 6);
    expect(financingTrustBonus(1e9, 0.15)).toBeLessThanOrEqual(0.15);
  });
});

describe("socialAttritionRelief (Lot 2B)", () => {
  it("nulle sans capital, bornée par le coefficient", () => {
    expect(socialAttritionRelief(0, 0.5)).toBe(0);
    expect(socialAttritionRelief(2, 0.5)).toBeCloseTo(0.5 * (2 / 3), 6);
    expect(socialAttritionRelief(1e9, 0.5)).toBeLessThanOrEqual(0.5);
  });
});

describe("evaluateRseCards (Lot 2C)", () => {
  const cards = DEFAULT_RSE_CONFIG.cards;

  it("rien avant minRound, même avec un capital mûr", () => {
    expect(
      evaluateRseCards({ imageCapital: 1, roundIndex: cards.minRound - 1, config: cards, roll: 0 }),
    ).toEqual([]);
  });

  it("rien à capital nul — la RSE reste facultative (ni label, ni bad buzz)", () => {
    expect(
      evaluateRseCards({ imageCapital: 0, roundIndex: cards.minRound, config: cards, roll: 0 }),
    ).toEqual([]);
  });

  it("un capital mûr décroche le label (bonus de demande durable)", () => {
    const drawn = evaluateRseCards({
      imageCapital: cards.labelImageThreshold,
      roundIndex: cards.minRound,
      config: cards,
      roll: 0.99,
    });
    expect(drawn).toHaveLength(1);
    expect(drawn[0]!.code).toBe(RSE_CARD_CODES.label);
    expect(drawn[0]!.demandFactor).toBeGreaterThan(1);
    expect(drawn[0]!.duration).toBe(cards.labelDuration);
  });

  it("un engagement tiède risque le bad buzz — mais seulement au tirage défavorable", () => {
    const tiede = cards.badBuzzImageCeiling / 2;
    const declenche = evaluateRseCards({
      imageCapital: tiede,
      roundIndex: cards.minRound,
      config: cards,
      roll: cards.badBuzzProbability - 0.01,
    });
    expect(declenche).toHaveLength(1);
    expect(declenche[0]!.code).toBe(RSE_CARD_CODES.badBuzz);
    expect(declenche[0]!.demandFactor).toBeLessThan(1);
    // Tirage favorable : rien.
    expect(
      evaluateRseCards({
        imageCapital: tiede,
        roundIndex: cards.minRound,
        config: cards,
        roll: cards.badBuzzProbability + 0.01,
      }),
    ).toEqual([]);
  });
});

describe("DEFAULT_RSE_CONFIG", () => {
  it("porte des grandeurs plausibles (bornées, inerties dans [0,1])", () => {
    expect(DEFAULT_RSE_CONFIG.imageDemandSensitivity).toBeGreaterThan(0);
    expect(DEFAULT_RSE_CONFIG.imageInertia).toBeGreaterThan(0);
    expect(DEFAULT_RSE_CONFIG.imageInertia).toBeLessThan(1);
    expect(DEFAULT_RSE_CONFIG.cleanInertia).toBeGreaterThan(0);
    expect(DEFAULT_RSE_CONFIG.cleanInertia).toBeLessThan(1);
    expect(DEFAULT_RSE_CONFIG.cleanDefectReductionMax).toBeGreaterThan(0);
    expect(DEFAULT_RSE_CONFIG.cleanDefectReductionMax).toBeLessThanOrEqual(1);
    expect(DEFAULT_RSE_CONFIG.financingTrustBonus).toBeGreaterThan(0);
    expect(DEFAULT_RSE_CONFIG.socialAttritionRelief).toBeGreaterThan(0);
    expect(DEFAULT_RSE_CONFIG.socialAttritionRelief).toBeLessThanOrEqual(1);
    // Cartes (2C) : le plafond bad buzz est SOUS le seuil label (zones
    // disjointes), et il y a un horizon minimal.
    expect(DEFAULT_RSE_CONFIG.cards.badBuzzImageCeiling).toBeLessThan(
      DEFAULT_RSE_CONFIG.cards.labelImageThreshold,
    );
    expect(DEFAULT_RSE_CONFIG.cards.minRound).toBeGreaterThanOrEqual(1);
  });
});
