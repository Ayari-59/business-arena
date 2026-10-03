import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { games, hintUsages, rounds, situationInstances } from "@/db/schema";
import { presetFromProfile } from "@/config/difficulty";
import { agregerParNiveau, type LigneAnalyse, type MesureParNiveau } from "@/pedagogy/mesure-analyse";

/**
 * Ce que l'analyse (diagnostic + modèle) coûte au rythme du jeu, par niveau.
 *
 * Lecture seule, sur les parties SOLO déjà débriefées : une situation encore
 * ouverte n'a pas encore dit si elle serait rendue. Les parties de classe sont
 * exclues — l'enseignant y fixe le rythme, le comportement n'est pas celui d'un
 * joueur seul devant son écran.
 *
 * Aucune donnée personnelle : on ne lit ni qui a joué ni ce qu'il a répondu.
 */
export async function mesurerLAnalyseSolo(): Promise<{
  niveaux: MesureParNiveau[];
  situations: number;
}> {
  const rows = await db
    .select({
      id: situationInstances.id,
      diagnosis: situationInstances.diagnosis,
      openedAt: situationInstances.openedAt,
      answeredAt: situationInstances.answeredAt,
      profile: games.difficultyProfile,
    })
    .from(situationInstances)
    .innerJoin(rounds, eq(rounds.id, situationInstances.roundId))
    .innerJoin(games, eq(games.id, rounds.gameId))
    .where(
      sql`${situationInstances.status} = 'debriefed'
        and coalesce(${games.difficultyProfile}->>'kind', 'solo') = 'solo'`,
    );
  if (rows.length === 0) return { niveaux: [], situations: 0 };

  const indices = new Map<string, number>();
  for (let i = 0; i < rows.length; i += 500) {
    const lot = rows.slice(i, i + 500).map((r) => r.id);
    const usages = await db
      .select({ id: hintUsages.situationInstanceId })
      .from(hintUsages)
      .where(inArray(hintUsages.situationInstanceId, lot));
    for (const u of usages) indices.set(u.id, (indices.get(u.id) ?? 0) + 1);
  }

  const lignes: LigneAnalyse[] = rows.map((r) => {
    const diag = r.diagnosis as { selected?: unknown; finalScore?: number; score?: number } | null;
    const rendue = Array.isArray(diag?.selected);
    return {
      niveau: presetFromProfile(r.profile).level,
      rendue,
      minutes:
        rendue && r.openedAt && r.answeredAt
          ? (r.answeredAt.getTime() - r.openedAt.getTime()) / 60_000
          : null,
      indices: indices.get(r.id) ?? 0,
      score: typeof diag?.finalScore === "number" ? diag.finalScore : null,
    };
  });
  return { niveaux: agregerParNiveau(lignes), situations: lignes.length };
}
