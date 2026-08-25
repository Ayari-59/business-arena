import { randomInt } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  companyStates,
  decisions,
  gameRankings,
  games,
  kpis,
  organizations,
  players,
  roundResults,
  rounds,
  scenarios,
  teams,
} from "@/db/schema";
import { novaBots, novaCompany, novaScenario } from "@/config/scenarios/nova";
import {
  applyPeriodicity,
  applyPeriodicityToCompany,
  type Periodicity,
} from "@/config/scenarios/periodicity";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { botDecisions, type BotProfile } from "@/engine/bots";
import { ENGINE_VERSION, simulateRound } from "@/engine/simulation";
import type {
  CompanyRoundResult,
  CompanyState,
  EventInstance,
  RoundDecisions,
} from "@/engine/types";

/**
 * Use-cases de partie (doc 01 §1) : SEULE couche autorisée à écrire en base.
 * Le driver HTTP Neon n'offre pas de transactions : la résolution d'un tour
 * est idempotente via un verrou optimiste sur rounds.status (open → resolving),
 * et re-tentable — chaque écriture est un upsert ou une insertion idempotente.
 */

const PUBLIC_ORG_SLUG = "public";

async function getOrCreatePublicOrgId(): Promise<string> {
  const found = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, PUBLIC_ORG_SLUG));
  if (found[0]) return found[0].id;
  const inserted = await db
    .insert(organizations)
    .values({ name: "Grand public", slug: PUBLIC_ORG_SLUG, kind: "public" })
    .onConflictDoNothing({ target: organizations.slug })
    .returning({ id: organizations.id });
  if (inserted[0]) return inserted[0].id;
  const retry = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, PUBLIC_ORG_SLUG));
  if (!retry[0]) throw new Error("Organisation publique introuvable");
  return retry[0].id;
}

async function getOrCreateNovaScenarioId(): Promise<string> {
  const found = await db
    .select({ id: scenarios.id })
    .from(scenarios)
    .where(and(eq(scenarios.code, novaScenario.code), eq(scenarios.version, novaScenario.version)));
  if (found[0]) return found[0].id;
  const inserted = await db
    .insert(scenarios)
    .values({
      code: novaScenario.code,
      version: novaScenario.version,
      title: "NOVA — Prenez les commandes",
      summary:
        "Reprenez NOVA, jeune fabricant d'enceintes portables : 6 trimestres pour apprendre prix, capacité, seuil de rentabilité et trésorerie.",
      minCompanies: 1,
      maxCompanies: 8,
      roundsCount: novaScenario.roundsCount,
      baseDifficulty: 1,
      config: novaScenario,
      status: "published",
    })
    .returning({ id: scenarios.id });
  if (!inserted[0]) throw new Error("Création du scénario NOVA impossible");
  return inserted[0].id;
}

/** Crée une partie solo NOVA : joueur humain contre SoundBox et Auris. */
export async function createSoloGame(
  userId: string,
  periodicity: Periodicity = "quarter",
): Promise<string> {
  const [organizationId, scenarioId] = await Promise.all([
    getOrCreatePublicOrgId(),
    getOrCreateNovaScenarioId(),
  ]);
  const seed = randomInt(1, 2 ** 31);
  const scenarioSnapshot = applyPeriodicity(novaScenario, periodicity); // ADR-01 + ADR-10

  const [game] = await db
    .insert(games)
    .values({
      organizationId,
      scenarioId,
      scenarioSnapshot, // instantané figé (ADR-10), redimensionné par périodicité
      engineVersion: ENGINE_VERSION,
      seed,
      mode: "learning",
      difficultyProfile: { level: 1, periodicity },
      status: "running",
      currentRound: 1,
      createdBy: userId,
    })
    .returning({ id: games.id });
  if (!game) throw new Error("Création de partie impossible");

  const teamRows = await db
    .insert(teams)
    .values([
      { gameId: game.id, name: "NOVA (vous)", controller: "human" as const },
      ...novaBots.map((b) => ({
        gameId: game.id,
        name: b.name,
        controller: "bot" as const,
        botProfile: b.profile,
      })),
    ])
    .returning({ id: teams.id, name: teams.name, controller: teams.controller, botProfile: teams.botProfile });

  const humanTeam = teamRows.find((t) => t.controller === "human");
  if (!humanTeam) throw new Error("Équipe joueur manquante");
  await db.insert(players).values({ teamId: humanTeam.id, userId, role: "captain" });

  await db.insert(rounds).values(
    Array.from({ length: scenarioSnapshot.roundsCount }, (_, i) => ({
      gameId: game.id,
      index: i + 1,
      status: i === 0 ? ("open" as const) : ("pending" as const),
    })),
  );

  await db.insert(companyStates).values(
    teamRows.map((t) => ({
      teamId: t.id,
      roundIndex: 0,
      state: applyPeriodicityToCompany(
        novaCompany(
          t.id,
          t.name,
          t.controller === "human" ? "human" : "bot",
          (t.botProfile ?? undefined) as BotProfile | undefined,
        ),
        periodicity,
      ),
    })),
  );

  return game.id;
}

const toMoney = (v: number) => (Math.round(v * 100) / 100).toString();

function sumSold(result: CompanyRoundResult): number {
  return Object.values(result.market.bySegment).reduce((s, d) => s + d.sold, 0);
}

/**
 * Résout le tour courant d'une partie solo avec les décisions du joueur.
 * Verrou optimiste : seul l'appel qui bascule le tour open → resolving résout.
 */
export async function resolveCurrentRound(args: {
  gameId: string;
  userId: string;
  playerDecisions: RoundDecisions;
}): Promise<{ roundIndex: number; finished: boolean }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.status !== "running") throw new Error("Cette partie est terminée");
  const roundIndex = game.currentRound;

  const teamRows = await db.select().from(teams).where(eq(teams.gameId, args.gameId));
  const humanTeam = teamRows.find((t) => t.controller === "human");
  if (!humanTeam) throw new Error("Équipe joueur manquante");
  const membership = await db
    .select()
    .from(players)
    .where(and(eq(players.teamId, humanTeam.id), eq(players.userId, args.userId)));
  if (!membership[0]) throw new Error("Vous n'êtes pas membre de cette partie");

  const roundRow = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, args.gameId), eq(rounds.index, roundIndex)))
  )[0];
  if (!roundRow) throw new Error("Tour introuvable");

  // Verrou optimiste (pas de transactions sur le driver HTTP Neon)
  const locked = await db
    .update(rounds)
    .set({ status: "resolving" })
    .where(and(eq(rounds.id, roundRow.id), eq(rounds.status, "open")))
    .returning({ id: rounds.id });
  if (!locked[0]) throw new Error("Ce tour est déjà en cours de résolution");

  try {
    const scenario = parseScenarioConfig(game.scenarioSnapshot);

    const stateRows = await db
      .select()
      .from(companyStates)
      .where(
        and(
          eq(companyStates.roundIndex, roundIndex - 1),
          inArray(companyStates.teamId, teamRows.map((t) => t.id)),
        ),
      );
    const states = stateRows.map((r) => r.state as CompanyState);
    if (states.length !== teamRows.length) throw new Error("États d'entreprises incomplets");

    // Ventes du tour précédent (adaptation des bots)
    const lastSold: Record<string, number> = {};
    if (roundIndex > 1) {
      const prevRound = (
        await db
          .select()
          .from(rounds)
          .where(and(eq(rounds.gameId, args.gameId), eq(rounds.index, roundIndex - 1)))
      )[0];
      if (prevRound) {
        const prevResults = await db
          .select()
          .from(roundResults)
          .where(eq(roundResults.roundId, prevRound.id));
        for (const r of prevResults) {
          lastSold[r.teamId] = sumSold({
            market: { bySegment: (r.marketDetail ?? {}) as CompanyRoundResult["market"]["bySegment"] },
          } as CompanyRoundResult);
        }
      }
    }

    const allDecisions: Record<string, RoundDecisions> = {};
    for (const team of teamRows) {
      const state = states.find((s) => s.id === team.id);
      if (!state) throw new Error(`État manquant pour ${team.name}`);
      allDecisions[team.id] =
        team.controller === "human"
          ? args.playerDecisions
          : botDecisions((team.botProfile ?? "balanced") as BotProfile, {
              scenario,
              state,
              roundIndex,
              lastSoldUnits: lastSold[team.id],
            });
    }

    const activeEvents = (game.difficultyProfile as { activeEvents?: EventInstance[] })
      ?.activeEvents; // événements actifs stockés côté partie (voir plus bas)
    const output = simulateRound({
      scenario,
      roundIndex,
      companies: states,
      decisions: allDecisions,
      activeEvents: Array.isArray(activeEvents) ? activeEvents : [],
      seed: game.seed,
    });

    // Persistance (idempotente : upserts sur clés naturelles)
    await db
      .insert(decisions)
      .values(
        teamRows.map((t) => ({
          roundId: roundRow.id,
          teamId: t.id,
          payload: allDecisions[t.id]!,
          status: "locked" as const,
          validatedAt: new Date(),
          validatedBy: t.controller === "human" ? args.userId : null,
        })),
      )
      .onConflictDoNothing();

    await db
      .insert(roundResults)
      .values(
        teamRows.map((t) => {
          const r = output.results[t.id]!;
          return {
            roundId: roundRow.id,
            teamId: t.id,
            incomeStatement: r.incomeStatement,
            balanceSheet: r.balanceSheet,
            cashFlow: r.cashFlow,
            marketDetail: r.market.bySegment,
            engineTrace: {
              production: r.production,
              breakeven: r.breakeven,
              events: output.newEvents.map((e) => e.code),
            },
            revenue: toMoney(r.incomeStatement.revenue),
            netIncome: toMoney(r.incomeStatement.netIncome),
            cash: toMoney(r.balanceSheet.cash),
            frng: toMoney(r.functionalBalance.frng),
            bfr: toMoney(r.functionalBalance.bfr),
            netTreasury: toMoney(r.functionalBalance.netTreasury),
            marketShare: r.market.totalShare.toFixed(6),
          };
        }),
      )
      .onConflictDoNothing();

    await db
      .insert(kpis)
      .values(
        teamRows.flatMap((t) =>
          Object.entries(output.results[t.id]!.kpis).map(([kpiCode, value]) => ({
            roundId: roundRow.id,
            teamId: t.id,
            kpiCode,
            value: Number.isFinite(value) ? value.toFixed(4) : "0",
          })),
        ),
      )
      .onConflictDoNothing();

    await db
      .insert(companyStates)
      .values(
        output.companies.map((state) => ({ teamId: state.id, roundIndex, state })),
      )
      .onConflictDoNothing();

    const finished = roundIndex >= scenario.roundsCount;
    await db
      .update(rounds)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(eq(rounds.id, roundRow.id));
    if (!finished) {
      await db
        .update(rounds)
        .set({ status: "open" })
        .where(and(eq(rounds.gameId, args.gameId), eq(rounds.index, roundIndex + 1)));
    }
    await db
      .update(games)
      .set({
        currentRound: finished ? roundIndex : roundIndex + 1,
        status: finished ? "finished" : "running",
        difficultyProfile: { ...(game.difficultyProfile as object), activeEvents: output.events },
      })
      .where(eq(games.id, args.gameId));

    await updateRankings(args.gameId, teamRows.map((t) => t.id));
    return { roundIndex, finished };
  } catch (error) {
    // libère le verrou pour permettre une nouvelle tentative
    await db
      .update(rounds)
      .set({ status: "open" })
      .where(and(eq(rounds.id, roundRow.id), eq(rounds.status, "resolving")));
    throw error;
  }
}

/** Classement provisoire : résultat net cumulé (le BPI arrive à l'étape 10). */
async function updateRankings(gameId: string, teamIds: string[]): Promise<void> {
  const gameRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
  const results = await db
    .select()
    .from(roundResults)
    .where(inArray(roundResults.roundId, gameRounds.map((r) => r.id)));
  const cumulative = new Map<string, number>(teamIds.map((id) => [id, 0]));
  for (const r of results) {
    if (!cumulative.has(r.teamId)) continue;
    cumulative.set(r.teamId, (cumulative.get(r.teamId) ?? 0) + Number(r.netIncome));
  }
  const sorted = [...cumulative.entries()].sort((a, b) => b[1] - a[1]);
  const spread = Math.max(1, (sorted[0]?.[1] ?? 0) - (sorted.at(-1)?.[1] ?? 0));
  for (const [rank, [teamId, total]] of sorted.entries()) {
    const bpi = Math.max(0, Math.min(100, 50 + (50 * (total - (sorted.at(-1)?.[1] ?? 0))) / spread));
    await db
      .insert(gameRankings)
      .values({ gameId, teamId, bpi: bpi.toFixed(2), rank: rank + 1, detail: { cumulativeNetIncome: total } })
      .onConflictDoUpdate({
        target: [gameRankings.gameId, gameRankings.teamId],
        set: { bpi: bpi.toFixed(2), rank: rank + 1, detail: { cumulativeNetIncome: total } },
      });
  }
}

// ---------------------------------------------------------------------------
// Lecture : vue de partie pour le tableau de bord joueur
// ---------------------------------------------------------------------------

export interface GameView {
  gameId: string;
  status: string;
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  playerTeamId: string;
  playerTeamName: string;
  lastResult: CompanyRoundResult | null;
  lastEvents: string[];
  history: { round: number; revenue: number; netIncome: number; netTreasury: number }[];
  ranking: { name: string; isPlayer: boolean; cumulativeNetIncome: number; rank: number }[];
  lastDecisions: RoundDecisions | null;
}

export async function getGameView(gameId: string, userId: string): Promise<GameView | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) return null;
  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const humanTeam = teamRows.find((t) => t.controller === "human");
  if (!humanTeam) return null;
  const membership = await db
    .select()
    .from(players)
    .where(and(eq(players.teamId, humanTeam.id), eq(players.userId, userId)));
  if (!membership[0]) return null;

  const gameRounds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.gameId, gameId))
    .orderBy(asc(rounds.index));
  const resolved = gameRounds.filter((r) => r.status === "resolved");
  const roundIndexById = new Map(gameRounds.map((r) => [r.id, r.index]));

  const gameResults = await db
    .select()
    .from(roundResults)
    .where(inArray(roundResults.roundId, gameRounds.map((r) => r.id)));

  const history = gameResults
    .filter((r) => r.teamId === humanTeam.id)
    .map((r) => ({
      round: roundIndexById.get(r.roundId)!,
      revenue: Number(r.revenue),
      netIncome: Number(r.netIncome),
      netTreasury: Number(r.netTreasury),
    }))
    .sort((a, b) => a.round - b.round);

  const lastRound = resolved.at(-1);
  let lastResult: CompanyRoundResult | null = null;
  let lastEvents: string[] = [];
  let lastDecisions: RoundDecisions | null = null;
  if (lastRound) {
    const row = gameResults.find((r) => r.roundId === lastRound.id && r.teamId === humanTeam.id);
    if (row) {
      const trace = row.engineTrace as {
        production: CompanyRoundResult["production"];
        breakeven: CompanyRoundResult["breakeven"];
        events: string[];
      };
      lastResult = {
        companyId: humanTeam.id,
        incomeStatement: row.incomeStatement as CompanyRoundResult["incomeStatement"],
        balanceSheet: row.balanceSheet as CompanyRoundResult["balanceSheet"],
        cashFlow: row.cashFlow as CompanyRoundResult["cashFlow"],
        functionalBalance: {
          frng: Number(row.frng),
          bfr: Number(row.bfr),
          netTreasury: Number(row.netTreasury),
        },
        ratios: {} as CompanyRoundResult["ratios"],
        market: {
          bySegment: row.marketDetail as CompanyRoundResult["market"]["bySegment"],
          totalShare: Number(row.marketShare),
        },
        production: trace.production,
        breakeven: trace.breakeven,
        kpis: {},
      };
      lastEvents = trace.events ?? [];
    }
    const decisionRow = (
      await db
        .select()
        .from(decisions)
        .where(and(eq(decisions.roundId, lastRound.id), eq(decisions.teamId, humanTeam.id)))
    )[0];
    if (decisionRow) lastDecisions = decisionRow.payload as RoundDecisions;
  }

  const rankingRows = await db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId));
  const ranking = rankingRows
    .map((r) => {
      const team = teamRows.find((t) => t.id === r.teamId);
      return {
        name: team?.name ?? "?",
        isPlayer: r.teamId === humanTeam.id,
        cumulativeNetIncome: Number(
          (r.detail as { cumulativeNetIncome?: number })?.cumulativeNetIncome ?? 0,
        ),
        rank: r.rank,
      };
    })
    .sort((a, b) => a.rank - b.rank);

  return {
    gameId,
    status: game.status,
    currentRound: game.currentRound,
    roundsCount: (game.scenarioSnapshot as { roundsCount: number }).roundsCount,
    roundDays: (game.scenarioSnapshot as { roundDays: number }).roundDays,
    playerTeamId: humanTeam.id,
    playerTeamName: humanTeam.name,
    lastResult,
    lastEvents,
    history,
    ranking,
    lastDecisions,
  };
}
