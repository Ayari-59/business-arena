-- L'EXAMEN INDIVIDUEL, FAÇON COMP-XM : UNE PARTIE SOLO NOTÉE, UN RELEVÉ PAR COMPÉTENCE.
--
-- Décision du propriétaire, après comparaison avec Capsim : « Lance l'examen individuel
-- façon Comp-XM. » Migration ADDITIVE et REJOUABLE :
--   · examens : l'examen créé par l'enseignant (entreprise, niveau, tours, durée par tour,
--     fenêtre, questions, tentatives, graine commune ou lot de graines, grille de notation
--     COPIÉE et figée à la création, publication, clôture) ;
--   · examen_candidats : un candidat par tentative, son identification (compte, LTI,
--     RENATER, ou nom et numéro d'étudiant saisis : jamais d'adresse électronique), sa
--     partie, sa graine, sa remise, sa note et son détail ;
--   · lti_liens.examen_id : une activité de cours peut ouvrir un examen ;
--   · org_licences.examen : la licence ouvre-t-elle le module de l'examen ? Les licences
--     Programme et Campus déjà posées le reçoivent (inclus par défaut), pas les Classe ;
--   · le catalogue : le module « examen », à effet, composé par défaut dans les offres
--     Programme et Campus (le propriétaire en change la composition dans /admin/offres).
CREATE TABLE IF NOT EXISTS "examens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
	"cree_par" uuid REFERENCES "users"("id") ON DELETE set null,
	"nom" text NOT NULL,
	"code" text NOT NULL,
	"scenario_code" text NOT NULL,
	"niveau" integer NOT NULL,
	"tours" integer NOT NULL,
	"duree_tour_minutes" integer,
	"ouverture" timestamp with time zone,
	"fermeture" timestamp with time zone,
	"questions" boolean DEFAULT false NOT NULL,
	"resultat_estime" boolean DEFAULT true NOT NULL,
	"tentatives" integer DEFAULT 1 NOT NULL,
	"mode_graine" text NOT NULL,
	"graines" integer[] NOT NULL,
	"equite" jsonb,
	"grille_code" text NOT NULL,
	"grille_version" integer NOT NULL,
	"grille" jsonb NOT NULL,
	"publie_le" timestamp with time zone,
	"clos_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "examens_mode_graine_ck" CHECK ("mode_graine" IN ('commune', 'lot')),
	CONSTRAINT "examens_niveau_ck" CHECK ("niveau" BETWEEN 1 AND 6),
	CONSTRAINT "examens_tours_ck" CHECK ("tours" >= 1),
	CONSTRAINT "examens_tentatives_ck" CHECK ("tentatives" BETWEEN 1 AND 5),
	CONSTRAINT "examens_duree_ck" CHECK ("duree_tour_minutes" IS NULL OR "duree_tour_minutes" >= 1),
	CONSTRAINT "examens_fenetre_ck" CHECK ("ouverture" IS NULL OR "fermeture" IS NULL OR "ouverture" < "fermeture"),
	CONSTRAINT "examens_graines_ck" CHECK (cardinality("graines") >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "examens_code_uq" ON "examens" ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "examens_org_idx" ON "examens" ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "examens_cree_par_idx" ON "examens" ("cree_par");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "examen_candidats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"examen_id" uuid NOT NULL REFERENCES "examens"("id") ON DELETE cascade,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"nom" text NOT NULL,
	"numero_etudiant" text,
	"identification" text NOT NULL,
	"tentative" integer DEFAULT 1 NOT NULL,
	"game_id" uuid REFERENCES "games"("id") ON DELETE set null,
	"graine" integer NOT NULL,
	"commence_le" timestamp with time zone DEFAULT now() NOT NULL,
	"remis_le" timestamp with time zone,
	"note" double precision,
	"notation" jsonb,
	"note_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "examen_candidats_identification_ck" CHECK ("identification" IN ('compte', 'lti', 'renater', 'saisie')),
	CONSTRAINT "examen_candidats_note_ck" CHECK ("note" IS NULL OR ("note" >= 0 AND "note" <= 100))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "examen_candidats_examen_idx" ON "examen_candidats" ("examen_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "examen_candidats_user_uq" ON "examen_candidats" ("examen_id", "user_id", "tentative");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "examen_candidats_numero_uq" ON "examen_candidats" ("examen_id", "numero_etudiant", "tentative") WHERE "numero_etudiant" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "examen_candidats_game_uq" ON "examen_candidats" ("game_id");
--> statement-breakpoint
ALTER TABLE "lti_liens" ADD COLUMN IF NOT EXISTS "examen_id" uuid REFERENCES "examens"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "examen" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
-- Les licences déjà posées : celles vendues depuis une offre suivent l'offre (Programme,
-- Campus) ; les autres, leur palier de l'arène. Rejouable : on ne fait que poser le vrai.
UPDATE "org_licences" SET "examen" = true
 WHERE "examen" = false
   AND "arene" IS NOT NULL
   AND (("offre_code" IS NOT NULL AND "offre_code" IN ('programme', 'campus'))
        OR ("offre_code" IS NULL AND "arene" IN ('programme', 'campus')));
--> statement-breakpoint
-- Le module « examen » a un effet dans le produit : la contrainte l'accepte.
ALTER TABLE "catalogue_modules" DROP CONSTRAINT IF EXISTS "catalogue_modules_effet_ck";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "catalogue_modules" ADD CONSTRAINT "catalogue_modules_effet_ck" CHECK ("effet" IS NULL OR "effet" IN ('arene', 'episodes', 'examen'));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
INSERT INTO "catalogue_modules" ("code", "nom", "description", "effet", "actif", "ordre")
SELECT 'examen', 'Examen individuel',
       'Une partie solo notée sur une grille fixe, la même pour tous les candidats, et un relevé par compétence pour le dossier d''accréditation.',
       'examen', true, 25
 WHERE EXISTS (SELECT 1 FROM "catalogue_modules")
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
UPDATE "catalogue_offres"
   SET "modules" = "modules" || '[{"module": "examen"}]'::jsonb, "updated_at" = now()
 WHERE "code" IN ('programme', 'campus')
   AND NOT ("modules" @> '[{"module": "examen"}]'::jsonb);
