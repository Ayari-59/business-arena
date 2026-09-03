import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  decisions,
  gameRankings,
  games,
  players,
  roundResults,
  rounds,
  teams,
  users,
} from "@/db/schema";
import { scenarioByCode, type ScenarioVocabulary } from "@/config/scenarios/registry";
import { lireSource, type DecisionSourceMap } from "@/config/decision-source";
import {
  presetFromProfile,
  quizModeFromProfile,
  type QuizMode,
} from "@/config/difficulty";
import { validerNomEquipe } from "@/config/nom-equipe";
import { PERSONALITY_LABELS, botPersonalityFromSeed } from "@/engine/bots";
import {
  missedSituationPolicyFromProfile,
  type MissedSituationPolicy,
} from "@/config/missed-situation";
import {
  findUserTeam,
  readPendingEvents,
} from "@/services/round-resolution.service";
import { teamDisplayName } from "@/services/game-view.service";

// Re-exports depuis game-creation.service.ts pour compatibilité des consommateurs existants
export {
  createGameCore,
  createSoloGame,
  createClassGame,
  getOrCreateNovaScenarioIdPublic,
  type CreatedGame,
  type CreateGameArgs,
} from "@/services/game-creation.service";
export type { GameKind } from "@/services/game-creation.service";
import type { GameKind } from "@/services/game-creation.service";

// Re-exports depuis round-resolution.service.ts pour compatibilité des consommateurs existants
export {
  closeCurrentRound,
  drawEventCardForNextRound,
  resolveCurrentRound,
  submitTeamDecisions,
  type PendingEventCard,
} from "@/services/round-resolution.service";

// Re-exports depuis game-view.service.ts pour compatibilité des consommateurs existants
export { getGameView, teamDisplayName } from "@/services/game-view.service";
export type { GameView, StudyReports } from "@/services/game-view.service";

/** Rejoindre une partie de classe par code : affectation à l'équipe la moins remplie. */
export async function joinGameByCode(args: {
  code: string;
  userId: string;
  pseudo?: string;
}): Promise<{ gameId: string } | { error: string }> {
  const game = (
    await db.select().from(games).where(eq(games.joinCode, args.code.trim().toUpperCase()))
  )[0];
  if (!game) return { error: "Code de partie inconnu." };
  if (game.status === "finished" || game.status === "archived")
    return { error: "Cette partie est terminée." };

  const teamRows = await db
    .select()
    .from(teams)
    .where(and(eq(teams.gameId, game.id), eq(teams.controller, "human")));
  if (teamRows.length === 0) return { error: "Aucune équipe à rejoindre." };

  const memberships = await db
    .select()
    .from(players)
    .where(inArray(players.teamId, teamRows.map((t) => t.id)));
  if (memberships.some((m) => m.userId === args.userId)) return { gameId: game.id };

  const counts = new Map(teamRows.map((t) => [t.id, 0]));
  for (const m of memberships) counts.set(m.teamId, (counts.get(m.teamId) ?? 0) + 1);
  const target = [...counts.entries()].sort((a, b) => a[1] - b[1])[0]![0];

  await db.insert(players).values({ teamId: target, userId: args.userId, role: "member" });
  if (args.pseudo?.trim()) {
    await db.update(users).set({ displayName: args.pseudo.trim() }).where(eq(users.id, args.userId));
  }
  return { gameId: game.id };
}

/**
 * L'équipe se donne un nom, tant que le premier tour n'est pas clos.
 *
 * Après, le nom se fige : un classement qui change d'intitulé en cours de
 * partie devient illisible, pour la classe comme pour le relevé de notes.
 */
export async function nommerEquipe(args: {
  gameId: string;
  userId: string;
  nom: string;
}): Promise<{ nom: string }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.currentRound > 1) {
    throw new Error("Le nom se fige après le premier tour : celui-ci est déjà clos.");
  }
  const { team, allTeams } = await findUserTeam(args.gameId, args.userId);
  if (!team) throw new Error("Vous n'êtes pas membre de cette partie");

  const valide = validerNomEquipe(args.nom);
  if ("erreur" in valide) throw new Error(valide.erreur);

  const prise = allTeams.some(
    (t) =>
      t.id !== team.id &&
      t.name.localeCompare(valide.nom, "fr", { sensitivity: "base" }) === 0,
  );
  if (prise) throw new Error("Une autre équipe porte déjà ce nom.");

  await db.update(teams).set({ name: valide.nom }).where(eq(teams.id, team.id));
  return { nom: valide.nom };
}

/** Genre d'une partie (solo / classe). */
export async function getGameKind(gameId: string): Promise<GameKind> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  return ((game.difficultyProfile as { kind?: GameKind }).kind ?? "solo") as GameKind;
}

/** Le vocabulaire du secteur joué : c'est lui qui nomme prix et volume. */
export async function getGameVocabulary(gameId: string): Promise<ScenarioVocabulary> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  return scenarioByCode((game.scenarioSnapshot as { code?: string } | null)?.code).vocabulary;
}

// ---------------------------------------------------------------------------
// Lecture : vues enseignant (§27)
// ---------------------------------------------------------------------------

export interface TeacherGameSummary {
  gameId: string;
  joinCode: string | null;
  status: string;
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  teamsCount: number;
  createdAt: Date;
}

export async function getTeacherGames(teacherId: string): Promise<TeacherGameSummary[]> {
  const rows = await db
    .select()
    .from(games)
    .where(eq(games.createdBy, teacherId))
    .orderBy(desc(games.createdAt));
  const classGames = rows.filter(
    (g) => (g.difficultyProfile as { kind?: string }).kind === "class",
  );
  if (classGames.length === 0) return [];
  const gameIds = classGames.map((g) => g.id);
  const allTeams = await db
    .select({ gameId: teams.gameId })
    .from(teams)
    .where(and(inArray(teams.gameId, gameIds), eq(teams.controller, "human")));
  const countByGame = new Map<string, number>();
  for (const t of allTeams) countByGame.set(t.gameId, (countByGame.get(t.gameId) ?? 0) + 1);
  return classGames.map((g) => ({
    gameId: g.id,
    joinCode: g.joinCode,
    status: g.status,
    currentRound: g.currentRound,
    roundsCount: (g.scenarioSnapshot as { roundsCount: number }).roundsCount,
    roundDays: (g.scenarioSnapshot as { roundDays: number }).roundDays,
    teamsCount: countByGame.get(g.id) ?? 0,
    createdAt: g.createdAt,
  }));
}

/**
 * Règle les questions posées dans les situations d'une partie en cours. Le
 * réglage vit dans le profil de difficulté (jsonb) : aucune migration, et les
 * situations DÉJÀ débriefées gardent le score obtenu sous l'ancien réglage.
 */
export async function setQuizMode(args: {
  gameId: string;
  teacherId: string;
  mode: QuizMode;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) {
    throw new Error("Partie introuvable");
  }
  const profile = (game.difficultyProfile as Record<string, unknown> | null) ?? {};
  await db
    .update(games)
    .set({ difficultyProfile: { ...profile, quizMode: args.mode } })
    .where(eq(games.id, args.gameId));
}

export interface TeacherGameView {
  gameId: string;
  joinCode: string | null;
  status: string;
  mode: "learning" | "competition" | "contest";
  /** Cartes annoncées pour le prochain tour (teamId null = toute la classe). */
  pendingEvents: { code: string; teamId: string | null; teamName: string | null }[];
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  /** Secteur joué : titre du scénario et codes d'événements de SON deck. */
  scenarioCode: string;
  scenarioTitle: string;
  scenarioEventCodes: string[];
  /** Questions posées dans les situations de cette partie. */
  quizMode: QuizMode;
  /** Politique des situations manquées (consultation seule / rattrapage 50 %). */
  missedPolicy: MissedSituationPolicy;
  /**
   * Réglages figés à la création, que l'enseignant ne peut plus consulter
   * ailleurs : le niveau n'était lisible que côté élève, et la case du monde
   * variable nulle part.
   */
  difficulty: { level: number; name: string; hintMaxLevel: number };
  variableWorld: boolean;
  teams: {
    teamId: string;
    name: string;
    controller: "human" | "bot";
    /** Personnalité du bot (réservée à l'enseignant) ; null pour une équipe humaine. */
    botPersonality: string | null;
    playerNames: string[];
    hasSubmitted: boolean;
    /** Source des pivots (prix, volume) des décisions validées ce tour ; null sans validation. */
    decisionSource: DecisionSourceMap | null;
    lastNetIncome: number | null;
    lastNetTreasury: number | null;
  }[];
  ranking: { name: string; cumulativeNetIncome: number; rank: number; bpi: number }[];
}

export async function getTeacherGameView(
  gameId: string,
  teacherId: string,
): Promise<TeacherGameView | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game || game.createdBy !== teacherId) return null;

  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const gameRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
  const currentRoundRow = gameRounds.find((r) => r.index === game.currentRound);

  const memberships = await db
    .select({ teamId: players.teamId, name: users.displayName })
    .from(players)
    .innerJoin(users, eq(users.id, players.userId))
    .where(inArray(players.teamId, teamRows.map((t) => t.id)));

  const submitted = currentRoundRow
    ? await db.select().from(decisions).where(eq(decisions.roundId, currentRoundRow.id))
    : [];

  const lastResolved = gameRounds
    .filter((r) => r.status === "resolved")
    .sort((a, b) => b.index - a.index)[0];
  const lastResults = lastResolved
    ? await db.select().from(roundResults).where(eq(roundResults.roundId, lastResolved.id))
    : [];

  const rankingRows = await db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId));
  const snapshotDefinition = scenarioByCode(
    (game.scenarioSnapshot as { code?: string } | null)?.code,
  );

  return {
    gameId,
    joinCode: game.joinCode,
    status: game.status,
    mode: game.mode,
    pendingEvents: readPendingEvents(game.difficultyProfile).map((card) => ({
      code: card.code,
      teamId: card.teamId,
      teamName: card.teamId
        ? (teamRows.find((t) => t.id === card.teamId)?.name ?? null)
        : null,
    })),
    currentRound: game.currentRound,
    roundsCount: (game.scenarioSnapshot as { roundsCount: number }).roundsCount,
    roundDays: (game.scenarioSnapshot as { roundDays: number }).roundDays,
    scenarioCode: snapshotDefinition.code,
    scenarioTitle: snapshotDefinition.title,
    // Le deck vient du SNAPSHOT, pas de la version courante du scénario :
    // une partie lancée joue les règles avec lesquelles elle a commencé.
    scenarioEventCodes: (
      (game.scenarioSnapshot as { events?: { code: string }[] }).events ?? []
    ).map((e) => e.code),
    quizMode: quizModeFromProfile(game.difficultyProfile),
    missedPolicy: missedSituationPolicyFromProfile(
      game.difficultyProfile,
      (game.difficultyProfile as { kind?: string } | null)?.kind,
    ),
    difficulty: (() => {
      const preset = presetFromProfile(game.difficultyProfile);
      return { level: preset.level, name: preset.name, hintMaxLevel: preset.hintMaxLevel };
    })(),
    variableWorld:
      (game.difficultyProfile as { variableWorld?: boolean } | null)?.variableWorld === true,
    teams: teamRows.map((t) => {
      const last = lastResults.find((r) => r.teamId === t.id);
      return {
        teamId: t.id,
        name: teamDisplayName(t.name),
        controller: t.controller,
        botPersonality:
          t.controller === "bot"
            ? PERSONALITY_LABELS[botPersonalityFromSeed(Number(game.seed), t.botProfile ?? "balanced")]
            : null,
        playerNames: memberships.filter((m) => m.teamId === t.id).map((m) => m.name),
        hasSubmitted:
          t.controller === "bot" ||
          submitted.some((d) => d.teamId === t.id && d.status === "validated"),
        decisionSource: lireSource(
          submitted.find((d) => d.teamId === t.id && d.status === "validated")?.decisionSource,
        ),
        lastNetIncome: last ? Number(last.netIncome) : null,
        lastNetTreasury: last ? Number(last.netTreasury) : null,
      };
    }),
    ranking: rankingRows
      .map((r) => ({
        name: teamDisplayName(teamRows.find((t) => t.id === r.teamId)?.name ?? "?"),
        cumulativeNetIncome: Number(
          (r.detail as { cumulativeNetIncome?: number })?.cumulativeNetIncome ?? 0,
        ),
        rank: r.rank,
        bpi: Number(r.bpi),
      }))
      .sort((a, b) => a.rank - b.rank),
  };
}
