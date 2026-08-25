import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { eventDefinitions } from "./catalog";
import { games, rounds, teams } from "./game";

/** Résultats complets d'une équipe pour un tour + colonnes dénormalisées requêtables. */
export const roundResults = pgTable(
  "round_results",
  {
    id: id(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    incomeStatement: jsonb("income_statement").notNull(),
    balanceSheet: jsonb("balance_sheet").notNull(),
    cashFlow: jsonb("cash_flow").notNull(),
    marketDetail: jsonb("market_detail").notNull(),
    engineTrace: jsonb("engine_trace").notNull(), // matière du débriefing, jamais exposée brute
    revenue: numeric("revenue", { precision: 14, scale: 2 }).notNull(),
    netIncome: numeric("net_income", { precision: 14, scale: 2 }).notNull(),
    cash: numeric("cash", { precision: 14, scale: 2 }).notNull(),
    frng: numeric("frng", { precision: 14, scale: 2 }).notNull(),
    bfr: numeric("bfr", { precision: 14, scale: 2 }).notNull(),
    netTreasury: numeric("net_treasury", { precision: 14, scale: 2 }).notNull(),
    marketShare: numeric("market_share", { precision: 7, scale: 6 }).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("round_results_round_team_uq").on(t.roundId, t.teamId)],
);

/** KPIs normalisés (codes du référentiel doc 06) — graphiques et vues enseignant sans JSONB. */
export const kpis = pgTable(
  "kpis",
  {
    roundId: uuid("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    kpiCode: text("kpi_code").notNull(),
    value: numeric("value", { precision: 18, scale: 6 }).notNull(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.roundId, t.teamId, t.kpiCode] }),
    index("kpis_code_idx").on(t.kpiCode),
  ],
);

/** Événements tirés (PRNG seedé) ou scriptés, en cours ou passés. */
export const eventOccurrences = pgTable(
  "event_occurrences",
  {
    id: id(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    eventDefinitionId: uuid("event_definition_id")
      .notNull()
      .references(() => eventDefinitions.id, { onDelete: "restrict" }),
    roundStarted: integer("round_started").notNull(),
    roundsLeft: integer("rounds_left").notNull(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    params: jsonb("params"),
    announced: boolean("announced").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("event_occurrences_game_idx").on(t.gameId)],
);
