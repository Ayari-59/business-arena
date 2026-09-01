import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * Tests dorés de game-creation.service.ts :
 * 1. Création solo : structure (game, teams, rounds, companyStates, player)
 * 2. Création classe : structure, joinCode, teams humaines + bots
 * 3. Pipeline de création : snapshot, rounds, company states initiaux
 * 4. Paramètres de difficulté et variabilité
 * 5. Situations pédagogiques ouvertes au tour 1
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../integration/helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { companyStates, games, players, rounds, teams, users } from "@/db/schema";
import {
  createSoloGame,
  createClassGame,
  createGameCore,
} from "@/services/game-creation.service";

let userId: string;
let orgId: string;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "creation@test.local", displayName: "CreationTest" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;

  const { organizations } = await import("@/db/schema");
  const org = await db
    .insert(organizations)
    .values({ name: "Test Org", slug: "test-creation", kind: "school" })
    .returning({ id: organizations.id });
  orgId = org[0]!.id;
});

describe("1 — création solo", () => {
  it("crée 1 humain + N-1 bots pour companiesCount=3", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3);

    const teamRows = await db
      .select()
      .from(teams)
      .where(eq(teams.gameId, gameId));

    const humans = teamRows.filter((t) => t.controller === "human");
    const bots = teamRows.filter((t) => t.controller === "bot");
    expect(humans).toHaveLength(1);
    expect(bots).toHaveLength(2);
    expect(teamRows).toHaveLength(3);
  });

  it("le joueur est inscrit comme captain", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);

    const humanTeam = (
      await db
        .select()
        .from(teams)
        .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")))
    )[0]!;

    const playerRows = await db
      .select()
      .from(players)
      .where(eq(players.teamId, humanTeam.id));

    expect(playerRows).toHaveLength(1);
    expect(playerRows[0]!.userId).toBe(userId);
    expect(playerRows[0]!.role).toBe("captain");
  });

  it("la partie est en statut running", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);

    const game = (
      await db.select().from(games).where(eq(games.id, gameId))
    )[0]!;

    expect(game.status).toBe("running");
    expect(game.currentRound).toBe(1);
  });
});

describe("2 — création classe", () => {
  it("crée N équipes humaines + bots avec joinCode", async () => {
    const { gameId, joinCode } = await createClassGame({
      teacherId: userId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 3,
      botCount: 1,
    });

    expect(joinCode).toHaveLength(6);
    expect(typeof gameId).toBe("string");

    const teamRows = await db
      .select()
      .from(teams)
      .where(eq(teams.gameId, gameId));

    const humans = teamRows.filter((t) => t.controller === "human");
    const bots = teamRows.filter((t) => t.controller === "bot");
    expect(humans).toHaveLength(3);
    expect(bots).toHaveLength(1);
  });

  it("les équipes humaines portent des noms séquentiels", async () => {
    const { gameId } = await createClassGame({
      teacherId: userId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 4,
      botCount: 0,
    });

    const teamRows = await db
      .select()
      .from(teams)
      .where(eq(teams.gameId, gameId));

    const names = teamRows.map((t) => t.name).sort();
    expect(names).toEqual(["Équipe 1", "Équipe 2", "Équipe 3", "Équipe 4"]);
  });

  it("le joinCode est stocké dans la partie", async () => {
    const { gameId, joinCode } = await createClassGame({
      teacherId: userId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 0,
    });

    const game = (
      await db.select().from(games).where(eq(games.id, gameId))
    )[0]!;
    expect(game.joinCode).toBe(joinCode);
  });
});

describe("3 — pipeline de création", () => {
  it("le nombre de rounds correspond au scénario", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);

    const game = (
      await db.select().from(games).where(eq(games.id, gameId))
    )[0]!;
    const snapshot = game.scenarioSnapshot as { roundsCount: number };

    const roundRows = await db
      .select()
      .from(rounds)
      .where(eq(rounds.gameId, gameId));

    expect(roundRows).toHaveLength(snapshot.roundsCount);
  });

  it("le premier round est open, les suivants pending", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);

    const roundRows = await db
      .select()
      .from(rounds)
      .where(eq(rounds.gameId, gameId));

    const sorted = roundRows.sort((a, b) => a.index - b.index);
    expect(sorted[0]!.status).toBe("open");
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.status).toBe("pending");
    }
  });

  it("chaque équipe a un company state initial (roundIndex 0)", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3);

    const teamRows = await db
      .select()
      .from(teams)
      .where(eq(teams.gameId, gameId));

    for (const team of teamRows) {
      const states = await db
        .select()
        .from(companyStates)
        .where(and(eq(companyStates.teamId, team.id), eq(companyStates.roundIndex, 0)));

      expect(states).toHaveLength(1);
      expect(states[0]!.state).toBeTruthy();
    }
  });

  it("le snapshot contient un scénario avec les champs attendus", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2);

    const game = (
      await db.select().from(games).where(eq(games.id, gameId))
    )[0]!;
    const snapshot = game.scenarioSnapshot as Record<string, unknown>;

    expect(snapshot).toHaveProperty("roundsCount");
    expect(snapshot).toHaveProperty("market");
    expect(snapshot).toHaveProperty("product");
    expect(snapshot).toHaveProperty("code");
  });
});

describe("4 — paramètres de difficulté", () => {
  it("le profil de difficulté est stocké dans la partie", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2, 4);

    const game = (
      await db.select().from(games).where(eq(games.id, gameId))
    )[0]!;
    const profile = game.difficultyProfile as { level: number; kind: string };

    expect(profile.level).toBe(4);
    expect(profile.kind).toBe("solo");
  });

  it("le profil classe retient le kind class", async () => {
    const { gameId } = await createClassGame({
      teacherId: userId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
      level: 2,
    });

    const game = (
      await db.select().from(games).where(eq(games.id, gameId))
    )[0]!;
    const profile = game.difficultyProfile as { level: number; kind: string };

    expect(profile.level).toBe(2);
    expect(profile.kind).toBe("class");
  });
});

describe("5 — périodicité", () => {
  it("une partie mensuelle a le bon profil", async () => {
    const gameId = await createSoloGame(userId, "month", 2);

    const game = (
      await db.select().from(games).where(eq(games.id, gameId))
    )[0]!;
    const profile = game.difficultyProfile as { periodicity: string };

    expect(profile.periodicity).toBe("month");
  });

  it("une partie annuelle a le bon profil", async () => {
    const gameId = await createSoloGame(userId, "year", 2);

    const game = (
      await db.select().from(games).where(eq(games.id, gameId))
    )[0]!;
    const profile = game.difficultyProfile as { periodicity: string };

    expect(profile.periodicity).toBe("year");
  });
});
