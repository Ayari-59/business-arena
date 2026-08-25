import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { users } from "./identity";

export const scenarioStatus = pgEnum("scenario_status", [
  "draft",
  "published",
  "archived",
]);
export const conceptDomain = pgEnum("concept_domain", [
  "market",
  "commercial",
  "costs",
  "margins",
  "thresholds",
  "production",
  "finance",
  "profitability",
  "budget",
  "investment",
  "decision",
  "strategy",
]);
export const modelRelevance = pgEnum("model_relevance", [
  "optimal",
  "acceptable",
  "misleading",
  "irrelevant",
]);
export const eventScope = pgEnum("event_scope", ["market", "company"]);

/** Scénarios publiés — la config JSONB est un `ScenarioConfig` validé par zod (doc 06). */
export const scenarios = pgTable(
  "scenarios",
  {
    id: id(),
    code: text("code").notNull(),
    version: text("version").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    minCompanies: integer("min_companies").notNull().default(1),
    maxCompanies: integer("max_companies").notNull().default(8),
    roundsCount: integer("rounds_count").notNull(),
    baseDifficulty: integer("base_difficulty").notNull().default(1),
    config: jsonb("config").notNull(),
    status: scenarioStatus("status").notNull().default("draft"),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("scenarios_code_version_uq").on(t.code, t.version)],
);

/** Référentiel des notions de gestion (§5) — données, pas code. */
export const concepts = pgTable("concepts", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  domain: conceptDomain("domain").notNull(),
  definition: text("definition").notNull(),
  layers: jsonb("layers"), // { intuition, method, formal }
  formulas: jsonb("formulas"),
  commonMistakes: jsonb("common_mistakes"),
  introDifficulty: integer("intro_difficulty").notNull().default(1),
  prerequisiteIds: uuid("prerequisite_ids").array(),
  ...timestamps,
});

/** Référentiel des modèles d'aide à la décision (§6). */
export const decisionModels = pgTable("decision_models", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  objective: text("objective").notNull(),
  relevantSituations: text("relevant_situations"),
  requiredData: jsonb("required_data"), // clés de données du jeu (pré-remplissage atelier)
  formula: text("formula"),
  difficulty: integer("difficulty").notNull().default(1),
  commonMistakes: jsonb("common_mistakes"),
  examples: jsonb("examples"),
  defaultHints: jsonb("default_hints"),
  ...timestamps,
});

export const decisionModelConcepts = pgTable(
  "decision_model_concepts",
  {
    decisionModelId: uuid("decision_model_id")
      .notNull()
      .references(() => decisionModels.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.decisionModelId, t.conceptId] })],
);

/** Situations pédagogiques (doc 03 §1.1) — scriptées (scenario_id) ou génériques (null). */
export const situations = pgTable("situations", {
  id: id(),
  code: text("code").notNull().unique(),
  scenarioId: uuid("scenario_id").references(() => scenarios.id, {
    onDelete: "cascade",
  }),
  titleKey: text("title_key").notNull(),
  narrativeKey: text("narrative_key").notNull(),
  problemKey: text("problem_key").notNull(), // question OUVERTE, jamais "calculez X" (§3)
  diagnosticOptions: jsonb("diagnostic_options"),
  trigger: jsonb("trigger"), // SituationTrigger : { round } ou conditions détectables
  difficulty: integer("difficulty").notNull().default(1),
  weight: numeric("weight", { precision: 6, scale: 3 }).notNull().default("1"),
  ...timestamps,
});

export const situationModels = pgTable(
  "situation_models",
  {
    situationId: uuid("situation_id")
      .notNull()
      .references(() => situations.id, { onDelete: "cascade" }),
    decisionModelId: uuid("decision_model_id")
      .notNull()
      .references(() => decisionModels.id, { onDelete: "restrict" }),
    relevance: modelRelevance("relevance").notNull(),
  },
  (t) => [primaryKey({ columns: [t.situationId, t.decisionModelId] })],
);

export const situationConcepts = pgTable(
  "situation_concepts",
  {
    situationId: uuid("situation_id")
      .notNull()
      .references(() => situations.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.situationId, t.conceptId] })],
);

/** Les 5 niveaux d'indices d'une situation (doc 03 §4). */
export const hints = pgTable(
  "hints",
  {
    id: id(),
    situationId: uuid("situation_id")
      .notNull()
      .references(() => situations.id, { onDelete: "cascade" }),
    level: integer("level").notNull(), // 1..5, séquentiel
    textKey: text("text_key").notNull(),
    costRatio: numeric("cost_ratio", { precision: 5, scale: 4 }).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("hints_situation_level_uq").on(t.situationId, t.level)],
);

/** Catalogue d'événements (§19) — le tirage crée des event_occurrences. */
export const eventDefinitions = pgTable("event_definitions", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  scope: eventScope("scope").notNull(),
  trigger: jsonb("trigger").notNull(), // { minRound?, conditions?, probability }
  duration: integer("duration").notNull().default(1),
  modifiers: jsonb("modifiers").notNull(),
  announcement: jsonb("announcement"),
  difficulty: integer("difficulty").notNull().default(1),
  conceptIds: uuid("concept_ids").array(),
  ...timestamps,
});

/** Leviers de décision offerts par un scénario, avec bornes (validation des payloads). */
export const decisionOptions = pgTable(
  "decision_options",
  {
    id: id(),
    scenarioId: uuid("scenario_id")
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    code: text("code").notNull(), // "price", "production_plan", "marketing_budget"…
    labelKey: text("label_key").notNull(),
    unit: text("unit"),
    min: numeric("min", { precision: 14, scale: 3 }),
    max: numeric("max", { precision: 14, scale: 3 }),
    step: numeric("step", { precision: 14, scale: 3 }),
    unlockedFromDifficulty: integer("unlocked_from_difficulty").notNull().default(1),
    ...timestamps,
  },
  (t) => [uniqueIndex("decision_options_scenario_code_uq").on(t.scenarioId, t.code)],
);
