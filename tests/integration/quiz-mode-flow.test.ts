import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * Réglage des questions posées dans les situations, à trois positions.
 *
 * Le point pédagogique : les questions de CONNAISSANCES et la question du
 * MODÈLE d'analyse ne se valent pas. Les premières redemandent hors contexte
 * ce que le diagnostic teste déjà ; la seconde est la compétence propre de la
 * plateforme. Le réglage doit donc pouvoir retirer les unes sans l'autre, et
 * quand plus rien n'est posé, le débriefing doit CONTINUER à donner le modèle
 * attendu : sinon retirer les questions retirerait la leçon de la situation.
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
  setQuizMode,
} from "@/services/game.service";
import { getTeamSituations, submitDiagnosis, submitQuiz } from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";
import { MODEL_QUESTION_ID } from "@/config/scenarios/situation-kit";
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
    .values({ email: "quiz-mode@test.local", displayName: "Enseignant" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
  gameId = await createSoloGame(userId, "quarter", 3);
});

/** Le propriétaire de la partie, pour les appels enseignant. */
async function teacherId(): Promise<string> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
  return game.createdBy;
}

async function firstSituation() {
  const view = await getTeamSituations(gameId, userId);
  return view.current[0]!;
}

describe("réglage des questions par l'enseignant", () => {
  it("une partie publique jouée seul ne pose que la question du modèle", async () => {
    // On n'interroge pas sur des définitions quelqu'un qui découvre la
    // plateforme sans professeur. Reste la compétence propre du jeu, qui se
    // répond en jouant et non en révisant.
    const situation = await firstSituation();
    expect(situation.quizQuestions.map((q) => q.id)).toEqual([MODEL_QUESTION_ID]);
    // le diagnostic reste servi dans tous les cas : c'est le cœur de la situation
    expect(situation.diagnosticOptions.length).toBeGreaterThan(0);
  });

  it("« connaissances et modèle » ajoute les questions écrites de la situation", async () => {
    await setQuizMode({ gameId, teacherId: await teacherId(), mode: "full" });
    const situation = await firstSituation();
    expect(situation.quizQuestions.length).toBeGreaterThanOrEqual(3);
    expect(situation.quizQuestions.some((q) => q.id === MODEL_QUESTION_ID)).toBe(true);
    // et on revient au réglage de la partie solo pour la suite du scénario
    await setQuizMode({ gameId, teacherId: await teacherId(), mode: "model" });
  });

  it("« modèle seul » : une réponse à une question de connaissances est ignorée", async () => {
    const situation = await firstSituation();
    const def = situationByCode.get(situation.code)!;
    const knowledge = def.quiz.find((q) => q.id !== MODEL_QUESTION_ID)!;
    const model = def.quiz.find((q) => q.id === MODEL_QUESTION_ID)!;
    // On répond juste au modèle, et n'importe comment à une question non posée.
    const { score } = await submitQuiz({
      instanceId: situation.instanceId,
      userId,
      answers: {
        [model.id]: model.correctOptionId,
        [knowledge.id]: knowledge.options.find((o) => o.id !== knowledge.correctOptionId)!.id,
      },
    });
    // Le score porte sur la SEULE question posée : la mauvaise réponse à une
    // question retirée ne doit pas peser.
    expect(score).toBeCloseTo(1, 6);
  });

  it("« aucune question » ne sert rien et refuse une soumission forgée", async () => {
    // Partie neuve : sur celle du dessus le QCM est déjà validé, et c'est
    // cette garde-là qui répondrait, pas le réglage qu'on veut vérifier.
    const fresh = await createSoloGame(userId, "quarter", 3);
    const freshGame = (await db.select().from(games).where(eq(games.id, fresh)))[0]!;
    await setQuizMode({ gameId: fresh, teacherId: freshGame.createdBy, mode: "off" });
    const situation = (await getTeamSituations(fresh, userId)).current[0]!;
    expect(situation.quizQuestions).toEqual([]);
    await expect(
      submitQuiz({
        instanceId: situation.instanceId,
        userId,
        answers: { [MODEL_QUESTION_ID]: "npv" },
      }),
    ).rejects.toThrow(/désactivés/);
  });

  it("la vue enseignant reflète le réglage et sait revenir en arrière", async () => {
    const tid = await teacherId();
    expect((await getTeacherGameView(gameId, tid))!.quizMode).toBe("model");
    await setQuizMode({ gameId, teacherId: tid, mode: "full" });
    expect((await getTeacherGameView(gameId, tid))!.quizMode).toBe("full");
  });

  it("un enseignant ne peut pas régler la partie d'un autre", async () => {
    const other = (
      await db
        .insert(users)
        .values({ email: "intrus-quiz-mode@test.local", displayName: "Intrus" })
        .returning({ id: users.id })
    )[0]!;
    await expect(
      setQuizMode({ gameId, teacherId: other.id, mode: "off" }),
    ).rejects.toThrow(/introuvable/);
  });

  it("sans question, le score repose entièrement sur le diagnostic et le modèle reste expliqué", async () => {
    // Diagnostic PARFAIT, aucune question posée, aucun indice, puis débriefing.
    await setQuizMode({ gameId, teacherId: await teacherId(), mode: "off" });
    const situation = await firstSituation();
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
    // Avec la pondération 50/50 d'une question jamais posée, il serait à 0,5.
    expect((instance.diagnosis as { finalScore?: number }).finalScore!).toBeCloseTo(1, 6);

    // Et le débriefing donne quand même le modèle attendu, en lecture seule.
    const after = await getTeamSituations(gameId, userId);
    const debriefed = after.debriefed.find((s) => s.instanceId === situation.instanceId)!;
    expect(debriefed.debrief!.modelInsight).not.toBeNull();
    expect(debriefed.debrief!.modelInsight!.answer.length).toBeGreaterThan(0);
    expect(debriefed.debrief!.modelInsight!.explain.length).toBeGreaterThan(0);
  });
});
