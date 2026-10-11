-- LE CATALOGUE COMMERCIAL EN BASE : MODULES, OFFRES, GRATUITÉS, CODES PROMO, HISTORIQUE.
--
-- Demande du propriétaire : « Donne-moi la possibilité de gérer l'offre depuis le panneau
-- admin, les gratuités, la composition de plusieurs modules, la gestion des remises, des
-- promos. » Ce qui était figé dans config/tarifs.ts vit ici et s'édite dans /admin/offres
-- (services/catalogue.service.ts) ; config/tarifs.ts reste la valeur par défaut et la
-- source des textes juridiques. Migration ADDITIVE et REJOUABLE :
--   · catalogue_modules : les briques vendables (l'arène et les épisodes ont un effet,
--     les autres sont descriptives) ;
--   · catalogue_offres : une composition de modules, des limites, un prix et la carte de
--     /tarifs ; une seule offre mise en avant (index unique partiel) ;
--   · catalogue_reglages : la Découverte (niveaux ouverts en solo, démonstrations), qui
--     reprend le réglage « vitrine solo » de platform_settings, l'essai d'établissement
--     (désactivé) et l'affichage des prix sur le site (désactivé : offres sur mesure) ;
--   · codes_promo : les codes saisis dans /devis ; une seule promotion affichée ;
--   · catalogue_journal : qui a changé quoi, quand, avant et après ;
--   · org_licences : l'offre vendue et une COPIE de ses conditions, le prix catalogue, la
--     remise, la nature (vendue, offerte, essai) et le motif d'une gratuité ;
--   · demandes_de_devis : le code promo, le prix catalogue, la remise et le prix remisé.
-- Les offres actuelles sont versées avec EXACTEMENT les textes et les prix de la grille
-- (config/tarifs.ts, CATALOGUE_PAR_DEFAUT) : /tarifs reste identique. Les textes portent
-- des variables ({entreprises}…) que le rendu remplit à partir du registre.
CREATE TABLE IF NOT EXISTS "catalogue_modules" (
	"code" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"effet" text,
	"actif" boolean DEFAULT true NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalogue_modules_effet_ck" CHECK ("effet" IS NULL OR "effet" IN ('arene', 'episodes'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalogue_offres" (
	"code" text PRIMARY KEY NOT NULL,
	"rubrique" text NOT NULL,
	"public" text NOT NULL,
	"nom" text NOT NULL,
	"sous_titre" text DEFAULT '' NOT NULL,
	"tarif" text NOT NULL,
	"prix_cents" integer,
	"libelle_tarif" text,
	"inclus" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"precisions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"formules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mention" jsonb,
	"ordre" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"mise_en_avant" boolean DEFAULT false NOT NULL,
	"bouton_libelle" text DEFAULT '' NOT NULL,
	"bouton_cible" text DEFAULT '' NOT NULL,
	"devis_libelle" text,
	"formulaire" text DEFAULT 'etablissement' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalogue_offres_rubrique_ck" CHECK ("rubrique" IN ('arene', 'reseau', 'episodes', 'option')),
	CONSTRAINT "catalogue_offres_public_ck" CHECK ("public" IN ('enseignement', 'entreprises')),
	CONSTRAINT "catalogue_offres_tarif_ck" CHECK ("tarif" IN ('gratuit', 'prix', 'devis', 'inclus', 'etude')),
	CONSTRAINT "catalogue_offres_prix_ck" CHECK (("tarif" = 'prix') = ("prix_cents" IS NOT NULL) AND ("prix_cents" IS NULL OR "prix_cents" > 0)),
	CONSTRAINT "catalogue_offres_formulaire_ck" CHECK ("formulaire" IN ('etablissement', 'reseau', 'entreprise'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "catalogue_offres_une_en_avant_uq" ON "catalogue_offres" ("mise_en_avant") WHERE "mise_en_avant";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalogue_reglages" (
	"cle" text PRIMARY KEY NOT NULL,
	"valeur" jsonb NOT NULL,
	"modifie_par" uuid REFERENCES "users"("id") ON DELETE set null,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "codes_promo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type_remise" text NOT NULL,
	"valeur" integer NOT NULL,
	"offres" text[],
	"debut" timestamp with time zone,
	"fin" timestamp with time zone,
	"utilisations_max" integer,
	"utilisations" integer DEFAULT 0 NOT NULL,
	"un_par_etablissement" boolean DEFAULT true NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"affiche" boolean DEFAULT false NOT NULL,
	"cree_par" uuid REFERENCES "users"("id") ON DELETE set null,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "codes_promo_code_unique" UNIQUE ("code"),
	CONSTRAINT "codes_promo_type_ck" CHECK ("type_remise" IN ('pourcentage', 'montant')),
	CONSTRAINT "codes_promo_valeur_ck" CHECK ("valeur" > 0 AND ("type_remise" = 'montant' OR "valeur" <= 100)),
	CONSTRAINT "codes_promo_utilisations_ck" CHECK ("utilisations" >= 0 AND ("utilisations_max" IS NULL OR "utilisations_max" > 0))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "codes_promo_un_bandeau_uq" ON "codes_promo" ("affiche") WHERE "affiche";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalogue_journal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quand" timestamp with time zone DEFAULT now() NOT NULL,
	"auteur_id" uuid REFERENCES "users"("id") ON DELETE set null,
	"auteur" text DEFAULT '' NOT NULL,
	"objet" text NOT NULL,
	"cle" text NOT NULL,
	"action" text NOT NULL,
	"avant" jsonb,
	"apres" jsonb
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "catalogue_journal_quand_idx" ON "catalogue_journal" ("quand");
--> statement-breakpoint
-- La licence garde l'offre vendue et une copie de ses conditions au moment de la vente.
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "offre_code" text;
--> statement-breakpoint
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "conditions" jsonb;
--> statement-breakpoint
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "prix_catalogue_cents" integer;
--> statement-breakpoint
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "remise" jsonb;
--> statement-breakpoint
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "nature" text DEFAULT 'vendue' NOT NULL;
--> statement-breakpoint
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "motif_gratuite" text;
--> statement-breakpoint
-- Une licence offerte porte son motif et ne coûte rien ; une licence d'essai non plus.
DO $$ BEGIN
 ALTER TABLE "org_licences" ADD CONSTRAINT "org_licences_nature_check" CHECK ("nature" IN ('vendue', 'offerte', 'essai') AND ("nature" <> 'offerte' OR ("motif_gratuite" IS NOT NULL AND COALESCE("amount_cents", 0) = 0)) AND ("nature" <> 'essai' OR COALESCE("amount_cents", 0) = 0));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- La demande de devis garde le code promo et le devis qu'il donne.
ALTER TABLE "demandes_de_devis" ADD COLUMN IF NOT EXISTS "code_promo" text;
--> statement-breakpoint
ALTER TABLE "demandes_de_devis" ADD COLUMN IF NOT EXISTS "code_promo_id" uuid REFERENCES "codes_promo"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "demandes_de_devis" ADD COLUMN IF NOT EXISTS "prix_catalogue_cents" integer;
--> statement-breakpoint
ALTER TABLE "demandes_de_devis" ADD COLUMN IF NOT EXISTS "remise_cents" integer;
--> statement-breakpoint
ALTER TABLE "demandes_de_devis" ADD COLUMN IF NOT EXISTS "remise_libelle" text;
--> statement-breakpoint
ALTER TABLE "demandes_de_devis" ADD COLUMN IF NOT EXISTS "prix_remise_cents" integer;
--> statement-breakpoint
ALTER TABLE "demandes_de_devis" ADD COLUMN IF NOT EXISTS "promo_cle" text;
--> statement-breakpoint
-- Un code « une utilisation par établissement » : une seule demande par établissement.
CREATE UNIQUE INDEX IF NOT EXISTS "demandes_de_devis_promo_uq" ON "demandes_de_devis" ("code_promo_id", "promo_cle") WHERE "promo_cle" IS NOT NULL;
--> statement-breakpoint
-- LA GRILLE D'OCTOBRE 2026, versée telle quelle (générée depuis CATALOGUE_PAR_DEFAUT).
INSERT INTO "catalogue_modules" ("code", "nom", "description", "effet", "actif", "ordre") VALUES ('arene', 'L''arène', 'Le simulateur en classe : parties de classe, suivi, ateliers, concours, relevé. Se paramètre : entreprises, niveaux, enseignants, parties en cours.', 'arene', true, 10) ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_modules" ("code", "nom", "description", "effet", "actif", "ordre") VALUES ('episodes', 'Épisodes manager', 'Les trimestres joués dans la peau d''un manager, au-delà des démonstrations, et le profil décisionnel.', 'episodes', true, 20) ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_modules" ("code", "nom", "description", "effet", "actif", "ordre") VALUES ('lti', 'Intégration LMS', 'L''activité placée dans Moodle, Canvas, Blackboard ou Brightspace (LTI 1.3).', NULL, true, 30) ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_modules" ("code", "nom", "description", "effet", "actif", "ordre") VALUES ('renater', 'Connexion établissement', 'Se connecter avec son établissement, par la fédération d''identités RENATER.', NULL, true, 40) ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_modules" ("code", "nom", "description", "effet", "actif", "ordre") VALUES ('accompagnement', 'Accompagnement', 'La prise en main, la formation d''une équipe pédagogique, l''animation sur site.', NULL, true, 50) ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_modules" ("code", "nom", "description", "effet", "actif", "ordre") VALUES ('concours', 'Compétition inter-établissements', 'Un concours entre plusieurs écoles ou campus, organisé avec vous.', NULL, true, 60) ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('decouverte', 'arene', 'enseignement', 'Découverte', 'Sans compte, pour voir le simulateur de près.', 'gratuit', NULL, NULL, '["L''arène en solo sur les {entreprises} entreprises, niveaux {niveauxDecouverte} ({nomsDesNiveauxDecouverte}), en partie complète de {toursSolo} tours.","Les fiches notions, le manuel et le guide.","Un épisode manager de démonstration par métier ({demos} sur {episodes}), au niveau {niveauDesDemos}, avec son bilan."]'::jsonb, '["Les parties de classe et les concours commencent avec {lesOffresDeLArene}."]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, 10, true, false, 'Tester le simulateur', '/jouer', NULL, 'etablissement') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('classe', 'arene', 'enseignement', 'Classe', 'Un cours, un groupe : une entreprise et un niveau, choisis à l''achat.', 'prix', 29000, NULL, '["Une entreprise au choix parmi les {entreprises}, et un niveau au choix de {niveaux}, fixés pour l''année.","Autant de parties que vous voulez dans l''année avec ce paramétrage, une à la fois.","Les parties de classe : les étudiants rejoignent par un code, sans compte ni e-mail, en équipes, entreprises en concurrence.","Le suivi : tableau de bord, observation, maîtrise des notions, révélation et projection en cours, relevé de notes exportable en tableur.","Les ateliers clés en main qui se jouent avec cette entreprise et ce niveau, avec déroulé, corrigés et dossier enseignant.","Un concours à la place d''une partie, si l''entreprise choisie est {entrepriseDesConcours} : les concours se jouent avec elle."]'::jsonb, '["Sans les épisodes manager, qui se proposent à part, sur devis.","À l''année, pour un enseignant."]'::jsonb, '[]'::jsonb, '[{"module":"arene","parametres":{"entreprises":"une","niveaux":"un","enseignants":1,"partiesEnCours":1}}]'::jsonb, NULL, 20, true, false, 'Demander un devis', '/devis?offre=classe', NULL, 'etablissement') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('programme', 'arene', 'enseignement', 'Programme', 'Un programme (Bachelor, Grande École, MSc, BTS…) : toutes ses promotions, tous les niveaux, une entreprise.', 'prix', 99000, NULL, '["Une entreprise au choix parmi les {entreprises}, choisie à l''achat, à tous les niveaux, de {niveaux}.","Toutes les promotions et tous les groupes du programme, plusieurs parties en même temps.","L''équipe pédagogique et les intervenants du programme, au nombre fixé au devis.","Les parties de classe : les étudiants rejoignent par un code, sans compte ni e-mail, en équipes, entreprises en concurrence.","Le suivi : tableau de bord, observation, maîtrise des notions, révélation et projection en cours, relevé de notes exportable en tableur.","Les ateliers clés en main de cette entreprise, avec déroulé, corrigés et dossier enseignant.","Les concours et le classement à l''IPG, si l''entreprise choisie est {entrepriseDesConcours} : les concours se jouent avec elle."]'::jsonb, '["Sans les épisodes manager, qui se proposent à part, sur devis.","À l''année, pour l''équipe d''un programme."]'::jsonb, '[]'::jsonb, '[{"module":"arene","parametres":{"entreprises":"une","niveaux":"tous","enseignants":"devis","partiesEnCours":null}}]'::jsonb, '{"mode":"calculee","reference":"classe","unite":"groupes"}'::jsonb, 30, true, true, 'Demander un devis', '/devis?offre=programme', NULL, 'etablissement') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('campus', 'arene', 'enseignement', 'Campus', 'Toute l''école : les {entreprises} entreprises, tous les programmes, enseignants et intervenants sans limite.', 'prix', 199000, NULL, '["Les {entreprises} entreprises, à tous les niveaux, dans tous les programmes.","Des groupes, des enseignants et des intervenants sans limite.","Les {ateliers} ateliers clés en main, avec déroulé, corrigés et dossier enseignant, dont {ateliersReferentiel} adossés au référentiel d''un diplôme ({diplomes}).","Les concours et le classement à l''IPG.","Un référent qui gère les accès.","Une facture au nom de l''école.","Une licence par année scolaire, du {debutAnneeScolaire} au {finAnneeScolaire}."]'::jsonb, '["Sans les épisodes manager, qui se proposent à part, sur devis.","Sur devis, puis bon de commande ou mandat administratif ; Chorus Pro pour les factures publiques."]'::jsonb, '[]'::jsonb, '[{"module":"arene","parametres":{"entreprises":"toutes","niveaux":"tous","enseignants":null,"partiesEnCours":null}}]'::jsonb, '{"mode":"calculee","reference":"programme","unite":"entreprises"}'::jsonb, 40, true, false, 'Demander un devis', '/devis?offre=campus', NULL, 'etablissement') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('reseau', 'reseau', 'enseignement', 'Réseaux d''établissements', 'Groupes scolaires, académies, régions, réseaux d''écoles : à partir de {seuilReseau} établissements, sur devis.', 'devis', NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[{"module":"arene","parametres":{"entreprises":"toutes","niveaux":"tous","enseignants":null,"partiesEnCours":null}}]'::jsonb, NULL, 50, true, false, 'Demander un devis', '/devis?offre=reseau', NULL, 'reseau') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('episodes', 'episodes', 'enseignement', 'Épisodes manager', 'En classe et en école de commerce', 'devis', NULL, NULL, '["Les {episodes} épisodes, choisis par l''enseignant pour chaque groupe.","Des cohortes créées depuis l''espace enseignant : les étudiants entrent par un code, sans compte.","La vue de l''animateur, et une fiche de débrief pour les épisodes en classe."]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[{"module":"episodes"}]'::jsonb, NULL, 60, true, false, 'Demander un devis', '/devis?offre=episodes', 'Épisodes manager, en cours ou en école', 'etablissement') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('entreprise', 'episodes', 'entreprises', 'Entreprises et organismes de formation', '', 'devis', NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[{"nom":"Parcours manager","inclus":["Les {episodes} épisodes, en autonomie.","Le profil décisionnel, et la recommandation du prochain épisode.","Sans compte à créer : un code de cohorte pour entrer, un code de reprise pour changer d''appareil."]},{"nom":"Cohorte animée","inclus":["{managers} managers, {episodesMin} à {episodesMax} épisodes choisis, un code de cohorte.","La vue de l''animateur.","Une demi-journée de lancement, et un débrief animé à distance."]},{"nom":"Organisme de formation","inclus":["Des animateurs sans limite, des cohortes à volonté.","Le guide de débrief des {episodes} épisodes."]}]'::jsonb, '[{"module":"episodes"}]'::jsonb, NULL, 70, true, false, 'Demander un devis', '/devis?offre=entreprise', 'Épisodes manager, pour une entreprise ou un organisme de formation', 'entreprise') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('prise-en-main', 'option', 'enseignement', 'Un rendez-vous téléphonique de prise en main, à la demande', '', 'gratuit', NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[{"module":"accompagnement"}]'::jsonb, NULL, 100, true, false, '', '', NULL, 'etablissement') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('formation-equipe', 'option', 'enseignement', 'Formation d''une équipe pédagogique', '', 'devis', NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[{"module":"accompagnement"}]'::jsonb, NULL, 110, true, false, '', '', NULL, 'etablissement') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('animation-sur-site', 'option', 'enseignement', 'Animation sur site', '', 'devis', NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[{"module":"accompagnement"}]'::jsonb, NULL, 120, true, false, '', '', NULL, 'etablissement') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('scenario-sur-mesure', 'option', 'enseignement', 'Scénario sur mesure : une entreprise fictive à l''image de la vôtre', '', 'devis', NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, 130, true, false, '', '', NULL, 'etablissement') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('competition-inter-etablissements', 'option', 'enseignement', 'Compétition inter-établissements', '', 'devis', NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[{"module":"concours"}]'::jsonb, NULL, 140, true, false, '', '', NULL, 'etablissement') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('integration-lms', 'option', 'enseignement', 'Intégration à Moodle, Canvas, Blackboard, Brightspace (LTI 1.3)', '', 'inclus', NULL, 'Incluse', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[{"module":"lti"}]'::jsonb, NULL, 150, true, false, '', '', NULL, 'etablissement') ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalogue_offres" ("code", "rubrique", "public", "nom", "sous_titre", "tarif", "prix_cents", "libelle_tarif", "inclus", "precisions", "formules", "modules", "mention", "ordre", "visible", "mise_en_avant", "bouton_libelle", "bouton_cible", "devis_libelle", "formulaire") VALUES ('ent-du-secondaire', 'option', 'enseignement', 'ENT du secondaire (GAR)', '', 'etude', NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, 160, true, false, '', '', NULL, 'etablissement') ON CONFLICT ("code") DO NOTHING;

--> statement-breakpoint
-- LA DÉCOUVERTE : le réglage « vitrine solo » de platform_settings, s'il porte la version
-- de la règle (config/vitrine-solo.ts), sinon la règle par défaut (niveaux 1 à 3 pour
-- toutes les entreprises) ; les démonstrations d'EPISODES_DE_DEMO, au niveau Découverte.
INSERT INTO "catalogue_reglages" ("cle", "valeur")
SELECT 'decouverte', jsonb_build_object(
	'solo', CASE WHEN (r.settings -> 'vitrineSolo' ->> 'version') = '2'
		THEN (r.settings -> 'vitrineSolo') - 'version'
		ELSE '{"active":true,"entrepriseOuverte":"","niveauMaxAutres":3}'::jsonb END,
	'demos', '["client-qui-s-en-va","brigade-a-bout","client-qui-en-demande-plus","lits-vides","promotion-qui-coute"]'::jsonb,
	'niveauDesDemos', 'decouverte')
FROM (SELECT (SELECT "settings" FROM "platform_settings" WHERE "id" = 1) AS settings) r
ON CONFLICT ("cle") DO NOTHING;
--> statement-breakpoint
-- L'ESSAI D'ÉTABLISSEMENT : désactivé (« pas d'essai en classe »).
INSERT INTO "catalogue_reglages" ("cle", "valeur") VALUES ('essai', '{"autorise":false,"dureeMaxJours":30}'::jsonb) ON CONFLICT ("cle") DO NOTHING;
--> statement-breakpoint
-- L'AFFICHAGE DES PRIX SUR LE SITE : désactivé (décision du propriétaire : « J'aimerais
-- retirer les prix. Les offres se font sur mesure et aboutissent à une demande de devis. »).
-- Les prix de référence restent en base, pour le devis et la licence ; /admin/offres les
-- rallume sans développement.
INSERT INTO "catalogue_reglages" ("cle", "valeur") VALUES ('affichage', '{"prixPublics":false}'::jsonb) ON CONFLICT ("cle") DO NOTHING;
