-- LE RGPD ET LE TUTEUR IA, DÉCISIONS DU PROPRIÉTAIRE D'OCTOBRE 2026.
--
-- Migration ADDITIVE et REJOUABLE (générée par `npm run db:generate`, puis réduite à ce
-- qui change ici : le dernier instantané du dossier meta datait de 0017) :
--   · users.averti_inactivite_le : la date de l'e-mail qui annonce la suppression d'un
--     compte enseignant resté 3 ans sans connexion (services/purge.service.ts) ;
--   · games.tuteur_actif : l'enseignant peut couper le tuteur IA de sa partie. Vrai pour
--     toutes les parties existantes : rien ne change tant qu'il n'y touche pas ;
--   · tuteur_questions : le nombre de questions posées au tuteur, par partie et par élève,
--     pour tenir le quota (config/tuteur.ts). Aucun texte de question n'y est gardé.
-- Aucune colonne supprimée, aucune donnée réécrite.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "averti_inactivite_le" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "tuteur_actif" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tuteur_questions" (
	"game_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"nombre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tuteur_questions_game_id_user_id_pk" PRIMARY KEY("game_id","user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tuteur_questions" ADD CONSTRAINT "tuteur_questions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tuteur_questions" ADD CONSTRAINT "tuteur_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
