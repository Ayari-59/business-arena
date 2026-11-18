-- LE BROUILLON D'ÉQUIPE. La feuille de décision enregistre la saisie de l'équipe sur le serveur
-- pendant le tour : les coéquipiers la retrouvent, d'un appareil à l'autre, et l'enseignant la voit
-- « pas encore validée » au pilotage. Elle vit dans la ligne `decisions` du tour, au statut `draft`
-- que le schéma prévoyait déjà : une seule ligne par équipe et par tour.
--
-- Purement additive : trois colonnes facultatives, aucune donnée existante réécrite. Rejouable.
ALTER TABLE "decisions" ADD COLUMN IF NOT EXISTS "saisie" jsonb;
--> statement-breakpoint
ALTER TABLE "decisions" ADD COLUMN IF NOT EXISTS "modifie_par" uuid;
--> statement-breakpoint
ALTER TABLE "decisions" ADD COLUMN IF NOT EXISTS "modifie_le" timestamp with time zone;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decisions" ADD CONSTRAINT "decisions_modifie_par_users_id_fk" FOREIGN KEY ("modifie_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
