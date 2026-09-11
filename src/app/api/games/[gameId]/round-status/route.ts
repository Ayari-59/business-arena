import { NextResponse } from "next/server";
import { getGuestUserId } from "@/lib/guest";
import { db } from "@/db";
import { games, rounds, players, teams } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const userId = await getGuestUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { gameId } = await params;

  // Statut de partie + statut du tour courant en UNE requête : jointure
  // games ⋈ rounds sur l'index courant (au lieu d'un select games puis un
  // select rounds séparé). Le pilote neon-http facture chaque requête comme un
  // aller-retour HTTPS, et cet endpoint est sondé par chaque élève à intervalle
  // régulier.
  const row = (
    await db
      .select({
        currentRound: games.currentRound,
        gameStatus: games.status,
        roundStatus: rounds.status,
      })
      .from(games)
      .leftJoin(rounds, and(eq(rounds.gameId, games.id), eq(rounds.index, games.currentRound)))
      .where(eq(games.id, gameId))
  )[0];
  if (!row) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });

  // Auth en UNE requête : l'utilisateur doit être joueur d'une équipe HUMAINE de
  // cette partie (jointure players ⋈ teams), au lieu d'un select teams puis un
  // select players. Aucune équipe humaine correspondante ⇒ accès refusé.
  const membership = (
    await db
      .select({ teamId: players.teamId })
      .from(players)
      .innerJoin(teams, eq(players.teamId, teams.id))
      .where(
        and(eq(teams.gameId, gameId), eq(teams.controller, "human"), eq(players.userId, userId)),
      )
  )[0];
  if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  return NextResponse.json(
    {
      currentRound: row.currentRound,
      roundStatus: row.roundStatus ?? "pending",
      gameStatus: row.gameStatus,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
