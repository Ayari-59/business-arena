import {
  bigint,
  index,
  integer,
  interval,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { classes, organizations, users } from "./identity";
import { scenarios } from "./catalog";
import { competitionStages } from "./competition";
import type { EngineScenarioConfig, RoundDecisions } from "@/engine/types";

export const gameMode = pgEnum("game_mode", ["learning", "competition", "contest"]);
export const gameStatus = pgEnum("game_status", [
  "draft",
  "open",
  "running",
  "finished",
  "archived",
]);
export const teamController = pgEnum("team_controller", ["human", "bot"]);
export const playerRole = pgEnum("player_role", ["captain", "member"]);
export const roundStatus = pgEnum("round_status", [
  "pending",
  "open",
  "resolving",
  "resolved",
]);
export const decisionStatus = pgEnum("decision_status", [
  "draft",
  "validated",
  "locked",
  "carried_over",
]);

/** Une partie : instance jouée d'un scénario (ADR-10 : snapshot + version moteur figés). */
export const games = pgTable(
  "games",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
    competitionStageId: uuid("competition_stage_id").references(
      () => competitionStages.id,
      { onDelete: "set null" },
    ),
    scenarioId: uuid("scenario_id")
      .notNull()
      .references(() => scenarios.id, { onDelete: "restrict" }),
    scenarioSnapshot: jsonb("scenario_snapshot").$type<EngineScenarioConfig>().notNull(),
    engineVersion: text("engine_version").notNull(),
    seed: bigint("seed", { mode: "number" }).notNull(),
    mode: gameMode("mode").notNull().default("learning"),
    difficultyProfile: jsonb("difficulty_profile").notNull(),
    status: gameStatus("status").notNull().default("draft"),
    currentRound: integer("current_round").notNull().default(0),
    roundDuration: interval("round_duration"), // null = pas de pression temporelle
    // Fenêtre globale de jeu (planning). null = pas de fenêtre : la partie suit
    // le pilotage manuel des tours. Le verrou par tour (rounds.opensAt/deadline)
    // s'applique à l'intérieur de cette fenêtre.
    opensAt: timestamp("opens_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    joinCode: text("join_code").unique(), // code d'invitation des joueurs (parties de classe)
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    /**
     * L'adresse d'origine de la création, pour les seules parties nées d'un
     * formulaire public. Elle ne sert qu'à compter : `/jouer` crée une partie
     * entière — snapshot de scénario compris — à chaque envoi, sans qu'aucune
     * session soit exigée. Sans ce compteur, une boucle crée autant de parties
     * qu'elle fait de requêtes. Nulle pour les parties créées par un
     * enseignant identifié, qui n'ont rien à plafonner.
     */
    creatorIp: text("creator_ip"),
    ...timestamps,
  },
  (t) => [
    index("games_class_idx").on(t.classId),
    index("games_status_idx").on(t.status),
    index("games_created_by_idx").on(t.createdBy),
    index("games_competition_stage_idx").on(t.competitionStageId),
    // Le plafond se lit « combien de parties depuis cette adresse depuis une
    // heure » : c'est cet index qui rend la question gratuite.
    index("games_creator_ip_idx").on(t.creatorIp, t.createdAt),
  ],
);

/** Une équipe = une entreprise virtuelle, humaine ou bot (ADR-02, ADR-03). */
export const teams = pgTable(
  "teams",
  {
    id: id(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    controller: teamController("controller").notNull().default("human"),
    botProfile: text("bot_profile"), // requis si controller = bot (garde applicative)
    joinCode: text("join_code").unique(),
    ...timestamps,
  },
  (t) => [uniqueIndex("teams_game_name_uq").on(t.gameId, t.name)],
);

/** Appartenance joueur ↔ équipe. Unicité (user, game) garantie par le service. */
export const players = pgTable(
  "players",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: playerRole("role").notNull().default("member"),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.teamId, t.userId] }), index("players_user_id_idx").on(t.userId)],
);

export const rounds = pgTable(
  "rounds",
  {
    id: id(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    index: integer("index").notNull(), // 1..N
    status: roundStatus("status").notNull().default("pending"),
    opensAt: timestamp("opens_at", { withTimezone: true }),
    deadline: timestamp("deadline", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    // Version de la formule IPG ayant scoré ce tour (1 = 7 dimensions historiques ;
    // 2 = 6 dimensions, base zéro, ex æquo, finance en variation — V1-2). Les
    // tours déjà scorés gardent leur version : on ne recalcule jamais un relevé.
    bpiVersion: integer("bpi_version").notNull().default(1),
    // Quand l'animateur a révélé le classement de ce tour. NULL = pas encore.
    // En classe et en concours, c'est lui qui ouvre le rideau : sans cela, la
    // classe lisait le classement sur son téléphone avant qu'il ne le projette,
    // et son moment n'existait pas. En solo, il n'y a personne pour révéler :
    // la vue considère le classement toujours ouvert, sans rien écrire ici.
    rankingRevealedAt: timestamp("ranking_revealed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("rounds_game_index_uq").on(t.gameId, t.index)],
);

/** Décisions d'une équipe pour un tour — append-only après verrouillage (ADR-13). */
export const decisions = pgTable(
  "decisions",
  {
    id: id(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    payload: jsonb("payload").$type<RoundDecisions>().notNull(), // validé contre decision_options
    forecast: jsonb("forecast"), // prévisions du joueur → analyse des écarts
    justification: text("justification"),
    /**
     * D'où viennent les pivots (prix, volume) : { price, productionPlan } en
     * 'default' | 'edited' | 'carried'. Null pour les tours antérieurs à cette
     * colonne : inconnu, jamais recalculé.
     */
    decisionSource: jsonb("decision_source"),
    status: decisionStatus("status").notNull().default("draft"),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    validatedBy: uuid("validated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [uniqueIndex("decisions_round_team_uq").on(t.roundId, t.teamId)],
);

/**
 * Le statut d'une demande de subvention exceptionnelle. `pending` tant que
 * l'animateur ne l'a pas instruite ; ensuite, sa réponse, qui ne se reprend pas.
 */
export const aidRequestStatus = pgEnum("aid_request_status", [
  "pending",
  "granted",
  "refused",
]);

/**
 * LA DEMANDE DE SUBVENTION EXCEPTIONNELLE — le dernier recours d'une équipe
 * en cessation de paiements.
 *
 * Le tour qui suit une crise exige un financement de sauvetage : de quoi
 * repasser sous le plafond de découvert. Deux leviers y répondent, l'emprunt
 * et l'apport des associés. Quand les DEUX sont épuisés — la banque ne prête
 * plus, l'enveloppe des associés est vide — l'équipe n'a plus rien à décider
 * et se trouve bloquée sans issue. C'est ce mur qui ouvre cette table.
 *
 * L'équipe dépose alors une demande : un montant, un motif. Elle n'est pas une
 * décision de jeu, elle ne s'auto-accorde pas — c'est l'animateur qui tranche,
 * depuis son espace, comme le ferait une collectivité ou un actionnaire de
 * dernière heure. Accordée, la subvention est encaissée à la clôture du tour
 * demandé, en produit exceptionnel. Refusée, elle laisse l'équipe face aux
 * conséquences : c'est aussi une leçon.
 *
 * Une seule demande par équipe et par tour (index unique) : on ne dépose pas
 * trois dossiers pour le même trou.
 */
export const aidRequests = pgTable(
  "aid_requests",
  {
    id: id(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    /** Le tour PENDANT lequel la demande est déposée — celui qu'elle sauve. */
    roundIndex: integer("round_index").notNull(),
    /** Montant demandé, en euros. */
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    /** Ce que l'équipe écrit pour justifier sa demande. */
    reason: text("reason").notNull(),
    status: aidRequestStatus("status").notNull().default("pending"),
    /**
     * Montant réellement accordé. L'animateur peut accorder moins que demandé —
     * une aide partielle est un arbitrage pédagogique, pas une erreur. NULL
     * tant que la demande n'est pas instruite, et après un refus.
     */
    grantedAmount: numeric("granted_amount", { precision: 14, scale: 2 }),
    /** Le mot de l'animateur à l'équipe : pourquoi oui, pourquoi non. */
    decisionNote: text("decision_note"),
    decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("aid_requests_team_round_uq").on(t.teamId, t.roundIndex),
    index("aid_requests_game_status_idx").on(t.gameId, t.status),
  ],
);
