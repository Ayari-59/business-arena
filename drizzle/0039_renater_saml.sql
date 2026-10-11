-- SAML 2.0 : BUSINESS ARENA, FOURNISSEUR DE SERVICES DE LA FÉDÉRATION ÉDUCATION-RECHERCHE (RENATER).
--
-- Décision du propriétaire : « Lance la partie technique RENATER ». Migration ADDITIVE :
-- sept tables neuves, aucune table existante ne change.
--   · saml_idps : le cache de l'agrégat SIGNÉ de la fédération (adresse, certificats,
--     portées, nom de chaque IdP) et le sel qui hache les identifiants de ses personnes ;
--   · saml_federations : la dernière lecture de l'agrégat (quand, combien, l'erreur) ;
--   · saml_etablissements : le rattachement d'un IdP et/ou d'un schacHomeOrganization à
--     une organisation (sa licence s'applique) ;
--   · saml_comptes : la personne venue par la fédération, par son identifiant HACHÉ ;
--   · saml_requetes : les demandes d'authentification envoyées (InResponseTo, usage unique) ;
--   · saml_assertions : les assertions déjà acceptées (le rejeu est refusé) ;
--   · saml_refus : le journal des refus, sans la réponse.
CREATE TABLE IF NOT EXISTS "saml_idps" (
	"entity_id" text PRIMARY KEY NOT NULL,
	"federation" text NOT NULL,
	"nom_fr" text,
	"nom_en" text,
	"sso_redirect" text NOT NULL,
	"certificats" jsonb NOT NULL,
	"portees" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"present" boolean DEFAULT true NOT NULL,
	"sel" text NOT NULL,
	"vu_le" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saml_idps_federation_idx" ON "saml_idps" ("federation", "present");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saml_federations" (
	"federation" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"lu_le" timestamp with time zone,
	"valide_jusqu_a" timestamp with time zone,
	"nombre" integer DEFAULT 0 NOT NULL,
	"empreinte" text,
	"derniere_tentative" timestamp with time zone,
	"derniere_erreur" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saml_etablissements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idp_entity_id" text,
	"schac" text,
	"organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
	"nom" text NOT NULL,
	"cree_par" uuid REFERENCES "users"("id") ON DELETE set null,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saml_etablissements_cle_ck" CHECK ("idp_entity_id" IS NOT NULL OR "schac" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "saml_etablissements_cle_uq" ON "saml_etablissements" (coalesce("idp_entity_id", ''), coalesce("schac", ''));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saml_etablissements_org_idx" ON "saml_etablissements" ("organization_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saml_comptes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idp_entity_id" text NOT NULL,
	"identifiant_hache" text NOT NULL,
	"role" text NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"organization_id" uuid REFERENCES "organizations"("id") ON DELETE set null,
	"courriel" text,
	"derniere_venue" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "saml_comptes_identifiant_uq" ON "saml_comptes" ("idp_entity_id", "identifiant_hache", "role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saml_comptes_user_idx" ON "saml_comptes" ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saml_requetes" (
	"id" text PRIMARY KEY NOT NULL,
	"idp_entity_id" text NOT NULL,
	"retour" text,
	"expire_le" timestamp with time zone NOT NULL,
	"utilise_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saml_requetes_expire_idx" ON "saml_requetes" ("expire_le");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saml_assertions" (
	"idp_entity_id" text NOT NULL,
	"assertion_id" text NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	PRIMARY KEY ("idp_entity_id", "assertion_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saml_assertions_expire_idx" ON "saml_assertions" ("expire_le");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saml_refus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"etape" text NOT NULL,
	"motif" text NOT NULL,
	"idp_entity_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saml_refus_date_idx" ON "saml_refus" ("created_at");
