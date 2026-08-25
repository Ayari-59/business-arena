import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Tirage manuel de cartes (animation de classe) sur Postgres embarqué :
 * l'enseignant tire → la carte est annoncée aux équipes → appliquée à la
 * clôture → effet réel sur le moteur → purge. Interdit en mode compétition.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, users } from "@/db/schema";
import { registerTeacher, getTeacherOrgId } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  drawEventCardForNextRound,
  getGameView,
  getTeacherGameView,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import { createCompetition, joinCompetition, startQualification } from "@/services/competition.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let teacherId: string;
let orgId: string;
let gameId: string;
let studentId: string;

beforeAll(async () => {
  const result = await registerTeacher({
    email: "cartes@test.fr",
    password: "motdepasse!",
    displayName: "Mme Cartes",
    schoolName: "Lycée des Cartes",
  });
  if ("error" in result) throw new Error(result.error);
  teacherId = result.userId;
  orgId = (await getTeacherOrgId(teacherId))!;
  const game = await createClassGame({
    teacherId,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
  });
  gameId = game.gameId;
  const student = await db
    .insert(users)
    .values({ email: "eleve-cartes@test.fr", displayName: "Élève" })
    .returning({ id: users.id });
  studentId = student[0]!.id;
  await joinGameByCode({ code: game.joinCode, userId: studentId, pseudo: "Élève" });
});

describe("tirage manuel de cartes (mode apprentissage)", () => {
  it("l'enseignant joue une carte choisie : annoncée aux équipes", async () => {
    await expect(
      drawEventCardForNextRound({ gameId, teacherId: studentId }),
    ).rejects.toThrow(); // seul l'enseignant tire
    const { eventCode } = await drawEventCardForNextRound({
      gameId,
      teacherId,
      eventCode: "supplier_discount",
    });
    expect(eventCode).toBe("supplier_discount");

    const teacherView = await getTeacherGameView(gameId, teacherId);
    expect(teacherView!.pendingEventCodes).toEqual(["supplier_discount"]);
    const playerView = await getGameView(gameId, studentId);
    expect(playerView!.announcedEventCards).toEqual(["supplier_discount"]);
  });

  it("plafond de 2 cartes, pas de doublon", async () => {
    await drawEventCardForNextRound({ gameId, teacherId }); // pioche au hasard
    await expect(
      drawEventCardForNextRound({ gameId, teacherId, eventCode: "supplier_discount" }),
    ).rejects.toThrow(); // 2 cartes déjà en jeu
  });

  it("à la clôture : la carte est appliquée au moteur, affichée, puis purgée", async () => {
    await submitTeamDecisions({ gameId, userId: studentId, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId });

    const view = await getGameView(gameId, studentId);
    expect(view!.lastEvents).toContain("supplier_discount");
    expect(view!.announcedEventCards).toEqual([]); // purgées

    // effet réel : matières −10 % → coût variable de production = 4800 × (22×0,9 + 16)
    const produced = view!.lastResult!.production.produced;
    expect(view!.lastResult!.incomeStatement.variableProductionCost).toBeCloseTo(
      produced * (22 * 0.9 + 16),
      4,
    );
  });

  it("interdit en mode compétition (seul le tirage seedé fait foi)", async () => {
    const competition = await createCompetition({
      organizerId: teacherId,
      organizationId: orgId,
      name: "Concours cartes",
      periodicity: "quarter",
      groupSize: 2,
      advancePerGroup: 1,
    });
    const a = await db.insert(users).values({ email: "a@c.fr", displayName: "A" }).returning({ id: users.id });
    const b = await db.insert(users).values({ email: "b@c.fr", displayName: "B" }).returning({ id: users.id });
    await joinCompetition({ code: competition.joinCode, userId: a[0]!.id, teamLabel: "AA" });
    await joinCompetition({ code: competition.joinCode, userId: b[0]!.id, teamLabel: "BB" });
    await startQualification({ competitionId: competition.competitionId, organizerId: teacherId });
    const competitionGame = (await db.select().from(games)).find((g) => g.mode === "competition")!;
    await expect(
      drawEventCardForNextRound({ gameId: competitionGame.id, teacherId }),
    ).rejects.toThrow(/compétition/);
  });
});
