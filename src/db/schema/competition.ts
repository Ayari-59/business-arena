import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { organizations, users } from "./identity";
import { scenarios } from "./catalog";

export const competitionStatus = pgEnum("competition_status", [
  "draft",
  "registration",
  "running",
  "finished",
]);
export const stageKind = pgEnum("stage_kind", [
  "qualification",
  "groups",
  "knockout",
  "semifinal",
  "final",
]);
export const stageStatus = pgEnum("stage_status", ["pending", "running", "finished"]);
export const entryStatus = pgEnum("entry_status", [
  "registered",
  "active",
  "eliminated",
  "winner",
]);

/** Un concours = un arbre de phases qui engendrent des parties ordinaires (doc 04 §3). */
export const competitions = pgTable("competitions", {
  id: id(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }), // null = compétition nationale
  name: text("name").notNull(),
  status: competitionStatus("status").notNull().default("draft"),
  scenarioId: uuid("scenario_id")
    .notNull()
    .references(() => scenarios.id, { onDelete: "restrict" }),
  rules: jsonb("rules"),
  organizerId: uuid("organizer_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  ...timestamps,
});

export const competitionStages = pgTable(
  "competition_stages",
  {
    id: id(),
    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    kind: stageKind("kind").notNull(),
    format: jsonb("format").notNull(), // { teamsPerGame, advanceCount, tieBreakers[] }
    status: stageStatus("status").notNull().default("pending"),
    ...timestamps,
  },
  (t) => [uniqueIndex("competition_stages_uq").on(t.competitionId, t.index)],
);

export const competitionEntries = pgTable(
  "competition_entries",
  {
    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    teamLabel: text("team_label").notNull(),
    memberUserIds: uuid("member_user_ids").array().notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    seedRank: integer("seed_rank"),
    status: entryStatus("status").notNull().default("registered"),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.competitionId, t.teamLabel] })],
);
