import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * L'ANCIEN PALIER GRATUIT (« FREEMIUM ») EST RETIRÉ, ET RESTE INERTE EN BASE.
 *
 * Il bornait, depuis un réglage de /admin, les tours, les concours, le relevé et l'IA
 * de qui n'avait pas de licence. Il ne correspondait plus à la grille (config/tarifs.ts).
 * La règle est désormais celle de la grille, vérifiée dans services/acces.service.ts.
 *
 * Ce test écrit l'ancien réglage RESTRICTIF en base, tel qu'une production pourrait
 * encore le porter, et vérifie qu'il ne fait plus rien : la partie va au bout de son
 * scénario ; un concours se refuse sans licence de l'arène (et non à cause du réglage) ;
 * il s'accepte avec, même si l'ancien réglage les fermait.
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
import { getPlatformConfig } from "@/services/admin.service";
import { ClasseReserveError } from "@/services/acces.service";
import type { RoundDecisions } from "@/engine/types";
import { etablissementSousLicence } from "../integration/helpers/licence";

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
  // L'ancien réglage restrictif : 2 tours gratuits, pas de concours, ni IA, ni relevé.
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

describe("le réglage de l'ancien palier gratuit n'est plus lu", () => {
  it("la configuration de la plateforme ne le porte plus", async () => {
    expect("freeTier" in (await getPlatformConfig())).toBe(false);
  });

  it("sans licence : plan gratuit, sans aucune borne lue du réglage ; l'IA ne dépend pas d'une licence", async () => {
    expect(await entitlementsForOrg(FAUX_ORG)).toEqual({ plan: "free", ai: true });
    expect(await entitlementsForOrg(null)).toEqual({ plan: "free", ai: true });
  });
});

describe("plus de mur des tours", () => {
  it("la partie sans licence va jusqu'au bout de son scénario, malgré l'ancien « 2 tours »", async () => {
    const gameId = await createSoloGame(userId, "quarter", 2, undefined, false, undefined, 4);
    for (let tour = 1; tour <= 3; tour++) {
      const r = await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });
      expect(r.finished, `tour ${tour}`).toBe(false);
    }
    const r4 = await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });
    expect(r4.finished).toBe(true);
    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    expect(game.currentRound).toBe(4);
    expect((game.difficultyProfile as { planCapped?: boolean }).planCapped).toBeUndefined();
  });
});

describe("les concours suivent la grille, pas l'ancien réglage", () => {
  it("sans licence de l'arène : refusé, par la règle de la classe", async () => {
    await expect(
      createCompetition({
        organizerId: userId,
        organizationId: FAUX_ORG,
        name: "Coupe test",
        periodicity: "quarter",
        groupSize: 3,
        advancePerGroup: 1,
      }),
    ).rejects.toBeInstanceOf(ClasseReserveError);
  });

  it("sous licence de l'arène : accepté, même si l'ancien réglage fermait les concours", async () => {
    const e = await etablissementSousLicence("Concours");
    const c = await createCompetition({
      organizerId: e.userId,
      organizationId: e.orgId,
      name: "Coupe sous licence",
      periodicity: "quarter",
      groupSize: 3,
      advancePerGroup: 1,
    });
    expect(c.competitionId).toBeTruthy();
  });
});
