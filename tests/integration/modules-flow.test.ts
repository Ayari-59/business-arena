import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * LES MODULES DU SCÉNARIO, DE L'ENVOI AU BILAN, EN BASE.
 *
 * Une équipe coche une stratégie de prix et un projet digital : les choix sont
 * enregistrés avec ses décisions, passent au moteur à la clôture
 * (`own.payload as RoundDecisions`), et reviennent dans la vue du tour suivant
 * (le coût au résultat, le bilan « Modules engagés ce tour », et l'offre qui
 * les range dans « Déjà engagé »).
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, users } from "@/db/schema";
import { registerTeacher, getTeacherOrgId } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  getGameView,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import { roundDecisionsSchema } from "@/services/decision-schema";
import { poserUneLicence } from "./helpers/licence";

let teacherId: string;
let gameId: string;
let studentId: string;

beforeAll(async () => {
  const result = await registerTeacher({
    email: "modules@test.fr",
    password: "motdepasse!",
    displayName: "M. Projets",
    schoolName: "Lycée des Projets",
  });
  if ("error" in result) throw new Error(result.error);
  teacherId = result.userId;
  const orgId = (await getTeacherOrgId(teacherId))!;
  await poserUneLicence(orgId, teacherId);
  const game = await createClassGame({
    teacherId,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    level: 6,
    scenarioCode: "nova",
  });
  gameId = game.gameId;
  await db.update(games).set({ seed: 7 }).where(eq(games.id, gameId));
  const student = await db
    .insert(users)
    .values({ email: "eleve-modules@test.fr", displayName: "Élève" })
    .returning({ id: users.id });
  studentId = student[0]!.id;
  await joinGameByCode({ code: game.joinCode, userId: studentId, pseudo: "Élève" });
});

describe("modules du scénario, en classe (NOVA, niveau 6)", () => {
  it("la vue offre les modules du scénario au tour 1", async () => {
    const view = (await getGameView(gameId, studentId))!;
    const decisions = view.modulesOffer?.map((m) => m.decision) ?? [];
    expect(decisions).toContain("activePricingStrategyIds");
    expect(decisions).toContain("startDigitalProjectIds");
    // L'export n'ouvre qu'au tour 2 dans NOVA.
    expect(decisions).not.toContain("enteredMarketIds");
  });

  it("les choix enregistrés passent au moteur et reviennent dans la vue", async () => {
    const view = (await getGameView(gameId, studentId))!;
    const payload = roundDecisionsSchema.parse({
      ...view.proposedDecisions,
      activePricingStrategyIds: ["ps-premium"],
      startDigitalProjectIds: ["dt-crm"],
    });
    await submitTeamDecisions({ gameId, userId: studentId, payload });
    await closeCurrentRound({ gameId, teacherId });

    const apres = (await getGameView(gameId, studentId))!;
    expect(apres.lastResult!.digitalCost).toBeGreaterThan(0);
    const bilan = apres.periods.at(-1)!.modules!;
    expect(bilan.lignes.find((l) => l.titre === "Transformation digitale")!.engage).toEqual([
      "CRM relation client",
    ]);
    expect(bilan.lignes.find((l) => l.titre === "Stratégie de prix")!.engage).toEqual([
      "Positionnement haut de gamme",
    ]);
    // Au tour 2, ce qui a démarré est « déjà engagé » et ne se recoche pas.
    const prix = apres.modulesOffer!.find((m) => m.decision === "activePricingStrategyIds")!;
    expect(prix.enCours.map((x) => x.libelle)).toEqual(["Positionnement haut de gamme"]);
    expect(prix.elements.map((e) => e.id)).not.toContain("ps-premium");
    // Et l'export s'ouvre.
    expect(apres.modulesOffer!.some((m) => m.decision === "enteredMarketIds")).toBe(true);
  });

  it("au tour 2, la stratégie de prix est en vigueur dans le résultat", async () => {
    await closeCurrentRound({ gameId, teacherId }); // reconduction : aucun module relancé
    const view = (await getGameView(gameId, studentId))!;
    expect(view.lastResult!.pricingEffects?.priceMultiplier).toBeGreaterThan(1);
    const digital = view.periods.at(-1)!.modules!.lignes.find((l) => l.titre === "Transformation digitale")!;
    expect(digital.engage).toEqual([]);
  });
});
