import { randomInt } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  competitionEntries,
  competitionStages,
  competitions,
  gameRankings,
  games,
  players,
  teams,
  users,
} from "@/db/schema";
import { composeGroups, podium, qualifiers, type GroupStanding } from "@/competition";
import { createGameCore } from "@/services/game-creation.service";
import { DEFAULT_QUIZ_MODE } from "@/config/difficulty";
import type { Periodicity } from "@/config/scenarios/periodicity";

/**
 * Moteur de concours (étape 13, doc 04) : un concours = un arbre de phases qui
 * ENGENDRENT des parties ordinaires (mode "competition" : décisions
 * verrouillées, indices limités — §25). Zéro modification du moteur
 * économique. Cycle : registration → qualification (groupes) → finale →
 * finished. L'organisateur clôt les tours de chaque partie via son pilotage
 * habituel (/teacher/games/[id]).
 */

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const makeCode = () =>
  Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

interface CompetitionRules {
  joinCode: string;
  periodicity: Periodicity;
  groupSize: number; // équipes par partie de qualification (2-6)
  advancePerGroup: number; // qualifiés par groupe pour la finale
  seed: number;
}

const rulesOf = (c: { rules: unknown }): CompetitionRules => c.rules as CompetitionRules;

// ---------------------------------------------------------------------------
// Création et inscriptions
// ---------------------------------------------------------------------------

export async function createCompetition(args: {
  organizerId: string;
  organizationId: string;
  name: string;
  periodicity: Periodicity;
  groupSize: number;
  advancePerGroup: number;
}): Promise<{ competitionId: string; joinCode: string }> {
  const { getOrCreateNovaScenarioIdPublic } = await import("./game-creation.service");
  const scenarioId = await getOrCreateNovaScenarioIdPublic();
  const joinCode = makeCode();
  const rules: CompetitionRules = {
    joinCode,
    periodicity: args.periodicity,
    groupSize: Math.min(Math.max(args.groupSize, 2), 6),
    advancePerGroup: Math.min(Math.max(args.advancePerGroup, 1), 4),
    seed: randomInt(1, 2 ** 31),
  };
  const inserted = await db
    .insert(competitions)
    .values({
      organizationId: args.organizationId,
      name: args.name.trim() || "Business Arena Championship",
      status: "registration",
      scenarioId,
      rules,
      joinCode,
      organizerId: args.organizerId,
    })
    .returning({ id: competitions.id });
  return { competitionId: inserted[0]!.id, joinCode };
}

/** Inscription d'un joueur : crée l'équipe (team_label) ou la rejoint. */
export async function joinCompetition(args: {
  code: string;
  userId: string;
  teamLabel: string;
  pseudo?: string;
}): Promise<{ competitionId: string } | { error: string }> {
  const competition = (
    await db.select().from(competitions).where(eq(competitions.joinCode, args.code.trim().toUpperCase()))
  )[0];
  if (!competition) return { error: "Code de concours inconnu." };
  if (competition.status !== "registration")
    return { error: "Les inscriptions de ce concours sont closes." };
  const label = args.teamLabel.trim().slice(0, 40);
  if (!label) return { error: "Donnez un nom à votre équipe." };

  // Fast non-atomic pre-check (safety net, not authoritative)
  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competition.id));
  const existing = entries.find((e) => e.memberUserIds.includes(args.userId));
  if (existing) return { competitionId: competition.id };

  // Atomic join: UPDATE with array_append + WHERE guards
  const updated = await db
    .update(competitionEntries)
    .set({
      memberUserIds: sql`array_append(${competitionEntries.memberUserIds}, ${args.userId}::uuid)`,
    })
    .where(
      and(
        eq(competitionEntries.competitionId, competition.id),
        sql`lower(${competitionEntries.teamLabel}) = lower(${label})`,
        sql`NOT (${args.userId}::uuid = ANY(${competitionEntries.memberUserIds}))`,
        sql`array_length(${competitionEntries.memberUserIds}, 1) < 6`,
      ),
    )
    .returning({ teamLabel: competitionEntries.teamLabel });

  if (updated.length > 0) {
    // Successfully joined existing team
  } else {
    // Determine why UPDATE returned 0 rows
    const sameLabel = entries.find((e) => e.teamLabel.toLowerCase() === label.toLowerCase());
    if (sameLabel) {
      if (sameLabel.memberUserIds.includes(args.userId))
        return { competitionId: competition.id };
      return { error: "Cette équipe est complète (6 joueurs max)." };
    }
    // New team — INSERT with capacity guard
    if (entries.length >= 32) return { error: "Le concours est complet (32 équipes)." };
    try {
      await db.insert(competitionEntries).values({
        competitionId: competition.id,
        teamLabel: label,
        memberUserIds: [args.userId],
        organizationId: competition.organizationId,
        status: "registered",
      });
    } catch (err: unknown) {
      const pg = (err as { cause?: { code?: string } }).cause ?? (err as { code?: string });
      if (pg.code === "23505") {
        // Case-insensitive label collision — retry as join
        const retried = await db
          .update(competitionEntries)
          .set({
            memberUserIds: sql`array_append(${competitionEntries.memberUserIds}, ${args.userId}::uuid)`,
          })
          .where(
            and(
              eq(competitionEntries.competitionId, competition.id),
              sql`lower(${competitionEntries.teamLabel}) = lower(${label})`,
              sql`NOT (${args.userId}::uuid = ANY(${competitionEntries.memberUserIds}))`,
              sql`array_length(${competitionEntries.memberUserIds}, 1) < 6`,
            ),
          )
          .returning({ teamLabel: competitionEntries.teamLabel });
        if (retried.length === 0)
          return { error: "Cette équipe est complète (6 joueurs max)." };
      } else {
        throw err;
      }
    }
  }
  if (args.pseudo?.trim()) {
    await db.update(users).set({ displayName: args.pseudo.trim() }).where(eq(users.id, args.userId));
  }
  return { competitionId: competition.id };
}

// ---------------------------------------------------------------------------
// Phases : qualification → finale → clôture
// ---------------------------------------------------------------------------

async function loadOwnedCompetition(competitionId: string, organizerId: string) {
  const competition = (
    await db.select().from(competitions).where(eq(competitions.id, competitionId))
  )[0];
  if (!competition || competition.organizerId !== organizerId)
    throw new Error("Concours introuvable ou non autorisé");
  return competition;
}

/** Crée une partie de phase et y installe les équipes-entries + leurs joueurs. */
async function createStageGame(args: {
  competition: { organizationId: string | null; organizerId: string };
  stageId: string;
  rules: CompetitionRules;
  entryLabels: string[];
  membersByLabel: Map<string, string[]>;
}): Promise<string> {
  const created = await createGameCore({
    organizationId: args.competition.organizationId!,
    createdBy: args.competition.organizerId,
    periodicity: args.rules.periodicity,
    kind: "class",
    humanTeams: args.entryLabels.map((label) => ({ name: label })),
    botCount: 0,
    mode: "competition",
    competitionStageId: args.stageId,
    // Un championnat se joue au même régime qu'une partie de classe : la
    // question du modèle d'analyse, sans les questions de connaissances. Sans
    // ce réglage explicite, les parties de concours retombaient sur le
    // comportement historique (tout servi) par simple omission.
    quizMode: DEFAULT_QUIZ_MODE,
  });
  const playerValues = created.teams.flatMap((team) =>
    (args.membersByLabel.get(team.name) ?? []).map((userId, i) => ({
      teamId: team.id,
      userId,
      role: i === 0 ? ("captain" as const) : ("member" as const),
    })),
  );
  if (playerValues.length > 0)
    await db.insert(players).values(playerValues).onConflictDoNothing();
  return created.gameId;
}

/** Clôt les inscriptions et lance la phase de qualification (groupes tirés au sort seedé). */
export async function startQualification(args: {
  competitionId: string;
  organizerId: string;
}): Promise<{ groups: number }> {
  const competition = await loadOwnedCompetition(args.competitionId, args.organizerId);
  if (competition.status !== "registration")
    throw new Error("Les qualifications sont déjà lancées");
  const rules = rulesOf(competition);
  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competition.id));
  if (entries.length < 2) throw new Error("Il faut au moins 2 équipes inscrites");

  const stage = await db
    .insert(competitionStages)
    .values({
      competitionId: competition.id,
      index: 1,
      kind: "qualification",
      format: { teamsPerGame: rules.groupSize, advanceCount: rules.advancePerGroup },
      status: "running",
    })
    .returning({ id: competitionStages.id });

  const groups = composeGroups(entries.map((e) => e.teamLabel), rules.groupSize, rules.seed);
  const membersByLabel = new Map(entries.map((e) => [e.teamLabel, e.memberUserIds]));
  for (const group of groups) {
    await createStageGame({
      competition,
      stageId: stage[0]!.id,
      rules,
      entryLabels: group,
      membersByLabel,
    });
  }
  await db
    .update(competitionEntries)
    .set({ status: "active" })
    .where(eq(competitionEntries.competitionId, competition.id));
  await db
    .update(competitions)
    .set({ status: "running" })
    .where(eq(competitions.id, competition.id));
  return { groups: groups.length };
}

/** Classements d'une phase, par partie, exprimés en entries (labels d'équipe). */
async function stageStandings(stageId: string): Promise<GroupStanding[][]> {
  const stageGames = await db
    .select()
    .from(games)
    .where(eq(games.competitionStageId, stageId));
  if (stageGames.length === 0) return [];
  const gameIds = stageGames.map((g) => g.id);
  const allTeams = await db.select().from(teams).where(inArray(teams.gameId, gameIds));
  const allRankings = await db
    .select()
    .from(gameRankings)
    .where(inArray(gameRankings.gameId, gameIds));
  return stageGames.map((game) => {
    const teamRows = allTeams.filter((t) => t.gameId === game.id);
    const rankings = allRankings.filter((r) => r.gameId === game.id);
    return rankings.map((r) => {
      const detail = r.detail as {
        dimensions?: Record<string, number>;
        cumulativeNetIncome?: number;
      };
      return {
        entryId: teamRows.find((t) => t.id === r.teamId)?.name ?? "?",
        bpi: Number(r.bpi),
        financial: detail.dimensions?.["financial"] ?? 0,
        lastTreasury: detail.cumulativeNetIncome ?? 0,
      };
    });
  });
}

/** Lance la finale : qualifie les meilleurs de chaque groupe (doc 04 §3). */
export async function startFinal(args: {
  competitionId: string;
  organizerId: string;
}): Promise<{ finalists: string[] }> {
  const competition = await loadOwnedCompetition(args.competitionId, args.organizerId);
  const rules = rulesOf(competition);
  const stages = await db
    .select()
    .from(competitionStages)
    .where(eq(competitionStages.competitionId, competition.id));
  const qualification = stages.find((s) => s.kind === "qualification");
  if (!qualification || qualification.status !== "running")
    throw new Error("Aucune phase de qualification en cours");

  const stageGames = await db
    .select()
    .from(games)
    .where(eq(games.competitionStageId, qualification.id));
  if (stageGames.some((g) => g.status !== "finished"))
    throw new Error("Toutes les parties de qualification doivent être terminées");

  const standings = await stageStandings(qualification.id);
  const targetCount = Math.min(8, Math.max(2, standings.length * rules.advancePerGroup));
  const finalists = qualifiers(standings, rules.advancePerGroup, targetCount);
  if (finalists.length < 2) throw new Error("Pas assez de qualifiés pour une finale");

  const finalStage = await db
    .insert(competitionStages)
    .values({
      competitionId: competition.id,
      index: 2,
      kind: "final",
      format: { teamsPerGame: finalists.length, advanceCount: 1 },
      status: "running",
    })
    .returning({ id: competitionStages.id });

  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competition.id));
  const membersByLabel = new Map(entries.map((e) => [e.teamLabel, e.memberUserIds]));
  await createStageGame({
    competition,
    stageId: finalStage[0]!.id,
    rules,
    entryLabels: finalists,
    membersByLabel,
  });

  await db
    .update(competitionStages)
    .set({ status: "finished" })
    .where(eq(competitionStages.id, qualification.id));
  for (const entry of entries) {
    await db
      .update(competitionEntries)
      .set({ status: finalists.includes(entry.teamLabel) ? "active" : "eliminated" })
      .where(
        and(
          eq(competitionEntries.competitionId, competition.id),
          eq(competitionEntries.teamLabel, entry.teamLabel),
        ),
      );
  }
  return { finalists };
}

/** Clôt le concours une fois la finale terminée : podium et vainqueur. */
export async function finishCompetition(args: {
  competitionId: string;
  organizerId: string;
}): Promise<{ podium: string[] }> {
  const competition = await loadOwnedCompetition(args.competitionId, args.organizerId);
  const stages = await db
    .select()
    .from(competitionStages)
    .where(eq(competitionStages.competitionId, competition.id));
  const finalStage = stages.find((s) => s.kind === "final");
  if (!finalStage) throw new Error("La finale n'a pas été lancée");
  const finalGames = await db
    .select()
    .from(games)
    .where(eq(games.competitionStageId, finalStage.id));
  if (finalGames.some((g) => g.status !== "finished"))
    throw new Error("La finale n'est pas terminée");

  const standings = await stageStandings(finalStage.id);
  const ranking = podium(standings[0] ?? []);
  const winner = ranking[0];
  if (winner) {
    await db
      .update(competitionEntries)
      .set({ status: "winner" })
      .where(
        and(
          eq(competitionEntries.competitionId, competition.id),
          eq(competitionEntries.teamLabel, winner),
        ),
      );
  }
  await db
    .update(competitionStages)
    .set({ status: "finished" })
    .where(eq(competitionStages.id, finalStage.id));
  await db
    .update(competitions)
    .set({ status: "finished" })
    .where(eq(competitions.id, competition.id));
  return { podium: ranking };
}

// ---------------------------------------------------------------------------
// Lectures
// ---------------------------------------------------------------------------

export interface CompetitionView {
  competitionId: string;
  name: string;
  status: string;
  joinCode: string;
  organizerId: string;
  entries: { teamLabel: string; members: number; status: string }[];
  stages: {
    index: number;
    kind: string;
    status: string;
    games: {
      gameId: string;
      status: string;
      currentRound: number;
      roundsCount: number;
      standings: { entryId: string; bpi: number }[];
    }[];
  }[];
  podium: string[] | null;
}

export async function getCompetitionView(competitionId: string): Promise<CompetitionView | null> {
  const competition = (
    await db.select().from(competitions).where(eq(competitions.id, competitionId))
  )[0];
  if (!competition) return null;
  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competitionId));
  const stages = (
    await db
      .select()
      .from(competitionStages)
      .where(eq(competitionStages.competitionId, competitionId))
  ).sort((a, b) => a.index - b.index);

  const stageViews = [];
  for (const stage of stages) {
    const stageGames = await db
      .select()
      .from(games)
      .where(eq(games.competitionStageId, stage.id));
    const standings = await stageStandings(stage.id);
    stageViews.push({
      index: stage.index,
      kind: stage.kind,
      status: stage.status,
      games: stageGames.map((g, i) => ({
        gameId: g.id,
        status: g.status,
        currentRound: g.currentRound,
        roundsCount: (g.scenarioSnapshot as { roundsCount: number }).roundsCount,
        standings: (standings[i] ?? [])
          .sort((a, b) => b.bpi - a.bpi)
          .map((s) => ({ entryId: s.entryId, bpi: s.bpi })),
      })),
    });
  }

  let finalPodium: string[] | null = null;
  if (competition.status === "finished") {
    const finalStage = stages.find((s) => s.kind === "final");
    if (finalStage) {
      const standings = await stageStandings(finalStage.id);
      finalPodium = podium(standings[0] ?? []);
    }
  }

  return {
    competitionId,
    name: competition.name,
    status: competition.status,
    joinCode: competition.joinCode,
    organizerId: competition.organizerId,
    entries: entries.map((e) => ({
      teamLabel: e.teamLabel,
      members: e.memberUserIds.length,
      status: e.status,
    })),
    stages: stageViews,
    podium: finalPodium,
  };
}

/** Concours d'un organisateur (liste, plus récents d'abord). */
export async function getOrganizerCompetitions(organizerId: string) {
  const rows = await db
    .select()
    .from(competitions)
    .where(eq(competitions.organizerId, organizerId))
    .orderBy(desc(competitions.createdAt));
  if (rows.length === 0) return [];
  const allEntries = await db
    .select({ competitionId: competitionEntries.competitionId })
    .from(competitionEntries)
    .where(inArray(competitionEntries.competitionId, rows.map((c) => c.id)));
  const countByComp = new Map<string, number>();
  for (const e of allEntries) countByComp.set(e.competitionId, (countByComp.get(e.competitionId) ?? 0) + 1);
  return rows.map((c) => ({
    competitionId: c.id,
    name: c.name,
    status: c.status,
    joinCode: c.joinCode,
    entriesCount: countByComp.get(c.id) ?? 0,
    createdAt: c.createdAt,
  }));
}

/** Le concours auquel participe un joueur, et sa partie en cours s'il y en a une. */
export async function getPlayerCompetition(
  competitionId: string,
  userId: string,
): Promise<{ view: CompetitionView; myGameId: string | null; myTeamLabel: string | null } | null> {
  const view = await getCompetitionView(competitionId);
  if (!view) return null;
  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competitionId));
  const mine = entries.find((e) => e.memberUserIds.includes(userId));
  const isOrganizer = view.organizerId === userId;
  if (!mine && !isOrganizer) return null;

  let myGameId: string | null = null;
  if (mine) {
    const competitionGameIds = new Set(
      view.stages.flatMap((s) => s.games.map((g) => g.gameId)),
    );
    const membership = await db.select().from(players).where(eq(players.userId, userId));
    if (membership.length > 0) {
      const teamRows = await db
        .select()
        .from(teams)
        .where(inArray(teams.id, membership.map((m) => m.teamId)));
      const myGameIds = teamRows
        .map((t) => t.gameId)
        .filter((gid) => competitionGameIds.has(gid));
      if (myGameIds.length > 0) {
        const running = view.stages
          .flatMap((s) => s.games)
          .filter((g) => myGameIds.includes(g.gameId))
          .sort((a, b) => (a.status === "running" ? -1 : 1) - (b.status === "running" ? -1 : 1));
        myGameId = running[0]?.gameId ?? null;
      }
    }
  }
  return { view, myGameId, myTeamLabel: mine?.teamLabel ?? null };
}
