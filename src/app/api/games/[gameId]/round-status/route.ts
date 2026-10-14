import { NextResponse } from "next/server";
import { getGuestUserId } from "@/lib/guest";
import { db } from "@/db";
import { games, rounds, players, teams, decisions } from "@/db/schema";
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

  /*
    COMBIEN D'ÉQUIPES ONT RENDU. L'arène l'affiche pendant l'attente de la
    clôture, et ce compte bouge SANS que le tour change : sans lui ici, la ligne
    « 3 équipes sur 6 » resterait figée pendant tout le temps où elle sert.
    Une requête de plus par sondage, et une seule : le pilote HTTP facture
    chaque aller-retour, et cet endpoint est sondé par chaque élève. Aucun nom
    n'est rendu — un nombre, comme l'écran en montre un.
  */
  const equipes = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  let submittedCount = 0;
  const roundId = (
    await db
      .select({ id: rounds.id })
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, row.currentRound)))
  )[0]?.id;
  if (roundId && equipes.length > 1) {
    const rendues = await db
      .select({ teamId: decisions.teamId, status: decisions.status })
      .from(decisions)
      .where(eq(decisions.roundId, roundId));
    submittedCount = equipes.filter((t) =>
      rendues.some((d) => d.teamId === t.id && d.status === "validated"),
    ).length;
  }

  return NextResponse.json(
    {
      currentRound: row.currentRound,
      roundStatus: row.roundStatus ?? "pending",
      gameStatus: row.gameStatus,
      submittedCount,
      totalHumanTeams: equipes.length,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
