import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * RECOMMENCER, SANS REFAIRE ENTRER TRENTE ÉLÈVES.
 *
 * Ce que la garde vérifie, c'est la FRONTIÈRE : ce qui part et ce qui reste.
 * Une remise à zéro qui emporte les équipes obligerait à tout réinscrire, et
 * une qui oublie une table laisserait la partie dans un état bâtard, moitié
 * neuve moitié jouée — le genre d'état qu'on ne découvre qu'en classe.
 *
 * Le dernier cas est le plus important : la maîtrise des notions appartient à
 * l'ÉLÈVE, pas à la partie. `learning_progress` ne porte qu'un utilisateur et
 * une notion, sans mention de la partie qui l'a nourrie : l'effacer ici
 * détruirait ce que le même élève a appris ailleurs.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  companyStates,
  decisions,
  games,
  learningProgress,
  players,
  rounds,
  roundResults,
  situationInstances,
  teams,
  users,
} from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  joinGameByCode,
  reinitialiserPartie,
  submitTeamDecisions,
} from "@/services/game.service";
import { getTeamSituations, submitDiagnosis } from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";

let prof: string;
let autreProf: string;
let gameId: string;
let joinCode: string;
let eleve: string;
let equipes: string[] = [];

const compter = async (
  table: Parameters<typeof db.select>[0] extends never ? never : Parameters<typeof db.$count>[0],
) => Number(await db.$count(table));

const DECISIONS = {
  price: 59,
  productionPlan: 1000,
  marketingBudget: 3000,
  qualityBudget: 0,
  maintenanceBudget: 0,
};

beforeAll(async () => {
  const r = await registerTeacher({
    email: "zero@lycee.test",
    password: "motdepasse!",
    displayName: "M. Zéro",
    schoolName: "Lycée du Recommencement",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const autre = await registerTeacher({
    email: "voisin2@lycee.test",
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
    .values({ email: "eleve@zero.test", displayName: "Élève" })
    .returning({ id: users.id });
  eleve = u!.id;
  const j = await joinGameByCode({ code: joinCode, userId: eleve });
  if ("error" in j) throw new Error(j.error);

  // On JOUE vraiment : décision, diagnostic, clôture. Sans quoi la garde
  // vérifierait qu'on efface des tables déjà vides.
  const { current } = await getTeamSituations(gameId, eleve);
  const def = situationByCode.get(current[0]!.code)!;
  await submitDiagnosis({
    instanceId: current[0]!.instanceId,
    userId: eleve,
    selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
  });
  await submitTeamDecisions({ gameId, userId: eleve, payload: DECISIONS });
  await closeCurrentRound({ gameId, teacherId: prof });

  equipes = (await db.select({ id: teams.id }).from(teams).where(eq(teams.gameId, gameId))).map(
    (t) => t.id,
  );
});

describe("avant la remise à zéro", () => {
  it("la partie a bien été jouée", async () => {
    const [g] = await db.select().from(games).where(eq(games.id, gameId));
    expect(g!.currentRound).toBeGreaterThan(1);
    expect(await compter(decisions)).toBeGreaterThan(0);
    expect(await compter(roundResults)).toBeGreaterThan(0);
    expect(await compter(learningProgress)).toBeGreaterThan(0);
  });
});

describe("après la remise à zéro", () => {
  let progressionAvant: number;

  beforeAll(async () => {
    progressionAvant = await compter(learningProgress);
    await reinitialiserPartie({ gameId, teacherId: prof });
  });

  it("la partie est repartie au tour 1, en cours", async () => {
    const [g] = await db.select().from(games).where(eq(games.id, gameId));
    expect(g!.currentRound).toBe(1);
    expect(g!.status).toBe("running");
  });

  it("le code et les équipes n'ont pas bougé : personne ne se réinscrit", async () => {
    const [g] = await db.select().from(games).where(eq(games.id, gameId));
    expect(g!.joinCode).toBe(joinCode);
    const apres = await db.select({ id: teams.id }).from(teams).where(eq(teams.gameId, gameId));
    expect(apres.map((t) => t.id).sort()).toEqual([...equipes].sort());
    const inscrits = await db
      .select({ userId: players.userId })
      .from(players)
      .where(inArray(players.teamId, equipes));
    expect(inscrits.map((p) => p.userId)).toContain(eleve);
  });

  it("plus rien de ce qui a été joué ne subsiste", async () => {
    expect(await compter(decisions)).toBe(0);
    expect(await compter(roundResults)).toBe(0);
    const [etats] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(companyStates)
      .where(inArray(companyStates.teamId, equipes));
    // Seul l'état d'ouverture, reposé : roundIndex 0, une ligne par équipe.
    expect(etats!.n).toBe(equipes.length);
  });

  it("les tours sont neufs : le premier ouvert, les suivants à venir", async () => {
    const tours = await db
      .select({ index: rounds.index, status: rounds.status })
      .from(rounds)
      .where(eq(rounds.gameId, gameId))
      .orderBy(rounds.index);
    // Autant de tours que l'instantané du scénario en annonce, ni plus ni
    // moins : c'est ici que se prouve ce que le garde-fou de source suppose.
    const [g] = await db.select().from(games).where(eq(games.id, gameId));
    const attendus = (g!.scenarioSnapshot as { roundsCount: number }).roundsCount;
    expect(tours.length).toBe(attendus);
    expect(tours[0]).toMatchObject({ index: 1, status: "open" });
    expect(tours.slice(1).every((t) => t.status === "pending")).toBe(true);
  });

  it("les situations du tour 1 sont rouvertes, vierges", async () => {
    const instances = await db
      .select()
      .from(situationInstances)
      .where(inArray(situationInstances.teamId, equipes));
    expect(instances.length).toBeGreaterThan(0);
    expect(instances.every((i) => i.diagnosis === null)).toBe(true);
  });

  it("CE QUE L'ÉLÈVE A APPRIS RESTE : la maîtrise n'appartient pas à la partie", async () => {
    expect(await compter(learningProgress)).toBe(progressionAvant);
  });

  it("et la partie se rejoue", async () => {
    await expect(
      submitTeamDecisions({ gameId, userId: eleve, payload: DECISIONS }),
    ).resolves.not.toThrow();
  });
});

describe("la partie d'un autre", () => {
  it("ne se remet pas à zéro", async () => {
    await expect(reinitialiserPartie({ gameId, teacherId: autreProf })).rejects.toThrow(
      "Partie introuvable",
    );
  });
});
