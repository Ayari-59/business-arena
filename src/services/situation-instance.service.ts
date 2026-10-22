import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { games, hintUsages, players, rounds, roundResults, situationInstances, situations, teams } from "@/db/schema";
import { situationByCode } from "@/config/scenarios/registry";
import { dureeDuTourDe, moisDeDepartDe, situationDeLaPartie } from "@/config/scenarios/situation-texte";
import { tourDOuverture } from "@/config/scenarios/situation-kit";
import { resolveScenarioDefinition } from "@/services/scenario-source.service";
import { presetFromProfile } from "@/config/difficulty";
import { buildTriggerContext, detectSituations, nomsDuMarche } from "@/pedagogy/detection";
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
  const definition = await resolveScenarioDefinition(snapshotCode);
  // Les faits nomment les clientèles et les références ; le snapshot est la
  // partie telle qu'elle est jouée, réglages de l'enseignant compris.
  const noms = nomsDuMarche(
    (gameRow?.scenarioSnapshot as Pick<typeof definition.scenario, "market" | "products"> | null) ??
      definition.scenario,
  );

  /*
    LE TOUR D'AVANT LE TOUR OBSERVÉ. `previousResults` porte le tour qui vient
    de se clore ; le redressement demande celui d'encore avant, pour savoir
    d'où l'équipe vient. Deux colonnes suffisent, donc aucune reconstruction
    de résultat : une lecture, et rien de plus.
  */
  const avantPrecedent = new Map<string, { netIncome: number; netTreasury: number }>();
  if (roundIndex >= 3) {
    const rndAvant = (
      await db
        .select()
        .from(rounds)
        .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex - 2)))
    )[0];
    if (rndAvant) {
      const lignes = await db
        .select({
          teamId: roundResults.teamId,
          netIncome: roundResults.netIncome,
          netTreasury: roundResults.netTreasury,
        })
        .from(roundResults)
        .where(eq(roundResults.roundId, rndAvant.id));
      for (const l of lignes) {
        avantPrecedent.set(l.teamId, {
          netIncome: Number(l.netIncome),
          netTreasury: Number(l.netTreasury),
        });
      }
    }
  }

  const referencesDeLaPartie = new Set(
    ((gameRow?.scenarioSnapshot as { products?: { code: string }[] } | null)?.products ?? []).map((p) => p.code),
  );
  const values: (typeof situationInstances.$inferInsert)[] = [];
  // Une partie prolongée (`config/scenarios/rounds.ts`) ouvre ses situations de fin de
  // partie à son dernier tour (`tourDOuverture`) ; une partie au mois sur le calendrier,
  // chacune au premier mois de son trimestre.
  const instantane = gameRow?.scenarioSnapshot as { roundsCount?: number; moisDeDepart?: number } | null;
  const toursJoues = instantane?.roundsCount ?? definition.scenario.roundsCount;
  const scripted = definition.situations.filter(
    (s) =>
      tourDOuverture(s.trigger, toursJoues, definition.scenario.roundsCount, instantane?.moisDeDepart) === roundIndex,
  );
  for (const team of humanTeams) {
    const result = previousResults?.[team.id];
    const detected = result
      ? new Set(
          detectSituations(
            result,
            { placement: presetFromProfile(gameRow?.difficultyProfile).decisions.placement },
            avantPrecedent.get(team.id) ?? null,
          ),
        )
      : new Set<ReturnType<typeof detectSituations>[number]>();

    for (const s of scripted) {
      // LA CONDITION QUE L'ÉNONCÉ SUPPOSE. « Le paradoxe du succès » raconte un
      // trimestre record avec la caisse dans le rouge : ouvert à une équipe qui
      // vient de perdre 108 000 €, il n'enseigne pas le paradoxe, il apprend à
      // ne pas lire ses résultats. Sans condition déclarée, rien ne change —
      // la situation s'ouvre au tour dit, comme avant.
      const condition = "round" in s.trigger ? s.trigger.requires : undefined;
      if (condition && !detected.has(condition)) continue;
      // La référence que l'énoncé suppose : dans la partie, et en vente chez
      // l'équipe au tour joué quand l'énoncé le raconte.
      if (s.seulementAvec) {
        const { reference, auMarche } = s.seulementAvec;
        if (!referencesDeLaPartie.has(reference)) continue;
        if (auMarche && !result?.groupe?.nouveautes?.[reference]?.auMarche) continue;
      }
      const situationId = situationIdByCode.get(s.code);
      if (situationId)
        values.push({
          roundId: roundRow.id,
          teamId: team.id,
          situationId,
          origin: "scripted",
          status: "open",
          ...(condition && result ? { triggerContext: buildTriggerContext(condition, result, noms) } : {}),
          openedAt: new Date(),
        });
    }
    if (result) {
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
            triggerContext: buildTriggerContext(s.trigger.detect, result, noms),
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
  const teamRow = (await db.select().from(teams).where(eq(teams.id, instance.teamId)))[0];
  const gameRow = teamRow
    ? (await db.select().from(games).where(eq(games.id, teamRow.gameId)))[0]
    : undefined;
  // La définition vient du référentiel intégré ; pour une situation propre à un
  // scénario ENSEIGNANT (absente de `situationByCode`), on la retrouve dans la
  // définition du scénario joué, résolue depuis la base.
  let def = situationByCode.get(situationRow.code);
  if (!def) {
    const snapshotCode = (gameRow?.scenarioSnapshot as { code?: string } | null)?.code;
    if (snapshotCode) {
      const definition = await resolveScenarioDefinition(snapshotCode);
      def = definition.situations.find((s) => s.code === situationRow.code);
    }
  }
  if (!def) throw new Error("Définition de situation manquante");
  // Le texte de SA partie : au mois, les montants et les mots du mois. Tout ce
  // qui passe par ici le lit ainsi, indices, diagnostic, rattrapage, et la
  // lecture des réponses ouvertes, qui rapproche l'écrit de l'élève des
  // libellés qu'il a eus sous les yeux.
  return {
    instance,
    situationRow,
    def: situationDeLaPartie(def, dureeDuTourDe(gameRow?.scenarioSnapshot), moisDeDepartDe(gameRow?.scenarioSnapshot)),
    game: gameRow,
  };
}

export async function unlockedLevels(instanceId: string): Promise<number[]> {
  const rows = await db
    .select({ level: hintUsages.level })
    .from(hintUsages)
    .where(eq(hintUsages.situationInstanceId, instanceId));
  return rows.map((r) => r.level);
}
