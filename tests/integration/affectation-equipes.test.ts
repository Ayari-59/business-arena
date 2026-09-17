import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * QUI JOUE DANS QUELLE ÉQUIPE.
 *
 * Le code d'invitation range l'élève dans l'équipe la moins remplie, et cette
 * affectation était définitive : ni l'élève ni l'enseignant n'avaient de geste
 * pour la corriger. Deux pannes de salle en découlaient — la classe qui
 * travaille en groupes constitués et se retrouve mélangée, et l'élève revenu
 * d'un autre poste que le serveur ne reconnaît plus, réaffecté au hasard.
 *
 * On vérifie ici les deux gestes et leurs gardes, sur Postgres embarqué.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { players, teams, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  getGameView,
  joinGameByCode,
} from "@/services/game.service";
import {
  affecterEleve,
  choisirSonEquipe,
  compositionDesEquipes,
} from "@/services/affectation.service";

let teacherId: string;
let autreProf: string;
let orgId: string;

async function eleve(nom: string): Promise<string> {
  const inserted = await db
    .insert(users)
    .values({ email: `${nom}@guest.business-arena.local`, displayName: nom })
    .returning({ id: users.id });
  return inserted[0]!.id;
}

async function equipeDe(userId: string): Promise<string> {
  return (await db.select().from(players).where(eq(players.userId, userId)))[0]!.teamId;
}

beforeAll(async () => {
  const result = await registerTeacher({
    email: "prof@lycee.fr",
    password: "motdepasse!",
    displayName: "Mme Martin",
    schoolName: "Lycée Pasteur",
  });
  if ("error" in result) throw new Error(result.error);
  teacherId = result.userId;
  orgId = (await getTeacherOrgId(teacherId))!;

  const autre = await registerTeacher({
    email: "collegue@lycee.fr",
    password: "motdepasse!",
    displayName: "M. Duval",
    schoolName: "Lycée Pasteur",
  });
  if ("error" in autre) throw new Error(autre.error);
  autreProf = autre.userId;
});

describe("l'élève choisit son équipe au premier tour", () => {
  it("rejoint ses camarades, et le refus est explicite une fois le tour clos", async () => {
    const { gameId, joinCode } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
    });
    const lea = await eleve("lea");
    const tom = await eleve("tom");
    await joinGameByCode({ code: joinCode, userId: lea, pseudo: "Léa" });
    await joinGameByCode({ code: joinCode, userId: tom, pseudo: "Tom" });

    // La répartition automatique les sépare : c'est exactement ce qu'on répare.
    const equipeDeLea = await equipeDe(lea);
    const equipeDeTom = await equipeDe(tom);
    expect(equipeDeLea).not.toBe(equipeDeTom);

    // La vue de l'élève lui montre qui est où et lui ouvre le choix.
    const vue = await getGameView(gameId, tom);
    expect(vue!.peutChoisirSonEquipe).toBe(true);
    expect(vue!.equipesDeLaClasse).toHaveLength(2);
    expect(vue!.equipesDeLaClasse.flatMap((e) => e.membres.map((m) => m.nom)).sort()).toEqual([
      "Léa",
      "Tom",
    ]);

    await choisirSonEquipe({ gameId, userId: tom, teamId: equipeDeLea });
    expect(await equipeDe(tom)).toBe(equipeDeLea);
    // Une seule ligne d'appartenance : le déplacement remplace, il n'ajoute pas.
    expect(await db.select().from(players).where(eq(players.userId, tom))).toHaveLength(1);

    // Rejoindre l'équipe où l'on est déjà ne casse rien.
    await choisirSonEquipe({ gameId, userId: tom, teamId: equipeDeLea });
    expect(await db.select().from(players).where(eq(players.userId, tom))).toHaveLength(1);

    // On ne se glisse pas dans une équipe pilotée par l'ordinateur.
    const botTeam = (
      await db.select().from(teams).where(and(eq(teams.gameId, gameId), eq(teams.controller, "bot")))
    )[0]!;
    await expect(choisirSonEquipe({ gameId, userId: tom, teamId: botTeam.id })).rejects.toThrow(
      /ordinateur/,
    );

    // Le premier tour clos, l'élève ne bouge plus seul — et le message nomme
    // son recours plutôt que de le laisser bloqué.
    await closeCurrentRound({ gameId, teacherId });
    await expect(
      choisirSonEquipe({ gameId, userId: tom, teamId: equipeDeTom }),
    ).rejects.toThrow(/enseignant/);
    expect((await getGameView(gameId, tom))!.peutChoisirSonEquipe).toBe(false);

    // L'enseignant, lui, peut encore déplacer : c'est le seul recours restant.
    await affecterEleve({ gameId, teacherId, eleveId: tom, teamId: equipeDeTom });
    expect(await equipeDe(tom)).toBe(equipeDeTom);
  });
});

describe("l'enseignant affecte les élèves", () => {
  it("compose ses équipes, et seulement les siennes", async () => {
    const { gameId, joinCode } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 3,
      botCount: 0,
    });
    const noms = ["ines", "karim", "manon"];
    const ids: string[] = [];
    for (const nom of noms) {
      const id = await eleve(nom);
      ids.push(id);
      await joinGameByCode({ code: joinCode, userId: id, pseudo: nom });
    }

    // Tout le monde dans la première équipe : le groupe de la classe.
    const premiere = (await compositionDesEquipes(gameId))[0]!;
    for (const id of ids) {
      await affecterEleve({ gameId, teacherId, eleveId: id, teamId: premiere.teamId });
    }
    const composition = await compositionDesEquipes(gameId);
    expect(composition).toHaveLength(3);
    expect(composition[0]!.membres.map((m) => m.nom)).toEqual(["ines", "karim", "manon"]);
    expect(composition[1]!.membres).toHaveLength(0);
    expect(composition[2]!.membres).toHaveLength(0);

    // Les gardes : la partie d'un collègue, une équipe d'ailleurs, un élève
    // qui n'a jamais rejoint.
    await expect(
      affecterEleve({ gameId, teacherId: autreProf, eleveId: ids[0]!, teamId: premiere.teamId }),
    ).rejects.toThrow(/pas la vôtre/);

    const ailleurs = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 0,
    });
    const equipeDAilleurs = (await compositionDesEquipes(ailleurs.gameId))[0]!;
    await expect(
      affecterEleve({ gameId, teacherId, eleveId: ids[0]!, teamId: equipeDAilleurs.teamId }),
    ).rejects.toThrow(/n'appartient pas à la partie/);

    const inconnu = await eleve("zoe");
    await expect(
      affecterEleve({ gameId, teacherId, eleveId: inconnu, teamId: premiere.teamId }),
    ).rejects.toThrow(/pas encore rejoint/);
  });
});
