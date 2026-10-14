-- La demande de simulation : ce qu'un enseignant nous écrit depuis la page
-- « Quelle simulation pour votre classe ». Le formulaire remplace le courriel
-- pré-rempli : la demande est recueillie et gardée ici, le courriel à
-- l'adresse de contact n'est qu'une notification.
--
-- Table NOUVELLE : rien n'est modifié ni supprimé. Écrite en IF NOT EXISTS et
-- en DO/EXCEPTION pour rester rejouable.
DO $$ BEGIN
  CREATE TYPE "public"."orientation_request_status" AS ENUM('new', 'handled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orientation_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "school" text NOT NULL,
  "email" text NOT NULL,
  "diplome" text NOT NULL,
  "semestre" text NOT NULL,
  "objectif" text NOT NULL,
  "message" text DEFAULT '' NOT NULL,
  "recommendation" jsonb NOT NULL,
  "ip" text,
  "mail_sent" boolean DEFAULT false NOT NULL,
  "status" "orientation_request_status" DEFAULT 'new' NOT NULL,
  "handled_by" uuid,
  "handled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "orientation_requests" ADD CONSTRAINT "orientation_requests_handled_by_users_id_fk"
    FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orientation_requests_status_idx" ON "orientation_requests" ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orientation_requests_ip_idx" ON "orientation_requests" ("ip","created_at");
