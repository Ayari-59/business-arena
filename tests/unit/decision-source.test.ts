import { describe, expect, it } from "vitest";
import {
  SOURCE_RECONDUITE,
  decisionSourceOf,
  decrireSource,
  estParDefaut,
  estReconduite,
  lireSource,
  pivotFieldsFor,
  pivotsNonTouches,
} from "@/config/decision-source";
import { SCENARIOS } from "@/config/scenarios/registry";

/**
 * LA SOURCE DES VALEURS D'UNE DÉCISION.
 *
 * Constaté en production : une équipe validait prix et production sans y
 * toucher, et rien ne la distinguait d'une équipe qui avait décidé. Ici, la
 * règle qui fait la différence : valeur proposée gardée = « default », valeur
 * changée = « edited », rien validé = « carried ».
 */

const PROPOSEES = { price: 79, productionPlan: 1000 };

describe("decisionSourceOf", () => {
  it("valeurs proposées gardées telles quelles : les deux pivots sont « default »", () => {
    expect(decisionSourceOf({ price: 79, productionPlan: 1000 }, PROPOSEES)).toEqual({
      price: "default",
      productionPlan: "default",
    });
  });

  it("un pivot changé : « edited » pour lui seul", () => {
    expect(decisionSourceOf({ price: 84.5, productionPlan: 1000 }, PROPOSEES)).toEqual({
      price: "edited",
      productionPlan: "default",
    });
    expect(decisionSourceOf({ price: 79, productionPlan: 1200 }, PROPOSEES)).toEqual({
      price: "default",
      productionPlan: "edited",
    });
  });

  it("les deux changés : « edited » partout ; la reconduction : « carried » partout", () => {
    expect(decisionSourceOf({ price: 74.9, productionPlan: 900 }, PROPOSEES)).toEqual({
      price: "edited",
      productionPlan: "edited",
    });
    expect(estReconduite(SOURCE_RECONDUITE)).toBe(true);
    expect(estParDefaut(SOURCE_RECONDUITE)).toBe(false);
  });

  it("compare au pas du formulaire : 79,04 vaut 79, 79,2 non ; 1000,4 vaut 1000", () => {
    expect(pivotsNonTouches({ price: 79.04, productionPlan: 1000.4 }, PROPOSEES)).toEqual([
      "price",
      "productionPlan",
    ]);
    expect(pivotsNonTouches({ price: 79.2, productionPlan: 1000 }, PROPOSEES)).toEqual([
      "productionPlan",
    ]);
  });
});

describe("lecture et affichage", () => {
  it("estParDefaut ne vaut que si les deux pivots sont « default »", () => {
    expect(estParDefaut({ price: "default", productionPlan: "default" })).toBe(true);
    expect(estParDefaut({ price: "default", productionPlan: "edited" })).toBe(false);
    expect(estParDefaut(null)).toBe(false);
  });

  it("décrit la source en français, et rien pour un tour antérieur (null)", () => {
    expect(decrireSource({ price: "edited", productionPlan: "default" })).toBe(
      "prix : modifié · volume : par défaut",
    );
    expect(decrireSource(SOURCE_RECONDUITE)).toBe("prix : reconduit · volume : reconduit");
    expect(decrireSource(null)).toBe("");
  });

  it("lireSource refuse ce qui n'est pas une source", () => {
    expect(lireSource(null)).toBeNull();
    expect(lireSource({ price: "edited" })).toBeNull();
    expect(lireSource({ price: "edited", productionPlan: "carried" })).toEqual({
      price: "edited",
      productionPlan: "carried",
    });
  });

  it("chaque secteur nomme ses deux pivots dans sa langue", () => {
    for (const s of SCENARIOS) {
      const pivots = pivotFieldsFor(s.vocabulary);
      expect(pivots.map((p) => p.key)).toEqual(["price", "productionPlan"]);
      expect(pivots[0]!.label).toBe(s.vocabulary.priceLabel);
      expect(pivots[1]!.label).toBe(s.vocabulary.productionPlanLabel);
      expect(pivots[1]!.label.length).toBeGreaterThan(3);
    }
  });
});
