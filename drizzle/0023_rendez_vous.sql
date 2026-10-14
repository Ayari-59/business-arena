-- Le rendez-vous téléphonique : un créneau réservé depuis /rendez-vous, écrit
-- ici d'abord, posé ensuite dans l'agenda Google. L'index unique partiel
-- empêche deux réservations de porter le même créneau tant qu'elles tiennent.
--
-- Table NOUVELLE : rien n'est modifié ni supprimé. Écrite en IF NOT EXISTS et
-- en DO/EXCEPTION pour rester rejouable.
DO $$ BEGIN
  CREATE TYPE "public"."appointment_status" AS ENUM('confirmed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phone_appointments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "school" text NOT NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "message" text DEFAULT '' NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "status" "appointment_status" DEFAULT 'confirmed' NOT NULL,
  "calendar_event_id" text,
  "calendar_link" text,
  "mail_sent" boolean DEFAULT false NOT NULL,
  "ip" text,
  "cancelled_by" uuid,
  "cancelled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "phone_appointments" ADD CONSTRAINT "phone_appointments_cancelled_by_users_id_fk"
    FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "phone_appointments_slot_idx" ON "phone_appointments" ("starts_at") WHERE "status" = 'confirmed';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_appointments_starts_idx" ON "phone_appointments" ("starts_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_appointments_ip_idx" ON "phone_appointments" ("ip","created_at");
