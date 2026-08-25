import type { EngineScenarioConfig } from "../../engine/types";

/**
 * Périodicité d'une partie (ADR-01) : un tour peut représenter un mois, un
 * trimestre ou une année. Les scénarios sont écrits en base trimestrielle
 * (90 jours) ; cette fonction dérive une variante redimensionnée SANS toucher
 * au scénario d'origine — la dramaturgie par tour (pic au tour 4, CampusTech
 * au tour 3…) est conservée, seule l'échelle économique change.
 *
 * Règles de redimensionnement (facteur k = jours du tour / 90) :
 * - grandeurs de flux par tour (demande de base, coûts fixes, amortissements,
 *   capacités machine et heures, références de budgets) : × k ;
 * - taux de croissance par tour : composés — (1+g)^k − 1 ;
 * - délais de paiement (en jours) et taux annuels : INCHANGÉS — leur poids
 *   relatif varie donc naturellement avec la durée du tour (un client à 80 j
 *   pèse plus lourd au mois qu'à l'année : c'est voulu et pédagogique).
 */

export type Periodicity = "month" | "quarter" | "year";

export const PERIODICITY_DAYS: Record<Periodicity, number> = {
  month: 30,
  quarter: 90,
  year: 360,
};

export const PERIODICITY_LABELS: Record<Periodicity, { singular: string; plural: string }> = {
  month: { singular: "Mois", plural: "mois" },
  quarter: { singular: "Trimestre", plural: "trimestres" },
  year: { singular: "Année", plural: "années" },
};

/** Retrouve la périodicité d'un instantané de scénario depuis roundDays. */
export function periodicityFromRoundDays(roundDays: number): Periodicity {
  if (roundDays <= 45) return "month";
  if (roundDays <= 180) return "quarter";
  return "year";
}

export function periodLabel(roundDays: number, index: number): string {
  return `${PERIODICITY_LABELS[periodicityFromRoundDays(roundDays)].singular} ${index}`;
}

const compound = (ratePerQuarter: number, k: number) => Math.pow(1 + ratePerQuarter, k) - 1;

export function applyPeriodicity(
  scenario: EngineScenarioConfig,
  periodicity: Periodicity,
): EngineScenarioConfig {
  const days = PERIODICITY_DAYS[periodicity];
  const k = days / 90;
  if (k === 1) return scenario;

  return {
    ...scenario,
    roundDays: days,
    market: {
      ...scenario.market,
      segments: scenario.market.segments.map((s) => ({
        ...s,
        size: s.size * k,
        growth: compound(s.growth, k),
      })),
    },
    production: {
      ...scenario.production,
      qualityScale: scenario.production.qualityScale * k,
      maintenanceReference: scenario.production.maintenanceReference * k,
    },
    marketing: { scale: scenario.marketing.scale * k },
    finance: {
      ...scenario.finance,
      depreciationPerRound: scenario.finance.depreciationPerRound * k,
    },
    fixedCostsPerRound: scenario.fixedCostsPerRound * k,
    scoring: {
      ...scenario.scoring,
      benchmarks: {
        ...scenario.scoring.benchmarks,
        operatingIncome: scaleBounds(scenario.scoring.benchmarks.operatingIncome, k),
        revenue: scaleBounds(scenario.scoring.benchmarks.revenue, k),
        netTreasury: scaleBounds(scenario.scoring.benchmarks.netTreasury, k),
        // ROE, part de marché et utilisation sont des ratios : inchangés
      },
    },
  };
}

const scaleBounds = (b: { min: number; target: number }, k: number) => ({
  min: b.min * k,
  target: b.target * k,
});

/**
 * Redimensionne l'état initial d'une entreprise (capacités par tour).
 * Le bilan initial (stock de valeur, pas flux) reste inchangé.
 */
export function applyPeriodicityToCompany<
  T extends { machineCapacity: number; hoursPerEmployee: number },
>(company: T, periodicity: Periodicity): T {
  const k = PERIODICITY_DAYS[periodicity] / 90;
  if (k === 1) return company;
  return {
    ...company,
    machineCapacity: company.machineCapacity * k,
    hoursPerEmployee: company.hoursPerEmployee * k,
  };
}
