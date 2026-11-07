-- LE SUIVI DES ACTIVITÉS EN CLASSE (décision du propriétaire, novembre 2026 ; la règle :
-- pedagogy/cours/suivi-des-activites.ts).
--
-- Un bureau, une enquête ou un scénario est corrigé au serveur ; l'action serveur qui le corrige
-- écrit ici, pour l'élève membre d'une classe, où il en est : l'état, les essais, les étapes, les
-- remarques du correcteur sur ses essais manqués (bornées) et, pour un scénario, la fin atteinte.
-- L'enseignant de la classe le lit sur sa page (/teacher/cours/[id]). Sans ligne : pas commencé.
CREATE TABLE IF NOT EXISTS "cours_activites" (
	"user_id" uuid NOT NULL,
	"classe_id" uuid NOT NULL,
	"nature" text NOT NULL,
	"code" text NOT NULL,
	"etat" text DEFAULT 'en-cours' NOT NULL,
	"essais" integer DEFAULT 0 NOT NULL,
	"etapes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"erreurs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"fin" text,
	"meilleure" boolean,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cours_activites_user_id_classe_id_nature_code_pk" PRIMARY KEY("user_id","classe_id","nature","code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cours_activites" ADD CONSTRAINT "cours_activites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cours_activites" ADD CONSTRAINT "cours_activites_classe_id_cours_classes_id_fk" FOREIGN KEY ("classe_id") REFERENCES "public"."cours_classes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cours_activites_classe_idx" ON "cours_activites" USING btree ("classe_id");
