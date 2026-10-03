import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { games, players, teams } from "@/db/schema";

/**
 * LES PARTIES SOLO QUE CE JOUEUR N'A PAS FINIES.
 *
 * Tout est déjà en base : fermer l'onglet ne perd rien. Ce qui manquait, c'est
 * de le DIRE — un joueur qui revenait sur l'accueil ou sur /jouer se voyait
 * proposer de « lancer sa première partie », et l'ancienne restait là sans
 * qu'il la voie. Cette liste alimente le bouton « Reprendre ma partie ».
 *
 * Seules les parties solo comptent ici : une partie de classe se retrouve par
 * son code de partie ou son code de reprise, et c'est l'enseignant qui la
 * range. Une partie rangée ou terminée n'est pas « en cours ».
 */
export interface PartieEnCours {
  gameId: string;
  /** Nom de l'entreprise que dirige le joueur. */
  entreprise: string;
  tour: number;
  tours: number;
}

/** Au-delà, la liste cesse d'aider : le profil montre le reste. */
const MAX_PARTIES_PROPOSEES = 3;

export async function partiesSoloEnCours(userId: string): Promise<PartieEnCours[]> {
  const rows = await db
    .select({
      gameId: games.id,
      entreprise: teams.name,
      tour: games.currentRound,
      snapshot: games.scenarioSnapshot,
    })
    .from(players)
    .innerJoin(teams, eq(teams.id, players.teamId))
    .innerJoin(games, eq(games.id, teams.gameId))
    .where(
      and(
        eq(players.userId, userId),
        eq(teams.controller, "human"),
        // `kind` n'est pas une colonne : il vit dans le profil de difficulté.
        // Une partie sans `kind` est une partie solo d'avant (voir le profil).
        sql`coalesce(${games.difficultyProfile}->>'kind', 'solo') = 'solo'`,
        ne(games.status, "finished"),
        ne(games.status, "archived"),
        isNull(games.archivedAt),
        // Une partie jamais démarrée (tour 0) n'a rien à reprendre.
        sql`${games.currentRound} >= 1`,
      ),
    )
    .orderBy(desc(games.updatedAt))
    .limit(MAX_PARTIES_PROPOSEES);

  return rows.map((r) => ({
    gameId: r.gameId,
    entreprise: r.entreprise,
    tour: r.tour,
    tours: (r.snapshot as { roundsCount: number }).roundsCount,
  }));
}
