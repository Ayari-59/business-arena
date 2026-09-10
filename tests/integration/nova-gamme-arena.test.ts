import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * NOVA · GAMME DANS L'ARÈNE : la R&D et la communication survivent à la base.
 *
 * Le moteur savait lancer une référence à coups de R&D et faire porter un
 * axe de communication ; rien ne garantissait que ce détail passe par la
 * trace persistée et revienne à l'écran. La ligne « Communication » du
 * tableau de bord était vide en partie réelle alors que tous les tests
 * moteur passaient : la trace ne recopiait que des clés listées. Ce test
 * crée une partie NOVA · gamme au niveau qui ouvre la R&D, finance la Studio
 * avec un axe qualité, et vérifie ce que la vue rend.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { createSoloGame, getGameView, resolveCurrentRound } from "@/services/game.service";
import type { RoundDecisions } from "@/engine/types";

let userId: string;
let gameId: string;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "novag@test.local", displayName: "Nova gamme" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
  // Niveau 4 (Arbitrage) : la R&D est ouverte.
  gameId = await createSoloGame(userId, "quarter", 3, 4, false, "nova-gamme");
});

describe("NOVA · gamme dans l'arène", () => {
  it("la vue expose la Studio en développement, le levier R&D et la communication", async () => {
    const view = (await getGameView(gameId, userId))!;
    expect(view.enabledDecisions.rd).toBe(true);
    expect(view.rdOffer).toEqual({ techScale: 10000 });
    const studio = view.gamme!.find((p) => p.code === "nova-studio")!;
    expect(studio.rd?.development).toEqual({
      cost: 25000,
      availableFromRound: 2,
      invested: 0,
      available: false,
      launchRound: null,
    });
    expect(view.communicationOffer?.axes.map((a) => a.code)).toEqual(["prix", "qualite", "innovation", "image"]);
    expect(view.communicationOffer?.brandAwareness).toBe(0);
    // Rien de proposé en R&D, en marque ni en axe : ce sont les choix de l'équipe.
    expect(view.proposedDecisions.products!["nova-studio"]!.rdBudget).toBe(0);
    expect(view.proposedDecisions.brandMarketingBudget).toBe(0);
    expect(view.proposedDecisions.communicationAxis).toBeUndefined();
  });

  it("la R&D, la marque et l'axe joués reviennent à l'écran, et la Studio se lance au tour 2", async () => {
    const before = (await getGameView(gameId, userId))!;
    const proposed = before.proposedDecisions;
    const t1: RoundDecisions = {
      ...proposed,
      brandMarketingBudget: 3000,
      communicationAxis: "qualite",
      products: {
        ...proposed.products!,
        "nova-studio": { ...proposed.products!["nova-studio"]!, rdBudget: 25000 },
      },
    };
    await resolveCurrentRound({ gameId, userId, playerDecisions: t1 });
    const view = (await getGameView(gameId, userId))!;
    const r = view.periods[0]!.result;
    expect(r.incomeStatement.rdCost).toBe(25000);
    expect(r.products!["nova-studio"]!.rd?.development).toMatchObject({ invested: 25000, launched: false });
    expect(r.communication).toMatchObject({ axis: "qualite", brandBudget: 3000 });
    expect(r.communication!.brandAwareness).toBeGreaterThan(0);
    // L'axe qualité porte auprès des passionnés, dessert auprès des lycéens.
    expect(r.communication!.fitBySegment["passionnes"]).toBeGreaterThan(1);
    expect(r.communication!.fitBySegment["lyceens"]).toBeLessThan(1);
    // Le tour suivant : la Studio est vendable, la notoriété et l'axe tenu sont rappelés.
    const studio = view.gamme!.find((p) => p.code === "nova-studio")!;
    expect(studio.rd?.development).toMatchObject({ invested: 25000, available: true });
    expect(view.communicationOffer?.brandAwareness).toBeCloseTo(r.communication!.brandAwareness, 9);
    expect(view.communicationOffer?.lastAxis).toBe("qualite");
    // La décision rendue garde son détail.
    expect(view.periods[0]!.decisions?.communicationAxis).toBe("qualite");
    expect(view.periods[0]!.decisions?.products?.["nova-studio"]?.rdBudget).toBe(25000);
  });
});
