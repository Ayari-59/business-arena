-- LES PARTIES D'ÉPISODES MANAGER.
--
-- Un épisode joué n'était gardé nulle part : le bilan s'affichait, puis tout
-- disparaissait avec l'onglet. Pour suivre la qualité de décision d'un
-- manager d'un épisode à l'autre, il faut garder ce qu'il a fait — ses
-- choix, les informations qu'il a ouvertes, son diagnostic, sa prévision —
-- et rien d'autre : les scores se recalculent toujours à partir de ces faits.
--
-- La clé est tirée par le navigateur au début de la partie : recharger le
-- bilan ne crée pas une deuxième ligne. Aucun texte libre n'est stocké.
CREATE TABLE IF NOT EXISTS "episode_parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"cle" uuid NOT NULL,
	"episode_code" text NOT NULL,
	"version_modele" integer NOT NULL,
	"niveau" text NOT NULL,
	"graine" integer NOT NULL,
	"chemin" jsonb NOT NULL,
	"consultes" jsonb NOT NULL,
	"jours" double precision NOT NULL,
	"diagnostic" text NOT NULL,
	"reevaluation" jsonb NOT NULL,
	"prevision" double precision NOT NULL,
	"confiance" integer NOT NULL,
	"premiere" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "episode_parties_cle_uq" ON "episode_parties" ("user_id", "cle");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "episode_parties_user_idx" ON "episode_parties" ("user_id", "created_at");
