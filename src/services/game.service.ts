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
import type { ScenarioVocabulary, Sector } from "@/config/scenarios/registry";
import { resolveScenarioDefinition } from "@/services/scenario-source.service";
import { lireSource, type DecisionSourceMap } from "@/config/decision-source";
import {
  presetFromProfile,
  quizModeFromProfile,
  type QuizMode,
} from "@/config/difficulty";
import { pseudoAffichable } from "@/config/invite";
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
import {
  demandesDeLaPartie,
  type DemandeAInstruire,
} from "@/services/subvention.service";
import { teamDisplayName } from "@/services/game-view.service";
import { entitlementsForOrg } from "@/services/entitlements.service";

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
  distribuerUnCourrier,
  resolveCurrentRound,
  submitTeamDecisions,
  type CourrierAnnonce,
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

  // Le pseudo s'enregistre AVANT le retour anticipé du joueur déjà inscrit.
  // Il ne s'écrivait qu'à la première adhésion : l'élève qui revenait et
  // corrigeait son prénom — champ obligatoire du formulaire, qu'il remplit
  // donc à chaque fois — voyait sa saisie disparaître en silence, et
  // l'enseignant gardait à l'écran le nom de la première fois.
  if (args.pseudo?.trim()) {
    await db.update(users).set({ displayName: args.pseudo.trim() }).where(eq(users.id, args.userId));
  }
  if (memberships.some((m) => m.userId === args.userId)) return { gameId: game.id };

  const counts = new Map(teamRows.map((t) => [t.id, 0]));
  for (const m of memberships) counts.set(m.teamId, (counts.get(m.teamId) ?? 0) + 1);
  const target = [...counts.entries()].sort((a, b) => a[1] - b[1])[0]![0];

  await db.insert(players).values({ teamId: target, userId: args.userId, role: "member" });
  return { gameId: game.id };
}

/**
 * L'équipe se donne un nom, tant que le premier tour n'est pas clos.
 *
 * Après, le nom se fige : un classement qui change d'intitulé en cours de
 * partie devient illisible, pour la classe comme pour le relevé de notes.
 *
 * En partie solo, jamais : le joueur reprend une entreprise qui existe déjà,
 * avec son nom et son secteur.
 */
export async function nommerEquipe(args: {
  gameId: string;
  userId: string;
  nom: string;
}): Promise<{ nom: string }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  // En solo, l'entreprise est celle du scénario : elle a son nom, son secteur
  // et son histoire, et c'est la mise en situation elle-même.
  if (((game.difficultyProfile as { kind?: GameKind } | null)?.kind ?? "solo") === "solo") {
    throw new Error("En solo, l'entreprise garde le nom du scénario.");
  }
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
  return (
    await resolveScenarioDefinition((game.scenarioSnapshot as { code?: string } | null)?.code)
  ).vocabulary;
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
  /** Le secteur joué, pour que la liste des parties ait un visage. */
  scenarioCode: string;
  scenarioTitle: string;
  scenarioIcon: string;
  sector: Sector;
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
  return Promise.all(
    classGames.map(async (g) => {
      const def = await resolveScenarioDefinition(
        (g.scenarioSnapshot as { code?: string } | null)?.code,
      );
      return {
        gameId: g.id,
        joinCode: g.joinCode,
        status: g.status,
        currentRound: g.currentRound,
        roundsCount: (g.scenarioSnapshot as { roundsCount: number }).roundsCount,
        roundDays: (g.scenarioSnapshot as { roundDays: number }).roundDays,
        teamsCount: countByGame.get(g.id) ?? 0,
        createdAt: g.createdAt,
        scenarioCode: def.code,
        scenarioTitle: def.title,
        scenarioIcon: def.icon,
        sector: def.sector,
      };
    }),
  );
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

/**
 * Lève le rideau sur le classement d'un tour résolu — ou le referme.
 *
 * En classe et en concours, c'est l'animateur qui révèle : sans cela, la classe
 * lisait le classement sur son téléphone avant même qu'il ne le projette. Tour
 * par tour, pour que chaque clôture redevienne un moment.
 *
 * On ne révèle qu'un tour RÉSOLU : un tour en cours n'a pas de classement, et
 * l'ouvrir d'avance ne montrerait que celui du tour précédent, sous un mauvais
 * numéro.
 */
export async function setRankingRevealed(args: {
  gameId: string;
  teacherId: string;
  roundIndex: number;
  revealed: boolean;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) {
    throw new Error("Partie introuvable");
  }
  const round = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, args.gameId), eq(rounds.index, args.roundIndex)))
  )[0];
  if (!round) throw new Error("Tour introuvable");
  if (round.status !== "resolved") {
    throw new Error("Le classement d'un tour qui n'est pas clos n'existe pas encore.");
  }
  await db
    .update(rounds)
    .set({ rankingRevealedAt: args.revealed ? new Date() : null })
    .where(eq(rounds.id, round.id));
}

/**
 * Fenêtre globale de jeu (planning) : la partie n'est jouable qu'entre ces deux
 * instants. Chacun peut être null (pas de borne). L'ouverture doit précéder la
 * fermeture. Le verrou par tour et l'étape de concours s'appliquent en plus.
 */
export async function setGameSchedule(args: {
  gameId: string;
  teacherId: string;
  opensAt: Date | null;
  closesAt: Date | null;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) {
    throw new Error("Partie introuvable");
  }
  if (args.opensAt && args.closesAt && args.opensAt.getTime() > args.closesAt.getTime()) {
    throw new Error("L'ouverture doit précéder la fermeture.");
  }
  await db
    .update(games)
    .set({ opensAt: args.opensAt, closesAt: args.closesAt })
    .where(eq(games.id, args.gameId));
}

/**
 * Fenêtres par tour (planning fin) : chaque tour n'est jouable qu'entre son
 * ouverture et son échéance. Chaque borne peut être null. Le verrou par tour se
 * combine à la fenêtre globale de la partie et à celle de l'étape de concours :
 * l'élève joue pendant l'intersection des fenêtres posées.
 *
 * On n'écrit que les tours cités (par leur index 1..N) et on ignore un index
 * inconnu : la mise à jour est ciblée, un tour absent reste inchangé.
 */
export async function setRoundWindows(args: {
  gameId: string;
  teacherId: string;
  windows: { index: number; opensAt: Date | null; deadline: Date | null }[];
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) {
    throw new Error("Partie introuvable");
  }
  for (const w of args.windows) {
    if (w.opensAt && w.deadline && w.opensAt.getTime() > w.deadline.getTime()) {
      throw new Error(`Tour ${w.index} : l'ouverture doit précéder l'échéance.`);
    }
  }
  for (const w of args.windows) {
    await db
      .update(rounds)
      .set({ opensAt: w.opensAt, deadline: w.deadline })
      .where(and(eq(rounds.gameId, args.gameId), eq(rounds.index, w.index)));
  }
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
  /** Fenêtre globale de jeu (planning), en ISO ou null. */
  opensAt: string | null;
  closesAt: string | null;
  /** Fenêtre de chaque tour (planning fin), triée par index. Dates en ISO ou null. */
  rounds: {
    index: number;
    status: string;
    opensAt: string | null;
    deadline: string | null;
    /** Le classement de ce tour a-t-il été révélé aux élèves ? */
    rankingRevealed: boolean;
  }[];
  /** Freemium : la partie s'est arrêtée avant la fin du scénario, faute de licence. */
  planCapped: boolean;
  /** Freemium : l'export du relevé est-il ouvert (licence) ? Sinon on propose l'upsell. */
  canExportGradebook: boolean;
  /** Secteur joué : titre du scénario et codes d'événements de SA liasse. */
  scenarioCode: string;
  scenarioTitle: string;
  scenarioIcon: string;
  sector: Sector;
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
    /** La justification écrite par l'équipe pour ce tour ; null si vide ou non validée. */
    justification: string | null;
    /**
     * Qui, dans l'équipe, a validé ce tour et à quelle heure. La table le
     * notait déjà à chaque envoi, sans que ces colonnes soient relues : le
     * tableau affichait « ✓ validées » sans dire par qui, et l'enseignant qui
     * voit un élève inactif ne pouvait pas savoir si son équipe avait envoyé
     * sans lui. Null pour un bot ou tant que rien n'est validé.
     */
    validation: { nom: string | null; quand: string } | null;
    lastNetIncome: number | null;
    lastNetTreasury: number | null;
  }[];
  ranking: {
    name: string;
    cumulativeNetIncome: number;
    rank: number;
    bpi: number;
    /** Entreprise en cessation de paiements caractérisée (V2 couche 2, #5). */
    defaillant: boolean;
  }[];
  /**
   * LES DEMANDES DE SUBVENTION EXCEPTIONNELLE, à instruire ou déjà tranchées.
   *
   * Une équipe au pied du mur — plus d'emprunt possible, plus d'apport — n'a
   * plus qu'un geste : déposer un dossier. C'est ici qu'il arrive, et nulle
   * part ailleurs : l'animateur est le seul à pouvoir l'accorder.
   */
  aidRequests: (DemandeAInstruire & { teamName: string })[];
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
    .select({ teamId: players.teamId, userId: players.userId, name: users.displayName })
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
  const demandes = await demandesDeLaPartie(gameId);
  const snapshotDefinition = await resolveScenarioDefinition(
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
    opensAt: game.opensAt ? game.opensAt.toISOString() : null,
    closesAt: game.closesAt ? game.closesAt.toISOString() : null,
    planCapped: Boolean(
      (game.difficultyProfile as { planCapped?: boolean } | null)?.planCapped,
    ),
    canExportGradebook: (await entitlementsForOrg(game.organizationId)).gradebookExport,
    rounds: [...gameRounds]
      .sort((a, b) => a.index - b.index)
      .map((r) => ({
        index: r.index,
        status: r.status,
        opensAt: r.opensAt ? r.opensAt.toISOString() : null,
        deadline: r.deadline ? r.deadline.toISOString() : null,
        rankingRevealed: r.rankingRevealedAt != null,
      })),
    scenarioCode: snapshotDefinition.code,
    scenarioTitle: snapshotDefinition.title,
    scenarioIcon: snapshotDefinition.icon,
    sector: snapshotDefinition.sector,
    // La liasse vient du SNAPSHOT, pas de la version courante du scénario :
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
        justification:
          submitted.find((d) => d.teamId === t.id && d.status === "validated")?.justification ?? null,
        validation: (() => {
          if (t.controller === "bot") return null;
          const d = submitted.find((x) => x.teamId === t.id && x.status === "validated");
          if (!d?.validatedAt) return null;
          return {
            nom: pseudoAffichable(memberships.find((m) => m.userId === d.validatedBy)?.name),
            quand: d.validatedAt.toISOString(),
          };
        })(),
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
        defaillant: Boolean((r.detail as { defaillant?: boolean })?.defaillant),
      }))
      .sort((a, b) => a.rank - b.rank),
    // Le service des subventions ne connaît que des identifiants d'équipe : la
    // mise en forme des noms appartient à cette vue, et la lui emprunter de
    // là-bas ferait un cycle d'imports.
    aidRequests: demandes.map((d) => ({
      ...d,
      teamName: teamDisplayName(teamRows.find((t) => t.id === d.teamId)?.name ?? "?"),
    })),
  };
}
