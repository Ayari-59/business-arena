import { NextResponse } from "next/server";
import { getGuestUserId } from "@/lib/guest";
import { db } from "@/db";
import { games, rounds, players, teams } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const userId = await getGuestUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { gameId } = await params;
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });

  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const humanIds = teamRows.filter((t) => t.controller === "human").map((t) => t.id);
  if (humanIds.length === 0) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const membership = (
    await db
      .select()
      .from(players)
      .where(and(inArray(players.teamId, humanIds), eq(players.userId, userId)))
  )[0];
  if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const currentRoundRow = (
    await db
      .select({ status: rounds.status })
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, game.currentRound)))
  )[0];

  return NextResponse.json(
    {
      currentRound: game.currentRound,
      roundStatus: currentRoundRow?.status ?? "pending",
      gameStatus: game.status,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
