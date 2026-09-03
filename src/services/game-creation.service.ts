import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  companyStates,
  games,
  organizations,
  players,
  rounds,
  scenarios,
  teams,
} from "@/db/schema";
import {
  DEFAULT_SCENARIO_CODE,
  scenarioByCode,
  type ScenarioDefinition,
} from "@/config/scenarios/registry";
import {
  applyEconomicOverrides,
  applyEventIntensity,
  applyScoringWeightOverrides,
  presetByLevel,
  sanitizeEconomicOverrides,
  sanitizeScoringWeightOverrides,
  type EconomicOverrides,
  type QuizMode,
  type ScoringWeightOverrides,
} from "@/config/difficulty";
import {
  applyPeriodicity,
  applyPeriodicityToCompany,
  type Periodicity,
} from "@/config/scenarios/periodicity";
import { applyMarketScale } from "@/config/scenarios/market-scale";
import { applyRoundsCount } from "@/config/scenarios/rounds";
import { applyScenarioVariability } from "@/config/scenarios/variability";
import { openSituationsForRound, seedPedagogyReferentials } from "@/services/pedagogy.service";
import { getPlatformConfig } from "@/services/admin.service";
import { assertCanCreateGame } from "@/services/licence.service";
import { type BotProfile } from "@/engine/bots";
import { ENGINE_VERSION } from "@/engine/simulation";

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

const PUBLIC_ORG_SLUG = "public";

async function getOrCreatePublicOrgId(): Promise<string> {
  const found = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, PUBLIC_ORG_SLUG));
  if (found[0]) return found[0].id;
  const inserted = await db
    .insert(organizations)
    .values({ name: "Grand public", slug: PUBLIC_ORG_SLUG, kind: "public" })
    .onConflictDoNothing({ target: organizations.slug })
    .returning({ id: organizations.id });
  if (inserted[0]) return inserted[0].id;
  const retry = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, PUBLIC_ORG_SLUG));
  if (!retry[0]) throw new Error("Organisation publique introuvable");
  return retry[0].id;
}

async function getOrCreateScenarioId(def: ScenarioDefinition): Promise<string> {
  const found = await db
    .select({ id: scenarios.id })
    .from(scenarios)
    .where(
      and(eq(scenarios.code, def.scenario.code), eq(scenarios.version, def.scenario.version)),
    );
  if (found[0]) return found[0].id;
  const inserted = await db
    .insert(scenarios)
    .values({
      code: def.scenario.code,
      version: def.scenario.version,
      title: def.title,
      summary: def.tagline,
      minCompanies: 1,
      maxCompanies: 8,
      roundsCount: def.scenario.roundsCount,
      baseDifficulty: 1,
      config: def.scenario,
      status: "published",
    })
    .returning({ id: scenarios.id });
  if (!inserted[0]) throw new Error(`Création du scénario ${def.scenario.code} impossible`);
  return inserted[0].id;
}

const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeJoinCode(): string {
  return Array.from(
    { length: 6 },
    () => JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)],
  ).join("");
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GameKind = "solo" | "class";

export interface CreateGameArgs {
  organizationId: string;
  createdBy: string;
  periodicity: Periodicity;
  kind: GameKind;
  humanTeams: { name: string }[];
  botCount: number;
  joinCode?: string;
  /** §25 : "competition" verrouille les décisions validées et limite les indices. */
  mode?: "learning" | "competition";
  competitionStageId?: string;
  /** Niveau de difficulté 1-6 (doc 08 §2) — absent = comportement historique. */
  level?: number;
  /** Paramètres économiques modulés à la création (base trimestrielle). */
  economicOverrides?: EconomicOverrides;
  /** Pondérations du BPI ajustées par l'enseignant (six dimensions, doc 08). */
  scoringWeightOverrides?: ScoringWeightOverrides;
  /** Monde variable (doc 02 §9bis) : variante du scénario dérivée de la graine. */
  variableWorld?: boolean;
  /**
   * Nombre de tours joués. Absent = tous ceux du scénario. Une partie se
   * raccourcit, jamais ne s'allonge : au delà, les équipes joueraient des tours
   * sans situation ni événement écrits pour eux.
   */
  roundsCount?: number;
  /** Secteur joué (registre des scénarios) — absent = NOVA. */
  scenarioCode?: string;
  /** Questions posées dans les situations : tout, le modèle seul, ou rien. */
  quizMode?: QuizMode;
}

export interface CreatedGame {
  gameId: string;
  teams: { id: string; name: string; controller: "human" | "bot" }[];
}

// ---------------------------------------------------------------------------
// Fonctions publiques de création
// ---------------------------------------------------------------------------

/** Id du scénario NOVA publié (créé au besoin) — utilisé par le moteur de concours. */
export async function getOrCreateNovaScenarioIdPublic(): Promise<string> {
  return getOrCreateScenarioId(scenarioByCode(DEFAULT_SCENARIO_CODE));
}

/** Cœur commun de création : partie + équipes + tours + états initiaux. */
export async function createGameCore(args: CreateGameArgs): Promise<CreatedGame> {
  const definition = scenarioByCode(args.scenarioCode);
  const scenarioId = await getOrCreateScenarioId(definition);
  await seedPedagogyReferentials(); // référentiels concepts/modèles/situations (idempotent)
  const seed = randomInt(1, 2 ** 31);
  // Pipeline du snapshot (ADR-01 + ADR-10) : paramètres économiques modulés
  // (base trimestrielle) → périodicité → intensité d'événements du niveau.
  const preset = args.level
    ? presetByLevel.get(args.level as 1 | 2 | 3 | 4 | 5 | 6)
    : undefined;
  const sanitized = sanitizeEconomicOverrides(args.economicOverrides);
  const overrides = Object.keys(sanitized).length > 0 ? sanitized : undefined;
  const sanitizedScoring = sanitizeScoringWeightOverrides(args.scoringWeightOverrides);
  const scoringOverrides = Object.keys(sanitizedScoring).length > 0 ? sanitizedScoring : undefined;
  // Monde variable : la variante seedée s'applique AVANT les réglages
  // explicites de l'enseignant (qui gardent donc le dernier mot).
  const baseScenario = args.variableWorld
    ? applyScenarioVariability(definition.scenario, seed)
    : definition.scenario;
  const botCount = Math.min(Math.max(args.botCount, 0), definition.bots.length);
  // Toutes les entreprises se partagent le même marché : sans redimensionnement,
  // une classe nombreuse partage un gâteau calibré pour trois concurrents et
  // aucune équipe n'atteint son seuil. Voir market-scale.ts.
  const concurrents = args.humanTeams.length + botCount;

  const scenarioSnapshot = applyEventIntensity(
    applyPeriodicity(
      applyRoundsCount(
        applyMarketScale(
          applyScoringWeightOverrides(applyEconomicOverrides(baseScenario, overrides), scoringOverrides),
          concurrents,
        ),
        args.roundsCount,
      ),
      args.periodicity,
    ),
    preset?.eventProbabilityMultiplier ?? 1,
  );

  const [game] = await db
    .insert(games)
    .values({
      organizationId: args.organizationId,
      scenarioId,
      scenarioSnapshot,
      engineVersion: ENGINE_VERSION,
      seed,
      mode: args.mode ?? "learning",
      competitionStageId: args.competitionStageId,
      difficultyProfile: {
        level: preset?.level ?? 1,
        periodicity: args.periodicity,
        kind: args.kind,
        ...(preset ? { difficulty: { level: preset.level, name: preset.name } } : {}),
        ...(overrides ? { economicOverrides: overrides } : {}),
        ...(scoringOverrides ? { scoringWeightOverrides: scoringOverrides } : {}),
        ...(args.variableWorld ? { variableWorld: true } : {}),
        // Questions des situations. L'absence du champ vaut « full » pour les
        // parties d'avant le réglage : leur comportement ne change pas.
        ...(args.quizMode ? { quizMode: args.quizMode } : {}),
      },
      status: "running",
      currentRound: 1,
      joinCode: args.joinCode,
      createdBy: args.createdBy,
    })
    .returning({ id: games.id });
  if (!game) throw new Error("Création de partie impossible");

  const teamRows = await db
    .insert(teams)
    .values([
      ...args.humanTeams.map((t) => ({
        gameId: game.id,
        name: t.name,
        controller: "human" as const,
      })),
      ...definition.bots.slice(0, botCount).map((b) => ({
        gameId: game.id,
        name: b.name,
        controller: "bot" as const,
        botProfile: b.profile,
      })),
    ])
    .returning({
      id: teams.id,
      name: teams.name,
      controller: teams.controller,
      botProfile: teams.botProfile,
    });

  await db.insert(rounds).values(
    Array.from({ length: scenarioSnapshot.roundsCount }, (_, i) => ({
      gameId: game.id,
      index: i + 1,
      status: i === 0 ? ("open" as const) : ("pending" as const),
    })),
  );

  await db.insert(companyStates).values(
    teamRows.map((t) => ({
      teamId: t.id,
      roundIndex: 0,
      state: applyPeriodicityToCompany(
        definition.company(
          t.id,
          t.name,
          t.controller === "human" ? "human" : "bot",
          (t.botProfile ?? undefined) as BotProfile | undefined,
        ),
        args.periodicity,
      ),
    })),
  );

  await openSituationsForRound(game.id, 1); // situations scriptées du tour 1 (doc 03)

  return {
    gameId: game.id,
    teams: teamRows.map((t) => ({ id: t.id, name: t.name, controller: t.controller })),
  };
}

/** Partie solo : le joueur contre N−1 bots du pool (§27 : nombre configurable). */
export async function createSoloGame(
  userId: string,
  periodicity: Periodicity = "quarter",
  companiesCount = 3,
  level?: number,
  variableWorld = false,
  scenarioCode?: string,
  roundsCount?: number,
): Promise<string> {
  const config = await getPlatformConfig();
  if (!config.allowPublicPlay) {
    throw new Error("Les parties publiques sont désactivées par l'administrateur.");
  }
  const definition = scenarioByCode(scenarioCode);
  const organizationId = await getOrCreatePublicOrgId();
  const botCount = Math.min(Math.max(companiesCount, 2), definition.bots.length + 1) - 1;
  const { gameId } = await createGameCore({
    organizationId,
    createdBy: userId,
    periodicity,
    kind: "solo",
    humanTeams: [{ name: definition.playerTeamName }],
    botCount,
    level,
    variableWorld,
    scenarioCode,
    roundsCount,
    quizMode: "model",
  });
  const humanTeam = (
    await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")))
  )[0]!;
  await db.insert(players).values({ teamId: humanTeam.id, userId, role: "captain" });
  return gameId;
}

/** Partie de classe (§27) : N équipes humaines + bots, code d'invitation. */
export async function createClassGame(args: {
  teacherId: string;
  organizationId: string;
  periodicity: Periodicity;
  humanTeamsCount: number;
  botCount: number;
  level?: number;
  economicOverrides?: EconomicOverrides;
  scoringWeightOverrides?: ScoringWeightOverrides;
  variableWorld?: boolean;
  scenarioCode?: string;
  quizMode?: QuizMode;
  /** Tours joués. Absent = tous ceux du scénario ; jamais plus. */
  roundsCount?: number;
}): Promise<{ gameId: string; joinCode: string }> {
  // La licence se vérifie ici, à l'OUVERTURE d'une partie, et nulle part
  // ailleurs : une classe commencée se termine, quoi qu'il advienne du
  // mandatement. Clore un tour, débriefer et exporter les notes restent
  // possibles même licence expirée.
  await assertCanCreateGame(args.organizationId);
  const humanTeamsCount = Math.min(Math.max(args.humanTeamsCount, 1), 8);
  const botCount = Math.min(Math.max(args.botCount, 0), 8 - humanTeamsCount);
  const joinCode = makeJoinCode();
  const { gameId } = await createGameCore({
    organizationId: args.organizationId,
    createdBy: args.teacherId,
    periodicity: args.periodicity,
    kind: "class",
    humanTeams: Array.from({ length: humanTeamsCount }, (_, i) => ({ name: `Équipe ${i + 1}` })),
    botCount,
    joinCode,
    level: args.level,
    economicOverrides: args.economicOverrides,
    scoringWeightOverrides: args.scoringWeightOverrides,
    variableWorld: args.variableWorld,
    scenarioCode: args.scenarioCode,
    quizMode: args.quizMode,
    roundsCount: args.roundsCount,
  });
  return { gameId, joinCode };
}
