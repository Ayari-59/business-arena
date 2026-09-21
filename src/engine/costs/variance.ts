/**
 * ANALYSE D'ÉCARTS SUR COÛTS : le réel face au standard du scénario.
 *
 * Le vocabulaire suit celui du contrôle de gestion, parce que c'est celui que
 * l'élève apprend par ailleurs et qu'un mot approximatif ici se paie à
 * l'examen. Deux écarts seulement sont calculés, et ils portent leur nom :
 *
 *  · ÉCART SUR PRIX DES MATIÈRES — (coût d'achat réel − standard) × quantité
 *    produite. C'est le choix du fournisseur, chiffré ;
 *  · ÉCART SUR QUANTITÉ — la consommation perdue en rebut, valorisée au
 *    standard, pour les matières d'une part et pour les autres charges
 *    variables d'autre part.
 *
 * DEUX APPELLATIONS FAUSSES ONT ÉTÉ CORRIGÉES ICI.
 *
 * « Efficiency variance » pour les matières : en coûts standard, l'écart de
 * rendement (efficiency) se dit de la main-d'œuvre et de ses heures ; pour une
 * matière, c'est un écart sur QUANTITÉ consommée. D'où `…QuantityVariance`.
 *
 * « Labor » pour le second poste : le calcul porte sur
 * `otherVariableCostPerUnit`, c'est-à-dire les AUTRES CHARGES VARIABLES —
 * main-d'œuvre directe ET énergie, divers (chez NOVA Go, 6 € de MOD et 3 €
 * d'énergie). Le nommer « main-d'œuvre » laissait croire à un écart de masse
 * salariale, qui n'existe pas ici : les salaires sont une charge de structure,
 * et seul leur écart se facture, ailleurs dans le moteur (`engine/hr`).
 *
 * `laborRateVariance` a disparu avec eux : il valait zéro en toute
 * circonstance, faute de taux à faire varier dans le modèle. Un écart toujours
 * nul n'est pas un écart, c'est une ligne qui encombre.
 *
 * Les écarts sur le chiffre d'affaires restent à écrire : ce que le bloc
 * `revenueVarianceBySegment` contient aujourd'hui n'en est pas (voir plus bas).
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
  // Écarts sur coûts (€), positif = défavorable.
  /** Écart sur prix des matières : le fournisseur choisi, au standard près. */
  materialPriceVariance: number;
  /** Écart sur quantité de matières : la matière partie au rebut, au standard. */
  materialQuantityVariance: number;
  /** Écart sur quantité des autres charges variables (MOD, énergie) au rebut. */
  otherVariableQuantityVariance: number;
  totalCostVariance: number;
  /** Part de l'écart total dans le coût de revient réel du tour. */
  costVarianceRatio: number;

  /**
   * CE BLOC N'EST PAS UN ÉCART, malgré son nom. `priceVariance` vaut le
   * chiffre d'affaires réalisé (prix × quantité vendue) et `volumeVariance`
   * les unités NON vendues, comptées en unités et non en euros. Écrire un
   * vrai écart sur chiffre d'affaires suppose un budget de ventes, qui
   * n'existe pas encore. Rien ne doit en être affiché tant que c'est le cas.
   */
  revenueVarianceBySegment: Record<SegmentCode, {
    priceVariance: number;
    volumeVariance: number;
    totalVariance: number;
  }>;

  /** Somme des deux précédents : à ne pas lire comme un écart sur marge. */
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

/**
 * Écart sur quantité : ce qui est parti au rebut, valorisé au coût standard.
 * La même formule sert aux matières et aux autres charges variables ; seul le
 * standard passé en argument change.
 */
function quantityVariance(standardCost: number, defectUnits: number): number {
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
  const matQtyVar = quantityVariance(standardMaterialCost, defectUnits);
  const otherQtyVar = quantityVariance(standardOtherVariableCost, defectUnits);

  const totalCostVar = matPriceVar + matQtyVar + otherQtyVar;

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
    materialQuantityVariance: matQtyVar,
    otherVariableQuantityVariance: otherQtyVar,
    totalCostVariance: totalCostVar,
    costVarianceRatio: costVarRatio,
    revenueVarianceBySegment: revenueVarBySegment,
    contributionMarginVariance: contributionMarginVar,
  };
}
