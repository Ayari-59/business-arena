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
  events: z.array(eventSchema),
  scriptedEvents: z.array(
    z.object({
      round: z.number().int().positive(),
      eventCode: z.string().min(1),
      companyIndex: z.number().int().nonnegative().optional(),
    }),
  ),
}) satisfies z.ZodType<EngineScenarioConfig>;

export function parseScenarioConfig(raw: unknown): EngineScenarioConfig {
  return engineScenarioConfigSchema.parse(raw);
}
