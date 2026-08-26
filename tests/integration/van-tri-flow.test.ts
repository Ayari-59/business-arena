import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Atelier VAN/TRI de bout en bout : quand l'atelier sature réellement
 * (machine à plein + demande perdue), la situation « L'atelier au taquet »
 * s'ouvre au tour suivant — la question d'investir arrive au bon moment,
 * jamais sur commande.
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
import { getTeamSituations, unlockHint } from "@/services/pedagogy.service";
import type { RoundDecisions } from "@/engine/types";

// prix cassé + plan au-delà de la machine : utilisation 100 %, demande perdue
const SATURATING: RoundDecisions = {
  price: 49,
  productionPlan: 9000,
  marketingBudget: 12000,
  qualityBudget: 3000,
  maintenanceBudget: 5000,
};

let teacherId: string;
let gameId: string;
let studentId: string;

beforeAll(async () => {
  const result = await registerTeacher({
    email: "van@test.fr",
    password: "motdepasse!",
    displayName: "M. Actualisation",
    schoolName: "Lycée du Capital",
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
  });
  gameId = game.gameId;
  await db.update(games).set({ seed: 7 }).where(eq(games.id, gameId));
  const student = await db
    .insert(users)
    .values({ email: "eleve-van@test.fr", displayName: "Élève" })
    .returning({ id: users.id });
  studentId = student[0]!.id;
  await joinGameByCode({ code: game.joinCode, userId: studentId, pseudo: "Élève" });
});

describe("atelier VAN/TRI (situation détectée « capacity_saturated »)", () => {
  it("la saturation du tour 1 ouvre « L'atelier au taquet » au tour 2", async () => {
    await submitTeamDecisions({ gameId, userId: studentId, payload: SATURATING });
    await closeCurrentRound({ gameId, teacherId });

    // préalable : l'atelier a bien saturé et perdu de la demande
    const view = await getGameView(gameId, studentId);
    const r = view!.lastResult!;
    expect(r.production.utilizationRate).toBeGreaterThanOrEqual(0.97);
    const lost = Object.values(r.market.bySegment).reduce((s, d) => s + d.lost, 0);
    const sold = Object.values(r.market.bySegment).reduce((s, d) => s + d.sold, 0);
    expect(lost).toBeGreaterThan(0.05 * sold);

    const { current } = await getTeamSituations(gameId, studentId);
    const atelier = current.find((s) => s.code === "detect_capacity_saturated");
    expect(atelier).toBeDefined();
    expect(atelier!.origin).toBe("detected");
    expect(atelier!.title).toBe("L'atelier au taquet");
  });

  it("l'indice 5 livre la méthode VAN complète (l'atelier se joue jusqu'au bout)", async () => {
    const { current } = await getTeamSituations(gameId, studentId);
    const atelier = current.find((s) => s.code === "detect_capacity_saturated")!;
    let last = { level: 0, text: "" };
    for (let i = 0; i < 5; i++) {
      last = await unlockHint({ instanceId: atelier.instanceId, userId: studentId });
    }
    expect(last.level).toBe(5);
    expect(last.text).toContain("VAN");
    expect(last.text).toContain("sous-traitance");
  });
});
