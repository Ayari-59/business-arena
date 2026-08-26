import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Niveaux de difficulté + paramètres économiques modulés, de bout en bout :
 * le sélecteur règle le snapshot (TVA, IS, charges, intensité d'événements),
 * le plafond d'indices et les décisions exposées — sans toucher au moteur.
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
import { getTeamSituations, unlockHint } from "@/services/pedagogy.service";
import { novaScenario } from "@/config/scenarios/nova";
import type { EngineScenarioConfig, RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let teacherId: string;
let gameId: string;
let studentId: string;

beforeAll(async () => {
  const result = await registerTeacher({
    email: "niveaux@test.fr",
    password: "motdepasse!",
    displayName: "M. Niveaux",
    schoolName: "Lycée Modulaire",
  });
  if ("error" in result) throw new Error(result.error);
  teacherId = result.userId;
  const orgId = (await getTeacherOrgId(teacherId))!;
  const game = await createClassGame({
    teacherId,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    level: 5, // Stratégie : indices ≤ 2, événements ×1,5
    economicOverrides: {
      vatRate: 0.2,
      taxRate: 0.3,
      fixedCostsPerRound: 80000,
      taxRateBogus: 99, // clé inconnue : ignorée
    } as Record<string, number>,
  });
  gameId = game.gameId;
  // graine pinée : pas d'événement probabiliste au tour 1 malgré l'intensité ×1,5
  await db.update(games).set({ seed: 7 }).where(eq(games.id, gameId));
  const student = await db
    .insert(users)
    .values({ email: "eleve-niveaux@test.fr", displayName: "Élève" })
    .returning({ id: users.id });
  studentId = student[0]!.id;
  await joinGameByCode({ code: game.joinCode, userId: studentId, pseudo: "Élève" });
});

describe("niveaux de difficulté et paramètres économiques", () => {
  it("le snapshot porte les paramètres modulés et l'intensité du niveau", async () => {
    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
    expect(snapshot.finance.vatRate).toBe(0.2);
    expect(snapshot.finance.taxRate).toBe(0.3);
    expect(snapshot.fixedCostsPerRound).toBe(80000);
    // non modulé : conservé
    expect(snapshot.finance.loanAnnualRate).toBe(novaScenario.finance.loanAnnualRate);
    // intensité Stratégie ×1,5 (les probabilités 0 restent 0)
    const breakdown = snapshot.events.find((e) => e.code === "machine_breakdown")!;
    expect(breakdown.probability).toBeCloseTo(0.05 * 1.5, 12);
    expect(snapshot.events.find((e) => e.code === "big_order")!.probability).toBe(0);
    const profile = game.difficultyProfile as {
      difficulty: { level: number; name: string };
      economicOverrides: Record<string, number>;
    };
    expect(profile.difficulty).toEqual({ level: 5, name: "Stratégie" });
    expect(profile.economicOverrides).toEqual({
      vatRate: 0.2,
      taxRate: 0.3,
      fixedCostsPerRound: 80000,
    });
  });

  it("la vue joueur expose le niveau et les décisions ouvertes", async () => {
    const view = await getGameView(gameId, studentId);
    expect(view!.difficulty).toEqual({ level: 5, name: "Stratégie", hintMaxLevel: 2 });
    expect(view!.enabledDecisions).toEqual({
      quality: true,
      maintenance: true,
      finance: true,
      insurance: true,
      hr: true, // Stratégie : RH et investissement ouverts dès Arbitrage
      investment: true,
    });
  });

  it("les indices sont plafonnés au niveau 2 (Stratégie)", async () => {
    const { current } = await getTeamSituations(gameId, studentId);
    const instanceId = current[0]!.instanceId;
    await unlockHint({ instanceId, userId: studentId });
    await unlockHint({ instanceId, userId: studentId });
    await expect(unlockHint({ instanceId, userId: studentId })).rejects.toThrow(/Stratégie/);
  });

  it("la TVA traverse la simulation : dette de TVA au bilan, résultat HT", async () => {
    await submitTeamDecisions({ gameId, userId: studentId, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId });
    const view = await getGameView(gameId, studentId);
    const r = view!.lastResult!;
    // TVA nette = 20 % × (CA − achats de matières)
    const purchases = r.production.produced * 22;
    expect(r.balanceSheet.vatLiability).toBeCloseTo(
      0.2 * (r.incomeStatement.revenue - purchases),
      2,
    );
    // les charges de structure modulées apparaissent au compte de résultat
    expect(r.incomeStatement.fixedCosts).toBeCloseTo(80000, 6);
    // l'invariant fonctionnel tient, TVA comprise
    expect(r.functionalBalance.netTreasury).toBeCloseTo(
      r.balanceSheet.cash - r.balanceSheet.overdraft,
      2,
    );
  });

  it("au niveau 1 (Découverte), seules les décisions essentielles sont exposées", async () => {
    const orgId = (await getTeacherOrgId(teacherId))!;
    const easy = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      level: 1,
    });
    const pupil = await db
      .insert(users)
      .values({ email: "eleve-facile@test.fr", displayName: "Élève 2" })
      .returning({ id: users.id });
    await joinGameByCode({ code: easy.joinCode, userId: pupil[0]!.id, pseudo: "Élève 2" });
    const view = await getGameView(easy.gameId, pupil[0]!.id);
    expect(view!.difficulty.name).toBe("Découverte");
    expect(view!.enabledDecisions).toEqual({
      quality: false,
      maintenance: false,
      finance: false,
      insurance: false,
      hr: false,
      investment: false,
    });
    // Découverte : TVA non modulée → désactivée, calibration du scénario intacte
    const game = (await db.select().from(games).where(eq(games.id, easy.gameId)))[0]!;
    expect((game.scenarioSnapshot as EngineScenarioConfig).finance.vatRate).toBeUndefined();
  });
});
