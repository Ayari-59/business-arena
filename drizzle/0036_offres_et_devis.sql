-- LES OFFRES DE LA GRILLE, ET LA DEMANDE DE DEVIS ÉCRITE.
--
-- Décision du propriétaire (octobre 2026) : « Les épisodes sont facturés à part. Les
-- offres : Classe 490, Campus 990. Sans les épisodes. La vente se fait sur devis. »
--
-- 1. Une licence porte désormais son PÉRIMÈTRE :
--   · arene : l'offre de l'arène qu'elle ouvre, 'classe' (un enseignant) ou 'campus'
--     (tout l'établissement) ; NULL, la licence n'ouvre pas l'arène (épisodes seuls) ;
--   · episodes : la licence ouvre-t-elle les épisodes manager non démo ?
--   Les licences DÉJÀ en base prennent le défaut prudent : l'arène, SANS les épisodes.
--   Celles qui plafonnent à un enseignant deviennent 'classe', les autres 'campus'. Un
--   client qui avait acheté les épisodes se coche à la main dans /admin (« Épisodes
--   manager »). Une ligne insérée sans ces colonnes est une licence de l'arène.
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "arene" text DEFAULT 'campus';
--> statement-breakpoint
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "episodes" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "org_licences" SET "arene" = 'classe' WHERE "arene" = 'campus' AND "max_teachers" = 1;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_licences" ADD CONSTRAINT "org_licences_perimetre_check" CHECK (("arene" IS NULL OR "arene" IN ('classe', 'campus')) AND ("arene" IS NOT NULL OR "episodes"));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- 2. La demande de devis écrite (/devis?offre=…) : qui demande, pour quelle offre, pour
--    combien d'enseignants ou de managers. Elle est enregistrée avant tout courriel ;
--    l'administration la lit quoi qu'il arrive, et sait si les courriels sont partis.
CREATE TABLE IF NOT EXISTS "demandes_de_devis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offre" text NOT NULL,
	"nom" text NOT NULL,
	"fonction" text NOT NULL,
	"organisation" text NOT NULL,
	"identifiant" text DEFAULT '' NOT NULL,
	"effectif" integer,
	"email" text NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"ip" text,
	"notification_envoyee" boolean DEFAULT false NOT NULL,
	"accuse_envoye" boolean DEFAULT false NOT NULL,
	"traitee_par" uuid REFERENCES "users"("id") ON DELETE set null,
	"traitee_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "demandes_de_devis_cree_idx" ON "demandes_de_devis" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "demandes_de_devis_ip_idx" ON "demandes_de_devis" USING btree ("ip","created_at");
