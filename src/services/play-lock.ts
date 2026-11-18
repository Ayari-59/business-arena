import { eq } from "drizzle-orm";
import { db } from "@/db";
import { competitionStages } from "@/db/schema";
import { computePlayWindow, type PlayWindow } from "@/lib/play-window";
import { etatDuLancement, messageDAttente } from "@/lib/lancement-du-tour";

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
  /**
   * Le profil et l'essai de la partie : le marqueur du lancement des tours y vit
   * (`lib/lancement-du-tour.ts`). Absents : rien à attendre, comme avant.
   */
  difficultyProfile?: unknown;
  essai?: unknown;
}

export interface RoundWindow {
  opensAt: Date | null;
  deadline: Date | null;
  /** L'identité et le statut du tour, pour savoir s'il attend son lancement. */
  id?: string;
  index?: number;
  status?: string;
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
  // LE TOUR LANCÉ PAR L'ENSEIGNANT s'ouvre à son lancement, même si le planning
  // portait une date plus tardive : il l'a ouvert plus tôt.
  const lancement =
    round && round.id !== undefined && round.index !== undefined && round.status !== undefined
      ? etatDuLancement({
          profil: game.difficultyProfile,
          essai: game.essai,
          tour: { id: round.id, index: round.index, status: round.status, opensAt: round.opensAt },
          now,
        })
      : null;
  return computePlayWindow({
    now,
    gameOpensAt: game.opensAt,
    gameClosesAt: game.closesAt,
    roundOpensAt: lancement?.lanceLe ?? round?.opensAt ?? null,
    attenteDuLancement:
      lancement?.enAttente && !lancement.ouvertureAuto && round?.index !== undefined
        ? { tour: round.index }
        : null,
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
  if (w.attenteDuLancement) return messageDAttente(w.attenteDuLancement.tour);
  if (w.state === "before") {
    return w.opensAt ? `Ce tour ouvre le ${dateFr(w.opensAt)}.` : "Ce tour n'est pas encore ouvert.";
  }
  return w.closesAt ? `Ce tour est clôturé depuis le ${dateFr(w.closesAt)}.` : "Ce tour est clôturé.";
}

/**
 * LA SITUATION D'UN TOUR QUI ATTEND SON LANCEMENT (`lib/lancement-du-tour.ts`) : y
 * répondre est refusé, avec les mots de la validation. Seule cette attente compte ici :
 * le planning et les autres fenêtres ne changent rien aux réponses aux situations,
 * comme avant. `null` : rien à refuser.
 */
export async function refusDuTourEnAttente(
  game: GameWindow,
  round: Required<Pick<RoundWindow, "id" | "index" | "status">> & RoundWindow,
  now: Date = new Date(),
): Promise<string | null> {
  const etat = etatDuLancement({
    profil: game.difficultyProfile,
    essai: game.essai,
    tour: { id: round.id, index: round.index, status: round.status, opensAt: round.opensAt },
    now,
  });
  if (!etat.enAttente) return null;
  return playLockMessage(await playWindowFor(game, round, now)) ?? messageDAttente(round.index);
}

/** Lève une erreur (message joueur) si l'on est hors de la fenêtre de jeu. */
export async function assertPlayable(game: GameWindow, round: RoundWindow | null): Promise<void> {
  const message = playLockMessage(await playWindowFor(game, round));
  if (message) throw new Error(message);
}
