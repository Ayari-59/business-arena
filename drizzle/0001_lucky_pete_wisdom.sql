CREATE TABLE "company_states" (
	"team_id" uuid NOT NULL,
	"round_index" integer NOT NULL,
	"state" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_states_team_id_round_index_pk" PRIMARY KEY("team_id","round_index")
);
--> statement-breakpoint
ALTER TABLE "company_states" ADD CONSTRAINT "company_states_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;