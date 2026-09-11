/**
 * Sentiers pédagogiques : séquences structurées de concepts et modèles de décision
 * qui s'assemblent en progression logique. Chaque sentier cible un domaine métier
 * et un niveau d'expertise.
 *
 * Structure : une séquence de « points d'apprentissage » où chaque point propose
 * des concepts et des modèles associés, avec un niveau cible et des prérequis.
 */

export interface LearningPathStep {
  /** Identifiant unique du point : LP-domaine-niveau-numéro (ex: LP-pricing-1-intro) */
  stepId: string;
  /** Titre court du palier pédagogique */
  title: string;
  /** Description de ce qu'on va apprendre */
  description: string;
  /** Niveau cible (1..6) */
  level: number;
  /** Concepts couverts par ce palier */
  conceptCodes: string[];
  /** Modèles de décision utilisés */
  modelCodes: string[];
  /** Étapes prérequises (autres stepId) pour accéder à celle-ci */
  prerequisites?: string[];
}

export interface LearningPathDef {
  /** Identifiant unique : LP-domaine (ex: LP-pricing) */
  pathId: string;
  /** Titre du sentier pédagogique */
  name: string;
  /** Description courte */
  description: string;
  /** Domaine principal */
  domain: string;
  /** Séquence ordonnée des points d'apprentissage */
  steps: LearningPathStep[];
}

/** Sentier 1 : Fondamentaux de la tarification */
export const LP_PRICING: LearningPathDef = {
  pathId: "LP-pricing",
  name: "Tarification & Élasticité",
  description: "Maîtriser le positionnement prix, l'élasticité-demande et les seuils psychologiques.",
  domain: "commercial",
  steps: [
    {
      stepId: "LP-pricing-1-intro",
      title: "Demande et part de marché",
      description: "Comprendre que le marché n'est pas un monolithe : il y a une demande totale et votre part de cette demande.",
      level: 1,
      conceptCodes: ["demand_market_share", "segmentation"],
      modelCodes: [],
      prerequisites: [],
    },
    {
      stepId: "LP-pricing-1-psych",
      title: "Prix psychologique",
      description: "Découvrir que la perception du prix n'est pas linéaire : les seuils symboliques comptent.",
      level: 1,
      conceptCodes: ["psych_price"],
      modelCodes: ["psych_pricing"],
      prerequisites: ["LP-pricing-1-intro"],
    },
    {
      stepId: "LP-pricing-2-elasticity",
      title: "Élasticité-prix et sensibilité",
      description: "Mesurer comment la demande réagit réellement à une variation de prix, segment par segment.",
      level: 2,
      conceptCodes: ["price_elasticity", "revenue"],
      modelCodes: ["elasticity_analysis"],
      prerequisites: ["LP-pricing-1-intro"],
    },
    {
      stepId: "LP-pricing-2-segmentation",
      title: "Segmentation et positionnement",
      description: "Appliquer une stratégie de prix différenciée selon les segments de clientèle.",
      level: 2,
      conceptCodes: ["segmentation", "revenue"],
      modelCodes: ["elasticity_analysis"],
      prerequisites: ["LP-pricing-1-intro", "LP-pricing-1-psych"],
    },
  ],
};

/** Sentier 2 : Fondamentaux de la rentabilité */
export const LP_PROFITABILITY: LearningPathDef = {
  pathId: "LP-profitability",
  name: "Coûts, Marges & Rentabilité",
  description: "Comprendre comment les coûts, les prix et les volumes génèrent la rentabilité.",
  domain: "finance",
  steps: [
    {
      stepId: "LP-profit-1-costs",
      title: "Coûts fixes et coûts variables",
      description: "Distinguer les charges qui ne bougent pas (fixes) de celles qui varient avec le volume (variables).",
      level: 1,
      conceptCodes: ["fixed_costs", "variable_costs"],
      modelCodes: [],
      prerequisites: [],
    },
    {
      stepId: "LP-profit-1-contribution",
      title: "Marge de contribution",
      description: "Calculer ce que chaque vente apporte après coûts variables : le moteur de la rentabilité.",
      level: 1,
      conceptCodes: ["contribution_margin"],
      modelCodes: ["breakeven_analysis"],
      prerequisites: ["LP-profit-1-costs"],
    },
    {
      stepId: "LP-profit-1-breakeven",
      title: "Seuil de rentabilité",
      description: "Déterminer le volume ou le CA à partir duquel l'activité devient bénéficiaire.",
      level: 1,
      conceptCodes: ["breakeven", "dead_point"],
      modelCodes: ["breakeven_analysis"],
      prerequisites: ["LP-profit-1-costs", "LP-profit-1-contribution"],
    },
    {
      stepId: "LP-profit-2-cvp",
      title: "Analyse coût-volume-profit",
      description: "Simuler en une seule formule l'effet d'une décision de prix ou de volume sur le profit.",
      level: 2,
      conceptCodes: ["contribution_margin", "fixed_costs", "variable_costs", "revenue"],
      modelCodes: ["cvp_analysis"],
      prerequisites: ["LP-profit-1-breakeven"],
    },
    {
      stepId: "LP-profit-2-margins",
      title: "Taux et marges : lire les vrais chiffres",
      description: "Décomposer rentabilité brute/nette, comprendre les effets de levier.",
      level: 2,
      conceptCodes: ["margin_rates", "ebitda_margin"],
      modelCodes: [],
      prerequisites: ["LP-profit-1-breakeven"],
    },
    {
      stepId: "LP-profit-3-relevant",
      title: "Analyse des coûts pertinents",
      description: "Ne compter que les coûts qui CHANGENT avec la décision (piège du coût complet).",
      level: 3,
      conceptCodes: ["variable_costs", "contribution_margin"],
      modelCodes: ["relevant_costs"],
      prerequisites: ["LP-profit-2-cvp"],
    },
  ],
};

/** Sentier 3 : Gestion de la trésorerie */
export const LP_CASH_FLOW: LearningPathDef = {
  pathId: "LP-cash-flow",
  name: "Trésorerie & Financement",
  description: "Comprendre pourquoi la trésorerie se dégrade même quand l'activité va bien.",
  domain: "finance",
  steps: [
    {
      stepId: "LP-cash-1-cycle",
      title: "Cycle d'exploitation et trésorerie",
      description: "Voir que la trésorerie dépend du décalage entre paiements clients et paiements fournisseurs.",
      level: 1,
      conceptCodes: ["bfr"],
      modelCodes: [],
      prerequisites: [],
    },
    {
      stepId: "LP-cash-1-frng",
      title: "FRNG : équilibre stable",
      description: "Calculer le coussin financier que crée la différence fonds propres / actif circulant.",
      level: 1,
      conceptCodes: ["frng"],
      modelCodes: [],
      prerequisites: [],
    },
    {
      stepId: "LP-cash-2-frng-bfr",
      title: "Analyse FRNG / BFR",
      description: "Décomposer la trésorerie nette en partie stable et partie cyclique du besoin.",
      level: 3,
      conceptCodes: ["frng", "bfr", "net_treasury"],
      modelCodes: ["frng_bfr_analysis"],
      prerequisites: ["LP-cash-1-cycle", "LP-cash-1-frng"],
    },
    {
      stepId: "LP-cash-2-budget",
      title: "Budget de trésorerie",
      description: "Prévoir mois par mois les encaissements et décaissements pour anticiper les impasses.",
      level: 3,
      conceptCodes: ["net_treasury", "bfr"],
      modelCodes: ["cash_budget"],
      prerequisites: ["LP-cash-1-cycle"],
    },
  ],
};

/** Sentier 4 : Production et capacité */
export const LP_PRODUCTION: LearningPathDef = {
  pathId: "LP-production",
  name: "Production & Capacité",
  description: "Dimensionner production et stocks pour répondre à la demande sans surcoût.",
  domain: "production",
  steps: [
    {
      stepId: "LP-prod-1-stock",
      title: "Stock et rotation",
      description: "Comprendre le coût du stock : une ressource immobilisée, un risque d'obsolescence.",
      level: 1,
      conceptCodes: ["stock", "stock_rotation"],
      modelCodes: [],
      prerequisites: [],
    },
    {
      stepId: "LP-prod-1-saisonnality",
      title: "Saisonnalité",
      description: "Anticiper les pics de demande et produire à l'avance : au tour 3 pour vendre au tour 4.",
      level: 1,
      conceptCodes: ["seasonality"],
      modelCodes: [],
      prerequisites: [],
    },
    {
      stepId: "LP-prod-2-capacity",
      title: "Analyse de capacité",
      description: "Confronter la demande prévisible aux capacités machine et main-d'œuvre.",
      level: 2,
      conceptCodes: ["capacity", "seasonality"],
      modelCodes: ["capacity_analysis"],
      prerequisites: ["LP-prod-1-stock", "LP-prod-1-saisonnality"],
    },
    {
      stepId: "LP-prod-2-productivity",
      title: "Productivité et efficacité",
      description: "Mesurer la production par unité de ressource et identifier les gisements d'efficacité.",
      level: 3,
      conceptCodes: ["productivity", "capacity"],
      modelCodes: ["productivity_analysis"],
      prerequisites: ["LP-prod-2-capacity"],
    },
  ],
};

/** Sentier 5 : Analyse & décision */
export const LP_ANALYSIS: LearningPathDef = {
  pathId: "LP-analysis",
  name: "Analyse & Prise de Décision",
  description: "Outils pour structurer et valider les choix stratégiques et tactiques.",
  domain: "analysis",
  steps: [
    {
      stepId: "LP-ana-1-variance",
      title: "Analyse des écarts",
      description: "Décomposer l'écart prévu/réalisé en effets prix, volume et coût pour diagnostiquer.",
      level: 2,
      conceptCodes: ["revenue", "variable_costs"],
      modelCodes: ["variance_analysis"],
      prerequisites: [],
    },
    {
      stepId: "LP-ana-2-sensitivity",
      title: "Analyse de sensibilité",
      description: "Faire varier une hypothèse et mesurer l'impact : identifier les vrais leviers.",
      level: 4,
      conceptCodes: ["safety_margin"],
      modelCodes: ["sensitivity_analysis"],
      prerequisites: [],
    },
    {
      stepId: "LP-ana-2-scenarios",
      title: "Méthode des scénarios",
      description: "Chiffrer des futurs contrastés (optimiste/central/pessimiste) pour décider en incertitude.",
      level: 4,
      conceptCodes: [],
      modelCodes: ["scenarios_method"],
      prerequisites: [],
    },
    {
      stepId: "LP-ana-3-multicriteria",
      title: "Matrice multicritère",
      description: "Structurer un choix quand plusieurs critères importent et pas un seul ne décide.",
      level: 2,
      conceptCodes: [],
      modelCodes: ["multicriteria_matrix"],
      prerequisites: [],
    },
  ],
};

/** Sentier 6 : Investissement et création de valeur */
export const LP_INVESTMENT: LearningPathDef = {
  pathId: "LP-investment",
  name: "Investissement & Création de Valeur",
  description: "Évaluer et choisir les investissements : VAN, TRI, retour sur investissement.",
  domain: "profitability",
  steps: [
    {
      stepId: "LP-inv-1-return",
      title: "Analyse de rentabilité",
      description: "Rapporter le résultat aux capitaux engagés (rentabilité économique et financière).",
      level: 4,
      conceptCodes: ["profitability_vs_return"],
      modelCodes: ["return_analysis"],
      prerequisites: [],
    },
    {
      stepId: "LP-inv-2-npv",
      title: "VAN (Valeur Actuelle Nette)",
      description: "Actualiser les flux futurs d'un investissement pour décider si créer de la valeur.",
      level: 5,
      conceptCodes: ["profitability_vs_return"],
      modelCodes: ["npv"],
      prerequisites: ["LP-inv-1-return"],
    },
    {
      stepId: "LP-inv-2-irr",
      title: "TRI (Taux de Rentabilité Interne)",
      description: "Trouver le taux d'actualisation qui annule la VAN : comparer au coût du financement.",
      level: 5,
      conceptCodes: ["profitability_vs_return"],
      modelCodes: ["irr"],
      prerequisites: ["LP-inv-2-npv"],
    },
  ],
};

/** Tous les sentiers pédagogiques */
export const LEARNING_PATHS: LearningPathDef[] = [
  LP_PRICING,
  LP_PROFITABILITY,
  LP_CASH_FLOW,
  LP_PRODUCTION,
  LP_ANALYSIS,
  LP_INVESTMENT,
];

/**
 * Récupère un sentier par son ID
 */
export function learningPathById(pathId: string): LearningPathDef | undefined {
  return LEARNING_PATHS.find((p) => p.pathId === pathId);
}

/**
 * Récupère une étape de sentier par son ID
 */
export function learningPathStepById(stepId: string): LearningPathStep | undefined {
  for (const path of LEARNING_PATHS) {
    const step = path.steps.find((s) => s.stepId === stepId);
    if (step) return step;
  }
  return undefined;
}

/**
 * Vérifie que les prérequis d'une étape sont satisfaits (valuation sur les stepIds complétés)
 */
export function canAccessStep(stepId: string, completedSteps: Set<string>): boolean {
  const step = learningPathStepById(stepId);
  if (!step || !step.prerequisites) return true;
  return step.prerequisites.every((prereq) => completedSteps.has(prereq));
}

/**
 * Récupère toutes les étapes accessibles à partir des étapes complétées
 */
export function accessibleSteps(completedSteps: Set<string>): LearningPathStep[] {
  const accessible: LearningPathStep[] = [];
  for (const path of LEARNING_PATHS) {
    for (const step of path.steps) {
      if (canAccessStep(step.stepId, completedSteps)) {
        accessible.push(step);
      }
    }
  }
  return accessible;
}
