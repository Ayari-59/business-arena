import {
  boolean,
  index,
  integer,
  numeric,
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
import { concepts, decisionModels, hints, situations } from "./catalog";
import { rounds, teams } from "./game";
import { modelRelevance } from "./catalog";
import { users } from "./identity";

export const situationOrigin = pgEnum("situation_origin", ["scripted", "detected"]);
export const situationStatus = pgEnum("situation_status", [
  "open",
  "diagnosed",
  "answered",
  "debriefed",
]);
export const skillAxis = pgEnum("skill_axis", [
  "finance",
  "marketing",
  "production",
  "analysis",
  "strategy",
  "decision",
  "risk",
]);

/** Une situation vécue par une équipe dans un tour (doc 03 §1). */
export const situationInstances = pgTable(
  "situation_instances",
  {
    id: id(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    situationId: uuid("situation_id")
      .notNull()
      .references(() => situations.id, { onDelete: "restrict" }),
    origin: situationOrigin("origin").notNull(),
    status: situationStatus("status").notNull().default("open"),
    diagnosis: jsonb("diagnosis"), // options cochées + texte libre
    quiz: jsonb("quiz"), // réponses au QCM de connaissances + score
    triggerContext: jsonb("trigger_context"), // faits chiffrés ayant déclenché la situation (A1)
    consequenceContext: jsonb("consequence_context"), // évolution avant/après au débriefing (A2)
    interpretationContext: jsonb("interpretation_context"), // interprétation pédagogique au débriefing (A3)
    openedAt: timestamp("opened_at", { withTimezone: true }),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("situation_instances_uq").on(t.roundId, t.teamId, t.situationId),
    index("situation_instances_team_id_idx").on(t.teamId),
  ],
);

/** Choix de modèle d'analyse — cœur de la compétence §7 ; relevance historisée. */
export const modelChoices = pgTable("model_choices", {
  id: id(),
  situationInstanceId: uuid("situation_instance_id")
    .notNull()
    .references(() => situationInstances.id, { onDelete: "cascade" }),
  decisionModelId: uuid("decision_model_id")
    .notNull()
    .references(() => decisionModels.id, { onDelete: "restrict" }),
  justification: text("justification"),
  relevance: modelRelevance("relevance").notNull(),
  modelScore: numeric("model_score", { precision: 6, scale: 4 }),
  hinted: boolean("hinted").notNull().default(false), // soufflé par l'indice niveau 4
  ...timestamps,
});

/** Trace irréversible d'utilisation d'un indice (séquentialité garantie par le service). */
export const hintUsages = pgTable(
  "hint_usages",
  {
    id: id(),
    situationInstanceId: uuid("situation_instance_id")
      .notNull()
      .references(() => situationInstances.id, { onDelete: "cascade" }),
    hintId: uuid("hint_id")
      .notNull()
      .references(() => hints.id, { onDelete: "restrict" }),
    level: integer("level").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [uniqueIndex("hint_usages_instance_level_uq").on(t.situationInstanceId, t.level)],
);

/** Maîtrise 0..100 par (joueur, concept) — révision espacée (doc 03 §6). */
export const learningProgress = pgTable(
  "learning_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    mastery: numeric("mastery", { precision: 5, scale: 2 }).notNull().default("0"),
    evidenceCount: integer("evidence_count").notNull().default(0),
    lastEventAt: timestamp("last_event_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.userId, t.conceptId] })],
);

/** Profil de compétences par axe (§28). */
export const playerSkills = pgTable(
  "player_skills",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    axis: skillAxis("axis").notNull(),
    value: numeric("value", { precision: 5, scale: 2 }).notNull().default("0"),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.userId, t.axis] })],
);
