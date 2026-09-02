import {
  bigint,
  index,
  integer,
  interval,
  jsonb,
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
    scenarioSnapshot: jsonb("scenario_snapshot").notNull(),
    engineVersion: text("engine_version").notNull(),
    seed: bigint("seed", { mode: "number" }).notNull(),
    mode: gameMode("mode").notNull().default("learning"),
    difficultyProfile: jsonb("difficulty_profile").notNull(),
    status: gameStatus("status").notNull().default("draft"),
    currentRound: integer("current_round").notNull().default(0),
    roundDuration: interval("round_duration"), // null = pas de pression temporelle
    joinCode: text("join_code").unique(), // code d'invitation des joueurs (parties de classe)
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (t) => [
    index("games_class_idx").on(t.classId),
    index("games_status_idx").on(t.status),
    index("games_created_by_idx").on(t.createdBy),
    index("games_competition_stage_idx").on(t.competitionStageId),
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
    payload: jsonb("payload").notNull(), // RoundDecisions, validé contre decision_options
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
