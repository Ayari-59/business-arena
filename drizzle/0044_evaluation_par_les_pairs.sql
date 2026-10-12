-- L'ÉVALUATION ENTRE COÉQUIPIERS, DANS UNE PARTIE DE CLASSE (façon « peer evaluation »).
--
-- Chaque étudiant note la contribution de ses coéquipiers ; l'enseignant module la note
-- d'équipe par un facteur individuel (méthode type WebPA, config/pairs/calcul.ts).
-- Migration ADDITIVE et REJOUABLE :
--   · pairs_evaluations : l'évaluation activée sur une partie (moments, critères copiés,
--     auto-évaluation, commentaire, bornes du facteur, barème, version de la méthode) ;
--   · pairs_moments : la publication de chaque moment et les notes d'équipe saisies ;
--   · pairs_reponses : une réponse par évaluateur et par évalué, critère par critère, et
--     son commentaire facultatif (lu par le seul enseignant).
-- Tout part avec la partie (cascade) ; aucune adresse électronique n'est stockée.
CREATE TABLE IF NOT EXISTS "pairs_evaluations" (
	"game_id" uuid PRIMARY KEY NOT NULL REFERENCES "games"("id") ON DELETE cascade,
	"active" boolean DEFAULT true NOT NULL,
	"moments" text[] NOT NULL,
	"criteres" jsonb NOT NULL,
	"auto_evaluation" boolean DEFAULT false NOT NULL,
	"commentaire" boolean DEFAULT true NOT NULL,
	"borne_basse" double precision NOT NULL,
	"borne_haute" double precision NOT NULL,
	"bareme" integer DEFAULT 20 NOT NULL,
	"methode_version" integer NOT NULL,
	"cree_par" uuid REFERENCES "users"("id") ON DELETE set null,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pairs_evaluations_moments_ck" CHECK (cardinality("moments") >= 1 AND "moments" <@ ARRAY['mi_parcours', 'fin']::text[]),
	CONSTRAINT "pairs_evaluations_bornes_ck" CHECK ("borne_basse" > 0 AND "borne_basse" <= 1 AND "borne_haute" >= 1 AND "borne_basse" < "borne_haute"),
	CONSTRAINT "pairs_evaluations_bareme_ck" CHECK ("bareme" IN (20, 100)),
	CONSTRAINT "pairs_evaluations_criteres_ck" CHECK (jsonb_typeof("criteres") = 'array' AND jsonb_array_length("criteres") >= 1)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pairs_moments" (
	"game_id" uuid NOT NULL REFERENCES "games"("id") ON DELETE cascade,
	"moment" text NOT NULL,
	"publie_le" timestamp with time zone,
	"notes_d_equipe" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pairs_moments_pk" PRIMARY KEY ("game_id", "moment"),
	CONSTRAINT "pairs_moments_moment_ck" CHECK ("moment" IN ('mi_parcours', 'fin'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pairs_reponses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL REFERENCES "games"("id") ON DELETE cascade,
	"moment" text NOT NULL,
	"team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE cascade,
	"evaluateur_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"evalue_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"notes" jsonb NOT NULL,
	"commentaire" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pairs_reponses_moment_ck" CHECK ("moment" IN ('mi_parcours', 'fin')),
	CONSTRAINT "pairs_reponses_notes_ck" CHECK (jsonb_typeof("notes") = 'object')
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pairs_reponses_uq" ON "pairs_reponses" ("game_id", "moment", "evaluateur_id", "evalue_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pairs_reponses_equipe_idx" ON "pairs_reponses" ("game_id", "moment", "team_id");
