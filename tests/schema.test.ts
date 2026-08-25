import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import * as schema from "../src/db/schema";

// Garde-fou : le schéma Drizzle doit rester la traduction littérale de docs/05.
const EXPECTED_TABLES = [
  "users", "organizations", "organization_members", "classes", "class_members",
  "org_invites", "platform_settings",
  "scenarios", "concepts", "decision_models", "decision_model_concepts",
  "situations", "situation_models", "situation_concepts", "hints",
  "event_definitions", "decision_options",
  "games", "teams", "players", "rounds", "decisions",
  "markets", "market_segments", "products", "production_units", "employees",
  "suppliers", "customers", "inventory", "financial_accounts", "transactions",
  "company_states",
  "round_results", "kpis", "event_occurrences",
  "situation_instances", "model_choices", "hint_usages",
  "learning_progress", "player_skills",
  "scores", "game_rankings",
  "competitions", "competition_stages", "competition_entries",
];

describe("schéma de base de données", () => {
  const tables = Object.values(schema as Record<string, unknown>)
    .filter((v): v is PgTable => v instanceof PgTable)
    .map((t) => getTableName(t));

  it("contient exactement les tables du doc 05", () => {
    expect([...tables].sort()).toEqual([...EXPECTED_TABLES].sort());
  });
});
