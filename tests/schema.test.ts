import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import * as schema from "../src/db/schema";

// Garde-fou : le schéma Drizzle doit rester la traduction littérale de docs/05.
const EXPECTED_TABLES = [
  "users", "organizations", "organization_members", "classes", "class_members",
  "org_invites",
  "org_licences", "platform_settings", "login_attempts", "jetons_de_reinitialisation",
  "scenarios", "concepts", "decision_models", "decision_model_concepts",
  "situations", "situation_models", "situation_concepts", "hints",
  "event_definitions", "decision_options",
  "games", "teams", "players", "game_recoveries", "rounds", "decisions", "aid_requests", "orientation_requests", "phone_appointments", "demandes_de_devis", "integrations",
  "markets", "market_segments", "products", "production_units", "employees",
  "suppliers", "customers", "inventory", "financial_accounts", "transactions",
  "company_states",
  "round_results", "kpis", "event_occurrences",
  "situation_instances", "model_choices", "hint_usages",
  "learning_progress", "player_skills", "completed_learning_steps", "learning_path_progression",
  "scores", "game_rankings",
  "competitions", "competition_stages", "competition_entries", "competition_members",
  "episode_parties", "episode_cohortes", "episode_membres", "episode_reprises",
  "episode_objectifs",
  // Le cours par la simulation, suivi en classe (migration 0047, /teacher/cours).
  "cours_classes", "cours_eleves", "cours_progressions",
  "lti_plateformes", "lti_jetons_inscription", "lti_nonces", "lti_tickets", "lti_liens",
  "lti_comptes", "lti_refus",
  // Le retour des notes dans le carnet de la plateforme (migration 0043, lti/ags).
  "lti_notes_eleves", "lti_notes_envois",
  "saml_idps", "saml_federations", "saml_etablissements", "saml_comptes", "saml_requetes",
  "saml_assertions", "saml_refus",
  "inscrits_journal",
  // Le catalogue commercial (migration 0041, /admin/offres).
  "catalogue_modules", "catalogue_offres", "catalogue_reglages", "codes_promo", "catalogue_journal",
  // L'examen individuel (migration 0042, /teacher/examens).
  "examens", "examen_candidats",
  // L'évaluation entre coéquipiers (migration 0044, /teacher/games/[gameId]/coequipiers).
  "pairs_evaluations", "pairs_moments", "pairs_reponses",
  // Le quota du tuteur IA : un compteur par partie et par élève (migration 0050).
  "tuteur_questions",
];

describe("schéma de base de données", () => {
  const tables = Object.values(schema as Record<string, unknown>)
    .filter((v): v is PgTable => v instanceof PgTable)
    .map((t) => getTableName(t));

  it("contient exactement les tables du doc 05", () => {
    expect([...tables].sort()).toEqual([...EXPECTED_TABLES].sort());
  });
});
