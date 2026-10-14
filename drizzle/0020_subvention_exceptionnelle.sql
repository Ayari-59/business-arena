-- La demande de subvention exceptionnelle : le dernier recours d'une équipe
-- en cessation de paiements.
--
-- Le tour qui suit une crise exige un financement de sauvetage. Quand les deux
-- leviers de l'équipe sont épuisés — la banque ne prête plus, l'enveloppe des
-- associés est vide —, elle n'a plus rien à décider et se trouve bloquée. Elle
-- dépose alors un dossier, que l'animateur accorde ou refuse depuis son espace.
--
-- Table NOUVELLE : rien n'est modifié ni supprimé, aucune partie en cours n'est
-- touchée. Écrite en IF NOT EXISTS et en DO/EXCEPTION pour rester rejouable
-- sans risque sur une base où quelqu'un l'aurait déjà passée à la main.
--
-- Numérotée 0020 : premier numéro libre après 0019 (les fichiers 0013 à 0018
-- existent sur le disque mais ne figurent pas tous au journal — voir
-- scripts/verifier-migrations.ts).
DO $$ BEGIN
  CREATE TYPE "public"."aid_request_status" AS ENUM('pending', 'granted', 'refused');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aid_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "game_id" uuid NOT NULL,
  "team_id" uuid NOT NULL,
  "round_index" integer NOT NULL,
  "amount" numeric(14, 2) NOT NULL,
  "reason" text NOT NULL,
  "status" "aid_request_status" DEFAULT 'pending' NOT NULL,
  "granted_amount" numeric(14, 2),
  "decision_note" text,
  "decided_by" uuid,
  "decided_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "aid_requests" ADD CONSTRAINT "aid_requests_game_id_games_id_fk"
    FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "aid_requests" ADD CONSTRAINT "aid_requests_team_id_teams_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "aid_requests" ADD CONSTRAINT "aid_requests_decided_by_users_id_fk"
    FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "aid_requests_team_round_uq" ON "aid_requests" ("team_id","round_index");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aid_requests_game_status_idx" ON "aid_requests" ("game_id","status");
