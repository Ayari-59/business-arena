import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { games, players, teams } from "@/db/schema";
import { cohorteDe } from "@/services/cohortes.service";

/**
 * « VOS PARTIES ET COHORTES » : CE QUE L'ÉTUDIANT A DÉJÀ REJOINT.
 *
 * C'est le gain de la connexion par l'établissement : l'identité de joueur est retrouvée
 * sur n'importe quel appareil, et avec elle les parties où l'étudiant a une équipe et la
 * cohorte qu'il suit. Une partie rangée par l'enseignant n'apparaît plus ; une partie
 * terminée reste, pour ses résultats. Le nom que l'enseignant donne à sa partie n'est
 * pas montré (il ne sert qu'à lui) : l'étudiant reconnaît son entreprise.
 */

export interface PartieRejointe {
  gameId: string;
  entreprise: string;
  classe: boolean;
  tour: number;
  tours: number;
  terminee: boolean;
}

const MAX = 20;

export async function partiesRejointes(userId: string): Promise<PartieRejointe[]> {
  const lignes = await db
    .select({
      gameId: games.id,
      entreprise: teams.name,
      tour: games.currentRound,
      statut: games.status,
      profil: games.difficultyProfile,
      snapshot: games.scenarioSnapshot,
    })
    .from(players)
    .innerJoin(teams, eq(teams.id, players.teamId))
    .innerJoin(games, eq(games.id, teams.gameId))
    .where(and(eq(players.userId, userId), ne(games.status, "archived"), isNull(games.archivedAt)))
    .orderBy(desc(games.updatedAt))
    .limit(MAX);
  return lignes.map((l) => ({
    gameId: l.gameId,
    entreprise: l.entreprise,
    classe: (l.profil as { kind?: string } | null)?.kind === "class",
    tour: l.tour,
    tours: (l.snapshot as { roundsCount?: number }).roundsCount ?? 0,
    terminee: l.statut === "finished",
  }));
}

export async function partiesEtCohorte(userId: string) {
  const [parties, cohorte] = await Promise.all([partiesRejointes(userId), cohorteDe(userId)]);
  return { parties, cohorte };
}
