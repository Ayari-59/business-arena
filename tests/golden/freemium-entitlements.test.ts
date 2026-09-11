import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Freemium : le palier gratuit borne l'accès, une licence en cours le lève.
 *
 * Le harnais de test seede un palier « illimité » ; ici on écrit une config
 * RESTRICTIVE, puis on vérifie que le mur s'applique bien : la partie s'arrête
 * au tour du plan (« ne va pas au bout ») et les concours sont refusés.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../integration/helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, platformSettings, users } from "@/db/schema";
import { createSoloGame, resolveCurrentRound } from "@/services/game.service";
import { entitlementsForOrg } from "@/services/entitlements.service";
import { createCompetition } from "@/services/competition.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
  finance: { newLoan: 0, loanRepayment: 0 },
};

const FAUX_ORG = "00000000-0000-0000-0000-0000000000aa";

let userId: string;

beforeAll(async () => {
  // Config restrictive : 2 tours gratuits, pas de concours.
  await db
    .update(platformSettings)
    .set({
      settings: {
        allowPublicPlay: true,
        allowSelfServiceTeachers: true,
        announcement: "",
        contactEmail: "contact@business-arena.fr",
        freeTier: { maxRounds: 2, competitions: false, ai: false, gradebookExport: false },
      },
    })
    .where(eq(platformSettings.id, 1));

  const inserted = await db
    .insert(users)
    .values({ email: "freemium@test.local", displayName: "Freemium" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
});

describe("entitlements", () => {
  it("sans licence : palier gratuit restrictif", async () => {
    const ent = await entitlementsForOrg(FAUX_ORG);
    expect(ent.plan).toBe("free");
    expect(ent.maxRounds).toBe(2);
    expect(ent.competitions).toBe(false);
  });

  it("sans établissement (solo public) : palier gratuit aussi", async () => {
    const ent = await entitlementsForOrg(null);
    expect(ent.plan).toBe("free");
    expect(ent.maxRounds).toBe(2);
  });
});

describe("mur des tours (« ne va pas au bout »)", () => {
  it("la partie gratuite se termine au tour du plan, avant la fin du scénario", async () => {
    // Scénario de 4 tours, mais palier gratuit à 2.
    const gameId = await createSoloGame(userId, "quarter", 2, undefined, false, undefined, 4);

    const r1 = await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });
    expect(r1.finished).toBe(false);

    const r2 = await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });
    expect(r2.finished).toBe(true); // arrêt au tour 2, alors que le scénario en a 4

    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    expect(game.status).toBe("finished");
    expect(game.currentRound).toBe(2);
    expect((game.difficultyProfile as { planCapped?: boolean }).planCapped).toBe(true);
  });
});

describe("mur des concours", () => {
  it("créer un concours sans licence est refusé", async () => {
    await expect(
      createCompetition({
        organizerId: userId,
        organizationId: FAUX_ORG,
        name: "Coupe test",
        periodicity: "quarter",
        groupSize: 3,
        advancePerGroup: 1,
      }),
    ).rejects.toThrow(/établissement/i);
  });
});
