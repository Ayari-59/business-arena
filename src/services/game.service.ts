import { randomInt } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  companyStates,
  decisions,
  gameRankings,
  games,
  kpis,
  organizations,
  players,
  roundResults,
  rounds,
  scenarios,
  scores,
  situationInstances,
  teams,
  users,
} from "@/db/schema";
import {
  DEFAULT_SCENARIO_CODE,
  scenarioByCode,
  type ScenarioDefinition,
  type ScenarioVocabulary,
} from "@/config/scenarios/registry";
import { computeSectorKpis, type KpiFormat } from "@/config/scenarios/sector-kpis";
import {
  applyEconomicOverrides,
  applyEventIntensity,
  presetByLevel,
  presetFromProfile,
  quizModeFromProfile,
  type QuizMode,
  sanitizeEconomicOverrides,
  type EconomicOverrides,
} from "@/config/difficulty";
import {
  applyPeriodicity,
  applyPeriodicityToCompany,
  type Periodicity,
} from "@/config/scenarios/periodicity";
import { applyMarketScale } from "@/config/scenarios/market-scale";
import { applyRoundsCount } from "@/config/scenarios/rounds";
import { applyScenarioVariability } from "@/config/scenarios/variability";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import {
  debriefRound,
  openSituationsForRound,
  seedPedagogyReferentials,
} from "@/services/pedagogy.service";
import { getPlatformConfig } from "@/services/admin.service";
import { assertCanCreateGame } from "@/services/licence.service";
import { TEACHER_DRAWABLE_CODES, TEAM_CARD_CODES, cardByCode } from "@/config/events/cards";
import { botDecisions, neutralDecisions, type BotProfile } from "@/engine/bots";
import {
  BPI_DIMENSIONS,
  computeRoundScores,
  gameBpi,
  scoringWeights,
  type BpiDimension,
  type PedagogyInputs,
} from "@/scoring/bpi";
import { ENGINE_VERSION, orderOfferForRound, simulateRound } from "@/engine/simulation";
import { computeRatios } from "@/engine/finance/ratios";
import { conditionsBancaires, confianceInitiale } from "@/engine/finance/bank";
import { irr, npv, paybackPeriod } from "@/engine/investment";
import { roundBriefing, type RoundBriefing } from "@/pedagogy/round-briefing";
import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  RoundDecisions,
} from "@/engine/types";

/**
 * Use-cases de partie (doc 01 §1) : SEULE couche autorisée à écrire en base.
 * Le driver HTTP Neon n'offre pas de transactions : la résolution d'un tour
 * est idempotente via un verrou optimiste sur rounds.status (open → resolving),
 * et re-tentable — chaque écriture est un upsert ou une insertion idempotente.
 *
 * Deux genres de partie (difficultyProfile.kind) :
 * - "solo"  : un joueur, résolution immédiate à la validation (ADR-04, solo) ;
 * - "class" : N équipes humaines + bots, chaque équipe valide ses décisions,
 *   l'enseignant (créateur) clôt le tour ; décisions manquantes reconduites.
 */

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

/** Id du scénario NOVA publié (créé au besoin) — utilisé par le moteur de concours. */
export async function getOrCreateNovaScenarioIdPublic(): Promise<string> {
  return getOrCreateScenarioId(scenarioByCode(DEFAULT_SCENARIO_CODE));
}

export type GameKind = "solo" | "class";

/** Carte jouée par l'enseignant, en attente d'application à la clôture. */
export interface PendingEventCard {
  code: string;
  /** null = toute la classe (portée marché) ; sinon l'équipe ciblée. */
  teamId: string | null;
}

function readPendingEvents(profile: unknown): PendingEventCard[] {
  const p = profile as { pendingEvents?: PendingEventCard[]; pendingEventCodes?: string[] };
  if (Array.isArray(p.pendingEvents)) return p.pendingEvents;
  // rétro-compatibilité : ancien format (codes marché uniquement)
  if (Array.isArray(p.pendingEventCodes))
    return p.pendingEventCodes.map((code) => ({ code, teamId: null }));
  return [];
}

interface CreateGameArgs {
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

/**
 * Nom d'équipe affiché. Les parties solo créées avant ce nettoyage portent le
 * suffixe « (vous) » dans le nom stocké : il servait à repérer le joueur, ce
 * que le surlignage de sa ligne fait déjà. On le retire à l'affichage plutôt
 * que par une migration, pour que les parties en cours en soient debarrassées
 * elles aussi.
 */
export function teamDisplayName(name: string): string {
  return name.replace(/\s*\(vous\)\s*$/, "");
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
        applyMarketScale(applyEconomicOverrides(baseScenario, overrides), concurrents),
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
    // Partie publique jouée seul : on ne pose pas de questions de
    // connaissances à quelqu'un qui découvre la plateforme sans professeur.
    // Reste la question du modèle d'analyse, qui est la compétence même du
    // jeu et se répond en jouant, pas en révisant.
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

const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeJoinCode(): string {
  return Array.from(
    { length: 6 },
    () => JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)],
  ).join("");
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
    variableWorld: args.variableWorld,
    scenarioCode: args.scenarioCode,
    quizMode: args.quizMode,
    roundsCount: args.roundsCount,
  });
  return { gameId, joinCode };
}

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

const toMoney = (v: number) => (Math.round(v * 100) / 100).toString();

function sumSold(bySegment: CompanyRoundResult["market"]["bySegment"]): number {
  return Object.values(bySegment).reduce((s, d) => s + d.sold, 0);
}

/**
 * Décisions de repli quand une équipe n'a rien soumis au tour 1.
 *
 * Elles viennent du SECTEUR joué, et non plus de NOVA. Le prix codé en dur
 * était celui d'une enceinte portable, appliqué tel quel à la journée de
 * conseil et à la nuitée d'hôtel ; le volume, celui d'un atelier de 7 000
 * unités, appliqué à un cabinet qui n'en produit que 720. Une équipe en retard
 * ne se voyait pas reconduire son tour, elle se voyait attribuer une faillite.
 */
function fallbackDecisions(
  scenario: EngineScenarioConfig,
  state: CompanyState,
  roundIndex: number,
): RoundDecisions {
  return {
    ...neutralDecisions({ scenario, state, roundIndex }),
    finance: { newLoan: 0, loanRepayment: 0 },
  };
}

/** Équipe (humaine) d'un utilisateur dans une partie, ou null. */
async function findUserTeam(gameId: string, userId: string) {
  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const humanIds = teamRows.filter((t) => t.controller === "human").map((t) => t.id);
  if (humanIds.length === 0) return null;
  const membership = (
    await db
      .select()
      .from(players)
      .where(and(inArray(players.teamId, humanIds), eq(players.userId, userId)))
  )[0];
  if (!membership) return null;
  return teamRows.find((t) => t.id === membership.teamId) ?? null;
}

/** Soumet (valide) les décisions de l'équipe de l'utilisateur pour le tour courant. */
export async function submitTeamDecisions(args: {
  gameId: string;
  userId: string;
  payload: RoundDecisions;
}): Promise<{ roundIndex: number }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.status !== "running") throw new Error("Cette partie est terminée");
  const team = await findUserTeam(args.gameId, args.userId);
  if (!team) throw new Error("Vous n'êtes pas membre de cette partie");

  const roundRow = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, args.gameId), eq(rounds.index, game.currentRound)))
  )[0];
  if (!roundRow || roundRow.status !== "open") throw new Error("Ce tour n'est pas ouvert");

  // §25 (mode compétition) : décisions verrouillées après validation
  if (game.mode === "competition") {
    const existing = (
      await db
        .select()
        .from(decisions)
        .where(and(eq(decisions.roundId, roundRow.id), eq(decisions.teamId, team.id)))
    )[0];
    if (existing && existing.status !== "draft") {
      throw new Error("Mode compétition : vos décisions sont verrouillées après validation");
    }
  }

  await db
    .insert(decisions)
    .values({
      roundId: roundRow.id,
      teamId: team.id,
      payload: args.payload,
      status: "validated",
      validatedAt: new Date(),
      validatedBy: args.userId,
    })
    .onConflictDoUpdate({
      target: [decisions.roundId, decisions.teamId],
      set: {
        payload: args.payload,
        status: "validated",
        validatedAt: new Date(),
        validatedBy: args.userId,
      },
    });
  return { roundIndex: game.currentRound };
}

/**
 * Résolution du tour courant (cœur commun solo / classe).
 * Décisions par équipe humaine : soumises → sinon reconduites du tour
 * précédent (carried_over, ADR-04) → sinon repli. Bots : stratégies pures.
 */
async function resolveGameRound(
  gameId: string,
): Promise<{ roundIndex: number; finished: boolean }> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.status !== "running") throw new Error("Cette partie est terminée");
  const roundIndex = game.currentRound;

  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const roundRow = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex)))
  )[0];
  if (!roundRow) throw new Error("Tour introuvable");

  // Verrou optimiste (pas de transactions sur le driver HTTP Neon)
  const locked = await db
    .update(rounds)
    .set({ status: "resolving" })
    .where(and(eq(rounds.id, roundRow.id), eq(rounds.status, "open")))
    .returning({ id: rounds.id });
  if (!locked[0]) throw new Error("Ce tour est déjà en cours de résolution");

  try {
    const scenario = parseScenarioConfig(game.scenarioSnapshot);

    const stateRows = await db
      .select()
      .from(companyStates)
      .where(
        and(
          eq(companyStates.roundIndex, roundIndex - 1),
          inArray(companyStates.teamId, teamRows.map((t) => t.id)),
        ),
      );
    const states = stateRows.map((r) => r.state as CompanyState);
    if (states.length !== teamRows.length) throw new Error("États d'entreprises incomplets");

    // Décisions soumises pour ce tour + ventes et décisions du tour précédent
    const submitted = await db.select().from(decisions).where(eq(decisions.roundId, roundRow.id));
    const lastSold: Record<string, number> = {};
    const previousPayloads: Record<string, RoundDecisions> = {};
    if (roundIndex > 1) {
      const prevRound = (
        await db
          .select()
          .from(rounds)
          .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex - 1)))
      )[0];
      if (prevRound) {
        const prevResults = await db
          .select()
          .from(roundResults)
          .where(eq(roundResults.roundId, prevRound.id));
        for (const r of prevResults) {
          lastSold[r.teamId] = sumSold(
            (r.marketDetail ?? {}) as CompanyRoundResult["market"]["bySegment"],
          );
        }
        const prevDecisions = await db
          .select()
          .from(decisions)
          .where(eq(decisions.roundId, prevRound.id));
        for (const d of prevDecisions) previousPayloads[d.teamId] = d.payload as RoundDecisions;
      }
    }

    const allDecisions: Record<string, RoundDecisions> = {};
    const carriedOver = new Set<string>();
    for (const team of teamRows) {
      const state = states.find((s) => s.id === team.id);
      if (!state) throw new Error(`État manquant pour ${team.name}`);
      if (team.controller === "bot") {
        allDecisions[team.id] = botDecisions((team.botProfile ?? "balanced") as BotProfile, {
          scenario,
          state,
          roundIndex,
          lastSoldUnits: lastSold[team.id],
        });
        continue;
      }
      const own = submitted.find((d) => d.teamId === team.id);
      if (own) {
        allDecisions[team.id] = own.payload as RoundDecisions;
      } else if (previousPayloads[team.id]) {
        const prev = previousPayloads[team.id]!;
        // reconduction : l'indice de salaire et le remboursement d'emprunt
        // sont récurrents ; embauches, formation, investissement, nouvel
        // emprunt et apport en capital sont des actions PONCTUELLES.
        allDecisions[team.id] = {
          ...prev,
          hr: prev.hr ? { salaryIndex: prev.hr.salaryIndex } : undefined,
          supplierChoice: prev.supplierChoice,
          investment: undefined,
          treasury: undefined,
          finance: undefined, // échéances automatiques ; emprunt/anticipé/capital : ponctuels
          acceptOrder: undefined, // chaque commande exceptionnelle se décide
          studies: undefined, // l'information s'achète tour par tour
        };
        carriedOver.add(team.id);
      } else {
        allDecisions[team.id] = fallbackDecisions(scenario, state, roundIndex);
        carriedOver.add(team.id);
      }
    }

    const profile = game.difficultyProfile as { activeEvents?: EventInstance[] };
    const activeEvents = Array.isArray(profile.activeEvents) ? profile.activeEvents : [];
    // Cartes jouées par l'enseignant : marché (toute la classe) ou ciblées
    const pendingCards = readPendingEvents(game.difficultyProfile);
    const injected: EventInstance[] = pendingCards.flatMap((card) => {
      const def = scenario.events.find((e) => e.code === card.code);
      if (!def) return [];
      if (activeEvents.some((e) => e.code === card.code && e.companyId === (card.teamId ?? undefined)))
        return [];
      return [
        {
          code: def.code,
          scope: card.teamId ? ("company" as const) : ("market" as const),
          companyId: card.teamId ?? undefined,
          roundsLeft: def.duration,
          modifiers: def.modifiers,
        },
      ];
    });
    const output = simulateRound({
      scenario,
      roundIndex,
      companies: states,
      decisions: allDecisions,
      activeEvents: [...activeEvents, ...injected],
      seed: game.seed,
    });
    /** Événements visibles par une équipe : portée marché + ceux qui la ciblent. */
    const roundEventCodesFor = (teamId: string): string[] =>
      [...injected, ...output.newEvents]
        .filter((e) => e.scope === "market" || e.companyId === teamId)
        .map((e) => e.code);

    // Persistance (idempotente)
    await db
      .insert(decisions)
      .values(
        teamRows.map((t) => ({
          roundId: roundRow.id,
          teamId: t.id,
          payload: allDecisions[t.id]!,
          status: carriedOver.has(t.id) ? ("carried_over" as const) : ("locked" as const),
          validatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [decisions.roundId, decisions.teamId],
        set: { status: "locked" },
      });

    await db
      .insert(roundResults)
      .values(
        teamRows.map((t) => {
          const r = output.results[t.id]!;
          return {
            roundId: roundRow.id,
            teamId: t.id,
            incomeStatement: r.incomeStatement,
            balanceSheet: r.balanceSheet,
            cashFlow: r.cashFlow,
            marketDetail: r.market.bySegment,
            engineTrace: {
              production: r.production,
              breakeven: r.breakeven,
              events: roundEventCodesFor(t.id),
              extraOrders: r.extraOrders ?? null,
              orderOffer: r.orderOffer ?? null,
              studies: r.studies ?? null,
              capital: r.capital ?? null,
              insurance: r.insurance ?? null,
              // Le fournisseur était LU à la relecture et jamais ÉCRIT : le
              // choix disparaissait du panneau de résultats dès la clôture.
              supplier: r.supplier ?? null,
              hr: r.hr ?? null,
              investment: r.investment ?? null,
              qualityCosts: r.qualityCosts ?? null,
              debt: r.debt ?? null,
              treasury: r.treasury ?? null,
              bank: r.bank ?? null,
            },
            revenue: toMoney(r.incomeStatement.revenue),
            netIncome: toMoney(r.incomeStatement.netIncome),
            cash: toMoney(r.balanceSheet.cash),
            frng: toMoney(r.functionalBalance.frng),
            bfr: toMoney(r.functionalBalance.bfr),
            netTreasury: toMoney(r.functionalBalance.netTreasury),
            marketShare: r.market.totalShare.toFixed(6),
          };
        }),
      )
      .onConflictDoNothing();

    await db
      .insert(kpis)
      .values(
        teamRows.flatMap((t) =>
          Object.entries(output.results[t.id]!.kpis).map(([kpiCode, value]) => ({
            roundId: roundRow.id,
            teamId: t.id,
            kpiCode,
            value: Number.isFinite(value) ? value.toFixed(4) : "0",
          })),
        ),
      )
      .onConflictDoNothing();

    await db
      .insert(companyStates)
      .values(output.companies.map((state) => ({ teamId: state.id, roundIndex, state })))
      .onConflictDoNothing();

    const finished = roundIndex >= scenario.roundsCount;
    await db
      .update(rounds)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(eq(rounds.id, roundRow.id));
    if (!finished) {
      await db
        .update(rounds)
        .set({ status: "open" })
        .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex + 1)));
    }
    await db
      .update(games)
      .set({
        currentRound: finished ? roundIndex : roundIndex + 1,
        status: finished ? "finished" : "running",
        difficultyProfile: {
          ...(game.difficultyProfile as object),
          activeEvents: output.events,
          pendingEvents: [],
          pendingEventCodes: undefined,
        },
      })
      .where(eq(games.id, gameId));

    // Moteur pédagogique d'abord (doc 03) : le débriefing calcule les scores
    // de situations dont dépend la dimension « maîtrise des modèles » du BPI
    await debriefRound(gameId, roundIndex);

    // Scoring BPI du tour (doc 08) puis classement de partie
    await persistRoundScores({ gameId, roundId: roundRow.id, scenario, teamRows, output, allDecisions });
    await updateRankings(gameId, teamRows.map((t) => t.id));

    if (!finished) {
      await openSituationsForRound(gameId, roundIndex + 1, output.results);
    }
    return { roundIndex, finished };
  } catch (error) {
    // libère le verrou pour permettre une nouvelle tentative
    await db
      .update(rounds)
      .set({ status: "open" })
      .where(and(eq(rounds.id, roundRow.id), eq(rounds.status, "resolving")));
    throw error;
  }
}

/** Genre d'une partie (solo / classe). */
export async function getGameKind(gameId: string): Promise<GameKind> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  return ((game.difficultyProfile as { kind?: GameKind }).kind ?? "solo") as GameKind;
}

/** Mode solo : valider ses décisions ET résoudre immédiatement (ADR-04). */
export async function resolveCurrentRound(args: {
  gameId: string;
  userId: string;
  playerDecisions: RoundDecisions;
}): Promise<{ roundIndex: number; finished: boolean }> {
  await submitTeamDecisions({
    gameId: args.gameId,
    userId: args.userId,
    payload: args.playerDecisions,
  });
  return resolveGameRound(args.gameId);
}

/**
 * Tirage manuel d'une carte événement par l'enseignant (animation de classe).
 * Mode apprentissage uniquement : en compétition, seul le tirage seedé fait
 * foi (équité). La carte est ANNONCÉE aux joueurs et appliquée à la clôture
 * du tour courant. Cartes de portée marché uniquement (équité du tirage manuel).
 */
export async function drawEventCardForNextRound(args: {
  gameId: string;
  teacherId: string;
  eventCode?: string;
  /** Carte « équipe » : l'équipe ciblée (tirage physique par équipe en classe). */
  teamId?: string;
}): Promise<{ eventCode: string; teamId: string | null }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.createdBy !== args.teacherId)
    throw new Error("Seul l'enseignant qui a créé la partie peut tirer une carte");
  if (game.status !== "running") throw new Error("Cette partie est terminée");
  if (game.mode !== "learning")
    throw new Error("Mode compétition : seul le tirage aléatoire seedé fait foi (équité)");

  const targetTeamId = args.teamId ?? null;
  if (targetTeamId) {
    const team = (
      await db
        .select()
        .from(teams)
        .where(and(eq(teams.id, targetTeamId), eq(teams.gameId, args.gameId)))
    )[0];
    if (!team || team.controller !== "human")
      throw new Error("Équipe ciblée introuvable dans cette partie");
  }

  const scenario = parseScenarioConfig(game.scenarioSnapshot);
  const scenarioCodes = new Set(scenario.events.map((e) => e.code));
  // deck marché (toute la classe) ou deck équipe (carte ciblée)
  const pool = (targetTeamId ? TEAM_CARD_CODES : TEACHER_DRAWABLE_CODES).filter((code) =>
    scenarioCodes.has(code),
  );
  if (pool.length === 0) throw new Error("Aucune carte tirable dans ce scénario");

  const pending = readPendingEvents(game.difficultyProfile);
  if (pending.length >= 4) throw new Error("Quatre cartes sont déjà en jeu pour ce tour");
  if (targetTeamId && pending.filter((p) => p.teamId === targetTeamId).length >= 1)
    throw new Error("Cette équipe a déjà une carte en jeu ce tour");
  if (!targetTeamId && pending.filter((p) => p.teamId === null).length >= 2)
    throw new Error("Deux cartes « toute la classe » sont déjà en jeu pour ce tour");

  const activeEvents = (game.difficultyProfile as { activeEvents?: EventInstance[] })
    ?.activeEvents;
  const activeCodes = new Set(
    (Array.isArray(activeEvents) ? activeEvents : []).map((e) => e.code),
  );
  const candidates = pool.filter(
    (c) =>
      !activeCodes.has(c) &&
      !pending.some((p) => p.code === c && p.teamId === targetTeamId),
  );
  if (candidates.length === 0) throw new Error("Toutes les cartes de ce deck sont déjà en jeu");

  let eventCode: string;
  if (args.eventCode) {
    if (!candidates.includes(args.eventCode))
      throw new Error("Cette carte n'est pas tirable actuellement");
    eventCode = args.eventCode;
  } else {
    eventCode = candidates[randomInt(candidates.length)]!;
  }

  await db
    .update(games)
    .set({
      difficultyProfile: {
        ...(game.difficultyProfile as object),
        pendingEvents: [...pending, { code: eventCode, teamId: targetTeamId }],
        pendingEventCodes: undefined,
      },
    })
    .where(eq(games.id, args.gameId));
  return { eventCode, teamId: targetTeamId };
}

/** Mode classe : l'enseignant (créateur de la partie) clôt le tour courant. */
export async function closeCurrentRound(args: {
  gameId: string;
  teacherId: string;
}): Promise<{ roundIndex: number; finished: boolean }> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game) throw new Error("Partie introuvable");
  if (game.createdBy !== args.teacherId)
    throw new Error("Seul l'enseignant qui a créé la partie peut clore un tour");
  return resolveGameRound(args.gameId);
}

/** Scores BPI du tour (doc 08 §1) : 7 dimensions par équipe, persistées. */
async function persistRoundScores(args: {
  gameId: string;
  roundId: string;
  scenario: EngineScenarioConfig;
  teamRows: { id: string; controller: "human" | "bot" }[];
  output: ReturnType<typeof simulateRound>;
  allDecisions: Record<string, RoundDecisions>;
}): Promise<void> {
  // Entrées pédagogiques : scores des situations débriefées de CE tour
  const instances = await db
    .select()
    .from(situationInstances)
    .where(eq(situationInstances.roundId, args.roundId));
  const pedagogyByTeam = new Map<string, PedagogyInputs>();
  for (const instance of instances) {
    const diag = instance.diagnosis as { score?: number; finalScore?: number } | null;
    const entry = pedagogyByTeam.get(instance.teamId) ?? { situationScores: [], diagnosisScores: [] };
    if (typeof diag?.finalScore === "number") entry.situationScores.push(diag.finalScore);
    if (typeof diag?.score === "number") entry.diagnosisScores.push(diag.score);
    pedagogyByTeam.set(instance.teamId, entry);
  }

  const roundScores = computeRoundScores(
    args.scenario,
    args.teamRows.map((t) => ({
      companyId: t.id,
      decisions: args.allDecisions[t.id]!,
      result: args.output.results[t.id]!,
      pedagogy: pedagogyByTeam.get(t.id) ?? { situationScores: [], diagnosisScores: [] },
    })),
  );

  await db
    .insert(scores)
    .values(
      roundScores.flatMap((s) =>
        BPI_DIMENSIONS.map((dimension) => ({
          roundId: args.roundId,
          teamId: s.companyId,
          dimension,
          raw: s.raw[dimension].toFixed(4),
          normalized: s.normalized[dimension].toFixed(2),
        })),
      ),
    )
    .onConflictDoNothing();
}

/** Classement au BPI (doc 08 §1.4) : tours à poids croissants, départage financier. */
async function updateRankings(gameId: string, teamIds: string[]): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) return;
  const scenario = parseScenarioConfig(game.scenarioSnapshot);
  const weights = scoringWeights(scenario.scoring);

  const gameRounds = (await db.select().from(rounds).where(eq(rounds.gameId, gameId))).sort(
    (a, b) => a.index - b.index,
  );
  const roundIds = gameRounds.map((r) => r.id);
  const scoreRows = roundIds.length
    ? await db.select().from(scores).where(inArray(scores.roundId, roundIds))
    : [];
  const resultRows = roundIds.length
    ? await db.select().from(roundResults).where(inArray(roundResults.roundId, roundIds))
    : [];

  const entries = teamIds.map((teamId) => {
    // BPI par tour = Σ poids × dimension normalisée
    const roundBpis: number[] = [];
    const dimensionSums = new Map<BpiDimension, { sum: number; n: number }>();
    for (const round of gameRounds) {
      const rows = scoreRows.filter((s) => s.roundId === round.id && s.teamId === teamId);
      if (rows.length === 0) continue;
      let bpi = 0;
      for (const row of rows) {
        const dimension = row.dimension as BpiDimension;
        const value = Number(row.normalized);
        bpi += (weights[dimension] ?? 0) * value;
        const agg = dimensionSums.get(dimension) ?? { sum: 0, n: 0 };
        agg.sum += value;
        agg.n += 1;
        dimensionSums.set(dimension, agg);
      }
      roundBpis.push(bpi);
    }
    const teamResults = resultRows.filter((r) => r.teamId === teamId);
    const cumulativeNetIncome = teamResults.reduce((sum, r) => sum + Number(r.netIncome), 0);
    const lastTreasury = teamResults.length
      ? Number(
          teamResults.sort(
            (a, b) => roundIds.indexOf(a.roundId) - roundIds.indexOf(b.roundId),
          ).at(-1)!.netTreasury,
        )
      : 0;
    const financialAvg = dimensionSums.get("financial");
    return {
      teamId,
      bpi: gameBpi(roundBpis),
      roundBpis,
      cumulativeNetIncome,
      lastTreasury,
      financialAvg: financialAvg ? financialAvg.sum / financialAvg.n : 0,
      dimensions: Object.fromEntries(
        [...dimensionSums.entries()].map(([d, { sum, n }]) => [d, sum / n]),
      ),
    };
  });

  // départage (doc 04) : BPI, puis dimension financière, puis trésorerie finale
  entries.sort(
    (a, b) => b.bpi - a.bpi || b.financialAvg - a.financialAvg || b.lastTreasury - a.lastTreasury,
  );
  for (const [rank, entry] of entries.entries()) {
    const detail = {
      cumulativeNetIncome: entry.cumulativeNetIncome,
      roundBpis: entry.roundBpis.map((v) => Math.round(v * 100) / 100),
      dimensions: entry.dimensions,
    };
    await db
      .insert(gameRankings)
      .values({ gameId, teamId: entry.teamId, bpi: entry.bpi.toFixed(2), rank: rank + 1, detail })
      .onConflictDoUpdate({
        target: [gameRankings.gameId, gameRankings.teamId],
        set: { bpi: entry.bpi.toFixed(2), rank: rank + 1, detail },
      });
  }
}

// ---------------------------------------------------------------------------
// Lecture : vue joueur
// ---------------------------------------------------------------------------

export interface GameView {
  gameId: string;
  kind: GameKind;
  status: string;
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  playerTeamId: string;
  playerTeamName: string;
  /** Décisions déjà validées par l'équipe pour le tour courant (mode classe). */
  pendingDecisions: RoundDecisions | null;
  /** Cartes événement annoncées par l'enseignant pour le tour courant. */
  announcedEventCards: {
    code: string;
    /** null = carte marché (toute la classe) ; sinon l'équipe ciblée. */
    teamId: string | null;
    teamName: string | null;
    isMyTeam: boolean;
  }[];
  lastResult: CompanyRoundResult | null;
  /**
   * La prévision du tour écoulé face au réalisé. Null si le joueur n'a rien
   * annoncé : on ne reproche pas une prévision qui n'a pas été faite.
   */
  forecastReview: {
    round: number;
    lines: {
      label: string;
      forecast: number;
      actual: number;
      /** Écart relatif, null quand la prévision est nulle (division impossible). */
      relative: number | null;
      format: "units" | "euro";
    }[];
  } | null;
  /**
   * Historique des ventes, tour par tour et clientèle par clientèle. Ce sont
   * VOS données : elles sont gratuites, comme les comptes. Deux colonnes par
   * segment, la demande du marché et vos ventes, parce qu'une prévision se
   * construit sur les deux : la taille du marché donne la saison, votre part
   * dit ce que votre prix en a capté.
   */
  salesHistory: {
    segments: string[];
    rounds: {
      round: number;
      price: number | null;
      /** Ce que le joueur avait annoncé pour ce tour, s'il l'a fait. */
      forecastUnits: number | null;
      bySegment: { potential: number; sold: number }[];
      sold: number;
      lost: number;
    }[];
  };
  /**
   * Le contexte des tours 2 et suivants, calculé sur le tour écoulé : le
   * constat et l'arbitrage qui en découle. Null au tour 1, dont le contexte
   * est écrit d'avance dans le scénario (`intro`).
   */
  roundBriefing: RoundBriefing | null;
  lastEvents: string[];
  history: { round: number; revenue: number; netIncome: number; netTreasury: number }[];
  ranking: {
    name: string;
    isPlayer: boolean;
    cumulativeNetIncome: number;
    rank: number;
    bpi: number;
  }[];
  /** Moyennes 0-100 des 7 dimensions BPI de l'équipe du joueur (doc 08). */
  playerDimensions: Partial<Record<BpiDimension, number>> | null;
  lastDecisions: RoundDecisions | null;
  /**
   * Le point de départ du secteur, servi au tour 1 quand il n'y a encore rien
   * à reconduire. Calculé ici parce que c'est ici qu'on a le scénario joué ET
   * l'état de l'entreprise : la page, elle, proposait les chiffres de NOVA à
   * tout le monde.
   */
  startingDecisions: RoundDecisions;
  /** Offre d'assurance du scénario (prime déjà à l'échelle de la périodicité). */
  insuranceOffer: { premium: number; coveredEventCodes: string[] } | null;
  /** Formules d'assurance (si le scénario en propose plusieurs). */
  insuranceFormulas: {
    code: string;
    name: string;
    premium: number;
    coveredLabels: string[];
  }[] | null;
  /** Fournisseurs disponibles (si le scénario en propose). */
  suppliersOffer: {
    code: string;
    name: string;
    narrative: string;
    costMultiplier: number;
    qualityBonus: number;
    paymentDelayDays: number;
    supplyRiskProbability: number;
    materialCostPerUnit: number;
  }[] | null;
  /** Capacité de production : machine, main-d'œuvre et goulot. */
  capacityFacts: {
    machineCapacity: number;
    laborCapacity: number;
    bottleneck: "machine" | "labor" | "balanced";
    headcount: number;
    hoursPerEmployee: number;
    productivity: number;
    hoursPerUnit: number;
  } | null;
  /**
   * Vocabulaire du secteur joué : on ne vend pas des « unités » dans un hôtel
   * et on n'y a pas de « machines ». Il vient du registre via le code du
   * snapshot, donc une partie garde le vocabulaire de son scénario.
   */
  vocabulary: ScenarioVocabulary;
  /**
   * Noms des segments du snapshot joué, par code. Sans cela le tableau du
   * marché retomberait sur les codes bruts dès qu'on quitte NOVA.
   */
  segmentNames: Record<string, string>;
  /**
   * Indicateurs du métier joué (RevPAR en hôtellerie, ratio matières en
   * restauration…), déjà calculés : l'arène ne fait que les mettre en forme.
   */
  sectorKpis: {
    key: string;
    label: string;
    hint: string;
    format: KpiFormat;
    value: number;
  }[];
  /**
   * Présentation du tour 1, calculée sur le SNAPSHOT joué : chiffres réels de
   * la partie (capacité, structure, coût variable) et vrais concurrents, au
   * lieu d'un texte écrit pour un seul scénario.
   */
  intro: {
    title: string;
    /**
     * Nom de l'ENTREPRISE reprise, qui n'est pas toujours celui de l'équipe :
     * en classe, l'équipe s'appelle « Équipe 3 ». La phrase d'accueil présente
     * la maison, pas l'équipe.
     */
    company: string;
    tagline: string;
    briefing: string;
    context: string;
    dilemma: {
      question: string;
      routes: { label: string; gain: string; risque: string }[];
    };
    capacity: number;
    fixedCostsPerRound: number;
    variableCostPerUnit: number;
    /** Trésorerie d'ouverture : de quoi tenir combien de temps ? */
    cash: number;
    /**
     * Le marché tel qu'il est JOUÉ, segment par segment. Les tailles, les prix
     * de référence et les délais de règlement viennent du snapshot : ce sont
     * ceux de la partie, périodicité et réglages de l'enseignant compris.
     */
    segments: {
      name: string;
      size: number;
      refPrice: number;
      paymentDelayDays: number;
      /** Votre part sur ce segment au tour écoulé. Null au tour 1. */
      yourShare: number | null;
    }[];
    competitors: string[];
  };
  /** Niveau de difficulté (préréglage en données, doc 08 §2). */
  difficulty: { level: number; name: string; hintMaxLevel: number };
  /** Décisions exposées à ce niveau (prix/production/marketing : toujours). */
  enabledDecisions: {
    quality: boolean;
    maintenance: boolean;
    finance: boolean;
    insurance: boolean;
    hr: boolean;
    investment: boolean;
    placement: boolean;
    dividend: boolean;
  };
  /**
   * Réserves distribuables : les bénéfices des tours passés non encore versés
   * aux associés. C'est le plafond du dividende, et l'élève doit le connaître
   * avant de décider, sans quoi il propose un chiffre au hasard.
   */
  distributableReserves: number;
  /** Saison du tour courant : coefficients ≠ 1 (marché global et segments). */
  seasonNotes: { name: string; coef: number }[];
  /** Investissement proposé par le scénario (échelle de la périodicité). */
  investmentOffer: { costPerCapacityUnit: number; maxPerRound: number } | null;
  /** Échéance d'emprunt obligatoire du prochain tour et dette restante. */
  debtSchedule: { nextMandatory: number; outstanding: number } | null;
  /**
   * DOSSIER BANCAIRE : ce que la banque consent pour le tour à jouer, au vu
   * des plans de trésorerie déposés jusqu'ici, et son verdict sur le dernier.
   * `null` quand le scénario n'ouvre pas de dossier bancaire.
   */
  bankFile: {
    /** Confiance actuelle, de 0 à 1. */
    trust: number;
    /** Plafond de découvert consenti pour le tour à jouer. */
    overdraftLimit: number;
    /** Plafond nominal du scénario, celui d'une confiance pleine. */
    fullOverdraftLimit: number;
    /** Taux de découvert applicable au tour à jouer. */
    overdraftAnnualRate: number;
    /** Emprunt demandé et refusé au tour précédent faute de plan. */
    refusedLoan: number | null;
    /** Fiabilité du dernier plan déposé (0..1) ; null si aucun. */
    lastReliability: number | null;
  } | null;
  /** Outils de trésorerie du scénario (taux affichés dans le formulaire). */
  treasuryOffer: {
    discountAnnualRate: number;
    discountMaxShare: number;
    factoringFeeRate: number;
    overdraftLimit: number;
    /** Taux du placement, absent si le scénario n'en propose pas. */
    placementAnnualRate: number | null;
    /** Trésorerie placée au tour précédent, revenue en caisse à l'ouverture. */
    maturedPlacement: number;
  } | null;
  /**
   * Commande exceptionnelle proposée pour le tour courant (rotation du pool,
   * doc 02 §5.1) — avec le coût variable unitaire pour poser l'arbitrage.
   */
  orderOffer: {
    code: string;
    title: string;
    narrative: string;
    units: number;
    price: number;
    paymentDelayDays: number;
    unitVariableCost: number;
    refPrice: number;
  } | null;
  /** Coûts unitaires du scénario (après surcharges éco) — analyse des coûts. */
  costFacts: { materialCostPerUnit: number; otherVariableCostPerUnit: number };
  /** Enveloppe d'augmentation de capital des associés (null = illimitée). */
  capitalAllowance: { total: number; remaining: number } | null;
  /** Catalogue d'études du scénario (prix à l'échelle de la périodicité). */
  studiesOffer: {
    marketCost: number;
    priceCost: number;
    financeCost: number;
    projectCost: number;
  } | null;
  /** Rapports des études achetées au dernier tour résolu (doc 02 §8bis). */
  studyReports: StudyReports | null;
}

/** Rapports d'études : des données riches et variées pour décider. */
export interface StudyReports {
  round: number;
  cost: number;
  market?: {
    segments: {
      name: string;
      potential: number;
      yourShare: number;
      yourSold: number;
      yourLost: number;
    }[];
    competitors: {
      name: string;
      isPlayer: boolean;
      avgPrice: number | null;
      marketShare: number;
      revenue: number;
      netIncome: number;
    }[];
  };
  price?: {
    yourPrice: number;
    segments: {
      name: string;
      refPrice: number;
      elasticity: number;
      minAcceptablePrice: number;
      thresholds: number[];
    }[];
  };
  finance?: {
    ratios: {
      profitability: number;
      returnOnCapitalEmployed: number;
      returnOnEquity: number;
      debtToEquity: number;
      assetTurnover: number;
    };
    costs: {
      unitVariableCost: number;
      unitMargin: number;
      breakEvenUnits: number;
      safetyMargin: number;
    };
    sector: { teams: number; avgRevenue: number; avgNetIncome: number; avgNetTreasury: number };
  };
  project?: {
    investment: {
      capacityUnits: number;
      outlay: number;
      lostUnits: number;
      unitMargin: number;
      ratePerRound: number;
      rounds: number;
      npv: number;
      irr: number | null;
      paybackRounds: number | null;
    } | null;
    currentOffer: {
      title: string;
      units: number;
      price: number;
      margin: number;
      carryCost: number;
      paymentDelayDays: number;
    } | null;
  };
}

export async function getGameView(gameId: string, userId: string): Promise<GameView | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) return null;
  const playerTeam = await findUserTeam(gameId, userId);
  if (!playerTeam) return null;
  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));

  const gameRounds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.gameId, gameId))
    .orderBy(asc(rounds.index));
  const resolved = gameRounds.filter((r) => r.status === "resolved");
  const roundIndexById = new Map(gameRounds.map((r) => [r.id, r.index]));

  const gameResults = await db
    .select()
    .from(roundResults)
    .where(inArray(roundResults.roundId, gameRounds.map((r) => r.id)));

  const history = gameResults
    .filter((r) => r.teamId === playerTeam.id)
    .map((r) => ({
      round: roundIndexById.get(r.roundId)!,
      revenue: Number(r.revenue),
      netIncome: Number(r.netIncome),
      netTreasury: Number(r.netTreasury),
    }))
    .sort((a, b) => a.round - b.round);

  // Historique des ventes : les décisions de TOUS les tours joués, pour
  // remettre le prix pratiqué en face des volumes qu'il a produits. Sans le
  // prix, la série des ventes ne s'explique pas.
  const playerDecisionRows = await db
    .select()
    .from(decisions)
    .where(
      and(
        inArray(decisions.roundId, gameRounds.map((r) => r.id)),
        eq(decisions.teamId, playerTeam.id),
      ),
    );
  const priceByRound = new Map(
    playerDecisionRows.map((d) => [
      roundIndexById.get(d.roundId)!,
      (d.payload as RoundDecisions).price ?? null,
    ]),
  );
  const forecastByRound = new Map(
    playerDecisionRows.map((d) => [
      roundIndexById.get(d.roundId)!,
      (d.payload as RoundDecisions).forecast ?? null,
    ]),
  );

  const lastRound = resolved.at(-1);
  let lastResult: CompanyRoundResult | null = null;
  let lastEvents: string[] = [];
  let lastDecisions: RoundDecisions | null = null;
  if (lastRound) {
    const row = gameResults.find((r) => r.roundId === lastRound.id && r.teamId === playerTeam.id);
    if (row) {
      const trace = row.engineTrace as {
        production: CompanyRoundResult["production"];
        breakeven: CompanyRoundResult["breakeven"];
        events: string[];
        extraOrders?: CompanyRoundResult["extraOrders"] | null;
        orderOffer?: CompanyRoundResult["orderOffer"] | null;
        studies?: CompanyRoundResult["studies"] | null;
        capital?: CompanyRoundResult["capital"] | null;
        insurance?: CompanyRoundResult["insurance"] | null;
        supplier?: CompanyRoundResult["supplier"] | null;
        hr?: CompanyRoundResult["hr"] | null;
        investment?: CompanyRoundResult["investment"] | null;
        qualityCosts?: CompanyRoundResult["qualityCosts"] | null;
        debt?: CompanyRoundResult["debt"] | null;
        treasury?: CompanyRoundResult["treasury"] | null;
        bank?: CompanyRoundResult["bank"] | null;
      };
      lastResult = {
        companyId: playerTeam.id,
        incomeStatement: row.incomeStatement as CompanyRoundResult["incomeStatement"],
        balanceSheet: row.balanceSheet as CompanyRoundResult["balanceSheet"],
        cashFlow: row.cashFlow as CompanyRoundResult["cashFlow"],
        functionalBalance: {
          frng: Number(row.frng),
          bfr: Number(row.bfr),
          netTreasury: Number(row.netTreasury),
        },
        ratios: {} as CompanyRoundResult["ratios"],
        market: {
          bySegment: row.marketDetail as CompanyRoundResult["market"]["bySegment"],
          totalShare: Number(row.marketShare),
        },
        production: trace.production,
        breakeven: trace.breakeven,
        extraOrders: trace.extraOrders ?? undefined,
        orderOffer: trace.orderOffer ?? undefined,
        studies: trace.studies ?? undefined,
        capital: trace.capital ?? undefined,
        insurance: trace.insurance ?? undefined,
        supplier: trace.supplier ?? undefined,
        hr: trace.hr ?? undefined,
        investment: trace.investment ?? undefined,
        qualityCosts: trace.qualityCosts ?? undefined,
        debt: trace.debt ?? undefined,
        treasury: trace.treasury ?? undefined,
        bank: trace.bank ?? undefined,
        kpis: {},
      };
      lastEvents = trace.events ?? [];
    }
    const decisionRow = (
      await db
        .select()
        .from(decisions)
        .where(and(eq(decisions.roundId, lastRound.id), eq(decisions.teamId, playerTeam.id)))
    )[0];
    if (decisionRow) lastDecisions = decisionRow.payload as RoundDecisions;
  }

  // Décisions déjà soumises pour le tour courant (mode classe : en attente de clôture)
  let pendingDecisions: RoundDecisions | null = null;
  const currentRoundRow = gameRounds.find((r) => r.index === game.currentRound);
  if (currentRoundRow && currentRoundRow.status === "open") {
    const row = (
      await db
        .select()
        .from(decisions)
        .where(
          and(eq(decisions.roundId, currentRoundRow.id), eq(decisions.teamId, playerTeam.id)),
        )
    )[0];
    if (row && row.status === "validated") pendingDecisions = row.payload as RoundDecisions;
  }

  // dernier état persisté de l'équipe (échéanciers d'emprunts pour l'affichage)
  const stateRow = (
    await db
      .select()
      .from(companyStates)
      .where(eq(companyStates.teamId, playerTeam.id))
      .orderBy(desc(companyStates.roundIndex))
      .limit(1)
  )[0];
  const currentState = stateRow?.state as
    | { loans?: { remaining: number; perRound: number }[]; bankTrust?: number }
    | undefined;

  const rankingRows = await db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId));
  const ranking = rankingRows
    .map((r) => {
      const team = teamRows.find((t) => t.id === r.teamId);
      return {
        name: teamDisplayName(team?.name ?? "?"),
        isPlayer: r.teamId === playerTeam.id,
        cumulativeNetIncome: Number(
          (r.detail as { cumulativeNetIncome?: number })?.cumulativeNetIncome ?? 0,
        ),
        rank: r.rank,
        bpi: Number(r.bpi),
      };
    })
    .sort((a, b) => a.rank - b.rank);
  const playerRankingRow = rankingRows.find((r) => r.teamId === playerTeam.id);
  const playerDimensions =
    ((playerRankingRow?.detail as { dimensions?: Partial<Record<BpiDimension, number>> })
      ?.dimensions as Partial<Record<BpiDimension, number>> | undefined) ?? null;

  // Rapports des études achetées au dernier tour résolu (doc 02 §8bis) :
  // construits à la lecture depuis les résultats persistés — la facture est
  // déjà dans les comptes, ici on livre l'information payée.
  const studyReports: StudyReports | null = await (async () => {
    const purchased = lastResult?.studies?.purchased ?? [];
    if (!lastRound || !lastResult || purchased.length === 0) return null;
    const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
    const cvu =
      snapshot.product.materialCostPerUnit + snapshot.product.otherVariableCostPerUnit;
    const lastRows = gameResults.filter((r) => r.roundId === lastRound.id);
    const reports: StudyReports = {
      round: lastRound.index,
      cost: lastResult.studies?.cost ?? 0,
    };

    if (purchased.includes("market")) {
      const own = lastResult.market.bySegment;
      reports.market = {
        segments: snapshot.market.segments.map((seg) => {
          const d = own[seg.code];
          return {
            name: seg.name,
            potential: d?.potential ?? 0,
            yourShare: d?.share ?? 0,
            yourSold: d?.sold ?? 0,
            yourLost: d?.lost ?? 0,
          };
        }),
        competitors: lastRows
          .map((row) => {
            const detail = row.marketDetail as Record<
              string,
              { sold?: number }
            > | null;
            const units = detail
              ? Object.values(detail).reduce((sum, d) => sum + (d.sold ?? 0), 0)
              : 0;
            return {
              name: teamDisplayName(teamRows.find((t) => t.id === row.teamId)?.name ?? "?"),
              isPlayer: row.teamId === playerTeam.id,
              avgPrice: units > 1 ? Number(row.revenue) / units : null,
              marketShare: Number(row.marketShare),
              revenue: Number(row.revenue),
              netIncome: Number(row.netIncome),
            };
          })
          .sort((a, b) => b.marketShare - a.marketShare),
      };
    }

    if (purchased.includes("price")) {
      reports.price = {
        yourPrice: lastDecisions?.price ?? 0,
        segments: snapshot.market.segments.map((seg) => ({
          name: seg.name,
          refPrice: seg.refPrice,
          elasticity: Math.round(seg.priceElasticity * 10) / 10,
          minAcceptablePrice: seg.minAcceptablePrice,
          thresholds: (seg.psychThresholds ?? []).map((t) => t.threshold),
        })),
      };
    }

    if (purchased.includes("finance")) {
      const ratios = computeRatios(
        lastResult.incomeStatement,
        lastResult.balanceSheet,
        snapshot.finance.taxRate,
      );
      const others = lastRows.filter((r) => r.teamId !== playerTeam.id);
      const avg = (pick: (r: (typeof lastRows)[number]) => number) =>
        others.length > 0 ? others.reduce((sum, r) => sum + pick(r), 0) / others.length : 0;
      reports.finance = {
        ratios: {
          profitability: ratios.profitability,
          returnOnCapitalEmployed: ratios.returnOnCapitalEmployed,
          returnOnEquity: ratios.returnOnEquity,
          debtToEquity: ratios.debtToEquity,
          assetTurnover: ratios.assetTurnover,
        },
        costs: {
          unitVariableCost: cvu,
          unitMargin: (lastDecisions?.price ?? 0) - cvu,
          breakEvenUnits: lastResult.breakeven.breakEvenUnits,
          safetyMargin: lastResult.breakeven.safetyMargin,
        },
        sector: {
          teams: others.length,
          avgRevenue: avg((r) => Number(r.revenue)),
          avgNetIncome: avg((r) => Number(r.netIncome)),
          avgNetTreasury: avg((r) => Number(r.netTreasury)),
        },
      };
    }

    if (purchased.includes("project")) {
      const inv = snapshot.investment;
      const lostUnits = Object.values(lastResult.market.bySegment).reduce(
        (sum, d) => sum + d.lost,
        0,
      );
      const unitMargin = (lastDecisions?.price ?? snapshot.market.segments[0]?.refPrice ?? 0) - cvu;
      let investment: NonNullable<StudyReports["project"]>["investment"] = null;
      if (inv) {
        const outlay = inv.maxPerRound * inv.costPerCapacityUnit;
        const ratePerRound = (snapshot.finance.loanAnnualRate * snapshot.roundDays) / 360;
        const rounds = Math.round(inv.depreciationRounds);
        const extraSold = Math.min(lostUnits, inv.maxPerRound);
        const flowPerRound = extraSold * unitMargin;
        const flows = [-outlay, ...Array.from({ length: rounds }, () => flowPerRound)];
        investment = {
          capacityUnits: inv.maxPerRound,
          outlay,
          lostUnits,
          unitMargin,
          ratePerRound,
          rounds,
          npv: npv(flows, ratePerRound),
          irr: irr(flows),
          paybackRounds: paybackPeriod(flows),
        };
      }
      const offer = orderOfferForRound(snapshot, game.currentRound, game.seed);
      reports.project = {
        investment,
        currentOffer: offer
          ? {
              title: offer.title,
              units: offer.units,
              price: offer.price,
              margin: offer.units * (offer.price - cvu),
              carryCost:
                offer.units *
                offer.price *
                (offer.paymentDelayDays / 360) *
                snapshot.finance.overdraftAnnualRate,
              paymentDelayDays: offer.paymentDelayDays,
            }
          : null,
      };
    }
    return reports;
  })();

  const profile = game.difficultyProfile as { kind?: GameKind };
  return {
    gameId,
    kind: profile.kind ?? "solo",
    status: game.status,
    currentRound: game.currentRound,
    roundsCount: (game.scenarioSnapshot as { roundsCount: number }).roundsCount,
    roundDays: (game.scenarioSnapshot as { roundDays: number }).roundDays,
    playerTeamId: playerTeam.id,
    playerTeamName: teamDisplayName(playerTeam.name),
    pendingDecisions,
    announcedEventCards: readPendingEvents(game.difficultyProfile).map((card) => {
      const target = card.teamId ? teamRows.find((t) => t.id === card.teamId) : undefined;
      return {
        code: card.code,
        teamId: card.teamId,
        teamName: target?.name ?? null,
        isMyTeam: card.teamId === playerTeam.id,
      };
    }),
    lastResult,
    forecastReview: (() => {
      if (!lastRound || !lastResult) return null;
      const round = roundIndexById.get(lastRound.id)!;
      const forecast = forecastByRound.get(round);
      if (!forecast) return null;
      // Tout ce qui a été vendu, commande exceptionnelle comprise : c'est ce
      // que le moteur compare au plan, et l'élève savait en décidant s'il
      // acceptait la commande.
      const sold =
        Object.values(lastResult.market.bySegment).reduce((sum, d) => sum + d.sold, 0) +
        (lastResult.extraOrders?.delivered ?? 0) +
        (lastResult.orderOffer?.delivered ?? 0);
      const lines: {
        label: string;
        forecast: number;
        actual: number;
        relative: number | null;
        format: "units" | "euro";
      }[] = [];
      const push = (
        label: string,
        expected: number | undefined,
        actual: number,
        format: "units" | "euro",
      ) => {
        if (expected === undefined) return;
        lines.push({
          label,
          forecast: expected,
          actual,
          // Une prévision nulle rend l'écart relatif indéfini : mieux vaut ne
          // rien afficher qu'un pourcentage infini.
          relative: Math.abs(expected) > 0.5 ? (actual - expected) / Math.abs(expected) : null,
          format,
        });
      };
      push("Ventes", forecast.expectedUnits, sold, "units");
      push(
        "Trésorerie nette",
        forecast.expectedCash,
        lastResult.functionalBalance.netTreasury,
        "euro",
      );
      return lines.length > 0 ? { round, lines } : null;
    })(),
    salesHistory: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const codes = snapshot.market.segments.map((seg) => seg.code);
      return {
        segments: snapshot.market.segments.map((seg) => seg.name),
        rounds: gameResults
          .filter((r) => r.teamId === playerTeam.id)
          .map((r) => {
            const detail = r.marketDetail as Record<
              string,
              { potential: number; sold: number; lost: number } | undefined
            >;
            const bySegment = codes.map((code) => ({
              potential: Math.round(detail[code]?.potential ?? 0),
              sold: Math.round(detail[code]?.sold ?? 0),
            }));
            const rows = codes.map((code) => detail[code]);
            const index = roundIndexById.get(r.roundId)!;
            return {
              round: index,
              price: priceByRound.get(index) ?? null,
              forecastUnits: forecastByRound.get(index)?.expectedUnits ?? null,
              bySegment,
              sold: Math.round(rows.reduce((sum, d) => sum + (d?.sold ?? 0), 0)),
              lost: Math.round(rows.reduce((sum, d) => sum + (d?.lost ?? 0), 0)),
            };
          })
          .sort((a, b) => a.round - b.round),
      };
    })(),
    roundBriefing: (() => {
      if (!lastResult) return null;
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const definition = scenarioByCode(snapshot.code);
      const preset = presetFromProfile(game.difficultyProfile);
      return roundBriefing({
        result: lastResult,
        vocabulary: definition.vocabulary,
        enabled: {
          finance: preset.decisions.finance,
          investment: preset.decisions.investment,
          hr: preset.decisions.hr,
        },
        hasTreasuryTools: Boolean(snapshot.treasury),
        hasInvestmentOffer: Boolean(snapshot.investment),
        perishable: Boolean(snapshot.perishable),
      });
    })(),
    lastEvents,
    history,
    ranking,
    playerDimensions,
    lastDecisions,
    startingDecisions: (() => {
      /**
       * Le formulaire n'accepte pas n'importe quel nombre : ses champs
       * avancent par pas de 1, le prix par pas de 0,1. Une valeur par défaut
       * calculée, donc décimale, rend le tour ENTIÈREMENT insoumettable : le
       * navigateur refuse la validation sans message visible, et l'élève clique
       * sans que rien ne se passe. Un défaut proposé doit être soumettable tel
       * quel.
       */
      const auPas = (d: RoundDecisions): RoundDecisions => ({
        ...d,
        price: Math.round(d.price * 10) / 10,
        productionPlan: Math.round(d.productionPlan),
        marketingBudget: Math.round(d.marketingBudget),
        qualityBudget: Math.round(d.qualityBudget),
        maintenanceBudget: Math.round(d.maintenanceBudget),
      });
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const state = stateRow?.state as CompanyState | undefined;
      // Sans état persisté il n'y a pas de capacité à viser : on s'en tient
      // alors au prix de référence du secteur, jamais à celui d'un autre.
      if (!state) {
        const main = [...snapshot.market.segments].sort((a, b) => b.size - a.size)[0];
        return auPas({
          price: main?.refPrice ?? 50,
          productionPlan: 0,
          marketingBudget: 0.5 * snapshot.marketing.scale,
          qualityBudget: 0.5 * snapshot.production.qualityScale,
          maintenanceBudget: snapshot.production.maintenanceReference,
        });
      }
      return auPas(
        neutralDecisions({ scenario: snapshot, state, roundIndex: game.currentRound }),
      );
    })(),
    insuranceOffer: (() => {
      const offer = (
        game.scenarioSnapshot as {
          insurance?: { premiumPerRound: number; coveredEventCodes: string[] };
        }
      ).insurance;
      return offer
        ? { premium: offer.premiumPerRound, coveredEventCodes: offer.coveredEventCodes }
        : null;
    })(),
    insuranceFormulas: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const formulas = snapshot.insurance?.formulas;
      if (!formulas || formulas.length === 0) return null;
      // Le libellé français du deck de cartes, et non la clé technique : c'est
      // le seul endroit de l'écran de décision où l'élève lisait « natural
      // disaster, cold wave ». Les mêmes événements lui seront montrés sous
      // leur nom de carte quand ils tomberont.
      const eventLabels = (codes: string[]) =>
        codes.map((c) => cardByCode.get(c)?.title ?? c.replace(/_/g, " "));
      return formulas.map((f) => ({
        code: f.code,
        name: f.name,
        premium: f.premiumPerRound,
        coveredLabels: eventLabels(f.coveredEventCodes),
      }));
    })(),
    suppliersOffer: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      if (!snapshot.suppliers || snapshot.suppliers.length === 0) return null;
      return snapshot.suppliers.map((s) => ({
        code: s.code,
        name: s.name,
        narrative: s.narrative,
        costMultiplier: s.costMultiplier,
        qualityBonus: s.qualityBonus,
        paymentDelayDays: s.paymentDelayDays,
        supplyRiskProbability: s.supplyRiskProbability,
        materialCostPerUnit: Math.round(snapshot.product.materialCostPerUnit * s.costMultiplier * 100) / 100,
      }));
    })(),
    vocabulary: scenarioByCode(
      (game.scenarioSnapshot as { code?: string } | null)?.code,
    ).vocabulary,
    segmentNames: Object.fromEntries(
      (game.scenarioSnapshot as EngineScenarioConfig).market.segments.map((s) => [
        s.code,
        s.name,
      ]),
    ),
    sectorKpis: (() => {
      if (!lastResult) return [];
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const segmentUnits = Object.values(lastResult.market.bySegment).reduce(
        (sum, s) => sum + s.sold,
        0,
      );
      // Le chiffre d'affaires inclut les commandes fermes et l'offre du tour :
      // les indicateurs par unité doivent compter les mêmes ventes, sans quoi
      // un PMC ou un ticket moyen serait faussé les tours de grosse commande.
      const totalUnits =
        segmentUnits +
        (lastResult.extraOrders?.delivered ?? 0) +
        (lastResult.orderOffer?.delivered ?? 0);
      // Segments du tour précédent : seule donnée nécessaire à l'attrition.
      const previousRound = resolved.at(-2);
      const previousRow = previousRound
        ? gameResults.find(
            (r) => r.roundId === previousRound.id && r.teamId === playerTeam.id,
          )
        : undefined;
      return computeSectorKpis(scenarioByCode(snapshot.code).kpis, {
        result: lastResult,
        previousSegments:
          (previousRow?.marketDetail as CompanyRoundResult["market"]["bySegment"]) ?? null,
        segmentUnits,
        totalUnits,
        roundDays: snapshot.roundDays,
        scenario: snapshot,
      });
    })(),
    intro: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const definition = scenarioByCode(snapshot.code);
      const state = stateRow?.state as CompanyState | undefined;
      return {
        title: definition.title,
        company: definition.playerTeamName,
        tagline: definition.tagline,
        briefing: definition.briefing,
        context: definition.context,
        dilemma: definition.dilemma,
        capacity: Math.round(state?.machineCapacity ?? 0),
        fixedCostsPerRound: snapshot.fixedCostsPerRound,
        variableCostPerUnit:
          snapshot.product.materialCostPerUnit + snapshot.product.otherVariableCostPerUnit,
        cash: Math.round(state?.finance.cash ?? 0),
        segments: snapshot.market.segments.map((seg) => ({
          name: seg.name,
          size: Math.round(seg.size),
          refPrice: seg.refPrice,
          paymentDelayDays: seg.paymentDelayDays,
          yourShare: lastResult?.market.bySegment[seg.code]?.share ?? null,
        })),
        competitors: teamRows
          .filter((t) => t.id !== playerTeam.id)
          .map((t) => teamDisplayName(t.name)),
      };
    })(),
    capacityFacts: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const state = stateRow?.state as CompanyState | undefined;
      if (!state) return null;
      const mc = state.machineCapacity + (state.pendingCapacity ?? 0);
      const lc = (state.headcount * state.hoursPerEmployee * state.productivity) /
        snapshot.product.hoursPerUnit;
      const bottleneck: "machine" | "labor" | "balanced" =
        mc < lc * 0.95 ? "machine" : lc < mc * 0.95 ? "labor" : "balanced";
      return {
        machineCapacity: Math.round(mc),
        laborCapacity: Math.round(lc),
        bottleneck,
        headcount: state.headcount,
        hoursPerEmployee: state.hoursPerEmployee,
        productivity: state.productivity,
        hoursPerUnit: snapshot.product.hoursPerUnit,
      };
    })(),
    difficulty: (() => {
      const preset = presetFromProfile(game.difficultyProfile);
      return { level: preset.level, name: preset.name, hintMaxLevel: preset.hintMaxLevel };
    })(),
    enabledDecisions: presetFromProfile(game.difficultyProfile).decisions,
    distributableReserves: Math.max(
      0,
      (stateRow?.state as CompanyState | undefined)?.reserves ?? 0,
    ),
    investmentOffer: (() => {
      const offer = (game.scenarioSnapshot as EngineScenarioConfig).investment;
      return offer
        ? { costPerCapacityUnit: offer.costPerCapacityUnit, maxPerRound: offer.maxPerRound }
        : null;
    })(),
    debtSchedule: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      if (snapshot.finance.loanDurationRounds === undefined) return null;
      // état courant de l'équipe : dernier état persisté (ou état initial)
      const loans = (currentState?.loans ?? []) as { remaining: number; perRound: number }[];
      const outstanding = loans.reduce((s, l) => s + l.remaining, 0);
      const nextMandatory = loans.reduce((s, l) => s + Math.min(l.perRound, l.remaining), 0);
      return { nextMandatory, outstanding };
    })(),
    bankFile: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const bank = snapshot.finance.bank;
      if (!bank) return null;
      const trust = confianceInitiale((currentState ?? {}) as CompanyState);
      const conditions = conditionsBancaires(
        trust,
        {
          overdraftLimit: snapshot.finance.overdraftLimit,
          overdraftAnnualRate: snapshot.finance.overdraftAnnualRate,
        },
        bank,
      );
      const dernier = lastResult?.bank ?? null;
      return {
        trust,
        overdraftLimit: conditions.overdraftLimit,
        fullOverdraftLimit: snapshot.finance.overdraftLimit,
        overdraftAnnualRate: conditions.overdraftAnnualRate,
        refusedLoan:
          dernier && dernier.loanRequested > 0 && dernier.loanGranted === 0
            ? dernier.loanRequested
            : null,
        lastReliability: dernier?.reliability ?? null,
      };
    })(),
    treasuryOffer: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      return snapshot.treasury
        ? {
            discountAnnualRate: snapshot.treasury.discountAnnualRate,
            placementAnnualRate: snapshot.treasury.placementAnnualRate ?? null,
            maturedPlacement: Math.round(
              (stateRow?.state as CompanyState | undefined)?.finance.shortTermInvestment ?? 0,
            ),
            discountMaxShare: snapshot.treasury.discountMaxShare,
            factoringFeeRate: snapshot.treasury.factoringFeeRate,
            // Le plafond ANNONCÉ doit être celui qui sera appliqué : quand la
            // banque a resserré la ligne, l'afficher au nominal ferait
            // dépasser un élève qui a fait le calcul juste.
            overdraftLimit: (() => {
              const bank = snapshot.finance.bank;
              if (!bank) return snapshot.finance.overdraftLimit;
              return conditionsBancaires(
                confianceInitiale((currentState ?? {}) as CompanyState),
                {
                  overdraftLimit: snapshot.finance.overdraftLimit,
                  overdraftAnnualRate: snapshot.finance.overdraftAnnualRate,
                },
                bank,
              ).overdraftLimit;
            })(),
          }
        : null;
    })(),
    capitalAllowance: (() => {
      const cap = (game.scenarioSnapshot as EngineScenarioConfig).finance.maxCapitalIncreaseTotal;
      if (cap === undefined) return null;
      const raised = (currentState as { capitalRaised?: number } | undefined)?.capitalRaised ?? 0;
      return { total: cap, remaining: Math.max(0, cap - raised) };
    })(),
    costFacts: (() => {
      const product = (game.scenarioSnapshot as EngineScenarioConfig).product;
      return {
        materialCostPerUnit: product.materialCostPerUnit,
        otherVariableCostPerUnit: product.otherVariableCostPerUnit,
      };
    })(),
    studiesOffer: (() => {
      const catalog = (game.scenarioSnapshot as EngineScenarioConfig).studies;
      return catalog ? { ...catalog } : null;
    })(),
    studyReports,
    orderOffer: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const offer = orderOfferForRound(snapshot, game.currentRound, game.seed);
      if (!offer) return null;
      return {
        code: offer.code,
        title: offer.title,
        narrative: offer.narrative,
        units: offer.units,
        price: offer.price,
        paymentDelayDays: offer.paymentDelayDays,
        unitVariableCost:
          snapshot.product.materialCostPerUnit + snapshot.product.otherVariableCostPerUnit,
        refPrice: snapshot.market.segments[0]?.refPrice ?? offer.price,
      };
    })(),
    seasonNotes: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const idx = game.currentRound - 1;
      const notes: { name: string; coef: number }[] = [];
      const global = snapshot.market.seasonality[idx];
      if (global !== undefined && Math.abs(global - 1) > 0.01)
        notes.push({ name: "Marché", coef: global });
      for (const seg of snapshot.market.segments) {
        const coef = seg.seasonality?.[idx];
        if (coef !== undefined && Math.abs(coef - 1) > 0.01)
          notes.push({ name: seg.name, coef });
      }
      return notes;
    })(),
  };
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
  const out: TeacherGameSummary[] = [];
  for (const g of rows) {
    if ((g.difficultyProfile as { kind?: string }).kind !== "class") continue;
    const teamRows = await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.gameId, g.id), eq(teams.controller, "human")));
    out.push({
      gameId: g.id,
      joinCode: g.joinCode,
      status: g.status,
      currentRound: g.currentRound,
      roundsCount: (g.scenarioSnapshot as { roundsCount: number }).roundsCount,
      roundDays: (g.scenarioSnapshot as { roundDays: number }).roundDays,
      teamsCount: teamRows.length,
      createdAt: g.createdAt,
    });
  }
  return out;
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
    playerNames: string[];
    hasSubmitted: boolean;
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
        playerNames: memberships.filter((m) => m.teamId === t.id).map((m) => m.name),
        hasSubmitted:
          t.controller === "bot" ||
          submitted.some((d) => d.teamId === t.id && d.status === "validated"),
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
