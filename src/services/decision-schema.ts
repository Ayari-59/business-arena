import { z } from "zod";
import type { RoundDecisions } from "@/engine/types";

/**
 * Validation des décisions d'un tour (doc 01 §4 : zod à toutes les frontières).
 * Les bornes larges ci-dessous sont des garde-fous techniques ; les bornes
 * pédagogiques par scénario viendront de `decision_options` (doc 05 §3).
 *
 * Le plafond de prix a été écrit quand NOVA était le seul scénario, où une
 * enceinte se vend 79 €. Il rendait ATLAS CONSEIL injouable : la journée de
 * conseil s'y facture 780 € au tarif de référence, et tout tour au prix juste
 * était refusé. Un garde-fou technique doit arrêter la faute de frappe, pas le
 * métier : le seuil est monté au niveau du secteur le plus cher, avec de la
 * marge, et un test vérifie qu'aucun scénario ne repasse au-dessus.
 */
const PRIX_MAX = 10_000;

export const roundDecisionsSchema = z.object({
  price: z.coerce.number().min(1).max(PRIX_MAX),
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
      equipmentBuy: z
        .array(z.object({ typeCode: z.string().min(1), quantity: z.coerce.number().int().min(0).max(100) }))
        .optional(),
      equipmentSell: z
        .array(z.object({ typeCode: z.string().min(1), quantity: z.coerce.number().int().min(0).max(100) }))
        .optional(),
    })
    .optional(),
  finance: z
    .object({
      newLoan: z.coerce.number().min(0).max(500000).optional(),
      loanRepayment: z.coerce.number().min(0).max(500000).optional(),
      capitalIncrease: z.coerce.number().min(0).max(500000).optional(),
      dividend: z.coerce.number().min(0).max(1000000).optional(),
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
      expectedUnits: z.coerce.number().min(0).max(10_000_000).optional(),
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
