-- LE MOT DE PASSE OUBLIÉ DES ENSEIGNANTS (services/mot-de-passe-oublie.service.ts).
--
-- Migration ADDITIVE et REJOUABLE (générée par `npm run db:generate`, puis réduite à ce
-- qui change ici : l'instantané précédent datait de 0050, la génération reprenait aussi
-- les colonnes de cours_classes déjà posées par 0052) :
--   · jetons_de_reinitialisation : un jeton par demande, gardé sous forme d'EMPREINTE
--     (SHA-256), valable une heure, à usage unique (utilise_le). La purge de chaque nuit
--     retire les jetons expirés ; la suppression du compte les emporte (cascade).
-- Aucune colonne supprimée, aucune donnée réécrite.
CREATE TABLE IF NOT EXISTS "jetons_de_reinitialisation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"empreinte" text NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"utilise_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jetons_de_reinitialisation_empreinte_unique" UNIQUE("empreinte")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jetons_de_reinitialisation" ADD CONSTRAINT "jetons_de_reinitialisation_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jetons_de_reinitialisation_user_idx" ON "jetons_de_reinitialisation" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jetons_de_reinitialisation_expire_idx" ON "jetons_de_reinitialisation" USING btree ("expire_le");
