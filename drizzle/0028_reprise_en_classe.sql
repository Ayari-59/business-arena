-- LE CODE DE REPRISE D'UN JOUEUR, DANS UNE PARTIE DE CLASSE.
--
-- L'élève est reconnu par son cookie invité, donc par son navigateur. Il
-- change de poste, vide ses cookies, passe au téléphone : l'application ne le
-- reconnaît plus et le range dans une équipe quelconque, sans message et sans
-- retour possible. Le concours avait déjà son remède (0025) ; la classe, non.
--
-- Une table à part, et non une colonne de « players », parce que le code
-- appartient au couple (partie, élève) et non à son équipe : changer d'équipe
-- supprime et réinsère la ligne « players », ce qui aurait effacé un code que
-- l'élève venait justement de noter.
--
-- Table NOUVELLE, écrite en IF NOT EXISTS et DO/EXCEPTION pour rester rejouable.
CREATE TABLE IF NOT EXISTS "game_recoveries" (
  "game_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "recovery_code" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "game_recoveries_game_id_user_id_pk" PRIMARY KEY("game_id","user_id")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "game_recoveries" ADD CONSTRAINT "game_recoveries_game_id_games_id_fk"
    FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "game_recoveries" ADD CONSTRAINT "game_recoveries_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "game_recoveries_code_uq" ON "game_recoveries" USING btree ("recovery_code");
