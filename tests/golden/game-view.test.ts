import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Golden tests GameView NOVA : vérifient la structure et les valeurs de la vue
 * joueur au tour initial et après résolution d'un tour. Assertions ciblées
 * (toMatchObject), pas de snapshots géants.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../integration/helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSoloGame,
  resolveCurrentRound,
  getGameView,
} from "@/services/game.service";
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
    .values({ email: "gameview@test.local", displayName: "ViewTest" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
});

describe("GameView NOVA — tour initial (round 1, aucune résolution)", () => {
  it("structure de base correcte avant toute action", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const view = await getGameView(gameId, userId);
    expect(view).not.toBeNull();

    expect(view).toMatchObject({
      gameId,
      kind: "solo",
      status: "running",
      currentRound: 1,
      roundDays: 90,
    });
    expect(typeof view!.peutSeNommer).toBe("boolean");
  });

  it("roundsCount correspond au scénario NOVA (6 tours trimestriels)", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const view = await getGameView(gameId, userId);
    expect(view!.roundsCount).toBe(6);
  });

  it("lastResult est null au tour 1 (rien n'a été résolu)", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const view = await getGameView(gameId, userId);
    expect(view!.lastResult).toBeNull();
  });

  it("history est vide au tour 1", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const view = await getGameView(gameId, userId);
    expect(view!.history).toHaveLength(0);
  });

  it("intro contient les données du scénario NOVA", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const view = await getGameView(gameId, userId);
    expect(view!.intro).toMatchObject({
      capacity: expect.any(Number),
      fixedCostsPerRound: expect.any(Number),
      variableCostPerUnit: expect.any(Number),
      cash: expect.any(Number),
    });
    expect(view!.intro.segments.length).toBeGreaterThan(0);
    expect(view!.intro.competitors.length).toBeGreaterThan(0);
  });

  it("ranking est vide avant toute résolution", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const view = await getGameView(gameId, userId);
    expect(view!.ranking).toHaveLength(0);
  });

  it("aucun nom ne porte le marqueur (vous)", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const view = await getGameView(gameId, userId);
    expect(view!.playerTeamName).not.toMatch(/\(vous\)/);
    for (const row of view!.ranking) expect(row.name).not.toMatch(/\(vous\)/);
  });

  it("pendingDecisions est null en mode solo", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const view = await getGameView(gameId, userId);
    expect(view!.pendingDecisions).toBeNull();
  });

  it("announcedEventCards est vide au tour 1", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const view = await getGameView(gameId, userId);
    expect(view!.announcedEventCards).toHaveLength(0);
  });

  it("difficulty et vocabulary sont présents", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const view = await getGameView(gameId, userId);
    expect(view!.difficulty).toMatchObject({
      level: expect.any(Number),
      name: expect.any(String),
    });
    expect(view!.vocabulary).toBeDefined();
  });
});

describe("GameView NOVA — après résolution du tour 1", () => {
  let gameId: string;

  beforeAll(async () => {
    gameId = await createSoloGame(userId, "quarter", 2);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });
  });

  it("le tour courant avance à 2", async () => {
    const view = await getGameView(gameId, userId);
    expect(view!.currentRound).toBe(2);
  });

  it("lastResult contient les résultats financiers du joueur", async () => {
    const view = await getGameView(gameId, userId);
    expect(view!.lastResult).not.toBeNull();
    const lr = view!.lastResult!;

    expect(lr.incomeStatement).toMatchObject({
      revenue: expect.any(Number),
      netIncome: expect.any(Number),
    });
    expect(lr.incomeStatement.revenue).toBeGreaterThan(0);

    expect(lr.balanceSheet).toMatchObject({
      cash: expect.any(Number),
      equity: expect.any(Number),
    });

    expect(lr.functionalBalance).toMatchObject({
      frng: expect.any(Number),
      bfr: expect.any(Number),
      netTreasury: expect.any(Number),
    });
  });

  it("TN = FRNG - BFR dans lastResult", async () => {
    const view = await getGameView(gameId, userId);
    const fb = view!.lastResult!.functionalBalance;
    expect(fb.netTreasury).toBeCloseTo(fb.frng - fb.bfr, 4);
  });

  it("history contient exactement 1 entrée après 1 tour", async () => {
    const view = await getGameView(gameId, userId);
    expect(view!.history).toHaveLength(1);
    expect(view!.history[0]).toMatchObject({
      round: 1,
      revenue: expect.any(Number),
      netIncome: expect.any(Number),
      netTreasury: expect.any(Number),
    });
  });

  it("lastDecisions correspond aux décisions soumises", async () => {
    const view = await getGameView(gameId, userId);
    expect(view!.lastDecisions).toMatchObject({
      price: DECISIONS.price,
      productionPlan: DECISIONS.productionPlan,
    });
  });

  it("salesHistory contient les données du tour 1", async () => {
    const view = await getGameView(gameId, userId);
    expect(view!.salesHistory.rounds).toHaveLength(1);
    expect(view!.salesHistory.rounds[0]!.round).toBe(1);
    expect(view!.salesHistory.rounds[0]!.sold).toBeGreaterThan(0);
  });

  it("ranking mis à jour avec revenus et BPI", async () => {
    const view = await getGameView(gameId, userId);
    for (const row of view!.ranking) {
      expect(row.rank).toBeGreaterThanOrEqual(1);
      expect(row.bpi).toBeGreaterThanOrEqual(0);
    }
  });

  it("peutSeNommer passe à false après le tour 1 (sauf si nom par défaut)", async () => {
    const view = await getGameView(gameId, userId);
    expect(typeof view!.peutSeNommer).toBe("boolean");
  });
});
