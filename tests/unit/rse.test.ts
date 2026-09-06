import { describe, expect, it } from "vitest";
import type { CompanyRoundResult } from "@/engine/types";
import { computeRseIndex } from "@/scoring/rse";

/**
 * `computeRseIndex` ne lit qu'une poignée de champs du résultat (supplier, hr,
 * qualityCosts, bank, treasury, production). Les fixtures sont donc des
 * partiels, castés : construire un CompanyRoundResult complet n'apporterait rien
 * au test et le rendrait illisible.
 */
function result(partial: Partial<CompanyRoundResult>): CompanyRoundResult {
  return { production: { produced: 1000 }, ...partial } as unknown as CompanyRoundResult;
}

describe("computeRseIndex", () => {
  it("sans aucun signal, les trois piliers restent neutres et non évalués", () => {
    const rse = computeRseIndex(result({}));
    expect(rse.environment).toEqual({ score: 50, evaluated: false });
    expect(rse.social).toEqual({ score: 50, evaluated: false });
    expect(rse.governance).toEqual({ score: 50, evaluated: false });
    expect(rse.score).toBe(50);
    expect(rse.notes).toEqual([]);
  });

  it("un profil vertueux dépasse la neutralité sur les trois piliers", () => {
    const rse = computeRseIndex(
      result({
        production: { produced: 1000 } as CompanyRoundResult["production"],
        supplier: { code: "eu", name: "EuroParts", costMultiplier: 1.05, qualityBonus: 0.05, supplyDisruption: false },
        qualityCosts: { prevention: 5000, internalFailure: 0, externalFailure: 0, defectUnits: 0, returnedUnits: 0 },
        hr: { headcount: 4, hired: 0, fired: 0, departed: 0, trainingBudget: 2000, salaryIndex: 1.1, cost: 0, nextHeadcount: 4 },
        bank: { trustBefore: 0.8, trustAfter: 0.85, reliability: 0.9, planFiled: true, loanRequested: 0, loanGranted: 0, overdraftLimit: 0, overdraftAnnualRate: 0.1 },
      }),
    );
    expect(rse.environment.evaluated).toBe(true);
    expect(rse.environment.score).toBeGreaterThan(50);
    expect(rse.social.score).toBeGreaterThan(50);
    expect(rse.governance.score).toBeGreaterThan(50);
    expect(rse.score).toBeGreaterThan(50);
  });

  it("un profil négligent tombe sous la neutralité et note les faits", () => {
    const rse = computeRseIndex(
      result({
        production: { produced: 1000 } as CompanyRoundResult["production"],
        supplier: { code: "asia", name: "AsiaComponents", costMultiplier: 0.81, qualityBonus: -0.03, supplyDisruption: true },
        qualityCosts: { prevention: 0, internalFailure: 9000, externalFailure: 3000, defectUnits: 120, returnedUnits: 30 },
        hr: { headcount: 4, hired: 0, fired: 0, departed: 1, trainingBudget: 0, salaryIndex: 0.9, cost: 0, nextHeadcount: 3 },
        treasury: { discounted: 0, factored: 0, forcedFactored: 0, financingCost: 0, crisis: true, placed: 0, matured: 0, placementIncome: 0 },
      }),
    );
    expect(rse.environment.score).toBeLessThan(50);
    expect(rse.social.score).toBeLessThan(50);
    expect(rse.governance.score).toBeLessThan(50);
    expect(rse.notes).toContain("Salaires sous le marché");
    expect(rse.notes).toContain("Rupture d'approvisionnement");
  });

  it("les notes restent bornées à 0–100", () => {
    const rse = computeRseIndex(
      result({
        production: { produced: 10 } as CompanyRoundResult["production"],
        qualityCosts: { prevention: 0, internalFailure: 0, externalFailure: 0, defectUnits: 100, returnedUnits: 0 },
        hr: { headcount: 4, hired: 0, fired: 0, departed: 9, trainingBudget: 0, salaryIndex: 0.5, cost: 0, nextHeadcount: 0 },
      }),
    );
    for (const p of [rse.environment, rse.social, rse.governance]) {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(100);
    }
    expect(rse.score).toBeGreaterThanOrEqual(0);
    expect(rse.score).toBeLessThanOrEqual(100);
  });
});
