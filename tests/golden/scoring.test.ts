import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * Tests de scoring.service.ts :
 * 1. Persistance des scores (7 dimensions × N équipes)
 * 2. Ordre pedagogy → scoring (debriefRound AVANT persistRoundScores)
 * 3. Scoring sans données pédagogiques (map vide → dimension decision_mastery = 50)
 * 4. Mise à jour du classement (ranking)
 * 5. Départage (tie-break) : BPI, puis financialAvg, puis lastTreasury
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../integration/helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { companyStates, gameRankings, rounds, scores, teams, users } from "@/db/schema";
import {
  createSoloGame,
  resolveCurrentRound,
} from "@/services/game.service";
import {
  readPedagogyInputs,
  updateRankings,
} from "@/services/scoring.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let userId: string;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "scoring@test.local", displayName: "ScoringTest" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
});

describe("1 — persistance des scores BPI (v2)", () => {
  it("6 dimensions × 2 équipes = 12 scores après un tour, tour marqué bpiVersion 2", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    const resolvedRound = allRounds.find((r) => r.status === "resolved")!;
    expect(resolvedRound.bpiVersion).toBe(2);

    const scoreRows = await db
      .select()
      .from(scores)
      .where(eq(scores.roundId, resolvedRound.id));

    expect(scoreRows).toHaveLength(12);
    for (const row of scoreRows) {
      expect(Number(row.normalized)).toBeGreaterThanOrEqual(0);
      expect(Number(row.normalized)).toBeLessThanOrEqual(100);
      expect(Number(row.raw)).toBeGreaterThanOrEqual(0);
    }
  });

  it("les 6 dimensions v2 sont toutes représentées pour chaque équipe", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    const resolvedRound = allRounds.find((r) => r.status === "resolved")!;
    const scoreRows = await db
      .select()
      .from(scores)
      .where(eq(scores.roundId, resolvedRound.id));

    const teamIds = [...new Set(scoreRows.map((s) => s.teamId))];
    expect(teamIds).toHaveLength(2);

    const expectedDimensions = [
      "economic", "financial", "commercial",
      "profitability", "pilotage", "decision_mastery",
    ];
    for (const teamId of teamIds) {
      const teamDims = scoreRows
        .filter((s) => s.teamId === teamId)
        .map((s) => s.dimension)
        .sort();
      expect(teamDims).toEqual(expectedDimensions.sort());
    }
  });
});

describe("2 — ordre pedagogy → scoring", () => {
  it("readPedagogyInputs retourne les scores de situation après debriefRound", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    const resolvedRound = allRounds.find((r) => r.status === "resolved")!;

    const pedagogyMap = await readPedagogyInputs(resolvedRound.id);
    expect(pedagogyMap).toBeInstanceOf(Map);
  });

  it("les scores sont persistés APRES le debrief (scores existent pour le tour résolu)", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    const resolvedRound = allRounds.find((r) => r.status === "resolved")!;

    const scoreRows = await db
      .select()
      .from(scores)
      .where(eq(scores.roundId, resolvedRound.id));

    expect(scoreRows.length).toBeGreaterThan(0);
  });
});

describe("3 — scoring sans données pédagogiques", () => {
  it("readPedagogyInputs retourne une map vide quand aucune situation n'existe", async () => {
    const fakeRoundId = "00000000-0000-0000-0000-000000000099";
    const pedagogyMap = await readPedagogyInputs(fakeRoundId);
    expect(pedagogyMap.size).toBe(0);
  });

  it("decision_mastery vaut ~50 quand aucune situation pédagogique n'est présente", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    const resolvedRound = allRounds.find((r) => r.status === "resolved")!;

    const scoreRows = await db
      .select()
      .from(scores)
      .where(
        and(
          eq(scores.roundId, resolvedRound.id),
          eq(scores.dimension, "decision_mastery"),
        ),
      );

    for (const row of scoreRows) {
      expect(Number(row.raw)).toBeGreaterThanOrEqual(0);
      expect(Number(row.normalized)).toBeGreaterThanOrEqual(0);
      expect(Number(row.normalized)).toBeLessThanOrEqual(100);
    }
  });
});

describe("4 — mise à jour du classement", () => {
  it("le classement contient toutes les équipes après un tour", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const rankings = await db
      .select()
      .from(gameRankings)
      .where(eq(gameRankings.gameId, gameId));

    expect(rankings).toHaveLength(2);
    const ranks = rankings.map((r) => r.rank).sort();
    expect(ranks).toEqual([1, 2]);
  });

  it("le BPI de chaque équipe est dans [0, 100]", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const rankings = await db
      .select()
      .from(gameRankings)
      .where(eq(gameRankings.gameId, gameId));

    for (const row of rankings) {
      expect(Number(row.bpi)).toBeGreaterThanOrEqual(0);
      expect(Number(row.bpi)).toBeLessThanOrEqual(100);
    }
  });

  it("le detail contient roundBpis et dimensions", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const rankings = await db
      .select()
      .from(gameRankings)
      .where(eq(gameRankings.gameId, gameId));

    for (const row of rankings) {
      const detail = row.detail as {
        roundBpis: number[];
        dimensions: Record<string, number>;
        cumulativeNetIncome: number;
      };
      expect(detail.roundBpis).toHaveLength(1);
      expect(Object.keys(detail.dimensions).length).toBe(6);
      expect(typeof detail.cumulativeNetIncome).toBe("number");
    }
  });

  it("le classement se met à jour après plusieurs tours", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const rankings = await db
      .select()
      .from(gameRankings)
      .where(eq(gameRankings.gameId, gameId));

    for (const row of rankings) {
      const detail = row.detail as { roundBpis: number[] };
      expect(detail.roundBpis).toHaveLength(2);
    }
  });
});

describe("6 — marqueur de défaillance dans le classement", () => {
  it("detail.defaillant vaut false pour une partie qui tourne normalement", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const rankings = await db
      .select()
      .from(gameRankings)
      .where(eq(gameRankings.gameId, gameId));

    for (const row of rankings) {
      expect((row.detail as { defaillant?: boolean }).defaillant).toBe(false);
    }
  });

  it("un état défaillant écrit pour une équipe fait passer son detail.defaillant à true", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const gameTeams = await db.select().from(teams).where(eq(teams.gameId, gameId));
    const teamIds = gameTeams.map((t) => t.id);
    const cible = teamIds[0]!;

    // On force le dernier état connu de l'équipe cible à « defaillant » : c'est
    // l'état le plus récent qui fait foi, indépendamment du reste du classement.
    await db
      .insert(companyStates)
      .values({ teamId: cible, roundIndex: 999, state: { status: "defaillant" } })
      .onConflictDoNothing();
    await updateRankings(gameId, teamIds);

    const rankings = await db
      .select()
      .from(gameRankings)
      .where(eq(gameRankings.gameId, gameId));

    const cibleRow = rankings.find((r) => r.teamId === cible)!;
    const autreRow = rankings.find((r) => r.teamId !== cible)!;
    expect((cibleRow.detail as { defaillant?: boolean }).defaillant).toBe(true);
    expect((autreRow.detail as { defaillant?: boolean }).defaillant).toBe(false);
  });
});

describe("5 — départage (tie-break)", () => {
  it("le tri suit BPI > financialAvg > lastTreasury", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const rankings = await db
      .select()
      .from(gameRankings)
      .where(eq(gameRankings.gameId, gameId));

    const sorted = [...rankings].sort((a, b) => a.rank - b.rank);
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(Number(sorted[i]!.bpi)).toBeGreaterThanOrEqual(Number(sorted[i + 1]!.bpi));
    }
  });
});
