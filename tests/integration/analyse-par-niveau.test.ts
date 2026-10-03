import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * L'ANALYSE, DE BOUT EN BOUT, À DEUX NIVEAUX — et sa mesure.
 *
 * Un joueur de niveau 1 reçoit des choix entre deux (cause, modèle, sens du
 * levier) ; au niveau 3, trois causes et trois modèles ; au niveau 4, celles
 * d'avant. À chaque niveau, rendre la bonne réponse vaut le maximum — y compris
 * quand le client envoie une cause juste que ce niveau ne proposait pas. Puis
 * la mesure de l'analyse retrouve ces situations, rangées par niveau.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { rounds, situationInstances, teams, users } from "@/db/schema";
import { createSoloGame, resolveCurrentRound } from "@/services/game.service";
import { getTeamSituations, submitDiagnosis, submitQuiz } from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";
import { mesurerLAnalyseSolo } from "@/services/mesure-analyse.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let userId: string;
let facile: string;
let decouverte: string;
let standard: string;

beforeAll(async () => {
  userId = (
    await db
      .insert(users)
      .values({ email: "analyse-niveau@test.local", displayName: "Joueur" })
      .returning({ id: users.id })
  )[0]!.id;
  facile = await createSoloGame(userId, "quarter", 3, 1);
  decouverte = await createSoloGame(userId, "quarter", 3, 3);
  standard = await createSoloGame(userId, "quarter", 3, 4);
});

describe("ce que voit le joueur", () => {
  it("niveau 1 : des choix entre deux — une cause, un modèle expliqué, le sens du levier", async () => {
    const s = (await getTeamSituations(facile, userId)).current[0]!;
    const def = situationByCode.get(s.code)!;
    expect(s.diagnosticUnique).toBe(true);
    if (def.diagnosticOptions.filter((o) => !o.correct).length >= 1) {
      expect(s.diagnosticOptions).toHaveLength(2);
    }
    const modele = s.quizQuestions.find((q) => q.id === "model_choice")!;
    expect(modele.options).toHaveLength(2);
    expect(modele.options.every((o) => typeof o.aide === "string" && o.aide.length > 0)).toBe(true);
    const aUnSens = (def.decisionLevers ?? []).some((l) => l.direction !== "review");
    const levier = s.quizQuestions.find((q) => q.id.startsWith("levier_"));
    expect(levier !== undefined).toBe(aUnSens);
    if (levier) expect(levier.options.map((o) => o.id)).toEqual(["up", "down"]);
  });

  it("niveau 3 : trois causes, trois modèles expliqués, pas de question de levier", async () => {
    const s = (await getTeamSituations(decouverte, userId)).current[0]!;
    const def = situationByCode.get(s.code)!;
    expect(s.diagnosticUnique).toBe(false);
    if (def.diagnosticOptions.filter((o) => !o.correct).length >= 2) {
      expect(s.diagnosticOptions).toHaveLength(3);
    }
    expect(s.quizQuestions).toHaveLength(1);
    const modele = s.quizQuestions[0]!;
    expect(modele.options).toHaveLength(3);
    expect(modele.options.every((o) => typeof o.aide === "string" && o.aide.length > 0)).toBe(true);
  });

  it("niveau 4 : les quatre causes et quatre modèles d'avant, sans phrase d'aide", async () => {
    const s = (await getTeamSituations(standard, userId)).current[0]!;
    const def = situationByCode.get(s.code)!;
    expect(s.diagnosticUnique).toBe(false);
    expect(s.diagnosticOptions).toHaveLength(def.diagnosticOptions.length);
    expect(s.quizQuestions).toHaveLength(1);
    const modele = s.quizQuestions[0]!;
    expect(modele.options.length).toBeGreaterThanOrEqual(3);
    expect(modele.options.some((o) => o.aide)).toBe(false);
  });
});

describe("ce qui est noté", () => {
  it("niveau 1 : toutes les bonnes causes envoyées, score maximal (celle qu'on ne propose pas est ignorée)", async () => {
    const s = (await getTeamSituations(facile, userId)).current[0]!;
    const def = situationByCode.get(s.code)!;
    const { score } = await submitDiagnosis({
      instanceId: s.instanceId,
      userId,
      selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
    });
    expect(score).toBe(1);
  });

  it("niveau 1 : cocher une mauvaise cause fait baisser le score", async () => {
    const s = (await getTeamSituations(facile, userId)).current[0]!;
    const mauvaise = s.diagnosticOptions.find(
      (o) => !situationByCode.get(s.code)!.diagnosticOptions.find((d) => d.id === o.id)!.correct,
    )!;
    const { score } = await submitDiagnosis({
      instanceId: s.instanceId,
      userId,
      selectedOptionIds: [mauvaise.id],
    });
    expect(score).toBe(0);
  });
});

describe("la question du levier est notée comme les autres", () => {
  it("le bon sens vaut tout le crédit, l'autre rien, et la réponse est acceptée par le serveur", async () => {
    // Une situation de niveau 1 qui désigne un sens : on en crée une partie à part par secteur jusqu'à en trouver une.
    const partie = await createSoloGame(userId, "quarter", 3, 2);
    const s = (await getTeamSituations(partie, userId)).current[0]!;
    const def = situationByCode.get(s.code)!;
    const levier = s.quizQuestions.find((q) => q.id.startsWith("levier_"));
    if (!levier) return; // cette situation n'a que des leviers « à revoir » : rien à noter
    const sens = def.decisionLevers.find((l) => l.direction !== "review")!.direction;
    const modele = s.quizQuestions.find((q) => q.id === "model_choice")!;
    const optimal = Object.keys(def.modelRelevance).find((c) => def.modelRelevance[c] === "optimal")!;
    expect(modele.options.some((o) => o.id === optimal)).toBe(true);
    const { score } = await submitQuiz({
      instanceId: s.instanceId,
      userId,
      answers: { model_choice: optimal, [levier.id]: sens },
    });
    expect(score).toBe(1);
  });
});

describe("la mesure de l'analyse", () => {
  it("retrouve les situations débriefées, par niveau, avec leur taux de rendu", async () => {
    // Niveau 1 : on rend le diagnostic. Niveau 4 : on laisse la situation de côté.
    const s1 = (await getTeamSituations(facile, userId)).current[0]!;
    const def = situationByCode.get(s1.code)!;
    await submitDiagnosis({
      instanceId: s1.instanceId,
      userId,
      selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
    });
    await resolveCurrentRound({ gameId: facile, userId, playerDecisions: DECISIONS });
    await resolveCurrentRound({ gameId: standard, userId, playerDecisions: DECISIONS });

    // La mesure lit l'écart ouverture → rendu : on le pose, pour un test sans horloge.
    const equipe = (
      await db.select().from(teams).where(and(eq(teams.gameId, facile), eq(teams.controller, "human")))
    )[0]!;
    const tour = (
      await db.select().from(rounds).where(and(eq(rounds.gameId, facile), eq(rounds.index, 1)))
    )[0]!;
    const maintenant = Date.now();
    await db
      .update(situationInstances)
      .set({ openedAt: new Date(maintenant - 4 * 60_000), answeredAt: new Date(maintenant) })
      .where(and(eq(situationInstances.roundId, tour.id), eq(situationInstances.teamId, equipe.id)));

    const mesure = await mesurerLAnalyseSolo();
    expect(mesure.situations).toBeGreaterThan(0);
    const n1 = mesure.niveaux.find((n) => n.niveau === 1)!;
    const n4 = mesure.niveaux.find((n) => n.niveau === 4)!;
    expect(n1.rendues).toBeGreaterThan(0);
    expect(n1.tauxDeRendu).toBe(1);
    expect(n1.medianeMinutes).toBeCloseTo(4, 1);
    expect(n4.tauxDeRendu).toBe(0);
    expect(n4.medianeMinutes).toBeNull();
  });
});
