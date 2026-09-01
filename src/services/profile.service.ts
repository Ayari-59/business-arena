import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  concepts,
  gameRankings,
  games,
  learningProgress,
  playerSkills,
  players,
  teams,
  users,
} from "@/db/schema";
import { conceptByCode, type SkillAxis } from "@/config/pedagogy/concepts";

/**
 * Profil joueur (étape 11, §28) : compétences par axe, maîtrise des concepts,
 * historique des parties. Évolue à chaque débriefing de tour (doc 03 §6).
 */

export interface PlayerProfile {
  displayName: string;
  skills: { axis: SkillAxis; value: number }[];
  concepts: { code: string; name: string; domain: string; mastery: number }[];
  games: {
    gameId: string;
    kind: string;
    status: string;
    teamName: string;
    roundDays: number;
    currentRound: number;
    roundsCount: number;
    rank: number | null;
    bpi: number | null;
    createdAt: Date;
  }[];
}

export async function getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  const [user, skillRows, progressRows, memberships] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).then((r) => r[0]),
    db.select().from(playerSkills).where(eq(playerSkills.userId, userId)),
    db
      .select({ mastery: learningProgress.mastery, code: concepts.code, name: concepts.name, domain: concepts.domain })
      .from(learningProgress)
      .innerJoin(concepts, eq(concepts.id, learningProgress.conceptId))
      .where(eq(learningProgress.userId, userId)),
    db.select().from(players).where(eq(players.userId, userId)),
  ]);
  if (!user) return null;

  const teamRows = memberships.length
    ? await db.select().from(teams).where(inArray(teams.id, memberships.map((m) => m.teamId)))
    : [];
  const teamIds = teamRows.map((t) => t.id);
  const [gameRows, rankingRows] = await Promise.all([
    teamRows.length
      ? db
          .select()
          .from(games)
          .where(inArray(games.id, teamRows.map((t) => t.gameId)))
          .orderBy(desc(games.createdAt))
      : Promise.resolve([]),
    teamIds.length
      ? db.select().from(gameRankings).where(and(
          inArray(gameRankings.gameId, teamRows.map((t) => t.gameId)),
          inArray(gameRankings.teamId, teamIds),
        ))
      : Promise.resolve([]),
  ]);

  return {
    displayName: user.displayName,
    skills: skillRows
      .map((s) => ({ axis: s.axis as SkillAxis, value: Number(s.value) }))
      .sort((a, b) => b.value - a.value),
    concepts: progressRows
      .map((p) => ({
        code: p.code,
        name: p.name,
        domain: conceptByCode.get(p.code)?.domain ?? p.domain,
        mastery: Number(p.mastery),
      }))
      .sort((a, b) => b.mastery - a.mastery),
    games: gameRows.map((g) => {
      const team = teamRows.find((t) => t.gameId === g.id)!;
      const ranking = rankingRows.find((r) => r.gameId === g.id && r.teamId === team.id);
      const snapshot = g.scenarioSnapshot as { roundDays: number; roundsCount: number };
      return {
        gameId: g.id,
        kind: (g.difficultyProfile as { kind?: string }).kind ?? "solo",
        status: g.status,
        teamName: team.name,
        roundDays: snapshot.roundDays,
        currentRound: g.currentRound,
        roundsCount: snapshot.roundsCount,
        rank: ranking?.rank ?? null,
        bpi: ranking ? Number(ranking.bpi) : null,
        createdAt: g.createdAt,
      };
    }),
  };
}
