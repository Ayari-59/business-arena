import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * L'équipe se donne un nom, de bout en bout.
 *
 * Le test unitaire garde le nettoyage du nom ; celui-ci garde la règle qui le
 * sépare de l'élève : qui a le droit de nommer, jusqu'à quand, et ce que la vue
 * en dit ensuite. Les équipes naissaient numérotées et rien ne pouvait les
 * renommer, ni l'élève ni l'enseignant : six trimestres se jouaient au nom d'un
 * numéro.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  getGameView,
  joinGameByCode,
  nommerEquipe,
} from "@/services/game.service";

let prof: string;
let gameId: string;
let alice: string;
let bob: string;
let etranger: string;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "nommage@lycee.test",
    password: "motdepasse!",
    displayName: "M. Nommage",
    schoolName: "Lycée des Équipes",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const orgId = (await getTeacherOrgId(prof))!;

  const partie = await createClassGame({
    teacherId: prof,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
    level: 2,
  });
  gameId = partie.gameId;

  const inscrire = async (email: string, nom: string) => {
    const u = await db.insert(users).values({ email, displayName: nom }).returning({ id: users.id });
    const id = u[0]!.id;
    const j = await joinGameByCode({ code: partie.joinCode, userId: id, pseudo: nom });
    if ("error" in j) throw new Error(j.error);
    return id;
  };
  // Deux élèves : l'affectation remplit l'équipe la moins peuplée, donc ils
  // tombent dans deux équipes différentes, ce qui permet d'éprouver l'unicité.
  alice = await inscrire("alice@test.local", "Alice");
  bob = await inscrire("bob@test.local", "Bob");

  const e = await db
    .insert(users)
    .values({ email: "etranger@test.local", displayName: "Étranger" })
    .returning({ id: users.id });
  etranger = e[0]!.id;
});

describe("l'équipe se donne un nom", () => {
  it("une équipe fraîchement créée porte un numéro et peut se nommer", async () => {
    const vue = (await getGameView(gameId, alice))!;
    expect(vue.playerTeamName).toMatch(/^Équipe \d+$/);
    expect(vue.peutSeNommer).toBe(true);
  });

  it("un membre nomme son équipe, et la vue le reflète", async () => {
    await nommerEquipe({ gameId, userId: alice, nom: "  Fromagerie   du Pont " });
    const vue = (await getGameView(gameId, alice))!;
    expect(vue.playerTeamName).toBe("Fromagerie du Pont");
    // Le panneau disparaît : l'équipe n'est plus anonyme.
    expect(vue.peutSeNommer).toBe(false);
  });

  it("une autre équipe ne peut pas prendre le même nom", async () => {
    await expect(
      nommerEquipe({ gameId, userId: bob, nom: "fromagerie du pont" }),
    ).rejects.toThrow(/déjà ce nom/);
  });

  it("qui n'est pas dans la partie ne nomme rien", async () => {
    await expect(
      nommerEquipe({ gameId, userId: etranger, nom: "Les Pirates" }),
    ).rejects.toThrow(/membre/);
  });

  it("le nom se fige à la clôture du premier tour", async () => {
    await closeCurrentRound({ gameId, teacherId: prof });
    await expect(nommerEquipe({ gameId, userId: bob, nom: "Trop Tard" })).rejects.toThrow(
      /se fige/,
    );
    const vue = (await getGameView(gameId, bob))!;
    expect(vue.peutSeNommer).toBe(false);
    // Et l'équipe qui n'a jamais choisi garde son numéro plutôt que de perdre
    // son identité : le classement doit rester lisible.
    expect(vue.playerTeamName).toMatch(/^Équipe \d+$/);
  });
});
