CREATE TYPE "public"."concept_domain" AS ENUM('market', 'commercial', 'costs', 'margins', 'thresholds', 'production', 'finance', 'profitability', 'budget', 'investment', 'decision', 'strategy');--> statement-breakpoint
CREATE TYPE "public"."event_scope" AS ENUM('market', 'company');--> statement-breakpoint
CREATE TYPE "public"."model_relevance" AS ENUM('optimal', 'acceptable', 'misleading', 'irrelevant');--> statement-breakpoint
CREATE TYPE "public"."scenario_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."competition_status" AS ENUM('draft', 'registration', 'running', 'finished');--> statement-breakpoint
CREATE TYPE "public"."entry_status" AS ENUM('registered', 'active', 'eliminated', 'winner');--> statement-breakpoint
CREATE TYPE "public"."stage_kind" AS ENUM('qualification', 'groups', 'knockout', 'semifinal', 'final');--> statement-breakpoint
CREATE TYPE "public"."stage_status" AS ENUM('pending', 'running', 'finished');--> statement-breakpoint
CREATE TYPE "public"."decision_status" AS ENUM('draft', 'validated', 'locked', 'carried_over');--> statement-breakpoint
CREATE TYPE "public"."game_mode" AS ENUM('learning', 'competition', 'contest');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('draft', 'open', 'running', 'finished', 'archived');--> statement-breakpoint
CREATE TYPE "public"."player_role" AS ENUM('captain', 'member');--> statement-breakpoint
CREATE TYPE "public"."round_status" AS ENUM('pending', 'open', 'resolving', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."team_controller" AS ENUM('human', 'bot');--> statement-breakpoint
CREATE TYPE "public"."org_kind" AS ENUM('school', 'company', 'public');--> statement-breakpoint
CREATE TYPE "public"."org_role" AS ENUM('student', 'teacher', 'org_admin');--> statement-breakpoint
CREATE TYPE "public"."customer_kind" AS ENUM('mass', 'key_account');--> statement-breakpoint
CREATE TYPE "public"."employee_category" AS ENUM('production', 'sales', 'support');--> statement-breakpoint
CREATE TYPE "public"."inventory_item" AS ENUM('raw_material', 'finished_good');--> statement-breakpoint
CREATE TYPE "public"."transaction_kind" AS ENUM('sale', 'purchase', 'payroll', 'fixed_cost', 'marketing', 'quality', 'maintenance', 'outsourcing', 'investment', 'loan_in', 'loan_repayment', 'interest', 'overdraft_fee', 'tax', 'capital_increase', 'other');--> statement-breakpoint
CREATE TYPE "public"."situation_origin" AS ENUM('scripted', 'detected');--> statement-breakpoint
CREATE TYPE "public"."situation_status" AS ENUM('open', 'diagnosed', 'answered', 'debriefed');--> statement-breakpoint
CREATE TYPE "public"."skill_axis" AS ENUM('finance', 'marketing', 'production', 'analysis', 'strategy', 'decision', 'risk');--> statement-breakpoint
CREATE TYPE "public"."score_dimension" AS ENUM('economic', 'financial', 'commercial', 'operational', 'profitability', 'strategy', 'decision_mastery');--> statement-breakpoint
CREATE TABLE "concepts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"domain" "concept_domain" NOT NULL,
	"definition" text NOT NULL,
	"layers" jsonb,
	"formulas" jsonb,
	"common_mistakes" jsonb,
	"intro_difficulty" integer DEFAULT 1 NOT NULL,
	"prerequisite_ids" uuid[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "concepts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "decision_model_concepts" (
	"decision_model_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	CONSTRAINT "decision_model_concepts_decision_model_id_concept_id_pk" PRIMARY KEY("decision_model_id","concept_id")
);
--> statement-breakpoint
CREATE TABLE "decision_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"objective" text NOT NULL,
	"relevant_situations" text,
	"required_data" jsonb,
	"formula" text,
	"difficulty" integer DEFAULT 1 NOT NULL,
	"common_mistakes" jsonb,
	"examples" jsonb,
	"default_hints" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "decision_models_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "decision_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label_key" text NOT NULL,
	"unit" text,
	"min" numeric(14, 3),
	"max" numeric(14, 3),
	"step" numeric(14, 3),
	"unlocked_from_difficulty" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"scope" "event_scope" NOT NULL,
	"trigger" jsonb NOT NULL,
	"duration" integer DEFAULT 1 NOT NULL,
	"modifiers" jsonb NOT NULL,
	"announcement" jsonb,
	"difficulty" integer DEFAULT 1 NOT NULL,
	"concept_ids" uuid[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_definitions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "hints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"situation_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"text_key" text NOT NULL,
	"cost_ratio" numeric(5, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"min_companies" integer DEFAULT 1 NOT NULL,
	"max_companies" integer DEFAULT 8 NOT NULL,
	"rounds_count" integer NOT NULL,
	"base_difficulty" integer DEFAULT 1 NOT NULL,
	"config" jsonb NOT NULL,
	"status" "scenario_status" DEFAULT 'draft' NOT NULL,
	"author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "situation_concepts" (
	"situation_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	CONSTRAINT "situation_concepts_situation_id_concept_id_pk" PRIMARY KEY("situation_id","concept_id")
);
--> statement-breakpoint
CREATE TABLE "situation_models" (
	"situation_id" uuid NOT NULL,
	"decision_model_id" uuid NOT NULL,
	"relevance" "model_relevance" NOT NULL,
	CONSTRAINT "situation_models_situation_id_decision_model_id_pk" PRIMARY KEY("situation_id","decision_model_id")
);
--> statement-breakpoint
CREATE TABLE "situations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"scenario_id" uuid,
	"title_key" text NOT NULL,
	"narrative_key" text NOT NULL,
	"problem_key" text NOT NULL,
	"diagnostic_options" jsonb,
	"trigger" jsonb,
	"difficulty" integer DEFAULT 1 NOT NULL,
	"weight" numeric(6, 3) DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "situations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "competition_entries" (
	"competition_id" uuid NOT NULL,
	"team_label" text NOT NULL,
	"member_user_ids" uuid[] NOT NULL,
	"organization_id" uuid,
	"seed_rank" integer,
	"status" "entry_status" DEFAULT 'registered' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competition_entries_competition_id_team_label_pk" PRIMARY KEY("competition_id","team_label")
);
--> statement-breakpoint
CREATE TABLE "competition_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"index" integer NOT NULL,
	"kind" "stage_kind" NOT NULL,
	"format" jsonb NOT NULL,
	"status" "stage_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"status" "competition_status" DEFAULT 'draft' NOT NULL,
	"scenario_id" uuid NOT NULL,
	"rules" jsonb,
	"organizer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"forecast" jsonb,
	"justification" text,
	"status" "decision_status" DEFAULT 'draft' NOT NULL,
	"validated_at" timestamp with time zone,
	"validated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"class_id" uuid,
	"competition_stage_id" uuid,
	"scenario_id" uuid NOT NULL,
	"scenario_snapshot" jsonb NOT NULL,
	"engine_version" text NOT NULL,
	"seed" bigint NOT NULL,
	"mode" "game_mode" DEFAULT 'learning' NOT NULL,
	"difficulty_profile" jsonb NOT NULL,
	"status" "game_status" DEFAULT 'draft' NOT NULL,
	"current_round" integer DEFAULT 0 NOT NULL,
	"round_duration" interval,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "player_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"index" integer NOT NULL,
	"status" "round_status" DEFAULT 'pending' NOT NULL,
	"opens_at" timestamp with time zone,
	"deadline" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"name" text NOT NULL,
	"controller" "team_controller" DEFAULT 'human' NOT NULL,
	"bot_profile" text,
	"join_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "class_members" (
	"class_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_members_class_id_user_id_pk" PRIMARY KEY("class_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"name" text NOT NULL,
	"join_code" text NOT NULL,
	"school_year" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classes_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "org_role" DEFAULT 'student' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"kind" "org_kind" DEFAULT 'school' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"display_name" text NOT NULL,
	"avatar" text,
	"locale" text DEFAULT 'fr' NOT NULL,
	"is_platform_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"segment_id" uuid NOT NULL,
	"kind" "customer_kind" DEFAULT 'mass' NOT NULL,
	"name" text NOT NULL,
	"share_of_segment" numeric(5, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"category" "employee_category" NOT NULL,
	"headcount" integer NOT NULL,
	"hours_per_round" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(14, 2) NOT NULL,
	"productivity" numeric(8, 5) DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_accounts" (
	"team_id" uuid NOT NULL,
	"round_index" integer NOT NULL,
	"account" text NOT NULL,
	"balance" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financial_accounts_team_id_round_index_account_pk" PRIMARY KEY("team_id","round_index","account")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"team_id" uuid NOT NULL,
	"round_index" integer NOT NULL,
	"item" "inventory_item" NOT NULL,
	"product_id" uuid,
	"quantity" numeric(14, 3) NOT NULL,
	"unit_cost" numeric(14, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"size" numeric(14, 3) NOT NULL,
	"growth" numeric(8, 5) DEFAULT '0' NOT NULL,
	"price_elasticity" numeric(8, 5) NOT NULL,
	"ref_price" numeric(14, 2) NOT NULL,
	"psych_thresholds" jsonb,
	"mkt_sensitivity" numeric(8, 5) NOT NULL,
	"quality_sensitivity" numeric(8, 5) NOT NULL,
	"loyalty" numeric(8, 5) DEFAULT '0' NOT NULL,
	"payment_delay_days" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"params" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "markets_game_id_unique" UNIQUE("game_id")
);
--> statement-breakpoint
CREATE TABLE "production_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"unit_capacity" numeric(14, 3) NOT NULL,
	"availability" numeric(5, 4) DEFAULT '1' NOT NULL,
	"fixed_cost_per_round" numeric(14, 2) NOT NULL,
	"acquired_round" integer DEFAULT 0 NOT NULL,
	"retired_round" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"perceived_quality" numeric(8, 5) DEFAULT '1' NOT NULL,
	"current_price" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"code" text NOT NULL,
	"material" text NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"lead_time_rounds" integer DEFAULT 0 NOT NULL,
	"payment_delay_days" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"round_index" integer NOT NULL,
	"kind" "transaction_kind" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"quantity" numeric(14, 3),
	"label_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"event_definition_id" uuid NOT NULL,
	"round_started" integer NOT NULL,
	"rounds_left" integer NOT NULL,
	"team_id" uuid,
	"params" jsonb,
	"announced" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpis" (
	"round_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"kpi_code" text NOT NULL,
	"value" numeric(18, 6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kpis_round_id_team_id_kpi_code_pk" PRIMARY KEY("round_id","team_id","kpi_code")
);
--> statement-breakpoint
CREATE TABLE "round_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"income_statement" jsonb NOT NULL,
	"balance_sheet" jsonb NOT NULL,
	"cash_flow" jsonb NOT NULL,
	"market_detail" jsonb NOT NULL,
	"engine_trace" jsonb NOT NULL,
	"revenue" numeric(14, 2) NOT NULL,
	"net_income" numeric(14, 2) NOT NULL,
	"cash" numeric(14, 2) NOT NULL,
	"frng" numeric(14, 2) NOT NULL,
	"bfr" numeric(14, 2) NOT NULL,
	"net_treasury" numeric(14, 2) NOT NULL,
	"market_share" numeric(7, 6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hint_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"situation_instance_id" uuid NOT NULL,
	"hint_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_progress" (
	"user_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	"mastery" numeric(5, 2) DEFAULT '0' NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"last_event_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_progress_user_id_concept_id_pk" PRIMARY KEY("user_id","concept_id")
);
--> statement-breakpoint
CREATE TABLE "model_choices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"situation_instance_id" uuid NOT NULL,
	"decision_model_id" uuid NOT NULL,
	"justification" text,
	"relevance" "model_relevance" NOT NULL,
	"model_score" numeric(6, 4),
	"hinted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_skills" (
	"user_id" uuid NOT NULL,
	"axis" "skill_axis" NOT NULL,
	"value" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_skills_user_id_axis_pk" PRIMARY KEY("user_id","axis")
);
--> statement-breakpoint
CREATE TABLE "situation_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"situation_id" uuid NOT NULL,
	"origin" "situation_origin" NOT NULL,
	"status" "situation_status" DEFAULT 'open' NOT NULL,
	"diagnosis" jsonb,
	"opened_at" timestamp with time zone,
	"answered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_rankings" (
	"game_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"bpi" numeric(6, 2) NOT NULL,
	"rank" integer NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_rankings_game_id_team_id_pk" PRIMARY KEY("game_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"round_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"dimension" "score_dimension" NOT NULL,
	"raw" numeric(18, 6) NOT NULL,
	"normalized" numeric(6, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scores_round_id_team_id_dimension_pk" PRIMARY KEY("round_id","team_id","dimension")
);
--> statement-breakpoint
ALTER TABLE "decision_model_concepts" ADD CONSTRAINT "decision_model_concepts_decision_model_id_decision_models_id_fk" FOREIGN KEY ("decision_model_id") REFERENCES "public"."decision_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_model_concepts" ADD CONSTRAINT "decision_model_concepts_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_options" ADD CONSTRAINT "decision_options_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hints" ADD CONSTRAINT "hints_situation_id_situations_id_fk" FOREIGN KEY ("situation_id") REFERENCES "public"."situations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situation_concepts" ADD CONSTRAINT "situation_concepts_situation_id_situations_id_fk" FOREIGN KEY ("situation_id") REFERENCES "public"."situations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situation_concepts" ADD CONSTRAINT "situation_concepts_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situation_models" ADD CONSTRAINT "situation_models_situation_id_situations_id_fk" FOREIGN KEY ("situation_id") REFERENCES "public"."situations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situation_models" ADD CONSTRAINT "situation_models_decision_model_id_decision_models_id_fk" FOREIGN KEY ("decision_model_id") REFERENCES "public"."decision_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situations" ADD CONSTRAINT "situations_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_stages" ADD CONSTRAINT "competition_stages_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_competition_stage_id_competition_stages_id_fk" FOREIGN KEY ("competition_stage_id") REFERENCES "public"."competition_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_segment_id_market_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."market_segments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_segments" ADD CONSTRAINT "market_segments_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markets" ADD CONSTRAINT "markets_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_units" ADD CONSTRAINT "production_units_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_event_definition_id_event_definitions_id_fk" FOREIGN KEY ("event_definition_id") REFERENCES "public"."event_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_results" ADD CONSTRAINT "round_results_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_results" ADD CONSTRAINT "round_results_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hint_usages" ADD CONSTRAINT "hint_usages_situation_instance_id_situation_instances_id_fk" FOREIGN KEY ("situation_instance_id") REFERENCES "public"."situation_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hint_usages" ADD CONSTRAINT "hint_usages_hint_id_hints_id_fk" FOREIGN KEY ("hint_id") REFERENCES "public"."hints"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hint_usages" ADD CONSTRAINT "hint_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_choices" ADD CONSTRAINT "model_choices_situation_instance_id_situation_instances_id_fk" FOREIGN KEY ("situation_instance_id") REFERENCES "public"."situation_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_choices" ADD CONSTRAINT "model_choices_decision_model_id_decision_models_id_fk" FOREIGN KEY ("decision_model_id") REFERENCES "public"."decision_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_skills" ADD CONSTRAINT "player_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situation_instances" ADD CONSTRAINT "situation_instances_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situation_instances" ADD CONSTRAINT "situation_instances_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situation_instances" ADD CONSTRAINT "situation_instances_situation_id_situations_id_fk" FOREIGN KEY ("situation_id") REFERENCES "public"."situations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_rankings" ADD CONSTRAINT "game_rankings_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_rankings" ADD CONSTRAINT "game_rankings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "decision_options_scenario_code_uq" ON "decision_options" USING btree ("scenario_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "hints_situation_level_uq" ON "hints" USING btree ("situation_id","level");--> statement-breakpoint
CREATE UNIQUE INDEX "scenarios_code_version_uq" ON "scenarios" USING btree ("code","version");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_stages_uq" ON "competition_stages" USING btree ("competition_id","index");--> statement-breakpoint
CREATE UNIQUE INDEX "decisions_round_team_uq" ON "decisions" USING btree ("round_id","team_id");--> statement-breakpoint
CREATE INDEX "games_class_idx" ON "games" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "games_status_idx" ON "games" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "rounds_game_index_uq" ON "rounds" USING btree ("game_id","index");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_game_name_uq" ON "teams" USING btree ("game_id","name");--> statement-breakpoint
CREATE INDEX "classes_organization_idx" ON "classes" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_team_round_item_product_uq" ON "inventory" USING btree ("team_id","round_index","item","product_id");--> statement-breakpoint
CREATE INDEX "inventory_team_round_idx" ON "inventory" USING btree ("team_id","round_index");--> statement-breakpoint
CREATE UNIQUE INDEX "market_segments_market_code_uq" ON "market_segments" USING btree ("market_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "products_team_code_uq" ON "products" USING btree ("team_id","code");--> statement-breakpoint
CREATE INDEX "transactions_team_round_idx" ON "transactions" USING btree ("team_id","round_index");--> statement-breakpoint
CREATE INDEX "event_occurrences_game_idx" ON "event_occurrences" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "kpis_code_idx" ON "kpis" USING btree ("kpi_code");--> statement-breakpoint
CREATE UNIQUE INDEX "round_results_round_team_uq" ON "round_results" USING btree ("round_id","team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hint_usages_instance_level_uq" ON "hint_usages" USING btree ("situation_instance_id","level");--> statement-breakpoint
CREATE UNIQUE INDEX "situation_instances_uq" ON "situation_instances" USING btree ("round_id","team_id","situation_id");