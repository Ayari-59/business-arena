import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "../types";

/**
 * Bots de stratégie (ADR-03) : générateurs de décisions PURS et déterministes.
 * Le moteur de marché ne distingue pas humains et bots — ces profils servent
 * de concurrents en solo, de stratégies de calibration (doc 07 §4) et de
 * remplaçants en cas d'équipe absente.
 */

export type BotProfile =
  | "passive" // reconduit une gestion neutre, n'adapte rien
  | "price_aggressive" // casse les prix, gros volumes (SoundBox)
  | "premium" // prix haut, qualité soignée (Auris)
  | "balanced" // équilibré, adapte la production aux ventes
  | "growth"; // pousse volume + marketing (stratégie de croissance)

export interface BotContext {
  scenario: EngineScenarioConfig;
  state: CompanyState;
  roundIndex: number;
  /** Unités vendues au tour précédent (undefined au tour 1). */
  lastSoldUnits?: number;
}

/** Segment dominant (plus grosse demande de base) — sert de référence de prix. */
function mainRefPrice(scenario: EngineScenarioConfig): number {
  const main = [...scenario.market.segments].sort((a, b) => b.size - a.size)[0];
  return main ? main.refPrice : 50;
}

function capacity(ctx: BotContext): number {
  const machine = ctx.state.machineCapacity * ctx.state.availability;
  const labor =
    (ctx.state.headcount * ctx.state.hoursPerEmployee * ctx.state.productivity) /
    ctx.scenario.product.hoursPerUnit;
  return Math.min(machine, labor);
}

/** Anticipation saisonnière : produire avant le pic (ratio saison à venir / saison courante). */
function seasonalFactor(ctx: BotContext): number {
  const season = ctx.scenario.market.seasonality;
  const current = season[ctx.roundIndex - 1] ?? 1;
  const next = season[ctx.roundIndex] ?? current;
  return Math.min(1.4, Math.max(0.8, current > 0 ? next / current : 1));
}

/** Plan de production : viser les ventes passées ajustées de la saison, sans gonfler le stock. */
function adaptivePlan(ctx: BotContext, aggressiveness: number): number {
  const cap = capacity(ctx);
  const stock = ctx.state.finishedGoods.quantity;
  const base =
    ctx.lastSoldUnits !== undefined
      ? ctx.lastSoldUnits * aggressiveness
      : cap * 0.65 * aggressiveness;
  const target = base * seasonalFactor(ctx);
  return Math.max(0, Math.min(cap, target - stock * 0.5));
}

export function botDecisions(profile: BotProfile, ctx: BotContext): RoundDecisions {
  const ref = mainRefPrice(ctx.scenario);
  const maintenance = ctx.scenario.production.maintenanceReference;
  // budgets exprimés relativement aux échelles du scénario : les bots
  // s'adaptent ainsi à la périodicité du tour (ADR-01) et à tout scénario
  const mkt = ctx.scenario.marketing.scale;
  const qual = ctx.scenario.production.qualityScale;
  switch (profile) {
    case "passive":
      return {
        price: ref,
        productionPlan: capacity(ctx) * 0.6,
        marketingBudget: 0,
        qualityBudget: 0,
        maintenanceBudget: maintenance * 0.5,
      };
    case "price_aggressive":
      return {
        price: ref * 0.88,
        productionPlan: adaptivePlan(ctx, 1.15),
        marketingBudget: 0.75 * mkt,
        qualityBudget: 0,
        maintenanceBudget: maintenance,
      };
    case "premium":
      return {
        price: ref * 1.3,
        productionPlan: adaptivePlan(ctx, 1.0),
        marketingBudget: 0.5 * mkt,
        qualityBudget: 1.5 * qual,
        maintenanceBudget: maintenance,
      };
    case "balanced":
      return {
        price: ref * 1.0, // 59 € : juste sous le seuil psychologique des 60 €
        productionPlan: adaptivePlan(ctx, 1.05),
        marketingBudget: 0.5 * mkt,
        qualityBudget: 0.5 * qual,
        maintenanceBudget: maintenance,
      };
    case "growth":
      return {
        price: ref * 0.95,
        productionPlan: adaptivePlan(ctx, 1.25),
        marketingBudget: (7 / 6) * mkt,
        qualityBudget: 0.5 * qual,
        maintenanceBudget: maintenance,
      };
  }
}
