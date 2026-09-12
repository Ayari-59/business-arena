/**
 * Service de progression pédagogique — tracking des étapes complétées,
 * validation des prérequis, et calcul de maîtrise conceptuelle.
 */

import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  completedLearningSteps,
  learningPathProgression,
} from "@/db/schema/pedagogy";
import { teams, players } from "@/db/schema/game";
import {
  LEARNING_PATHS,
  learningPathById,
  learningPathStepById,
  canAccessStep,
  accessibleSteps,
  type LearningPathDef,
  type LearningPathStep,
} from "@/config/pedagogy/learning-paths";
import { CONCEPTS, type ConceptDef } from "@/config/pedagogy/concepts";

export interface UserPedagogicalProgress {
  userId: string;
  completedSteps: Set<string>;
  masteredConcepts: Set<string>;
  currentPathId?: string;
}

export interface PedagogicalState {
  completedSteps: string[];
  masteredConcepts: string[];
  currentPathId?: string;
  accessibleSteps: LearningPathStep[];
  accessiblePaths: LearningPathDef[];
}

/**
 * Récupère la liste complète des sentiers pédagogiques
 */
export function getAllLearningPaths(): LearningPathDef[] {
  return LEARNING_PATHS;
}

/**
 * Récupère un sentier par son ID
 */
export function getLearningPath(pathId: string): LearningPathDef | undefined {
  return learningPathById(pathId);
}

/**
 * Récupère une étape par son ID
 */
export function getLearningStep(stepId: string): LearningPathStep | undefined {
  return learningPathStepById(stepId);
}

/**
 * Valide qu'une étape peut être complétée (prérequis satisfaits)
 */
export function canCompleteStep(
  stepId: string,
  completedSteps: string[]
): boolean {
  return canAccessStep(stepId, new Set(completedSteps));
}

/**
 * Récupère toutes les étapes accessibles à partir de la progression actuelle
 */
export function getAccessibleSteps(completedSteps: string[]): LearningPathStep[] {
  return accessibleSteps(new Set(completedSteps));
}

/**
 * Complète une étape et retourne les concepts maîtrisés
 */
export function completeStep(
  stepId: string,
  completedSteps: string[]
): { newCompleted: string[]; masteredConcepts: string[] } {
  const step = getLearningStep(stepId);
  if (!step) {
    return { newCompleted: completedSteps, masteredConcepts: [] };
  }

  const alreadyCompleted = new Set(completedSteps);
  if (!canCompleteStep(stepId, completedSteps)) {
    return { newCompleted: completedSteps, masteredConcepts: [] };
  }

  alreadyCompleted.add(stepId);
  return {
    newCompleted: Array.from(alreadyCompleted),
    masteredConcepts: step.conceptCodes,
  };
}

/**
 * Calcule l'état pédagogique complet d'un utilisateur
 */
export function computePedagogicalState(
  completedSteps: string[],
  masteredConcepts: string[],
  currentPathId?: string
): PedagogicalState {
  const completedSet = new Set(completedSteps);

  return {
    completedSteps,
    masteredConcepts,
    currentPathId,
    accessibleSteps: getAccessibleSteps(completedSteps),
    accessiblePaths: LEARNING_PATHS.filter((path) =>
      path.steps.some((step) =>
        canAccessStep(step.stepId, completedSet)
      )
    ),
  };
}

/**
 * Récupère le concept par son code
 */
export function getConceptByCode(code: string): ConceptDef | undefined {
  return CONCEPTS.find((c) => c.code === code);
}

/**
 * Récupère les prérequis d'un concept (concepts qui doivent être maîtrisés d'abord)
 */
export function getConceptPrerequisites(
  conceptCode: string
): ConceptDef[] {
  const concept = getConceptByCode(conceptCode);
  if (!concept || !concept.prerequisites) {
    return [];
  }

  return concept.prerequisites
    .map((code: string) => getConceptByCode(code))
    .filter((c: ConceptDef | undefined) => c !== undefined) as ConceptDef[];
}

/**
 * Calcule le niveau de maîtrise d'un concept (0-6) basé sur les étapes complétées
 */
export function getConceptMasteryLevel(
  conceptCode: string,
  completedSteps: string[]
): number {
  const completedSet = new Set(completedSteps);

  // Trouver toutes les étapes qui couvrent ce concept
  const relevantSteps = LEARNING_PATHS.flatMap((path) =>
    path.steps.filter(
      (step) =>
        step.conceptCodes.includes(conceptCode) &&
        completedSet.has(step.stepId)
    )
  );

  if (relevantSteps.length === 0) {
    return 0;
  }

  // Le niveau de maîtrise est le maximum des niveaux des étapes complétées
  return Math.max(...relevantSteps.map((step) => step.level));
}

/**
 * Récupère le plan d'apprentissage recommandé basé sur la progression actuelle
 */
export function getRecommendedNextSteps(
  completedSteps: string[],
  maxRecommendations: number = 3
): LearningPathStep[] {
  const accessible = getAccessibleSteps(completedSteps);

  // Trier par niveau (priorité aux étapes proches du niveau actuel)
  // puis par ordre d'apparition dans le sentier
  return accessible
    .sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return 0;
    })
    .slice(0, maxRecommendations);
}

/**
 * Calcule le score de progression globale (0-100)
 * Basé sur le nombre d'étapes complétées sur le total
 */
export function getProgressionScore(completedSteps: string[]): number {
  const totalSteps = LEARNING_PATHS.reduce(
    (sum, path) => sum + path.steps.length,
    0
  );
  if (totalSteps === 0) {
    return 0;
  }
  return Math.round((completedSteps.length / totalSteps) * 100);
}

/**
 * Valide que les prérequis d'un concept sont maîtrisés
 */
export function areConceptPrerequisitesMet(
  conceptCode: string,
  masteredConcepts: string[]
): boolean {
  const concept = getConceptByCode(conceptCode);
  if (!concept || !concept.prerequisites) {
    return true;
  }

  const masteredSet = new Set(masteredConcepts);
  return concept.prerequisites.every((prereq: string) => masteredSet.has(prereq));
}

/**
 * Récupère les étapes complétées pour un utilisateur depuis la base de données
 */
export async function getCompletedStepsForUser(userId: string): Promise<string[]> {
  const rows = await db
    .select({ stepId: completedLearningSteps.stepId })
    .from(completedLearningSteps)
    .where(eq(completedLearningSteps.userId, userId));
  return rows.map((r) => r.stepId);
}

/**
 * Récupère la progression d'apprentissage pour un utilisateur et un sentier
 */
export async function getLearningPathProgressForUser(
  userId: string,
  pathId: string
): Promise<{
  startedAt: Date | null;
  completionScore: number;
  completedSteps: number;
} | null> {
  const row = await db
    .select({
      startedAt: learningPathProgression.startedAt,
      completionScore: learningPathProgression.completionScore,
    })
    .from(learningPathProgression)
    .where(
      and(
        eq(learningPathProgression.userId, userId),
        eq(learningPathProgression.pathId, pathId)
      )
    );

  if (!row || row.length === 0) {
    return null;
  }

  const rowData = row[0];
  if (!rowData) {
    return null;
  }

  const path = learningPathById(pathId);
  const completedSteps = path
    ? (await getCompletedStepsForUser(userId)).filter((stepId) =>
        path.steps.some((s) => s.stepId === stepId)
      ).length
    : 0;

  return {
    startedAt: rowData.startedAt,
    completionScore: Number(rowData.completionScore),
    completedSteps,
  };
}

/**
 * Vérifie si une situation est accessible pour un utilisateur
 * basée sur ses étapes complétées de sentiers pédagogiques
 */
export function isSituationAccessible(
  requiredSteps: string[] | undefined,
  completedSteps: string[]
): boolean {
  if (!requiredSteps || requiredSteps.length === 0) {
    return true; // Aucun prérequis = accessible à tous
  }

  const completedSet = new Set(completedSteps);
  return requiredSteps.every((stepId) => completedSet.has(stepId));
}

/**
 * Récupère la progression d'apprentissage pour tous les utilisateurs d'une équipe
 */
export async function getTeamLearningProgress(teamId: string) {
  // Fetch team info and players
  const teamData = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
    })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!teamData || teamData.length === 0) {
    return {
      teamId,
      teamName: "Équipe inconnue",
      completedSteps: [] as string[],
      progressByPath: [] as Array<{
        pathId: string;
        pathName: string;
        completed: number;
        total: number;
      }>,
    };
  }

  const team = teamData[0]!;

  // Get all players in the team
  const playerRows = await db
    .select({ userId: players.userId })
    .from(players)
    .where(eq(players.teamId, teamId));

  const userIds = playerRows.map((p) => p.userId);

  if (userIds.length === 0) {
    return {
      teamId,
      teamName: team.teamName,
      completedSteps: [] as string[],
      progressByPath: LEARNING_PATHS.map((path) => ({
        pathId: path.pathId,
        pathName: path.name,
        completed: 0,
        total: path.steps.length,
      })),
    };
  }

  // Get all completed steps for all players in team
  const completedStepsRows = await db
    .select({
      userId: completedLearningSteps.userId,
      stepId: completedLearningSteps.stepId,
      pathId: completedLearningSteps.pathId,
    })
    .from(completedLearningSteps)
    .where(inArray(completedLearningSteps.userId, userIds));

  // Aggregate unique completed steps across all players
  const uniqueCompletedSteps = new Set(completedStepsRows.map((r) => r.stepId));
  const completedStepsByPath = new Map<string, Set<string>>();

  for (const row of completedStepsRows) {
    if (!completedStepsByPath.has(row.pathId)) {
      completedStepsByPath.set(row.pathId, new Set());
    }
    completedStepsByPath.get(row.pathId)!.add(row.stepId);
  }

  // Build progress by path
  const progressByPath = LEARNING_PATHS.map((path) => ({
    pathId: path.pathId,
    pathName: path.name,
    completed: completedStepsByPath.get(path.pathId)?.size ?? 0,
    total: path.steps.length,
  }));

  return {
    teamId,
    teamName: team.teamName,
    completedSteps: Array.from(uniqueCompletedSteps),
    progressByPath,
  };
}

/**
 * Récupère la progression d'apprentissage pour tous les utilisateurs d'un jeu
 */
export async function getGameLearningProgress(gameId: string) {
  // Get all teams in the game
  const gameTeams = await db
    .select({ teamId: teams.id })
    .from(teams)
    .where(eq(teams.gameId, gameId));

  // Get learning progress for each team
  const teamProgress = await Promise.all(
    gameTeams.map((team) => getTeamLearningProgress(team.teamId))
  );

  return teamProgress;
}

/**
 * Marque une étape comme complétée pour un utilisateur
 */
export async function markStepCompleted(
  userId: string,
  stepId: string
): Promise<void> {
  const step = getLearningStep(stepId);
  if (!step) {
    throw new Error(`Step ${stepId} not found`);
  }

  const completedSteps = await getCompletedStepsForUser(userId);
  if (completedSteps.includes(stepId)) {
    return; // Already completed
  }

  // Validate prerequisites
  if (!canCompleteStep(stepId, completedSteps)) {
    throw new Error(`Prerequisites not met for step ${stepId}`);
  }

  // Find the path this step belongs to
  const path = LEARNING_PATHS.find((p) =>
    p.steps.some((s) => s.stepId === stepId)
  );

  if (!path) {
    throw new Error(`No learning path found for step ${stepId}`);
  }

  // Insert into database
  await db.insert(completedLearningSteps).values({
    id: crypto.randomUUID(),
    userId,
    stepId,
    pathId: path.pathId,
    completedAt: new Date(),
  });

  // Update learning path progression if not already started
  const existing = await db
    .select()
    .from(learningPathProgression)
    .where(
      and(
        eq(learningPathProgression.userId, userId),
        eq(learningPathProgression.pathId, path.pathId)
      )
    );

  if (!existing || existing.length === 0) {
    await db.insert(learningPathProgression).values({
      userId,
      pathId: path.pathId,
      startedAt: new Date(),
      completionScore: "0",
    });
  }
}
