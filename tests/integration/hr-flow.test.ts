import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * RH de bout en bout (niveau Arbitrage) : embauche facturée puis effective au
 * tour suivant — et surtout, la reconduction automatique des décisions ne
 * ré-embauche JAMAIS (seul l'indice de salaire est récurrent).
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
  getGameView,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
  hr: { hire: 2, trainingBudget: 3000, salaryIndex: 1.05 },
};

let teacherId: string;
let gameId: string;
let studentId: string;

beforeAll(async () => {
  const result = await registerTeacher({
    email: "rh@test.fr",
    password: "motdepasse!",
    displayName: "Mme DRH",
    schoolName: "Lycée des Talents",
  });
  if ("error" in result) throw new Error(result.error);
  teacherId = result.userId;
  const orgId = (await getTeacherOrgId(teacherId))!;
  const game = await createClassGame({
    teacherId,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    level: 4, // Arbitrage : la RH s'ouvre ici (doc 08 §2)
  });
  gameId = game.gameId;
  await db.update(games).set({ seed: 7 }).where(eq(games.id, gameId)); // tours 1-2 sans tirage
  const student = await db
    .insert(users)
    .values({ email: "eleve-rh@test.fr", displayName: "Élève" })
    .returning({ id: users.id });
  studentId = student[0]!.id;
  await joinGameByCode({ code: game.joinCode, userId: studentId, pseudo: "Élève" });
});

describe("chantier RH en classe (niveau Arbitrage)", () => {
  it("la RH est exposée au niveau 4, pas au niveau 3", async () => {
    const view = await getGameView(gameId, studentId);
    expect(view!.difficulty.name).toBe("Arbitrage");
    expect(view!.enabledDecisions.hr).toBe(true);
  });

  it("tour 1 : embauche facturée, formation payée, arrivée annoncée pour t+1", async () => {
    await submitTeamDecisions({ gameId, userId: studentId, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId });
    const r = (await getGameView(gameId, studentId))!.lastResult!;
    expect(r.hr).toMatchObject({
      headcount: 4,
      hired: 2,
      departed: 0,
      trainingBudget: 3000,
      nextHeadcount: 6,
    });
    // coût du tour : 2 recrutements + formation + sur-salaire de 5 % sur 4 employés
    expect(r.hr!.cost).toBeCloseTo(2 * 3000 + 3000 + 4 * 8000 * 0.05, 2);
    // événements de fréquence Arbitrage ×1,25 dans le snapshot
    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    const snapshot = game.scenarioSnapshot as {
      events: { code: string; probability: number }[];
    };
    expect(
      snapshot.events.find((e) => e.code === "machine_breakdown")!.probability,
    ).toBeCloseTo(0.05 * 1.25, 12);
  });

  it("tour 2 sans décision : la reconduction garde l'indice de salaire mais ne ré-embauche pas", async () => {
    await closeCurrentRound({ gameId, teacherId }); // aucune décision soumise → reconduction
    const r = (await getGameView(gameId, studentId))!.lastResult!;
    expect(r.hr).toMatchObject({ headcount: 6, hired: 0, fired: 0, trainingBudget: 0 });
    expect(r.hr!.salaryIndex).toBeCloseTo(1.05, 10);
    // masse salariale : 2 salariés hors structure + sur-salaire de 5 % sur 6
    expect(r.hr!.cost).toBeCloseTo(6 * 8000 * 1.05 - 4 * 8000, 2);
    expect(r.hr!.nextHeadcount).toBe(6);
  });
});
