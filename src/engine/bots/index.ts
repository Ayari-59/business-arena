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

/**
 * La gestion neutre du secteur joué.
 *
 * Deux usages, et un seul calcul : ce que le formulaire propose à l'élève au
 * tour 1, et ce que joue une équipe qui n'a rien rendu. Les deux étaient figés
 * sur NOVA, un fabricant d'enceintes à 59 €, quel que soit le métier. Une
 * équipe absente d'un cabinet de conseil se voyait donc facturer la journée
 * 59 € et planifier 4 800 jours pour une capacité de 720 : pas une
 * reconduction, une faillite.
 *
 * Le profil « balanced » calculait déjà exactement cela, secteur par secteur,
 * depuis le premier jour : le prix de référence du segment dominant et des
 * budgets proportionnels aux échelles du scénario. Les concurrents pilotés
 * s'adaptaient à chaque métier ; seul le joueur humain ne le faisait pas.
 */
export function neutralDecisions(ctx: BotContext): RoundDecisions {
  return botDecisions("balanced", ctx);
}

/** Décisions financières, RH, investissement et trésorerie par profil. */
function enrichDecisions(
  profile: BotProfile,
  ctx: BotContext,
  base: RoundDecisions,
): RoundDecisions {
  const s = ctx.scenario;

  if (s.hr) {
    const hrConfig = s.hr;
    switch (profile) {
      case "passive":
        base.hr = { salaryIndex: 1 };
        break;
      case "price_aggressive":
        base.hr = { salaryIndex: 0.9, trainingBudget: 0 };
        break;
      case "premium":
        base.hr = {
          salaryIndex: 1.15,
          trainingBudget: hrConfig.trainingScale * 0.6,
        };
        break;
      case "balanced":
        base.hr = { salaryIndex: 1.0, trainingBudget: hrConfig.trainingScale * 0.3 };
        break;
      case "growth": {
        const cap = capacity(ctx);
        const laborHours = ctx.state.headcount * ctx.state.hoursPerEmployee * ctx.state.productivity;
        const laborCapacity = s.product.hoursPerUnit > 0 ? laborHours / s.product.hoursPerUnit : Infinity;
        const laborBottleneck = laborCapacity < cap * 0.9;
        base.hr = {
          salaryIndex: 1.05,
          trainingBudget: hrConfig.trainingScale * 0.4,
          hire: laborBottleneck ? Math.min(2, hrConfig.maxHiresPerRound) : 0,
        };
        break;
      }
    }
  }

  if (s.insurance) {
    const ins = s.insurance;
    const formulas = ins.formulas ??
      [{ code: "default", name: "", premiumPerRound: ins.premiumPerRound, coveredEventCodes: ins.coveredEventCodes }];
    const first = formulas[0];
    const last = formulas[formulas.length - 1];
    switch (profile) {
      case "passive":
        break;
      case "price_aggressive":
        if (first) base.insurance = first.code;
        break;
      case "premium":
        if (last) base.insurance = last.code;
        break;
      case "balanced":
        if (first) base.insurance = first.code;
        break;
      case "growth":
        if (first) base.insurance = first.code;
        break;
    }
  }

  if (s.suppliers && s.suppliers.length > 0) {
    const suppliers = s.suppliers;
    switch (profile) {
      case "passive":
        break;
      case "price_aggressive": {
        const cheapest = [...suppliers].sort((a, b) => a.costMultiplier - b.costMultiplier)[0]!;
        base.supplierChoice = cheapest.code;
        break;
      }
      case "premium": {
        const best = [...suppliers].sort((a, b) => b.qualityBonus - a.qualityBonus)[0]!;
        base.supplierChoice = best.code;
        break;
      }
      case "balanced":
        break;
      case "growth": {
        const cheapest = [...suppliers].sort((a, b) => a.costMultiplier - b.costMultiplier)[0]!;
        base.supplierChoice = cheapest.code;
        break;
      }
    }
  }

  if (s.investment && profile === "growth" && ctx.roundIndex >= 2) {
    const machCap = ctx.state.machineCapacity * ctx.state.availability;
    const utilization = ctx.lastSoldUnits !== undefined
      ? ctx.lastSoldUnits / Math.max(1, machCap)
      : 0.65;
    if (utilization > 0.85) {
      base.investment = { machineCapacityUnits: Math.min(2, s.investment.maxPerRound) };
    }
  }

  if (s.finance) {
    const dur = s.finance.loanDurationRounds ?? 0;
    switch (profile) {
      case "passive":
        break;
      case "balanced":
      case "premium":
        if (ctx.state.finance.overdraft > 0 && dur > 0) {
          base.finance = { newLoan: Math.min(ctx.state.finance.overdraft, 50000) };
        }
        break;
      case "growth":
        if (dur > 0 && ctx.roundIndex <= 3) {
          base.finance = { newLoan: 30000 };
        }
        break;
      default:
        break;
    }
  }

  if (s.treasury?.placementAnnualRate && s.treasury.placementAnnualRate > 0) {
    if (profile === "balanced" || profile === "premium") {
      const cash = ctx.state.finance.cash;
      if (cash > 50000) {
        base.treasury = { placement: Math.floor((cash - 30000) * 0.5) };
      }
    }
  }

  return base;
}

export function botDecisions(profile: BotProfile, ctx: BotContext): RoundDecisions {
  const ref = mainRefPrice(ctx.scenario);
  const maintenance = ctx.scenario.production.maintenanceReference;
  const mkt = ctx.scenario.marketing.scale;
  const qual = ctx.scenario.production.qualityScale;
  let base: RoundDecisions;
  switch (profile) {
    case "passive":
      base = {
        price: ref,
        productionPlan: capacity(ctx) * 0.6,
        marketingBudget: 0,
        qualityBudget: 0,
        maintenanceBudget: maintenance * 0.5,
      };
      break;
    case "price_aggressive":
      base = {
        price: ref * 0.88,
        productionPlan: adaptivePlan(ctx, 1.15),
        marketingBudget: 0.75 * mkt,
        qualityBudget: 0,
        maintenanceBudget: maintenance,
      };
      break;
    case "premium":
      base = {
        price: ref * 1.3,
        productionPlan: adaptivePlan(ctx, 1.0),
        marketingBudget: 0.5 * mkt,
        qualityBudget: 1.5 * qual,
        maintenanceBudget: maintenance,
      };
      break;
    case "balanced":
      base = {
        price: ref,
        productionPlan: adaptivePlan(ctx, 1.05),
        marketingBudget: 0.5 * mkt,
        qualityBudget: 0.5 * qual,
        maintenanceBudget: maintenance,
      };
      break;
    case "growth":
      base = {
        price: ref * 0.95,
        productionPlan: adaptivePlan(ctx, 1.25),
        marketingBudget: (7 / 6) * mkt,
        qualityBudget: 0.5 * qual,
        maintenanceBudget: maintenance,
      };
      break;
  }
  if (ctx.scenario.enrichedBots) return enrichDecisions(profile, ctx, base);
  return base;
}
