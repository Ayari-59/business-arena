import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Se réinscrire à un concours ne crée ni ne déplace rien : la réponse dit
 * l'équipe où l'on est déjà.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { competitionEntries, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { createCompetition, getCompetitionView, joinCompetition } from "@/services/competition.service";

let joinCode: string;
let competitionId: string;
let eleve: string;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "deja@lycee.test",
    password: "motdepasse!",
    displayName: "Mme Déjà",
    schoolName: "Lycée de la Double Inscription",
  });
  if ("error" in r) throw new Error(r.error);
  const orgId = (await getTeacherOrgId(r.userId))!;
  ({ competitionId, joinCode } = await createCompetition({
    organizerId: r.userId,
    organizationId: orgId,
    name: "Coupe QA",
    periodicity: "quarter",
    groupSize: 3,
    advancePerGroup: 1,
  }));
  eleve = (
    await db.insert(users).values({ email: "deja@test.local", displayName: "Déjà" }).returning({ id: users.id })
  )[0]!.id;
});

describe("inscription répétée", () => {
  it("la première inscription crée l'équipe, la seconde la retrouve", async () => {
    const premiere = await joinCompetition({ code: joinCode, userId: eleve, teamLabel: "Alpha" });
    expect(premiere).toEqual({ competitionId });

    // Même code, même nom.
    const meme = await joinCompetition({ code: joinCode, userId: eleve, teamLabel: "Alpha" });
    expect(meme).toEqual({ competitionId, alreadyMember: "Alpha" });

    // Même code, autre nom : on ne change pas d'équipe en douce.
    const autre = await joinCompetition({ code: joinCode, userId: eleve, teamLabel: "Bêta" });
    expect(autre).toEqual({ competitionId, alreadyMember: "Alpha" });

    const entries = await db
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.competitionId, competitionId));
    expect(entries).toHaveLength(1);
    expect(entries[0]!.memberUserIds).toEqual([eleve]);
  });

  it("la vue du concours relit ses réglages", async () => {
    const view = await getCompetitionView(competitionId);
    expect(view!.rules).toEqual({ periodicity: "quarter", groupSize: 3, advancePerGroup: 1 });
  });
});
