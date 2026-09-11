import { computePotentialDemand } from "../market/demand";
import type {
  CompanyState,
  EngineScenarioConfig,
  EquipmentTypeDef,
  ProductCode,
  ProductDecisions,
  RoundDecisions,
  CommunicationAxis,
} from "../types";
import { fleetMaintenanceMultiplier } from "../simulation";
import { isMultiProduct, isProductAvailable, rdOpeningOf, toGamme, type GammeProduct } from "../gamme";
import type { SupplierDef } from "../types";

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

/**
 * Personnalité d'un bot (V1-4) : module la réaction aux prix, orthogonale à la
 * stratégie (passive/premium…). Tirée de façon déterministe à la graine de la
 * partie, montrée à l'enseignant seul.
 */
export type BotPersonality = "prudent" | "suiveur" | "agressif";

export const BOT_PERSONALITIES: BotPersonality[] = ["prudent", "suiveur", "agressif"];

export const PERSONALITY_LABELS: Record<BotPersonality, string> = {
  prudent: "Prudent",
  suiveur: "Suiveur",
  agressif: "Agressif",
};

/**
 * Coefficients de réaction au prix : `down` quand l'humain casse les prix,
 * `up` quand il monte ; `cvFloor` est le multiple du coût variable sous lequel
 * le bot ne descend jamais. « suiveur » est la réaction par défaut (moitié de
 * l'écart à la baisse, 30 % à la hausse, plancher coût variable + 15 %).
 */
const PERSONALITY_REACTION: Record<BotPersonality, { down: number; up: number; cvFloor: number }> = {
  prudent: { down: 0.25, up: 0.15, cvFloor: 1.25 },
  suiveur: { down: 0.5, up: 0.3, cvFloor: 1.15 },
  agressif: { down: 0.8, up: 0.1, cvFloor: 1.1 },
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

/**
 * Personnalité d'un bot, tirée de façon déterministe de la graine de partie et
 * de sa stratégie : identique pour toute partie de même graine (anti-triche,
 * reproductible), sans champ à stocker.
 */
export function botPersonalityFromSeed(seed: number, botProfile: string): BotPersonality {
  const idx = (((seed >>> 0) ^ hashStr(botProfile)) >>> 0) % BOT_PERSONALITIES.length;
  return BOT_PERSONALITIES[idx]!;
}

/** Coût variable par unité (matières + autres coûts variables). */
export function variableCostPerUnit(scenario: EngineScenarioConfig): number {
  return scenario.product.materialCostPerUnit + scenario.product.otherVariableCostPerUnit;
}

export interface BotContext {
  scenario: EngineScenarioConfig;
  state: CompanyState;
  roundIndex: number;
  /** Unités vendues au tour précédent (undefined au tour 1). */
  lastSoldUnits?: number;
  /**
   * Gamme : unités vendues par produit au tour précédent (cf. soldByProduct).
   * Sans lui, le bot répartit son plan sur la demande de base de chaque
   * produit ; avec lui, il suit ses ventes référence par référence.
   */
  lastSoldByProduct?: Record<ProductCode, number>;
  /** Prix moyen des équipes humaines au tour précédent (undefined si aucune / au T1). */
  humanAvgPrice?: number;
  /** Personnalité du bot (défaut « suiveur »). */
  personality?: BotPersonality;
}

/**
 * Réaction au prix moyen humain (V1-4). L'humain casse les prix (plus de 5 %
 * sous le bot) → le bot baisse d'une fraction de l'écart, jamais sous son coût
 * variable planchonné ; l'humain vend plus cher → le bot monte d'une fraction.
 * Aucune lecture des cartes marché : le bot les subit comme tout le monde.
 */
function reactToHumanPrice(price: number, ctx: BotContext): number {
  if (ctx.humanAvgPrice === undefined || ctx.humanAvgPrice <= 0) return price;
  const react = PERSONALITY_REACTION[ctx.personality ?? "suiveur"];
  const diff = ctx.humanAvgPrice - price;
  const seuil = 0.05 * price;
  if (diff < -seuil) {
    const plancher = variableCostPerUnit(ctx.scenario) * react.cvFloor;
    return Math.max(plancher, price + react.down * diff);
  }
  if (diff > seuil) return price + react.up * diff;
  return price;
}

/**
 * Garde-fou financier (V1-4) : le bot ne dépense pas au-delà de sa trésorerie
 * d'ouverture + son découvert autorisé, et ne produit pas au-delà de sa
 * capacité ni de la demande prévue × 1,2. Ce qui a fait plonger SoundBox à
 * −30 900 € : un plan de production démesuré, sans garde-fou de caisse.
 */
function applyFinancialGuardRail(base: RoundDecisions, ctx: BotContext): void {
  // Production : bornée par la capacité et la demande prévue × 1,2 (la demande
  // prévue est l'écoulement du tour précédent ; au T1, la seule capacité). C'est
  // ce qui empêche le plan démesuré qui a fait plonger SoundBox.
  const cap = capacity(ctx);
  const forecast = ctx.lastSoldUnits !== undefined ? ctx.lastSoldUnits * 1.2 : cap;
  base.productionPlan = Math.max(0, Math.min(base.productionPlan, cap, forecast));

  // Dépenses discrétionnaires (marketing, qualité, maintenance) : pas au-delà de
  // la trésorerie d'ouverture + le découvert autorisé. La production, elle, est
  // financée par le cycle (les ventes), pas mise en regard de la seule caisse.
  const envelope = ctx.state.finance.cash + ctx.scenario.finance.overdraftLimit;
  // Le budget de marque (communication) est dérivé du marketing APRÈS ce
  // garde-fou : il en fait partie, il n'est pas à compter deux fois.
  const discretionnaire =
    (base.marketingBudget ?? 0) +
    (base.qualityBudget ?? 0) +
    (base.maintenanceBudget ?? 0) +
    (base.rdBudget ?? 0);
  if (discretionnaire > envelope && discretionnaire > 0) {
    const k = Math.max(0, envelope) / discretionnaire;
    base.marketingBudget = (base.marketingBudget ?? 0) * k;
    base.qualityBudget = (base.qualityBudget ?? 0) * k;
    if (base.rdBudget !== undefined) base.rdBudget = base.rdBudget * k;
    base.maintenanceBudget = (base.maintenanceBudget ?? 0) * k;
  }
}

/** Segment dominant (plus grosse demande de base) — sert de référence de prix. */
function mainRefPrice(scenario: EngineScenarioConfig): number {
  // Abonnement : le prix que le portefeuille juge normal est la référence —
  // c'est lui qui retient ou fait partir les adhérents.
  if (scenario.subscription) return scenario.subscription.refPrice;
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
  return seasonalRatio(ctx.scenario.market.seasonality, ctx.roundIndex, 0.8, 1.4);
}

function seasonalRatio(season: number[], roundIndex: number, floor: number, ceil: number): number {
  const current = season[roundIndex - 1] ?? 1;
  const next = season[roundIndex] ?? current;
  return Math.min(ceil, Math.max(floor, current > 0 ? next / current : 1));
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
  // Abonnement : une salle prévoit la place de ses adhérents qui restent —
  // on ne met pas dehors ceux qui ont payé — plus la part visée des nouveaux
  // que la saison amène, à son tempérament. Sans le modèle : expression
  // historique.
  const sub = ctx.scenario.subscription;
  if (sub) {
    const retained = (ctx.state.members ?? 0) * (1 - sub.baseChurnRate);
    const potential = ctx.scenario.market.segments.reduce(
      (sum, segment) =>
        sum + computePotentialDemand(segment, ctx.roundIndex, ctx.scenario.market.seasonality, 1),
      0,
    );
    const share = ctx.scenario.scoring.benchmarks.marketShareTarget;
    return Math.max(0, Math.min(cap, retained + potential * share * aggressiveness));
  }
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
    const choice = pickSupplier(profile, s.suppliers);
    if (choice !== undefined) base.supplierChoice = choice;
  }

  if (s.equipment && ctx.roundIndex >= 2) {
    const machCap = ctx.state.machineCapacity * ctx.state.availability;
    const utilization = ctx.lastSoldUnits !== undefined
      ? ctx.lastSoldUnits / Math.max(1, machCap)
      : 0.65;
    if (profile === "growth" && utilization > 0.85) {
      const sorted = [...s.equipment.types].sort((a, b) => a.costPerUnit - b.costPerUnit);
      const pick = sorted[Math.min(1, sorted.length - 1)]!;
      base.investment = { equipmentBuy: [{ typeCode: pick.code, quantity: 1 }] };
    } else if (profile === "premium" && utilization > 0.9) {
      const best = [...s.equipment.types].sort((a, b) => b.capacityPerUnit - a.capacityPerUnit)[0]!;
      base.investment = { equipmentBuy: [{ typeCode: best.code, quantity: 1 }] };
    } else if (profile === "price_aggressive" && utilization > 0.9) {
      const cheapest = [...s.equipment.types].sort((a, b) => a.costPerUnit - b.costPerUnit)[0]!;
      base.investment = { equipmentBuy: [{ typeCode: cheapest.code, quantity: 1 }] };
    }
  } else if (s.investment && profile === "growth" && ctx.roundIndex >= 2) {
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

/**
 * Le fournisseur qu'un profil choisit dans un catalogue : le moins cher pour
 * les profils agressif et croissance, le mieux-disant qualité pour le premium,
 * aucun choix (le fournisseur de référence) pour les autres.
 */
function pickSupplier(profile: BotProfile, suppliers: SupplierDef[]): string | undefined {
  switch (profile) {
    case "price_aggressive":
    case "growth":
      return [...suppliers].sort((a, b) => a.costMultiplier - b.costMultiplier)[0]!.code;
    case "premium":
      return [...suppliers].sort((a, b) => b.qualityBonus - a.qualityBonus)[0]!.code;
    case "passive":
    case "balanced":
      return undefined;
  }
}

/**
 * Gamme : unités vendues par produit, à partir du détail par segment d'un
 * résultat (chaque segment appartient à un seul produit). `undefined` en
 * mono-produit, où le bot n'a pas besoin de cette lecture.
 */
export function soldByProduct(
  scenario: EngineScenarioConfig,
  bySegment: Record<string, { sold: number }>,
): Record<ProductCode, number> | undefined {
  if (!isMultiProduct(scenario)) return undefined;
  const out: Record<ProductCode, number> = {};
  for (const p of toGamme(scenario)) {
    out[p.code] = p.market.segments.reduce((sum, s) => sum + (bySegment[s.code]?.sold ?? 0), 0);
  }
  return out;
}

const AGGRESSIVENESS: Record<BotProfile, number> = {
  passive: 0.6,
  price_aggressive: 1.15,
  premium: 1.0,
  balanced: 1.05,
  growth: 1.25,
};

/** Prix de référence d'un produit : celui du segment dominant de SON marché. */
function productRefPrice(p: GammeProduct): number {
  const main = [...p.market.segments].sort((a, b) => b.size - a.size)[0];
  return main ? main.refPrice : 50;
}

/**
 * Les décisions par produit d'un bot qui joue une gamme.
 *
 * Le bot garde sa stratégie (profil, réaction au prix humain, garde-fou) mais
 * la décline référence par référence : le prix de chaque produit est celui de
 * son segment dominant, affecté du MÊME rapport que le prix scalaire porte au
 * prix de référence du scénario (un bot agressif l'est sur toute la gamme, et
 * la réaction au prix humain se propage), sans jamais descendre sous le coût
 * variable du produit ; le plan suit les ventes passées de chaque produit,
 * anticipe SA saisonnalité et déduit SON stock, puis la somme est ramenée à la
 * capacité partagée ; le marketing se répartit au prorata des marchés.
 */
function gammeDecisions(
  profile: BotProfile,
  ctx: BotContext,
  base: RoundDecisions,
): Record<ProductCode, ProductDecisions> {
  const gamme = toGamme(ctx.scenario);
  const ref = mainRefPrice(ctx.scenario);
  const priceRatio = ref > 0 ? base.price / ref : 1;

  const sizes = gamme.map((p) => p.market.segments.reduce((sum, s) => sum + s.size, 0));
  const totalSize = sizes.reduce((a, b) => a + b, 0);
  const weights = sizes.map((s) => (totalSize > 0 ? s / totalSize : 1 / gamme.length));

  const machineCap = ctx.state.machineCapacity * ctx.state.availability;
  const laborHours = ctx.state.headcount * ctx.state.hoursPerEmployee * ctx.state.productivity;
  const meanHours = gamme.reduce((sum, p, k) => sum + p.hoursPerUnit * weights[k]!, 0);
  const cap = Math.min(machineCap, meanHours > 0 ? laborHours / meanHours : Infinity);
  const aggressiveness = AGGRESSIVENESS[profile];

  // R&D (levier `rd`) : une référence en développement ne se produit ni ne se
  // vend ; le bot ne lui met ni plan, ni marketing, ni qualité — seulement la
  // R&D qui la fera naître, selon son profil.
  const available = gamme.map((p) =>
    isProductAvailable(p, rdOpeningOf(ctx.scenario, ctx.state, p.code), ctx.roundIndex),
  );
  // Le poids d'une référence en développement se reporte sur les autres : le
  // bot répartit son atelier et son marketing entre ce qu'il peut vendre.
  const aliveTotal = weights.reduce((sum, w, k) => sum + (available[k] ? w : 0), 0);
  const weightsAlive = weights.map((w, k) =>
    available[k] ? (aliveTotal > 0 ? w / aliveTotal : 1 / gamme.length) : 0,
  );
  const targets = gamme.map((p, k) => {
    if (!available[k]) return 0;
    if (profile === "passive") return cap * aggressiveness * weightsAlive[k]!;
    const stock = ctx.state.finishedGoodsByProduct?.[p.code]?.quantity ?? 0;
    // Zéro vente au tour passé n'est pas une information : la référence
    // n'était pas encore lancée, ou n'a rien vendu — on repart du marché.
    const lastSold = ctx.lastSoldByProduct?.[p.code];
    const basis = lastSold ? lastSold * aggressiveness : cap * 0.65 * aggressiveness * weightsAlive[k]!;
    // Les accessoires d'une gamme peuvent doubler d'un tour à l'autre : la
    // fourchette d'anticipation est plus large qu'en mono-produit.
    const season = seasonalRatio(p.market.seasonality, ctx.roundIndex, 0.5, 2);
    return Math.max(0, basis * season - stock * 0.5);
  });
  const total = targets.reduce((a, b) => a + b, 0);
  // Capacité partagée : la même coupe proportionnelle que le moteur. Et le
  // garde-fou de caisse mono-produit (pas plus de 1,2 fois les ventes passées)
  // devient 1,6 fois : une gamme saisonnière varie davantage qu'un produit.
  const ceiling = Math.min(cap, ctx.lastSoldUnits !== undefined ? ctx.lastSoldUnits * 1.6 : cap);
  const cut = total > ceiling && total > 0 ? ceiling / total : 1;

  // La qualité suit le plan : une référence qui pèse deux fois plus dans la
  // production reçoit deux fois plus de budget qualité (à défaut de plan, au
  // prorata des marchés). Le fournisseur suit la même règle de profil sur
  // toute la gamme, appliquée au catalogue de chaque référence quand elle a
  // le sien (le moins cher partout, le mieux-disant partout).
  const planTotal = total * cut;
  const products: Record<ProductCode, ProductDecisions> = {};
  gamme.forEach((p, k) => {
    const floor = (p.materialCostPerUnit + p.otherVariableCostPerUnit) * 1.1;
    const planShare = planTotal > 0 ? (targets[k]! * cut) / planTotal : weightsAlive[k]!;
    // Même porte que le choix scalaire : seuls les bots « enrichis » arbitrent
    // leurs fournisseurs ; les autres restent chez le façonnier de référence.
    const supplierChoice =
      p.suppliers && ctx.scenario.enrichedBots ? pickSupplier(profile, p.suppliers) : base.supplierChoice;
    const rdBudget = ctx.scenario.rd ? botRdBudget(profile, ctx, p, available[k]!) : undefined;
    products[p.code] = {
      price: Math.max(floor, productRefPrice(p) * priceRatio),
      productionPlan: targets[k]! * cut,
      // Communication : la part de marque est retirée du marketing spécifique.
      marketingBudget: (base.marketingBudget ?? 0) * (1 - brandShare(profile, ctx)) * weightsAlive[k]!,
      qualityBudget: available[k] ? (base.qualityBudget ?? 0) * planShare : 0,
      ...(supplierChoice !== undefined ? { supplierChoice } : {}),
      ...(rdBudget !== undefined ? { rdBudget } : {}),
    };
  });
  return products;
}

/**
 * La R&D d'un bot sur une référence (levier `rd`). Une référence à développer
 * est financée sur un nombre de tours propre au profil : le premium, la
 * croissance et l'équilibré d'un coup, dans la limite de ce que leur caisse
 * permet (le reste au tour suivant) ; l'agressif et le passif jamais — l'un
 * vend du volume, l'autre ce qu'il a. Le nombre de tours restants se lit de
 * la part déjà couverte, pour que le cumul atteigne le coût au tour prévu.
 * Une référence lancée reçoit une R&D d'entretien de son niveau technique,
 * chez ceux qui vendent la qualité.
 */
function botRdBudget(profile: BotProfile, ctx: BotContext, p: GammeProduct, available: boolean): number {
  const cfg = ctx.scenario.rd!;
  const rd = rdOpeningOf(ctx.scenario, ctx.state, p.code);
  if (!available && p.development) {
    const cost = p.development.cost;
    const remaining = Math.max(0, cost - (rd?.invested ?? 0));
    const tours = { premium: 1, growth: 1, balanced: 1, price_aggressive: 0, passive: 0 }[profile];
    if (tours === 0 || remaining <= 0) return 0;
    const couvert = cost > 0 ? (rd?.invested ?? 0) / cost : 1;
    const restants = Math.max(1, Math.ceil(tours * (1 - couvert) - 1e-9));
    // Jamais plus de la moitié de ce que la caisse et le découvert
    // permettent : un bot ne se ruine pas pour un prototype, il attend un tour.
    const enveloppe = ctx.state.finance.cash + ctx.scenario.finance.overdraftLimit;
    return Math.max(0, Math.min(remaining / restants, 0.5 * enveloppe));
  }
  const upkeep = { premium: 0.4, growth: 0.2, balanced: 0.1, price_aggressive: 0, passive: 0 }[profile];
  return upkeep * cfg.techScale;
}

/**
 * Communication (levier `communication`) : l'axe qu'un bot tient, fidèle à son
 * profil — le prix pour l'agressif, la qualité pour le premium et
 * l'équilibré, l'image pour la croissance qui bâtit sa notoriété ; le passif
 * ne communique sur rien. Et la part du marketing qu'il consacre à la marque,
 * en gamme.
 */
const BOT_AXIS: Record<BotProfile, CommunicationAxis | undefined> = {
  passive: undefined,
  price_aggressive: "prix",
  premium: "qualite",
  balanced: "qualite",
  growth: "image",
};

function brandShare(profile: BotProfile, ctx: BotContext): number {
  if (!ctx.scenario.communication || !isMultiProduct(ctx.scenario)) return 0;
  return { passive: 0, price_aggressive: 0.2, premium: 0.4, balanced: 0.3, growth: 0.5 }[profile];
}

export function botDecisions(profile: BotProfile, ctx: BotContext): RoundDecisions {
  const ref = mainRefPrice(ctx.scenario);
  const maintenanceMul = ctx.scenario.equipment
    ? fleetMaintenanceMultiplier(
        [...(ctx.state.fleet ?? []), ...(ctx.state.pendingFleet ?? [])],
        new Map<string, EquipmentTypeDef>(ctx.scenario.equipment.types.map((t) => [t.code, t])),
      )
    : 1;
  const maintenance = ctx.scenario.production.maintenanceReference * maintenanceMul;
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
  // R&D en mono-produit (levier `rd`) : l'entretien du niveau technique chez
  // ceux qui vendent la qualité. En gamme, la R&D se décide par référence.
  if (ctx.scenario.rd && !isMultiProduct(ctx.scenario)) {
    base.rdBudget = botRdBudget(profile, ctx, toGamme(ctx.scenario)[0]!, true);
  }
  const enriched = ctx.scenario.enrichedBots ? enrichDecisions(profile, ctx, base) : base;
  // Réaction au prix humain puis garde-fou financier (V1-4), appliqués en dernier
  // pour cadrer la décision finale, quelle que soit la stratégie.
  enriched.price = reactToHumanPrice(enriched.price, ctx);
  applyFinancialGuardRail(enriched, ctx);
  // Gamme : la décision se décline par produit ; les scalaires restent la
  // lecture agrégée (plan = somme des plans). Mono-produit : rien n'est ajouté.
  if (isMultiProduct(ctx.scenario)) {
    const products = gammeDecisions(profile, ctx, enriched);
    enriched.products = products;
    enriched.productionPlan = Object.values(products).reduce((sum, p) => sum + p.productionPlan, 0);
    if (ctx.scenario.rd) {
      enriched.rdBudget = Object.values(products).reduce((sum, p) => sum + (p.rdBudget ?? 0), 0);
    }
    if (ctx.scenario.communication) {
      enriched.brandMarketingBudget = enriched.marketingBudget * brandShare(profile, ctx);
    }
  }
  if (ctx.scenario.communication) {
    const axis = BOT_AXIS[profile];
    if (axis) enriched.communicationAxis = axis;
  }
  return enriched;
}
