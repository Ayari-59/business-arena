-- LE CODE DE REPRISE D'UN JOUEUR DE CONCOURS.
--
-- Un élève de concours est reconnu par son cookie invité, donc par son
-- navigateur : changer de poste le rendait méconnaissable, et le laissait
-- dehors une fois les inscriptions closes. Chaque membre reçoit désormais un
-- code personnel qui rend son identité depuis n'importe quel appareil.
--
-- Table NOUVELLE, écrite en IF NOT EXISTS et DO/EXCEPTION pour rester rejouable.
CREATE TABLE IF NOT EXISTS "competition_members" (
  "competition_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "team_label" text NOT NULL,
  "recovery_code" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "competition_members_competition_id_user_id_pk" PRIMARY KEY("competition_id","user_id")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "competition_members" ADD CONSTRAINT "competition_members_competition_id_competitions_id_fk"
    FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "competition_members" ADD CONSTRAINT "competition_members_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "competition_members_code_uq" ON "competition_members" USING btree ("recovery_code");
