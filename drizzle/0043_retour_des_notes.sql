-- LE RETOUR DES NOTES DANS LE CARNET DE NOTES DE LA PLATEFORME (LTI ADVANTAGE, AGS 1.3).
--
-- Décision du propriétaire, après comparaison avec Capsim : la note d'un examen part
-- d'elle-même dans le carnet de notes de Moodle ou de Canvas, au lieu d'être recopiée.
-- Migration ADDITIVE et REJOUABLE :
--   · lti_liens : ce que la plateforme a accordé à l'activité au dernier lancement (les
--     portées du service de notes, l'adresse de ses colonnes, la colonne qu'elle a créée
--     elle-même), et la colonne que l'outil a créée faute de mieux, avec son identifiant
--     de ressource stable (« examen:<id> ») : une seule par ressource ;
--   · lti_notes_eleves : l'élève d'une activité qui accorde le retour des notes, et son
--     identifiant chez la plateforme (le `sub`), CHIFFRÉ avec le secret de l'hébergement :
--     c'est l'adresse de sa note dans le carnet, rien d'autre ;
--   · lti_notes_envois : le journal d'envoi, une ligne par activité et par élève : ce qui
--     doit partir (une note, son retrait, une progression), l'état, la date, le code HTTP
--     de la plateforme, un message lisible et le nombre d'essais.
ALTER TABLE "lti_liens" ADD COLUMN IF NOT EXISTS "ags_portees" jsonb;
--> statement-breakpoint
ALTER TABLE "lti_liens" ADD COLUMN IF NOT EXISTS "ags_lineitems" text;
--> statement-breakpoint
ALTER TABLE "lti_liens" ADD COLUMN IF NOT EXISTS "ags_lineitem" text;
--> statement-breakpoint
ALTER TABLE "lti_liens" ADD COLUMN IF NOT EXISTS "ags_lineitem_cree" text;
--> statement-breakpoint
ALTER TABLE "lti_liens" ADD COLUMN IF NOT EXISTS "ags_ressource" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lti_notes_eleves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lien_id" uuid NOT NULL REFERENCES "lti_liens"("id") ON DELETE cascade,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"sub_chiffre" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lti_notes_eleves_uq" ON "lti_notes_eleves" ("lien_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lti_notes_eleves_user_idx" ON "lti_notes_eleves" ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lti_notes_envois" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lien_id" uuid NOT NULL REFERENCES "lti_liens"("id") ON DELETE cascade,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"ressource" text NOT NULL,
	"nature" text NOT NULL,
	"note" double precision,
	"commentaire" text,
	"etat" text DEFAULT 'a-envoyer' NOT NULL,
	"temporaire" boolean DEFAULT false NOT NULL,
	"code_http" integer,
	"message" text,
	"essais" integer DEFAULT 0 NOT NULL,
	"dernier_essai" timestamp with time zone,
	"prochain_essai" timestamp with time zone,
	"envoye_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lti_notes_envois_nature_ck" CHECK ("nature" IN ('note', 'retrait', 'commencee', 'terminee')),
	CONSTRAINT "lti_notes_envois_etat_ck" CHECK ("etat" IN ('a-envoyer', 'envoi', 'envoye', 'erreur')),
	CONSTRAINT "lti_notes_envois_note_ck" CHECK ("note" IS NULL OR ("note" >= 0 AND "note" <= 100))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lti_notes_envois_uq" ON "lti_notes_envois" ("lien_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lti_notes_envois_ressource_idx" ON "lti_notes_envois" ("ressource");
