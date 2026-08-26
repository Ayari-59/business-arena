import { z } from "zod";
import type { EngineScenarioConfig } from "../../engine/types";

/**
 * Validation zod des configurations de scénario (§31, doc 01 §4) :
 * tout scénario est parsé à l'import et au chargement depuis la base —
 * jamais de `as` sur un JSONB.
 */

const segmentSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  size: z.number().positive(),
  growth: z.number().gt(-1),
  priceElasticity: z.number().negative(),
  refPrice: z.number().positive(),
  minAcceptablePrice: z.number().nonnegative(),
  psychThresholds: z.array(
    z.object({ threshold: z.number().positive(), penalty: z.number().gt(0).lte(1) }),
  ),
  marketingSensitivity: z.number().nonnegative(),
  qualitySensitivity: z.number().nonnegative(),
  loyalty: z.number().nonnegative(),
  priceEffectBounds: z
    .object({ min: z.number().nonnegative(), max: z.number().positive() })
    .refine((b) => b.min < b.max, "bornes d'effet prix incohérentes"),
  paymentDelayDays: z.number().int().nonnegative(),
  seasonality: z.array(z.number().nonnegative()).optional(),
});

const modifierSchema = z.object({
  target: z.union([
    z.literal("material_cost"),
    z.literal("demand"),
    z.literal("availability"),
    z.literal("interest_rate"),
    z.literal("order"),
    z.literal("order_price"),
    z.literal("order_subcontract"),
    z.templateLiteral(["demand:", z.string()]),
  ]),
  op: z.enum(["mul", "add"]),
  value: z.number(),
});

const eventSchema = z.object({
  code: z.string().min(1),
  scope: z.enum(["market", "company"]),
  probability: z.number().min(0).max(1),
  minRound: z.number().int().positive().optional(),
  duration: z.number().int().positive(),
  modifiers: z.array(modifierSchema).min(1),
});

export const engineScenarioConfigSchema = z.object({
  code: z.string().min(1),
  version: z.string().min(1),
  roundsCount: z.number().int().min(1).max(24),
  roundDays: z.number().int().positive(),
  market: z.object({
    segments: z.array(segmentSchema).min(1),
    seasonality: z.array(z.number().nonnegative()).min(1),
    outsideAttraction: z.number().nonnegative(),
    competitionIntensity: z.number().min(1),
  }),
  product: z.object({
    code: z.string().min(1),
    materialCostPerUnit: z.number().nonnegative(),
    otherVariableCostPerUnit: z.number().nonnegative(),
    hoursPerUnit: z.number().positive(),
  }),
  production: z.object({
    qualitySensitivity: z.number().nonnegative(),
    qualityScale: z.number().positive(),
    qualityInertia: z.number().min(0).max(1),
    maintenanceReference: z.number().nonnegative(),
    availabilityDecay: z.number().min(0).max(0.5),
  }),
  marketing: z.object({ scale: z.number().positive() }),
  finance: z.object({
    loanAnnualRate: z.number().min(0).max(1),
    overdraftAnnualRate: z.number().min(0).max(1),
    overdraftLimit: z.number().nonnegative(),
    taxRate: z.number().min(0).max(1),
    vatRate: z.number().min(0).max(0.5).optional(),
    supplierPaymentDelayDays: z.number().int().nonnegative(),
    depreciationPerRound: z.number().nonnegative(),
    loanDurationRounds: z.number().positive().optional(),
    maxCapitalIncreaseTotal: z.number().positive().optional(),
  }),
  treasury: z
    .object({
      discountAnnualRate: z.number().min(0).max(0.3),
      discountMaxShare: z.number().min(0).max(1),
      factoringFeeRate: z.number().min(0).max(0.2),
      forcedFactoringFeeRate: z.number().min(0).max(0.3),
    })
    .optional(),
  fixedCostsPerRound: z.number().nonnegative(),
  suppliers: z
    .array(
      z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        narrative: z.string().min(1),
        costMultiplier: z.number().min(0.5).max(2),
        qualityBonus: z.number().min(-0.1).max(0.15),
        paymentDelayDays: z.number().int().nonnegative(),
        supplyRiskProbability: z.number().min(0).max(0.3),
        supplyRiskAvailabilityHit: z.number().min(0.5).max(1),
      }),
    )
    .min(2)
    .optional(),
  insurance: z
    .object({
      premiumPerRound: z.number().nonnegative(),
      coveredEventCodes: z.array(z.string().min(1)).min(1),
      formulas: z
        .array(
          z.object({
            code: z.string().min(1),
            name: z.string().min(1),
            premiumPerRound: z.number().nonnegative(),
            coveredEventCodes: z.array(z.string().min(1)).min(1),
          }),
        )
        .min(1)
        .optional(),
    })
    .optional(),
  investment: z
    .object({
      costPerCapacityUnit: z.number().positive(),
      depreciationRounds: z.number().positive(),
      maxPerRound: z.number().positive(),
    })
    .optional(),
  // Études achetables : l'information a un prix (charge de structure).
  studies: z
    .object({
      marketCost: z.number().positive(),
      priceCost: z.number().positive(),
      financeCost: z.number().positive(),
      projectCost: z.number().positive(),
    })
    .optional(),
  // Commandes exceptionnelles entre les tours : rotation déterministe.
  orderOffers: z
    .array(
      z.object({
        code: z.string().min(1),
        title: z.string().min(1),
        narrative: z.string().min(1),
        units: z.number().positive(),
        price: z.number().positive(),
        paymentDelayDays: z.number().min(0).max(180),
      }),
    )
    .min(1)
    .optional(),
  subcontracting: z.object({ unitCost: z.number().positive() }).optional(),
  qualityCosts: z
    .object({
      baseDefectRate: z.number().min(0).max(0.2),
      externalReturnSensitivity: z.number().min(0).max(2),
    })
    .optional(),
  hr: z
    .object({
      salaryPerEmployeePerRound: z.number().positive(),
      includedHeadcount: z.number().int().positive(),
      hiringCost: z.number().nonnegative(),
      firingCost: z.number().nonnegative(),
      trainingScale: z.number().positive(),
      trainingSensitivity: z.number().min(0).max(0.5),
      maxProductivity: z.number().min(1).max(2),
      moraleSensitivity: z.number().min(0).max(2),
      attritionThreshold: z.number().min(0.8).max(1),
      maxHiresPerRound: z.number().int().positive(),
      maxHeadcount: z.number().int().positive(),
    })
    .optional(),
  events: z.array(eventSchema),
  scriptedEvents: z.array(
    z.object({
      round: z.number().int().positive(),
      eventCode: z.string().min(1),
      companyIndex: z.number().int().nonnegative().optional(),
    }),
  ),
  scoring: z.object({
    weights: z
      .object({
        economic: z.number().min(0).max(1),
        financial: z.number().min(0).max(1),
        commercial: z.number().min(0).max(1),
        operational: z.number().min(0).max(1),
        profitability: z.number().min(0).max(1),
        strategy: z.number().min(0).max(1),
        decisionMastery: z.number().min(0).max(1),
      })
      .refine(
        (w) => Math.abs(Object.values(w).reduce((a, b) => a + b, 0) - 1) < 1e-6,
        "les pondérations du BPI doivent sommer à 1",
      ),
    benchmarks: z.object({
      operatingIncome: z.object({ min: z.number(), target: z.number() }),
      revenue: z.object({ min: z.number(), target: z.number() }),
      netTreasury: z.object({ min: z.number(), target: z.number() }),
      returnOnEquity: z.object({ min: z.number(), target: z.number() }),
      marketShareTarget: z.number().gt(0).lte(1),
      utilizationTarget: z.number().gt(0).lte(1),
    }),
  }),
}) satisfies z.ZodType<EngineScenarioConfig>;

const scenarioWithChecks = engineScenarioConfigSchema.superRefine((s, ctx) => {
  const checkCoverage = (label: string, codes: string[]) => {
    for (const code of codes) {
      const event = s.events.find((e) => e.code === code);
      if (!event) {
        ctx.addIssue({ code: "custom", message: `${label} : événement couvert inconnu « ${code} »` });
      } else if (event.modifiers.some((m) => m.target === "demand" || m.target.startsWith("demand:"))) {
        ctx.addIssue({
          code: "custom",
          message: `${label} : « ${code} » modifie la demande (paramètre de marché, non couvrable)`,
        });
      }
    }
  };
  checkCoverage("assurance", s.insurance?.coveredEventCodes ?? []);
  for (const f of s.insurance?.formulas ?? []) {
    checkCoverage(`assurance (${f.code})`, f.coveredEventCodes);
  }
});

export function parseScenarioConfig(raw: unknown): EngineScenarioConfig {
  return scenarioWithChecks.parse(raw);
}
