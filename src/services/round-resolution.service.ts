import { randomInt } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  companyStates,
  decisions,
  games,
  kpis,
  players,
  roundResults,
  rounds,
  teams,
} from "@/db/schema";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import {
  debriefRound,
  openSituationsForRound,
} from "@/services/pedagogy.service";
import { TEACHER_DRAWABLE_CODES, TEAM_CARD_CODES } from "@/config/events/cards";
import { botDecisions, type BotProfile } from "@/engine/bots";
import { carryOverDecisions, fallbackDecisions } from "@/services/decision.service";
import {
  persistRoundScores,
  readPedagogyInputs,
  updateRankings,
} from "@/services/scoring.service";
import { simulateRound } from "@/engine/simulation";
import type {
  CompanyRoundResult,
  CompanyState,
  EventInstance,
  RoundDecisions,
} from "@/engine/types";

/**
 * Résolution d'un tour de jeu (doc 01 §1).
 *
 * Ce module isole le pipeline de résolution (verrou optimiste, simulation,
 * persistance, scoring, pédagogie) et les fonctions qui en dépendent
 * directement : soumission de décisions, clôture par l'enseignant, tirage
 * de cartes événement.
 *
 * Le driver HTTP Neon n'offre pas de transactions : la résolution est
 * idempotente via un verrou optimiste sur rounds.status (open → resolving),
 * et re-tentable — chaque écriture est un upsert ou une insertion idempotente.
 */

/** Carte jouée par l'enseignant, en attente d'application à la clôture. */
export interface PendingEventCard {
  code: string;
  /** null = toute la classe (portée marché) ; sinon l'équipe ciblée. */
  teamId: string | null;
}

export function readPendingEvents(profile: unknown): PendingEventCard[] {
  const p = profile as { pendingEvents?: PendingEventCard[]; pendingEventCodes?: string[] };
  if (Array.isArray(p.pendingEvents)) return p.pendingEvents;
  // rétro-compatibilité : ancien format (codes marché uniquement)
  if (Array.isArray(p.pendingEventCodes))
    return p.pendingEventCodes.map((code) => ({ code, teamId: null }));
  return [];
}

const toMoney = (v: number) => (Math.round(v * 100) / 100).toString();

function sumSold(bySegment: CompanyRoundResult["market"]["bySegment"]): number {
  return Object.values(bySegment).reduce((s, d) => s + d.sold, 0);
}

/** Équipe (humaine) d'un utilisateur dans une partie, avec la liste complète des équipes. */
export async function findUserTeam(gameId: string, userId: string) {
  const allTeams = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const humanIds = allTeams.filter((t) => t.controller === "human").map((t) => t.id);
  if (humanIds.length === 0) return { team: null, allTeams };
  const membership = (
    await db
      .select()
      .from(players)
      .where(and(inArray(players.teamId, humanIds), eq(players.userId, userId)))
  )[0];
  if (!membership) return { team: null, allTeams };
  return { team: allTeams.find((t) => t.id === membership.teamId) ?? null, allTeams };
}

/** Soumet (valide) les décisions de l'équipe de l'utilisateur pour le tour courant. */
export async function submitTeamDecisions(args: {
  gameId: string;
  userId: string;
  payload: RoundDecisions;
  justification?: string;
}): Promise<{ roundIndex: number }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.status !== "running") throw new Error("Cette partie est terminée");
  const { team } = await findUserTeam(args.gameId, args.userId);
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

  const justification = args.justification?.trim() || null;
  await db
    .insert(decisions)
    .values({
      roundId: roundRow.id,
      teamId: team.id,
      payload: args.payload,
      justification,
      status: "validated",
      validatedAt: new Date(),
      validatedBy: args.userId,
    })
    .onConflictDoUpdate({
      target: [decisions.roundId, decisions.teamId],
      set: {
        payload: args.payload,
        justification,
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
        allDecisions[team.id] = carryOverDecisions(previousPayloads[team.id]!);
        carriedOver.add(team.id);
      } else {
        allDecisions[team.id] = fallbackDecisions(scenario, state, roundIndex);
        carriedOver.add(team.id);
      }
    }

    const profile = game.difficultyProfile as { activeEvents?: EventInstance[] };
    const activeEvents = Array.isArray(profile.activeEvents) ? profile.activeEvents : [];
    // Cartes jouées par l'enseignant : marché (toute la classe) ou ciblées
    const pendingCards = readPendingEvents(game.difficultyProfile);
    const injected: EventInstance[] = pendingCards.flatMap((card) => {
      const def = scenario.events.find((e) => e.code === card.code);
      if (!def) return [];
      if (activeEvents.some((e) => e.code === card.code && e.companyId === (card.teamId ?? undefined)))
        return [];
      return [
        {
          code: def.code,
          scope: card.teamId ? ("company" as const) : ("market" as const),
          companyId: card.teamId ?? undefined,
          roundsLeft: def.duration,
          modifiers: def.modifiers,
        },
      ];
    });
    const output = simulateRound({
      scenario,
      roundIndex,
      companies: states,
      decisions: allDecisions,
      activeEvents: [...activeEvents, ...injected],
      seed: game.seed,
    });
    /** Événements visibles par une équipe : portée marché + ceux qui la ciblent. */
    const roundEventCodesFor = (teamId: string): string[] =>
      [...injected, ...output.newEvents]
        .filter((e) => e.scope === "market" || e.companyId === teamId)
        .map((e) => e.code);

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
              events: roundEventCodesFor(t.id),
              extraOrders: r.extraOrders ?? null,
              orderOffer: r.orderOffer ?? null,
              studies: r.studies ?? null,
              capital: r.capital ?? null,
              insurance: r.insurance ?? null,
              supplier: r.supplier ?? null,
              hr: r.hr ?? null,
              investment: r.investment ?? null,
              qualityCosts: r.qualityCosts ?? null,
              debt: r.debt ?? null,
              treasury: r.treasury ?? null,
              bank: r.bank ?? null,
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

    // Post-traitement AVANT l'avancement d'état : si l'une de ces étapes
    // échoue, le round reste en « resolving » et le catch le remet à « open ».
    await debriefRound(gameId, roundIndex);

    const pedagogyByTeam = await readPedagogyInputs(roundRow.id);
    await persistRoundScores({
      roundId: roundRow.id,
      scenario,
      teamRows,
      results: output.results,
      allDecisions,
      pedagogyByTeam,
    });
    await updateRankings(gameId, teamRows.map((t) => t.id));

    if (!finished) {
      await openSituationsForRound(gameId, roundIndex + 1, output.results);
    }

    // Avancement d'état seulement après succès complet du post-traitement
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
        difficultyProfile: {
          ...(game.difficultyProfile as object),
          activeEvents: output.events,
          pendingEvents: [],
          pendingEventCodes: undefined,
        },
      })
      .where(eq(games.id, gameId));

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

/** Mode solo : valider ses décisions ET résoudre immédiatement (ADR-04). */
export async function resolveCurrentRound(args: {
  gameId: string;
  userId: string;
  playerDecisions: RoundDecisions;
  justification?: string;
}): Promise<{ roundIndex: number; finished: boolean }> {
  await submitTeamDecisions({
    gameId: args.gameId,
    userId: args.userId,
    payload: args.playerDecisions,
    justification: args.justification,
  });
  return resolveGameRound(args.gameId);
}

/**
 * Tirage manuel d'une carte événement par l'enseignant (animation de classe).
 * Mode apprentissage uniquement : en compétition, seul le tirage seedé fait
 * foi (équité). La carte est ANNONCÉE aux joueurs et appliquée à la clôture
 * du tour courant. Cartes de portée marché uniquement (équité du tirage manuel).
 */
export async function drawEventCardForNextRound(args: {
  gameId: string;
  teacherId: string;
  eventCode?: string;
  /** Carte « équipe » : l'équipe ciblée (tirage physique par équipe en classe). */
  teamId?: string;
}): Promise<{ eventCode: string; teamId: string | null }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.createdBy !== args.teacherId)
    throw new Error("Seul l'enseignant qui a créé la partie peut tirer une carte");
  if (game.status !== "running") throw new Error("Cette partie est terminée");
  if (game.mode !== "learning")
    throw new Error("Mode compétition : seul le tirage aléatoire seedé fait foi (équité)");

  const targetTeamId = args.teamId ?? null;
  if (targetTeamId) {
    const team = (
      await db
        .select()
        .from(teams)
        .where(and(eq(teams.id, targetTeamId), eq(teams.gameId, args.gameId)))
    )[0];
    if (!team || team.controller !== "human")
      throw new Error("Équipe ciblée introuvable dans cette partie");
  }

  const scenario = parseScenarioConfig(game.scenarioSnapshot);
  const scenarioCodes = new Set(scenario.events.map((e) => e.code));
  // deck marché (toute la classe) ou deck équipe (carte ciblée)
  const pool = (targetTeamId ? TEAM_CARD_CODES : TEACHER_DRAWABLE_CODES).filter((code) =>
    scenarioCodes.has(code),
  );
  if (pool.length === 0) throw new Error("Aucune carte tirable dans ce scénario");

  const pending = readPendingEvents(game.difficultyProfile);
  if (pending.length >= 4) throw new Error("Quatre cartes sont déjà en jeu pour ce tour");
  if (targetTeamId && pending.filter((p) => p.teamId === targetTeamId).length >= 1)
    throw new Error("Cette équipe a déjà une carte en jeu ce tour");
  if (!targetTeamId && pending.filter((p) => p.teamId === null).length >= 2)
    throw new Error("Deux cartes « toute la classe » sont déjà en jeu pour ce tour");

  const activeEvents = (game.difficultyProfile as { activeEvents?: EventInstance[] })
    ?.activeEvents;
  const activeCodes = new Set(
    (Array.isArray(activeEvents) ? activeEvents : []).map((e) => e.code),
  );
  const candidates = pool.filter(
    (c) =>
      !activeCodes.has(c) &&
      !pending.some((p) => p.code === c && p.teamId === targetTeamId),
  );
  if (candidates.length === 0) throw new Error("Toutes les cartes de ce deck sont déjà en jeu");

  let eventCode: string;
  if (args.eventCode) {
    if (!candidates.includes(args.eventCode))
      throw new Error("Cette carte n'est pas tirable actuellement");
    eventCode = args.eventCode;
  } else {
    eventCode = candidates[randomInt(candidates.length)]!;
  }

  await db
    .update(games)
    .set({
      difficultyProfile: {
        ...(game.difficultyProfile as object),
        pendingEvents: [...pending, { code: eventCode, teamId: targetTeamId }],
        pendingEventCodes: undefined,
      },
    })
    .where(eq(games.id, args.gameId));
  return { eventCode, teamId: targetTeamId };
}

/**
 * Mode classe : l'enseignant (créateur de la partie) clôt le tour courant.
 *
 * `expectedRound` est le tour que l'enseignant a vu à l'écran. Un double
 * envoi du même formulaire arrive après que le premier a fait avancer la
 * partie : sans ce garde, il clorait le tour suivant. La clôture est alors
 * idempotente : un tour déjà clos (ou en cours de résolution par une
 * requête concurrente) est rendu tel quel, sans rien simuler.
 */
export async function closeCurrentRound(args: {
  gameId: string;
  teacherId: string;
  expectedRound?: number;
}): Promise<{ roundIndex: number; finished: boolean; alreadyClosed: boolean }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.createdBy !== args.teacherId)
    throw new Error("Seul l'enseignant qui a créé la partie peut clore un tour");
  if (args.expectedRound !== undefined) {
    const attendu = (
      await db
        .select({ status: rounds.status })
        .from(rounds)
        .where(and(eq(rounds.gameId, args.gameId), eq(rounds.index, args.expectedRound)))
    )[0];
    if (!attendu) throw new Error("Tour introuvable");
    if (attendu.status !== "open" || game.currentRound !== args.expectedRound) {
      return {
        roundIndex: args.expectedRound,
        finished: game.status === "finished",
        alreadyClosed: true,
      };
    }
  }
  try {
    return { ...(await resolveGameRound(args.gameId)), alreadyClosed: false };
  } catch (error) {
    // Deux clôtures concurrentes du même tour : la seconde n'a rien à faire.
    if (
      args.expectedRound !== undefined &&
      error instanceof Error &&
      error.message === "Ce tour est déjà en cours de résolution"
    ) {
      return { roundIndex: args.expectedRound, finished: false, alreadyClosed: true };
    }
    throw error;
  }
}
