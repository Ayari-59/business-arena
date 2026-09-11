import { describe, expect, it } from "vitest";
import { computeDefectRate } from "@/engine/production";

/**
 * Le taux de rebut suit la qualité produite ; la maintenance ne joue que si le
 * scénario l'active (maintenanceDefectSensitivity > 0), de façon NEUTRE au
 * budget de référence — les scénarios qui ne l'activent pas sont inchangés.
 */
describe("computeDefectRate", () => {
  it("sans maintenance : base × (2 − qualité), comportement historique", () => {
    expect(computeDefectRate({ baseDefectRate: 0.05, producedQuality: 1 })).toBeCloseTo(0.05, 6);
    expect(computeDefectRate({ baseDefectRate: 0.05, producedQuality: 0.5 })).toBeCloseTo(0.075, 6);
    // Meilleure qualité → moins de rebuts.
    expect(computeDefectRate({ baseDefectRate: 0.05, producedQuality: 1.5 })).toBeCloseTo(0.025, 6);
  });

  it("la RSE réduit les rebuts", () => {
    expect(
      computeDefectRate({ baseDefectRate: 0.1, producedQuality: 1, rseDefectReduction: 0.2 }),
    ).toBeCloseTo(0.08, 6);
  });

  it("sensibilité maintenance absente ou nulle = facteur neutre", () => {
    const base = { baseDefectRate: 0.05, producedQuality: 1 };
    const withMaint = computeDefectRate({
      ...base,
      maintenanceBudget: 0,
      maintenanceReference: 10000,
      maintenanceDefectSensitivity: 0,
    });
    expect(withMaint).toBeCloseTo(0.05, 6);
  });

  it("au budget de maintenance de référence : facteur neutre (×1)", () => {
    expect(
      computeDefectRate({
        baseDefectRate: 0.05,
        producedQuality: 1,
        maintenanceBudget: 10000,
        maintenanceReference: 10000,
        maintenanceDefectSensitivity: 0.4,
      }),
    ).toBeCloseTo(0.05, 6);
  });

  it("unidirectionnel : sous la référence → plus de rebuts ; au-dessus → aucun effet", () => {
    const common = {
      baseDefectRate: 0.05,
      producedQuality: 1,
      maintenanceReference: 10000,
      maintenanceDefectSensitivity: 0.4,
    };
    // Aucune maintenance : facteur 1 + 0,4 = 1,4 → 0,07.
    expect(computeDefectRate({ ...common, maintenanceBudget: 0 })).toBeCloseTo(0.07, 6);
    // Moitié de la référence : facteur 1 + 0,4 × 0,5 = 1,2 → 0,06.
    expect(computeDefectRate({ ...common, maintenanceBudget: 5000 })).toBeCloseTo(0.06, 6);
    // Double de la référence : aucun bonus, facteur plafonné à 1 → 0,05.
    expect(computeDefectRate({ ...common, maintenanceBudget: 20000 })).toBeCloseTo(0.05, 6);
  });

  it("le facteur maintenance est plafonné à 1 au-dessus de la référence (pas de récompense)", () => {
    const common = {
      baseDefectRate: 0.05,
      producedQuality: 1,
      maintenanceReference: 10000,
      maintenanceDefectSensitivity: 0.4,
    };
    // Sur-maintenance extrême : jamais en dessous du rebut de base.
    expect(computeDefectRate({ ...common, maintenanceBudget: 1_000_000 })).toBeCloseTo(0.05, 6);
  });

  it("garde : référence nulle → facteur neutre (pas de division par zéro)", () => {
    expect(
      computeDefectRate({
        baseDefectRate: 0.05,
        producedQuality: 1,
        maintenanceBudget: 0,
        maintenanceReference: 0,
        maintenanceDefectSensitivity: 0.4,
      }),
    ).toBeCloseTo(0.05, 6);
  });

  it("résultat borné à [0, 0.5]", () => {
    expect(
      computeDefectRate({ baseDefectRate: 0.4, producedQuality: 0.5 }),
    ).toBe(0.5); // 0,4 × 1,5 = 0,6 → plafonné à 0,5
    expect(computeDefectRate({ baseDefectRate: 0.05, producedQuality: 3 })).toBe(0); // 2 − 3 < 0 → plancher 0
  });
});
