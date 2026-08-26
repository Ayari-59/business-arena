/**
 * Types du moteur économique (doc 06). Le moteur est pur : aucune dépendance
 * React/Next/DB, montants en nombres (la conversion numeric SQL se fait dans
 * la couche services).
 *
 * Périmètre v0.1 (étape 3, documenté doc 02 §8) : un produit par entreprise,
 * matières achetées au fil de la production, stocks de produits finis au CUMP
 * valorisés en coût variable, ruptures perdues (pas de backlog), pas de
 * sous-traitance ni d'investissement en cours de partie. Les champs et modules
 * sont structurés pour lever ces limites sans casser l'API.
 */

export type CompanyId = string;
export type SegmentCode = string;
export type ProductCode = string;

// ---------------------------------------------------------------------------
// Configuration de scénario (sous-ensemble consommé par le moteur v0.1)
// ---------------------------------------------------------------------------

export interface EngineScenarioConfig {
  code: string;
  version: string;
  roundsCount: number;
  /** Durée d'un tour en jours (ADR-01) — sert aux délais clients/fournisseurs. */
  roundDays: number;
  market: {
    segments: SegmentConfig[];
    /** Coefficients saisonniers, un par tour (moyenne ≈ 1). */
    seasonality: number[];
    /** Attraction constante du « reste du marché » (doc 02 §3.3). 0 = absent. */
    outsideAttraction: number;
    /** Intensité concurrentielle γ par défaut (≥ 1). */
    competitionIntensity: number;
  };
  product: {
    code: ProductCode;
    /** Coût matières par unité produite. */
    materialCostPerUnit: number;
    /** Autres coûts variables (MOD, énergie…) par unité produite. */
    otherVariableCostPerUnit: number;
    /** Heures de main-d'œuvre par unité produite. */
    hoursPerUnit: number;
  };
  production: {
    /** Effet du budget qualité : producedQuality = 1 + sens × ln(1 + budget/scale). */
    qualitySensitivity: number;
    qualityScale: number;
    /** Inertie de la qualité perçue (λ, doc 02 §4). */
    qualityInertia: number;
    /** Budget de maintenance de référence ; en-dessous, la disponibilité se dégrade. */
    maintenanceReference: number;
    /** Perte de disponibilité par tour si maintenance nulle (linéaire jusqu'à réf.). */
    availabilityDecay: number;
  };
  marketing: {
    /** Effet marketing : 1 + sens(segment) × ln(1 + budget/scale). */
    scale: number;
  };
  finance: {
    /** Taux d'emprunt annuel. */
    loanAnnualRate: number;
    /** Taux de découvert annuel. */
    overdraftAnnualRate: number;
    /** Plafond de découvert autorisé. */
    overdraftLimit: number;
    /** Taux d'IS appliqué au bénéfice du tour. */
    taxRate: number;
    /**
     * Taux de TVA (0 ou absent = désactivée). Résultat inchangé (comptes HT) ;
     * la TVA transite par créances/dettes TTC et par la dette « TVA à
     * décaisser » payée le tour suivant — son poids se lit dans le BFR.
     * Simplification assumée : déductible sur les achats de matières.
     */
    vatRate?: number;
    /** Délai fournisseur en jours (paiement des matières). */
    supplierPaymentDelayDays: number;
    /** Amortissement des immobilisations par tour (linéaire, en €). */
    depreciationPerRound: number;
  };
  /** Coûts fixes opérationnels par tour (hors amortissements). */
  fixedCostsPerRound: number;
  /**
   * Assurance catastrophe (optionnelle) : contre une prime par tour, les
   * effets des événements couverts sont neutralisés pour les assurés.
   * L'arbitrage pédagogique : un coût certain contre un risque incertain.
   */
  insurance?: { premiumPerRound: number; coveredEventCodes: string[] };
  events: EventDefinitionConfig[];
  scriptedEvents: { round: number; eventCode: string; companyIndex?: number }[];
  /** Références du scoring BPI (doc 08 §1.1) — bornes min/cible par tour. */
  scoring: ScoringConfig;
}

export interface ScoringConfig {
  /** Pondérations des 7 dimensions (Σ = 1, doc 08 §1). */
  weights: {
    economic: number;
    financial: number;
    commercial: number;
    operational: number;
    profitability: number;
    strategy: number;
    decisionMastery: number;
  };
  /** Bornes de normalisation : min → 0, target → 100 (flux redimensionnés par périodicité). */
  benchmarks: {
    operatingIncome: { min: number; target: number };
    revenue: { min: number; target: number };
    netTreasury: { min: number; target: number };
    returnOnEquity: { min: number; target: number };
    marketShareTarget: number;
    utilizationTarget: number;
  };
}

export interface SegmentConfig {
  code: SegmentCode;
  name: string;
  /** Demande de base (unités par tour). */
  size: number;
  /** Croissance par tour (ex. 0.06). */
  growth: number;
  /** Élasticité-prix (< 0). */
  priceElasticity: number;
  refPrice: number;
  /** Prix plancher d'acceptabilité (méfiance en dessous, doc 02 §3.2). */
  minAcceptablePrice: number;
  /** Seuils psychologiques : pénalité multiplicative au-dessus du seuil. */
  psychThresholds: { threshold: number; penalty: number }[];
  marketingSensitivity: number;
  qualitySensitivity: number;
  /** Fidélité : bonus 1 + loyalty × part de marché du tour précédent. */
  loyalty: number;
  /** Bornes de l'effet prix (documentées scénario, doc 02 §3.2). */
  priceEffectBounds: { min: number; max: number };
  /** Délai de paiement clients en jours (0 = comptant). */
  paymentDelayDays: number;
  /**
   * Saisonnalité propre au segment (doc 02 §3.1 : Seasonality(s, t)) ;
   * à défaut, la saisonnalité globale du marché s'applique. Un coefficient 0
   * fait apparaître/disparaître le segment (ex. compte-clé à partir du tour 3).
   */
  seasonality?: number[];
  /** Intensité concurrentielle γ du segment (défaut : market.competitionIntensity). */
  competitionIntensity?: number;
}

export interface EventDefinitionConfig {
  code: string;
  scope: "market" | "company";
  /** Probabilité de tirage par tour (0..1) ; les scripts passent outre. */
  probability: number;
  minRound?: number;
  duration: number;
  modifiers: EventModifier[];
}

/** Cibles de modificateurs supportées en v0.1. */
export type ModifierTarget =
  | "material_cost" // multiplie le coût matières
  | "demand" // multiplie la demande de tous les segments
  | `demand:${string}` // multiplie la demande d'un segment
  | "availability" // multiplie la disponibilité machine
  | "interest_rate" // multiplie les taux d'intérêt du tour
  | "order"; // commande ferme : unités vendues d'office (add), réglées comptant, dans la limite du stock

export interface EventModifier {
  target: ModifierTarget;
  op: "mul" | "add";
  value: number;
}

// ---------------------------------------------------------------------------
// État d'une entreprise
// ---------------------------------------------------------------------------

export interface BalanceSheet {
  fixedAssetsNet: number;
  inventoryValue: number;
  receivables: number; // TTC quand la TVA est active
  cash: number; // ≥ 0
  equity: number;
  financialDebt: number;
  payables: number; // TTC quand la TVA est active
  overdraft: number; // ≥ 0
  /** TVA nette du tour, à décaisser au tour suivant (négatif = crédit de TVA). */
  vatLiability?: number;
}

export interface CompanyState {
  id: CompanyId;
  name: string;
  controller: "human" | "bot";
  botProfile?: string;
  /** Qualité perçue courante (1 = référence). */
  perceivedQuality: number;
  /** Capacité machine totale (unités/tour à 100 % de disponibilité). */
  machineCapacity: number;
  /** Disponibilité machine courante (0..1). */
  availability: number;
  /** Effectif de production. */
  headcount: number;
  hoursPerEmployee: number;
  productivity: number;
  /** Stock de produits finis : quantité et coût unitaire moyen pondéré. */
  finishedGoods: { quantity: number; unitCost: number };
  finance: BalanceSheet;
  /** Parts de marché du tour précédent, par segment (fidélité). */
  lastMarketShare: Record<SegmentCode, number>;
}

export interface RoundDecisions {
  price: number;
  productionPlan: number;
  marketingBudget: number;
  qualityBudget: number;
  maintenanceBudget: number;
  /** Souscrire l'assurance catastrophe du tour (si le scénario en propose une). */
  insurance?: boolean;
  finance?: { newLoan?: number; loanRepayment?: number };
  forecast?: { expectedRevenue?: number; expectedNetIncome?: number; expectedCash?: number };
}

// ---------------------------------------------------------------------------
// Sorties
// ---------------------------------------------------------------------------

export interface IncomeStatement {
  revenue: number;
  productionStocked: number; // production stockée (± variation de stock valorisée)
  cogs: number; // coût variable des unités vendues (CUMP)
  variableProductionCost: number; // coût variable des unités produites
  grossMargin: number; // marge sur coût variable des ventes
  marketingCost: number;
  qualityCost: number;
  maintenanceCost: number;
  fixedCosts: number;
  ebitda: number;
  depreciation: number;
  operatingIncome: number;
  interest: number;
  pretaxIncome: number;
  tax: number;
  netIncome: number;
}

export interface CashFlowItem {
  label: string;
  amount: number;
}

export interface SegmentSalesDetail {
  potential: number; // demande potentielle du marché sur le segment
  attraction: number;
  share: number; // part de marché de l'entreprise sur le segment
  demandForCompany: number; // demande adressée à l'entreprise
  sold: number; // ventes réalisées (contrainte stock)
  lost: number; // ventes perdues (rupture)
}

export interface CompanyRoundResult {
  companyId: CompanyId;
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlow: { opening: number; items: CashFlowItem[]; closing: number };
  functionalBalance: { frng: number; bfr: number; netTreasury: number };
  ratios: {
    profitability: number;
    returnOnCapitalEmployed: number;
    returnOnEquity: number;
    leverage: number;
    debtToEquity: number;
    assetTurnover: number;
  };
  market: { bySegment: Record<SegmentCode, SegmentSalesDetail>; totalShare: number };
  production: {
    planned: number;
    produced: number;
    machineCapacity: number;
    laborCapacity: number;
    utilizationRate: number;
    producedQuality: number;
  };
  breakeven: {
    breakEvenUnits: number;
    breakEvenRevenue: number;
    safetyMargin: number;
    safetyIndex: number;
  };
  /** Commandes fermes (événement « order ») : demandées vs livrées (contrainte stock). */
  extraOrders?: { requested: number; delivered: number };
  /** Assurance du tour : prime payée et événements couverts neutralisés. */
  insurance?: { premium: number; neutralizedEvents: string[] };
  kpis: Record<string, number>;
}

export interface EventInstance {
  code: string;
  scope: "market" | "company";
  companyId?: CompanyId;
  roundsLeft: number;
  modifiers: EventModifier[];
}

export interface SimulationInput {
  scenario: EngineScenarioConfig;
  roundIndex: number; // 1..N
  companies: CompanyState[];
  decisions: Record<CompanyId, RoundDecisions>;
  activeEvents: EventInstance[];
  /** Graine de la partie ; le tirage du tour dérive de (seed, roundIndex). */
  seed: number;
}

export interface SimulationOutput {
  companies: CompanyState[];
  results: Record<CompanyId, CompanyRoundResult>;
  market: {
    potentialBySegment: Record<SegmentCode, number>;
    totalSold: number;
  };
  events: EventInstance[]; // événements actifs à l'issue du tour (tirés + poursuivis)
  newEvents: EventInstance[]; // événements apparus ce tour
}
