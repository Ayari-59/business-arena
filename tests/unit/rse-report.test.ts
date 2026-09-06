import { describe, expect, it } from "vitest";
import type { CompanyRoundResult } from "@/engine/types";
import { type RseIndex } from "@/scoring/rse";
import { RSE_CARD_CODES } from "@/engine/rse";
import { computeRseReport, type RseReportPeriod } from "@/scoring/rse-report";

/**
 * Le rapport extra-financier ne lit qu'une poignée de champs des résultats
 * persistés. Les fixtures sont donc des partiels castés — un résultat complet
 * n'apporterait rien au test et le rendrait illisible.
 */
function period(round: number, over: Partial<CompanyRoundResult>, events: string[] = []): RseReportPeriod {
  const result = {
    production: { produced: 1000 },
    ...over,
  } as unknown as CompanyRoundResult;
  const rse: RseIndex = {
    score: 60,
    environment: { score: 60, evaluated: true },
    social: { score: 55, evaluated: true },
    governance: { score: 65, evaluated: true },
    notes: [],
  };
  return { round, result, events, rse };
}

const CODES = RSE_CARD_CODES;

const engaged = (round: number, over: Partial<CompanyRoundResult> = {}, events: string[] = []) =>
  period(
    round,
    {
      production: { produced: 1000 } as CompanyRoundResult["production"],
      rse: {
        budget: 10000,
        investment: 5000,
        imageCapital: 0.4,
        cleanCapital: 0.5,
        imageFactor: 1.08,
        defectReduction: 0.15,
        financingBonus: 0.05,
        attritionRelief: 0.2,
      } as CompanyRoundResult["rse"],
      supplier: {
        code: "eu",
        name: "Euro",
        costMultiplier: 1.05,
        qualityBonus: 0.05,
        supplyDisruption: false,
      } as CompanyRoundResult["supplier"],
      hr: {
        headcount: 4,
        hired: 0,
        fired: 0,
        departed: 0,
        trainingBudget: 2000,
        salaryIndex: 1.05,
        cost: 0,
        nextHeadcount: 4,
      } as CompanyRoundResult["hr"],
      bank: { reliability: 0.8, planFiled: true } as CompanyRoundResult["bank"],
      qualityCosts: {
        prevention: 0,
        internalFailure: 0,
        externalFailure: 0,
        defectUnits: 30,
        returnedUnits: 0,
      } as CompanyRoundResult["qualityCosts"],
      ...over,
    },
    events,
  );

describe("computeRseReport", () => {
  it("aucun tour → rapport indisponible", () => {
    expect(computeRseReport([], CODES).available).toBe(false);
  });

  it("des tours SANS engagement RSE → rapport indisponible (pas de zéros affichés)", () => {
    const report = computeRseReport([period(1, {}), period(2, {})], CODES);
    expect(report.available).toBe(false);
  });

  it("des tours avec engagement → rapport disponible et consolidé", () => {
    const report = computeRseReport([engaged(1), engaged(2)], CODES);
    expect(report.available).toBe(true);
    expect(report.roundsCovered).toBe(2);
    expect(report.trajectory).toHaveLength(2);
    // engagement cumulé = 2 × (10000 + 5000)
    expect(report.engagementTotal).toBe(30000);
    // empreinte : positive, et une part évitée par le process propre.
    expect(report.carbon.totalPoints).toBeGreaterThan(0);
    expect(report.carbon.perUnit).toBeGreaterThan(0);
    expect(report.carbon.avoidedShare).toBeGreaterThan(0);
    // piliers alimentés.
    expect(report.pillars.environment.length).toBeGreaterThan(0);
    expect(report.pillars.social.length).toBeGreaterThan(0);
    expect(report.pillars.governance.some((i) => i.label === "Engagement RSE cumulé")).toBe(true);
  });

  it("les cartes RSE des tours remontent en faits marquants", () => {
    const report = computeRseReport(
      [engaged(1), engaged(2, {}, [CODES.label]), engaged(3, {}, [CODES.sanction])],
      CODES,
    );
    expect(report.highlights.some((h) => h.includes("Label"))).toBe(true);
    expect(report.highlights.some((h) => h.includes("Sanction"))).toBe(true);
  });

  it("un fournisseur responsable et un process propre allègent l'empreinte par unité", () => {
    const propre = computeRseReport([engaged(1), engaged(2)], CODES);
    const sale = computeRseReport(
      [
        engaged(1, {
          rse: {
            budget: 10000,
            investment: 0,
            imageCapital: 0.4,
            cleanCapital: 0,
            imageFactor: 1.08,
            defectReduction: 0,
            financingBonus: 0,
            attritionRelief: 0,
          } as CompanyRoundResult["rse"],
          supplier: {
            code: "asia",
            name: "Asia",
            costMultiplier: 0.8,
            qualityBonus: -0.02,
            supplyDisruption: false,
          } as CompanyRoundResult["supplier"],
        }),
      ],
      CODES,
    );
    expect(propre.carbon.perUnit).toBeLessThan(sale.carbon.perUnit);
  });
});
