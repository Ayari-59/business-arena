import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * FINANCER ET INVESTIR, DÈS LE NIVEAU 1, SUR LE VRAI MOTEUR.
 *
 * Deux promesses à tenir de bout en bout :
 *
 *  1. une crise de trésorerie se joue à tous les niveaux : l'emprunt et
 *     l'apport sont à l'écran dès Découverte, et la crise s'y règle par ce
 *     qu'on y voit (avant, le niveau 1 réclamait un financement qu'il ne
 *     montrait pas, et la partie n'était plus jouable) ;
 *  2. les histoires qui appellent l'investissement tombent aux bons tours, se
 *     lisent à l'ouverture du tour, et ne se posent que là où on les a voulues.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { games, users } from "@/db/schema";
import { createClassGame, createSoloGame, resolveCurrentRound } from "@/services/game.service";
import { getGameView } from "@/services/game-view.service";
import { bloqueLaValidation, verdictSauvetage } from "@/services/sauvetage";
import type { EngineScenarioConfig, RoundDecisions } from "@/engine/types";

let userId: string;
let teacherId: string;
let orgId: string;

// Une production et un budget démesurés : sans financement, la trésorerie passe sous le découvert autorisé.
const EN_CRISE: RoundDecisions = {
  price: 40,
  productionPlan: 5600,
  marketingBudget: 30000,
  qualityBudget: 0,
  maintenanceBudget: 0,
};

const histoires = async (gameId: string) => {
  const jeu = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
  const s = jeu.scenarioSnapshot as EngineScenarioConfig;
  return s.scriptedEvents
    .filter((e) => e.eventCode.includes("_inv_"))
    .map((e) => `${e.round}:${e.eventCode.split("_inv_")[1]}`)
    .sort();
};

beforeAll(async () => {
  userId = (
    await db.insert(users).values({ email: "inv-n1@test.local", displayName: "Joueur" }).returning({ id: users.id })
  )[0]!.id;
  const { registerTeacher, getTeacherOrgId } = await import("@/services/auth.service");
  const prof = await registerTeacher({
    email: "inv-prof@test.fr",
    password: "motdepasse!",
    displayName: "M. Investissement",
    schoolName: "Lycée des Histoires",
  });
  if ("error" in prof) throw new Error(prof.error);
  teacherId = prof.userId;
  orgId = (await getTeacherOrgId(teacherId))!;
});

describe("la même crise se règle de la même façon à tous les niveaux", () => {
  for (const niveau of [1, 3] as const) {
    it(`niveau ${niveau} : la crise réclame un financement, et l'écran le propose`, async () => {
      const gameId = await createSoloGame(userId, "quarter", 3, niveau);
      let vue = await getGameView(gameId, userId);
      for (let tour = 0; tour < 4 && !vue?.alerteTresorerie?.crise; tour++) {
        await resolveCurrentRound({ gameId, userId, playerDecisions: EN_CRISE });
        vue = await getGameView(gameId, userId);
      }
      expect(vue?.alerteTresorerie?.crise).toBe(true);
      // Les deux leviers du sauvetage sont ouverts au niveau joué…
      expect(vue!.enabledDecisions.finance).toBe(true);
      // … et l'exigence se satisfait avec eux : un emprunt à la hauteur du manque lève le verrou.
      const exigence = vue!.exigenceSauvetage!;
      expect(exigence.manque).toBeGreaterThan(0);
      expect(bloqueLaValidation(verdictSauvetage(exigence, { emprunt: 0, apport: 0 }))).toBe(true);
      expect(bloqueLaValidation(verdictSauvetage(exigence, { emprunt: 0, apport: exigence.manque }))).toBe(false);
    }, 120000);
  }
});

describe("les histoires d'investissement, selon le niveau et selon la partie", () => {
  it("solo : niveau 1, un signe au tour 2 et la demande qui monte au tour 3", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 1);
    expect(await histoires(gameId)).toEqual(["2:signal", "3:grand_compte"]);
  });

  it("solo : le niveau 3 ouvre la fenêtre de financement, le 4 le concurrent, le 5 le retournement", async () => {
    expect(await histoires(await createSoloGame(userId, "quarter", 3, 3))).toEqual([
      "2:signal",
      "2:taux",
      "3:grand_compte",
    ]);
    expect(await histoires(await createSoloGame(userId, "quarter", 3, 4))).toContain("4:concurrent");
    expect(await histoires(await createSoloGame(userId, "quarter", 3, 5))).toContain("5:retournement");
  });

  it("le courrier du tour se lit à l'ouverture du tour, avant la décision", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 1);
    await resolveCurrentRound({ gameId, userId, playerDecisions: EN_CRISE });
    const vue = (await getGameView(gameId, userId))!;
    expect(vue.currentRound).toBe(2);
    expect(vue.upcomingDraw.map((c) => c.code).some((c) => c.endsWith("_inv_signal"))).toBe(true);
  }, 120000);

  it("classe : sans la case cochée, le déroulé du secteur est celui d'avant", async () => {
    const { gameId } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      level: 1,
    });
    expect(await histoires(gameId)).toEqual([]);
  });

  it("classe : case cochée, les histoires du niveau tombent", async () => {
    const { gameId } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      level: 2,
      investmentStories: true,
    });
    expect(await histoires(gameId)).toEqual(["2:signal", "3:grand_compte"]);
  });
});
