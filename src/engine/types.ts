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
    /**
     * Durée contractuelle des emprunts en tours (amortissement constant).
     * Présente : chaque emprunt porte un échéancier OBLIGATOIRE (le
     * remboursement décidé devient un remboursement anticipé facultatif).
     * Absente : remboursement libre (comportement historique).
     */
    loanDurationRounds?: number;
  };
  /**
   * Outils de gestion de trésorerie (optionnel) : mobilisation du poste
   * clients. L'escompte avance des créances au taux d'escompte (plafonné à
   * une part du poste), l'affacturage les cède contre commission (illimité).
   * Au-delà du plafond de découvert : affacturage FORCÉ au taux punitif —
   * si vous ne gérez pas votre trésorerie, la banque la gère pour vous.
   */
  treasury?: {
    /** Taux d'escompte annuel (agios au prorata du tour). */
    discountAnnualRate: number;
    /** Part maximale des créances escomptables (0..1). */
    discountMaxShare: number;
    /** Commission d'affacturage (part du montant cédé). */
    factoringFeeRate: number;
    /** Commission de l'affacturage forcé (punitif). */
    forcedFactoringFeeRate: number;
  };
  /** Coûts fixes opérationnels par tour (hors amortissements). */
  fixedCostsPerRound: number;
  /**
   * Investissement capacitaire (optionnel — doc 02 §6.5) : acheter de la
   * capacité machine. Décaissement et immobilisation immédiats, mise en
   * service au tour SUIVANT, amortissement linéaire dès la mise en service.
   */
  investment?: {
    /** Prix d'une unité de capacité machine par tour (base trimestrielle). */
    costPerCapacityUnit: number;
    /** Durée d'amortissement en tours (base trimestrielle). */
    depreciationRounds: number;
    /** Achat maximal par tour (unités de capacité). */
    maxPerRound: number;
  };
  /**
   * Sous-traitance (optionnel) : unités achetées finies pour servir les
   * commandes fermes au-delà du stock (cible « order_subcontract »).
   */
  subcontracting?: { unitCost: number };
  /**
   * Coûts de la non-qualité (optionnel — activable à la création) :
   * rebuts internes fonction de la qualité produite, retours clients
   * fonction de la qualité perçue. La prévention, c'est le budget qualité.
   */
  qualityCosts?: {
    /** Taux de rebuts à qualité produite 1 (multiplié par 2 − qualité, borné). */
    baseDefectRate: number;
    /** Retours clients : ventes × sens × max(0, 1 − qualité perçue). */
    externalReturnSensitivity: number;
  };
  /**
   * Assurance catastrophe (optionnelle) : contre une prime par tour, les
   * effets des événements couverts sont neutralisés pour les assurés.
   * L'arbitrage pédagogique : un coût certain contre un risque incertain.
   */
  insurance?: { premiumPerRound: number; coveredEventCodes: string[] };
  /**
   * Ressources humaines (optionnel — doc 02 §4.1) : embauches, licenciements,
   * formation et politique salariale. Les salaires de `includedHeadcount`
   * employés sont déjà dans fixedCostsPerRound ; seul l'écart (effectif
   * supplémentaire, indice de salaire ≠ 1) est facturé en plus.
   */
  hr?: {
    /** Salaire chargé d'un employé par tour (base trimestrielle). */
    salaryPerEmployeePerRound: number;
    /** Effectif dont les salaires sont déjà compris dans fixedCostsPerRound. */
    includedHeadcount: number;
    /** Coût de recrutement par embauche (ponctuel, non redimensionné). */
    hiringCost: number;
    /** Coût de licenciement par départ décidé (ponctuel). */
    firingCost: number;
    /** Formation : productivité(t+1) += sens × ln(1 + budget/scale). */
    trainingScale: number;
    trainingSensitivity: number;
    maxProductivity: number;
    /** Morale du tour : productivité × (1 + sens × (indiceSalaire − 1)), borné. */
    moraleSensitivity: number;
    /** Sous ce niveau d'indice de salaire, un salarié démissionne chaque tour. */
    attritionThreshold: number;
    maxHiresPerRound: number;
    maxHeadcount: number;
  };
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
  | "order" // commande ferme : unités vendues d'office (add), réglées comptant, dans la limite du stock
  | "order_price" // prix unitaire IMPOSÉ des unités de commande ferme du tour (valeur absolue)
  | "order_subcontract"; // unités de la commande sous-traitables (add) — au coût scenario.subcontracting

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
  /** Capacité machine achetée au tour précédent, mise en service ce tour. */
  pendingCapacity?: number;
  /** Amortissement de l'investissement en attente de mise en service. */
  pendingDepreciationPerRound?: number;
  /** Amortissements supplémentaires (investissements en service). */
  extraDepreciationPerRound?: number;
  /**
   * Échéanciers d'emprunts (amortissement constant) : Σ remaining =
   * financialDebt du bilan. Absent = dette à remboursement libre (historique).
   */
  loans?: { remaining: number; perRound: number }[];
}

export interface RoundDecisions {
  price: number;
  productionPlan: number;
  marketingBudget: number;
  qualityBudget: number;
  maintenanceBudget: number;
  /** Souscrire l'assurance catastrophe du tour (si le scénario en propose une). */
  insurance?: boolean;
  /**
   * Décisions RH (si le scénario le propose). hire/fire prennent effet au
   * tour SUIVANT (le recrutement prend du temps), les coûts tombent ce tour.
   * salaryIndex : 1 = salaire de marché (récurrent, reconduit) ;
   * hire/fire/trainingBudget : actions ponctuelles (jamais reconduites).
   */
  hr?: { hire?: number; fire?: number; trainingBudget?: number; salaryIndex?: number };
  /**
   * Investissement capacitaire (si le scénario le propose) : unités de
   * capacité machine achetées ce tour — décaissées maintenant, en service au
   * tour suivant. Action ponctuelle : jamais reconduite.
   */
  investment?: { machineCapacityUnits?: number };
  /**
   * Financement. Avec échéancier (finance.loanDurationRounds) : les échéances
   * sont prélevées automatiquement et loanRepayment est un remboursement
   * ANTICIPÉ facultatif ; newLoan contracte un emprunt à la durée standard.
   */
  finance?: { newLoan?: number; loanRepayment?: number; capitalIncrease?: number };
  /** Trésorerie : montants de créances à mobiliser ce tour (actions ponctuelles). */
  treasury?: { discount?: number; factoring?: number };
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
  /**
   * Commandes fermes (événement « order ») : demandées, livrées du stock,
   * sous-traitées ; prix unitaire imposé le cas échéant (sinon prix propre).
   */
  extraOrders?: {
    requested: number;
    delivered: number;
    subcontracted: number;
    unitPrice: number;
  };
  /** Investissement du tour : capacité achetée (en service à t+1) et montant. */
  investment?: { capacityUnits: number; outlay: number };
  /** Coûts de la qualité (prévention) et de la non-qualité (défaillances). */
  qualityCosts?: {
    prevention: number;
    internalFailure: number; // rebuts valorisés au coût variable
    externalFailure: number; // retours clients remboursés
    defectUnits: number;
    returnedUnits: number;
  };
  /** Assurance du tour : prime payée et événements couverts neutralisés. */
  insurance?: { premium: number; neutralizedEvents: string[] };
  /** Dette du tour : échéance obligatoire, anticipé, prochaine échéance. */
  debt?: {
    mandatoryRepayment: number;
    earlyRepayment: number;
    newLoan: number;
    outstanding: number;
    nextMandatory: number;
  };
  /** Trésorerie du tour : mobilisations de créances et coûts financiers. */
  treasury?: {
    discounted: number;
    factored: number;
    /** Affacturage imposé par la banque (découvert au-delà du plafond). */
    forcedFactored: number;
    financingCost: number;
    /** Découvert toujours au-delà du plafond malgré tout : crise caractérisée. */
    crisis: boolean;
  };
  /** RH du tour : effectif, mouvements et coût (doc 02 §4.1). */
  hr?: {
    headcount: number;
    hired: number;
    fired: number;
    /** Démission (indice de salaire sous le seuil d'attrition). */
    departed: number;
    trainingBudget: number;
    salaryIndex: number;
    /** Charge de structure RH du tour (négatif = économie de masse salariale). */
    cost: number;
    nextHeadcount: number;
  };
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
