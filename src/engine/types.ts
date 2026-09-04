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
export type SupplierCode = string;

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
    /** Seuil d'utilisation au-delà duquel la qualité se dégrade. Absent = 0.95. */
    overheatThreshold?: number;
    /** Plancher de disponibilité machine. Absent = 0.3. */
    availabilityFloor?: number;
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
    /**
     * Enveloppe TOTALE d'augmentation de capital sur la partie (stock, en €,
     * inchangée par la périodicité). Les associés ne suivent pas
     * indéfiniment : sans plafond, l'apport illimité fausserait le jeu de
     * trésorerie. Absente = illimité (comportement historique).
     */
    maxCapitalIncreaseTotal?: number;
    /**
     * DOSSIER BANCAIRE (optionnel). Présent : le plan de trésorerie déposé
     * avec les décisions cesse d'être un exercice sans suite et devient la
     * pièce que lit la banque.
     *
     *  1. pas de plan, pas d'emprunt : une demande non appuyée est refusée ;
     *  2. l'écart entre le plan et le réalisé nourrit une CONFIANCE (0..1),
     *     qui fixe au tour suivant le plafond de découvert consenti et le
     *     taux auquel ce découvert est facturé.
     *
     * Le découvert est un concours révocable : la banque peut le réduire et
     * le renchérir quand elle veut, ce qui n'est pas vrai d'un emprunt déjà
     * accordé. C'est pourquoi la confiance agit là, et pas sur la dette en
     * cours.
     *
     * Absent = comportement historique : le prévisionnel n'a aucun effet.
     */
    bank?: {
      /** Part de la confiance passée conservée d'un tour à l'autre (0..1). */
      memory: number;
      /** Points de taux ajoutés au découvert à confiance nulle. */
      maxOverdraftSpread: number;
      /** Part du plafond de découvert consentie à confiance nulle (0..1). */
      minOverdraftShare: number;
    };
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
    /**
     * Taux annuel du placement de trésorerie (optionnel). La contrepartie du
     * découvert : l'argent qui dort ne rapporte rien, mais l'argent placé
     * n'est plus disponible pour payer. Le taux est TOUJOURS bien inférieur à
     * celui du découvert, sans quoi l'arbitrage n'existerait pas.
     */
    placementAnnualRate?: number;
  };
  /** Coûts fixes opérationnels par tour (hors amortissements). */
  fixedCostsPerRound: number;
  /**
   * Activité PÉRISSABLE (optionnel) : la capacité non vendue est perdue, elle
   * ne se stocke pas — une nuit d'hôtel, un couvert servi, une heure de conseil
   * ne se reportent pas au tour suivant. Les unités produites et invendues
   * passent en coût des ventes (gâchis), le stock final est nul. Sans ce
   * drapeau, comportement industriel historique (stock reporté au CUMP).
   */
  perishable?: boolean;
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
   * Équipements typés (optionnel) : remplace le système d'investissement
   * homogène par un parc de machines de types différents, chacun avec son
   * coût, sa capacité, son amortissement et ses besoins de maintenance.
   * Inspiré de Simuland (3 types, investissement, amortissement).
   *
   * Quand présent, la capacité machine est CALCULÉE depuis le parc ; le
   * champ `investment` reste lisible (coût moyen, plafond global) mais les
   * décisions passent par `equipmentBuy`/`equipmentSell`.
   */
  equipment?: {
    types: EquipmentTypeDef[];
    initialFleet: { typeCode: string; count: number }[];
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
   * Fournisseurs de matières premières (optionnel — doc 02 §5bis) : le joueur
   * choisit son fournisseur chaque tour. Le premier de la liste est le
   * fournisseur par défaut (reconduction). Absent = un seul fournisseur
   * implicite (comportement historique, prix = materialCostPerUnit).
   */
  suppliers?: SupplierDef[];
  /**
   * Assurance (optionnelle) : une ou plusieurs formules à primes croissantes,
   * chaque formule couvrant un panier d'événements. Le joueur choisit UNE
   * formule (ou aucune) — c'est un arbitrage prime / couverture.
   * Rétro-compatible : si `coveredEventCodes` est défini (ancien format),
   * il est interprété comme une formule unique.
   */
  insurance?: {
    /** Ancien format (rétro-compatibilité) : formule unique. */
    premiumPerRound: number;
    coveredEventCodes: string[];
    /** Nouveau format : plusieurs formules. */
    formulas?: InsuranceFormulaDef[];
  };
  /**
   * Commandes exceptionnelles (optionnel — doc 02 §5.1) : une offre est
   * proposée ENTRE CHAQUE TOUR (rotation déterministe dans le pool — la même
   * pour toutes les équipes, aucun aléa consommé), à prendre ou à laisser.
   * Deux archétypes alternent : export à forte marge payé à long délai (le
   * CA dort en créances, le BFR gonfle) ou vente comptant à marge mince
   * (cash immédiat, rentabilité maigre). L'arbitrage rentabilité /
   * trésorerie, posé à chaque tour. Volumes en base trimestrielle.
   */
  orderOffers?: OrderOfferDef[];
  /**
   * Études achetables (optionnel — doc 02 §8bis) : l'information a un prix.
   * Chaque étude cochée ce tour est facturée en charge de structure et son
   * RAPPORT est délivré avec les résultats du tour (étude de marché : demande
   * et concurrents ; analyse de prix : élasticités et seuils psychologiques ;
   * étude financière : ratios, coûts et comparaison sectorielle ; analyse de
   * projet : VAN/TRI de l'investissement et arbitrage de la commande
   * exceptionnelle). Coûts en base trimestrielle (flux, × k).
   */
  studies?: {
    marketCost: number;
    priceCost: number;
    financeCost: number;
    projectCost: number;
  };
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
    /** Bornes de l'indice de salaire. Absent = [0.8, 1.3]. */
    salaryIndexBounds?: [number, number];
    /** Bornes de la morale. Absent = [0.85, 1.12]. */
    moraleBounds?: [number, number];
  };
  events: EventDefinitionConfig[];
  scriptedEvents: { round: number; eventCode: string; companyIndex?: number }[];
  /** Références du scoring BPI (doc 08 §1.1) — bornes min/cible par tour. */
  scoring: ScoringConfig;
  /** V2 : les bots utilisent les décisions financières, RH, investissement et trésorerie. Absent = false. */
  enrichedBots?: boolean;
}

/**
 * Formule d'assurance (doc 02 §7.2bis) : panier d'événements couverts
 * contre une prime par tour. Plusieurs formules à primes croissantes
 * permettent un arbitrage gradué du risque.
 */
export interface InsuranceFormulaDef {
  code: string;
  name: string;
  premiumPerRound: number;
  coveredEventCodes: string[];
}

/**
 * Fournisseur de matières premières (doc 02 §5bis) : un arbitrage
 * coût/qualité/délai. Le fournisseur standard est le référent ; les autres
 * s'en écartent par un multiplicateur de prix, un bonus de qualité perçue et
 * un risque de rupture d'approvisionnement (probabilité d'un malus de
 * disponibilité le tour où l'on commande).
 */
export interface SupplierDef {
  code: SupplierCode;
  name: string;
  narrative: string;
  /** Multiplicateur du coût matières (1 = standard, 0.85 = −15 %). */
  costMultiplier: number;
  /** Bonus de qualité perçue par tour (0 = neutre, +0.05 = prime qualité). */
  qualityBonus: number;
  /** Délai de paiement fournisseur en jours (écrase le délai global). */
  paymentDelayDays: number;
  /** Probabilité de rupture d'approvisionnement par tour (0..0.3). */
  supplyRiskProbability: number;
  /** Malus de disponibilité si la rupture se matérialise (ex. 0.8 = −20 %). */
  supplyRiskAvailabilityHit: number;
}

/** Une commande exceptionnelle du pool (voir EngineScenarioConfig.orderOffers). */
export interface OrderOfferDef {
  code: string;
  title: string;
  narrative: string;
  /** Volume ferme proposé (unités, base trimestrielle). */
  units: number;
  /** Prix unitaire imposé (€ HT). */
  price: number;
  /** Délai de règlement en jours (0 = comptant). */
  paymentDelayDays: number;
}

/**
 * Type d'équipement (doc 02 §6.5bis) : une catégorie de machine avec ses
 * caractéristiques propres. Le joueur achète et vend des machines par type ;
 * la capacité totale est la somme des capacités du parc.
 */
export interface EquipmentTypeDef {
  code: string;
  name: string;
  /** Unités de capacité fournies par machine de ce type. */
  capacityPerUnit: number;
  /** Prix d'achat d'une machine (décaissé immédiatement). */
  costPerUnit: number;
  /** Durée d'amortissement linéaire en tours. */
  depreciationRounds: number;
  /** Multiplicateur du budget de maintenance de référence (1 = neutre). */
  maintenanceMultiplier: number;
  /** Achats max par tour pour ce type. */
  maxPerRound: number;
  /** Part de la valeur nette comptable récupérée à la revente (0..1, défaut 0.5). */
  resaleRatio?: number;
}

/**
 * Machine possédée dans le parc d'une entreprise : type, quantité,
 * tour d'acquisition et valeur nette comptable résiduelle.
 */
export interface EquipmentItem {
  typeCode: string;
  count: number;
  acquiredRound: number;
  /** Valeur nette comptable totale restante (pour l'amortissement). */
  bookValue: number;
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
  /** Seuils de cohérence stratégique (optionnels, défauts hardcodés historiques). */
  coherenceThresholds?: {
    premiumPriceRatio?: number;
    minQualityEffortRatio?: number;
    highMarketingLostRatio?: number;
    lowMaintenanceRatio?: number;
    highUtilizationFloor?: number;
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
   * Part du prix de vente prélevée par le tiers qui apporte ce segment
   * (0,15 = quinze pour cent). Une place de marché, un apporteur d'affaires,
   * une centrale : le client paie le prix affiché, l'entreprise n'en encaisse
   * qu'une partie.
   *
   * C'est une CHARGE et non une remise. La distinction n'est pas
   * comptable seulement : une remise se négocie sur le prix et se voit du
   * client, une commission se négocie avec le partenaire et ne se voit que
   * dans les comptes. Modéliser la commission par un prix de référence plus
   * bas, comme le faisait PIXEL & CO, revenait à en faire une remise, donc à
   * rendre incalculable la marge après commission.
   */
  commissionRate?: number;
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
  /**
   * Valeurs mobilières de placement : trésorerie placée au tour précédent,
   * qui revient en caisse à l'ouverture du tour suivant. Actif de trésorerie
   * (donc dans la TN), mais indisponible pour payer pendant le tour.
   */
  shortTermInvestment?: number;
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
  /**
   * Parc d'équipements typés (présent quand le scénario a `equipment`).
   * Chaque entrée est un lot de machines du même type acquises au même tour.
   */
  fleet?: EquipmentItem[];
  /** Machines achetées ce tour, en attente d'installation (en service à t+1). */
  pendingFleet?: EquipmentItem[];
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
  /** Capital déjà apporté depuis le début de la partie (enveloppe des associés). */
  capitalRaised?: number;
  /**
   * Bénéfices accumulés et non distribués : ce qui peut l'être. Part de zéro,
   * augmente du résultat de chaque tour, diminue des dividendes versés. Peut
   * devenir négatif quand les pertes s'accumulent, et rien n'est alors
   * distribuable tant qu'elles ne sont pas rattrapées.
   */
  reserves?: number;
  /**
   * Déficit fiscal reportable (report en avant des pertes). Distinct des
   * `reserves` comptables : il s'alimente du résultat AVANT impôt négatif et
   * s'impute sur les bénéfices imposables futurs avant calcul de l'IS. Part de
   * zéro, jamais négatif. Absent = aucun déficit à reporter.
   */
  taxLossCarryforward?: number;
  /**
   * Confiance de la banque (0..1), construite sur la fiabilité des plans de
   * trésorerie déposés aux tours passés. Absente = confiance pleine : une
   * entreprise qui n'a encore rien promis n'a rien à se faire pardonner.
   */
  bankTrust?: number;
  /**
   * Défaillance (cessation de paiements, V2 couche 2). Une entreprise passe
   * `defaillant` après deux tours consécutifs de crise de trésorerie
   * caractérisée (découvert au-delà du plafond, plus de créances à céder).
   * Défaillante, elle est gelée (ne produit plus, ne dépense plus, n'emprunte
   * plus) SAUF l'augmentation de capital : une recapitalisation qui la ramène
   * sous le plafond la fait repasser `active`. Absent = active (rétro-compat).
   */
  status?: "active" | "defaillant";
  /** Tours de crise consécutifs, pour le seuil de défaillance. Absent = 0. */
  crisisStreak?: number;
}

export interface RoundDecisions {
  price: number;
  productionPlan: number;
  marketingBudget: number;
  qualityBudget: number;
  maintenanceBudget: number;
  /**
   * Assurance : `true` = formule unique (rétro-compatible) ; `string` =
   * code de la formule choisie ; `false`/absent = non assuré.
   */
  insurance?: boolean | string;
  /**
   * Code du fournisseur choisi ce tour (si le scénario a des `suppliers`).
   * Récurrent : le choix est reconduit d'un tour à l'autre.
   */
  supplierChoice?: string;
  /**
   * Accepter la commande exceptionnelle proposée pour ce tour (si le scénario
   * a un pool `orderOffers`). Action ponctuelle : jamais reconduite.
   */
  acceptOrder?: boolean;
  /**
   * Études achetées ce tour (si le scénario a un catalogue `studies`) :
   * facturées en charges de structure, rapports délivrés avec les résultats.
   * Actions ponctuelles : jamais reconduites.
   */
  studies?: { market?: boolean; price?: boolean; finance?: boolean; project?: boolean };
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
   *
   * Avec équipements typés : `equipmentBuy` et `equipmentSell` remplacent
   * `machineCapacityUnits`. Les deux systèmes ne coexistent pas dans une
   * même partie.
   */
  investment?: {
    machineCapacityUnits?: number;
    equipmentBuy?: { typeCode: string; quantity: number }[];
    equipmentSell?: { typeCode: string; quantity: number }[];
  };
  /**
   * Financement. Avec échéancier (finance.loanDurationRounds) : les échéances
   * sont prélevées automatiquement et loanRepayment est un remboursement
   * ANTICIPÉ facultatif ; newLoan contracte un emprunt à la durée standard.
   */
  finance?: {
    newLoan?: number;
    loanRepayment?: number;
    capitalIncrease?: number;
    /**
     * Dividende versé aux associés ce tour, pris sur les RÉSERVES, c'est à
     * dire les bénéfices des tours passés mis de côté. On ne distribue jamais
     * le résultat du tour en cours : il n'est pas encore connu au moment où la
     * décision se prend, comme une assemblée statue sur l'exercice écoulé.
     */
    dividend?: number;
  };
  /** Trésorerie : montants de créances à mobiliser ce tour (actions ponctuelles). */
  treasury?: {
    discount?: number;
    factoring?: number;
    /**
     * Trésorerie placée ce tour (si le scénario porte un placementAnnualRate).
     * Elle quitte la caisse maintenant et revient au tour suivant avec ses
     * intérêts. Action ponctuelle : jamais reconduite.
     */
    placement?: number;
  };
  /**
   * Plan de trésorerie du joueur pour CE tour, déposé avec les décisions.
   * Quand le scénario ouvre un `finance.bank`, c'est la pièce du dossier
   * bancaire : sans elle la banque ne prête pas, et l'écart entre ce qui est
   * annoncé ici et ce qui sera constaté fixe les conditions du tour suivant.
   * Sans `finance.bank`, il reste un exercice d'écart sans conséquence.
   */
  forecast?: {
    /** Ventes attendues, dans l'unité du métier. */
    expectedUnits?: number;
    expectedRevenue?: number;
    expectedNetIncome?: number;
    /** Trésorerie nette attendue en fin de tour (le budget de trésorerie). */
    expectedCash?: number;
  };
}

// ---------------------------------------------------------------------------
// Sorties
// ---------------------------------------------------------------------------

export interface IncomeStatement {
  revenue: number;
  productionStocked: number; // production stockée (± variation de stock valorisée)
  cogs: number; // coût variable des unités vendues (CUMP)
  variableProductionCost: number; // coût variable des unités produites
  /**
   * Commissions versées aux canaux partenaires. Une charge de la vente, au
   * même titre que le coût des marchandises : elle se retranche AVANT la marge
   * sur coût variable, sans quoi « la marge après commission » ne se lit nulle
   * part. Absente des scénarios qui n'ont pas de canal partenaire.
   */
  commissionCost?: number;
  grossMargin: number; // marge sur coût variable des ventes, commissions déduites
  marketingCost: number;
  qualityCost: number;
  maintenanceCost: number;
  fixedCosts: number;
  ebitda: number;
  depreciation: number;
  operatingIncome: number;
  interest: number;
  /** Produits financiers du tour (intérêts du placement arrivé à terme). */
  financialIncome?: number;
  pretaxIncome: number;
  /**
   * Déficit reporté imputé sur le bénéfice de ce tour (report en avant des
   * pertes). Présent seulement quand une perte antérieure a réduit l'impôt :
   * le lecteur voit alors pourquoi l'IS est plus faible que `taxRate × résultat`.
   */
  taxLossUsed?: number;
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
  /**
   * Chiffre d'affaires du segment, au prix pratiqué. Une part de marché en
   * unités ne dit pas la dépendance à un canal quand les canaux ne se vendent
   * pas au même prix, et elle ne dit rien du tout de ce qu'il rapporte.
   */
  revenue: number;
  /** Ce que le tiers a prélevé sur ce segment (0 hors canal partenaire). */
  commission: number;
}

export interface CompanyRoundResult {
  companyId: CompanyId;
  /**
   * L'entreprise est en défaillance à l'issue de ce tour (cessation de
   * paiements tenue deux tours). Sert au plancher de score et à l'affichage.
   * Absent = active.
   */
  defaillant?: boolean;
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
    // `null` quand la marge sur coût variable est nulle ou négative : le seuil
    // de rentabilité n'existe pas (aucun volume ne le couvre).
    breakEvenUnits: number | null;
    breakEvenRevenue: number | null;
    safetyMargin: number | null;
    safetyIndex: number | null;
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
  /**
   * Commande exceptionnelle du tour (pool `orderOffers`) : acceptée ou non,
   * livrée du stock restant ; `onCredit` = part du CA partie en créances.
   */
  orderOffer?: {
    code: string;
    title: string;
    accepted: boolean;
    delivered: number;
    unitPrice: number;
    revenue: number;
    paymentDelayDays: number;
    onCredit: number;
  };
  /** Investissement du tour : capacité achetée (en service à t+1) et montant. */
  investment?: {
    capacityUnits: number;
    outlay: number;
    bought?: { typeCode: string; typeName: string; quantity: number; unitCost: number }[];
    sold?: { typeCode: string; typeName: string; quantity: number; salePrice: number; bookValue: number }[];
    saleProceeds?: number;
    disposalLoss?: number;
  };
  /** Coûts de la qualité (prévention) et de la non-qualité (défaillances). */
  qualityCosts?: {
    prevention: number;
    internalFailure: number; // rebuts valorisés au coût variable
    externalFailure: number; // retours clients remboursés
    defectUnits: number;
    returnedUnits: number;
  };
  /** Assurance du tour : prime payée, formule choisie et événements neutralisés. */
  insurance?: { premium: number; formulaCode?: string; neutralizedEvents: string[] };
  /** Fournisseur choisi ce tour : code, surcoût/économie, risque de rupture. */
  supplier?: {
    code: string;
    name: string;
    costMultiplier: number;
    qualityBonus: number;
    supplyDisruption: boolean;
  };
  /** Études achetées ce tour : lesquelles, et la facture (charge de structure). */
  studies?: { purchased: ("market" | "price" | "finance" | "project")[]; cost: number };
  /** Apport en capital du tour, borné par l'enveloppe des associés. */
  capital?: { requested: number; applied: number; remainingAfter: number };
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
    /** Placement souscrit ce tour (indisponible jusqu'au tour suivant). */
    placed: number;
    /** Placement du tour précédent revenu en caisse à l'ouverture. */
    matured: number;
    /** Intérêts encaissés sur le placement arrivé à terme. */
    placementIncome: number;
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
  /**
   * Dossier bancaire du tour (scénarios portant un `finance.bank`) : ce que
   * la banque a consenti, et ce qu'elle retient du plan déposé.
   */
  bank?: {
    /** Confiance à l'ouverture, celle qui a fixé les conditions de CE tour. */
    trustBefore: number;
    /** Confiance après lecture de l'écart entre le plan et le réalisé. */
    trustAfter: number;
    /** Fiabilité du plan de ce tour (0..1) ; null : aucun plan déposé. */
    reliability: number | null;
    /** Un plan de trésorerie accompagnait-il les décisions du tour ? */
    planFiled: boolean;
    /** Emprunt demandé, et emprunt accordé (0 si refusé faute de plan). */
    loanRequested: number;
    loanGranted: number;
    /** Plafond de découvert consenti ce tour, confiance appliquée. */
    overdraftLimit: number;
    /** Taux de découvert facturé ce tour, majoration comprise. */
    overdraftAnnualRate: number;
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
