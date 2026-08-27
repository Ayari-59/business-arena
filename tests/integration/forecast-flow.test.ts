import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Prévision du joueur et analyse des écarts.
 *
 * « Gérer, c'est prévoir » : la prévision est saisie AVANT de connaître le
 * résultat, puis confrontée au réalisé. Ce qui se vérifie ici :
 *
 * - la prévision survit au tour (elle voyage dans les décisions enregistrées) ;
 * - l'écart est calculé sur le tour écoulé, en valeur et en relatif ;
 * - ne rien prévoir n'est pas prévoir zéro : sans prévision, pas de reproche.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { createSoloGame, getGameView, resolveCurrentRound } from "@/services/game.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let userId: string;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "forecast@test.local", displayName: "Prévisionniste" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
});

describe("prévision et analyse des écarts", () => {
  it("l'écart est calculé sur le tour écoulé, en valeur et en relatif", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3);
    await resolveCurrentRound({
      gameId,
      userId,
      playerDecisions: {
        ...DECISIONS,
        forecast: { expectedUnits: 4000, expectedCash: 20000 },
      },
    });

    const view = await getGameView(gameId, userId);
    const review = view!.forecastReview!;
    expect(review).not.toBeNull();
    expect(review.round).toBe(1);
    expect(review.lines).toHaveLength(2);

    const ventes = review.lines.find((l) => l.label === "Ventes")!;
    expect(ventes.forecast).toBe(4000);
    expect(ventes.format).toBe("units");
    // Le réalisé est bien celui du tour, pas une valeur inventée.
    const sold = Object.values(view!.lastResult!.market.bySegment).reduce(
      (sum, d) => sum + d.sold,
      0,
    );
    expect(ventes.actual).toBeCloseTo(sold, 6);
    expect(ventes.relative).toBeCloseTo((sold - 4000) / 4000, 9);

    const treso = review.lines.find((l) => l.label === "Trésorerie nette")!;
    expect(treso.format).toBe("euro");
    expect(treso.actual).toBeCloseTo(view!.lastResult!.functionalBalance.netTreasury, 6);

    // et la prévision se retrouve dans l'historique des ventes
    expect(view!.salesHistory.rounds[0]!.forecastUnits).toBe(4000);
  });

  it("ne rien prévoir n'est pas prévoir zéro", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3);
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const view = await getGameView(gameId, userId);
    expect(view!.forecastReview).toBeNull();
    expect(view!.salesHistory.rounds[0]!.forecastUnits).toBeNull();
  });

  it("une seule des deux prévisions suffit, et n'invente pas l'autre", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3);
    await resolveCurrentRound({
      gameId,
      userId,
      playerDecisions: { ...DECISIONS, forecast: { expectedUnits: 3000 } },
    });

    const review = (await getGameView(gameId, userId))!.forecastReview!;
    expect(review.lines).toHaveLength(1);
    expect(review.lines[0]!.label).toBe("Ventes");
  });

  it("une prévision nulle ne produit pas un écart relatif infini", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3);
    await resolveCurrentRound({
      gameId,
      userId,
      playerDecisions: { ...DECISIONS, forecast: { expectedUnits: 0 } },
    });

    const review = (await getGameView(gameId, userId))!.forecastReview!;
    expect(review.lines[0]!.forecast).toBe(0);
    expect(review.lines[0]!.relative).toBeNull();
    expect(Number.isFinite(review.lines[0]!.actual)).toBe(true);
  });

  it("une prévision absurde reste sans effet sur les comptes", async () => {
    // La prévision est une annonce, pas une consigne : le moteur ne la lit pas.
    const gameId = await createSoloGame(userId, "quarter", 3);
    await resolveCurrentRound({
      gameId,
      userId,
      playerDecisions: {
        ...DECISIONS,
        forecast: { expectedUnits: 999_999, expectedCash: -999_999 },
      },
    });
    const view = await getGameView(gameId, userId);

    const sold = Object.values(view!.lastResult!.market.bySegment).reduce(
      (sum, d) => sum + d.sold,
      0,
    );
    expect(sold).toBeGreaterThan(0);
    expect(sold).toBeLessThan(999_999);
    expect(Number.isFinite(view!.lastResult!.incomeStatement.netIncome)).toBe(true);
    // et l'écart est simplement énorme, ce qui est le message
    const ventes = view!.forecastReview!.lines.find((l) => l.label === "Ventes")!;
    expect(ventes.relative).toBeLessThan(-0.9);
  });
});
