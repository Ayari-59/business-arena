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
    supplierPaymentDelayDays: z.number().int().nonnegative(),
    depreciationPerRound: z.number().nonnegative(),
  }),
  fixedCostsPerRound: z.number().nonnegative(),
  // Assurance : la demande est un paramètre de marché, un événement de
  // demande ne peut donc pas être couvert (neutralisation par entreprise).
  insurance: z
    .object({
      premiumPerRound: z.number().nonnegative(),
      coveredEventCodes: z.array(z.string().min(1)).min(1),
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
  for (const code of s.insurance?.coveredEventCodes ?? []) {
    const event = s.events.find((e) => e.code === code);
    if (!event) {
      ctx.addIssue({ code: "custom", message: `assurance : événement couvert inconnu « ${code} »` });
    } else if (event.modifiers.some((m) => m.target === "demand" || m.target.startsWith("demand:"))) {
      ctx.addIssue({
        code: "custom",
        message: `assurance : « ${code} » modifie la demande (paramètre de marché, non couvrable)`,
      });
    }
  }
});

export function parseScenarioConfig(raw: unknown): EngineScenarioConfig {
  return scenarioWithChecks.parse(raw);
}
