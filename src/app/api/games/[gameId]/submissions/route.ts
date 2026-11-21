import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { games, rounds, teams, decisions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { etatDuLancement, statutSonde } from "@/lib/lancement-du-tour";
import { tourDEssaiALaUne } from "@/services/podium-de-l-essai.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { gameId } = await params;
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
  if (game.createdBy !== session.userId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const humanTeams = teamRows.filter((t) => t.controller === "human");

  // Les tours de la partie, en une requête : le tour courant, et le dernier
  // classement révélé (le mur et le pilotage le suivent aussi).
  const toursDeLaPartie = await db
    .select({
      id: rounds.id,
      index: rounds.index,
      status: rounds.status,
      opensAt: rounds.opensAt,
      revele: rounds.rankingRevealedAt,
    })
    .from(rounds)
    .where(eq(rounds.gameId, gameId));
  const currentRoundRow = toursDeLaPartie.find((t) => t.index === game.currentRound);
  const dernierTourReveleDeLaPartie = toursDeLaPartie
    .filter((t) => t.revele !== null)
    .reduce<number | null>((max, t) => (max === null || t.index > max ? t.index : max), null);
  // LE TOUR D'ESSAI ARCHIVÉ (services/podium-de-l-essai.service.ts) : tant que la vraie
  // partie n'a clos aucun tour, la révélation de l'essai compte pour 0, et la page qui
  // sonde se recharge pour jouer son podium.
  const essaiALaUne =
    dernierTourReveleDeLaPartie === null
      ? await tourDEssaiALaUne({
          gameId,
          essai: game.essai,
          vraiTourClos: toursDeLaPartie.some((t) => t.status === "resolved"),
        })
      : null;
  const dernierTourRevele = essaiALaUne?.revele ? 0 : dernierTourReveleDeLaPartie;

  let submittedCount = 0;
  // LA DERNIÈRE DÉCISION ENVOYÉE : en classe, une équipe peut valider de
  // nouveau. Le compte ne bouge pas, ses décisions si : le pilotage qui les
  // montre doit se recharger quand cette heure change.
  let derniereDecision: string | null = null;
  // LE DERNIER BROUILLON MODIFIÉ (`services/brouillon-equipe.service.ts`) : une
  // équipe qui enregistre ne change ni le compte ni la dernière validation, mais
  // le pilotage montre son brouillon. Seule son heure sort d'ici : ni la saisie,
  // ni le nom de son auteur.
  let dernierBrouillon: string | null = null;
  if (currentRoundRow) {
    const submitted = await db
      .select({
        teamId: decisions.teamId,
        status: decisions.status,
        quand: decisions.validatedAt,
        modifieLe: decisions.modifieLe,
      })
      .from(decisions)
      .where(eq(decisions.roundId, currentRoundRow.id));
    submittedCount = humanTeams.filter((t) =>
      submitted.some((d) => d.teamId === t.id && d.status === "validated"),
    ).length;
    derniereDecision = submitted.reduce<string | null>((max, d) => {
      const iso = d.quand ? d.quand.toISOString() : null;
      return iso !== null && (max === null || iso > max) ? iso : max;
    }, null);
    dernierBrouillon = submitted.reduce<string | null>((max, d) => {
      const iso = d.status === "draft" && d.modifieLe ? d.modifieLe.toISOString() : null;
      return iso !== null && (max === null || iso > max) ? iso : max;
    }, null);
  }

  return NextResponse.json(
    {
      currentRound: game.currentRound,
      // « attente » tant que le tour attend son lancement (`lib/lancement-du-tour.ts`) :
      // le pilotage et le mur se rechargent quand il s'ouvre, au clic ou à sa date.
      roundStatus: statutSonde(
        currentRoundRow?.status ?? "pending",
        etatDuLancement({
          profil: game.difficultyProfile,
          essai: game.essai,
          tour: currentRoundRow,
          now: new Date(),
        }),
      ),
      submittedCount,
      totalHumanTeams: humanTeams.length,
      dernierTourRevele,
      derniereDecision,
      dernierBrouillon,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
