import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Tournoi complet (étape 13, doc 04) sur Postgres embarqué : inscriptions par
 * code → tirage des groupes → parties de qualification en mode compétition
 * (décisions verrouillées, indices limités — §25) → finale → podium.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { competitionEntries, games, users } from "@/db/schema";
import { registerTeacher, getTeacherOrgId } from "@/services/auth.service";
import { closeCurrentRound, submitTeamDecisions } from "@/services/game.service";
import {
  createCompetition,
  finishCompetition,
  getCompetitionView,
  getPlayerCompetition,
  joinCompetition,
  startFinal,
  startQualification,
} from "@/services/competition.service";
import { getTeamSituations, unlockHint } from "@/services/pedagogy.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let organizerId: string;
let orgId: string;
let competitionId: string;
let joinCode: string;
const students: { userId: string; team: string }[] = [];

async function makeStudent(name: string): Promise<string> {
  const inserted = await db
    .insert(users)
    .values({ email: `${name}@compete.local`, displayName: name })
    .returning({ id: users.id });
  return inserted[0]!.id;
}

/** Joue une partie de concours jusqu'au bout (l'organisateur clôt chaque tour). */
async function playOut(gameId: string, playerIds: string[]): Promise<void> {
  for (let round = 1; round <= 6; round++) {
    for (const userId of playerIds) {
      await submitTeamDecisions({ gameId, userId, payload: DECISIONS }).catch(() => {
        /* joueur absent de cette partie : ignoré */
      });
    }
    await closeCurrentRound({ gameId, teacherId: organizerId });
  }
}

beforeAll(async () => {
  const result = await registerTeacher({
    email: "orga@championship.fr",
    password: "motdepasse!",
    displayName: "M. Dupont",
    schoolName: "IUT GEA",
  });
  if ("error" in result) throw new Error(result.error);
  organizerId = result.userId;
  orgId = (await getTeacherOrgId(organizerId))!;
  const created = await createCompetition({
    organizerId,
    organizationId: orgId,
    name: "Championship Test",
    periodicity: "quarter",
    groupSize: 2,
    advancePerGroup: 1,
  });
  competitionId = created.competitionId;
  joinCode = created.joinCode;
  for (const team of ["Alpha", "Bravo", "Charlie", "Delta"]) {
    const userId = await makeStudent(`joueur-${team.toLowerCase()}`);
    students.push({ userId, team });
  }
});

describe("inscriptions", () => {
  it("4 équipes s'inscrivent par code ; doublons et codes inconnus gérés", async () => {
    for (const s of students) {
      const r = await joinCompetition({ code: joinCode, userId: s.userId, teamLabel: s.team });
      expect("competitionId" in r && r.competitionId).toBe(competitionId);
    }
    // rejoindre une équipe existante par son nom exact
    const extra = await makeStudent("cinquieme");
    const joined = await joinCompetition({ code: joinCode, userId: extra, teamLabel: "alpha" });
    expect("competitionId" in joined).toBe(true);
    const entries = await db
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.competitionId, competitionId));
    expect(entries).toHaveLength(4);
    expect(entries.find((e) => e.teamLabel === "Alpha")!.memberUserIds).toHaveLength(2);
    expect("error" in (await joinCompetition({ code: "ZZZZZZ", userId: extra, teamLabel: "X" }))).toBe(true);
  });
});

describe("qualifications (mode compétition, §25)", () => {
  it("le tirage crée 2 groupes de 2 en mode compétition", async () => {
    await expect(
      startQualification({ competitionId, organizerId: students[0]!.userId }),
    ).rejects.toThrow(); // seul l'organisateur
    const { groups } = await startQualification({ competitionId, organizerId });
    expect(groups).toBe(2);
    await expect(startQualification({ competitionId, organizerId })).rejects.toThrow(); // idempotence

    const view = await getCompetitionView(competitionId);
    expect(view!.status).toBe("running");
    expect(view!.stages[0]!.games).toHaveLength(2);
    for (const g of view!.stages[0]!.games) {
      const game = (await db.select().from(games).where(eq(games.id, g.gameId)))[0]!;
      expect(game.mode).toBe("competition");
    }
    // chaque joueur retrouve sa partie
    for (const s of students) {
      const mine = await getPlayerCompetition(competitionId, s.userId);
      expect(mine!.myGameId).not.toBeNull();
      expect(mine!.myTeamLabel).toBe(s.team);
    }
  });

  it("décisions verrouillées après validation ; indices limités au niveau 3", async () => {
    const alice = students[0]!;
    const mine = await getPlayerCompetition(competitionId, alice.userId);
    const gameId = mine!.myGameId!;
    await submitTeamDecisions({ gameId, userId: alice.userId, payload: DECISIONS });
    await expect(
      submitTeamDecisions({ gameId, userId: alice.userId, payload: DECISIONS }),
    ).rejects.toThrow(/verrouillées/);

    const { current } = await getTeamSituations(gameId, alice.userId);
    const instanceId = current[0]!.instanceId;
    await unlockHint({ instanceId, userId: alice.userId });
    await unlockHint({ instanceId, userId: alice.userId });
    await unlockHint({ instanceId, userId: alice.userId });
    await expect(unlockHint({ instanceId, userId: alice.userId })).rejects.toThrow(/limités/);
  });

  it("les deux parties de groupe vont au bout", async () => {
    const view = await getCompetitionView(competitionId);
    for (const g of view!.stages[0]!.games) {
      await playOut(g.gameId, students.map((s) => s.userId));
    }
    const after = await getCompetitionView(competitionId);
    expect(after!.stages[0]!.games.every((g) => g.status === "finished")).toBe(true);
    expect(after!.stages[0]!.games.every((g) => g.standings.length === 2)).toBe(true);
  });
});

describe("finale et podium", () => {
  it("les vainqueurs de groupe se qualifient, les autres sont éliminés", async () => {
    const { finalists } = await startFinal({ competitionId, organizerId });
    expect(finalists).toHaveLength(2);
    const entries = await db
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.competitionId, competitionId));
    expect(entries.filter((e) => e.status === "active")).toHaveLength(2);
    expect(entries.filter((e) => e.status === "eliminated")).toHaveLength(2);
  });

  it("la finale se joue et le concours se clôt sur un podium", async () => {
    await expect(finishCompetition({ competitionId, organizerId })).rejects.toThrow(); // finale pas finie
    const view = await getCompetitionView(competitionId);
    const finalGame = view!.stages.find((s) => s.kind === "final")!.games[0]!;
    await playOut(finalGame.gameId, students.map((s) => s.userId));

    const { podium } = await finishCompetition({ competitionId, organizerId });
    expect(podium).toHaveLength(2);
    const finalView = await getCompetitionView(competitionId);
    expect(finalView!.status).toBe("finished");
    expect(finalView!.podium).toEqual(podium);
    const entries = await db
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.competitionId, competitionId));
    expect(entries.filter((e) => e.status === "winner")).toHaveLength(1);
    expect(entries.find((e) => e.status === "winner")!.teamLabel).toBe(podium[0]);
  });
});
