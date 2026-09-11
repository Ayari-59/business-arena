import { eq } from "drizzle-orm";
import { db } from "@/db";
import { competitionStages } from "@/db/schema";
import { computePlayWindow, type PlayWindow } from "@/lib/play-window";

/**
 * Le verrou temporel, côté service : réunit les fenêtres (partie + tour +
 * étape de concours) et dit si l'on peut jouer maintenant. La logique de dates
 * est pure (lib/play-window) ; ici on ne fait que charger l'étape si besoin et
 * traduire l'état en message.
 *
 * Une partie sans aucune fenêtre (cas du solo libre, ou d'une partie de classe
 * dont l'enseignant n'a rien planifié) est toujours jouable : l'exemption est
 * donc automatique, sans traitement particulier.
 */

export interface GameWindow {
  opensAt: Date | null;
  closesAt: Date | null;
  competitionStageId: string | null;
}

export interface RoundWindow {
  opensAt: Date | null;
  deadline: Date | null;
}

export async function playWindowFor(
  game: GameWindow,
  round: RoundWindow | null,
  now: Date = new Date(),
): Promise<PlayWindow> {
  let stageStartsAt: Date | null = null;
  let stageEndsAt: Date | null = null;
  if (game.competitionStageId) {
    const stage = (
      await db
        .select({ startsAt: competitionStages.startsAt, endsAt: competitionStages.endsAt })
        .from(competitionStages)
        .where(eq(competitionStages.id, game.competitionStageId))
    )[0];
    stageStartsAt = stage?.startsAt ?? null;
    stageEndsAt = stage?.endsAt ?? null;
  }
  return computePlayWindow({
    now,
    gameOpensAt: game.opensAt,
    gameClosesAt: game.closesAt,
    roundOpensAt: round?.opensAt ?? null,
    roundDeadline: round?.deadline ?? null,
    stageStartsAt,
    stageEndsAt,
  });
}

const dateFr = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);

export function playLockMessage(w: PlayWindow): string | null {
  if (w.playable) return null;
  if (w.state === "before") {
    return w.opensAt ? `Ce tour ouvre le ${dateFr(w.opensAt)}.` : "Ce tour n'est pas encore ouvert.";
  }
  return w.closesAt ? `Ce tour est clôturé depuis le ${dateFr(w.closesAt)}.` : "Ce tour est clôturé.";
}

/** Lève une erreur (message joueur) si l'on est hors de la fenêtre de jeu. */
export async function assertPlayable(game: GameWindow, round: RoundWindow | null): Promise<void> {
  const message = playLockMessage(await playWindowFor(game, round));
  if (message) throw new Error(message);
}
