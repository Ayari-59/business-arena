-- Rendue rejouable le 14/09/2026.
--
-- Cette migration figurait au journal mais n'a jamais été enregistrée par
-- drizzle : sa date était sous celle de la dernière ligne de la table de suivi,
-- donc `drizzle-kit migrate` la considérait appliquée et ne l'a jamais jouée.
-- Elle est redatée pour tourner enfin — d'où la nécessité qu'elle ne casse pas
-- si ses tables sont déjà là.
--
-- Les deux clés étrangères passent par un bloc DO : PostgreSQL n'accepte pas
-- `IF NOT EXISTS` sur ADD CONSTRAINT, et `duplicate_object` est justement
-- l'erreur qu'il lève quand la contrainte existe déjà.
CREATE TABLE IF NOT EXISTS "completed_learning_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"step_id" text NOT NULL,
	"path_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_path_progression" (
	"user_id" uuid NOT NULL,
	"path_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completion_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_path_progression_user_id_path_id_pk" PRIMARY KEY("user_id","path_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "completed_learning_steps" ADD CONSTRAINT "completed_learning_steps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_path_progression" ADD CONSTRAINT "learning_path_progression_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "completed_learning_steps_user_idx" ON "completed_learning_steps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "completed_learning_steps_step_idx" ON "completed_learning_steps" USING btree ("step_id");
