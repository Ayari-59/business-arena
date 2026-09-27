import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * CE QUE LA LISTE DES PARTIES DIT MAINTENANT.
 *
 * Elle affichait six fois « NOVA », avec la même icône et la même allure :
 * rien ne disait laquelle était celle de la seconde 3, laquelle attendait une
 * clôture, laquelle était finie. Trois choses à prouver :
 *
 * · LE NOM appartient à l'enseignant, se change, s'efface, et n'est visible
 *   que de lui.
 * · LES COMPTES sont justes : équipes humaines, élèves inscrits.
 * · « À CLORE » ne s'allume que quand toutes les équipes humaines ont rendu,
 *   ce qui est la seule chose qui appelle un geste et ne se lisait qu'en
 *   ouvrant la partie.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { compositionDesEquipes } from "@/services/affectation.service";
import {
  createClassGame,
  getTeacherGames,
  getTeacherGameView,
  joinGameByCode,
  nommerLaPartie,
  NOM_PARTIE_MAX,
  submitTeamDecisions,
} from "@/services/game.service";

let prof: string;
let gameId: string;
let joinCode: string;

const DECISIONS = {
  price: 59,
  productionPlan: 1000,
  marketingBudget: 3000,
  qualityBudget: 0,
  maintenanceBudget: 0,
};

let suivant = 0;
async function eleve(nom: string): Promise<string> {
  suivant += 1;
  const [u] = await db
    .insert(users)
    .values({ email: `eleve${suivant}@liste.test`, displayName: nom })
    .returning({ id: users.id });
  return u!.id;
}

async function resume(id = gameId) {
  return (await getTeacherGames(prof)).find((g) => g.gameId === id)!;
}

beforeAll(async () => {
  const r = await registerTeacher({
    email: "liste@lycee.test",
    password: "motdepasse!",
    displayName: "M. Liste",
    schoolName: "Lycée de la Liste",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const partie = await createClassGame({
    teacherId: prof,
    organizationId: (await getTeacherOrgId(prof))!,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
    seed: 7,
  });
  gameId = partie.gameId;
  joinCode = partie.joinCode;
});

describe("le nom de la partie", () => {
  it("n'existe pas tant qu'on n'en a pas donné", async () => {
    expect((await resume()).label).toBeNull();
    expect((await getTeacherGameView(gameId, prof))!.label).toBeNull();
  });

  it("se donne, se relit, et se change", async () => {
    await nommerLaPartie({ gameId, teacherId: prof, nom: "  Seconde 3  " });
    expect((await resume()).label).toBe("Seconde 3");
    await nommerLaPartie({ gameId, teacherId: prof, nom: "BTS MCO groupe B" });
    expect((await resume()).label).toBe("BTS MCO groupe B");
  });

  it("s'efface avec un champ vide : la partie reprend le nom de son scénario", async () => {
    await nommerLaPartie({ gameId, teacherId: prof, nom: "   " });
    expect((await resume()).label).toBeNull();
    await nommerLaPartie({ gameId, teacherId: prof, nom: "Seconde 3" });
  });

  it("ne dépasse pas la ligne de liste qu'il doit tenir", async () => {
    await nommerLaPartie({ gameId, teacherId: prof, nom: "x".repeat(200) });
    expect((await resume()).label).toHaveLength(NOM_PARTIE_MAX);
    await nommerLaPartie({ gameId, teacherId: prof, nom: "Seconde 3" });
  });

  it("n'appartient qu'à l'enseignant de la partie", async () => {
    const intrus = await registerTeacher({
      email: "intrus@liste.test",
      password: "motdepasse!",
      displayName: "M. Intrus",
      schoolName: "Lycée d'à côté",
    });
    if ("error" in intrus) throw new Error(intrus.error);
    await expect(
      nommerLaPartie({ gameId, teacherId: intrus.userId, nom: "à moi" }),
    ).rejects.toThrow();
    expect((await resume()).label).toBe("Seconde 3");
  });
});

describe("ce que la carte compte", () => {
  it("les équipes humaines, et les élèves qui y sont entrés", async () => {
    const avant = await resume();
    // Un bot a été créé dans la même partie : il ne compte pas comme équipe.
    expect(avant.teamsCount).toBe(2);
    expect(avant.elevesCount).toBe(0);

    for (const nom of ["Ana", "Bilal", "Chloé"]) {
      await joinGameByCode({ code: joinCode, userId: await eleve(nom), pseudo: nom });
    }
    expect((await resume()).elevesCount).toBe(3);
  });
});

describe("« tour à clore »", () => {
  it("reste éteint tant qu'une équipe humaine n'a pas rendu", async () => {
    expect((await resume()).aClore).toBe(false);
  });

  it("s'allume quand toutes les équipes humaines ont rendu", async () => {
    const composition = (await getTeacherGameView(gameId, prof))!.teams.filter(
      (t) => t.controller === "human",
    );
    expect(composition).toHaveLength(2);

    // Un joueur par équipe rend ses décisions : c'est l'équipe qui rend.
    const equipes = await compositionDesEquipes(gameId);
    let rendues = 0;
    for (const t of equipes) {
      const porteur = t.membres[0]?.userId;
      if (!porteur) continue;
      await submitTeamDecisions({ gameId, userId: porteur, payload: DECISIONS });
      rendues += 1;
      const etat = await resume();
      expect(etat.aClore, `${rendues} équipe(s) sur ${equipes.length}`).toBe(
        rendues === equipes.length,
      );
    }
    expect(rendues).toBe(2);
  });
});
