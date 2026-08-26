import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * Parcours pédagogique complet (étapes 8-9, doc 03) sur Postgres embarqué :
 * référentiels seedés → situations instanciées → indices séquentiels →
 * diagnostic → choix de modèle → débriefing → progression et vue enseignant.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import {
  concepts,
  decisionModels,
  learningProgress,
  playerSkills,
  rounds,
  situationInstances,
  situations,
  users,
} from "@/db/schema";
import { createSoloGame, resolveCurrentRound } from "@/services/game.service";
import {
  chooseModel,
  getTeamSituations,
  getTeacherPedagogyView,
  submitDiagnosis,
  unlockHint,
} from "@/services/pedagogy.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let userId: string;
let gameId: string;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "pedago@test.local", displayName: "Apprenant" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
  gameId = await createSoloGame(userId, "quarter", 3);
});

describe("référentiels et instanciation", () => {
  it("les référentiels sont seedés (22 concepts, 18 modèles, 10 situations)", async () => {
    expect(await db.select().from(concepts)).toHaveLength(22);
    expect(await db.select().from(decisionModels)).toHaveLength(18);
    expect(await db.select().from(situations)).toHaveLength(10);
  });

  it("la situation scriptée du tour 1 est ouverte pour l'équipe du joueur", async () => {
    const { current, debriefed } = await getTeamSituations(gameId, userId);
    expect(debriefed).toHaveLength(0);
    expect(current).toHaveLength(1);
    expect(current[0]!.code).toBe("nova_t1_takeover");
    expect(current[0]!.problem).not.toMatch(/calculez/i); // question ouverte (§3)
    expect(current[0]!.unlockedHints).toHaveLength(0);
    expect(current[0]!.nextHint).toEqual({ level: 1, costRatio: 0.05 });
  });
});

describe("indices, diagnostic, choix de modèle", () => {
  it("les indices se débloquent séquentiellement et sont tracés", async () => {
    const { current } = await getTeamSituations(gameId, userId);
    const instanceId = current[0]!.instanceId;

    const h1 = await unlockHint({ instanceId, userId });
    expect(h1.level).toBe(1);
    const h2 = await unlockHint({ instanceId, userId });
    expect(h2.level).toBe(2);

    const after = (await getTeamSituations(gameId, userId)).current[0]!;
    expect(after.unlockedHints.map((h) => h.level)).toEqual([1, 2]);
    expect(after.nextHint?.level).toBe(3);

    // un intrus ne peut pas débloquer d'indice
    const stranger = await db
      .insert(users)
      .values({ email: "intrus2@test.local", displayName: "Intrus" })
      .returning({ id: users.id });
    await expect(unlockHint({ instanceId, userId: stranger[0]!.id })).rejects.toThrow();
  });

  it("diagnostic scoré en F1 et choix de modèle avec pertinence historisée", async () => {
    const { current } = await getTeamSituations(gameId, userId);
    const instanceId = current[0]!.instanceId;

    const diag = await submitDiagnosis({
      instanceId,
      userId,
      selectedOptionIds: ["cover_fixed", "unit_margin"],
      freeText: "Il faut couvrir les 96 000 € de structure avec la marge de 21 € par unité.",
    });
    expect(diag.score).toBe(1); // les deux bonnes options, aucune fausse

    const choice = await chooseModel({
      instanceId,
      userId,
      modelCode: "breakeven_analysis",
      justification: "Le seuil de rentabilité donne l'objectif de volume qui couvre les fixes.",
    });
    expect(choice.relevance).toBe("optimal");
    expect(choice.score).toBeGreaterThan(0.7);

    const after = (await getTeamSituations(gameId, userId)).current[0]!;
    expect(after.status).toBe("answered");
    expect(after.modelChoice?.code).toBe("breakeven_analysis");
  });
});

describe("débriefing et progression", () => {
  it("la résolution du tour débriefe la situation et fait progresser la maîtrise", async () => {
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const { current, debriefed } = await getTeamSituations(gameId, userId);
    expect(debriefed).toHaveLength(1);
    const d = debriefed[0]!;
    expect(d.code).toBe("nova_t1_takeover");
    expect(d.debrief).not.toBeNull();
    expect(d.debrief!.correctOptionIds.sort()).toEqual(["cover_fixed", "unit_margin"]);
    // score final : (0,5×1 + 0,5×~0,8+) × malus 2 indices (0,85)
    expect(d.debrief!.finalScore).toBeGreaterThan(0.5);
    expect(d.debrief!.finalScore).toBeLessThanOrEqual(0.85);

    // la situation scriptée du tour 2 est ouverte
    expect(current.some((s) => s.code === "nova_t2_price_war")).toBe(true);

    // progression : maîtrise créée pour les concepts de la situation
    const progress = await db
      .select()
      .from(learningProgress)
      .where(eq(learningProgress.userId, userId));
    expect(progress.length).toBeGreaterThanOrEqual(5);
    expect(progress.every((p) => Number(p.mastery) > 0)).toBe(true);

    const skills = await db.select().from(playerSkills).where(eq(playerSkills.userId, userId));
    expect(skills.length).toBeGreaterThan(0);
  });

  it("une situation non traitée est débriefée à zéro d'interaction, sans casser le tour", async () => {
    // tour 2 : on ne touche à rien et on résout
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });
    const round2 = (
      await db.select().from(rounds).where(and(eq(rounds.gameId, gameId), eq(rounds.index, 2)))
    )[0]!;
    const instances = await db
      .select()
      .from(situationInstances)
      .where(eq(situationInstances.roundId, round2.id));
    expect(instances.length).toBeGreaterThanOrEqual(1);
    expect(instances.every((i) => i.status === "debriefed")).toBe(true);
  });

  it("après débriefing, indices et réponses sont verrouillés", async () => {
    const round1 = (
      await db.select().from(rounds).where(and(eq(rounds.gameId, gameId), eq(rounds.index, 1)))
    )[0]!;
    const instance = (
      await db
        .select()
        .from(situationInstances)
        .where(eq(situationInstances.roundId, round1.id))
    )[0]!;
    await expect(unlockHint({ instanceId: instance.id, userId })).rejects.toThrow();
    await expect(
      submitDiagnosis({ instanceId: instance.id, userId, selectedOptionIds: [] }),
    ).rejects.toThrow();
  });
});

describe("vue pédagogique enseignant (§27)", () => {
  it("agrège maîtrises, indices et qualité des choix de modèles", async () => {
    // le créateur de la partie solo est aussi son « enseignant »
    const view = await getTeacherPedagogyView(gameId, userId);
    expect(view).not.toBeNull();
    expect(view!.conceptMastery.length).toBeGreaterThan(0);
    expect(view!.hintsUsedByTeam[0]!.count).toBe(2);
    const optimal = view!.modelChoiceStats.find((s) => s.relevance === "optimal");
    expect(optimal!.count).toBe(1);
  });
});
