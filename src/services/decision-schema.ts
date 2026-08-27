import { z } from "zod";
import type { RoundDecisions } from "@/engine/types";

/**
 * Validation des décisions d'un tour (doc 01 §4 : zod à toutes les frontières).
 * Les bornes larges ci-dessous sont des garde-fous techniques ; les bornes
 * pédagogiques par scénario viendront de `decision_options` (doc 05 §3).
 */
export const roundDecisionsSchema = z.object({
  price: z.coerce.number().min(1).max(500),
  productionPlan: z.coerce.number().min(0).max(50000),
  marketingBudget: z.coerce.number().min(0).max(200000),
  qualityBudget: z.coerce.number().min(0).max(200000),
  maintenanceBudget: z.coerce.number().min(0).max(100000),
  insurance: z.union([z.boolean(), z.string()]).optional(),
  supplierChoice: z.string().optional(),
  acceptOrder: z.boolean().optional(),
  studies: z
    .object({
      market: z.boolean().optional(),
      price: z.boolean().optional(),
      finance: z.boolean().optional(),
      project: z.boolean().optional(),
    })
    .optional(),
  hr: z
    .object({
      hire: z.coerce.number().int().min(0).max(10).optional(),
      fire: z.coerce.number().int().min(0).max(10).optional(),
      trainingBudget: z.coerce.number().min(0).max(100000).optional(),
      salaryIndex: z.coerce.number().min(0.8).max(1.3).optional(),
    })
    .optional(),
  investment: z
    .object({
      machineCapacityUnits: z.coerce.number().min(0).max(50000).optional(),
    })
    .optional(),
  finance: z
    .object({
      newLoan: z.coerce.number().min(0).max(500000).optional(),
      loanRepayment: z.coerce.number().min(0).max(500000).optional(),
      capitalIncrease: z.coerce.number().min(0).max(500000).optional(),
    })
    .optional(),
  treasury: z
    .object({
      discount: z.coerce.number().min(0).max(1000000).optional(),
      factoring: z.coerce.number().min(0).max(1000000).optional(),
      placement: z.coerce.number().min(0).max(1000000).optional(),
    })
    .optional(),
  forecast: z
    .object({
      expectedRevenue: z.coerce.number().optional(),
      expectedNetIncome: z.coerce.number().optional(),
      expectedCash: z.coerce.number().optional(),
    })
    .optional(),
});

// garde de compatibilité structurelle avec le type moteur
export type ParsedRoundDecisions = z.infer<typeof roundDecisionsSchema>;
const _compat: RoundDecisions = {} as ParsedRoundDecisions;
void _compat;
