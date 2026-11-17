import { eq } from "drizzle-orm";
import { db } from "@/db";
import { games } from "@/db/schema";
import { closeCurrentRound, lancerLeTour } from "@/services/game.service";

/**
 * CLORE, PUIS LANCER LE TOUR SUIVANT, comme l'enseignant après le débrief.
 *
 * Une partie de classe neuve n'ouvre plus d'elle-même le tour suivant
 * (`lib/lancement-du-tour.ts`) : les tests qui jouent plusieurs tours d'affilée, et
 * qui vérifient autre chose que ce lancement, passent par ce geste. Pour une partie qui
 * enchaîne (solo, concours, essai, partie d'avant), le lancement ne fait rien.
 */
export async function cloreEtLancer(
  args: Parameters<typeof closeCurrentRound>[0],
): ReturnType<typeof closeCurrentRound> {
  const resultat = await closeCurrentRound(args);
  if (!resultat.alreadyClosed && !resultat.finished) {
    const [g] = await db.select().from(games).where(eq(games.id, args.gameId));
    if (g && g.status === "running" && !g.archivedAt) {
      await lancerLeTour({ gameId: args.gameId, teacherId: args.teacherId, expectedRound: g.currentRound });
    }
  }
  return resultat;
}
