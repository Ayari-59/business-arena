import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { gameRankings, games, players, rounds, teams } from "@/db/schema";
import { essaiArchiveALaUne, lireLEssai } from "@/config/tour-d-essai";
import { teamDisplayName } from "@/config/nom-equipe";
import type { MarcheDuPodium } from "@/components/podium";
import { setRankingRevealed } from "@/services/game.service";

/**
 * LE PODIUM DU TOUR D'ESSAI, RELU DANS SON ARCHIVE.
 *
 * Pendant que l'essai se joue et qu'il attend la vraie partie (« termine »), son
 * classement est celui de la partie : l'arène et le mur le lisent comme celui d'un
 * tour normal, sous le même rideau. À la bascule, il part dans l'archive avec le
 * reste de l'essai (services/tour-d-essai.service.ts), et quand la vraie partie
 * commence d'elle-même à la clôture de l'essai, personne n'a eu le temps de le voir.
 *
 * Ce module relit donc l'archive, comme « Revoir le tour d'essai » : son dernier tour
 * clos, sa révélation et son classement, tant que la vraie partie n'a clos aucun tour
 * (`essaiArchiveALaUne`). Il ne déplace rien et n'écrit qu'une chose, la révélation du
 * classement de l'essai par l'animateur. Rien de ce qu'il lit ne compte : ni au
 * classement, ni au bilan, ni aux exports, ni aux notes.
 */

/** Le dernier tour d'essai clos, dans l'archive de la partie. */
export interface TourDEssaiArchive {
  archiveId: string;
  tour: number;
  revele: boolean;
}

/** L'archive de la partie et son dernier tour clos ; null sans archive ou sans tour clos. */
async function dernierTourDeLArchive(gameId: string): Promise<TourDEssaiArchive | null> {
  const [archive] = await db.select({ id: games.id }).from(games).where(eq(games.essaiDe, gameId));
  if (!archive) return null;
  const [tour] = await db
    .select({ index: rounds.index, revele: rounds.rankingRevealedAt })
    .from(rounds)
    .where(and(eq(rounds.gameId, archive.id), eq(rounds.status, "resolved")))
    .orderBy(desc(rounds.index))
    .limit(1);
  if (!tour) return null;
  return { archiveId: archive.id, tour: tour.index, revele: tour.revele !== null };
}

/**
 * L'essai archivé à la une : la vraie partie a commencé et n'a clos aucun tour. Null
 * sinon, ou si l'essai n'a clos aucun tour avant la bascule.
 */
export async function tourDEssaiALaUne(args: {
  gameId: string;
  essai: unknown;
  vraiTourClos: boolean;
}): Promise<TourDEssaiArchive | null> {
  if (!essaiArchiveALaUne({ essai: lireLEssai(args.essai), vraiTourClos: args.vraiTourClos })) return null;
  return dernierTourDeLArchive(args.gameId);
}

/**
 * Ce que l'élève voit du podium de l'essai archivé. LE RIDEAU : tant que l'animateur
 * n'a pas révélé le classement de l'essai, aucune marche n'est envoyée, pas même un
 * rang ; l'élève lit seulement que l'enseignant le révélera.
 */
export async function podiumDeLEssaiPourLEleve(args: {
  gameId: string;
  userId: string;
  essai: unknown;
  vraiTourClos: boolean;
}): Promise<{ revele: boolean; marches: MarcheDuPodium[] } | null> {
  const tour = await tourDEssaiALaUne(args);
  if (!tour) return null;
  if (!tour.revele) return { revele: false, marches: [] };
  const [moi] = await db
    .select({ nom: teams.name })
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .where(and(eq(teams.gameId, args.gameId), eq(players.userId, args.userId)));
  const classement = await db
    .select({ nom: teams.name, rang: gameRankings.rank, ipg: gameRankings.bpi })
    .from(gameRankings)
    .innerJoin(teams, eq(gameRankings.teamId, teams.id))
    .where(eq(gameRankings.gameId, tour.archiveId));
  return {
    revele: true,
    marches: classement
      .map((c) => ({
        nom: teamDisplayName(c.nom),
        rang: c.rang,
        // Les équipes de l'archive sont les copies de celles de la partie, sous le même nom.
        moi: moi !== undefined && c.nom === moi.nom,
        ipg: Number(c.ipg),
      }))
      .sort((a, b) => a.rang - b.rang),
  };
}

/** L'erreur d'une révélation impossible : le message est fait pour l'écran. */
export class RevelationDeLEssaiImpossible extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RevelationDeLEssaiImpossible";
  }
}

/**
 * « RÉVÉLER LE CLASSEMENT DE L'ESSAI », depuis le pilotage, quand l'essai est déjà dans
 * son archive : la vraie partie a commencé d'elle-même à la clôture de l'essai, ou
 * l'animateur l'a lancée sans avoir révélé l'essai. Le geste est celui d'un tour
 * normal, posé sur le dernier tour clos de l'archive (`setRankingRevealed`, qui vérifie
 * que l'archive est bien à cet animateur).
 */
export async function revelerLeClassementDeLEssai(args: {
  gameId: string;
  teacherId: string;
}): Promise<void> {
  const [game] = await db
    .select({ createdBy: games.createdBy, essai: games.essai })
    .from(games)
    .where(eq(games.id, args.gameId));
  if (!game || game.createdBy !== args.teacherId) throw new Error("Partie introuvable");
  const [vrai] = await db
    .select({ index: rounds.index })
    .from(rounds)
    .where(and(eq(rounds.gameId, args.gameId), eq(rounds.status, "resolved")))
    .limit(1);
  const tour = await tourDEssaiALaUne({ gameId: args.gameId, essai: game.essai, vraiTourClos: vrai !== undefined });
  if (!tour) {
    throw new RevelationDeLEssaiImpossible(
      "Le classement de l'essai ne se révèle plus ici : la vraie partie a déjà un tour clos.",
    );
  }
  await setRankingRevealed({
    gameId: tour.archiveId,
    teacherId: args.teacherId,
    roundIndex: tour.tour,
    revealed: true,
  });
}
