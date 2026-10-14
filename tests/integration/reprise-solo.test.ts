import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * UNE PARTIE SOLO SE RETROUVE : SUR L'APPAREIL, ET AILLEURS PAR SON CODE.
 *
 * La partie est en base à chaque tour. Ce qu'on prouve ici, c'est que le joueur
 * qui revient la VOIT (liste des parties en cours), que ni une partie finie, ni
 * une partie de classe, ni celle d'un autre n'y figurent, et que le code
 * personnel rend la partie — avec son propriétaire — à un appareil neuf.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { games, users } from "@/db/schema";
import { createSoloGame } from "@/services/game-creation.service";
import { partiesSoloEnCours } from "@/services/partie-en-cours.service";
import { attribuerCodeDeReprise, reprendreSaPlace } from "@/services/reprise.service";

async function nouvelInvite(): Promise<string> {
  const id = randomUUID();
  await db.insert(users).values({
    id,
    email: `guest-${id}@guest.business-arena.local`,
    displayName: "Invité",
  });
  return id;
}

let joueur: string;
let autre: string;
let partie: string;

beforeAll(async () => {
  joueur = await nouvelInvite();
  autre = await nouvelInvite();
  partie = await createSoloGame(joueur);
  await createSoloGame(autre);
});

describe("les parties solo en cours", () => {
  it("propose à son joueur la partie qu'il a commencée, au bon tour", async () => {
    const liste = await partiesSoloEnCours(joueur);
    expect(liste).toHaveLength(1);
    expect(liste[0]).toMatchObject({ gameId: partie, tour: 1 });
    expect(liste[0]!.tours).toBeGreaterThanOrEqual(1);
    expect(liste[0]!.entreprise.length).toBeGreaterThan(0);
  });

  it("ne montre jamais la partie de quelqu'un d'autre", async () => {
    const liste = await partiesSoloEnCours(autre);
    expect(liste.map((p) => p.gameId)).not.toContain(partie);
  });

  it("ne propose rien à un joueur sans partie", async () => {
    expect(await partiesSoloEnCours(await nouvelInvite())).toEqual([]);
  });

  it("cesse de proposer une partie terminée ou rangée", async () => {
    const terminee = await createSoloGame(joueur);
    expect((await partiesSoloEnCours(joueur)).map((p) => p.gameId)).toContain(terminee);
    await db.update(games).set({ status: "finished" }).where(eq(games.id, terminee));
    expect((await partiesSoloEnCours(joueur)).map((p) => p.gameId)).not.toContain(terminee);

    const rangee = await createSoloGame(joueur);
    await db.update(games).set({ archivedAt: new Date() }).where(eq(games.id, rangee));
    expect((await partiesSoloEnCours(joueur)).map((p) => p.gameId)).not.toContain(rangee);
  });

  it("n'en propose pas plus de trois, la plus récente d'abord", async () => {
    const lecteur = await nouvelInvite();
    const ids: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      ids.push(await createSoloGame(lecteur));
      await new Promise((r) => setTimeout(r, 5));
    }
    const liste = await partiesSoloEnCours(lecteur);
    expect(liste).toHaveLength(3);
    expect(liste[0]!.gameId).toBe(ids[4]);
  });
});

describe("le code de reprise d'une partie solo", () => {
  it("est stable : le redemander rend le même, qu'on a pu noter", async () => {
    const un = await attribuerCodeDeReprise(partie, joueur);
    const deux = await attribuerCodeDeReprise(partie, joueur);
    expect(un).toBe(deux);
  });

  it("rend la partie et son propriétaire à un appareil neuf", async () => {
    const code = await attribuerCodeDeReprise(partie, joueur);
    const retrouve = await reprendreSaPlace({ code, ip: "203.0.113.7" });
    expect("error" in retrouve).toBe(false);
    if ("error" in retrouve) return;
    expect(retrouve.userId).toBe(joueur);
    expect(retrouve.gameId).toBe(partie);
  });

  it("refuse un code inconnu", async () => {
    const r = await reprendreSaPlace({ code: "ZZZZ-ZZZZ", ip: "203.0.113.8" });
    expect("error" in r).toBe(true);
  });
});
