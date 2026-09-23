import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * EN CONCOURS, L'ÉQUIPE APPARTIENT AU TOURNOI.
 *
 * Constaté en jouant une vraie finale : l'arène d'une partie de concours
 * proposait à un finaliste de REJOINDRE L'ÉQUIPE ADVERSE, et de renommer la
 * sienne. Les deux gestes venaient de la partie de classe, où le code
 * d'invitation range au hasard et où l'élève doit pouvoir se corriger. Ils
 * n'ont aucun sens dans un tournoi, et le second était destructeur : le
 * classement d'une phase porte `teams.name`, et qualifier compare ce nom au
 * libellé de l'inscription. Une équipe renommée devenait introuvable au moment
 * de qualifier — éliminée alors qu'elle avait gagné — et la phase suivante se
 * créait sans un seul joueur.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, players, teams, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { createClassGame, joinGameByCode, nommerEquipe } from "@/services/game.service";
import { getGameView } from "@/services/game.service";
import { choisirSonEquipe, peutChoisirSonEquipe } from "@/services/affectation.service";
import {
  createCompetition,
  getPlayerCompetition,
  joinCompetition,
  startQualification,
} from "@/services/competition.service";

let organizerId: string;
let orgId: string;
let competitionId: string;
const alpha = { userId: "", gameId: "", teamId: "" };
let equipeAdverse = "";

async function eleve(nom: string): Promise<string> {
  const inserted = await db
    .insert(users)
    .values({ email: `${nom}@figee.local`, displayName: nom })
    .returning({ id: users.id });
  return inserted[0]!.id;
}

beforeAll(async () => {
  const result = await registerTeacher({
    email: "orga@figee.fr",
    password: "motdepasse!",
    displayName: "Mme Martin",
    schoolName: "IUT GEA",
  });
  if ("error" in result) throw new Error(result.error);
  organizerId = result.userId;
  orgId = (await getTeacherOrgId(organizerId))!;
  const created = await createCompetition({
    organizerId,
    organizationId: orgId,
    name: "Tournoi figé",
    periodicity: "quarter",
    groupSize: 2,
    advancePerGroup: 1,
  });
  competitionId = created.competitionId;
  for (const equipe of ["Alpha", "Bravo"]) {
    const userId = await eleve(equipe.toLowerCase());
    await joinCompetition({ code: created.joinCode, userId, teamLabel: equipe });
    if (equipe === "Alpha") alpha.userId = userId;
  }
  await startQualification({ competitionId, organizerId });
  const mine = (await getPlayerCompetition(competitionId, alpha.userId))!;
  alpha.gameId = mine.myGameId!;
  const rows = await db.select().from(teams).where(eq(teams.gameId, alpha.gameId));
  alpha.teamId = rows.find((t) => t.name === "Alpha")!.id;
  equipeAdverse = rows.find((t) => t.name !== "Alpha")!.id;
});

describe("une partie de concours, au premier tour", () => {
  it("le tour est bien le premier : ce n'est pas lui qui ferme les gestes", async () => {
    const game = (await db.select().from(games).where(eq(games.id, alpha.gameId)))[0]!;
    expect(game.currentRound).toBe(1);
    expect(game.status).toBe("running");
    expect(game.mode).toBe("competition");
  });

  it("personne ne peut passer chez l'adversaire", async () => {
    const game = (await db.select().from(games).where(eq(games.id, alpha.gameId)))[0]!;
    expect(peutChoisirSonEquipe(game)).toBe(false);
    await expect(
      choisirSonEquipe({ gameId: alpha.gameId, userId: alpha.userId, teamId: equipeAdverse }),
    ).rejects.toThrow(/inscription/i);
    // Et il n'a pas bougé d'un pouce.
    const ou = await db.select().from(players).where(eq(players.userId, alpha.userId));
    expect(ou[0]!.teamId).toBe(alpha.teamId);
  });

  it("l'écran ne propose ni l'un ni l'autre, et dit pourquoi", async () => {
    const vue = await getGameView(alpha.gameId, alpha.userId);
    expect(vue).not.toBeNull();
    expect(vue!.estUnConcours).toBe(true);
    expect(vue!.peutChoisirSonEquipe).toBe(false);
    expect(vue!.peutSeNommer).toBe(false);
  });

  it("personne ne peut renommer son équipe", async () => {
    await expect(
      nommerEquipe({ gameId: alpha.gameId, userId: alpha.userId, nom: "Les Invincibles" }),
    ).rejects.toThrow(/inscription/i);
    // Le nom qui relie la partie au concours est intact.
    const row = await db.select().from(teams).where(eq(teams.id, alpha.teamId));
    expect(row[0]!.name).toBe("Alpha");
  });
});

describe("une partie de classe garde ses deux gestes", () => {
  it("l'élève choisit son équipe et la nomme, au premier tour", async () => {
    const { gameId, joinCode } = await createClassGame({
      teacherId: organizerId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 0,
    });
    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    expect(game.mode).not.toBe("competition");
    expect(peutChoisirSonEquipe(game)).toBe(true);

    const lea = await eleve("lea-classe");
    await joinGameByCode({ code: joinCode, userId: lea, pseudo: "Léa" });
    const equipes = await db.select().from(teams).where(eq(teams.gameId, gameId));
    const sienne = (await db.select().from(players).where(eq(players.userId, lea)))[0]!.teamId;
    const autre = equipes.find((t) => t.id !== sienne)!;

    await choisirSonEquipe({ gameId, userId: lea, teamId: autre.id });
    expect((await db.select().from(players).where(eq(players.userId, lea)))[0]!.teamId).toBe(autre.id);
    const { nom } = await nommerEquipe({ gameId, userId: lea, nom: "Les Invincibles" });
    expect(nom).toBe("Les Invincibles");
  });
});
