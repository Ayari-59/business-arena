import { beforeAll, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";

/**
 * LES FORMULAIRES PUBLICS N'ÉCRIVENT PAS À L'AVEUGLE.
 *
 * Trois actions serveur ne demandent aucune session et créent pourtant des
 * lignes. Mesuré à l'audit : `/jouer` créait une partie ENTIÈRE par envoi,
 * `/join` et `/compete` un utilisateur invité AVANT même de regarder si le
 * code existe. Une boucle y laissait autant de lignes qu'elle faisait de
 * requêtes. Ce n'est pas une faille d'autorisation, c'est une amplification
 * d'écriture — et elle coûte la base.
 *
 * Deux remèdes, deux natures : un plafond là où la création est légitime, un
 * simple ordre des opérations là où le code peut être faux.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, users } from "@/db/schema";
import {
  PLAFOND_PARTIES_PAR_IP_PAR_HEURE,
  TropDePartiesError,
} from "@/services/game-creation.service";
import { createSoloGame, refusDeRejoindre } from "@/services/game.service";
import { refusDeSInscrire } from "@/services/competition.service";

const compter = async (table: typeof games | typeof users) =>
  (await db.select({ n: sql<number>`count(*)::int` }).from(table))[0]!.n;

let invite: string;

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ email: "invite@debit.test", displayName: "Invité" })
    .returning({ id: users.id });
  invite = u!.id;
});

describe("le plafond des parties publiques", () => {
  it("laisse passer l'usage réel, puis refuse", async () => {
    const ip = "203.0.113.7";
    for (let i = 0; i < PLAFOND_PARTIES_PAR_IP_PAR_HEURE; i++) {
      await createSoloGame(invite, "quarter", 3, 3, false, undefined, 2, ip);
    }
    await expect(
      createSoloGame(invite, "quarter", 3, 3, false, undefined, 2, ip),
    ).rejects.toBeInstanceOf(TropDePartiesError);
  });

  it("ne compte que l'adresse en cause : le voisin joue", async () => {
    const avant = await compter(games);
    await createSoloGame(invite, "quarter", 3, 3, false, undefined, 2, "198.51.100.4");
    expect(await compter(games)).toBe(avant + 1);
  });

  it("sans adresse connue, rien n'est plafonné : une partie d'enseignant n'a rien à compter", async () => {
    const avant = await compter(games);
    await createSoloGame(invite, "quarter", 3, 3, false, undefined, 2, null);
    expect(await compter(games)).toBe(avant + 1);
  });
});

describe("un code faux ne crée rien", () => {
  it("le refus de rejoindre se prononce sur une lecture seule", async () => {
    const avantUtilisateurs = await compter(users);
    const avantParties = await compter(games);
    expect(await refusDeRejoindre("ZZZZZZ")).toBe("Code de partie inconnu.");
    expect(await compter(users)).toBe(avantUtilisateurs);
    expect(await compter(games)).toBe(avantParties);
  });

  it("le refus de s'inscrire à un concours aussi", async () => {
    const avant = await compter(users);
    expect(await refusDeSInscrire("ZZZZZZ")).toBe("Code de concours inconnu.");
    expect(await compter(users)).toBe(avant);
  });
});
