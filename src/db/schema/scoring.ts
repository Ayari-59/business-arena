import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { games, rounds, teams } from "./game";

export const scoreDimension = pgEnum("score_dimension", [
  "economic",
  "financial",
  "commercial",
  "operational",
  "profitability",
  "strategy",
  "decision_mastery",
]);

/** Scores par dimension du BPI, par tour (doc 08 §1). */
export const scores = pgTable(
  "scores",
  {
    roundId: uuid("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    dimension: scoreDimension("dimension").notNull(),
    raw: numeric("raw", { precision: 18, scale: 6 }).notNull(),
    normalized: numeric("normalized", { precision: 6, scale: 2 }).notNull(), // 0..100
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.roundId, t.teamId, t.dimension] })],
);

/** Classement d'une partie — recalculé à chaque tour, figé à `finished`. */
export const gameRankings = pgTable(
  "game_rankings",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    bpi: numeric("bpi", { precision: 6, scale: 2 }).notNull(),
    rank: integer("rank").notNull(),
    detail: jsonb("detail"), // BpiBreakdown
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.gameId, t.teamId] })],
);
