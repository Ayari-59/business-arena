import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  concepts,
  gameRankings,
  games,
  learningProgress,
  playerSkills,
  players,
  rounds,
  teams,
  users,
} from "@/db/schema";
import { conceptByCode, type SkillAxis } from "@/config/pedagogy/concepts";
import { classementOuvert } from "@/config/rideau-classement";

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
  const [gameRows, rankingRows, roundRows] = await Promise.all([
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
    // Le rideau sur le classement se tire AUSSI ici. « Mes parties » affichait
    // « IPG 54 · #3 » pour une partie de classe dont l'enseignant n'avait rien
    // révélé : il suffisait d'ouvrir son profil pour lire son rang.
    teamRows.length
      ? db
          .select()
          .from(rounds)
          .where(inArray(rounds.gameId, teamRows.map((t) => t.gameId)))
      : Promise.resolve([]),
  ]);

  /** Révélation du dernier tour CLOS de chaque partie. */
  const revelationParPartie = new Map<string, Date | null>();
  for (const r of roundRows) {
    if (r.status !== "resolved") continue;
    const connu = roundRows
      .filter((x) => x.gameId === r.gameId && x.status === "resolved")
      .sort((a3, b3) => b3.index - a3.index)[0];
    if (connu) revelationParPartie.set(r.gameId, connu.rankingRevealedAt);
  }

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
        // L'IPG est à l'équipe : il dit sa progression, pas sa place. Le RANG
        // attend que l'animateur ouvre le rideau.
        rank: classementOuvert({
          kind: (g.difficultyProfile as { kind?: string }).kind,
          revelationDuDernierTourClos: revelationParPartie.get(g.id),
        })
          ? (ranking?.rank ?? null)
          : null,
        bpi: ranking ? Number(ranking.bpi) : null,
        createdAt: g.createdAt,
      };
    }),
  };
}

/**
 * LE RECORD PERSONNEL : rejouer ne se comparait à rien.
 *
 * L'écran de fin propose « Rejouer NOVA », mais la deuxième partie ne savait
 * pas qu'il y en avait eu une première. Or les parties passées sont déjà là,
 * avec leur IPG — la mesure que le dépôt s'est donnée, et la seule qui se
 * compare d'une partie à l'autre : un résultat cumulé dépend du nombre de
 * tours et du niveau, l'IPG est ramené à cent.
 *
 * TROIS BORNES, et elles font tout le sens de ce chiffre :
 *  · le MÊME métier, parce qu'un hôtel et un atelier ne se comparent pas ;
 *  · les parties SOLO, parce qu'en classe l'IPG est révélé par l'enseignant et
 *    qu'un record ne doit pas contourner cette décision ;
 *  · soi-même, jamais les autres. C'est la seule comparaison que le dépôt
 *    s'autorise en continu.
 */
export async function recordPersonnel(args: {
  userId: string;
  /** Le code du scénario joué, tel que le snapshot le porte. */
  scenarioCode: string;
  /** La partie en cours, exclue du record : elle est le candidat, pas le tenant. */
  saufPartie: string;
}): Promise<{ bpi: number; quand: Date } | null> {
  const lignes = await db
    .select({ bpi: gameRankings.bpi, quand: games.createdAt })
    .from(gameRankings)
    .innerJoin(teams, eq(teams.id, gameRankings.teamId))
    .innerJoin(players, eq(players.teamId, teams.id))
    .innerJoin(games, eq(games.id, gameRankings.gameId))
    .where(
      and(
        eq(players.userId, args.userId),
        eq(games.status, "finished"),
        sql`${games.scenarioSnapshot}->>'code' = ${args.scenarioCode}`,
        sql`${games.difficultyProfile}->>'kind' = 'solo'`,
        ne(games.id, args.saufPartie),
      ),
    );
  if (lignes.length === 0) return null;
  return lignes
    .map((l) => ({ bpi: Number(l.bpi), quand: l.quand }))
    .reduce((meilleur, l) => (l.bpi > meilleur.bpi ? l : meilleur));
}
