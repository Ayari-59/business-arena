import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * RANGER UNE PARTIE FERME TOUTES LES PORTES, ET N'EFFACE RIEN.
 *
 * Trois choses à prouver, parce que l'archivage est une DATE et non un statut :
 * la partie garde son statut (c'est ce qui rend le désarchivage exact), elle
 * n'est plus jouable par aucun chemin, et rien n'a disparu.
 *
 * Le deuxième point est celui qui se serait oublié : le statut ne changeant
 * pas, une partie EN COURS rangée serait restée jouable si l'on n'avait gardé
 * que la porte d'entrée.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { games, rounds, teams, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  archiverPartie,
  createClassGame,
  desarchiverPartie,
  getTeacherGames,
  joinGameByCode,
  refusDeRejoindre,
  resolveCurrentRound,
} from "@/services/game.service";
import { PARTIE_ARCHIVEE } from "@/services/archivage";

let prof: string;
let autreProf: string;
let gameId: string;
let joinCode: string;
let eleve: string;

const DECISIONS = {
  price: 59,
  productionPlan: 1000,
  marketingBudget: 3000,
  qualityBudget: 0,
  maintenanceBudget: 0,
};

beforeAll(async () => {
  const r = await registerTeacher({
    email: "rangement@lycee.test",
    password: "motdepasse!",
    displayName: "M. Rangement",
    schoolName: "Lycée du Rangement",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const autre = await registerTeacher({
    email: "voisin@lycee.test",
    password: "motdepasse!",
    displayName: "Mme Voisine",
    schoolName: "Lycée Voisin",
  });
  if ("error" in autre) throw new Error(autre.error);
  autreProf = autre.userId;

  const partie = await createClassGame({
    teacherId: prof,
    organizationId: (await getTeacherOrgId(prof))!,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    seed: 7,
  });
  gameId = partie.gameId;
  joinCode = partie.joinCode;

  const [u] = await db
    .insert(users)
    .values({ email: "eleve@rangement.test", displayName: "Élève" })
    .returning({ id: users.id });
  eleve = u!.id;
  const j = await joinGameByCode({ code: joinCode, userId: eleve });
  if ("error" in j) throw new Error(j.error);
});

describe("une partie EN COURS que l'on range", () => {
  it("disparaît de la liste, sans disparaître de la base", async () => {
    expect((await getTeacherGames(prof)).map((g) => g.gameId)).toContain(gameId);
    await archiverPartie({ gameId, teacherId: prof });
    expect((await getTeacherGames(prof)).map((g) => g.gameId)).not.toContain(gameId);
    // Elle est là quand on la demande, et datée.
    const rangees = (await getTeacherGames(prof, true)).filter((g) => g.archivedAt !== null);
    expect(rangees.map((g) => g.gameId)).toContain(gameId);
    expect(rangees.find((g) => g.gameId === gameId)!.archivedAt).toBeInstanceOf(Date);
  });

  it("garde son statut : c'est ce qui rend le retour exact", async () => {
    const [g] = await db.select().from(games).where(eq(games.id, gameId));
    expect(g!.status).toBe("running");
  });

  it("n'a rien perdu : ses équipes et ses tours sont intacts", async () => {
    const [eq1] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(teams)
      .where(eq(teams.gameId, gameId));
    const [t] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(rounds)
      .where(eq(rounds.gameId, gameId));
    expect(eq1!.n).toBeGreaterThan(0);
    expect(t!.n).toBeGreaterThan(0);
  });

  it("ne se rejoint plus avec son code", async () => {
    expect(await refusDeRejoindre(joinCode)).toBe(PARTIE_ARCHIVEE);
    const j = await joinGameByCode({ code: joinCode, userId: eleve });
    expect(j).toEqual({ error: PARTIE_ARCHIVEE });
  });

  it("NE SE JOUE PLUS NON PLUS, par l'élève déjà entré", async () => {
    // Le statut n'ayant pas bougé, ce chemin serait resté ouvert si l'on
    // n'avait gardé que la porte d'entrée.
    await expect(
      resolveCurrentRound({ gameId, userId: eleve, playerDecisions: DECISIONS }),
    ).rejects.toThrow(PARTIE_ARCHIVEE);
  });
});

describe("le geste se défait", () => {
  it("la partie revient dans la liste, et se rejoue", async () => {
    await desarchiverPartie({ gameId, teacherId: prof });
    expect((await getTeacherGames(prof)).map((g) => g.gameId)).toContain(gameId);
    expect(await refusDeRejoindre(joinCode)).toBeNull();
    await expect(
      resolveCurrentRound({ gameId, userId: eleve, playerDecisions: DECISIONS }),
    ).resolves.not.toThrow();
  });
});

describe("la partie d'un autre", () => {
  it("ne se range pas", async () => {
    await expect(archiverPartie({ gameId, teacherId: autreProf })).rejects.toThrow(
      "Partie introuvable",
    );
  });

  it("ne se ressort pas non plus", async () => {
    await expect(desarchiverPartie({ gameId, teacherId: autreProf })).rejects.toThrow(
      "Partie introuvable",
    );
  });
});
