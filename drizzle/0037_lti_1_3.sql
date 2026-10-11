-- LTI 1.3 : BUSINESS ARENA COMME OUTIL EXTERNE DE MOODLE (ET DE TOUTE PLATEFORME LTI 1.3).
--
-- Décision du propriétaire : « Oui, lance LTI 1.3 ». Migration ADDITIVE : sept tables
-- neuves, aucune table existante ne change.
--   · lti_plateformes : les plateformes inscrites (émetteur, client_id, déploiements,
--     adresses OIDC, jeton et clés), chacune rattachée à une organisation, celle dont la
--     licence s'applique ;
--   · lti_jetons_inscription : les jetons à usage unique de l'inscription dynamique ;
--   · lti_nonces : le state et le nonce d'une connexion OIDC, consommés au lancement ;
--   · lti_tickets : les tickets à usage unique (sélection de contenu, ouverture en
--     nouvelle fenêtre) ;
--   · lti_liens : l'activité placée dans un cours et ce qu'elle ouvre (partie ou cohorte) ;
--   · lti_comptes : la personne venue par la plateforme, par son sub HACHÉ ;
--   · lti_refus : le journal des refus, sans le jeton.
CREATE TABLE IF NOT EXISTS "lti_plateformes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"issuer" text NOT NULL,
	"client_id" text NOT NULL,
	"deployment_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"url_authentification" text NOT NULL,
	"url_jeton" text NOT NULL,
	"url_jwks" text NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
	"sel" text NOT NULL,
	"inscription" text DEFAULT 'manuelle' NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lti_plateformes_issuer_client_uq" ON "lti_plateformes" ("issuer", "client_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lti_plateformes_org_idx" ON "lti_plateformes" ("organization_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lti_jetons_inscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jeton" text NOT NULL UNIQUE,
	"organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
	"cree_par" uuid REFERENCES "users"("id") ON DELETE set null,
	"expire_le" timestamp with time zone NOT NULL,
	"utilise_le" timestamp with time zone,
	"plateforme_id" uuid REFERENCES "lti_plateformes"("id") ON DELETE set null,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lti_jetons_org_idx" ON "lti_jetons_inscription" ("organization_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lti_nonces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state" text NOT NULL UNIQUE,
	"nonce" text NOT NULL UNIQUE,
	"plateforme_id" uuid NOT NULL REFERENCES "lti_plateformes"("id") ON DELETE cascade,
	"expire_le" timestamp with time zone NOT NULL,
	"utilise_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lti_nonces_expire_idx" ON "lti_nonces" ("expire_le");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lti_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket" text NOT NULL UNIQUE,
	"type" text NOT NULL,
	"plateforme_id" uuid NOT NULL REFERENCES "lti_plateformes"("id") ON DELETE cascade,
	"donnees" jsonb NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"utilise_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lti_tickets_expire_idx" ON "lti_tickets" ("expire_le");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lti_liens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plateforme_id" uuid NOT NULL REFERENCES "lti_plateformes"("id") ON DELETE cascade,
	"deployment_id" text NOT NULL,
	"resource_link_id" text NOT NULL,
	"contexte_id" text,
	"contexte_titre" text,
	"titre" text,
	"cible_type" text,
	"game_id" uuid REFERENCES "games"("id") ON DELETE set null,
	"cohorte_id" uuid REFERENCES "episode_cohortes"("id") ON DELETE set null,
	"configure_par" uuid REFERENCES "users"("id") ON DELETE set null,
	"configure_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lti_liens_ressource_uq" ON "lti_liens" ("plateforme_id", "deployment_id", "resource_link_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lti_comptes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plateforme_id" uuid NOT NULL REFERENCES "lti_plateformes"("id") ON DELETE cascade,
	"sub_hache" text NOT NULL,
	"role" text NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"courriel" text,
	"dernier_lancement" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lti_comptes_sub_uq" ON "lti_comptes" ("plateforme_id", "sub_hache", "role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lti_comptes_user_idx" ON "lti_comptes" ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lti_refus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"etape" text NOT NULL,
	"motif" text NOT NULL,
	"issuer" text,
	"plateforme_id" uuid REFERENCES "lti_plateformes"("id") ON DELETE set null,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lti_refus_date_idx" ON "lti_refus" ("created_at");
