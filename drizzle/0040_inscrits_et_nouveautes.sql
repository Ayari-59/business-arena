-- LES INSCRITS : LA DERNIÈRE CONNEXION, LA PROVENANCE, LE CONSENTEMENT AUX NOUVEAUTÉS ET
-- LA DÉSACTIVATION D'UN COMPTE.
--
-- Demande du propriétaire (octobre 2026) : « Comment voir qui est inscrit sur le site ? Les
-- professeurs, comment les contacter ? », puis « Oui, lance la page des inscrits ». La page
-- /admin/inscrits lit ces colonnes ; services/inscrits.service.ts et
-- services/nouveautes.service.ts les écrivent. Tout est additif et rejouable.
--
-- 1. LE CONSENTEMENT AUX NOUVEAUTÉS (RGPD, art. 6.1.a et 7) : une case NON cochée à
--    l'inscription, un réglage dans l'espace enseignant, un lien de désinscription dans
--    chaque e-mail de nouveautés. On garde la date de l'accord, la version du texte
--    accepté, et la date du retrait. Le compte consent quand l'accord est plus récent
--    que le retrait. Les messages de service (licence, incident) ne passent pas par ici.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nouveautes_consenties_le" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nouveautes_retirees_le" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nouveautes_version_du_texte" text;
--> statement-breakpoint
-- 2. LA DERNIÈRE CONNEXION : la donnée n'existait pas. Elle s'écrit à l'inscription, à
--    chaque connexion par mot de passe, à chaque lancement depuis une plateforme LTI et à
--    chaque connexion par l'établissement (RENATER). Nulle pour les comptes d'avant cette migration, jusqu'à leur
--    prochaine connexion.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "derniere_connexion_le" timestamp with time zone;
--> statement-breakpoint
-- 3. LA PROVENANCE DU COMPTE : 'inscription' (formulaire du site, avec ou sans code
--    d'établissement), 'lti' (plateforme d'enseignement), 'renater' (Fédération
--    Éducation-Recherche, migration 0039). Nulle pour une identité d'élève ou d'invité, qui
--    n'est pas un inscrit.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "provenance" text;
--> statement-breakpoint
-- 4. LA DÉSACTIVATION (« la gestion des inscriptions ») : un compte désactivé depuis
--    /admin/inscrits ne se connecte plus, et sa session en cours est coupée (la version de
--    session avance d'un cran, et la lecture de session refuse un compte désactivé). Ses
--    parties, cohortes et rattachements restent. Nulle : le compte est actif.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "desactive_le" timestamp with time zone;
--> statement-breakpoint
-- Les comptes déjà en base : les enseignants venus d'une plateforme LTI, ceux venus de la
-- fédération RENATER, puis tous les autres comptes du personnel (enseignant ou administrateur d'un établissement, ou
-- administrateur de la plateforme). Les conditions « provenance IS NULL » rendent la
-- reprise rejouable sans rien écraser.
UPDATE "users" SET "provenance" = 'lti'
WHERE "provenance" IS NULL
  AND "id" IN (SELECT "user_id" FROM "lti_comptes" WHERE "role" = 'enseignant');
--> statement-breakpoint
UPDATE "users" SET "provenance" = 'renater'
WHERE "provenance" IS NULL
  AND "id" IN (SELECT "user_id" FROM "saml_comptes" WHERE "role" = 'enseignant');
--> statement-breakpoint
UPDATE "users" SET "provenance" = 'inscription'
WHERE "provenance" IS NULL
  AND ("is_platform_admin" OR "id" IN (
    SELECT "user_id" FROM "organization_members" WHERE "role" IN ('teacher', 'org_admin')
  ));
--> statement-breakpoint
-- 5. L'INSCRIPTION PAR UN CODE D'INVITATION : le code saisi à l'inscription par le formulaire.
--    Il donne l'état « invité » dans /admin/inscrits et l'usage de chaque code (combien
--    d'inscrits, le dernier quand). Nulle : inscription libre, LTI, RENATER, ou compte
--    d'avant cette migration (l'usage passé des codes n'était pas noté).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invitation_id" uuid REFERENCES "org_invites"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_invitation_idx" ON "users" ("invitation_id");
--> statement-breakpoint
-- 6. LE JOURNAL DES GESTES SUR LES INSCRITS : désactivation, réactivation, rattachement,
--    retrait, réglages des inscriptions, création et révocation d'un code. Qui, quoi, sur
--    quel compte, quand ; jamais modifié.
CREATE TABLE IF NOT EXISTS "inscrits_journal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid REFERENCES "users"("id") ON DELETE set null,
	"geste" text NOT NULL,
	"cible_user_id" uuid REFERENCES "users"("id") ON DELETE set null,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inscrits_journal_date_idx" ON "inscrits_journal" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inscrits_journal_cible_idx" ON "inscrits_journal" ("cible_user_id");
