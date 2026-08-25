import type {
  CompanyRoundResult,
  CompanyState,
  SegmentSalesDetail,
  SimulationInput,
  SimulationOutput,
} from "../types";
import { createRng, deriveRoundSeed } from "../random";
import { computePotentialDemand } from "../market/demand";
import { attractionScore } from "../market/attraction";
import { allocateShares } from "../market/allocation";
import {
  computeProducedQuality,
  computeProduction,
  updateAvailability,
  updatePerceivedQuality,
} from "../production";
import { addToStock, removeFromStock, stockValue } from "../inventory/cump";
import { unitVariableCost } from "../costs";
import { computeBreakeven } from "../costs/breakeven";
import { balanceGap, computeFinance } from "../finance/statements";
import { computeFunctionalBalance } from "../finance/functional";
import { computeRatios } from "../finance/ratios";
import {
  demandMultiplierFor,
  drawEvents,
  effectiveModifiers,
  tickEvents,
} from "../events";

export const ENGINE_VERSION = "0.1.0";

/**
 * Résolution d'un tour (doc 02 §2). Fonction PURE et DÉTERMINISTE :
 * aucune E/S, aucun aléa hors PRNG seedé, mêmes entrées ⇒ mêmes sorties.
 * Pipeline : événements → production → stocks → marché → finance → état.
 */
export function simulateRound(input: SimulationInput): SimulationOutput {
  const { scenario, roundIndex } = input;
  const rng = createRng(deriveRoundSeed(input.seed, roundIndex));

  // 1. Événements : tirage + poursuite des événements actifs (doc 02 §7).
  const { active, drawn } = drawEvents(
    scenario,
    roundIndex,
    input.companies,
    input.activeEvents,
    rng,
  );
  const marketMods = effectiveModifiers(
    active.filter((e) => e.scope === "market"),
    "",
  );

  // 2. Demande potentielle du marché par segment (doc 02 §3.1).
  const potentialBySegment: Record<string, number> = {};
  for (const segment of scenario.market.segments) {
    potentialBySegment[segment.code] = computePotentialDemand(
      segment,
      roundIndex,
      scenario.market.seasonality,
      demandMultiplierFor(marketMods, segment.code),
    );
  }

  // 3. Production, qualité et stock disponible par entreprise (doc 02 §4-5).
  interface Working {
    state: CompanyState;
    decisions: Required<Pick<import("../types").RoundDecisions, "price" | "productionPlan" | "marketingBudget" | "qualityBudget" | "maintenanceBudget">> &
      import("../types").RoundDecisions;
    produced: number;
    machineCapacity: number;
    laborCapacity: number;
    utilizationRate: number;
    producedQuality: number;
    unitCost: number;
    stock: { quantity: number; unitCost: number };
    materialMultiplier: number;
  }

  const working: Working[] = input.companies.map((state) => {
    const raw = input.decisions[state.id];
    if (!raw) throw new Error(`Décisions manquantes pour ${state.id} (ADR-04 : reconduire en amont)`);
    const decisions = {
      price: raw.price,
      productionPlan: Math.max(0, raw.productionPlan),
      marketingBudget: Math.max(0, raw.marketingBudget),
      qualityBudget: Math.max(0, raw.qualityBudget),
      maintenanceBudget: Math.max(0, raw.maintenanceBudget),
      finance: raw.finance,
      forecast: raw.forecast,
    };
    const mods = effectiveModifiers(active, state.id);
    const production = computeProduction({
      planned: decisions.productionPlan,
      machineCapacity: state.machineCapacity,
      availability: state.availability * mods.availabilityMultiplier,
      headcount: state.headcount,
      hoursPerEmployee: state.hoursPerEmployee,
      productivity: state.productivity,
      hoursPerUnit: scenario.product.hoursPerUnit,
    });
    const producedQuality = computeProducedQuality({
      qualityBudget: decisions.qualityBudget,
      qualitySensitivity: scenario.production.qualitySensitivity,
      qualityScale: scenario.production.qualityScale,
      utilizationRate: production.utilizationRate,
    });
    const materialMultiplier = mods.materialCostMultiplier;
    const unitCost = unitVariableCost(
      scenario.product.materialCostPerUnit * materialMultiplier,
      scenario.product.otherVariableCostPerUnit,
    );
    const stock = addToStock(state.finishedGoods, production.produced, unitCost);
    return {
      state,
      decisions,
      produced: production.produced,
      machineCapacity: production.machineCapacity,
      laborCapacity: production.laborCapacity,
      utilizationRate: production.utilizationRate,
      producedQuality,
      unitCost,
      stock,
      materialMultiplier,
    };
  });

  // 4. Marché : attraction → parts → demande adressée → ventes contraintes
  //    par le stock (doc 02 §3.2-3.4).
  const salesBySegment = new Map<string, SegmentSalesDetail[]>();
  for (const segment of scenario.market.segments) {
    const attractions = working.map((w) =>
      attractionScore({
        price: w.decisions.price,
        marketingBudget: w.decisions.marketingBudget,
        perceivedQuality: w.state.perceivedQuality,
        lastShare: w.state.lastMarketShare[segment.code] ?? 0,
        segment,
        marketingScale: scenario.marketing.scale,
      }),
    );
    const shares = allocateShares(
      attractions,
      segment.competitionIntensity ?? scenario.market.competitionIntensity,
      scenario.market.outsideAttraction,
    );
    const potential = potentialBySegment[segment.code] ?? 0;
    salesBySegment.set(
      segment.code,
      working.map((_, i) => ({
        potential,
        attraction: attractions[i] ?? 0,
        share: shares[i] ?? 0,
        demandForCompany: potential * (shares[i] ?? 0),
        sold: 0,
        lost: 0,
      })),
    );
  }

  // Contrainte de stock : ventes limitées au stock, réparties au prorata des segments.
  working.forEach((w, i) => {
    const demands = scenario.market.segments.map(
      (s) => salesBySegment.get(s.code)?.[i]?.demandForCompany ?? 0,
    );
    const totalDemand = demands.reduce((a, b) => a + b, 0);
    const available = w.stock.quantity;
    const serviceRate = totalDemand > 0 ? Math.min(1, available / totalDemand) : 0;
    scenario.market.segments.forEach((s) => {
      const detail = salesBySegment.get(s.code)?.[i];
      if (!detail) return;
      detail.sold = detail.demandForCompany * serviceRate;
      detail.lost = detail.demandForCompany - detail.sold;
    });
  });

  // 5-6. Finance et nouvel état par entreprise (doc 02 §6).
  const results: Record<string, CompanyRoundResult> = {};
  const nextCompanies: CompanyState[] = [];
  let totalSold = 0;
  const totalPotential = Object.values(potentialBySegment).reduce((a, b) => a + b, 0);

  working.forEach((w, i) => {
    const perSegment: Record<string, SegmentSalesDetail> = {};
    let soldUnits = 0;
    let weightedCredit = 0;
    for (const segment of scenario.market.segments) {
      const detail = salesBySegment.get(segment.code)?.[i];
      if (!detail) continue;
      perSegment[segment.code] = detail;
      soldUnits += detail.sold;
      weightedCredit +=
        detail.sold * Math.min(1, segment.paymentDelayDays / scenario.roundDays);
    }
    const revenue = soldUnits * w.decisions.price;
    const receivableRatio = soldUnits > 0 ? weightedCredit / soldUnits : 0;

    const { stock: stockAfterSales, cost: cogs } = removeFromStock(w.stock, soldUnits);
    const inventoryChange = stockValue(stockAfterSales) - stockValue(w.state.finishedGoods);
    const purchases =
      w.produced * scenario.product.materialCostPerUnit * w.materialMultiplier;
    const otherVariableCash = w.produced * scenario.product.otherVariableCostPerUnit;

    const finance = computeFinance({
      opening: w.state.finance,
      roundDays: scenario.roundDays,
      revenue,
      receivableRatio,
      purchases,
      payableRatio: Math.min(1, scenario.finance.supplierPaymentDelayDays / scenario.roundDays),
      otherVariableCash,
      inventoryChange,
      cogs,
      marketingCost: w.decisions.marketingBudget,
      qualityCost: w.decisions.qualityBudget,
      maintenanceCost: w.decisions.maintenanceBudget,
      fixedCosts: scenario.fixedCostsPerRound,
      depreciation: scenario.finance.depreciationPerRound,
      loanAnnualRate: scenario.finance.loanAnnualRate,
      overdraftAnnualRate: scenario.finance.overdraftAnnualRate,
      interestMultiplier: effectiveModifiers(active, w.state.id).interestMultiplier,
      taxRate: scenario.finance.taxRate,
      newLoan: w.decisions.finance?.newLoan ?? 0,
      loanRepayment: w.decisions.finance?.loanRepayment ?? 0,
    });

    const gap = balanceGap(finance.closing);
    if (Math.abs(gap) > 0.01) {
      throw new Error(`Bilan déséquilibré (${gap.toFixed(4)} €) pour ${w.state.id}`);
    }

    const functionalBalance = computeFunctionalBalance(finance.closing);
    const ratios = computeRatios(
      finance.incomeStatement,
      finance.closing,
      scenario.finance.taxRate,
    );
    // Seuil : charges de structure du tour = fixes + amortissements + budgets discrétionnaires.
    const structureCosts =
      scenario.fixedCostsPerRound +
      finance.incomeStatement.depreciation +
      w.decisions.marketingBudget +
      w.decisions.qualityBudget +
      w.decisions.maintenanceBudget;
    const breakeven = computeBreakeven({
      fixedCosts: structureCosts,
      price: w.decisions.price,
      uvc: w.unitCost,
      revenue,
    });

    const totalShare = totalPotential > 0 ? soldUnits / totalPotential : 0;
    totalSold += soldUnits;

    results[w.state.id] = {
      companyId: w.state.id,
      incomeStatement: finance.incomeStatement,
      balanceSheet: finance.closing,
      cashFlow: finance.cashFlow,
      functionalBalance,
      ratios,
      market: { bySegment: perSegment, totalShare },
      production: {
        planned: w.decisions.productionPlan,
        produced: w.produced,
        machineCapacity: w.machineCapacity,
        laborCapacity: w.laborCapacity,
        utilizationRate: w.utilizationRate,
        producedQuality: w.producedQuality,
      },
      breakeven,
      kpis: {
        revenue,
        net_income: finance.incomeStatement.netIncome,
        cash: finance.closing.cash,
        net_treasury: functionalBalance.netTreasury,
        frng: functionalBalance.frng,
        bfr: functionalBalance.bfr,
        inventory_value: finance.closing.inventoryValue,
        receivables: finance.closing.receivables,
        payables: finance.closing.payables,
        market_share: totalShare,
        utilization_rate: w.utilizationRate,
        break_even_units: breakeven.breakEvenUnits,
        safety_margin: breakeven.safetyMargin,
        roe: ratios.returnOnEquity,
        roce: ratios.returnOnCapitalEmployed,
      },
    };

    const lastMarketShare: Record<string, number> = {};
    for (const segment of scenario.market.segments) {
      lastMarketShare[segment.code] = perSegment[segment.code]?.share ?? 0;
    }
    nextCompanies.push({
      ...w.state,
      perceivedQuality: updatePerceivedQuality(
        w.state.perceivedQuality,
        w.producedQuality,
        scenario.production.qualityInertia,
      ),
      availability: updateAvailability({
        current: w.state.availability,
        maintenanceBudget: w.decisions.maintenanceBudget,
        maintenanceReference: scenario.production.maintenanceReference,
        availabilityDecay: scenario.production.availabilityDecay,
      }),
      finishedGoods: stockAfterSales,
      finance: finance.closing,
      lastMarketShare,
    });
  });

  return {
    companies: nextCompanies,
    results,
    market: { potentialBySegment, totalSold },
    events: tickEvents(active),
    newEvents: drawn,
  };
}
