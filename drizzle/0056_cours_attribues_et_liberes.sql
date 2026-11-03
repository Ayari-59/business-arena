-- LES COURS ATTRIBUÉS ET LIBÉRÉS (décision du propriétaire, novembre 2026 ; la règle :
-- services/chapitres-de-la-classe.ts).
--
-- L'ADMIN RESTREINT : l'offre ouvre le cours, une liste d'attribution le limite à ses parcours,
-- pour un établissement (cours_attributions_etablissement) ou pour un enseignant
-- (cours_attributions_enseignant), dont la liste l'emporte. Sans liste, l'offre seule
-- s'applique : aucun client existant n'est touché.
--
-- L'ENSEIGNANT LIBÈRE : une classe en « chapitre » n'ouvre à ses élèves que les chapitres
-- libérés (cours_liberations) et le chapitre libre. Les classes existantes restent en « tout ».
CREATE TABLE "cours_attributions_enseignant" (
	"user_id" uuid NOT NULL,
	"parcours" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cours_attributions_enseignant_user_id_parcours_pk" PRIMARY KEY("user_id","parcours")
);
--> statement-breakpoint
CREATE TABLE "cours_attributions_etablissement" (
	"organization_id" uuid NOT NULL,
	"parcours" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cours_attributions_etablissement_organization_id_parcours_pk" PRIMARY KEY("organization_id","parcours")
);
--> statement-breakpoint
CREATE TABLE "cours_liberations" (
	"classe_id" uuid NOT NULL,
	"chapitre" text NOT NULL,
	"libere_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cours_liberations_classe_id_chapitre_pk" PRIMARY KEY("classe_id","chapitre")
);
--> statement-breakpoint
ALTER TABLE "cours_classes" ADD COLUMN "liberation" text DEFAULT 'tout' NOT NULL;--> statement-breakpoint
ALTER TABLE "cours_attributions_enseignant" ADD CONSTRAINT "cours_attributions_enseignant_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cours_attributions_etablissement" ADD CONSTRAINT "cours_attributions_etablissement_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cours_liberations" ADD CONSTRAINT "cours_liberations_classe_id_cours_classes_id_fk" FOREIGN KEY ("classe_id") REFERENCES "public"."cours_classes"("id") ON DELETE cascade ON UPDATE no action;