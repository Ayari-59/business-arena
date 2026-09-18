import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Distribution manuelle du courrier (animation de classe) sur Postgres
 * embarqué : courriers de marché (toute la classe) et plis adressés — annoncés,
 * appliquées à la clôture (l'effet ciblé ne touche QUE l'équipe visée),
 * puis purgées. Interdit en mode compétition.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, roundResults, rounds, users } from "@/db/schema";
import { registerTeacher, getTeacherOrgId } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  distribuerUnCourrier,
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
let studentTeamId: string;
let botTeamId: string;

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
  // graine pinée : aucun événement probabiliste au tour 1 (assertions exactes)
  await db.update(games).set({ seed: 7 }).where(eq(games.id, gameId));
  const student = await db
    .insert(users)
    .values({ email: "eleve-cartes@test.fr", displayName: "Élève" })
    .returning({ id: users.id });
  studentId = student[0]!.id;
  await joinGameByCode({ code: game.joinCode, userId: studentId, pseudo: "Élève" });
  const view = await getTeacherGameView(gameId, teacherId);
  studentTeamId = view!.teams.find((t) => t.controller === "human")!.teamId;
  botTeamId = view!.teams.find((t) => t.controller === "bot")!.teamId;
});

describe("distribution manuelle du courrier (mode apprentissage)", () => {
  it("courrier de marché : distribué par l'enseignant, annoncé à toute la classe", async () => {
    await expect(
      distribuerUnCourrier({ gameId, teacherId: studentId }),
    ).rejects.toThrow(); // seul l'enseignant tire
    const { eventCode, teamId } = await distribuerUnCourrier({
      gameId,
      teacherId,
      eventCode: "supplier_discount",
    });
    expect(eventCode).toBe("supplier_discount");
    expect(teamId).toBeNull();

    const teacherView = await getTeacherGameView(gameId, teacherId);
    expect(teacherView!.pendingEvents).toEqual([
      { code: "supplier_discount", teamId: null, teamName: null },
    ]);
    const playerView = await getGameView(gameId, studentId);
    expect(playerView!.courriersAnnonces).toEqual([
      { code: "supplier_discount", teamId: null, teamName: null, isMyTeam: false },
    ]);
  });

  it("pli adressé : envoyé à une équipe humaine, signalé à son destinataire", async () => {
    // pas de pli adressé à un bot
    await expect(
      distribuerUnCourrier({ gameId, teacherId, teamId: botTeamId }),
    ).rejects.toThrow(/introuvable/);
    // un courrier de marché ne peut pas venir de la liasse des entreprises et inversement
    await expect(
      distribuerUnCourrier({ gameId, teacherId, eventCode: "team_overtime" }),
    ).rejects.toThrow(/distribuable/);

    const { eventCode, teamId } = await distribuerUnCourrier({
      gameId,
      teacherId,
      eventCode: "local_supplier_deal",
      teamId: studentTeamId,
    });
    expect(eventCode).toBe("local_supplier_deal");
    expect(teamId).toBe(studentTeamId);

    const teacherView = await getTeacherGameView(gameId, teacherId);
    expect(teacherView!.pendingEvents).toHaveLength(2);
    expect(teacherView!.pendingEvents[1]).toMatchObject({
      code: "local_supplier_deal",
      teamId: studentTeamId,
    });
    expect(teacherView!.pendingEvents[1]!.teamName).toBeTruthy();

    const playerView = await getGameView(gameId, studentId);
    const targeted = playerView!.courriersAnnonces.find((c) => c.code === "local_supplier_deal");
    expect(targeted).toMatchObject({ teamId: studentTeamId, isMyTeam: true });
  });

  it("plafonds : 1 pli par entreprise, 2 courriers de marché, pas de doublon", async () => {
    // l'entreprise a déjà reçu son pli
    await expect(
      distribuerUnCourrier({ gameId, teacherId, teamId: studentTeamId }),
    ).rejects.toThrow(/déjà reçu un courrier/);
    // pas deux fois le même courrier de marché
    await expect(
      distribuerUnCourrier({ gameId, teacherId, eventCode: "supplier_discount" }),
    ).rejects.toThrow(/distribuable/);
    // second courrier de marché OK…
    await distribuerUnCourrier({ gameId, teacherId, eventCode: "viral_campaign" });
    // …mais pas une troisième
    await expect(
      distribuerUnCourrier({ gameId, teacherId, eventCode: "rate_cut" }),
    ).rejects.toThrow(/tout le marché/i);
  });

  it("à la clôture : l'effet ciblé ne touche QUE l'équipe visée, puis purge", async () => {
    await submitTeamDecisions({ gameId, userId: studentId, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId });

    const view = await getGameView(gameId, studentId);
    // visibilité côté entreprise destinataire : les 2 courriers de marché + SON pli
    expect(view!.lastEvents).toContain("supplier_discount");
    expect(view!.lastEvents).toContain("viral_campaign");
    expect(view!.lastEvents).toContain("local_supplier_deal");
    // Trois courriers d'un tour : rien ne pèse encore sur le tour suivant. Une
    // lettre qui vaut deux trimestres y figurerait, avec ce qu'il lui reste à courir.
    expect(view!.courriersEnCours).toEqual([]);
    expect(view!.courriersAnnonces).toEqual([]); // purgées

    // effet cumulé pour l'équipe ciblée : matières ×0,9 (marché) ×0,92 (équipe)
    const produced = view!.lastResult!.production.produced;
    expect(view!.lastResult!.incomeStatement.variableProductionCost).toBeCloseTo(
      produced * (22 * 0.9 * 0.92 + 16),
      4,
    );

    // le bot, lui, n'a que l'effet marché (×0,9) et ne reçoit pas le pli adressé
    const round1 = (await db.select().from(rounds).where(eq(rounds.gameId, gameId))).find(
      (r) => r.index === 1,
    )!;
    const botRow = (
      await db.select().from(roundResults).where(eq(roundResults.roundId, round1.id))
    ).find((r) => r.teamId === botTeamId)!;
    const botTrace = botRow.engineTrace as {
      production: { produced: number };
      events: string[];
    };
    expect(botTrace.events).toContain("supplier_discount");
    expect(botTrace.events).not.toContain("local_supplier_deal");
    const botIncome = botRow.incomeStatement as { variableProductionCost: number };
    expect(botIncome.variableProductionCost).toBeCloseTo(
      botTrace.production.produced * (22 * 0.9 + 16),
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
      distribuerUnCourrier({ gameId: competitionGame.id, teacherId }),
    ).rejects.toThrow(/compétition/);
  });
});
