import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * FINANCER ET INVESTIR, AU NIVEAU QUI LES OUVRE, SUR LE VRAI MOTEUR.
 *
 * Depuis octobre 2026, l'opérationnel d'abord : l'emprunt, l'apport et
 * l'investissement s'ouvrent au niveau 4. Deux promesses à tenir de bout en
 * bout :
 *
 *  1. une crise de trésorerie se règle par ce que l'écran propose : au niveau
 *     4, un emprunt à la hauteur du manque lève le verrou ; aux niveaux 1 à 3,
 *     il n'y a pas de verrou, la banque couvre par le découvert (voir
 *     crise-sans-financement.test.ts) ;
 *  2. les histoires qui appellent l'investissement tombent aux bons tours, se
 *     lisent à l'ouverture du tour, et seulement là où l'on peut y répondre.
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
import { placerSousLicence, poserUneLicence } from "./helpers/licence";

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
  // Les niveaux 4 à 6 sont inclus dans les offres Enseignant et Établissement : cet
  // établissement est sous licence (la règle elle-même est gardée par
  // acces-sans-licence.test.ts).
  await poserUneLicence(orgId, teacherId);
  // Et pour le solo, les niveaux 4 à 6 sont inclus dans les offres Enseignant et Établissement : ce
  // joueur est un enseignant d'un établissement sous licence (la règle elle-même est
  // gardée par acces-sans-licence.test.ts).
  await placerSousLicence(userId);
});

describe("la crise se règle par ce que l'écran propose", () => {
  it("niveau 4 : la crise réclame un financement, et l'écran le propose", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 4);
    let vue = await getGameView(gameId, userId);
    for (let tour = 0; tour < 4 && !vue?.alerteTresorerie?.crise; tour++) {
      await resolveCurrentRound({ gameId, userId, playerDecisions: EN_CRISE });
      vue = await getGameView(gameId, userId);
    }
    expect(vue?.alerteTresorerie?.crise).toBe(true);
    expect(vue!.enabledDecisions.finance).toBe(true);
    const exigence = vue!.exigenceSauvetage!;
    expect(exigence.manque).toBeGreaterThan(0);
    expect(bloqueLaValidation(verdictSauvetage(exigence, { emprunt: 0, apport: 0 }))).toBe(true);
    expect(bloqueLaValidation(verdictSauvetage(exigence, { emprunt: 0, apport: exigence.manque }))).toBe(false);
  }, 120000);

  for (const niveau of [1, 3] as const) {
    it(`niveau ${niveau} : la même crise ne réclame rien que l'écran ne propose pas`, async () => {
      const gameId = await createSoloGame(userId, "quarter", 3, niveau);
      let vue = await getGameView(gameId, userId);
      for (let tour = 0; tour < 4 && !vue?.alerteTresorerie?.crise; tour++) {
        await resolveCurrentRound({ gameId, userId, playerDecisions: EN_CRISE });
        vue = await getGameView(gameId, userId);
      }
      expect(vue?.alerteTresorerie?.crise).toBe(true);
      expect(vue!.enabledDecisions.finance).toBe(false);
      expect(vue!.exigenceSauvetage).toBeNull();
      expect(vue!.alerteTresorerie!.financementOuvert).toBe(false);
    }, 120000);
  }
});

describe("les histoires d'investissement, selon le niveau et selon la partie", () => {
  it("solo : aux niveaux 1 à 3, aucune histoire n'appelle un emprunt ou une machine", async () => {
    for (const n of [1, 2, 3]) expect(await histoires(await createSoloGame(userId, "quarter", 3, n))).toEqual([]);
  });

  it("solo : le niveau 4 ouvre le signe, la fenêtre de financement et la demande qui monte", async () => {
    expect(await histoires(await createSoloGame(userId, "quarter", 3, 4))).toEqual([
      "2:signal",
      "2:taux",
      "3:grand_compte",
    ]);
  });

  it("solo : le niveau 5 ajoute le concurrent, le 6 le retournement", async () => {
    expect(await histoires(await createSoloGame(userId, "quarter", 3, 5))).toContain("4:concurrent");
    expect(await histoires(await createSoloGame(userId, "quarter", 3, 5))).not.toContain("5:retournement");
    expect(await histoires(await createSoloGame(userId, "quarter", 3, 6))).toContain("5:retournement");
  });

  it("le courrier du tour se lit à l'ouverture du tour, avant la décision", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 4);
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
      level: 4,
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
      level: 4,
      investmentStories: true,
    });
    expect(await histoires(gameId)).toEqual(["2:signal", "2:taux", "3:grand_compte"]);
  });
});
