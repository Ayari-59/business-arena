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
      // même emprunt, même durée réelle : la durée en tours varie en 1/k
      ...(scenario.finance.loanDurationRounds !== undefined
        ? { loanDurationRounds: scenario.finance.loanDurationRounds / k }
        : {}),
    },
    fixedCostsPerRound: scenario.fixedCostsPerRound * k,
    ...(scenario.insurance
      ? {
          insurance: {
            ...scenario.insurance,
            premiumPerRound: scenario.insurance.premiumPerRound * k,
          },
        }
      : {}),
    // RH : salaires et échelle de formation sont des flux (× k) ; les coûts
    // d'embauche/licenciement sont des ponctuels réels — non redimensionnés.
    ...(scenario.hr
      ? {
          hr: {
            ...scenario.hr,
            salaryPerEmployeePerRound: scenario.hr.salaryPerEmployeePerRound * k,
            trainingScale: scenario.hr.trainingScale * k,
          },
        }
      : {}),
    // Études : des prestations par tour — flux (× k).
    ...(scenario.studies
      ? {
          studies: {
            marketCost: scenario.studies.marketCost * k,
            priceCost: scenario.studies.priceCost * k,
            financeCost: scenario.studies.financeCost * k,
            projectCost: scenario.studies.projectCost * k,
          },
        }
      : {}),
    // Commandes exceptionnelles : volumes en flux (× k) ; prix unitaires et
    // délais de règlement (jours réels) inchangés.
    ...(scenario.orderOffers
      ? {
          orderOffers: scenario.orderOffers.map((o) => ({
            ...o,
            units: o.units * k,
          })),
        }
      : {}),
    // Les modificateurs en unités (« order », « order_subcontract ») sont des
    // flux : × k. Les prix imposés (« order_price ») ne changent pas.
    events: scenario.events.map((e) => ({
      ...e,
      modifiers: e.modifiers.map((m) =>
        m.target === "order" || m.target === "order_subcontract"
          ? { ...m, value: m.value * k }
          : m,
      ),
    })),
    // Investissement : une même machine physique vaut le même prix quelle que
    // soit la périodicité — le coût par unité de capacité PAR TOUR varie en
    // 1/k, la durée d'amortissement en tours en 1/k, le plafond d'achat en k.
    ...(scenario.investment
      ? {
          investment: {
            costPerCapacityUnit: scenario.investment.costPerCapacityUnit / k,
            depreciationRounds: scenario.investment.depreciationRounds / k,
            maxPerRound: scenario.investment.maxPerRound * k,
          },
        }
      : {}),
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
  T extends {
    machineCapacity: number;
    hoursPerEmployee: number;
    loans?: { remaining: number; perRound: number }[];
  },
>(company: T, periodicity: Periodicity): T {
  const k = PERIODICITY_DAYS[periodicity] / 90;
  if (k === 1) return company;
  return {
    ...company,
    machineCapacity: company.machineCapacity * k,
    hoursPerEmployee: company.hoursPerEmployee * k,
    // même dette, même durée réelle : l'échéance PAR TOUR varie en k
    ...(company.loans
      ? { loans: company.loans.map((l) => ({ ...l, perRound: l.perRound * k })) }
      : {}),
  };
}
