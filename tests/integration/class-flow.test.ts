import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * Parcours de classe (étape 7, §27) sur Postgres embarqué : inscription
 * enseignant → création de partie multi-équipes → élèves qui rejoignent par
 * code → décisions par équipe → clôture par l'enseignant (reconduction pour
 * les absents) → fin de partie.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { decisions, players, rounds, teams, users } from "@/db/schema";
import { loginTeacher, registerTeacher, getTeacherOrgId } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  getGameView,
  getTeacherGameView,
  getTeacherGames,
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
};

let teacherId: string;
let orgId: string;

async function makeStudent(name: string): Promise<string> {
  const inserted = await db
    .insert(users)
    .values({ email: `${name}@guest.business-arena.local`, displayName: name })
    .returning({ id: users.id });
  return inserted[0]!.id;
}

beforeAll(async () => {
  const result = await registerTeacher({
    email: "prof@lycee.fr",
    password: "motdepasse!",
    displayName: "Mme Martin",
    schoolName: "Lycée Pasteur",
  });
  if ("error" in result) throw new Error(result.error);
  teacherId = result.userId;
  orgId = (await getTeacherOrgId(teacherId))!;
});

describe("authentification enseignant", () => {
  it("refuse le doublon d'e-mail et le mauvais mot de passe", async () => {
    const dup = await registerTeacher({
      email: "prof@lycee.fr",
      password: "motdepasse!",
      displayName: "X",
      schoolName: "Y",
    });
    expect("error" in dup).toBe(true);
    expect("error" in (await loginTeacher({ email: "prof@lycee.fr", password: "faux" }))).toBe(true);
    const ok = await loginTeacher({ email: "prof@lycee.fr", password: "motdepasse!" });
    expect("userId" in ok && ok.userId).toBe(teacherId);
  });
});

describe("partie de classe complète", () => {
  it("création → adhésion par code → décisions → clôtures → fin", async () => {
    const { gameId, joinCode } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
    });
    expect(joinCode).toMatch(/^[A-Z2-9]{6}$/);

    // les élèves rejoignent : répartition dans les équipes les moins remplies
    const alice = await makeStudent("alice");
    const bruno = await makeStudent("bruno");
    const joinA = await joinGameByCode({ code: joinCode, userId: alice, pseudo: "Alice" });
    const joinB = await joinGameByCode({ code: joinCode.toLowerCase(), userId: bruno, pseudo: "Bruno" });
    expect("gameId" in joinA && joinA.gameId).toBe(gameId);
    expect("gameId" in joinB && joinB.gameId).toBe(gameId);
    const memberships = await db.select().from(players);
    const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
    const humanIds = teamRows.filter((t) => t.controller === "human").map((t) => t.id);
    const aliceTeam = memberships.find((m) => m.userId === alice)!.teamId;
    const brunoTeam = memberships.find((m) => m.userId === bruno)!.teamId;
    expect(aliceTeam).not.toBe(brunoTeam); // équipes différentes (moins remplies d'abord)
    expect(humanIds).toContain(aliceTeam);
    expect("error" in (await joinGameByCode({ code: "ZZZZZZ", userId: alice }))).toBe(true);

    // Alice valide, Bruno ne fait rien → reconduction/repli à la clôture
    await submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS });
    const teacherView = await getTeacherGameView(gameId, teacherId);
    const aliceRow = teacherView!.teams.find((t) => t.teamId === aliceTeam)!;
    const brunoRow = teacherView!.teams.find((t) => t.teamId === brunoTeam)!;
    expect(aliceRow.hasSubmitted).toBe(true);
    expect(brunoRow.hasSubmitted).toBe(false);

    // un élève ne peut pas clore ; l'enseignant si
    await expect(closeCurrentRound({ gameId, teacherId: alice })).rejects.toThrow();
    const r1 = await closeCurrentRound({ gameId, teacherId });
    expect(r1).toMatchObject({ roundIndex: 1, finished: false });

    // la décision de Bruno est marquée reconduite
    const round1 = (
      await db.select().from(rounds).where(and(eq(rounds.gameId, gameId), eq(rounds.index, 1)))
    )[0]!;
    const brunoDecision = (
      await db
        .select()
        .from(decisions)
        .where(and(eq(decisions.roundId, round1.id), eq(decisions.teamId, brunoTeam)))
    )[0]!;
    expect(brunoDecision.status).toBe("carried_over");

    // vue joueur d'Alice : partie de classe, décisions du tour 2 non soumises
    const view = await getGameView(gameId, alice);
    expect(view!.kind).toBe("class");
    expect(view!.currentRound).toBe(2);
    expect(view!.pendingDecisions).toBeNull();
    expect(view!.lastResult).not.toBeNull();
    expect(view!.ranking).toHaveLength(3);

    // jouer les 5 tours restants
    for (let round = 2; round <= 6; round++) {
      await submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS });
      const { finished } = await closeCurrentRound({ gameId, teacherId });
      expect(finished).toBe(round === 6);
    }

    const summaries = await getTeacherGames(teacherId);
    expect(summaries.some((s) => s.gameId === gameId && s.status === "finished")).toBe(true);
  });
});
