-- Les connexions à des services extérieurs réglées depuis l'administration
-- (l'agenda Google, d'abord) : une ligne par service, secrets chiffrés.
-- Table NOUVELLE, écrite en IF NOT EXISTS et DO/EXCEPTION pour rester rejouable.
CREATE TABLE IF NOT EXISTS "integrations" (
  "key" text PRIMARY KEY NOT NULL,
  "value" jsonb NOT NULL,
  "updated_by" uuid,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "integrations" ADD CONSTRAINT "integrations_updated_by_users_id_fk"
    FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
