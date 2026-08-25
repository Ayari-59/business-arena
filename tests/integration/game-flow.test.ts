import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Test d'intégration du parcours complet (doc 09 §4) sur Postgres embarqué :
 * créer une partie → jouer les 6 tours → partie terminée, résultats, KPIs et
 * classement persistés et cohérents avec le moteur.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import {
  companyStates,
  decisions,
  gameRankings,
  games,
  kpis,
  roundResults,
  rounds,
  teams,
  users,
} from "@/db/schema";
import { createSoloGame, getGameView, resolveCurrentRound } from "@/services/game.service";
import type { RoundDecisions } from "@/engine/types";

const PLAYER_DECISIONS: RoundDecisions = {
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
    .values({ email: "test@business-arena.local", displayName: "Testeur" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
});

describe("parcours complet d'une partie solo", () => {
  it("crée, joue 6 tours, termine et classe — tout est persisté", async () => {
    const gameId = await createSoloGame(userId, "quarter", 4);

    const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
    expect(teamRows).toHaveLength(4); // nombre d'équipes configurable (§27)
    expect(teamRows.filter((t) => t.controller === "bot")).toHaveLength(3);

    const states0 = await db.select().from(companyStates);
    expect(states0.filter((s) => s.roundIndex === 0)).toHaveLength(4);

    for (let round = 1; round <= 6; round++) {
      const { roundIndex, finished } = await resolveCurrentRound({
        gameId,
        userId,
        playerDecisions: PLAYER_DECISIONS,
      });
      expect(roundIndex).toBe(round);
      expect(finished).toBe(round === 6);
    }

    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    expect(game.status).toBe("finished");

    const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    expect(allRounds.every((r) => r.status === "resolved")).toBe(true);

    const results = await db.select().from(roundResults);
    expect(results).toHaveLength(6 * 4);
    // dénormalisation cohérente : TN = FRNG − BFR sur chaque ligne
    // (chaque colonne est arrondie au centime indépendamment → tolérance 5 c)
    for (const r of results) {
      expect(Number(r.netTreasury)).toBeCloseTo(Number(r.frng) - Number(r.bfr), 1);
    }

    const decisionRows = await db.select().from(decisions);
    expect(decisionRows).toHaveLength(6 * 4);
    expect(decisionRows.every((d) => d.status === "locked")).toBe(true);

    const kpiRows = await db.select().from(kpis);
    expect(kpiRows.length).toBeGreaterThan(6 * 4 * 10);

    const ranking = await db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId));
    expect(ranking).toHaveLength(4);
    expect([...ranking.map((r) => r.rank)].sort()).toEqual([1, 2, 3, 4]);
  });

  it("expose une vue de jeu complète et refuse les intrus", async () => {
    const gameId = await createSoloGame(userId, "month", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: PLAYER_DECISIONS });

    const view = await getGameView(gameId, userId);
    expect(view).not.toBeNull();
    expect(view!.roundDays).toBe(30);
    expect(view!.currentRound).toBe(2);
    expect(view!.history).toHaveLength(1);
    expect(view!.lastResult).not.toBeNull();
    expect(view!.ranking).toHaveLength(2);

    const stranger = await db
      .insert(users)
      .values({ email: "intrus@business-arena.local", displayName: "Intrus" })
      .returning({ id: users.id });
    expect(await getGameView(gameId, stranger[0]!.id)).toBeNull();
    await expect(
      resolveCurrentRound({ gameId, userId: stranger[0]!.id, playerDecisions: PLAYER_DECISIONS }),
    ).rejects.toThrow();
  });

  it("le verrou optimiste empêche la double résolution simultanée", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const [a, b] = await Promise.allSettled([
      resolveCurrentRound({ gameId, userId, playerDecisions: PLAYER_DECISIONS }),
      resolveCurrentRound({ gameId, userId, playerDecisions: PLAYER_DECISIONS }),
    ]);
    const outcomes = [a!.status, b!.status].sort();
    // l'un résout le tour 1, l'autre est rejeté par le verrou OU résout le tour 2
    // (selon l'entrelacement) — jamais deux résolutions du même tour
    const results = await db.select().from(roundResults);
    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    const gameRoundIds = new Set(
      (await db.select().from(rounds).where(eq(rounds.gameId, gameId))).map((r) => r.id),
    );
    const gameResults = results.filter((r) => gameRoundIds.has(r.roundId));
    const perRound = new Map<string, number>();
    for (const r of gameResults) {
      perRound.set(`${r.roundId}:${r.teamId}`, (perRound.get(`${r.roundId}:${r.teamId}`) ?? 0) + 1);
    }
    expect([...perRound.values()].every((n) => n === 1)).toBe(true);
    expect(outcomes.length).toBe(2);
    expect(game.currentRound).toBeGreaterThanOrEqual(1);
  });
});
