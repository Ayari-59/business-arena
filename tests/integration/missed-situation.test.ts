import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * SITUATION MANQUÉE CONSULTABLE ET RATTRAPAGE RÉGLABLE (V1-6).
 *
 * Constaté : T1 non rendu → au T2, plus aucune trace côté élève ; le
 * débriefing corrigé promis était introuvable. Désormais une situation
 * manquée reste en Mémoire (« Non rendue · 0 », modèle attendu consultable)
 * et — en classe — peut être rattrapée une fois à 50 %.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { closeCurrentRound, createClassGame, joinGameByCode } from "@/services/game.service";
import { getTeamSituations, retakeSituation, setMissedPolicy } from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";

let teacherId: string;
let orgId: string;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "memoire@lycee.test",
    password: "motdepasse!",
    displayName: "Mme Mémoire",
    schoolName: "Lycée de la Seconde Chance",
  });
  if ("error" in r) throw new Error(r.error);
  teacherId = r.userId;
  orgId = (await getTeacherOrgId(teacherId))!;
});

async function partieAvecEleve() {
  const { gameId, joinCode } = await createClassGame({
    teacherId,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    scenarioCode: "nova",
  });
  const eleve = (
    await db.insert(users).values({ email: `e${Math.random()}@test.local`, displayName: "Élève" }).returning({ id: users.id })
  )[0]!.id;
  const j = await joinGameByCode({ code: joinCode, userId: eleve, pseudo: "Élève" });
  if ("error" in j) throw new Error(j.error);
  return { gameId, eleve };
}

describe("une situation non rendue reste consultable en Mémoire", () => {
  it("T1 non rendu → au T2, listée « Non rendue · 0 » avec le modèle attendu", async () => {
    const { gameId, eleve } = await partieAvecEleve();
    // Personne ne rend la situation du tour 1 ; l'enseignant clôt.
    await closeCurrentRound({ gameId, teacherId });

    const { debriefedByRound, missedPolicy } = await getTeamSituations(gameId, eleve);
    expect(missedPolicy).toBe("retake50"); // défaut en classe

    const tour1 = debriefedByRound.find((d) => d.roundIndex === 1);
    expect(tour1).toBeDefined();
    const s = tour1!.situations[0]!;
    expect(s.missed).toBe(true);
    expect(s.rendered).toBe(false);
    expect(s.retaken).toBe(false);
    expect(s.debrief).not.toBeNull();
    expect(s.debrief!.finalScore).toBe(0);
    // Le modèle attendu est servi même si la question avait été posée.
    expect(s.debrief!.modelInsight).not.toBeNull();
    expect(s.debrief!.modelInsight!.answer.length).toBeGreaterThan(0);
  });
});

describe("rattrapage réglable", () => {
  it("en classe (retake50), une reprise note à 50 % et marque « rattrapée »", async () => {
    const { gameId, eleve } = await partieAvecEleve();
    await closeCurrentRound({ gameId, teacherId });

    const { debriefedByRound } = await getTeamSituations(gameId, eleve);
    const s = debriefedByRound.find((d) => d.roundIndex === 1)!.situations[0]!;
    const def = situationByCode.get(s.code)!;
    const goodOptions = def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id);
    const answers = Object.fromEntries(s.quizQuestions.map((q) => {
      const correct = def.quiz.find((d) => d.id === q.id)?.correctOptionId ?? q.options[0]!.id;
      return [q.id, correct];
    }));

    const { finalScore } = await retakeSituation({
      instanceId: s.instanceId,
      userId: eleve,
      selectedOptionIds: goodOptions,
      answers,
    });
    // Diagnostic et modèle justes → score plein, mais compté pour moitié.
    expect(finalScore).toBeGreaterThan(0);
    expect(finalScore).toBeLessThanOrEqual(0.5 + 1e-9);

    const after = await getTeamSituations(gameId, eleve);
    const sAfter = after.debriefedByRound.find((d) => d.roundIndex === 1)!.situations[0]!;
    expect(sAfter.retaken).toBe(true);
    expect(sAfter.missed).toBe(false);
    expect(sAfter.rendered).toBe(true);

    // Un second rattrapage est refusé.
    await expect(
      retakeSituation({ instanceId: s.instanceId, userId: eleve, selectedOptionIds: goodOptions, answers }),
    ).rejects.toThrow(/déjà été rattrapée/);
  });

  it("en lecture seule (readonly), le rattrapage est refusé", async () => {
    const { gameId, eleve } = await partieAvecEleve();
    await setMissedPolicy({ gameId, teacherId, policy: "readonly" });
    await closeCurrentRound({ gameId, teacherId });

    const { debriefedByRound, missedPolicy } = await getTeamSituations(gameId, eleve);
    expect(missedPolicy).toBe("readonly");
    const s = debriefedByRound.find((d) => d.roundIndex === 1)!.situations[0]!;
    await expect(
      retakeSituation({ instanceId: s.instanceId, userId: eleve, selectedOptionIds: [], answers: {} }),
    ).rejects.toThrow(/rattrapage n'est pas ouvert/);
  });
});
