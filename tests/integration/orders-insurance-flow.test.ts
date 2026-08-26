import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Commande exceptionnelle + assurance catastrophe sur Postgres embarqué :
 * l'enseignant tire la catastrophe (marché) et une commande ferme (équipe),
 * l'équipe assurée traverse le sinistre indemne (prime payée), le bot le
 * subit de plein fouet, la commande s'ajoute au CA réglée comptant.
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
  drawEventCardForNextRound,
  getGameView,
  getTeacherGameView,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import type { RoundDecisions } from "@/engine/types";

// prix élevé + plan au maximum : l'équipe garde du stock, la commande
// exceptionnelle peut donc être livrée intégralement
const DECISIONS: RoundDecisions = {
  price: 85,
  productionPlan: 7000,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
  insurance: true,
};

let teacherId: string;
let gameId: string;
let studentId: string;
let studentTeamId: string;
let botTeamId: string;

beforeAll(async () => {
  const result = await registerTeacher({
    email: "assurance@test.fr",
    password: "motdepasse!",
    displayName: "M. Prudent",
    schoolName: "Lycée du Risque",
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
  // graine pinée : aucun événement probabiliste aux tours 1-2 (assertions exactes)
  await db.update(games).set({ seed: 7 }).where(eq(games.id, gameId));
  const student = await db
    .insert(users)
    .values({ email: "eleve-assure@test.fr", displayName: "Élève" })
    .returning({ id: users.id });
  studentId = student[0]!.id;
  await joinGameByCode({ code: game.joinCode, userId: studentId, pseudo: "Élève" });
  const view = await getTeacherGameView(gameId, teacherId);
  studentTeamId = view!.teams.find((t) => t.controller === "human")!.teamId;
  botTeamId = view!.teams.find((t) => t.controller === "bot")!.teamId;
});

describe("commande exceptionnelle + assurance catastrophe (bout en bout)", () => {
  it("l'offre d'assurance du scénario est exposée au joueur", async () => {
    const view = await getGameView(gameId, studentId);
    expect(view!.insuranceOffer).toEqual({
      premium: 2500,
      coveredEventCodes: ["natural_disaster", "cold_wave"],
    });
  });

  it("catastrophe (marché) + commande ferme (équipe) : effets différenciés", async () => {
    await drawEventCardForNextRound({ gameId, teacherId, eventCode: "natural_disaster" });
    await drawEventCardForNextRound({
      gameId,
      teacherId,
      eventCode: "big_order",
      teamId: studentTeamId,
    });
    await submitTeamDecisions({ gameId, userId: studentId, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId });

    const view = await getGameView(gameId, studentId);
    const r = view!.lastResult!;

    // l'assuré : sinistre neutralisé, prime payée, matières au tarif normal
    expect(r.insurance).toEqual({ premium: 1500, formulaCode: "basic", neutralizedEvents: ["natural_disaster"] });
    expect(r.incomeStatement.variableProductionCost).toBeCloseTo(
      r.production.produced * (22 + 16),
      4,
    );

    // la commande ferme : livrée en entier, réglée comptant, ajoutée au CA
    expect(r.extraOrders).toEqual({ requested: 600, delivered: 600, subcontracted: 0, unitPrice: DECISIONS.price });
    const segmentUnits = Object.values(r.market.bySegment).reduce((s, d) => s + d.sold, 0);
    expect(r.incomeStatement.revenue).toBeCloseTo(
      (segmentUnits + 600) * DECISIONS.price,
      2,
    );

    // visibilité : l'équipe voit ses deux cartes
    expect(view!.lastEvents).toContain("natural_disaster");
    expect(view!.lastEvents).toContain("big_order");

    // le bot, non assuré : matières ×1,12 et pas de commande dans sa trace
    const round1 = (await db.select().from(rounds).where(eq(rounds.gameId, gameId))).find(
      (row) => row.index === 1,
    )!;
    const botRow = (
      await db.select().from(roundResults).where(eq(roundResults.roundId, round1.id))
    ).find((row) => row.teamId === botTeamId)!;
    const botTrace = botRow.engineTrace as {
      production: { produced: number };
      events: string[];
      insurance: unknown;
    };
    expect(botTrace.events).toContain("natural_disaster");
    expect(botTrace.events).not.toContain("big_order");
    expect(botTrace.insurance).toBeNull();
    const botIncome = botRow.incomeStatement as { variableProductionCost: number };
    expect(botIncome.variableProductionCost).toBeCloseTo(
      botTrace.production.produced * (22 * 1.12 + 16),
      4,
    );
  });

  it("l'assurance se reconduit avec les décisions : prime payée sans sinistre", async () => {
    // tour 2 sans nouvelle carte : les décisions (assurance comprise) sont reconduites
    await submitTeamDecisions({ gameId, userId: studentId, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId });
    const view = await getGameView(gameId, studentId);
    expect(view!.lastResult!.insurance).toEqual({ premium: 1500, formulaCode: "basic", neutralizedEvents: [] });
    expect(view!.lastResult!.extraOrders).toBeUndefined();
  });
});
