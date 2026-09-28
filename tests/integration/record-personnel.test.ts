import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * REJOUER NE SE COMPARAIT À RIEN.
 *
 * L'écran de fin propose « Rejouer NOVA », mais la deuxième partie ne savait
 * pas qu'il y en avait eu une première. Les parties passées sont pourtant là,
 * avec leur IPG — la seule mesure qui se compare d'une partie à l'autre, un
 * résultat cumulé dépendant du nombre de tours et du niveau.
 *
 * Ce test tient les trois bornes du record : le même métier, les parties solo,
 * et soi-même. Il passe par la vraie base parce que la requête lit le scénario
 * et le mode DANS le JSON de la partie : une faute de chemin ne se verrait pas
 * autrement.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { gameRankings, games, players, teams, users } from "@/db/schema";
import { createSoloGame, resolveCurrentRound } from "@/services/game.service";
import { recordPersonnel } from "@/services/profile.service";
import type { EngineScenarioConfig, RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4500,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
  finance: { newLoan: 0, loanRepayment: 0 },
};

/** Une partie solo menée à son terme, et l'IPG obtenu. */
async function partieEntiere(userId: string, prix: number): Promise<{ gameId: string; bpi: number }> {
  const gameId = await createSoloGame(userId, "quarter", 3);
  for (let i = 0; i < 12; i += 1) {
    const { finished } = await resolveCurrentRound({
      gameId,
      userId,
      playerDecisions: { ...DECISIONS, price: prix },
    });
    if (finished) break;
  }
  const equipe = (
    await db
      .select({ id: teams.id })
      .from(teams)
      .innerJoin(players, eq(players.teamId, teams.id))
      .where(eq(teams.gameId, gameId))
  )[0]!;
  const rang = (
    await db.select().from(gameRankings).where(eq(gameRankings.teamId, equipe.id))
  )[0]!;
  return { gameId, bpi: Number(rang.bpi) };
}

let userId: string;
let scenarioCode: string;
let premiere: { gameId: string; bpi: number };
let seconde: { gameId: string; bpi: number };

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "record@business-arena.local", displayName: "Record" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
  // Deux prix éloignés : les deux parties n'obtiennent pas le même IPG.
  premiere = await partieEntiere(userId, 59);
  seconde = await partieEntiere(userId, 95);
  const g = (await db.select().from(games).where(eq(games.id, premiere.gameId)))[0]!;
  scenarioCode = (g.scenarioSnapshot as EngineScenarioConfig).code;
}, 120_000);

describe("le record personnel", () => {
  it("rend la meilleure partie passée sur le même métier", async () => {
    const record = await recordPersonnel({ userId, scenarioCode, saufPartie: seconde.gameId });
    expect(record).not.toBeNull();
    expect(record!.bpi).toBeCloseTo(premiere.bpi, 2);
  });

  it("exclut la partie en cours : elle est le candidat, pas le tenant", async () => {
    // On exclut la MEILLEURE des deux : si l'exclusion ne marchait pas, c'est
    // elle qu'on lirait. Prendre la meilleure plutôt qu'une des deux au hasard
    // rend l'essai indépendant de l'IPG que le moteur donne ce jour-là — la
    // première écriture affirmait « ce n'est pas le maximum des deux », ce qui
    // est faux dès que la partie restante EST la meilleure.
    const [meilleure, autre] =
      premiere.bpi >= seconde.bpi ? [premiere, seconde] : [seconde, premiere];
    const record = await recordPersonnel({ userId, scenarioCode, saufPartie: meilleure.gameId });
    expect(record!.bpi).toBeCloseTo(autre.bpi, 2);
  });

  it("un autre métier n'a pas de record", async () => {
    expect(
      await recordPersonnel({ userId, scenarioCode: "un-autre-metier", saufPartie: seconde.gameId }),
    ).toBeNull();
  });

  it("une première partie n'a rien à battre", async () => {
    const autre = await db
      .insert(users)
      .values({ email: "premiere@business-arena.local", displayName: "Première" })
      .returning({ id: users.id });
    expect(
      await recordPersonnel({
        userId: autre[0]!.id,
        scenarioCode,
        saufPartie: seconde.gameId,
      }),
    ).toBeNull();
  });
});
