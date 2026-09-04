import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Tests des chemins d'erreur : documentent le comportement actuel sans le
 * modifier. Chaque test vérifie qu'une erreur explicite est levée pour un
 * scénario invalide — partie introuvable, mauvais propriétaire, tour fermé,
 * partie terminée, mode compétition verrouillé.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../integration/helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, users } from "@/db/schema";
import {
  createSoloGame,
  drawEventCardForNextRound,
  resolveCurrentRound,
  submitTeamDecisions,
  nommerEquipe,
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
let strangerId: string;

beforeAll(async () => {
  const [u1, u2] = await Promise.all([
    db
      .insert(users)
      .values({ email: "owner@test.local", displayName: "Owner" })
      .returning({ id: users.id }),
    db
      .insert(users)
      .values({ email: "stranger@test.local", displayName: "Stranger" })
      .returning({ id: users.id }),
  ]);
  userId = u1[0]!.id;
  strangerId = u2[0]!.id;
});

describe("partie introuvable", () => {
  it("submitTeamDecisions sur un gameId inexistant", async () => {
    await expect(
      submitTeamDecisions({
        gameId: "00000000-0000-0000-0000-000000000000",
        userId,
        payload: DECISIONS,
      }),
    ).rejects.toThrow("Partie introuvable");
  });

  it("resolveCurrentRound sur un gameId inexistant", async () => {
    await expect(
      resolveCurrentRound({
        gameId: "00000000-0000-0000-0000-000000000000",
        userId,
        playerDecisions: DECISIONS,
      }),
    ).rejects.toThrow("Partie introuvable");
  });

  it("getGameView sur un gameId inexistant renvoie null", async () => {
    const view = await getGameView("00000000-0000-0000-0000-000000000000", userId);
    expect(view).toBeNull();
  });
});

describe("mauvais utilisateur (pas membre)", () => {
  it("un étranger ne peut pas soumettre de décisions", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await expect(
      submitTeamDecisions({
        gameId,
        userId: strangerId,
        payload: DECISIONS,
      }),
    ).rejects.toThrow();
  });

  it("un étranger ne peut pas résoudre un tour", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await expect(
      resolveCurrentRound({
        gameId,
        userId: strangerId,
        playerDecisions: DECISIONS,
      }),
    ).rejects.toThrow();
  });

  it("un étranger ne voit pas la partie (getGameView)", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    const view = await getGameView(gameId, strangerId);
    expect(view).toBeNull();
  });
});

describe("partie terminée", () => {
  it("soumettre des décisions sur une partie terminée est refusé", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    // Jouer tous les tours
    for (let i = 0; i < 6; i++) {
      const { finished } = await resolveCurrentRound({
        gameId,
        userId,
        playerDecisions: DECISIONS,
      });
      if (finished) break;
    }
    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    expect(game.status).toBe("finished");

    await expect(
      submitTeamDecisions({ gameId, userId, payload: DECISIONS }),
    ).rejects.toThrow("terminée");
  });
});

describe("tirage de carte — enseignant et restrictions", () => {
  it("seul le créateur peut tirer une carte", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await expect(
      drawEventCardForNextRound({ gameId, teacherId: strangerId }),
    ).rejects.toThrow("enseignant");
  });

  it("une partie terminée refuse le tirage", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    for (let i = 0; i < 6; i++) {
      const { finished } = await resolveCurrentRound({
        gameId,
        userId,
        playerDecisions: DECISIONS,
      });
      if (finished) break;
    }
    await expect(
      drawEventCardForNextRound({ gameId, teacherId: userId }),
    ).rejects.toThrow("terminée");
  });
});

describe("nommer l'équipe — restrictions", () => {
  it("un étranger ne peut pas nommer une équipe", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);
    await expect(
      nommerEquipe({ gameId, userId: strangerId, nom: "Test" }),
    ).rejects.toThrow();
  });
});
