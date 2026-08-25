import { randomInt } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
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
  scores,
  situationInstances,
  teams,
  users,
} from "@/db/schema";
import { novaBots, novaCompany, novaScenario } from "@/config/scenarios/nova";
import {
  applyPeriodicity,
  applyPeriodicityToCompany,
  type Periodicity,
} from "@/config/scenarios/periodicity";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import {
  debriefRound,
  openSituationsForRound,
  seedPedagogyReferentials,
} from "@/services/pedagogy.service";
import { getPlatformConfig } from "@/services/admin.service";
import { botDecisions, type BotProfile } from "@/engine/bots";
import {
  BPI_DIMENSIONS,
  computeRoundScores,
  gameBpi,
  scoringWeights,
  type BpiDimension,
  type PedagogyInputs,
} from "@/scoring/bpi";
import { ENGINE_VERSION, simulateRound } from "@/engine/simulation";
import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  RoundDecisions,
} from "@/engine/types";

/**
 * Use-cases de partie (doc 01 §1) : SEULE couche autorisée à écrire en base.
 * Le driver HTTP Neon n'offre pas de transactions : la résolution d'un tour
 * est idempotente via un verrou optimiste sur rounds.status (open → resolving),
 * et re-tentable — chaque écriture est un upsert ou une insertion idempotente.
 *
 * Deux genres de partie (difficultyProfile.kind) :
 * - "solo"  : un joueur, résolution immédiate à la validation (ADR-04, solo) ;
 * - "class" : N équipes humaines + bots, chaque équipe valide ses décisions,
 *   l'enseignant (créateur) clôt le tour ; décisions manquantes reconduites.
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
        "Reprenez NOVA, jeune fabricant d'enceintes portables : 6 tours pour apprendre prix, capacité, seuil de rentabilité et trésorerie.",
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

/** Id du scénario NOVA publié (créé au besoin) — utilisé par le moteur de concours. */
export async function getOrCreateNovaScenarioIdPublic(): Promise<string> {
  return getOrCreateNovaScenarioId();
}

export type GameKind = "solo" | "class";

interface CreateGameArgs {
  organizationId: string;
  createdBy: string;
  periodicity: Periodicity;
  kind: GameKind;
  humanTeams: { name: string }[];
  botCount: number;
  joinCode?: string;
  /** §25 : "competition" verrouille les décisions validées et limite les indices. */
  mode?: "learning" | "competition";
  competitionStageId?: string;
}

export interface CreatedGame {
  gameId: string;
  teams: { id: string; name: string; controller: "human" | "bot" }[];
}

/** Cœur commun de création : partie + équipes + tours + états initiaux. */
export async function createGameCore(args: CreateGameArgs): Promise<CreatedGame> {
  const scenarioId = await getOrCreateNovaScenarioId();
  await seedPedagogyReferentials(); // référentiels concepts/modèles/situations (idempotent)
  const seed = randomInt(1, 2 ** 31);
  const scenarioSnapshot = applyPeriodicity(novaScenario, args.periodicity); // ADR-01 + ADR-10
  const botCount = Math.min(Math.max(args.botCount, 0), novaBots.length);

  const [game] = await db
    .insert(games)
    .values({
      organizationId: args.organizationId,
      scenarioId,
      scenarioSnapshot,
      engineVersion: ENGINE_VERSION,
      seed,
      mode: args.mode ?? "learning",
      competitionStageId: args.competitionStageId,
      difficultyProfile: { level: 1, periodicity: args.periodicity, kind: args.kind },
      status: "running",
      currentRound: 1,
      joinCode: args.joinCode,
      createdBy: args.createdBy,
    })
    .returning({ id: games.id });
  if (!game) throw new Error("Création de partie impossible");

  const teamRows = await db
    .insert(teams)
    .values([
      ...args.humanTeams.map((t) => ({
        gameId: game.id,
        name: t.name,
        controller: "human" as const,
      })),
      ...novaBots.slice(0, botCount).map((b) => ({
        gameId: game.id,
        name: b.name,
        controller: "bot" as const,
        botProfile: b.profile,
      })),
    ])
    .returning({
      id: teams.id,
      name: teams.name,
      controller: teams.controller,
      botProfile: teams.botProfile,
    });

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
        args.periodicity,
      ),
    })),
  );

  await openSituationsForRound(game.id, 1); // situations scriptées du tour 1 (doc 03)

  return {
    gameId: game.id,
    teams: teamRows.map((t) => ({ id: t.id, name: t.name, controller: t.controller })),
  };
}

/** Partie solo : le joueur contre N−1 bots du pool (§27 : nombre configurable). */
export async function createSoloGame(
  userId: string,
  periodicity: Periodicity = "quarter",
  companiesCount = 3,
): Promise<string> {
  const config = await getPlatformConfig();
  if (!config.allowPublicPlay) {
    throw new Error("Les parties publiques sont désactivées par l'administrateur.");
  }
  const organizationId = await getOrCreatePublicOrgId();
  const botCount = Math.min(Math.max(companiesCount, 2), novaBots.length + 1) - 1;
  const { gameId } = await createGameCore({
    organizationId,
    createdBy: userId,
    periodicity,
    kind: "solo",
    humanTeams: [{ name: "NOVA (vous)" }],
    botCount,
  });
  const humanTeam = (
    await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")))
  )[0]!;
  await db.insert(players).values({ teamId: humanTeam.id, userId, role: "captain" });
  return gameId;
}

const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeJoinCode(): string {
  return Array.from(
    { length: 6 },
    () => JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)],
  ).join("");
}

/** Partie de classe (§27) : N équipes humaines + bots, code d'invitation. */
export async function createClassGame(args: {
  teacherId: string;
  organizationId: string;
  periodicity: Periodicity;
  humanTeamsCount: number;
  botCount: number;
}): Promise<{ gameId: string; joinCode: string }> {
  const humanTeamsCount = Math.min(Math.max(args.humanTeamsCount, 1), 8);
  const botCount = Math.min(Math.max(args.botCount, 0), 8 - humanTeamsCount);
  const joinCode = makeJoinCode();
  const { gameId } = await createGameCore({
    organizationId: args.organizationId,
    createdBy: args.teacherId,
    periodicity: args.periodicity,
    kind: "class",
    humanTeams: Array.from({ length: humanTeamsCount }, (_, i) => ({ name: `Équipe ${i + 1}` })),
    botCount,
    joinCode,
  });
  return { gameId, joinCode };
}

/** Rejoindre une partie de classe par code : affectation à l'équipe la moins remplie. */
export async function joinGameByCode(args: {
  code: string;
  userId: string;
  pseudo?: string;
}): Promise<{ gameId: string } | { error: string }> {
  const game = (
    await db.select().from(games).where(eq(games.joinCode, args.code.trim().toUpperCase()))
  )[0];
  if (!game) return { error: "Code de partie inconnu." };
  if (game.status === "finished" || game.status === "archived")
    return { error: "Cette partie est terminée." };

  const teamRows = await db
    .select()
    .from(teams)
    .where(and(eq(teams.gameId, game.id), eq(teams.controller, "human")));
  if (teamRows.length === 0) return { error: "Aucune équipe à rejoindre." };

  const memberships = await db
    .select()
    .from(players)
    .where(inArray(players.teamId, teamRows.map((t) => t.id)));
  if (memberships.some((m) => m.userId === args.userId)) return { gameId: game.id };

  const counts = new Map(teamRows.map((t) => [t.id, 0]));
  for (const m of memberships) counts.set(m.teamId, (counts.get(m.teamId) ?? 0) + 1);
  const target = [...counts.entries()].sort((a, b) => a[1] - b[1])[0]![0];

  await db.insert(players).values({ teamId: target, userId: args.userId, role: "member" });
  if (args.pseudo?.trim()) {
    await db.update(users).set({ displayName: args.pseudo.trim() }).where(eq(users.id, args.userId));
  }
  return { gameId: game.id };
}

const toMoney = (v: number) => (Math.round(v * 100) / 100).toString();

function sumSold(bySegment: CompanyRoundResult["market"]["bySegment"]): number {
  return Object.values(bySegment).reduce((s, d) => s + d.sold, 0);
}

/** Décisions de repli (échelle du scénario) quand une équipe n'a rien soumis au tour 1. */
function fallbackDecisions(scenario: EngineScenarioConfig): RoundDecisions {
  const k = scenario.roundDays / 90;
  return {
    price: 59,
    productionPlan: 4800 * k,
    marketingBudget: 6000 * k,
    qualityBudget: 2000 * k,
    maintenanceBudget: scenario.production.maintenanceReference,
    finance: { newLoan: 0, loanRepayment: 0 },
  };
}

/** Équipe (humaine) d'un utilisateur dans une partie, ou null. */
async function findUserTeam(gameId: string, userId: string) {
  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const humanIds = teamRows.filter((t) => t.controller === "human").map((t) => t.id);
  if (humanIds.length === 0) return null;
  const membership = (
    await db
      .select()
      .from(players)
      .where(and(inArray(players.teamId, humanIds), eq(players.userId, userId)))
  )[0];
  if (!membership) return null;
  return teamRows.find((t) => t.id === membership.teamId) ?? null;
}

/** Soumet (valide) les décisions de l'équipe de l'utilisateur pour le tour courant. */
export async function submitTeamDecisions(args: {
  gameId: string;
  userId: string;
  payload: RoundDecisions;
}): Promise<{ roundIndex: number }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.status !== "running") throw new Error("Cette partie est terminée");
  const team = await findUserTeam(args.gameId, args.userId);
  if (!team) throw new Error("Vous n'êtes pas membre de cette partie");

  const roundRow = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, args.gameId), eq(rounds.index, game.currentRound)))
  )[0];
  if (!roundRow || roundRow.status !== "open") throw new Error("Ce tour n'est pas ouvert");

  // §25 (mode compétition) : décisions verrouillées après validation
  if (game.mode === "competition") {
    const existing = (
      await db
        .select()
        .from(decisions)
        .where(and(eq(decisions.roundId, roundRow.id), eq(decisions.teamId, team.id)))
    )[0];
    if (existing && existing.status !== "draft") {
      throw new Error("Mode compétition : vos décisions sont verrouillées après validation");
    }
  }

  await db
    .insert(decisions)
    .values({
      roundId: roundRow.id,
      teamId: team.id,
      payload: args.payload,
      status: "validated",
      validatedAt: new Date(),
      validatedBy: args.userId,
    })
    .onConflictDoUpdate({
      target: [decisions.roundId, decisions.teamId],
      set: {
        payload: args.payload,
        status: "validated",
        validatedAt: new Date(),
        validatedBy: args.userId,
      },
    });
  return { roundIndex: game.currentRound };
}

/**
 * Résolution du tour courant (cœur commun solo / classe).
 * Décisions par équipe humaine : soumises → sinon reconduites du tour
 * précédent (carried_over, ADR-04) → sinon repli. Bots : stratégies pures.
 */
async function resolveGameRound(
  gameId: string,
): Promise<{ roundIndex: number; finished: boolean }> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.status !== "running") throw new Error("Cette partie est terminée");
  const roundIndex = game.currentRound;

  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const roundRow = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex)))
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

    // Décisions soumises pour ce tour + ventes et décisions du tour précédent
    const submitted = await db.select().from(decisions).where(eq(decisions.roundId, roundRow.id));
    const lastSold: Record<string, number> = {};
    const previousPayloads: Record<string, RoundDecisions> = {};
    if (roundIndex > 1) {
      const prevRound = (
        await db
          .select()
          .from(rounds)
          .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex - 1)))
      )[0];
      if (prevRound) {
        const prevResults = await db
          .select()
          .from(roundResults)
          .where(eq(roundResults.roundId, prevRound.id));
        for (const r of prevResults) {
          lastSold[r.teamId] = sumSold(
            (r.marketDetail ?? {}) as CompanyRoundResult["market"]["bySegment"],
          );
        }
        const prevDecisions = await db
          .select()
          .from(decisions)
          .where(eq(decisions.roundId, prevRound.id));
        for (const d of prevDecisions) previousPayloads[d.teamId] = d.payload as RoundDecisions;
      }
    }

    const allDecisions: Record<string, RoundDecisions> = {};
    const carriedOver = new Set<string>();
    for (const team of teamRows) {
      const state = states.find((s) => s.id === team.id);
      if (!state) throw new Error(`État manquant pour ${team.name}`);
      if (team.controller === "bot") {
        allDecisions[team.id] = botDecisions((team.botProfile ?? "balanced") as BotProfile, {
          scenario,
          state,
          roundIndex,
          lastSoldUnits: lastSold[team.id],
        });
        continue;
      }
      const own = submitted.find((d) => d.teamId === team.id);
      if (own) {
        allDecisions[team.id] = own.payload as RoundDecisions;
      } else if (previousPayloads[team.id]) {
        allDecisions[team.id] = previousPayloads[team.id]!;
        carriedOver.add(team.id);
      } else {
        allDecisions[team.id] = fallbackDecisions(scenario);
        carriedOver.add(team.id);
      }
    }

    const activeEvents = (game.difficultyProfile as { activeEvents?: EventInstance[] })
      ?.activeEvents;
    const output = simulateRound({
      scenario,
      roundIndex,
      companies: states,
      decisions: allDecisions,
      activeEvents: Array.isArray(activeEvents) ? activeEvents : [],
      seed: game.seed,
    });

    // Persistance (idempotente)
    await db
      .insert(decisions)
      .values(
        teamRows.map((t) => ({
          roundId: roundRow.id,
          teamId: t.id,
          payload: allDecisions[t.id]!,
          status: carriedOver.has(t.id) ? ("carried_over" as const) : ("locked" as const),
          validatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [decisions.roundId, decisions.teamId],
        set: { status: "locked" },
      });

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
      .values(output.companies.map((state) => ({ teamId: state.id, roundIndex, state })))
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
        .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex + 1)));
    }
    await db
      .update(games)
      .set({
        currentRound: finished ? roundIndex : roundIndex + 1,
        status: finished ? "finished" : "running",
        difficultyProfile: { ...(game.difficultyProfile as object), activeEvents: output.events },
      })
      .where(eq(games.id, gameId));

    // Moteur pédagogique d'abord (doc 03) : le débriefing calcule les scores
    // de situations dont dépend la dimension « maîtrise des modèles » du BPI
    await debriefRound(gameId, roundIndex);

    // Scoring BPI du tour (doc 08) puis classement de partie
    await persistRoundScores({ gameId, roundId: roundRow.id, scenario, teamRows, output, allDecisions });
    await updateRankings(gameId, teamRows.map((t) => t.id));

    if (!finished) {
      await openSituationsForRound(gameId, roundIndex + 1, output.results);
    }
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

/** Genre d'une partie (solo / classe). */
export async function getGameKind(gameId: string): Promise<GameKind> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  return ((game.difficultyProfile as { kind?: GameKind }).kind ?? "solo") as GameKind;
}

/** Mode solo : valider ses décisions ET résoudre immédiatement (ADR-04). */
export async function resolveCurrentRound(args: {
  gameId: string;
  userId: string;
  playerDecisions: RoundDecisions;
}): Promise<{ roundIndex: number; finished: boolean }> {
  await submitTeamDecisions({
    gameId: args.gameId,
    userId: args.userId,
    payload: args.playerDecisions,
  });
  return resolveGameRound(args.gameId);
}

/** Mode classe : l'enseignant (créateur de la partie) clôt le tour courant. */
export async function closeCurrentRound(args: {
  gameId: string;
  teacherId: string;
}): Promise<{ roundIndex: number; finished: boolean }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.createdBy !== args.teacherId)
    throw new Error("Seul l'enseignant qui a créé la partie peut clore un tour");
  return resolveGameRound(args.gameId);
}

/** Scores BPI du tour (doc 08 §1) : 7 dimensions par équipe, persistées. */
async function persistRoundScores(args: {
  gameId: string;
  roundId: string;
  scenario: EngineScenarioConfig;
  teamRows: { id: string; controller: "human" | "bot" }[];
  output: ReturnType<typeof simulateRound>;
  allDecisions: Record<string, RoundDecisions>;
}): Promise<void> {
  // Entrées pédagogiques : scores des situations débriefées de CE tour
  const instances = await db
    .select()
    .from(situationInstances)
    .where(eq(situationInstances.roundId, args.roundId));
  const pedagogyByTeam = new Map<string, PedagogyInputs>();
  for (const instance of instances) {
    const diag = instance.diagnosis as { score?: number; finalScore?: number } | null;
    const entry = pedagogyByTeam.get(instance.teamId) ?? { situationScores: [], diagnosisScores: [] };
    if (typeof diag?.finalScore === "number") entry.situationScores.push(diag.finalScore);
    if (typeof diag?.score === "number") entry.diagnosisScores.push(diag.score);
    pedagogyByTeam.set(instance.teamId, entry);
  }

  const roundScores = computeRoundScores(
    args.scenario,
    args.teamRows.map((t) => ({
      companyId: t.id,
      decisions: args.allDecisions[t.id]!,
      result: args.output.results[t.id]!,
      pedagogy: pedagogyByTeam.get(t.id) ?? { situationScores: [], diagnosisScores: [] },
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

/** Classement au BPI (doc 08 §1.4) : tours à poids croissants, départage financier. */
async function updateRankings(gameId: string, teamIds: string[]): Promise<void> {
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
    // BPI par tour = Σ poids × dimension normalisée
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

  // départage (doc 04) : BPI, puis dimension financière, puis trésorerie finale
  entries.sort(
    (a, b) => b.bpi - a.bpi || b.financialAvg - a.financialAvg || b.lastTreasury - a.lastTreasury,
  );
  for (const [rank, entry] of entries.entries()) {
    const detail = {
      cumulativeNetIncome: entry.cumulativeNetIncome,
      roundBpis: entry.roundBpis.map((v) => Math.round(v * 100) / 100),
      dimensions: entry.dimensions,
    };
    await db
      .insert(gameRankings)
      .values({ gameId, teamId: entry.teamId, bpi: entry.bpi.toFixed(2), rank: rank + 1, detail })
      .onConflictDoUpdate({
        target: [gameRankings.gameId, gameRankings.teamId],
        set: { bpi: entry.bpi.toFixed(2), rank: rank + 1, detail },
      });
  }
}

// ---------------------------------------------------------------------------
// Lecture : vue joueur
// ---------------------------------------------------------------------------

export interface GameView {
  gameId: string;
  kind: GameKind;
  status: string;
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  playerTeamId: string;
  playerTeamName: string;
  /** Décisions déjà validées par l'équipe pour le tour courant (mode classe). */
  pendingDecisions: RoundDecisions | null;
  lastResult: CompanyRoundResult | null;
  lastEvents: string[];
  history: { round: number; revenue: number; netIncome: number; netTreasury: number }[];
  ranking: {
    name: string;
    isPlayer: boolean;
    cumulativeNetIncome: number;
    rank: number;
    bpi: number;
  }[];
  /** Moyennes 0-100 des 7 dimensions BPI de l'équipe du joueur (doc 08). */
  playerDimensions: Partial<Record<BpiDimension, number>> | null;
  lastDecisions: RoundDecisions | null;
}

export async function getGameView(gameId: string, userId: string): Promise<GameView | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) return null;
  const playerTeam = await findUserTeam(gameId, userId);
  if (!playerTeam) return null;
  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));

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
    .filter((r) => r.teamId === playerTeam.id)
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
    const row = gameResults.find((r) => r.roundId === lastRound.id && r.teamId === playerTeam.id);
    if (row) {
      const trace = row.engineTrace as {
        production: CompanyRoundResult["production"];
        breakeven: CompanyRoundResult["breakeven"];
        events: string[];
      };
      lastResult = {
        companyId: playerTeam.id,
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
        .where(and(eq(decisions.roundId, lastRound.id), eq(decisions.teamId, playerTeam.id)))
    )[0];
    if (decisionRow) lastDecisions = decisionRow.payload as RoundDecisions;
  }

  // Décisions déjà soumises pour le tour courant (mode classe : en attente de clôture)
  let pendingDecisions: RoundDecisions | null = null;
  const currentRoundRow = gameRounds.find((r) => r.index === game.currentRound);
  if (currentRoundRow && currentRoundRow.status === "open") {
    const row = (
      await db
        .select()
        .from(decisions)
        .where(
          and(eq(decisions.roundId, currentRoundRow.id), eq(decisions.teamId, playerTeam.id)),
        )
    )[0];
    if (row && row.status === "validated") pendingDecisions = row.payload as RoundDecisions;
  }

  const rankingRows = await db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId));
  const ranking = rankingRows
    .map((r) => {
      const team = teamRows.find((t) => t.id === r.teamId);
      return {
        name: team?.name ?? "?",
        isPlayer: r.teamId === playerTeam.id,
        cumulativeNetIncome: Number(
          (r.detail as { cumulativeNetIncome?: number })?.cumulativeNetIncome ?? 0,
        ),
        rank: r.rank,
        bpi: Number(r.bpi),
      };
    })
    .sort((a, b) => a.rank - b.rank);
  const playerRankingRow = rankingRows.find((r) => r.teamId === playerTeam.id);
  const playerDimensions =
    ((playerRankingRow?.detail as { dimensions?: Partial<Record<BpiDimension, number>> })
      ?.dimensions as Partial<Record<BpiDimension, number>> | undefined) ?? null;

  const profile = game.difficultyProfile as { kind?: GameKind };
  return {
    gameId,
    kind: profile.kind ?? "solo",
    status: game.status,
    currentRound: game.currentRound,
    roundsCount: (game.scenarioSnapshot as { roundsCount: number }).roundsCount,
    roundDays: (game.scenarioSnapshot as { roundDays: number }).roundDays,
    playerTeamId: playerTeam.id,
    playerTeamName: playerTeam.name,
    pendingDecisions,
    lastResult,
    lastEvents,
    history,
    ranking,
    playerDimensions,
    lastDecisions,
  };
}

// ---------------------------------------------------------------------------
// Lecture : vues enseignant (§27)
// ---------------------------------------------------------------------------

export interface TeacherGameSummary {
  gameId: string;
  joinCode: string | null;
  status: string;
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  teamsCount: number;
  createdAt: Date;
}

export async function getTeacherGames(teacherId: string): Promise<TeacherGameSummary[]> {
  const rows = await db
    .select()
    .from(games)
    .where(eq(games.createdBy, teacherId))
    .orderBy(desc(games.createdAt));
  const out: TeacherGameSummary[] = [];
  for (const g of rows) {
    if ((g.difficultyProfile as { kind?: string }).kind !== "class") continue;
    const teamRows = await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.gameId, g.id), eq(teams.controller, "human")));
    out.push({
      gameId: g.id,
      joinCode: g.joinCode,
      status: g.status,
      currentRound: g.currentRound,
      roundsCount: (g.scenarioSnapshot as { roundsCount: number }).roundsCount,
      roundDays: (g.scenarioSnapshot as { roundDays: number }).roundDays,
      teamsCount: teamRows.length,
      createdAt: g.createdAt,
    });
  }
  return out;
}

export interface TeacherGameView {
  gameId: string;
  joinCode: string | null;
  status: string;
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  teams: {
    teamId: string;
    name: string;
    controller: "human" | "bot";
    playerNames: string[];
    hasSubmitted: boolean;
    lastNetIncome: number | null;
    lastNetTreasury: number | null;
  }[];
  ranking: { name: string; cumulativeNetIncome: number; rank: number; bpi: number }[];
}

export async function getTeacherGameView(
  gameId: string,
  teacherId: string,
): Promise<TeacherGameView | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game || game.createdBy !== teacherId) return null;

  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const gameRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
  const currentRoundRow = gameRounds.find((r) => r.index === game.currentRound);

  const memberships = await db
    .select({ teamId: players.teamId, name: users.displayName })
    .from(players)
    .innerJoin(users, eq(users.id, players.userId))
    .where(inArray(players.teamId, teamRows.map((t) => t.id)));

  const submitted = currentRoundRow
    ? await db.select().from(decisions).where(eq(decisions.roundId, currentRoundRow.id))
    : [];

  const lastResolved = gameRounds
    .filter((r) => r.status === "resolved")
    .sort((a, b) => b.index - a.index)[0];
  const lastResults = lastResolved
    ? await db.select().from(roundResults).where(eq(roundResults.roundId, lastResolved.id))
    : [];

  const rankingRows = await db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId));

  return {
    gameId,
    joinCode: game.joinCode,
    status: game.status,
    currentRound: game.currentRound,
    roundsCount: (game.scenarioSnapshot as { roundsCount: number }).roundsCount,
    roundDays: (game.scenarioSnapshot as { roundDays: number }).roundDays,
    teams: teamRows.map((t) => {
      const last = lastResults.find((r) => r.teamId === t.id);
      return {
        teamId: t.id,
        name: t.name,
        controller: t.controller,
        playerNames: memberships.filter((m) => m.teamId === t.id).map((m) => m.name),
        hasSubmitted:
          t.controller === "bot" ||
          submitted.some((d) => d.teamId === t.id && d.status === "validated"),
        lastNetIncome: last ? Number(last.netIncome) : null,
        lastNetTreasury: last ? Number(last.netTreasury) : null,
      };
    }),
    ranking: rankingRows
      .map((r) => ({
        name: teamRows.find((t) => t.id === r.teamId)?.name ?? "?",
        cumulativeNetIncome: Number(
          (r.detail as { cumulativeNetIncome?: number })?.cumulativeNetIncome ?? 0,
        ),
        rank: r.rank,
        bpi: Number(r.bpi),
      }))
      .sort((a, b) => a.rank - b.rank),
  };
}
