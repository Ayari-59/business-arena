-- LES COHORTES D'ÉPISODES MANAGER, ET LE CODE QUI REND UN PROFIL.
--
-- Une entreprise déploie les épisodes par groupe : une cohorte se rejoint par
-- un code, et son animateur la suit par une clé secrète qui n'ouvre que des
-- agrégats, jamais un nom. Le profil d'une personne était attaché au cookie
-- de son appareil : un code de reprise le lui rend depuis un autre poste.
CREATE TABLE IF NOT EXISTS "episode_cohortes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL UNIQUE,
	"nom" text NOT NULL,
	"cle_animateur" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "episode_membres" (
	"user_id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"cohorte_id" uuid NOT NULL REFERENCES "episode_cohortes"("id") ON DELETE cascade,
	"depuis" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "episode_membres_cohorte_idx" ON "episode_membres" ("cohorte_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "episode_reprises" (
	"user_id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"code" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
