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
  const ct = scenario.scoring.coherenceThresholds;
  let score = 60;
  const refPrice = [...scenario.market.segments].sort((a, b) => b.size - a.size)[0]?.refPrice ?? 60;

  const premiumPriceRatio = ct?.premiumPriceRatio ?? 1.15;
  const minQualityEffortRatio = ct?.minQualityEffortRatio ?? 0.3;
  const highMarketingLostRatio = ct?.highMarketingLostRatio ?? 0.2;
  const lowMaintenanceRatio = ct?.lowMaintenanceRatio ?? 0.5;
  const highUtilizationFloor = ct?.highUtilizationFloor ?? 0.9;

  if (decisions.price > refPrice * premiumPriceRatio && decisions.qualityBudget < minQualityEffortRatio * scenario.production.qualityScale) {
    score -= 20;
  }
  const segments = Object.values(result.market.bySegment);
  const sold = segments.reduce((s, d) => s + d.sold, 0);
  const lost = segments.reduce((s, d) => s + d.lost, 0);
  if (decisions.marketingBudget > scenario.marketing.scale && sold > 0 && lost > highMarketingLostRatio * sold) {
    score -= 20;
  }
  if (
    decisions.maintenanceBudget < lowMaintenanceRatio * scenario.production.maintenanceReference &&
    result.production.utilizationRate > highUtilizationFloor
  ) {
    score -= 10;
  }
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

// ===========================================================================
// BPI version 2 (V1-2) — module PUR
// ===========================================================================
//
// Six dimensions au lieu de sept : « pilotage » fusionne stratégie et
// opérationnel. Trois corrections par rapport à v1, motivées par l'audit :
//
//  - base ZÉRO pour la cohérence (plus de 60 offerts) : la cohérence ne prend
//    de points que sur des décisions ÉDITÉES (V1-1) allant dans le sens du
//    levier attendu du tour ;
//  - maîtrise décisionnelle à 0 tant qu'aucune situation n'est rendue (plus de
//    50 par défaut) ; une équipe silencieuse (décisions reconduites) est à 0
//    en pilotage-cohérence et en maîtrise ;
//  - performance financière calculée sur la VARIATION du résultat (pas le
//    niveau absolu, gonflé par la trésorerie de départ), plancher à 20 dès que
//    le résultat net est négatif.
//
// Les ex æquo partagent le même percentile (peerPercentile, méthode
// fractionnaire) — inchangé depuis v1, verrouillé par un test.

export type BpiV2Dimension =
  | "economic"
  | "financial"
  | "commercial"
  | "profitability"
  | "pilotage"
  | "decision_mastery";

export const BPI_V2_DIMENSIONS: BpiV2Dimension[] = [
  "economic",
  "financial",
  "commercial",
  "profitability",
  "pilotage",
  "decision_mastery",
];

export const V2_DIMENSION_LABELS: Record<BpiV2Dimension, string> = {
  economic: "Performance économique",
  financial: "Performance financière",
  commercial: "Performance commerciale",
  profitability: "Rentabilité",
  pilotage: "Pilotage",
  decision_mastery: "Maîtrise décisionnelle",
};

/** Intitulés par nom de dimension (v1 et v2), pour un affichage qui ne connaît pas la version. */
export const DIMENSION_LABEL_BY_NAME: Record<string, string> = {
  economic: "Performance économique",
  financial: "Performance financière",
  commercial: "Performance commerciale",
  operational: "Performance opérationnelle",
  profitability: "Rentabilité",
  strategy: "Qualité stratégique",
  decision_mastery: "Maîtrise décisionnelle",
  pilotage: "Pilotage",
};

/** Ordre d'affichage : v2 d'abord, puis les dimensions v1 qui ne subsistent que sur d'anciens tours. */
export const DIMENSION_DISPLAY_ORDER: string[] = [
  "economic",
  "financial",
  "commercial",
  "profitability",
  "pilotage",
  "operational",
  "strategy",
  "decision_mastery",
];

export interface PedagogyInputsV2 {
  /** Scores finaux 0..1 des situations rendues du tour (vide si aucune). */
  situationScores: number[];
  /** Décisions reconduites faute de saisie : cohérence et maîtrise à 0 ce tour. */
  carried: boolean;
  /**
   * Cohérence 0..100 : part des leviers pivots attendus du tour qui ont été
   * édités dans le bon sens. `null` quand le tour ne suggère aucun levier
   * pivot mesurable (aucune situation, ou levier sur un champ non tracé).
   */
  coherence: number | null;
  /** Résultat net du tour précédent (0 au tour 1), pour la variation financière. */
  previousNetIncome: number;
}

/**
 * Performance financière v2 : sur la variation du résultat net, normalisée par
 * le chiffre d'affaires. Un résultat négatif est plafonné à 20 (une perte ne
 * peut pas être une bonne note, quelle que soit la trésorerie de départ).
 */
export function financialV2Score(result: CompanyRoundResult, previousNetIncome: number): number {
  const netIncome = result.incomeStatement.netIncome;
  if (netIncome < 0) return 20;
  const ca = result.incomeStatement.revenue;
  const variation = netIncome - previousNetIncome;
  const ratio = ca > 0 ? variation / ca : variation >= 0 ? 1 : -1;
  return clamp01((Math.max(-1, Math.min(1, ratio)) + 1) / 2) * 100;
}

/** Notes brutes (versusBenchmark) des 6 dimensions v2 pour une entreprise. */
export function rawDimensionScoresV2(args: {
  scenario: EngineScenarioConfig;
  result: CompanyRoundResult;
  pedagogy: PedagogyInputsV2;
}): Record<BpiV2Dimension, number> {
  const { scenario, result, pedagogy } = args;
  const b = scenario.scoring.benchmarks;
  const segments = Object.values(result.market.bySegment);
  const demand = segments.reduce((s, d) => s + d.demandForCompany, 0);
  const sold = segments.reduce((s, d) => s + d.sold, 0);
  const serviceRate = demand > 0 ? clamp01(sold / demand) : 1;

  // Exécution opérationnelle : identique à la dimension « operational » de v1.
  const operational =
    0.6 * clamp01(result.production.utilizationRate / b.utilizationTarget) * 100 +
    0.4 * serviceRate * 100;
  // Cohérence des décisions : base 0, uniquement sur les leviers pivots édités
  // dans le bon sens (calculée en amont). Reconduit ⇒ 0.
  const coherence = pedagogy.carried ? 0 : (pedagogy.coherence ?? 0);

  const situationAvg =
    pedagogy.situationScores.length === 0
      ? 0
      : pedagogy.situationScores.reduce((a, c) => a + c, 0) / pedagogy.situationScores.length;

  return {
    economic: normalizeToBenchmark(result.incomeStatement.operatingIncome, b.operatingIncome),
    financial: financialV2Score(result, pedagogy.previousNetIncome),
    commercial:
      0.5 * normalizeToBenchmark(result.incomeStatement.revenue, b.revenue) +
      0.5 * clamp01(result.market.totalShare / b.marketShareTarget) * 100,
    profitability: normalizeToBenchmark(result.ratios.returnOnEquity ?? 0, b.returnOnEquity),
    // Pilotage = exécution opérationnelle + cohérence stratégique (fusion V1-2).
    pilotage: 0.5 * operational + 0.5 * coherence,
    // Maîtrise décisionnelle : 0 sans situation rendue ; 0 aussi si reconduit.
    decision_mastery: pedagogy.carried ? 0 : situationAvg * 100,
  };
}

export interface CompanyScoringInputV2 {
  companyId: string;
  result: CompanyRoundResult;
  pedagogy: PedagogyInputsV2;
}

export interface RoundScoresV2 {
  companyId: string;
  raw: Record<BpiV2Dimension, number>;
  normalized: Record<BpiV2Dimension, number>;
  bpi: number;
}

/** Poids v2 : « pilotage » reçoit la somme des poids stratégie + opérationnel. */
export function scoringWeightsV2(config: ScoringConfig): Record<BpiV2Dimension, number> {
  return {
    economic: config.weights.economic,
    financial: config.weights.financial,
    commercial: config.weights.commercial,
    profitability: config.weights.profitability,
    pilotage: config.weights.strategy + config.weights.operational,
    decision_mastery: config.weights.decisionMastery,
  };
}

/**
 * Poids par NOM de dimension, v1 et v2 confondus : « pilotage » vaut stratégie
 * + opérationnel. Sert au classement, qui somme les dimensions stockées pour
 * chaque tour sans connaître sa version.
 */
export function scoringWeightsByName(config: ScoringConfig): Record<string, number> {
  const w = config.weights;
  return {
    economic: w.economic,
    financial: w.financial,
    commercial: w.commercial,
    operational: w.operational,
    profitability: w.profitability,
    strategy: w.strategy,
    decision_mastery: w.decisionMastery,
    pilotage: w.strategy + w.operational,
  };
}

/** Scores v2 d'un tour pour toutes les entreprises (percentile sur le lot complet). */
export function computeRoundScoresV2(
  scenario: EngineScenarioConfig,
  companies: CompanyScoringInputV2[],
): RoundScoresV2[] {
  const raws = companies.map((c) => ({
    companyId: c.companyId,
    raw: rawDimensionScoresV2({ scenario, result: c.result, pedagogy: c.pedagogy }),
  }));
  const weightOf = scoringWeightsV2(scenario.scoring);

  return raws.map(({ companyId, raw }) => {
    const normalized = {} as Record<BpiV2Dimension, number>;
    let bpi = 0;
    for (const dimension of BPI_V2_DIMENSIONS) {
      const peers = raws.map((r) => r.raw[dimension]);
      const score = 0.5 * raw[dimension] + 0.5 * peerPercentile(raw[dimension], peers);
      normalized[dimension] = score;
      bpi += weightOf[dimension] * score;
    }
    return { companyId, raw, normalized, bpi };
  });
}
