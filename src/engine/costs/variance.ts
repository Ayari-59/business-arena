/**
 * Variance analysis (pilot on NOVA) — actual vs. standard cost decomposition.
 *
 * MVP: focuses on cost variances (material price/efficiency, labor rate/efficiency).
 * Revenue variances deferred to Phase 2 when formal budgets exist.
 * Foundation for multi-product mix variance (future).
 */

import type { SegmentCode, SegmentSalesDetail } from "../types";

export interface VarianceInput {
  // Product standards (from scenario config)
  standardMaterialCost: number;
  standardOtherVariableCost: number;

  // Actual costs realized this round
  actualMaterialMultiplier: number; // supplier cost multiplier applied
  actualQuantityProduced: number;
  defectUnits: number;

  // Actual price & volume by segment
  actualPrice: number;
  segmentSales: Record<SegmentCode, SegmentSalesDetail>;
}

export interface VarianceOutput {
  // Cost variances (€), positive = unfavorable (cost overrun)
  materialPriceVariance: number;
  materialEfficiencyVariance: number;
  laborRateVariance: number; // "labor" is proxy for otherVariableCost
  laborEfficiencyVariance: number;
  totalCostVariance: number;
  costVarianceRatio: number; // % of actual COGS

  // Revenue context by segment (units and realized price, deferred to full variance in Phase 2)
  revenueVarianceBySegment: Record<SegmentCode, {
    priceVariance: number;  // placeholder: actual price realized
    volumeVariance: number; // placeholder: units lost (opportunity cost)
    totalVariance: number;
  }>;

  // Contribution margin variance: cost variance impact
  contributionMarginVariance: number;
}

/** Material price variance: impact of supplier choice or material cost changes. */
function materialPriceVariance(
  standardCost: number,
  actualMultiplier: number,
  quantityProduced: number,
): number {
  const actualCost = standardCost * actualMultiplier;
  const variance = (actualCost - standardCost) * quantityProduced;
  return variance;
}

/** Material efficiency variance: impact of defects/scrap reducing effective output. */
function materialEfficiencyVariance(
  standardCost: number,
  defectUnits: number,
): number {
  return defectUnits * standardCost;
}

/** Labor rate variance: impact of labor cost changes per unit. */
function laborRateVariance(
  standardCost: number,
  actualMultiplier: number,
  quantityProduced: number,
): number {
  const actualCost = standardCost * actualMultiplier;
  const variance = (actualCost - standardCost) * quantityProduced;
  return variance;
}

/** Labor efficiency variance: impact of defects/rework on labor hours. */
function laborEfficiencyVariance(
  standardCost: number,
  defectUnits: number,
): number {
  return defectUnits * standardCost;
}

/** Actual selling price vs. potential price from lost sales (price impact analysis). */
function priceVarianceBySegment(
  actualPrice: number,
  segmentSales: Record<SegmentCode, SegmentSalesDetail>,
): Record<SegmentCode, number> {
  const result: Record<SegmentCode, number> = {};
  for (const [code, detail] of Object.entries(segmentSales)) {
    const sold = detail.sold ?? 0;
    // Price variance: simplified as actual price × actual sales
    // (detailed price vs. competitor analysis deferred to pedagogy)
    result[code as SegmentCode] = actualPrice * sold;
  }
  return result;
}

/** Volume variance by segment: actual units sold vs. potential (lost + sold). */
function volumeVarianceBySegment(
  segmentSales: Record<SegmentCode, SegmentSalesDetail>,
): Record<SegmentCode, number> {
  const result: Record<SegmentCode, number> = {};
  for (const [code, detail] of Object.entries(segmentSales)) {
    const sold = detail.sold ?? 0;
    const lost = detail.lost ?? 0;
    const potential = sold + lost;
    // Volume variance: units sold vs. market potential (lost = opportunity cost)
    // Positive = captured more than we could, negative = lost opportunity
    result[code as SegmentCode] = sold - potential;
  }
  return result;
}

/**
 * Calculate cost and revenue variances for a product round.
 * Returns null if variances are negligible (< 1 €), to avoid cluttering output.
 */
export function calculateVariances(input: VarianceInput): VarianceOutput | null {
  const {
    standardMaterialCost,
    standardOtherVariableCost,
    actualMaterialMultiplier,
    actualQuantityProduced,
    defectUnits,
    actualPrice,
    segmentSales,
  } = input;

  // Cost variances
  const matPriceVar = materialPriceVariance(
    standardMaterialCost,
    actualMaterialMultiplier,
    actualQuantityProduced,
  );
  const matEffVar = materialEfficiencyVariance(standardMaterialCost, defectUnits);
  const labRateVar = laborRateVariance(
    standardOtherVariableCost,
    actualMaterialMultiplier,
    actualQuantityProduced,
  );
  const labEffVar = laborEfficiencyVariance(standardOtherVariableCost, defectUnits);

  const totalCostVar = matPriceVar + matEffVar + labRateVar + labEffVar;

  // Actual COGS for ratio
  const actualMaterialCost = standardMaterialCost * actualMaterialMultiplier;
  const actualTotalCost = (actualMaterialCost + standardOtherVariableCost) * actualQuantityProduced;
  const costVarRatio = actualTotalCost > 0 ? totalCostVar / actualTotalCost : 0;

  // Revenue variances by segment
  const priceVarBySegment = priceVarianceBySegment(actualPrice, segmentSales);
  const volumeVarBySegment = volumeVarianceBySegment(segmentSales);

  const revenueVarBySegment: Record<SegmentCode, {
    priceVariance: number;
    volumeVariance: number;
    totalVariance: number;
  }> = {};
  let totalRevenueVar = 0;
  for (const code of Object.keys(segmentSales)) {
    const pVar = priceVarBySegment[code as SegmentCode] ?? 0;
    const vVar = volumeVarBySegment[code as SegmentCode] ?? 0;
    revenueVarBySegment[code as SegmentCode] = {
      priceVariance: pVar,
      volumeVariance: vVar,
      totalVariance: pVar + vVar,
    };
    totalRevenueVar += pVar + vVar;
  }

  // Contribution margin variance: how much price+volume beat/missed plan, net of costs
  const contributionMarginVar = totalRevenueVar - totalCostVar;

  // Skip if cost variances are negligible (< 1 € in absolute value)
  // Revenue variances are context only, not filtered
  if (Math.abs(totalCostVar) < 1) {
    return null;
  }

  return {
    materialPriceVariance: matPriceVar,
    materialEfficiencyVariance: matEffVar,
    laborRateVariance: labRateVar,
    laborEfficiencyVariance: labEffVar,
    totalCostVariance: totalCostVar,
    costVarianceRatio: costVarRatio,
    revenueVarianceBySegment: revenueVarBySegment,
    contributionMarginVariance: contributionMarginVar,
  };
}
