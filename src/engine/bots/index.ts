import { computePotentialDemand } from "../market/demand";
import { attractionScore } from "../market/attraction";
import type {
  CompanyState,
  EngineScenarioConfig,
  EquipmentTypeDef,
  ProductCode,
  ProductDecisions,
  RoundDecisions,
  SegmentConfig,
  CommunicationAxis,
} from "../types";
import { fleetMaintenanceMultiplier } from "../simulation";
import { bornerLInvestissement, investissementPlafonne, plafondDInvestissement } from "../investment/plafond";
import { aLaMesureDuNiveau, type LeviersOuverts } from "./leviers";

export { aLaMesureDuNiveau, type LeviersOuverts } from "./leviers";
import { isMultiProduct, isProductAvailable, rdOpeningOf, toGamme, type GammeProduct } from "../gamme";
import { nouveautesDeLaGamme } from "../groupe/nouveautes";
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
  /**
   * Les leviers que le niveau de la partie ouvre. Le bot n'emploie qu'eux, au
   * même défaut que le joueur pour les autres (`aLaMesureDuNiveau`) ; et là où
   * le niveau ouvre l'investissement sans les embauches, il n'achète pas plus de
   * capacité que son équipe ne fait tourner (`investment/plafond`). Absents :
   * le bot décide avec tout, comme avant.
   */
  leviers?: LeviersOuverts | null;
  /**
   * Le seul plafond d'investissement, sans filtrer les autres leviers : pour
   * les parties créées avant la répartition d'octobre 2026, dont les bots
   * jouent comme ils ont toujours joué, sauf pour acheter des machines que leur
   * équipe ne ferait pas tourner. Ignoré quand `leviers` est donné.
   */
  investissementPlafonne?: boolean;
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
function applyFinancialGuardRail(base: RoundDecisions, ctx: BotContext, neuf: boolean): void {
  // Production : bornée par la capacité et la demande prévue × 1,2 (la demande
  // prévue est l'écoulement du tour précédent ; au T1, la seule capacité). C'est
  // ce qui empêche le plan démesuré qui a fait plonger SoundBox.
  const cap = capacity(ctx);
  // LE CLIQUET, et pourquoi il disparaît dans une partie assainie. Plafonner le
  // plan aux ventes du tour passé × 1,2 protège d'un plan démesuré quand le
  // plan ne regarde pas le marché ; mais il enferme alors le bot dans son
  // erreur de départ (hôtel : 4 411 nuitées, puis 2 085, puis 1 668, puis la
  // défaillance, frais fixes inchangés). Assaini, le plan vise déjà la demande
  // que le prix du bot lui laisse : la capacité suffit à le borner.
  const forecast = !neuf && ctx.lastSoldUnits !== undefined ? ctx.lastSoldUnits * 1.2 : cap;
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

/**
 * LES CONCURRENTS ASSAINIS : le réglage figé à la création de la partie
 * (`config/scenarios/scenario-joue.ts`, `concurrentsAssainis`). Faux ou
 * absent, tout ce qui suit est sans effet et le bot décide exactement comme il
 * l'a toujours fait, au bit près : c'est ce qui laisse les parties en cours
 * finir avec LEURS concurrents, et ce qui tient les deux témoins au centime et
 * la note d'examen.
 */
function assaini(ctx: BotContext): boolean {
  return ctx.scenario.bots?.concurrentsAssainis === true;
}

/**
 * ET « BALANCED » N'EN FAIT PAS PARTIE, jamais.
 *
 * Ce profil n'est pas qu'un concurrent : c'est `neutralDecisions`, donc la
 * gestion neutre du secteur, donc CE QUE LE FORMULAIRE PROPOSE À L'ÉLÈVE
 * (`services/decision-baseline.ts`) et ce que joue une équipe absente, et
 * l'étalon de la note d'examen. Le corriger reviendrait à corriger la
 * proposition faite au joueur en même temps que ses concurrents : mesuré, la
 * proposition du transport passait de 232 k€ à 574 k€ de résultat cumulé, et
 * l'équipe qui valide finissait PLUS souvent première, pas moins. La gestion
 * neutre se discute ailleurs, pas ici.
 */
function assainiPour(ctx: BotContext, profile: BotProfile): boolean {
  return profile !== "balanced" && assaini(ctx);
}

/**
 * LA DEMANDE QU'UN BOT PEUT ATTENDRE, À SON PROPRE PRIX.
 *
 * Le défaut que ceci corrige : au premier tour, le plan valait
 * `capacité × 0,65 × tempérament`, quel que soit le prix que le bot venait de
 * fixer. Le premium vend 30 % plus cher et planifiait le même volume que tout
 * le monde : à l'hôtel, 4 411 nuitées produites pour 1 738 demandées, 102 k€
 * de perte au premier tour, puis le garde-fou (« ventes passées × 1,2 »)
 * refermait le cliquet sur l'erreur de départ et la partie se terminait par un
 * dépôt de bilan. Mesuré : 498 défaillances de concurrents sur 2 592.
 *
 * L'estimation, avec ce dont le moteur dispose déjà : la part visée du secteur
 * (`scoring.benchmarks.marketShareTarget`, celle qu'une entreprise obtient en
 * jouant l'offre de référence), corrigée du rapport entre l'attraction de SON
 * offre et celle de cette offre de référence, à l'intensité concurrentielle du
 * segment. Un bot n'a pas accès aux décisions de ses concurrents : il estime,
 * il ne sait pas, et il se trompe donc encore. C'est voulu.
 */
function demandeAttendue(args: {
  segments: readonly SegmentConfig[];
  seasonality: number[];
  roundIndex: number;
  price: number;
  marketingBudget: number;
  marketingScale: number;
  competitionIntensity: number;
  perceivedQuality: number;
  partVisee: number;
}): number {
  let total = 0;
  for (const segment of args.segments) {
    const potentiel = computePotentialDemand(segment, args.roundIndex, args.seasonality, 1);
    if (potentiel <= 0) continue;
    const commun = { lastShare: 0, segment, marketingScale: args.marketingScale };
    const mienne = attractionScore({
      ...commun,
      price: args.price,
      marketingBudget: args.marketingBudget,
      perceivedQuality: args.perceivedQuality,
    });
    // L'offre de référence du segment : son prix usuel, un marketing à la
    // moitié de l'échelle (la gestion neutre) et la qualité de référence.
    const reference = attractionScore({
      ...commun,
      price: segment.refPrice,
      marketingBudget: 0.5 * args.marketingScale,
      perceivedQuality: 1,
    });
    const gamma = segment.competitionIntensity ?? args.competitionIntensity;
    // Bornes serrées : l'estimation sert à éviter l'absurde (produire deux fois
    // ce que le marché peut prendre), pas à viser juste.
    const facteur =
      reference > 0 && mienne > 0 ? Math.min(1.5, Math.max(0.05, Math.pow(mienne / reference, gamma))) : 1;
    total += potentiel * args.partVisee * facteur;
  }
  return total;
}

/**
 * AUCUN PROFIL CONDAMNÉ PAR CONSTRUCTION : le prix ne descend pas sous le coût
 * complet du bot, estimé à 90 % de sa capacité.
 *
 * Le défaut que ceci corrige : `price_aggressive` vendait chez NOVA à
 * 0,88 × 59 € = 51,92 €, pour 38 € de coût variable, et portait 107 500 € de
 * charges au trimestre. Son point mort valait 7 723 unités pour 7 000 de
 * capacité : aucun volume ne le rendait bénéficiaire, son erreur n'était pas
 * une décision mais une impossibilité, et une impossibilité n'enseigne rien.
 *
 * Le plancher est le coût complet SANS MARGE : à 90 % de sa capacité le bot
 * rentre tout juste dans ses frais, et il perd dès qu'il vend moins. Il reste
 * donc un concurrent qui se trompe, pas un concurrent qui se suicide. Là où le
 * prix du profil était déjà au-dessus de son coût complet, le plancher ne
 * change rien, et c'est le cas des huit autres secteurs.
 */
function prixAuCoutComplet(
  ctx: BotContext,
  prix: number,
  budgets: { marketingBudget?: number; qualityBudget?: number; maintenanceBudget?: number },
): number {
  return Math.max(prix, coutCompletUnitaire(ctx, budgets));
}

/** Le coût complet unitaire d'un bot, à 90 % de sa capacité. */
function coutCompletUnitaire(
  ctx: BotContext,
  budgets: { marketingBudget?: number; qualityBudget?: number; maintenanceBudget?: number },
): number {
  const cap = capacity(ctx);
  if (!Number.isFinite(cap) || cap <= 0) return 0;
  const charges =
    ctx.scenario.fixedCostsPerRound +
    (budgets.marketingBudget ?? 0) +
    (budgets.qualityBudget ?? 0) +
    (budgets.maintenanceBudget ?? 0);
  return variableCostPerUnit(ctx.scenario) + charges / (cap * 0.9);
}

/**
 * LE PRIX QUE LE BOT JOUERA CE TOUR, décidé AVANT son plan.
 *
 * Il réagit au prix de l'équipe humaine, renonce au supplément que son marché
 * ne porte pas, puis ne descend pas sous son coût complet. L'ordre compte : la
 * réaction au prix s'appliquait en dernier, après le plan, si bien que le bot
 * planifiait au prix affiché et vendait au prix réagi. À l'hôtel il visait
 * 2 051 nuitées pour un point mort de 2 629 à son prix réel, et aucun volume ne
 * pouvait plus le sauver. Hors partie assainie, rien ne change : la réaction
 * reste appliquée en dernier, comme avant.
 */
function prixDuTour(
  ctx: BotContext,
  neuf: boolean,
  affiche: number,
  ref: number,
  budgets: { marketingBudget?: number; qualityBudget?: number; maintenanceBudget?: number },
): number {
  if (!neuf) return affiche;
  return prixAuCoutComplet(ctx, prixSoutenable(ctx, reactToHumanPrice(affiche, ctx), ref, budgets), budgets);
}

/**
 * UN PRIX QU'AUCUN VOLUME NE RENTABILISE N'EST PAS UNE STRATÉGIE.
 *
 * Le pendant du plancher de coût, par le haut. Le premium d'un secteur où la
 * structure est lourde et la clientèle sensible au prix pose un supplément de
 * 30 % qui lui laisse 1 736 nuitées attendues pour un point mort de 2 091 : il
 * ne manque pas de rigueur, il n'a aucune décision gagnante à prendre. Mesuré :
 * aucune valeur de `premiumPriceRatio` ne sauvait l'hôtel, parce que le défaut
 * n'est pas le chiffre mais l'absence de retour entre le prix et le volume.
 *
 * Le bot cherche donc le PLUS HAUT prix, entre son coût complet et le prix
 * qu'il voudrait afficher, auquel la demande qu'il attend couvre son point
 * mort. Il ne descend jamais sous le prix usuel du secteur : un premium reste
 * un premium, il renonce seulement à un supplément que son marché ne porte pas.
 * Un profil qui vend déjà au prix usuel ou en dessous n'est pas concerné, son
 * prix est sa borne basse.
 */
function prixSoutenable(
  ctx: BotContext,
  prix: number,
  ref: number,
  budgets: { marketingBudget?: number; qualityBudget?: number; maintenanceBudget?: number },
): number {
  const basse = Math.max(coutCompletUnitaire(ctx, budgets), Math.min(prix, ref));
  if (!(prix > basse) || ctx.scenario.subscription) return prix;
  const couvre = (p: number): boolean =>
    demandeAttendueMono(ctx, { price: p, marketingBudget: budgets.marketingBudget ?? 0 }) >=
    pointMortEnUnites(ctx, p, budgets);
  if (couvre(prix)) return prix;
  let bas = basse;
  let haut = prix;
  // Douze pas de dichotomie : la précision au centime suffit, et le calcul
  // reste pur et déterministe.
  for (let i = 0; i < 12; i++) {
    const milieu = (bas + haut) / 2;
    if (couvre(milieu)) bas = milieu;
    else haut = milieu;
  }
  return bas;
}

/**
 * LE PLANCHER DU POINT MORT, celui que la proposition donne déjà à l'équipe
 * (`services/decision-baseline.ts`) et que les bots n'avaient pas.
 *
 * Une estimation de demande se trompe des DEUX côtés : l'ancien plan produisait
 * deux fois trop, un plan calé sur la seule estimation produit parfois deux
 * fois trop peu, et un bot qui ne couvre pas ses frais fixes ferme aussi
 * sûrement qu'un bot qui remplit son stock. Un gérant qui voit sa structure
 * coûter 158 800 € par tour vise au moins le volume qui la paie.
 *
 * Le plancher est borné à 90 % de la capacité, et le plancher de prix le rend
 * toujours atteignable : un prix au moins égal au coût complet à 90 % de la
 * capacité place mécaniquement le point mort sous ces 90 %. Les deux correctifs
 * se tiennent l'un l'autre.
 */
function pointMortEnUnites(
  ctx: BotContext,
  prix: number,
  budgets: { marketingBudget?: number; qualityBudget?: number; maintenanceBudget?: number },
): number {
  const cap = capacity(ctx);
  if (!Number.isFinite(cap) || cap <= 0) return 0;
  const marge = prix - variableCostPerUnit(ctx.scenario);
  if (marge <= 0) return 0;
  const charges =
    ctx.scenario.fixedCostsPerRound +
    (budgets.marketingBudget ?? 0) +
    (budgets.qualityBudget ?? 0) +
    (budgets.maintenanceBudget ?? 0);
  return Math.min(cap * 0.9, charges / marge);
}

/** La demande attendue d'un bot en mono-produit, à sa politique commerciale. */
function demandeAttendueMono(
  ctx: BotContext,
  politique: { price: number; marketingBudget: number },
): number {
  return demandeAttendue({
    segments: ctx.scenario.market.segments,
    seasonality: ctx.scenario.market.seasonality,
    roundIndex: ctx.roundIndex,
    price: politique.price,
    marketingBudget: politique.marketingBudget,
    marketingScale: ctx.scenario.marketing.scale,
    competitionIntensity: ctx.scenario.market.competitionIntensity,
    perceivedQuality: ctx.state.perceivedQuality,
    partVisee: ctx.scenario.scoring.benchmarks.marketShareTarget,
  });
}

/**
 * Plan de production : viser les ventes passées ajustées de la saison, sans
 * gonfler le stock. Partie assainie : viser AUSSI la demande que sa propre
 * politique commerciale lui laisse — au premier tour, c'est la seule
 * information qu'il ait ; aux suivants, elle corrige la mémoire de ses ventes,
 * moitié-moitié, pour qu'un tour raté ne l'enferme pas dans son erreur — et ne
 * jamais viser sous le volume qui paie sa structure.
 */
function adaptivePlan(
  ctx: BotContext,
  aggressiveness: number,
  politique?: {
    price: number;
    marketingBudget: number;
    qualityBudget?: number;
    maintenanceBudget?: number;
  },
): number {
  const cap = capacity(ctx);
  const stock = ctx.state.finishedGoods.quantity;
  const memoire = ctx.lastSoldUnits !== undefined ? ctx.lastSoldUnits * aggressiveness : undefined;
  const attendue =
    politique && !ctx.scenario.subscription ? demandeAttendueMono(ctx, politique) * aggressiveness : undefined;
  // La saison s'applique à la MÉMOIRE (les ventes passées, qu'il faut reporter
  // d'un tour à l'autre) et non à l'estimation : `computePotentialDemand` la
  // compte déjà pour le tour visé, la compter deux fois faisait produire 3 887
  // nuitées pour 2 861 demandées, perdues puisqu'une chambre ne se stocke pas.
  const memoireSaison = memoire === undefined ? undefined : memoire * seasonalFactor(ctx);
  let target: number;
  if (attendue === undefined) {
    target = memoireSaison ?? cap * 0.65 * aggressiveness * seasonalFactor(ctx);
  } else {
    const plancher = pointMortEnUnites(ctx, politique!.price, politique!);
    target = Math.max(memoireSaison === undefined ? attendue : (memoireSaison + attendue) / 2, plancher);
    // UNE CHAMBRE NE SE STOCKE PAS. Dans un service périssable, la capacité
    // produite et non vendue est perdue sèche : viser au-delà de la demande
    // attendue n'y rapporte rien, même pour atteindre son point mort. Ailleurs,
    // le surplus part en stock et se vendra au tour suivant.
    if (ctx.scenario.perishable) target = Math.min(target, Math.max(plancher, attendue * 1.1));
  }
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

  // Niveau 7 : une nouveauté (NOVA Home) ne pèse dans l'atelier du bot
  // qu'une fois au marché, et alors pour le marché qu'elle attend : ses
  // segments propres et la part du potentiel qui migrera vers elle. Avant,
  // elle ne change rien au plan des autres références.
  const nouveautes = nouveautesDeLaGamme(ctx.scenario, gamme);
  const sizes = gamme.map((p) => {
    const n = nouveautes.get(p.code);
    if (!n) return p.market.segments.reduce((sum, s) => sum + s.size, 0);
    if (!isProductAvailable(p, rdOpeningOf(ctx.scenario, ctx.state, p.code), ctx.roundIndex)) return 0;
    const source = gamme.find((x) => x.code === n.migration.depuis);
    const propres = p.market.segments.filter((s) => s.code !== n.migration.vers).reduce((sum, s) => sum + s.size, 0);
    const attendus = Object.entries(n.migration.parts).reduce(
      (sum, [code, part]) => sum + part * (source?.market.segments.find((s) => s.code === code)?.size ?? 0),
      0,
    );
    return propres + attendus;
  });
  const totalSize = sizes.reduce((a, b) => a + b, 0);
  const weights = sizes.map((s) => (totalSize > 0 ? s / totalSize : 1 / gamme.length));

  const machineCap = ctx.state.machineCapacity * ctx.state.availability;
  const laborHours = ctx.state.headcount * ctx.state.hoursPerEmployee * ctx.state.productivity;
  const meanHours = gamme.reduce((sum, p, k) => sum + p.hoursPerUnit * weights[k]!, 0);
  const cap = Math.min(machineCap, meanHours > 0 ? laborHours / meanHours : Infinity);
  const aggressiveness = AGGRESSIVENESS[profile];
  const neuf = assainiPour(ctx, profile);

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
  // Le prix de chaque référence, décidé avant les plans : c'est lui qui dit la
  // demande qu'elle peut attendre, et la marge qui paie la structure.
  const prixParProduit = gamme.map((p) =>
    Math.max((p.materialCostPerUnit + p.otherVariableCostPerUnit) * 1.1, productRefPrice(p) * priceRatio),
  );
  // Partie assainie : la demande attendue RÉFÉRENCE PAR RÉFÉRENCE, au prix et
  // au marketing que cette référence recevra.
  const attendues = gamme.map((p, k) => {
    if (!neuf || !available[k]) return undefined;
    return demandeAttendue({
      segments: p.market.segments,
      seasonality: p.market.seasonality,
      roundIndex: ctx.roundIndex,
      price: prixParProduit[k]!,
      marketingBudget: (base.marketingBudget ?? 0) * (1 - brandShare(profile, ctx)) * weightsAlive[k]!,
      marketingScale: ctx.scenario.marketing.scale,
      competitionIntensity: p.market.competitionIntensity,
      perceivedQuality: ctx.state.perceivedQualityByProduct?.[p.code] ?? ctx.state.perceivedQuality,
      partVisee: ctx.scenario.scoring.benchmarks.marketShareTarget,
    });
  });
  const targets = gamme.map((p, k) => {
    if (!available[k]) return 0;
    const attendue = attendues[k];
    if (profile === "passive")
      return attendue === undefined ? cap * aggressiveness * weightsAlive[k]! : attendue * aggressiveness;
    const stock = ctx.state.finishedGoodsByProduct?.[p.code]?.quantity ?? 0;
    // Zéro vente au tour passé n'est pas une information : la référence
    // n'était pas encore lancée, ou n'a rien vendu — on repart du marché.
    const lastSold = ctx.lastSoldByProduct?.[p.code];
    const basis =
      attendue !== undefined
        ? lastSold
          ? (lastSold * aggressiveness + attendue * aggressiveness) / 2
          : attendue * aggressiveness
        : lastSold
          ? lastSold * aggressiveness
          : cap * 0.65 * aggressiveness * weightsAlive[k]!;
    // Les accessoires d'une gamme peuvent doubler d'un tour à l'autre : la
    // fourchette d'anticipation est plus large qu'en mono-produit.
    const season = seasonalRatio(p.market.seasonality, ctx.roundIndex, 0.5, 2);
    return Math.max(0, basis * season - stock * 0.5);
  });
  const total = targets.reduce((a, b) => a + b, 0);
  // Capacité partagée : la même coupe proportionnelle que le moteur. Et le
  // garde-fou de caisse mono-produit (pas plus de 1,2 fois les ventes passées)
  // devient 1,6 fois : une gamme saisonnière varie davantage qu'un produit.
  const ceiling = Math.min(
    cap,
    !neuf && ctx.lastSoldUnits !== undefined ? ctx.lastSoldUnits * 1.6 : cap,
  );
  let cut = total > ceiling && total > 0 ? ceiling / total : 1;
  // LE PLANCHER DU POINT MORT EN GAMME, à la marge moyenne de l'atelier. Sans
  // lui, l'hôtel en gamme visait 1 452 nuitées pour une structure de 157 000 €
  // par tour et 2 731 demandées : il manquait de volume, pas de clients.
  if (neuf && total > 0) {
    const marge = gamme.reduce(
      (sum, p, k) =>
        sum + (targets[k]! / total) * (prixParProduit[k]! - p.materialCostPerUnit - p.otherVariableCostPerUnit),
      0,
    );
    if (marge > 0) {
      const charges =
        ctx.scenario.fixedCostsPerRound +
        (base.marketingBudget ?? 0) +
        (base.qualityBudget ?? 0) +
        (base.maintenanceBudget ?? 0);
      const pointMort = Math.min(cap * 0.9, charges / marge);
      if (total * cut < pointMort) cut = Math.min(cap / total, pointMort / total);
    }
  }

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
      price: Math.max(floor, prixParProduit[k]!),
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
  // Niveau 7 : une nouveauté (NOVA Home). Aucun concurrent simulé ne l'ouvre :
  // les profils suiveurs la développent, d'un coup, dès qu'une autre entreprise
  // l'a mise au marché ; les autres jamais. Abandonnée, plus rien.
  const nouveaute = nouveautesDeLaGamme(ctx.scenario, [p]).get(p.code);
  if (nouveaute && !available) {
    if (rd?.abandonnee || !nouveaute.suiveurs.includes(profile)) return 0;
    if (!(ctx.state.groupe?.nouveautesAuMarche ?? []).includes(p.code)) return 0;
    const remaining = Math.max(0, (p.development?.cost ?? 0) - (rd?.invested ?? 0));
    const enveloppe = ctx.state.finance.cash + ctx.scenario.finance.overdraftLimit;
    return Math.max(0, Math.min(remaining, 0.5 * enveloppe));
  }
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
  const brute = decisionsDuProfil(profile, ctx);
  // UN MARCHÉ ÉQUITABLE : les leviers du niveau, au défaut du joueur pour les autres.
  const leviers = ctx.leviers ?? null;
  const d = leviers
    ? aLaMesureDuNiveau(brute, leviers, profile === "balanced" ? brute : decisionsDuProfil("balanced", ctx))
    : brute;
  // LE PLAFOND D'INVESTISSEMENT : la même règle que pour le joueur, sur l'état
  // du bot et sa propre politique salariale (la morale en dépend).
  const plafonne = leviers ? investissementPlafonne(leviers) : ctx.investissementPlafonne === true;
  if (plafonne && d.investment) {
    const plafond = plafondDInvestissement(ctx.scenario, ctx.state, { hr: false, investment: true }, d.hr);
    return bornerLInvestissement(d, plafond);
  }
  return d;
}

/** Ce que décide un profil, avec tous les leviers du scénario. */
function decisionsDuProfil(profile: BotProfile, ctx: BotContext): RoundDecisions {
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
  // La gestion neutre (« balanced ») reste hors du correctif : voir `assainiPour`.
  const neuf = assainiPour(ctx, profile);
  let base: RoundDecisions;
  // Le prix et les budgets se décident AVANT le plan : c'est eux qui disent
  // quelle demande le bot peut attendre. Le profil pose son prix d'affichage,
  // `prixDuTour` le rend tenable (partie assainie seulement), et le plan vise
  // ce que ce prix lui laisse, sans descendre sous son point mort.
  switch (profile) {
    case "passive": {
      const budgets = { marketingBudget: 0, qualityBudget: 0, maintenanceBudget: maintenance * 0.5 };
      const prix = prixDuTour(ctx, neuf, ref, ref, budgets);
      base = {
        price: prix,
        // Le passif ne fait aucun marketing : sa demande est structurellement
        // basse, et produire 60 % de sa capacité lui payait comptant un stock
        // qu'il ne vendrait jamais (PIXEL & CO : 4 200 unités planifiées pour
        // 1 945 demandées). Le même calcul que les autres le sert.
        productionPlan: neuf ? adaptivePlan(ctx, 0.6, { price: prix, ...budgets }) : capacity(ctx) * 0.6,
        ...budgets,
      };
      break;
    }
    case "price_aggressive": {
      const budgets = { marketingBudget: 0.75 * mkt, qualityBudget: 0, maintenanceBudget: maintenance };
      const prix = prixDuTour(ctx, neuf, ref * 0.88, ref, budgets);
      base = {
        price: prix,
        productionPlan: neuf ? adaptivePlan(ctx, 1.15, { price: prix, ...budgets }) : adaptivePlan(ctx, 1.15),
        ...budgets,
      };
      break;
    }
    case "premium": {
      // Le supplément de prix du premium est celui du métier : 30 % là où la
      // qualité se paie, moins là où les clients comparent d'abord les prix
      // (mesuré : à 1,3 le premium perd 285 k€ dans le bâtiment et 455 k€ dans
      // le transport, faute de volume, quelle que soit sa dépense).
      const premium = ctx.scenario.bots?.premiumPriceRatio ?? 1.3;
      const budgets = { marketingBudget: 0.5 * mkt, qualityBudget: 1.5 * qual, maintenanceBudget: maintenance };
      const prix = prixDuTour(ctx, neuf, ref * premium, ref, budgets);
      base = {
        price: prix,
        productionPlan: neuf ? adaptivePlan(ctx, 1.0, { price: prix, ...budgets }) : adaptivePlan(ctx, 1.0),
        ...budgets,
      };
      break;
    }
    case "balanced":
      // Inchangé, au bit près : c'est la gestion neutre du secteur.
      base = {
        price: ref,
        productionPlan: adaptivePlan(ctx, 1.05),
        marketingBudget: 0.5 * mkt,
        qualityBudget: 0.5 * qual,
        maintenanceBudget: maintenance,
      };
      break;
    case "growth": {
      const budgets = { marketingBudget: (7 / 6) * mkt, qualityBudget: 0.5 * qual, maintenanceBudget: maintenance };
      const prix = prixDuTour(ctx, neuf, ref * 0.95, ref, budgets);
      base = {
        price: prix,
        productionPlan: neuf ? adaptivePlan(ctx, 1.25, { price: prix, ...budgets }) : adaptivePlan(ctx, 1.25),
        ...budgets,
      };
      break;
    }
  }
  // R&D en mono-produit (levier `rd`) : l'entretien du niveau technique chez
  // ceux qui vendent la qualité. En gamme, la R&D se décide par référence.
  if (ctx.scenario.rd && !isMultiProduct(ctx.scenario)) {
    base.rdBudget = botRdBudget(profile, ctx, toGamme(ctx.scenario)[0]!, true);
  }
  const enriched = ctx.scenario.enrichedBots ? enrichDecisions(profile, ctx, base) : base;
  // Réaction au prix humain puis garde-fou financier (V1-4), appliqués en dernier
  // pour cadrer la décision finale, quelle que soit la stratégie.
  // Partie assainie : le prix a déjà réagi et pris ses bornes plus haut, pour
  // que le plan le connaisse. Sinon, le chemin d'avant, inchangé.
  if (!neuf) enriched.price = reactToHumanPrice(enriched.price, ctx);
  applyFinancialGuardRail(enriched, ctx, neuf);
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
