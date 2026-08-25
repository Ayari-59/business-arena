import type {
  CompanyRoundResult,
  EngineScenarioConfig,
  RoundDecisions,
  ScoringConfig,
} from "../engine/types";

/**
 * Business Performance Index (doc 08 §1) — module PUR.
 * 7 dimensions notées 0-100 : pour chaque dimension, la note finale est
 * 0,5 × versusBenchmark (bornes du scénario) + 0,5 × versusPairs (rang
 * percentile parmi les entreprises de la partie). Le score n'est jamais le
 * seul résultat financier (§21).
 */

export type BpiDimension =
  | "economic"
  | "financial"
  | "commercial"
  | "operational"
  | "profitability"
  | "strategy"
  | "decision_mastery";

export const BPI_DIMENSIONS: BpiDimension[] = [
  "economic",
  "financial",
  "commercial",
  "operational",
  "profitability",
  "strategy",
  "decision_mastery",
];

export const DIMENSION_LABELS: Record<BpiDimension, string> = {
  economic: "Performance économique",
  financial: "Performance financière",
  commercial: "Performance commerciale",
  operational: "Performance opérationnelle",
  profitability: "Rentabilité",
  strategy: "Qualité stratégique",
  decision_mastery: "Maîtrise des modèles de décision",
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Normalisation linéaire bornée : min → 0, target → 100 (monotone, testée). */
export function normalizeToBenchmark(value: number, bounds: { min: number; target: number }): number {
  const range = bounds.target - bounds.min;
  if (range <= 0) return 50;
  return clamp01((value - bounds.min) / range) * 100;
}

/** Rang percentile de `own` parmi `all` (0 = dernier, 100 = premier). */
export function peerPercentile(own: number, all: number[]): number {
  const others = all.length - 1;
  if (others <= 0) return 100;
  const below = all.filter((v) => v < own).length;
  const equal = all.filter((v) => v === own).length - 1;
  return ((below + equal / 2) / others) * 100;
}

export interface PedagogyInputs {
  /** Scores finaux 0..1 des situations débriefées du tour (vide si aucune). */
  situationScores: number[];
  /** Scores 0..1 des diagnostics du tour (composante « qualité stratégique »). */
  diagnosisScores: number[];
}

/**
 * Cohérence stratégique v1 (doc 08 §1.3) : détecteurs simples et documentés.
 * Base 60, pénalités sur les incohérences flagrantes, bonus de pilotage sain.
 */
export function strategyCoherence(args: {
  scenario: EngineScenarioConfig;
  decisions: RoundDecisions;
  result: CompanyRoundResult;
}): number {
  const { scenario, decisions, result } = args;
  let score = 60;
  const refPrice = [...scenario.market.segments].sort((a, b) => b.size - a.size)[0]?.refPrice ?? 60;

  // positionnement premium sans effort qualité
  if (decisions.price > refPrice * 1.15 && decisions.qualityBudget < 0.3 * scenario.production.qualityScale) {
    score -= 20;
  }
  // marketing massif en pleine rupture de capacité
  const segments = Object.values(result.market.bySegment);
  const sold = segments.reduce((s, d) => s + d.sold, 0);
  const lost = segments.reduce((s, d) => s + d.lost, 0);
  if (decisions.marketingBudget > scenario.marketing.scale && sold > 0 && lost > 0.2 * sold) {
    score -= 20;
  }
  // maintenance négligée alors que la production sature
  if (
    decisions.maintenanceBudget < 0.5 * scenario.production.maintenanceReference &&
    result.production.utilizationRate > 0.9
  ) {
    score -= 10;
  }
  // pilotage équilibré : bénéficiaire ET liquide
  if (result.incomeStatement.netIncome > 0 && result.functionalBalance.netTreasury >= 0) {
    score += 25;
  }
  return Math.max(0, Math.min(100, score));
}

/** Notes brutes (versusBenchmark) des 7 dimensions pour une entreprise. */
export function rawDimensionScores(args: {
  scenario: EngineScenarioConfig;
  decisions: RoundDecisions;
  result: CompanyRoundResult;
  pedagogy: PedagogyInputs;
}): Record<BpiDimension, number> {
  const { scenario, decisions, result, pedagogy } = args;
  const b = scenario.scoring.benchmarks;
  const overdraftUse =
    scenario.finance.overdraftLimit > 0
      ? clamp01(result.balanceSheet.overdraft / scenario.finance.overdraftLimit)
      : result.balanceSheet.overdraft > 0
        ? 1
        : 0;
  const segments = Object.values(result.market.bySegment);
  const demand = segments.reduce((s, d) => s + d.demandForCompany, 0);
  const sold = segments.reduce((s, d) => s + d.sold, 0);
  const serviceRate = demand > 0 ? clamp01(sold / demand) : 1;

  const avg = (values: number[], fallback: number) =>
    values.length === 0 ? fallback : values.reduce((a, c) => a + c, 0) / values.length;

  const coherence = strategyCoherence({ scenario, decisions, result });
  const diagnosisComponent = avg(pedagogy.diagnosisScores, -1);

  return {
    economic: normalizeToBenchmark(result.incomeStatement.operatingIncome, b.operatingIncome),
    financial:
      0.7 * normalizeToBenchmark(result.functionalBalance.netTreasury, b.netTreasury) +
      0.3 * (1 - overdraftUse) * 100,
    commercial:
      0.5 * normalizeToBenchmark(result.incomeStatement.revenue, b.revenue) +
      0.5 * clamp01(result.market.totalShare / b.marketShareTarget) * 100,
    operational:
      0.6 * clamp01(result.production.utilizationRate / b.utilizationTarget) * 100 +
      0.4 * serviceRate * 100,
    profitability: normalizeToBenchmark(result.ratios.returnOnEquity ?? 0, b.returnOnEquity),
    // stratégie = cohérence des décisions + qualité des diagnostics (§21)
    strategy:
      diagnosisComponent >= 0 ? 0.7 * coherence + 0.3 * diagnosisComponent * 100 : coherence,
    // maîtrise des modèles : scores des situations (neutre 50 si aucune ce tour)
    decision_mastery: avg(pedagogy.situationScores, 0.5) * 100,
  };
}

export interface CompanyScoringInput {
  companyId: string;
  decisions: RoundDecisions;
  result: CompanyRoundResult;
  pedagogy: PedagogyInputs;
}

export interface RoundScores {
  companyId: string;
  raw: Record<BpiDimension, number>;
  normalized: Record<BpiDimension, number>; // 0,5 benchmark + 0,5 pairs
  bpi: number; // pondéré (Σ poids = 1)
}

/** Scores d'un tour pour toutes les entreprises (la comparaison aux pairs exige le lot complet). */
export function computeRoundScores(
  scenario: EngineScenarioConfig,
  companies: CompanyScoringInput[],
): RoundScores[] {
  const raws = companies.map((c) => ({
    companyId: c.companyId,
    raw: rawDimensionScores({ scenario, decisions: c.decisions, result: c.result, pedagogy: c.pedagogy }),
  }));
  const weights = scenario.scoring.weights;
  const weightOf: Record<BpiDimension, number> = {
    economic: weights.economic,
    financial: weights.financial,
    commercial: weights.commercial,
    operational: weights.operational,
    profitability: weights.profitability,
    strategy: weights.strategy,
    decision_mastery: weights.decisionMastery,
  };

  return raws.map(({ companyId, raw }) => {
    const normalized = {} as Record<BpiDimension, number>;
    let bpi = 0;
    for (const dimension of BPI_DIMENSIONS) {
      const peers = raws.map((r) => r.raw[dimension]);
      const score = 0.5 * raw[dimension] + 0.5 * peerPercentile(raw[dimension], peers);
      normalized[dimension] = score;
      bpi += weightOf[dimension] * score;
    }
    return { companyId, raw, normalized, bpi };
  });
}

/**
 * BPI de partie (doc 08 §1.4) : moyenne des BPI de tours à poids croissants
 * (le tour T pèse T / Σ(1..T) — on juge la trajectoire, pas le départ).
 */
export function gameBpi(roundBpis: number[]): number {
  if (roundBpis.length === 0) return 0;
  const totalWeight = (roundBpis.length * (roundBpis.length + 1)) / 2;
  return roundBpis.reduce((sum, bpi, i) => sum + ((i + 1) / totalWeight) * bpi, 0);
}

export function scoringWeights(config: ScoringConfig): Record<BpiDimension, number> {
  return {
    economic: config.weights.economic,
    financial: config.weights.financial,
    commercial: config.weights.commercial,
    operational: config.weights.operational,
    profitability: config.weights.profitability,
    strategy: config.weights.strategy,
    decision_mastery: config.weights.decisionMastery,
  };
}
