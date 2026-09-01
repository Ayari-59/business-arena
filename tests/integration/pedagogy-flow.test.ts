import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * Parcours pédagogique complet (étapes 8-9, doc 03) sur Postgres embarqué :
 * référentiels seedés → situations instanciées → indices séquentiels →
 * diagnostic → QCM de connaissances → débriefing → progression et vue enseignant.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import {
  concepts,
  decisionModels,
  games,
  learningProgress,
  playerSkills,
  rounds,
  situationInstances,
  situations,
  users,
} from "@/db/schema";
import { createSoloGame, resolveCurrentRound, setQuizMode } from "@/services/game.service";
import {
  getTeamSituations,
  getTeacherPedagogyView,
  submitDiagnosis,
  submitQuiz,
  unlockHint,
} from "@/services/pedagogy.service";
import { ALL_SITUATIONS, situationByCode } from "@/config/scenarios/registry";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { DECISION_MODELS } from "@/config/pedagogy/models";
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
  // Ce fichier teste la notation des QUESTIONS DE CONNAISSANCES, que les
  // parties solo ne servent plus. On remet donc le réglage complet, sans quoi
  // il ne testerait plus que la question du modèle.
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
  await setQuizMode({ gameId, teacherId: game.createdBy, mode: "full" });
});

describe("référentiels et instanciation", () => {
  it("les référentiels sont seedés au complet, tous secteurs confondus", async () => {
    // Comptes pilotés par les référentiels : ajouter un concept ou un secteur
    // ne doit pas faire tomber ce test pour un nombre magique périmé.
    expect(await db.select().from(concepts)).toHaveLength(CONCEPTS.length);
    expect(await db.select().from(decisionModels)).toHaveLength(DECISION_MODELS.length);
    expect(await db.select().from(situations)).toHaveLength(ALL_SITUATIONS.length);
  });

  it("la situation scriptée du tour 1 est ouverte pour l'équipe du joueur", async () => {
    const { current, debriefedByRound } = await getTeamSituations(gameId, userId);
    expect(debriefedByRound).toHaveLength(0);
    expect(current).toHaveLength(1);
    expect(current[0]!.code).toBe("nova_t1_takeover");
    expect(current[0]!.problem).not.toMatch(/calculez/i); // question ouverte (§3)
    expect(current[0]!.unlockedHints).toHaveLength(0);
    expect(current[0]!.nextHint).toEqual({ level: 1, costRatio: 0.05 });
  });
});

describe("cadre analytique avant décision (A7)", () => {
  it("les situations courantes portent des analyticalHints non vides", async () => {
    const { current } = await getTeamSituations(gameId, userId);
    expect(current[0]!.analyticalHints.length).toBeGreaterThan(0);
  });

  it("seuls les modèles optimal et acceptable apparaissent, pas misleading ni irrelevant", async () => {
    const { current } = await getTeamSituations(gameId, userId);
    const codes = current[0]!.analyticalHints.map((h) => h.code);
    expect(codes).toContain("breakeven_analysis");
    expect(codes).toContain("cvp_analysis");
    expect(codes).toContain("psych_pricing");
    expect(codes).not.toContain("npv");
  });

  it("les hints sont triés alphabétiquement par nom", async () => {
    const { current } = await getTeamSituations(gameId, userId);
    const names = current[0]!.analyticalHints.map((h) => h.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "fr")));
  });

  it("aucun hint ne contient de champ relevance ou credit", async () => {
    const { current } = await getTeamSituations(gameId, userId);
    for (const h of current[0]!.analyticalHints) {
      expect(h).not.toHaveProperty("relevance");
      expect(h).not.toHaveProperty("credit");
    }
  });
});

describe("pont situation→décision (A8)", () => {
  it("les situations courantes portent des decisionLevers non vides", async () => {
    const { current } = await getTeamSituations(gameId, userId);
    expect(current[0]!.decisionLevers.length).toBeGreaterThan(0);
  });

  it("chaque lever a un field valide, une direction et un hint", async () => {
    const { current } = await getTeamSituations(gameId, userId);
    const validFields = ["price", "productionPlan", "marketingBudget", "qualityBudget", "maintenanceBudget"];
    const validDirections = ["up", "down", "review"];
    for (const lever of current[0]!.decisionLevers) {
      expect(validFields).toContain(lever.field);
      expect(validDirections).toContain(lever.direction);
      expect(lever.hint.length).toBeGreaterThan(0);
    }
  });

});

describe("indices, diagnostic, QCM de connaissances", () => {
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

  it("diagnostic scoré en F1 et QCM de connaissances scoré par question", async () => {
    const { current } = await getTeamSituations(gameId, userId);
    const view = current[0]!;
    const instanceId = view.instanceId;
    expect(view.quizQuestions.length).toBeGreaterThanOrEqual(2); // le QCM est servi
    expect(view.quizAnswers).toBeNull();

    const diag = await submitDiagnosis({
      instanceId,
      userId,
      selectedOptionIds: ["cover_fixed", "unit_margin"],
      freeText: "Il faut couvrir les 96 000 € de structure avec la marge de 21 € par unité.",
    });
    expect(diag.score).toBe(1); // les deux bonnes options, aucune fausse

    // 2 bonnes réponses sur 3 : la première question est ratée exprès
    const def = situationByCode.get("nova_t1_takeover")!;
    const answers = Object.fromEntries(def.quiz.map((q) => [q.id, q.correctOptionId]));
    const firstId = def.quiz[0]!.id;
    answers[firstId] = def.quiz[0]!.options.find((o) => o.id !== def.quiz[0]!.correctOptionId)!.id;
    const quiz = await submitQuiz({ instanceId, userId, answers });
    expect(quiz.score).toBeCloseTo(2 / 3, 9);

    const after = (await getTeamSituations(gameId, userId)).current[0]!;
    expect(after.status).toBe("answered");
    expect(after.quizAnswers).toEqual(answers);

    // le QCM ne se rejoue pas
    await expect(submitQuiz({ instanceId, userId, answers })).rejects.toThrow();
  });
});

describe("débriefing et progression", () => {
  it("la résolution du tour débriefe la situation et fait progresser la maîtrise", async () => {
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });

    const { current, debriefedByRound } = await getTeamSituations(gameId, userId);
    expect(debriefedByRound).toHaveLength(1);
    const d = debriefedByRound[0]!.situations[0]!;
    expect(d.code).toBe("nova_t1_takeover");
    expect(d.debrief).not.toBeNull();
    expect(d.debrief!.correctOptionIds.sort()).toEqual(["cover_fixed", "unit_margin"]);
    // la correction du QCM est révélée, avec explications
    expect(d.debrief!.quizScore).toBeCloseTo(2 / 3, 9);
    expect(d.debrief!.quizCorrection.length).toBe(d.quizQuestions.length);
    expect(d.debrief!.quizCorrection.every((c) => c.explain.length > 0)).toBe(true);
    // score final : (0,5×1 + 0,5×2/3) × malus 2 indices (0,85)
    expect(d.debrief!.finalScore).toBeCloseTo((0.5 + 0.5 * (2 / 3)) * 0.85, 6);

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

  it("les analyticalHints sont vides après débriefing (A7)", async () => {
    const { debriefedByRound } = await getTeamSituations(gameId, userId);
    for (const dr of debriefedByRound) {
      for (const s of dr.situations) {
        expect(s.analyticalHints).toEqual([]);
      }
    }
  });

  it("les decisionLevers sont vides après débriefing (A8)", async () => {
    const { debriefedByRound } = await getTeamSituations(gameId, userId);
    for (const dr of debriefedByRound) {
      for (const s of dr.situations) {
        expect(s.decisionLevers).toEqual([]);
      }
    }
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

describe("mémoire pédagogique inter-tours (A6)", () => {
  it("tous les tours résolus sont présents dans debriefedByRound", async () => {
    const { debriefedByRound } = await getTeamSituations(gameId, userId);
    expect(debriefedByRound.length).toBe(2);
  });

  it("les tours sont triés par index décroissant (le plus récent en premier)", async () => {
    const { debriefedByRound } = await getTeamSituations(gameId, userId);
    expect(debriefedByRound[0]!.roundIndex).toBe(2);
    expect(debriefedByRound[1]!.roundIndex).toBe(1);
  });

  it("chaque groupe contient les situations du tour correspondant", async () => {
    const { debriefedByRound } = await getTeamSituations(gameId, userId);
    const round1 = debriefedByRound.find((dr) => dr.roundIndex === 1)!;
    expect(round1.situations.length).toBeGreaterThanOrEqual(1);
    expect(round1.situations[0]!.code).toBe("nova_t1_takeover");
    expect(round1.situations[0]!.debrief).not.toBeNull();
  });

  it("les situations du tour courant ne fuient pas dans debriefedByRound", async () => {
    const { current, debriefedByRound } = await getTeamSituations(gameId, userId);
    const allDebriefedIds = debriefedByRound.flatMap((dr) => dr.situations).map((s) => s.instanceId);
    for (const s of current) {
      expect(allDebriefedIds).not.toContain(s.instanceId);
    }
  });
});

describe("vue pédagogique enseignant (§27)", () => {
  it("agrège maîtrises, indices et résultats des QCM", async () => {
    // le créateur de la partie solo est aussi son « enseignant »
    const view = await getTeacherPedagogyView(gameId, userId);
    expect(view).not.toBeNull();
    expect(view!.conceptMastery.length).toBeGreaterThan(0);
    expect(view!.hintsUsedByTeam[0]!.count).toBe(2);
    expect(view!.quizStats.submitted).toBe(1);
    expect(view!.quizStats.averageScore).toBeCloseTo(2 / 3, 9);
  });
});
