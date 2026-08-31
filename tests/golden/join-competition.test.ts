import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../integration/helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { competitionEntries, users } from "@/db/schema";
import { registerTeacher, getTeacherOrgId } from "@/services/auth.service";
import {
  createCompetition,
  joinCompetition,
} from "@/services/competition.service";

let organizerId: string;
let orgId: string;
let competitionId: string;
let joinCode: string;

async function makeUser(name: string): Promise<string> {
  const inserted = await db
    .insert(users)
    .values({ email: `${name}@join-test.local`, displayName: name })
    .returning({ id: users.id });
  return inserted[0]!.id;
}

beforeAll(async () => {
  const result = await registerTeacher({
    email: "orga-join@test.local",
    password: "motdepasse!",
    displayName: "Prof Join",
    schoolName: "IUT Test",
  });
  if ("error" in result) throw new Error(result.error);
  organizerId = result.userId;
  orgId = (await getTeacherOrgId(organizerId))!;
});

async function freshCompetition() {
  const created = await createCompetition({
    organizerId,
    organizationId: orgId,
    name: `Comp-${Date.now()}`,
    periodicity: "quarter",
    groupSize: 2,
    advancePerGroup: 1,
  });
  return created;
}

describe("joinCompetition — atomic guards", () => {
  it("two concurrent joins to the same team produce exactly one membership each", async () => {
    const { competitionId: cId, joinCode: code } = await freshCompetition();
    const u1 = await makeUser("concurrent-1");
    const u2 = await makeUser("concurrent-2");

    // First user creates the team
    await joinCompetition({ code, userId: u1, teamLabel: "Racing" });

    // Two concurrent joins to existing team
    const u3 = await makeUser("concurrent-3");
    const u4 = await makeUser("concurrent-4");
    const [a, b] = await Promise.allSettled([
      joinCompetition({ code, userId: u3, teamLabel: "Racing" }),
      joinCompetition({ code, userId: u4, teamLabel: "racing" }),
    ]);
    expect(a.status).toBe("fulfilled");
    expect(b.status).toBe("fulfilled");

    const entries = await db
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.competitionId, cId));
    const team = entries.find((e) => e.teamLabel === "Racing")!;
    expect(team.memberUserIds).toContain(u3);
    expect(team.memberUserIds).toContain(u4);
    // No duplicate members
    expect(new Set(team.memberUserIds).size).toBe(team.memberUserIds.length);
  });

  it("joining with a different-case label joins the existing team (no duplicate entry)", async () => {
    const { competitionId: cId, joinCode: code } = await freshCompetition();
    const u1 = await makeUser("case-1");
    const u2 = await makeUser("case-2");

    await joinCompetition({ code, userId: u1, teamLabel: "Alpha" });
    await joinCompetition({ code, userId: u2, teamLabel: "alpha" });

    const entries = await db
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.competitionId, cId));
    expect(entries).toHaveLength(1);
    expect(entries[0]!.memberUserIds).toHaveLength(2);
    expect(entries[0]!.teamLabel).toBe("Alpha");
  });

  it("a full team (6 members) rejects the 7th player", async () => {
    const { competitionId: cId, joinCode: code } = await freshCompetition();
    const userIds: string[] = [];
    for (let i = 1; i <= 7; i++) {
      userIds.push(await makeUser(`full-${i}`));
    }

    for (let i = 0; i < 6; i++) {
      const r = await joinCompetition({ code, userId: userIds[i]!, teamLabel: "BigTeam" });
      expect("competitionId" in r).toBe(true);
    }

    const r7 = await joinCompetition({ code, userId: userIds[6]!, teamLabel: "BigTeam" });
    expect("error" in r7).toBe(true);
    if ("error" in r7) expect(r7.error).toMatch(/complète/);

    const entries = await db
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.competitionId, cId));
    expect(entries[0]!.memberUserIds).toHaveLength(6);
  });

  it("a user already registered is idempotent (no error, no duplicate)", async () => {
    const { competitionId: cId, joinCode: code } = await freshCompetition();
    const u1 = await makeUser("idem-1");

    const r1 = await joinCompetition({ code, userId: u1, teamLabel: "Solo" });
    expect("competitionId" in r1).toBe(true);

    const r2 = await joinCompetition({ code, userId: u1, teamLabel: "Solo" });
    expect("competitionId" in r2).toBe(true);

    const r3 = await joinCompetition({ code, userId: u1, teamLabel: "AnotherTeam" });
    expect("competitionId" in r3).toBe(true);

    const entries = await db
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.competitionId, cId));
    expect(entries).toHaveLength(1);
    expect(entries[0]!.memberUserIds).toHaveLength(1);
  });

  it("concurrent team creation with the same label (different case) results in one team", async () => {
    const { competitionId: cId, joinCode: code } = await freshCompetition();
    const u1 = await makeUser("race-create-1");
    const u2 = await makeUser("race-create-2");

    const [a, b] = await Promise.allSettled([
      joinCompetition({ code, userId: u1, teamLabel: "NewTeam" }),
      joinCompetition({ code, userId: u2, teamLabel: "newteam" }),
    ]);
    const fulfilled = [a, b].filter((r) => r.status === "fulfilled");
    expect(fulfilled.length).toBe(2);

    const entries = await db
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.competitionId, cId));
    expect(entries).toHaveLength(1);
    expect(entries[0]!.memberUserIds).toHaveLength(2);
    expect(entries[0]!.memberUserIds).toContain(u1);
    expect(entries[0]!.memberUserIds).toContain(u2);
  });
});
