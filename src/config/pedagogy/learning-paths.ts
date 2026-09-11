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
    pathId: "intro",
    name: "Introduction aux concepts fondamentaux",
    description: "Comprendre les bases de la gestion d'entreprise",
    steps: [
      {
        stepId: "intro_01",
        name: "La demande et le marché",
        description: "Comprendre comment fonctionne la demande du marché",
        conceptCodes: ["demand", "market_dynamics"],
        level: 1,
        prerequisites: [],
      },
      {
        stepId: "intro_02",
        name: "Coûts et prix",
        description: "Maîtriser la relation entre coûts de production et prix de vente",
        conceptCodes: ["unit_cost", "pricing"],
        level: 2,
        prerequisites: ["intro_01"],
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
