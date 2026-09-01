import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { games, rounds, teams, decisions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

  const currentRoundRow = (
    await db
      .select({ id: rounds.id, status: rounds.status })
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, game.currentRound)))
  )[0];

  let submittedCount = 0;
  if (currentRoundRow) {
    const submitted = await db
      .select({ teamId: decisions.teamId, status: decisions.status })
      .from(decisions)
      .where(eq(decisions.roundId, currentRoundRow.id));
    submittedCount = humanTeams.filter((t) =>
      submitted.some((d) => d.teamId === t.id && d.status === "validated"),
    ).length;
  }

  return NextResponse.json(
    {
      currentRound: game.currentRound,
      roundStatus: currentRoundRow?.status ?? "pending",
      submittedCount,
      totalHumanTeams: humanTeams.length,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
