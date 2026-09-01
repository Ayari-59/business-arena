import type { CompanyRoundResult } from "../engine/types";
import type { DetectCode } from "../config/scenarios/nova/situations";
import { formatEuro, formatPercent, formatUnits } from "../lib/format";

/**
 * Détection de situations (doc 03 §1.1) : des règles observent les résultats
 * d'un tour et déclenchent les situations correspondantes pour le tour suivant.
 */
export function detectSituations(
  result: CompanyRoundResult,
  /**
   * Décisions ouvertes au niveau joué. Une situation dont l'arbitrage n'est
   * pas jouable ne doit pas s'ouvrir : elle poserait une question dont la
   * réponse n'est nulle part dans le formulaire.
   */
  enabled: { placement?: boolean } = {},
): DetectCode[] {
  const detected: DetectCode[] = [];
  const { netIncome } = result.incomeStatement;
  const { netTreasury } = result.functionalBalance;

  if (netIncome > 0 && netTreasury < 0) detected.push("profitable_illiquid");
  if (netIncome < 0) detected.push("below_breakeven");

  const segments = Object.values(result.market.bySegment);
  const sold = segments.reduce((s, d) => s + d.sold, 0);
  const lost = segments.reduce((s, d) => s + d.lost, 0);
  if (sold > 0 && lost > 0.1 * sold) detected.push("stockout");

  // Atelier saturé : la machine tourne à plein ET de la demande est perdue —
  // le moment exact où la question d'investir (ou de sous-traiter) se pose.
  if (result.production.utilizationRate >= 0.97 && sold > 0 && lost > 0.05 * sold)
    detected.push("capacity_saturated");

  // Trésorerie qui dort : pas de découvert, rien de déjà placé, et un solde
  // qui dépasse une fois et demie les charges de structure du tour. Autrement
  // dit, de quoi tenir plus d'un tour et demi sans rien vendre. Ce n'est pas
  // une panne, c'est un coût d'opportunité, et il ne se voit dans aucun compte.
  if (
    enabled.placement &&
    result.balanceSheet.overdraft < 0.5 &&
    (result.balanceSheet.shortTermInvestment ?? 0) < 0.5 &&
    result.incomeStatement.fixedCosts > 0 &&
    result.balanceSheet.cash > 1.5 * result.incomeStatement.fixedCosts
  ) {
    detected.push("idle_cash");
  }

  return detected;
}

// ---------------------------------------------------------------------------
// Métadonnées de détection (A1 — causalité visible, doc 03 §1.1)
//
// Chaque règle porte les faits chiffrés qui l'ont déclenchée. Ces faits sont
// présentés au joueur dans le bloc « Pourquoi cette situation ? » et utilisent
// UNIQUEMENT des valeurs extraites du CompanyRoundResult — jamais de
// formulation du type « Votre décision X a provoqué Y ».
// ---------------------------------------------------------------------------

export interface TriggerFact {
  label: string;
  value: string;
  /** Sémantique pour le rendu : vert / rouge / neutre. */
  direction: "positive" | "negative" | "neutral";
}

interface DetectionMeta {
  buildFacts(result: CompanyRoundResult): TriggerFact[];
}

function marketTotals(result: CompanyRoundResult): { sold: number; lost: number } {
  const segments = Object.values(result.market.bySegment);
  const sold = segments.reduce((s, d) => s + d.sold, 0);
  const lost = segments.reduce((s, d) => s + d.lost, 0);
  return { sold, lost };
}

export const DETECTION_METADATA: Record<DetectCode, DetectionMeta> = {
  profitable_illiquid: {
    buildFacts(r) {
      return [
        { label: "Résultat net", value: formatEuro(r.incomeStatement.netIncome), direction: "positive" },
        { label: "Trésorerie nette", value: formatEuro(r.functionalBalance.netTreasury), direction: "negative" },
      ];
    },
  },
  below_breakeven: {
    buildFacts(r) {
      return [
        { label: "Résultat net", value: formatEuro(r.incomeStatement.netIncome), direction: "negative" },
      ];
    },
  },
  stockout: {
    buildFacts(r) {
      const { sold, lost } = marketTotals(r);
      return [
        { label: "Unités vendues", value: formatUnits(sold), direction: "neutral" },
        { label: "Demande non servie", value: `${formatUnits(lost)} (${formatPercent(lost / sold)})`, direction: "negative" },
      ];
    },
  },
  capacity_saturated: {
    buildFacts(r) {
      const { sold, lost } = marketTotals(r);
      return [
        { label: "Taux d'utilisation", value: formatPercent(r.production.utilizationRate), direction: "neutral" },
        { label: "Demande non servie", value: `${formatUnits(lost)} (${formatPercent(lost / sold)})`, direction: "negative" },
      ];
    },
  },
  idle_cash: {
    buildFacts(r) {
      const cash = r.balanceSheet.cash;
      const fixedCosts = r.incomeStatement.fixedCosts;
      const ratioVal = (cash / fixedCosts).toFixed(1).replace(".", ",");
      return [
        { label: "Trésorerie disponible", value: formatEuro(cash), direction: "neutral" },
        { label: "Charges de structure", value: formatEuro(fixedCosts), direction: "neutral" },
        { label: "Ratio trésorerie / charges", value: `${ratioVal}×`, direction: "neutral" },
      ];
    },
  },
};

export function buildTriggerContext(
  code: DetectCode,
  result: CompanyRoundResult,
): TriggerFact[] {
  return DETECTION_METADATA[code].buildFacts(result);
}
