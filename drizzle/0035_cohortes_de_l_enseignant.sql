-- LES COHORTES CRÉÉES PAR L'ENSEIGNANT.
--
-- Décision du propriétaire : « des cohortes créées par l'enseignant ». Depuis son
-- espace, un enseignant sous licence crée une cohorte : un nom, des épisodes choisis.
-- Trois colonnes, toutes nulles pour les cohortes d'avant, créées par l'administrateur :
--   · cree_par : l'enseignant qui l'a créée ; lui seul la voit et la modifie dans son
--     espace. Nul : une cohorte de l'administration.
--   · episodes : les épisodes que la cohorte ouvre à ses membres (codes du registre).
--     Nul : tous les épisodes, la règle des cohortes de l'administration.
--   · close_le : la cohorte est close. Plus de nouveaux participants, plus de nouvel
--     épisode ouvert par elle ; une partie commencée se termine et reste gardée.
ALTER TABLE "episode_cohortes" ADD COLUMN IF NOT EXISTS "cree_par" uuid;
--> statement-breakpoint
ALTER TABLE "episode_cohortes" ADD COLUMN IF NOT EXISTS "episodes" jsonb;
--> statement-breakpoint
ALTER TABLE "episode_cohortes" ADD COLUMN IF NOT EXISTS "close_le" timestamp with time zone;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "episode_cohortes" ADD CONSTRAINT "episode_cohortes_cree_par_users_id_fk" FOREIGN KEY ("cree_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "episode_cohortes_cree_par_idx" ON "episode_cohortes" USING btree ("cree_par");
