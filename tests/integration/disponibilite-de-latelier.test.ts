import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * LA DISPONIBILITÉ ARRIVE JUSQU'À L'ÉCRAN, ET AVEC LE SEUIL QUI LA COMMANDE.
 *
 * Le moteur produit sous `machineCapacity × availability`, et cette
 * disponibilité s'use sous le budget d'entretien de référence, se rétablit
 * au-dessus. Elle n'était exposée nulle part : ni dans la vue, ni dans un
 * composant. L'élève décidait donc d'un budget dont il ne voyait ni l'échelle
 * ni l'effet, et l'écran lui annonçait une capacité qu'il ne pouvait plus
 * atteindre.
 *
 * Ce test tient le fil entier, du moteur à la vue : un tour sans entretien use
 * l'atelier, un tour au-dessus du seuil le répare, et la capacité annoncée suit.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, users } from "@/db/schema";
import { createSoloGame, getGameView, resolveCurrentRound } from "@/services/game.service";
import type { EngineScenarioConfig, RoundDecisions } from "@/engine/types";

const BASE: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 0,
  finance: { newLoan: 0, loanRepayment: 0 },
};

let userId: string;
let gameId: string;
let reference: number;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "atelier@business-arena.local", displayName: "Atelier" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
  gameId = await createSoloGame(userId, "quarter", 4);
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
  reference = (game.scenarioSnapshot as EngineScenarioConfig).production.maintenanceReference;
});

const faits = async () => {
  const vue = await getGameView(gameId, userId);
  return vue!.capacityFacts!;
};

describe("la disponibilité de l'atelier", () => {
  it("part entière, et annonce le seuil du métier", async () => {
    const f = await faits();
    expect(f.availability).toBe(1);
    expect(f.availableMachineCapacity).toBe(f.machineCapacity);
    // Le seuil vient du scénario joué, périodicité comprise : c'est celui que
    // le classeur du cockpit donne déjà aux élèves.
    expect(f.maintenanceReference).toBe(reference);
    expect(f.maintenanceReference).toBeGreaterThan(0);
  });

  it("un tour sans entretien l'use, et la capacité annoncée baisse avec elle", async () => {
    await resolveCurrentRound({ gameId, userId, playerDecisions: BASE });
    const f = await faits();
    expect(f.availability).toBeLessThan(1);
    // LE POINT : ce n'est plus la capacité d'un atelier neuf qui est annoncée.
    expect(f.availableMachineCapacity).toBeLessThan(f.machineCapacity);
    expect(f.availableMachineCapacity).toBe(Math.round(f.machineCapacity * f.availability));
  });

  it("un tour au-dessus du seuil la rétablit", async () => {
    const use = (await faits()).availability;
    await resolveCurrentRound({
      gameId,
      userId,
      playerDecisions: { ...BASE, maintenanceBudget: 2 * reference },
    });
    const f = await faits();
    expect(f.availability).toBeGreaterThan(use);
    expect(f.availability).toBeLessThanOrEqual(1);
  });
});
