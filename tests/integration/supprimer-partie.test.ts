import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * ON NE SUPPRIME QU'UNE PARTIE QUI N'A JAMAIS SERVI.
 *
 * Techniquement, effacer une partie est simple : les neuf clés étrangères qui
 * pointent vers elle sont en cascade, rien ne resterait orphelin. Humainement,
 * c'est le geste le plus dangereux de l'application — il emporte du travail
 * d'élève et ne se défait pas.
 *
 * Cette garde tient donc la BORNE, et c'est tout ce qui compte ici : une
 * partie vierge s'efface et ne laisse rien derrière ; une partie jouée, ou une
 * partie où quelqu'un s'est inscrit, se refuse. Un refus qui se mettrait à
 * passer ne casserait aucun autre test — il ferait juste disparaître le travail
 * d'une classe.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { companyStates, games, rounds, teams, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  createClassGame,
  joinGameByCode,
  submitTeamDecisions,
  supprimerPartie,
} from "@/services/game.service";
import { PARTIE_AVEC_ELEVES, PARTIE_DEJA_JOUEE } from "@/services/archivage";

let prof: string;
let autreProf: string;

async function nouvellePartie() {
  const p = await createClassGame({
    teacherId: prof,
    organizationId: (await getTeacherOrgId(prof))!,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    seed: 7,
  });
  return p;
}

beforeAll(async () => {
  const r = await registerTeacher({
    email: "corbeille@lycee.test",
    password: "motdepasse!",
    displayName: "M. Corbeille",
    schoolName: "Lycée de la Corbeille",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const autre = await registerTeacher({
    email: "voisin3@lycee.test",
    password: "motdepasse!",
    displayName: "Mme Voisine",
    schoolName: "Lycée Voisin",
  });
  if ("error" in autre) throw new Error(autre.error);
  autreProf = autre.userId;
});

describe("une partie vierge", () => {
  it("s'efface, et n'y laisse rien : ni équipe, ni tour, ni état", async () => {
    const { gameId } = await nouvellePartie();
    const equipes = (
      await db.select({ id: teams.id }).from(teams).where(eq(teams.gameId, gameId))
    ).map((t) => t.id);
    expect(equipes.length).toBeGreaterThan(0);

    await supprimerPartie({ gameId, teacherId: prof });

    expect(await db.select().from(games).where(eq(games.id, gameId))).toEqual([]);
    expect(await db.select().from(teams).where(eq(teams.gameId, gameId))).toEqual([]);
    expect(await db.select().from(rounds).where(eq(rounds.gameId, gameId))).toEqual([]);
    const [etats] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(companyStates)
      .where(inArray(companyStates.teamId, equipes));
    expect(etats!.n).toBe(0);
  });

  it("même avec des bots dedans : ils ne sont le travail de personne", async () => {
    const { gameId } = await nouvellePartie();
    const bots = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.gameId, gameId));
    expect(bots.length).toBeGreaterThan(1);
    await expect(supprimerPartie({ gameId, teacherId: prof })).resolves.not.toThrow();
  });
});

describe("une partie où quelqu'un est entré", () => {
  it("se refuse, et dit d'aller la ranger", async () => {
    const { gameId, joinCode } = await nouvellePartie();
    const [u] = await db
      .insert(users)
      .values({ email: `entre-${gameId}@test.local`, displayName: "Élève" })
      .returning({ id: users.id });
    const j = await joinGameByCode({ code: joinCode, userId: u!.id });
    if ("error" in j) throw new Error(j.error);

    await expect(supprimerPartie({ gameId, teacherId: prof })).rejects.toThrow(
      PARTIE_AVEC_ELEVES,
    );
    expect((await db.select().from(games).where(eq(games.id, gameId))).length).toBe(1);
  });
});

describe("une partie déjà jouée", () => {
  it("se refuse dès qu'une décision est rendue, avant même la clôture", async () => {
    const { gameId, joinCode } = await nouvellePartie();
    const [u] = await db
      .insert(users)
      .values({ email: `joue-${gameId}@test.local`, displayName: "Élève" })
      .returning({ id: users.id });
    const j = await joinGameByCode({ code: joinCode, userId: u!.id });
    if ("error" in j) throw new Error(j.error);
    await submitTeamDecisions({
      gameId,
      userId: u!.id,
      payload: {
        price: 59,
        productionPlan: 1000,
        marketingBudget: 3000,
        qualityBudget: 0,
        maintenanceBudget: 0,
      },
    });
    // L'inscription seule suffirait déjà à refuser ; on vérifie que la décision
    // rendue ferme la porte de son côté, pour le jour où l'une des deux bornes
    // bougerait.
    await expect(supprimerPartie({ gameId, teacherId: prof })).rejects.toThrow(
      new RegExp(`${PARTIE_DEJA_JOUEE}|${PARTIE_AVEC_ELEVES}`),
    );
    expect((await db.select().from(games).where(eq(games.id, gameId))).length).toBe(1);
  });
});

describe("la partie d'un autre", () => {
  it("ne se supprime pas, même vierge", async () => {
    const { gameId } = await nouvellePartie();
    await expect(supprimerPartie({ gameId, teacherId: autreProf })).rejects.toThrow(
      "Partie introuvable",
    );
    expect((await db.select().from(games).where(eq(games.id, gameId))).length).toBe(1);
  });
});
