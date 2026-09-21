import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calculateVariances } from "@/engine/costs/variance";

describe("écarts sur coûts", () => {
  it("le fournisseur choisi se lit en écart sur prix des matières", () => {
    const result = calculateVariances({
      standardMaterialCost: 22,
      standardOtherVariableCost: 16,
      actualMaterialMultiplier: 1.1, // 10% increase
      actualQuantityProduced: 1000,
      defectUnits: 0,
      actualPrice: 60,
      segmentSales: {
        etudiants: {
          potential: 2000,
          attraction: 1.0,
          share: 0.5,
          demandForCompany: 1000,
          sold: 900,
          lost: 100,
          revenue: 54000,
          commission: 0,
        },
      },
    });

    expect(result).not.toBeNull();
    if (result) {
      // Material price variance = (22 * 1.1 - 22) * 1000 = 2.2 * 1000 = 2200
      expect(result.materialPriceVariance).toBeCloseTo(2200, 0);
      // Aucun rebut : pas d'écart sur quantité, ni matière ni autres charges.
      expect(result.materialQuantityVariance).toBeCloseTo(0, 0);
      expect(result.otherVariableQuantityVariance).toBeCloseTo(0, 0);
      // Total = only material price variance
      expect(result.totalCostVariance).toBeCloseTo(2200, 0);
    }
  });

  it("le rebut se lit en écart sur quantité, matières et autres charges", () => {
    const result = calculateVariances({
      standardMaterialCost: 22,
      standardOtherVariableCost: 16,
      actualMaterialMultiplier: 1.0,
      actualQuantityProduced: 1000,
      defectUnits: 50,
      actualPrice: 60,
      segmentSales: {
        etudiants: {
          potential: 2000,
          attraction: 1.0,
          share: 0.5,
          demandForCompany: 1000,
          sold: 900,
          lost: 100,
          revenue: 54000,
          commission: 0,
        },
      },
    });

    expect(result).not.toBeNull();
    if (result) {
      // Material efficiency variance = 50 * 22 = 1100
      expect(result.materialQuantityVariance).toBeCloseTo(1100, 0);
      // Labor efficiency variance = 50 * 16 = 800
      expect(result.otherVariableQuantityVariance).toBeCloseTo(800, 0);
      // Total cost variance = 1100 + 800 = 1900
      expect(result.totalCostVariance).toBeCloseTo(1900, 0);
    }
  });

  it("returns null when cost variances are negligible", () => {
    const result = calculateVariances({
      standardMaterialCost: 22,
      standardOtherVariableCost: 16,
      actualMaterialMultiplier: 1.0,
      actualQuantityProduced: 1000,
      defectUnits: 0,
      actualPrice: 60,
      segmentSales: {
        etudiants: {
          potential: 2000,
          attraction: 1.0,
          share: 0.5,
          demandForCompany: 1000,
          sold: 900,
          lost: 100,
          revenue: 54000,
          commission: 0,
        },
      },
    });

    // With no multiplier change and no defects, cost variances should be negligible
    // (revenue context is still calculated but not required for output)
    expect(result).toBeNull();
  });

  it("calculates revenue variances by segment with cost driver", () => {
    const result = calculateVariances({
      standardMaterialCost: 22,
      standardOtherVariableCost: 16,
      actualMaterialMultiplier: 1.02, // Small cost increase to trigger calculation
      actualQuantityProduced: 1000,
      defectUnits: 0,
      actualPrice: 60,
      segmentSales: {
        etudiants: {
          potential: 1000,
          attraction: 1.0,
          share: 0.5,
          demandForCompany: 1000,
          sold: 900,
          lost: 100,
          revenue: 54000,
          commission: 0,
        },
        passionnes: {
          potential: 600,
          attraction: 1.0,
          share: 0.6,
          demandForCompany: 600,
          sold: 500,
          lost: 100,
          revenue: 30000,
          commission: 0,
        },
      },
    });

    expect(result).not.toBeNull();
    if (result && result.revenueVarianceBySegment) {
      expect(result.revenueVarianceBySegment.etudiants).toBeDefined();
      expect(result.revenueVarianceBySegment.passionnes).toBeDefined();
      // Revenue context structure should have priceVariance, volumeVariance, totalVariance
      expect(result.revenueVarianceBySegment.etudiants?.priceVariance).toBeDefined();
      expect(result.revenueVarianceBySegment.etudiants?.volumeVariance).toBeDefined();
    }
  });

  it("combines cost and revenue variances into contribution margin variance", () => {
    const result = calculateVariances({
      standardMaterialCost: 22,
      standardOtherVariableCost: 16,
      actualMaterialMultiplier: 1.05, // 5% increase
      actualQuantityProduced: 1000,
      defectUnits: 20,
      actualPrice: 60,
      segmentSales: {
        etudiants: {
          potential: 2000,
          attraction: 1.0,
          share: 0.5,
          demandForCompany: 1000,
          sold: 900,
          lost: 100,
          revenue: 54000,
          commission: 0,
        },
      },
    });

    expect(result).not.toBeNull();
    if (result) {
      // Should have all variance components
      expect(result.totalCostVariance).toBeDefined();
      expect(result.contributionMarginVariance).toBeDefined();
      // Contribution margin variance = revenue variance - cost variance
      // Cost variance = (22*1.05 - 22)*1000 + 20*22 + (16*1.05 - 16)*1000 + 20*16
      // = 1.1*1000 + 440 + 0.8*1000 + 320 = 2660
      expect(result.totalCostVariance).toBeGreaterThan(0);
    }
  });
});

/**
 * LE VOCABULAIRE, VERROUILLÉ.
 *
 * Les écarts portaient deux noms faux. « Efficiency » pour les matières :
 * en coûts standard, l'écart de rendement se dit de la main-d'œuvre et de ses
 * heures ; pour une matière, c'est un écart sur QUANTITÉ. Et « labor » pour
 * un calcul qui porte sur `otherVariableCostPerUnit`, c'est-à-dire les autres
 * charges variables, main-d'œuvre directe ET énergie confondues : le nommer
 * main-d'œuvre laissait croire à un écart de masse salariale, qui n'existe
 * pas ici. Ces gardes empêchent les deux de revenir.
 */
describe("le vocabulaire des écarts", () => {
  const source = readFileSync(join(process.cwd(), "src/engine/costs/variance.ts"), "utf8");
  const types = readFileSync(join(process.cwd(), "src/engine/types.ts"), "utf8");

  it("aucun écart ne s'appelle « efficiency » ni « labor »", () => {
    for (const fautif of [
      "materialEfficiencyVariance",
      "laborEfficiencyVariance",
      "laborRateVariance",
    ]) {
      // Le commentaire du module explique la correction : on ne cherche que
      // les emplois réels, hors prose.
      const emplois = source
        .split("\n")
        .filter((l) => l.includes(fautif) && !l.trimStart().startsWith("*"));
      expect(emplois, `${fautif} : ${emplois.join(" | ")}`).toEqual([]);
      expect(types).not.toContain(fautif);
    }
  });

  it("les noms retenus sont ceux du contrôle de gestion", () => {
    for (const juste of [
      "materialPriceVariance",
      "materialQuantityVariance",
      "otherVariableQuantityVariance",
    ]) {
      expect(source).toContain(juste);
      expect(types).toContain(juste);
    }
  });

  it("le second poste est nommé pour ce qu'il est : les autres charges variables", () => {
    // La fiche notion de l'élève dit « écart sur prix » et « écart sur
    // volume » ; le moteur doit parler la même langue qu'elle.
    expect(types).toContain("AUTRES CHARGES VARIABLES");
    expect(types).toMatch(/salaires sont une charge de structure/);
  });

  it("le bloc « revenus » reste signalé pour ce qu'il n'est pas", () => {
    expect(source).toContain("N'EST PAS UN ÉCART");
    expect(types).toContain("N'EST PAS UN ÉCART");
  });
});
