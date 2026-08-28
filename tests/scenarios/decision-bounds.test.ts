import { describe, expect, it } from "vitest";
import { roundDecisionsSchema } from "@/services/decision-schema";
import { SCENARIOS } from "@/config/scenarios/registry";

/**
 * Les garde-fous techniques ne doivent bloquer aucun secteur.
 *
 * Écart réel : le plafond de prix valait 500 €, écrit quand NOVA était le seul
 * scénario. ATLAS CONSEIL facture la journée 780 € au tarif de référence, et
 * jusqu'à 900 € au seuil psychologique haut. Toute décision au prix juste était
 * refusée, sans qu'aucun test ne le voie : les bornes vivaient dans un module
 * que rien ne confrontait au registre des scénarios.
 *
 * Ce test fait cette confrontation. Ajouter un secteur plus cher que le
 * plafond le fera tomber, en nommant le secteur.
 */

const decision = (over: Record<string, unknown>) =>
  roundDecisionsSchema.safeParse({
    price: 59,
    productionPlan: 100,
    marketingBudget: 0,
    qualityBudget: 0,
    maintenanceBudget: 0,
    ...over,
  });

describe("les bornes techniques laissent jouer tous les secteurs", () => {
  it("le prix de référence de chaque secteur passe la validation", () => {
    for (const d of SCENARIOS) {
      for (const segment of d.scenario.market.segments) {
        expect(
          decision({ price: segment.refPrice }).success,
          `${d.code}/${segment.code} : tarif de référence ${segment.refPrice} € refusé`,
        ).toBe(true);
      }
    }
  });

  it("les seuils psychologiques hauts passent aussi", () => {
    // Un seuil psychologique est une borne que l'élève DOIT pouvoir franchir
    // pour en éprouver l'effet : la refuser lui cache la règle du secteur.
    for (const d of SCENARIOS) {
      for (const segment of d.scenario.market.segments) {
        for (const seuil of segment.psychThresholds ?? []) {
          expect(
            decision({ price: seuil.threshold }).success,
            `${d.code}/${segment.code} : seuil psychologique ${seuil.threshold} € refusé`,
          ).toBe(true);
        }
      }
    }
  });

  it("le garde-fou arrête quand même l'absurde", () => {
    // Il reste un garde-fou : c'est une frontière, pas une passoire.
    expect(decision({ price: 0 }).success).toBe(false);
    expect(decision({ price: 1_000_000 }).success).toBe(false);
    expect(decision({ price: "abc" }).success).toBe(false);
  });
});
