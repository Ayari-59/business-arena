-- LE COURS PAR LA SIMULATION, SUIVI EN CLASSE.
--
-- Décision du propriétaire : le cours se suit seul ou en classe. L'enseignant crée une
-- classe, les élèves la rejoignent par son code sous un prénom ou un pseudonyme, et leur
-- progression remonte chapitre par chapitre. Migration ADDITIVE et REJOUABLE :
--   · cours_classes : la classe, son code, son enseignant, l'entreprise imposée (ou non) ;
--   · cours_eleves : l'appartenance d'un élève à une classe (une seule à la fois) ;
--   · cours_progressions : où l'élève en est dans un chapitre, et les remarques du
--     correcteur sur ses essais manqués.
-- Tout disparaît avec la classe (cascade) ou avec l'élève.
CREATE TABLE IF NOT EXISTS "cours_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"nom" text NOT NULL,
	"cree_par" uuid NOT NULL,
	"entreprise" text,
	"close_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cours_classes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cours_eleves" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"classe_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"depuis" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cours_progressions" (
	"user_id" uuid NOT NULL,
	"classe_id" uuid NOT NULL,
	"chapitre" text NOT NULL,
	"entreprise" text NOT NULL,
	"etape" integer DEFAULT 0 NOT NULL,
	"etapes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"erreurs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cours_progressions_user_id_classe_id_chapitre_pk" PRIMARY KEY("user_id","classe_id","chapitre")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "cours_classes" ADD CONSTRAINT "cours_classes_cree_par_users_id_fk" FOREIGN KEY ("cree_par") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "cours_eleves" ADD CONSTRAINT "cours_eleves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "cours_eleves" ADD CONSTRAINT "cours_eleves_classe_id_cours_classes_id_fk" FOREIGN KEY ("classe_id") REFERENCES "public"."cours_classes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "cours_progressions" ADD CONSTRAINT "cours_progressions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "cours_progressions" ADD CONSTRAINT "cours_progressions_classe_id_cours_classes_id_fk" FOREIGN KEY ("classe_id") REFERENCES "public"."cours_classes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cours_classes_cree_par_idx" ON "cours_classes" USING btree ("cree_par");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cours_eleves_classe_idx" ON "cours_eleves" USING btree ("classe_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cours_progressions_classe_idx" ON "cours_progressions" USING btree ("classe_id","chapitre");
