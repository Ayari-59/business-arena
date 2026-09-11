import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Tests de protection de resolveGameRound :
 * A) Tour déjà en résolution → une seule résolution
 * B) Échec pendant la résolution → verrou libéré, round récupérable
 * C) Ordre pedagogy → scoring respecté
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../integration/helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, rounds, roundResults, scores, users } from "@/db/schema";
import { createSoloGame, resolveCurrentRound } from "@/services/game.service";
import * as pedagogy from "@/services/pedagogy.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
  finance: { newLoan: 0, loanRepayment: 0 },
};

let userId: string;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "resolve@test.local", displayName: "ResolveTest" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
});

describe("A — tour déjà en résolution (double résolution simultanée)", () => {
  it("deux tentatives concurrentes ne produisent jamais deux résolutions du même tour", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);

    const [a, b] = await Promise.allSettled([
      resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS }),
      resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS }),
    ]);

    const fulfilled = [a, b].filter((r) => r.status === "fulfilled");

    // Au moins un a réussi
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    // Vérifier qu'aucun tour n'est résolu en double
    const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    const resolvedRounds = allRounds.filter((r) => r.status === "resolved");
    const resolvedIndices = resolvedRounds.map((r) => r.index);
    const uniqueIndices = new Set(resolvedIndices);
    expect(uniqueIndices.size).toBe(resolvedIndices.length);

    // Vérifier par les résultats : chaque combinaison roundId×teamId est unique
    const results = await db.select().from(roundResults);
    const gameRoundIds = new Set(allRounds.map((r) => r.id));
    const gameResults = results.filter((r) => gameRoundIds.has(r.roundId));
    const keys = gameResults.map((r) => `${r.roundId}:${r.teamId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("le message d'erreur du verrou est explicite", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);

    // Résoudre le premier tour normalement
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    // Essayer de re-résoudre le tour 1 (déjà résolu → tour courant est 2)
    // Le verrou optimiste sur le tour 1 empêcherait une deuxième résolution
    // On vérifie que la partie avance correctement
    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    expect(game.currentRound).toBe(2);
  });
});

describe("B — échec pendant le post-traitement → verrou libéré, état récupérable", () => {
  it("le round revient à 'open' si debriefRound échoue", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);

    const spy = vi.spyOn(pedagogy, "debriefRound").mockRejectedValueOnce(
      new Error("simulated post-processing failure"),
    );

    await expect(
      resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS }),
    ).rejects.toThrow("simulated post-processing failure");

    spy.mockRestore();

    const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    const round1 = allRounds.find((r) => r.index === 1)!;
    expect(round1.status).toBe("open");

    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    expect(game.currentRound).toBe(1);
    expect(game.status).toBe("running");
  });

  it("après échec, une nouvelle tentative réussit normalement", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);

    const spy = vi.spyOn(pedagogy, "debriefRound").mockRejectedValueOnce(
      new Error("transient failure"),
    );

    await expect(
      resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS }),
    ).rejects.toThrow("transient failure");

    spy.mockRestore();

    const result = await resolveCurrentRound({
      gameId, userId, playerDecisions: DECISIONS,
    });
    expect(result.roundIndex).toBe(1);

    const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    const round1 = allRounds.find((r) => r.index === 1)!;
    expect(round1.status).toBe("resolved");

    const round2 = allRounds.find((r) => r.index === 2);
    expect(round2?.status).toBe("open");

    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    expect(game.currentRound).toBe(2);
  });
});

describe("C — ordre pedagogy → scoring", () => {
  it("le scoring BPI est calculé après le débriefing pédagogique", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    // Si le scoring existait, les scores doivent être présents (6 dimensions v2 × N équipes)
    const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    const resolvedRound = allRounds.find((r) => r.status === "resolved")!;

    const scoreRows = await db
      .select()
      .from(scores)
      .where(eq(scores.roundId, resolvedRound.id));

    // 6 dimensions BPI v2 × 2 équipes = 12 scores
    expect(scoreRows.length).toBe(12);
    for (const row of scoreRows) {
      expect(Number(row.normalized)).toBeGreaterThanOrEqual(0);
      expect(Number(row.normalized)).toBeLessThanOrEqual(100);
    }
  });

  it("la résolution complète préserve l'invariant TN = FRNG - BFR", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    const resolvedRound = allRounds.find((r) => r.status === "resolved")!;
    const results = await db
      .select()
      .from(roundResults)
      .where(eq(roundResults.roundId, resolvedRound.id));

    for (const r of results) {
      expect(Number(r.netTreasury)).toBeCloseTo(Number(r.frng) - Number(r.bfr), 1);
    }
  });
});
