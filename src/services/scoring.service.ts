import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { gameRankings, games, roundResults, rounds, scores, situationInstances } from "@/db/schema";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import {
  BPI_DIMENSIONS,
  computeRoundScores,
  gameBpi,
  scoringWeights,
  type BpiDimension,
  type PedagogyInputs,
} from "@/scoring/bpi";
import type { CompanyRoundResult, EngineScenarioConfig, RoundDecisions } from "@/engine/types";

// ---------------------------------------------------------------------------
// Lecture des entrées pédagogiques
// ---------------------------------------------------------------------------

/**
 * Construit la map PedagogyInputs par équipe à partir des situationInstances
 * déjà débriefées pour un tour donné. Doit être appelée APRÈS debriefRound.
 */
export async function readPedagogyInputs(
  roundId: string,
): Promise<Map<string, PedagogyInputs>> {
  const instances = await db
    .select()
    .from(situationInstances)
    .where(eq(situationInstances.roundId, roundId));

  const byTeam = new Map<string, PedagogyInputs>();
  for (const instance of instances) {
    const diag = instance.diagnosis as { score?: number; finalScore?: number } | null;
    const entry = byTeam.get(instance.teamId) ?? { situationScores: [], diagnosisScores: [] };
    if (typeof diag?.finalScore === "number") entry.situationScores.push(diag.finalScore);
    if (typeof diag?.score === "number") entry.diagnosisScores.push(diag.score);
    byTeam.set(instance.teamId, entry);
  }
  return byTeam;
}

// ---------------------------------------------------------------------------
// Persistance des scores BPI du tour
// ---------------------------------------------------------------------------

export async function persistRoundScores(args: {
  roundId: string;
  scenario: EngineScenarioConfig;
  teamRows: { id: string; controller: "human" | "bot" }[];
  results: Record<string, CompanyRoundResult>;
  allDecisions: Record<string, RoundDecisions>;
  pedagogyByTeam: Map<string, PedagogyInputs>;
}): Promise<void> {
  const roundScores = computeRoundScores(
    args.scenario,
    args.teamRows.map((t) => ({
      companyId: t.id,
      decisions: args.allDecisions[t.id]!,
      result: args.results[t.id]!,
      pedagogy: args.pedagogyByTeam.get(t.id) ?? { situationScores: [], diagnosisScores: [] },
    })),
  );

  await db
    .insert(scores)
    .values(
      roundScores.flatMap((s) =>
        BPI_DIMENSIONS.map((dimension) => ({
          roundId: args.roundId,
          teamId: s.companyId,
          dimension,
          raw: s.raw[dimension].toFixed(4),
          normalized: s.normalized[dimension].toFixed(2),
        })),
      ),
    )
    .onConflictDoNothing();
}

// ---------------------------------------------------------------------------
// Classement au BPI
// ---------------------------------------------------------------------------

export async function updateRankings(gameId: string, teamIds: string[]): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) return;
  const scenario = parseScenarioConfig(game.scenarioSnapshot);
  const weights = scoringWeights(scenario.scoring);

  const gameRounds = (await db.select().from(rounds).where(eq(rounds.gameId, gameId))).sort(
    (a, b) => a.index - b.index,
  );
  const roundIds = gameRounds.map((r) => r.id);
  const scoreRows = roundIds.length
    ? await db.select().from(scores).where(inArray(scores.roundId, roundIds))
    : [];
  const resultRows = roundIds.length
    ? await db.select().from(roundResults).where(inArray(roundResults.roundId, roundIds))
    : [];

  const entries = teamIds.map((teamId) => {
    const roundBpis: number[] = [];
    const dimensionSums = new Map<BpiDimension, { sum: number; n: number }>();
    for (const round of gameRounds) {
      const rows = scoreRows.filter((s) => s.roundId === round.id && s.teamId === teamId);
      if (rows.length === 0) continue;
      let bpi = 0;
      for (const row of rows) {
        const dimension = row.dimension as BpiDimension;
        const value = Number(row.normalized);
        bpi += (weights[dimension] ?? 0) * value;
        const agg = dimensionSums.get(dimension) ?? { sum: 0, n: 0 };
        agg.sum += value;
        agg.n += 1;
        dimensionSums.set(dimension, agg);
      }
      roundBpis.push(bpi);
    }
    const teamResults = resultRows.filter((r) => r.teamId === teamId);
    const cumulativeNetIncome = teamResults.reduce((sum, r) => sum + Number(r.netIncome), 0);
    const lastTreasury = teamResults.length
      ? Number(
          teamResults.sort(
            (a, b) => roundIds.indexOf(a.roundId) - roundIds.indexOf(b.roundId),
          ).at(-1)!.netTreasury,
        )
      : 0;
    const financialAvg = dimensionSums.get("financial");
    return {
      teamId,
      bpi: gameBpi(roundBpis),
      roundBpis,
      cumulativeNetIncome,
      lastTreasury,
      financialAvg: financialAvg ? financialAvg.sum / financialAvg.n : 0,
      dimensions: Object.fromEntries(
        [...dimensionSums.entries()].map(([d, { sum, n }]) => [d, sum / n]),
      ),
    };
  });

  entries.sort(
    (a, b) => b.bpi - a.bpi || b.financialAvg - a.financialAvg || b.lastTreasury - a.lastTreasury,
  );
  if (entries.length > 0) {
    await db
      .insert(gameRankings)
      .values(
        entries.map((entry, i) => ({
          gameId,
          teamId: entry.teamId,
          bpi: entry.bpi.toFixed(2),
          rank: i + 1,
          detail: {
            cumulativeNetIncome: entry.cumulativeNetIncome,
            roundBpis: entry.roundBpis.map((v) => Math.round(v * 100) / 100),
            dimensions: entry.dimensions,
          },
        })),
      )
      .onConflictDoUpdate({
        target: [gameRankings.gameId, gameRankings.teamId],
        set: {
          bpi: sql`excluded.bpi`,
          rank: sql`excluded.rank`,
          detail: sql`excluded.detail`,
        },
      });
  }
}
