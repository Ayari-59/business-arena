/**
 * Mécanismes de stabilisation : validation défensive, contexte d'erreur,
 * et observabilité pour le débogage de la résolution de tours.
 *
 * Aucun impact sur les résultats ; sorties d'erreur enrichies seulement.
 */

import type { CompanyRoundResult, CompanyState } from "@/engine/types";

export interface ValidationContext {
  gameId: string;
  roundIndex: number;
  teamId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valide qu'un état de résultat ne contient pas de valeurs aberrantes
 * (NaN, Infinity, nombre extrême). Retourne un contexte d'erreur riche.
 */
export function validateRoundResult(
  result: CompanyRoundResult,
  context: ValidationContext,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const checkNumber = (value: unknown, path: string, allowNaN = false, allowInfinity = false) => {
    if (typeof value !== "number") return;
    if (Number.isNaN(value) && !allowNaN) {
      errors.push(`${path}: NaN détecté`);
    }
    if (!Number.isFinite(value) && !allowInfinity) {
      errors.push(`${path}: Infinité détectée (${value})`);
    }
    if (Number.isFinite(value) && Math.abs(value) > 1e12) {
      warnings.push(`${path}: Valeur extrême (${value})`);
    }
  };

  // Compte de résultat
  checkNumber(result.incomeStatement.revenue, "incomeStatement.revenue");
  checkNumber(result.incomeStatement.cogs, "incomeStatement.cogs");
  checkNumber(result.incomeStatement.grossProfit, "incomeStatement.grossProfit");
  checkNumber(result.incomeStatement.opex, "incomeStatement.opex");
  checkNumber(result.incomeStatement.ebitda, "incomeStatement.ebitda");
  checkNumber(result.incomeStatement.netIncome, "incomeStatement.netIncome");
  checkNumber(result.incomeStatement.roi, "incomeStatement.roi", true); // ROI peut être NaN

  // Bilan
  checkNumber(result.balanceSheet.assets, "balanceSheet.assets");
  checkNumber(result.balanceSheet.equity, "balanceSheet.equity");
  checkNumber(result.balanceSheet.liabilities, "balanceSheet.liabilities");
  checkNumber(result.balanceSheet.debt, "balanceSheet.debt");
  checkNumber(result.balanceSheet.cash, "balanceSheet.cash");

  // Trésorerie
  checkNumber(result.cashFlow.operations, "cashFlow.operations");
  checkNumber(result.cashFlow.financing, "cashFlow.financing");
  checkNumber(result.cashFlow.investment, "cashFlow.investment");
  checkNumber(result.cashFlow.netChange, "cashFlow.netChange");

  // Marché
  if (result.market.bySegment) {
    for (const [segmentId, segment] of Object.entries(result.market.bySegment)) {
      checkNumber(segment.sold, `market.bySegment[${segmentId}].sold`);
      checkNumber(segment.demand, `market.bySegment[${segmentId}].demand`);
      if (segment.sold > segment.demand * 1.01) {
        warnings.push(`market.bySegment[${segmentId}]: Ventes > demande (${segment.sold} > ${segment.demand})`);
      }
    }
  }

  // Production
  if (result.production) {
    checkNumber(result.production.produced, "production.produced");
    checkNumber(result.production.units, "production.units");
  }

  // Seuil de rentabilité
  if (result.breakeven) {
    checkNumber(result.breakeven.breakEven, "breakeven.breakEven", true); // Peut être Infinity
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Valide qu'un état de compagnie n'est pas corrompue (cohérence trésorerie,
 * bilan). Contexte riche pour débogage.
 */
export function validateCompanyState(state: CompanyState, context: ValidationContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!state.id) errors.push("État sans identifiant");
  if (!state.name) warnings.push("État sans nom");

  // Vérifications de cohérence financière
  checkStateNumber(state.cash, "cash", errors);
  checkStateNumber(state.equity, "equity", errors);
  checkStateNumber(state.liabilities, "liabilities", errors);

  // Trésorerie < 0 : attention
  if (typeof state.cash === "number" && state.cash < 0) {
    warnings.push(`Trésorerie négative: ${state.cash}`);
  }

  // Capitaux propres < 0 : alerte
  if (typeof state.equity === "number" && state.equity < 0) {
    warnings.push(`Capitaux propres négatifs: ${state.equity}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

function checkStateNumber(value: unknown, path: string, errors: string[]) {
  if (typeof value !== "number") return;
  if (Number.isNaN(value)) {
    errors.push(`${path}: NaN`);
  }
  if (!Number.isFinite(value)) {
    errors.push(`${path}: Infinité`);
  }
}

/**
 * Enrichit un message d'erreur avec le contexte de résolution du tour.
 * Aide au débogage et à la traçabilité des incidents.
 */
export function enrichError(error: Error | unknown, context: ValidationContext): Error {
  const base = error instanceof Error ? error.message : String(error);
  const enriched = `Résolution tour ${context.roundIndex} (partie ${context.gameId})${
    context.teamId ? ` équipe ${context.teamId}` : ""
  }: ${base}`;
  const err = new Error(enriched);
  if (error instanceof Error) err.cause = error;
  return err;
}

/**
 * Log structuré des étapes de résolution (pour observabilité sans sortie 500).
 * En prod, serait envoyé à un collector ; ici, console pour développement.
 */
export function logResolutionStep(
  context: ValidationContext,
  step: string,
  data?: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Round ${context.roundIndex}/${context.gameId}] ${step}`, data ?? "");
  }
}
