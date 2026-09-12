/**
 * Sentiers pédagogiques — progression structurée en étapes, chacune couvrant
 * des concepts et ouvrant des situations.
 * À développer : spécification complète des sentiers, prérequis, et calibration.
 */

export interface LearningPathStep {
  stepId: string;
  name: string;
  description: string;
  conceptCodes: string[];
  level: 1 | 2 | 3 | 4 | 5 | 6;
  prerequisites: string[]; // stepIds qui doivent être complétées avant
}

export interface LearningPathDef {
  pathId: string;
  name: string;
  description: string;
  steps: LearningPathStep[];
}

/** Liste des sentiers pédagogiques disponibles. */
export const LEARNING_PATHS: LearningPathDef[] = [
  {
    pathId: "core",
    name: "Fondamentaux de gestion d'entreprise",
    description: "Comprendre les bases du simulateur et les concepts clés de la gestion",
    steps: [
      {
        stepId: "core_01",
        name: "Prise de poste",
        description: "Découvrir le simulateur et les éléments clés de l'entreprise",
        conceptCodes: ["demand", "production", "finance"],
        level: 1,
        prerequisites: [],
      },
      {
        stepId: "core_02",
        name: "Premiers leviers de prix",
        description: "Comprendre comment les prix affectent la demande et les marges",
        conceptCodes: ["pricing", "unit_cost", "contribution_margin"],
        level: 2,
        prerequisites: ["core_01"],
      },
      {
        stepId: "core_03",
        name: "Gestion du volume de production",
        description: "Apprendre l'impact du volume sur les coûts et la rentabilité",
        conceptCodes: ["production", "unit_cost", "breakeven"],
        level: 3,
        prerequisites: ["core_02"],
      },
    ],
  },
  {
    pathId: "market",
    name: "Dynamique et segmentation de marché",
    description: "Maîtriser les segments clients et les stratégies de positionnement",
    steps: [
      {
        stepId: "market_01",
        name: "Segments de marché",
        description: "Identifier et analyser les segments clients",
        conceptCodes: ["market_dynamics", "segmentation", "demand"],
        level: 2,
        prerequisites: ["core_02"],
      },
      {
        stepId: "market_02",
        name: "Concurrence et positionnement",
        description: "Adapter la stratégie à la concurrence et au positionnement",
        conceptCodes: ["competition", "pricing", "market_share"],
        level: 3,
        prerequisites: ["market_01"],
      },
      {
        stepId: "market_03",
        name: "Opportunités et menaces",
        description: "Analyser les changements de contexte marché",
        conceptCodes: ["market_context", "scenario_planning", "risk"],
        level: 4,
        prerequisites: ["market_02"],
      },
    ],
  },
  {
    pathId: "finance",
    name: "Gestion financière et trésorerie",
    description: "Comprendre profitabilité, liquidité et gestion du fonds de roulement",
    steps: [
      {
        stepId: "finance_01",
        name: "Résultat et profitabilité",
        description: "Lire et interpréter un compte de résultat simplifié",
        conceptCodes: ["profitability", "revenue", "expenses"],
        level: 2,
        prerequisites: ["core_02"],
      },
      {
        stepId: "finance_02",
        name: "Seuil de rentabilité",
        description: "Calculer et comprendre le seuil de rentabilité",
        conceptCodes: ["breakeven", "fixed_costs", "contribution_margin"],
        level: 3,
        prerequisites: ["finance_01"],
      },
      {
        stepId: "finance_03",
        name: "Trésorerie vs Profitabilité",
        description: "Distinguer profitabilité et liquidité, comprendre le décalage",
        conceptCodes: ["working_capital", "cash_flow", "liquidity"],
        level: 4,
        prerequisites: ["finance_02"],
      },
      {
        stepId: "finance_04",
        name: "Gestion du fonds de roulement",
        description: "Optimiser les stocks, créances et dettes pour équilibrer trésorerie",
        conceptCodes: ["working_capital", "inventory", "payment_terms"],
        level: 5,
        prerequisites: ["finance_03"],
      },
    ],
  },
  {
    pathId: "strategy",
    name: "Décisions stratégiques",
    description: "Prendre des décisions d'allocation de ressources et de croissance",
    steps: [
      {
        stepId: "strategy_01",
        name: "Allocation de budget marketing",
        description: "Comprendre l'impact du marketing sur la demande",
        conceptCodes: ["marketing", "demand", "roi"],
        level: 3,
        prerequisites: ["market_01", "finance_01"],
      },
      {
        stepId: "strategy_02",
        name: "Investissement et capacité",
        description: "Évaluer l'impact de l'investissement sur la production et la croissance",
        conceptCodes: ["investment", "capacity", "growth"],
        level: 4,
        prerequisites: ["strategy_01", "finance_02"],
      },
      {
        stepId: "strategy_03",
        name: "Arbitrages à long terme",
        description: "Prendre des décisions d'arbitrage entre croissance, sécurité et rentabilité",
        conceptCodes: ["strategy", "risk_management", "growth"],
        level: 5,
        prerequisites: ["strategy_02", "finance_04"],
      },
    ],
  },
];

/** Récupère un sentier par son ID. */
export function learningPathById(pathId: string): LearningPathDef | undefined {
  return LEARNING_PATHS.find((p) => p.pathId === pathId);
}

/** Récupère une étape par son ID, quel que soit le sentier. */
export function learningPathStepById(stepId: string): LearningPathStep | undefined {
  for (const path of LEARNING_PATHS) {
    const step = path.steps.find((s) => s.stepId === stepId);
    if (step) return step;
  }
  return undefined;
}

/** Vérifie si une étape peut être accédée (prérequis satisfaits). */
export function canAccessStep(stepId: string, completedSteps: Set<string>): boolean {
  const step = learningPathStepById(stepId);
  if (!step) return false;

  if (completedSteps.has(stepId)) {
    return true; // Déjà complétée
  }

  // Vérifier que tous les prérequis sont satisfaits
  return step.prerequisites.every((prereq) => completedSteps.has(prereq));
}

/** Récupère toutes les étapes accessibles à partir de l'état actuel. */
export function accessibleSteps(completedSteps: Set<string>): LearningPathStep[] {
  const accessible: LearningPathStep[] = [];

  for (const path of LEARNING_PATHS) {
    for (const step of path.steps) {
      if (!completedSteps.has(step.stepId) && canAccessStep(step.stepId, completedSteps)) {
        accessible.push(step);
      }
    }
  }

  return accessible;
}
