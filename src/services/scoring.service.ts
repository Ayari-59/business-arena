import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { companyStates, gameRankings, games, roundResults, rounds, scores, situationInstances, situations } from "@/db/schema";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import {
  BPI_V2_DIMENSIONS,
  computeRoundScoresV2,
  gameBpi,
  scoringWeightsByName,
  type PedagogyInputs,
  type PedagogyInputsV2,
} from "@/scoring/bpi";
import { situationByCode } from "@/config/scenarios/registry";
import { PIVOT_FIELDS, memeValeur, type DecisionSourceMap, type PivotField } from "@/config/decision-source";
import type { CompanyRoundResult, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import type { LeverDirection } from "@/config/scenarios/situation-kit";

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
// Entrées de la cohérence stratégique v2 (V1-2)
// ---------------------------------------------------------------------------

/** Leviers pivots attendus d'un tour, par équipe (issus des situations du tour). */
async function readExpectedLevers(
  roundId: string,
): Promise<Map<string, { field: string; direction: LeverDirection }[]>> {
  const instances = await db
    .select({ teamId: situationInstances.teamId, situationId: situationInstances.situationId })
    .from(situationInstances)
    .where(eq(situationInstances.roundId, roundId));
  if (instances.length === 0) return new Map();
  const sitRows = await db.select({ id: situations.id, code: situations.code }).from(situations);
  const codeById = new Map(sitRows.map((r) => [r.id, r.code]));
  const byTeam = new Map<string, { field: string; direction: LeverDirection }[]>();
  for (const inst of instances) {
    const def = situationByCode.get(codeById.get(inst.situationId) ?? "");
    if (!def) continue;
    const arr = byTeam.get(inst.teamId) ?? [];
    for (const l of def.decisionLevers) arr.push({ field: l.field, direction: l.direction });
    byTeam.set(inst.teamId, arr);
  }
  return byTeam;
}

/** Résultat net du tour précédent par équipe (vide au tour 1). */
async function readPreviousNetIncome(gameId: string, roundIndex: number): Promise<Map<string, number>> {
  if (roundIndex <= 1) return new Map();
  const prev = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex - 1)))
  )[0];
  if (!prev) return new Map();
  const rows = await db
    .select({ teamId: roundResults.teamId, netIncome: roundResults.netIncome })
    .from(roundResults)
    .where(eq(roundResults.roundId, prev.id));
  return new Map(rows.map((r) => [r.teamId, Number(r.netIncome)]));
}

/**
 * Cohérence 0..100 des leviers PIVOTS d'un tour : part des leviers attendus
 * (prix, volume) que l'équipe a réellement édités dans le bon sens face à la
 * valeur proposée. `null` quand le tour ne suggère aucun levier pivot.
 */
export function coherencePivots(args: {
  levers: { field: string; direction: LeverDirection }[];
  source: DecisionSourceMap;
  decisions: RoundDecisions;
  proposed: RoundDecisions;
}): number | null {
  const attendus = new Map<PivotField, LeverDirection>();
  for (const l of args.levers) {
    if (!(PIVOT_FIELDS as readonly string[]).includes(l.field)) continue;
    const champ = l.field as PivotField;
    const prev = attendus.get(champ);
    // Deux situations qui tirent le même pivot dans des sens opposés : « à revoir ».
    attendus.set(champ, prev && prev !== l.direction ? "review" : l.direction);
  }
  if (attendus.size === 0) return null;
  let satisfaits = 0;
  for (const [champ, direction] of attendus) {
    if (args.source[champ] !== "edited") continue;
    const now = args.decisions[champ];
    const base = args.proposed[champ];
    const change = !memeValeur(champ, now, base);
    const bonSens =
      direction === "up" ? now > base : direction === "down" ? now < base : change;
    if (bonSens) satisfaits += 1;
  }
  return (satisfaits / attendus.size) * 100;
}

// ---------------------------------------------------------------------------
// Persistance des scores BPI du tour
// ---------------------------------------------------------------------------

export async function persistRoundScores(args: {
  roundId: string;
  roundIndex: number;
  gameId: string;
  scenario: EngineScenarioConfig;
  teamRows: { id: string; controller: "human" | "bot" }[];
  results: Record<string, CompanyRoundResult>;
  allDecisions: Record<string, RoundDecisions>;
  /** Source (edited/default/carried) des pivots, par équipe. */
  decisionSourceByTeam: Record<string, DecisionSourceMap>;
  /** Valeurs proposées du tour, par équipe (pour juger le sens d'une édition). */
  proposedByTeam: Record<string, RoundDecisions>;
  /** Équipes dont le tour a été reconduit faute de saisie. */
  carriedTeams: Set<string>;
  pedagogyByTeam: Map<string, PedagogyInputs>;
}): Promise<void> {
  const expectedLevers = await readExpectedLevers(args.roundId);
  const previousNet = await readPreviousNetIncome(args.gameId, args.roundIndex);

  const companies = args.teamRows.map((t) => {
    const source = args.decisionSourceByTeam[t.id];
    const proposed = args.proposedByTeam[t.id];
    const coherence =
      source && proposed
        ? coherencePivots({
            levers: expectedLevers.get(t.id) ?? [],
            source,
            decisions: args.allDecisions[t.id]!,
            proposed,
          })
        : null;
    const pedagogy: PedagogyInputsV2 = {
      situationScores: args.pedagogyByTeam.get(t.id)?.situationScores ?? [],
      carried: args.carriedTeams.has(t.id),
      coherence,
      previousNetIncome: previousNet.get(t.id) ?? 0,
    };
    return { companyId: t.id, result: args.results[t.id]!, pedagogy };
  });

  const roundScores = computeRoundScoresV2(args.scenario, companies);

  await db
    .insert(scores)
    .values(
      roundScores.flatMap((s) =>
        BPI_V2_DIMENSIONS.map((dimension) => ({
          roundId: args.roundId,
          teamId: s.companyId,
          dimension,
          raw: s.raw[dimension].toFixed(4),
          normalized: s.normalized[dimension].toFixed(2),
        })),
      ),
    )
    .onConflictDoNothing();

  // Ce tour est désormais scoré en v2 : le classement lira ses dimensions
  // (dont « pilotage ») avec les poids v2, sans toucher aux tours v1.
  await db.update(rounds).set({ bpiVersion: 2 }).where(eq(rounds.id, args.roundId));
}

// ---------------------------------------------------------------------------
// Classement au BPI
// ---------------------------------------------------------------------------

export async function updateRankings(gameId: string, teamIds: string[]): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) return;
  const scenario = parseScenarioConfig(game.scenarioSnapshot);
  // Poids par nom de dimension : couvre v1 (stratégie + opérationnel) et v2
  // (pilotage = stratégie + opérationnel). Chaque tour est sommé avec les
  // dimensions réellement stockées pour lui, sans connaître sa version.
  const weights = scoringWeightsByName(scenario.scoring);

  const gameRounds = (await db.select().from(rounds).where(eq(rounds.gameId, gameId))).sort(
    (a, b) => a.index - b.index,
  );
  const roundIds = gameRounds.map((r) => r.id);
  const scoreRows = roundIds.length
    ? await db.select().from(scores).where(inArray(scores.roundId, roundIds))
    : [];
  // On ne lit que les quatre colonnes réellement utilisées (identité + les deux
  // agrégats financiers) : un `select()` complet rapatriait les gros JSONB
  // (états financiers, trace moteur, détail marché) de CHAQUE équipe × tour à
  // chaque clôture — coût qui croît avec la partie, pour des données inutilisées.
  const resultRows = roundIds.length
    ? await db
        .select({
          teamId: roundResults.teamId,
          roundId: roundResults.roundId,
          netIncome: roundResults.netIncome,
          netTreasury: roundResults.netTreasury,
        })
        .from(roundResults)
        .where(inArray(roundResults.roundId, roundIds))
    : [];

  // Défaillance : l'état le plus récent de chaque équipe fait foi. Le moteur
  // n'écrit `status` que dès qu'une entreprise devient (ou a été) défaillante,
  // donc l'absence de champ vaut « active ». On garde ce booléen dans le
  // classement pour que l'arène et l'enseignant nomment la faillite sans
  // rejouer le moteur.
  const stateRows = teamIds.length
    ? await db.select().from(companyStates).where(inArray(companyStates.teamId, teamIds))
    : [];
  const defaillantByTeam = new Map<string, boolean>();
  const latestRoundByTeam = new Map<string, number>();
  for (const row of stateRows) {
    if (row.roundIndex >= (latestRoundByTeam.get(row.teamId) ?? -1)) {
      latestRoundByTeam.set(row.teamId, row.roundIndex);
      defaillantByTeam.set(row.teamId, (row.state as { status?: string }).status === "defaillant");
    }
  }

  const entries = teamIds.map((teamId) => {
    // On garde l'INDICE RÉEL de chaque tour scoré : la pondération de trajectoire
    // (gameBpi) pèse le tour par son indice, pas par sa position dans la liste —
    // un tour sauté au milieu ne sous-pondère plus les tours suivants.
    const roundScores: { index: number; bpi: number }[] = [];
    const dimensionSums = new Map<string, { sum: number; n: number }>();
    for (const round of gameRounds) {
      const rows = scoreRows.filter((s) => s.roundId === round.id && s.teamId === teamId);
      if (rows.length === 0) continue;
      let bpi = 0;
      for (const row of rows) {
        const dimension = row.dimension as string;
        const value = Number(row.normalized);
        bpi += (weights[dimension] ?? 0) * value;
        const agg = dimensionSums.get(dimension) ?? { sum: 0, n: 0 };
        agg.sum += value;
        agg.n += 1;
        dimensionSums.set(dimension, agg);
      }
      roundScores.push({ index: round.index, bpi });
    }
    const roundBpis = roundScores.map((r) => r.bpi);
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
      bpi: gameBpi(roundScores),
      roundBpis,
      cumulativeNetIncome,
      lastTreasury,
      defaillant: defaillantByTeam.get(teamId) ?? false,
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
            defaillant: entry.defaillant,
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
