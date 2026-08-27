import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * Réglage « QCM de connaissances » de l'enseignant : quand il est retiré, les
 * questions ne sont plus servies, une soumission forgée est refusée, et le
 * score de la situation repose ENTIÈREMENT sur le diagnostic — sinon toutes
 * les situations plafonneraient à 50 % pour une question jamais posée.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, rounds, situationInstances, teams, users } from "@/db/schema";
import {
  createSoloGame,
  getTeacherGameView,
  resolveCurrentRound,
  setQuizEnabled,
} from "@/services/game.service";
import { getTeamSituations, submitDiagnosis, submitQuiz } from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let userId: string;
let gameId: string;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "quiz-toggle@test.local", displayName: "Enseignant" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
  gameId = await createSoloGame(userId, "quarter", 3);
});

/** Le propriétaire de la partie, pour les appels enseignant. */
async function teacherId(): Promise<string> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
  return game.createdBy;
}

describe("réglage des QCM par l'enseignant", () => {
  it("les QCM sont actifs par défaut : les questions sont servies", async () => {
    const view = await getTeamSituations(gameId, userId);
    expect(view.current.length).toBeGreaterThan(0);
    const situation = view.current[0]!;
    expect(situation.quizQuestions.length).toBeGreaterThanOrEqual(3);
    // la question du choix de modèle est toujours la dernière ajoutée
    expect(situation.quizQuestions.some((q) => q.id === "model_choice")).toBe(true);
  });

  it("désactiver retire les questions de la vue élève", async () => {
    await setQuizEnabled({ gameId, teacherId: await teacherId(), enabled: false });
    const view = await getTeamSituations(gameId, userId);
    expect(view.current[0]!.quizQuestions).toEqual([]);
    // le diagnostic, lui, reste servi : c'est le cœur de la situation
    expect(view.current[0]!.diagnosticOptions.length).toBeGreaterThan(0);
  });

  it("une soumission forgée est refusée quand les QCM sont désactivés", async () => {
    const view = await getTeamSituations(gameId, userId);
    const instanceId = view.current[0]!.instanceId;
    await expect(
      submitQuiz({ instanceId, userId, answers: { model_choice: "npv" } }),
    ).rejects.toThrow(/désactivés/);
  });

  it("la vue enseignant reflète le réglage et sait le rétablir", async () => {
    const tid = await teacherId();
    const off = await getTeacherGameView(gameId, tid);
    expect(off!.quizEnabled).toBe(false);
    await setQuizEnabled({ gameId, teacherId: tid, enabled: true });
    const on = await getTeacherGameView(gameId, tid);
    expect(on!.quizEnabled).toBe(true);
  });

  it("un enseignant ne peut pas régler la partie d'un autre", async () => {
    const other = (
      await db
        .insert(users)
        .values({ email: "intrus@test.local", displayName: "Intrus" })
        .returning({ id: users.id })
    )[0]!;
    await expect(
      setQuizEnabled({ gameId, teacherId: other.id, enabled: false }),
    ).rejects.toThrow(/introuvable/);
  });

  it("sans QCM, le score de la situation repose entièrement sur le diagnostic", async () => {
    // On répond PARFAITEMENT au diagnostic, sans aucun QCM, puis on débriefe.
    await setQuizEnabled({ gameId, teacherId: await teacherId(), enabled: false });
    const view = await getTeamSituations(gameId, userId);
    const situation = view.current[0]!;
    const def = situationByCode.get(situation.code)!;
    const perfect = def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id);
    await submitDiagnosis({ instanceId: situation.instanceId, userId, selectedOptionIds: perfect });

    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const team = (
      await db
        .select()
        .from(teams)
        .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")))
    )[0]!;
    const firstRound = (
      await db.select().from(rounds).where(and(eq(rounds.gameId, gameId), eq(rounds.index, 1)))
    )[0]!;
    const instance = (
      await db
        .select()
        .from(situationInstances)
        .where(
          and(
            eq(situationInstances.roundId, firstRound.id),
            eq(situationInstances.teamId, team.id),
          ),
        )
    )[0]!;

    expect(instance.status).toBe("debriefed");
    const score = (instance.diagnosis as { finalScore?: number }).finalScore!;
    // Diagnostic parfait et aucun indice utilisé → score plein. Avec la
    // pondération 50/50 d'un QCM jamais posé, il serait plafonné à 0,5.
    expect(score).toBeCloseTo(1, 6);
  });
});
