import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { games, hintUsages, players, rounds, situationInstances, situations, teams } from "@/db/schema";
import { scenarioByCode, situationByCode } from "@/config/scenarios/registry";
import { presetFromProfile } from "@/config/difficulty";
import { buildTriggerContext, detectSituations } from "@/pedagogy/detection";
import type { CompanyRoundResult } from "@/engine/types";

/**
 * Cycle de vie des instances de situation : ouverture pour un tour (situations
 * scriptées + détectées) et chargement d'une instance pour un joueur donné.
 *
 * Extrait de pedagogy.service.ts (refactoring V2, étape 9). Couche de base : les
 * services d'interaction (indices, diagnostic, débriefing) chargent leurs
 * instances via `loadInstanceForUser`.
 */

// ---------------------------------------------------------------------------
// Instanciation des situations d'un tour (scriptées + détectées, doc 03 §1.1)
// ---------------------------------------------------------------------------

export async function openSituationsForRound(
  gameId: string,
  roundIndex: number,
  previousResults?: Record<string, CompanyRoundResult>,
): Promise<void> {
  const roundRow = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex)))
  )[0];
  if (!roundRow) return;
  const humanTeams = await db
    .select()
    .from(teams)
    .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  if (humanTeams.length === 0) return;

  const situationRows = await db.select().from(situations);
  const situationIdByCode = new Map(situationRows.map((r) => [r.code, r.id]));

  // Les situations appartiennent au scénario JOUÉ : une partie d'hôtellerie
  // n'ouvre jamais une situation d'atelier. Le snapshot porte le code du
  // scénario de la partie (un code inconnu retombe sur NOVA).
  const gameRow = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  const snapshotCode = (gameRow?.scenarioSnapshot as { code?: string } | null)?.code;
  const definition = scenarioByCode(snapshotCode);

  const values: (typeof situationInstances.$inferInsert)[] = [];
  const scripted = definition.situations.filter(
    (s) => "round" in s.trigger && s.trigger.round === roundIndex,
  );
  for (const team of humanTeams) {
    for (const s of scripted) {
      const situationId = situationIdByCode.get(s.code);
      if (situationId)
        values.push({
          roundId: roundRow.id,
          teamId: team.id,
          situationId,
          origin: "scripted",
          status: "open",
          openedAt: new Date(),
        });
    }
    const result = previousResults?.[team.id];
    if (result) {
      const detected = new Set(
        detectSituations(result, {
          placement: presetFromProfile(gameRow?.difficultyProfile).decisions.placement,
        }),
      );
      // Résolution par le déclencheur porté par la situation, pas par une
      // convention de nommage : chaque scénario nomme ses situations librement.
      for (const s of definition.situations) {
        if (!("detect" in s.trigger) || !detected.has(s.trigger.detect)) continue;
        const situationId = situationIdByCode.get(s.code);
        if (situationId)
          values.push({
            roundId: roundRow.id,
            teamId: team.id,
            situationId,
            origin: "detected",
            status: "open",
            triggerContext: buildTriggerContext(s.trigger.detect, result),
            openedAt: new Date(),
          });
      }
    }
  }
  if (values.length > 0)
    await db.insert(situationInstances).values(values).onConflictDoNothing();
}

export async function loadInstanceForUser(instanceId: string, userId: string) {
  const instance = (
    await db.select().from(situationInstances).where(eq(situationInstances.id, instanceId))
  )[0];
  if (!instance) throw new Error("Situation introuvable");
  const membership = (
    await db
      .select()
      .from(players)
      .where(and(eq(players.teamId, instance.teamId), eq(players.userId, userId)))
  )[0];
  if (!membership) throw new Error("Vous n'êtes pas membre de cette équipe");
  const situationRow = (
    await db.select().from(situations).where(eq(situations.id, instance.situationId))
  )[0]!;
  const def = situationByCode.get(situationRow.code);
  if (!def) throw new Error("Définition de situation manquante");
  const teamRow = (await db.select().from(teams).where(eq(teams.id, instance.teamId)))[0];
  const gameRow = teamRow
    ? (await db.select().from(games).where(eq(games.id, teamRow.gameId)))[0]
    : undefined;
  return { instance, situationRow, def, game: gameRow };
}

export async function unlockedLevels(instanceId: string): Promise<number[]> {
  const rows = await db
    .select({ level: hintUsages.level })
    .from(hintUsages)
    .where(eq(hintUsages.situationInstanceId, instanceId));
  return rows.map((r) => r.level);
}
