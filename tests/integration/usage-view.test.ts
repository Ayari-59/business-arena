import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Carnet d'usage : l'agrégat de TOUTES les parties d'un enseignant.
 *
 * Ce que la vue par partie ne peut pas dire, et qu'on vérifie ici :
 *
 * - le carnet ne mélange pas les enseignants (une classe voisine n'y entre pas) ;
 * - les situations sont classées par score moyen croissant, les plus dures en tête ;
 * - une situation ouverte mais jamais débriefée ne compte pas, sans quoi une
 *   partie abandonnée ferait passer un énoncé pour infaisable ;
 * - un enseignant sans partie obtient un carnet vide, pas une erreur.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, users } from "@/db/schema";
import { createSoloGame, resolveCurrentRound, setQuizMode } from "@/services/game.service";
import {
  getTeamSituations,
  getTeacherUsageView,
  submitDiagnosis,
  unlockHint,
} from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let teacherId: string;
let voisinId: string;
let novaGameId: string;

/** Ouvre les indices demandés, répond, puis clôt le tour pour débriefer. */
async function jouerUnTour(gameId: string, userId: string, hints: number, options: string[]) {
  const { current } = await getTeamSituations(gameId, userId);
  const instanceId = current[0]!.instanceId;
  for (let i = 0; i < hints; i++) await unlockHint({ instanceId, userId });
  await submitDiagnosis({ instanceId, userId, selectedOptionIds: options });
  await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });
  return instanceId;
}

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values([
      { email: "carnet@test.local", displayName: "Enseignante" },
      { email: "voisin@test.local", displayName: "Collègue" },
    ])
    .returning({ id: users.id });
  teacherId = inserted[0]!.id;
  voisinId = inserted[1]!.id;

  // Deux parties pour l'enseignante, dans deux secteurs différents.
  novaGameId = await createSoloGame(teacherId, "quarter", 3);
  const boutiqueId = await createSoloGame(teacherId, "quarter", 3, undefined, false, "boutique");
  await setQuizMode({ gameId: novaGameId, teacherId, mode: "model" });

  // NOVA : trois indices ouverts et un diagnostic à moitié juste.
  await jouerUnTour(novaGameId, teacherId, 3, ["cover_fixed"]);
  // Boutique : aucun indice, diagnostic complet, donc un score plus élevé.
  const { current } = await getTeamSituations(boutiqueId, teacherId);
  const def = situationByCode.get(current[0]!.code)!;
  await submitDiagnosis({
    instanceId: current[0]!.instanceId,
    userId: teacherId,
    selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
  });
  await resolveCurrentRound({ gameId: boutiqueId, userId: teacherId, playerDecisions: DECISIONS });

  // La partie du collègue ne doit jamais apparaître dans le carnet.
  const voisineId = await createSoloGame(voisinId, "quarter", 3);
  await jouerUnTour(voisineId, voisinId, 5, []);
});

describe("carnet d'usage de l'enseignant", () => {
  it("compte les parties, les équipes et les situations débriefées", async () => {
    const usage = await getTeacherUsageView(teacherId);
    expect(usage.totals.games).toBe(2);
    expect(usage.totals.teams).toBe(2);
    expect(usage.totals.situationsDebriefed).toBe(2);
    expect(usage.totals.hintsUnlocked).toBe(3);
  });

  it("n'agrège que les parties de cet enseignant", async () => {
    const usage = await getTeacherUsageView(teacherId);
    const codes = usage.situations.map((s) => s.code);
    // le collègue a ouvert cinq indices : ils ne franchissent pas la cloison
    expect(usage.totals.hintsUnlocked).toBe(3);
    expect(usage.sectors.map((s) => s.code).sort()).toEqual(["boutique", "nova"]);
    expect(codes).toHaveLength(2);

    const duVoisin = await getTeacherUsageView(voisinId);
    expect(duVoisin.totals.games).toBe(1);
    expect(duVoisin.totals.hintsUnlocked).toBe(5);
  });

  it("classe les situations par score moyen croissant, la plus dure en tête", async () => {
    const usage = await getTeacherUsageView(teacherId);
    const scores = usage.situations.map((s) => s.averageScore);
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);

    const nova = usage.situations.find((s) => s.code === "nova_t1_takeover")!;
    expect(nova.debriefed).toBe(1);
    expect(nova.averageHints).toBe(3);
    expect(nova.scenario).not.toBe("");
    expect(nova.averageScore).toBeLessThan(usage.situations[1]!.averageScore);
  });

  it("détaille les indices niveau par niveau, toujours sur cinq lignes", async () => {
    const usage = await getTeacherUsageView(teacherId);
    expect(usage.hintsByLevel.map((h) => h.level)).toEqual([1, 2, 3, 4, 5]);
    expect(usage.hintsByLevel.map((h) => h.count)).toEqual([1, 1, 1, 0, 0]);
  });

  it("remonte la maîtrise des notions des élèves passés par ces parties", async () => {
    const usage = await getTeacherUsageView(teacherId);
    expect(usage.concepts.length).toBeGreaterThan(0);
    const averages = usage.concepts.map((c) => c.average);
    expect([...averages].sort((a, b) => a - b)).toEqual(averages);
    for (const c of usage.concepts) expect(c.students).toBeGreaterThan(0);
  });

  it("une situation répondue mais pas encore débriefée ne compte pas", async () => {
    // Le tour 2 de la partie NOVA a ouvert une situation. L'équipe y répond,
    // mais l'enseignante n'a pas clôturé le tour : tant que le débriefing n'a
    // pas eu lieu, il n'y a pas de score définitif, donc rien à moyenner. La
    // faire entrer ici afficherait un zéro qui passerait pour un échec.
    const ouverte = (await getTeamSituations(novaGameId, teacherId)).current[0]!;
    const def = situationByCode.get(ouverte.code)!;
    await submitDiagnosis({
      instanceId: ouverte.instanceId,
      userId: teacherId,
      selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
    });
    expect((await getTeamSituations(novaGameId, teacherId)).current[0]!.status).toBe("diagnosed");

    const usage = await getTeacherUsageView(teacherId);
    expect(usage.totals.situationsDebriefed).toBe(2);
    expect(usage.situations.reduce((n, s) => n + s.debriefed, 0)).toBe(2);
    expect(usage.situations.some((s) => s.code === ouverte.code)).toBe(false);
  });

  it("un enseignant sans partie obtient un carnet vide, pas une erreur", async () => {
    const nouveau = await db
      .insert(users)
      .values({ email: "nouvelle@test.local", displayName: "Nouvelle" })
      .returning({ id: users.id });
    const usage = await getTeacherUsageView(nouveau[0]!.id);
    expect(usage.totals).toEqual({
      games: 0,
      finishedGames: 0,
      teams: 0,
      situationsDebriefed: 0,
      hintsUnlocked: 0,
    });
    expect(usage.situations).toEqual([]);
    expect(usage.sectors).toEqual([]);
    expect(usage.concepts).toEqual([]);
  });

  it("compte les parties terminées à part des parties créées", async () => {
    await db.update(games).set({ status: "finished" });
    const usage = await getTeacherUsageView(teacherId);
    expect(usage.totals.games).toBe(2);
    expect(usage.totals.finishedGames).toBe(2);
  });
});
