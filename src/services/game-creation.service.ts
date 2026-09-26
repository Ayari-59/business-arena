import { randomInt } from "node:crypto";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  aidRequests,
  companyStates,
  decisions,
  eventOccurrences,
  financialAccounts,
  gameRankings,
  games,
  markets,
  organizations,
  players,
  productionUnits,
  products,
  rounds,
  scenarios,
  teams,
  transactions,
} from "@/db/schema";
import {
  DEFAULT_SCENARIO_CODE,
  scenarioByCode,
  scenarioCodeForLevel,
  type ScenarioDefinition,
} from "@/config/scenarios/registry";
import {
  resolveScenarioDefinition,
} from "@/services/scenario-source.service";
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
import { withoutRd } from "@/engine/gamme";
import { openSituationsForRound, seedPedagogyReferentials } from "@/services/pedagogy.service";
import { getPlatformConfig } from "@/services/admin.service";
import { assertCanCreateGame } from "@/services/licence.service";
import { type BotProfile } from "@/engine/bots";
import { ENGINE_VERSION } from "@/engine/simulation";
import { PARTIE_AVEC_ELEVES, PARTIE_DEJA_JOUEE } from "@/services/archivage";

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

/**
 * PLAFOND DES PARTIES PUBLIQUES, PAR ADRESSE ET PAR HEURE.
 *
 * `/jouer` n'exige aucune session : chaque envoi du formulaire crée une partie
 * entière — partie, équipes, états d'ouverture, snapshot du scénario en jsonb.
 * Une boucle y créait donc autant de parties qu'elle faisait de requêtes. Ce
 * n'est pas une faille d'autorisation, c'est une amplification d'écriture.
 *
 * Dix par heure laisse tranquille l'usage réel — un enseignant qui essaie
 * plusieurs configurations avant sa séance, une classe entière derrière le même
 * routeur d'établissement en fait davantage, mais celle-là passe par /join et
 * ne crée rien. Le motif est celui qui garde déjà /orientation et /rendez-vous.
 */
export const PLAFOND_PARTIES_PAR_IP_PAR_HEURE = 10;

/** Ce que l'appelant reçoit quand le plafond est atteint. */
export class TropDePartiesError extends Error {
  constructor() {
    super("Trop de parties lancées depuis cette connexion : réessayez dans une heure.");
    this.name = "TropDePartiesError";
  }
}

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
  /** Pondérations de l'IPG ajustées par l'enseignant (six dimensions, doc 08). */
  scoringWeightOverrides?: ScoringWeightOverrides;
  /** Monde variable (doc 02 §9bis) : variante du scénario dérivée de la graine. */
  variableWorld?: boolean;
  /**
   * Nombre de tours joués. Absent = tous ceux du scénario. Une partie se
   * raccourcit, jamais ne s'allonge : au delà, les équipes joueraient des tours
   * sans situation ni événement écrits pour eux.
   */
  roundsCount?: number;
  /**
   * L'adresse d'origine, pour les seules parties nées d'un formulaire public.
   * Elle ne sert qu'à compter (voir `PLAFOND_PARTIES_PAR_IP_PAR_HEURE`) ;
   * absente pour une partie créée par un enseignant identifié.
   */
  creatorIp?: string | null;
  /** Secteur joué (registre des scénarios) — absent = NOVA. */
  scenarioCode?: string;
  /** Questions posées dans les situations : tout, le modèle seul, ou rien. */
  quizMode?: QuizMode;
  /**
   * GRAINE IMPOSÉE. Absente, elle est tirée au hasard — c'est le cas de toutes
   * les parties réelles, et il ne doit pas changer. Le monde de démonstration,
   * lui, la fixe : deux mondes créés à deux jours d'intervalle donnent alors
   * les mêmes tirages, les mêmes bots et les mêmes résultats, et une prise
   * vidéo ratée se refait à l'identique.
   */
  seed?: number;
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
/**
 * L'ÉTAT DE DÉPART D'UNE PARTIE : ses tours, l'état d'ouverture de chaque
 * équipe, et les situations du tour 1.
 *
 * Partagé par la CRÉATION et la RÉINITIALISATION, et c'est tout l'intérêt :
 * « recommencer » doit être exactement « repartir de zéro », et non une
 * reconstitution écrite une seconde fois qui dériverait au premier changement
 * de la première.
 */
async function poserLEtatDeDepart(args: {
  gameId: string;
  equipes: { id: string; name: string; controller: string; botProfile: string | null }[];
  definition: ScenarioDefinition;
  periodicity: Periodicity;
  roundsCount: number;
}): Promise<void> {
  await db.insert(rounds).values(
    Array.from({ length: args.roundsCount }, (_, i) => ({
      gameId: args.gameId,
      index: i + 1,
      status: i === 0 ? ("open" as const) : ("pending" as const),
    })),
  );

  await db.insert(companyStates).values(
    args.equipes.map((t) => ({
      teamId: t.id,
      roundIndex: 0,
      state: applyPeriodicityToCompany(
        args.definition.company(
          t.id,
          t.name,
          t.controller === "human" ? "human" : "bot",
          (t.botProfile ?? undefined) as BotProfile | undefined,
        ),
        args.periodicity,
        // Quand l'unité vendue est une période, la capacité d'accueil est un
        // stock de places et ne suit pas la durée du tour.
        { abonnement: args.definition.scenario.subscription !== undefined },
      ),
    })),
  );

  await openSituationsForRound(args.gameId, 1); // situations scriptées du tour 1 (doc 03)
}

export async function createGameCore(args: CreateGameArgs): Promise<CreatedGame> {
  // Un scénario à famille (NOVA, MAILLE & CO) se joue en un produit ou en
  // gamme selon le niveau : c'est ici que le code choisi devient le code joué.
  const codeJoue = args.scenarioCode ? scenarioCodeForLevel(args.scenarioCode, args.level) : args.scenarioCode;
  const definition = await resolveScenarioDefinition(codeJoue);
  const scenarioId = await getOrCreateScenarioId(definition);
  // Référentiels concepts/modèles/situations (idempotent) + les situations
  // propres à un scénario enseignant, absentes du référentiel intégré : sans
  // elles, l'instanciation du tour ne retrouve pas leur id et l'élève n'a rien.
  await seedPedagogyReferentials(definition.situations);
  const seed = args.seed ?? randomInt(1, 2 ** 31);
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
  // R&D : un niveau qui ne l'ouvre pas ne doit pas laisser une référence à
  // développer hors de portée pour toute la partie. Le levier est retiré du
  // snapshot et les références à développer sont livrées prêtes.
  const scenarioJoue = preset && !preset.decisions.rd ? withoutRd(scenarioSnapshot) : scenarioSnapshot;

  const [game] = await db
    .insert(games)
    .values({
      organizationId: args.organizationId,
      scenarioId,
      scenarioSnapshot: scenarioJoue,
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
      creatorIp: args.creatorIp ?? null,
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

  await poserLEtatDeDepart({
    gameId: game.id,
    equipes: teamRows,
    definition,
    periodicity: args.periodicity,
    roundsCount: scenarioSnapshot.roundsCount,
  });

  return {
    gameId: game.id,
    teams: teamRows.map((t) => ({ id: t.id, name: t.name, controller: t.controller })),
  };
}

/**
 * RECOMMENCER LA MÊME PARTIE, AVEC LES MÊMES ÉLÈVES.
 *
 * Une séance d'essai qui a mal tourné, un tour clos par erreur, une classe qui
 * veut rejouer : sans ce geste, il fallait recréer une partie et refaire entrer
 * trente élèves un par un avec un nouveau code.
 *
 * CE QUI RESTE : la partie elle-même — son code, son scénario, sa graine, ses
 * réglages —, ses équipes, et les élèves dans leurs équipes. Personne n'a à se
 * réinscrire.
 *
 * CE QUI PART : tout ce qui est « avoir joué ». Les tours, et par cascade les
 * décisions, les résultats, les indicateurs, les scores, les situations
 * ouvertes avec leurs indices et leurs choix de modèle. Puis le classement, les
 * demandes de subvention, et l'état financier de chaque équipe.
 *
 * CE QU'ON NE TOUCHE PAS, ET C'EST VOULU : la maîtrise des notions et les
 * compétences de l'élève. Ces lignes appartiennent à l'ÉLÈVE et non à la
 * partie — `learning_progress` ne porte qu'un utilisateur et une notion, sans
 * mention de la partie qui l'a nourrie. Les effacer ici détruirait ce que le
 * même élève a appris dans une AUTRE partie. Recommencer une séance n'efface
 * pas ce qu'on a compris.
 *
 * L'état de départ est reposé par la fonction que la création elle-même
 * utilise : le résultat est une partie neuve, pas une imitation.
 */
export async function reinitialiserPartie(args: {
  gameId: string;
  teacherId: string;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) throw new Error("Partie introuvable");

  const snapshot = game.scenarioSnapshot as { code?: string; roundsCount: number };
  const definition = await resolveScenarioDefinition(snapshot.code);
  const periodicity = ((game.difficultyProfile as { periodicity?: Periodicity } | null)
    ?.periodicity ?? "quarter") as Periodicity;

  const equipes = await db
    .select({
      id: teams.id,
      name: teams.name,
      controller: teams.controller,
      botProfile: teams.botProfile,
    })
    .from(teams)
    .where(eq(teams.gameId, args.gameId));
  const idsEquipes = equipes.map((t) => t.id);

  // Les tours emportent avec eux, par cascade : décisions, indicateurs,
  // résultats, scores, instances de situations — et sous celles-ci les indices
  // consommés et les choix de modèle.
  await db.delete(rounds).where(eq(rounds.gameId, args.gameId));
  await db.delete(gameRankings).where(eq(gameRankings.gameId, args.gameId));
  await db.delete(aidRequests).where(eq(aidRequests.gameId, args.gameId));
  // Ces cinq tables dorment aujourd'hui : rien ne les écrit. On les vide quand
  // même, parce qu'une réinitialisation qui oublie une table est une
  // réinitialisation qui ment — le jour où elles s'éveilleront, elle tiendra.
  await db.delete(eventOccurrences).where(eq(eventOccurrences.gameId, args.gameId));
  await db.delete(markets).where(eq(markets.gameId, args.gameId));
  if (idsEquipes.length > 0) {
    await db.delete(companyStates).where(inArray(companyStates.teamId, idsEquipes));
    await db.delete(financialAccounts).where(inArray(financialAccounts.teamId, idsEquipes));
    await db.delete(transactions).where(inArray(transactions.teamId, idsEquipes));
    await db.delete(productionUnits).where(inArray(productionUnits.teamId, idsEquipes));
    await db.delete(products).where(inArray(products.teamId, idsEquipes));
  }

  await db
    .update(games)
    .set({ currentRound: 1, status: "running" })
    .where(eq(games.id, args.gameId));

  await poserLEtatDeDepart({
    gameId: args.gameId,
    equipes,
    definition,
    periodicity,
    roundsCount: snapshot.roundsCount,
  });
}

/**
 * SUPPRIMER UNE PARTIE — ET SEULEMENT UNE QUI N'A JAMAIS SERVI.
 *
 * Techniquement, effacer une partie est simple : les neuf clés étrangères qui
 * pointent vers elle sont toutes en cascade, rien ne resterait orphelin.
 * Humainement, c'est le geste le plus dangereux de l'application, parce qu'il
 * emporte du travail d'élève et ne se défait pas.
 *
 * D'où la borne : on ne supprime qu'une partie VIERGE, c'est-à-dire au premier
 * tour, sans aucune décision rendue et sans aucun élève inscrit. Une partie
 * créée en double, un essai de réglage, une erreur de secteur : celles-là ne
 * méritent pas d'encombrer une liste pour l'éternité. Au-delà, l'archivage
 * rend le même service sans le risque, et c'est ce que dit le refus.
 *
 * Les bots ne comptent pas comme des inscrits : une partie fraîche en a
 * toujours, et ils ne sont le travail de personne.
 */
export async function supprimerPartie(args: {
  gameId: string;
  teacherId: string;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) throw new Error("Partie introuvable");
  if (game.currentRound > 1) {
    throw new Error(PARTIE_DEJA_JOUEE);
  }

  const idsEquipes = (
    await db.select({ id: teams.id }).from(teams).where(eq(teams.gameId, args.gameId))
  ).map((t) => t.id);
  if (idsEquipes.length > 0) {
    const [rendues] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(decisions)
      .where(inArray(decisions.teamId, idsEquipes));
    if ((rendues?.n ?? 0) > 0) throw new Error(PARTIE_DEJA_JOUEE);
    const [inscrits] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(players)
      .where(inArray(players.teamId, idsEquipes));
    if ((inscrits?.n ?? 0) > 0) throw new Error(PARTIE_AVEC_ELEVES);
  }

  // Les cascades font le reste : équipes, tours, décisions, résultats,
  // situations, scores, états. Voir le schéma — aucune contrainte `restrict`
  // ne se trouve sur le chemin d'une partie vers ses enfants.
  await db.delete(games).where(eq(games.id, args.gameId));
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
  /** Adresse d'origine : le plafond se compte dessus. Absente = pas de compte. */
  creatorIp?: string | null,
): Promise<string> {
  const config = await getPlatformConfig();
  if (!config.allowPublicPlay) {
    throw new Error("Les parties publiques sont désactivées par l'administrateur.");
  }
  if (creatorIp) {
    const [compte] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(games)
      .where(
        and(
          eq(games.creatorIp, creatorIp),
          gt(games.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
        ),
      );
    if ((compte?.n ?? 0) >= PLAFOND_PARTIES_PAR_IP_PAR_HEURE) throw new TropDePartiesError();
  }
  const definition = await resolveScenarioDefinition(
    scenarioCode ? scenarioCodeForLevel(scenarioCode, level) : scenarioCode,
  );
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
    creatorIp,
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
  /** Graine imposée (monde de démonstration) ; absente = tirage au hasard. */
  seed?: number;
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
    seed: args.seed,
  });
  return { gameId, joinCode };
}
