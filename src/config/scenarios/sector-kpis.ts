import type {
  CompanyRoundResult,
  EngineScenarioConfig,
  SegmentSalesDetail,
} from "../../engine/types";

/**
 * Indicateurs sectoriels : chaque métier se pilote avec SES chiffres.
 * Un hôtelier lit un RevPAR, un restaurateur un ratio matières, un
 * commerçant un panier moyen. Le compte de résultat est le même partout,
 * mais on ne dirige pas une entreprise avec le compte de résultat seul.
 *
 * Règle de ce module : ne calculer que ce que le moteur produit réellement.
 * Aucun indicateur n'est inventé — quand une donnée manque (pas de tickets
 * de caisse, par exemple), l'hypothèse est explicite et documentée.
 */

export type KpiFormat = "euro" | "percent" | "units" | "days";

export interface SectorKpiContext {
  result: CompanyRoundResult;
  /** Segments du tour PRÉCÉDENT — nécessaire pour mesurer une attrition. */
  previousSegments: Record<string, SegmentSalesDetail> | null;
  /** Unités vendues sur le marché (hors commandes fermes et offre du tour). */
  segmentUnits: number;
  /** Tout ce qui a été vendu — cohérent avec le chiffre d'affaires affiché. */
  totalUnits: number;
  roundDays: number;
  scenario: EngineScenarioConfig;
}

export interface SectorKpiDef {
  key: string;
  label: string;
  /** Ce que l'indicateur dit, en une phrase — affiché sous la valeur. */
  hint: string;
  format: KpiFormat;
  /** null = non calculable ce tour (pas de ventes, pas de tour précédent…). */
  compute: (ctx: SectorKpiContext) => number | null;
}

/** Division protégée : un dénominateur nul rend l'indicateur indisponible. */
const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null;

/** Capacité offerte du tour (déjà dégradée par la disponibilité). */
const offered = (ctx: SectorKpiContext) => ctx.result.production.machineCapacity;

/** Part des matières dans le coût variable, d'après le scénario joué. */
const materialShare = (ctx: SectorKpiContext) => {
  const { materialCostPerUnit, otherVariableCostPerUnit } = ctx.scenario.product;
  const total = materialCostPerUnit + otherVariableCostPerUnit;
  return total > 0 ? materialCostPerUnit / total : 0;
};

/** Part de marché agrégée d'un jeu de segments, pondérée par le potentiel. */
const weightedShare = (
  segments: Record<string, SegmentSalesDetail>,
  codes: string[],
): number | null => {
  let potential = 0;
  let demand = 0;
  for (const code of codes) {
    const s = segments[code];
    if (!s) continue;
    potential += s.potential;
    demand += s.demandForCompany;
  }
  return ratio(demand, potential);
};

/**
 * Attrition : part de la clientèle du segment fidèle perdue depuis le tour
 * précédent. On mesure le recul de la part de marché sur ce segment — pas la
 * variation de la demande, qui bougerait avec la saison sans qu'aucun client
 * ne soit parti.
 */
const attritionOn = (loyalSegments: string[]) => (ctx: SectorKpiContext): number | null => {
  if (!ctx.previousSegments) return null;
  const before = weightedShare(ctx.previousSegments, loyalSegments);
  const now = weightedShare(ctx.result.market.bySegment, loyalSegments);
  if (before === null || now === null || before <= 0) return null;
  return Math.max(0, 1 - now / before);
};

// ---------------------------------------------------------------------------
// INDUSTRIE
// ---------------------------------------------------------------------------

export const INDUSTRIE_KPIS: SectorKpiDef[] = [
  {
    key: "utilisation",
    label: "Taux d'utilisation",
    hint: "Part de la capacité machine réellement employée. Au-delà de 95 %, la qualité se dégrade.",
    format: "percent",
    compute: (ctx) => ctx.result.production.utilizationRate,
  },
  {
    key: "marge_unitaire",
    label: "Marge unitaire",
    hint: "Ce que laisse chaque unité vendue après son coût variable, pour couvrir la structure.",
    format: "euro",
    compute: (ctx) =>
      ratio(ctx.result.incomeStatement.revenue - ctx.result.incomeStatement.cogs, ctx.totalUnits),
  },
  {
    key: "ecoulement_stock",
    label: "Écoulement du stock",
    hint: "Nombre de jours de ventes dormant en stock. Plus c'est long, plus le BFR est lourd.",
    format: "days",
    compute: (ctx) => {
      const r = ratio(ctx.result.balanceSheet.inventoryValue, ctx.result.incomeStatement.cogs);
      return r === null ? null : r * ctx.roundDays;
    },
  },
];

// ---------------------------------------------------------------------------
// HÔTELLERIE — les trois indicateurs universels du métier
// ---------------------------------------------------------------------------

export const HOTELLERIE_KPIS: SectorKpiDef[] = [
  {
    key: "taux_occupation",
    label: "Taux d'occupation",
    hint: "Nuitées vendues sur nuitées offertes. L'indicateur de remplissage : sous le seuil, l'hôtel saigne.",
    format: "percent",
    compute: (ctx) => ratio(ctx.totalUnits, offered(ctx)),
  },
  {
    key: "pmc",
    label: "PMC — prix moyen chambre",
    hint: "Chiffre d'affaires rapporté aux nuitées VENDUES. Ce que paie réellement un client, remises comprises.",
    format: "euro",
    compute: (ctx) => ratio(ctx.result.incomeStatement.revenue, ctx.totalUnits),
  },
  {
    key: "revpar",
    label: "RevPAR",
    hint: "Revenu par chambre DISPONIBLE = PMC × taux d'occupation. Le juge de paix : il sanctionne autant un hôtel vide qu'un hôtel bradé.",
    format: "euro",
    compute: (ctx) => ratio(ctx.result.incomeStatement.revenue, offered(ctx)),
  },
];

// ---------------------------------------------------------------------------
// COMMERCE
// ---------------------------------------------------------------------------

/**
 * Le moteur vend des articles, pas des tickets de caisse. Pour exprimer un
 * panier moyen il faut une hypothèse : on retient 1,6 article par ticket,
 * ordre de grandeur usuel du prêt-à-porter indépendant. L'hypothèse est ici,
 * visible, et non cachée dans un calcul.
 */
const ARTICLES_PAR_TICKET = 1.6;

export const COMMERCE_KPIS: SectorKpiDef[] = [
  {
    key: "panier_moyen",
    label: "Panier moyen",
    hint: `Chiffre d'affaires par ticket de caisse, sur la base de ${ARTICLES_PAR_TICKET.toLocaleString("fr-FR")} article par passage en caisse.`,
    format: "euro",
    compute: (ctx) => ratio(ctx.result.incomeStatement.revenue, ctx.totalUnits / ARTICLES_PAR_TICKET),
  },
  {
    key: "transformation",
    label: "Taux de transformation",
    hint: "Part de la clientèle attirée en boutique qui repart avec un article. Un rayon vide le fait chuter.",
    format: "percent",
    compute: (ctx) => {
      const segments = Object.values(ctx.result.market.bySegment);
      const demand = segments.reduce((sum, s) => sum + s.demandForCompany, 0);
      const sold = segments.reduce((sum, s) => sum + s.sold, 0);
      return ratio(sold, demand);
    },
  },
  {
    key: "attrition",
    label: "Attrition clientèle fidèle",
    hint: "Part de vos clientes fidèles perdue depuis le tour précédent. Reconquérir coûte plus cher que retenir.",
    format: "percent",
    compute: attritionOn(["fideles"]),
  },
];

// ---------------------------------------------------------------------------
// RESTAURATION
// ---------------------------------------------------------------------------

export const RESTAURATION_KPIS: SectorKpiDef[] = [
  {
    key: "ratio_matieres",
    label: "Ratio matières",
    hint: "Part des denrées dans le chiffre d'affaires. L'indicateur roi du métier : la profession vise 28 à 32 %.",
    format: "percent",
    compute: (ctx) =>
      ratio(ctx.result.incomeStatement.cogs * materialShare(ctx), ctx.result.incomeStatement.revenue),
  },
  {
    key: "ticket_moyen",
    label: "Ticket moyen",
    hint: "Chiffre d'affaires par couvert servi. Deux euros de plus par couvert changent l'exercice.",
    format: "euro",
    compute: (ctx) => ratio(ctx.result.incomeStatement.revenue, ctx.totalUnits),
  },
  {
    key: "remplissage",
    label: "Taux de remplissage",
    hint: "Couverts servis sur couverts réalisables. Une salle à moitié vide paie quand même sa brigade.",
    format: "percent",
    compute: (ctx) => ratio(ctx.totalUnits, offered(ctx)),
  },
];

// ---------------------------------------------------------------------------
// SERVICES
// ---------------------------------------------------------------------------

export const SERVICES_KPIS: SectorKpiDef[] = [
  {
    key: "taux_occupation",
    label: "Taux d'occupation",
    hint: "Jours facturés sur jours-consultants disponibles. Dans le conseil, c'est LE pilote du résultat.",
    format: "percent",
    compute: (ctx) => ratio(ctx.totalUnits, ctx.result.production.laborCapacity),
  },
  {
    key: "tjm",
    label: "TJM réalisé",
    hint: "Taux journalier moyen effectivement facturé, remises et missions bradées comprises.",
    format: "euro",
    compute: (ctx) => ratio(ctx.result.incomeStatement.revenue, ctx.totalUnits),
  },
  {
    key: "dso",
    label: "DSO — délai de règlement",
    hint: "Nombre de jours de chiffre d'affaires immobilisés en créances clients. C'est tout le BFR d'un cabinet.",
    format: "days",
    compute: (ctx) => {
      const r = ratio(ctx.result.balanceSheet.receivables, ctx.result.incomeStatement.revenue);
      return r === null ? null : r * ctx.roundDays;
    },
  },
];

/** Calcule les indicateurs d'un secteur, en écartant les non-disponibles. */
export function computeSectorKpis(
  defs: SectorKpiDef[],
  ctx: SectorKpiContext,
): { key: string; label: string; hint: string; format: KpiFormat; value: number }[] {
  return defs.flatMap((def) => {
    const value = def.compute(ctx);
    if (value === null || !Number.isFinite(value)) return [];
    return [{ key: def.key, label: def.label, hint: def.hint, format: def.format, value }];
  });
}
