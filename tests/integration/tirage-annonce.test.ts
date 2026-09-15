import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE TIRAGE ANNONCÉ EST CELUI QUI TOMBE.
 *
 * La vue lit le tirage du tour d'avance, pour que le joueur solo le vive à
 * l'ouverture. La promesse qui va avec : ce qu'il a retourné est exactement
 * ce que la clôture tire — pas une carte de plus, pas une de moins. Une
 * divergence ferait pire que l'ancien silence : elle mentirait.
 */
vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { createSoloGame, getGameView, resolveCurrentRound } from "@/services/game.service";

let userId: string;
let gameId: string;

beforeAll(async () => {
  const u = await db.insert(users).values({ email: "tirage@test.local", displayName: "Tirage" }).returning({ id: users.id });
  userId = u[0]!.id;
  gameId = await createSoloGame(userId, "quarter", 3, 3, false, "nova");
});

describe("le tirage lu d'avance", () => {
  it("annonce à chaque tour exactement les cartes que la clôture tire", async () => {
    let toursAvecCarte = 0;
    for (let tour = 1; tour <= 6; tour++) {
      const avant = (await getGameView(gameId, userId))!;
      const annonce = avant.upcomingDraw.map((c) => c.code).sort();
      await resolveCurrentRound({ gameId, userId, playerDecisions: avant.proposedDecisions });
      const apres = (await getGameView(gameId, userId))!;
      // Les cartes RSE (tirées sur le standing, hors aperçu) n'entrent pas ici.
      const tombees = apres.periods.at(-1)!.events.filter((c) => !c.startsWith("rse_")).sort();
      expect(tombees, `tour ${tour}`).toEqual(annonce);
      if (annonce.length > 0) toursAvecCarte++;
    }
    // Sur six tours de NOVA, il tombe des cartes : sinon le test ne prouverait rien.
    expect(toursAvecCarte).toBeGreaterThan(0);
  });

  it("une fois la partie finie, plus rien n'est annoncé", async () => {
    const vue = (await getGameView(gameId, userId))!;
    if (vue.status === "finished") expect(vue.upcomingDraw).toEqual([]);
  });
});
