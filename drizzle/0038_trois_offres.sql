-- TROIS OFFRES SCOLAIRES : CLASSE, PROGRAMME, CAMPUS. LA LICENCE PORTE SON PARAMÉTRAGE.
--
-- Décision du propriétaire (octobre 2026) : « offre Classe : un jeu paramétré pour une
-- classe ; une offre [Programme] : une entreprise avec possibilité d'utiliser plusieurs
-- classes et plusieurs niveaux ; une offre Campus avec entreprises et classes
-- illimitées. » L'offre du milieu s'appelle Programme (un programme d'école : toutes ses
-- promotions). Prix et règles : config/tarifs.ts ; vérification : services/acces.service.ts.
--
-- 1. Le paramétrage de la licence de l'arène :
--   · arene : 'classe', 'programme' ou 'campus' (NULL : la licence n'ouvre pas l'arène) ;
--   · entreprises : les codes des entreprises ouvertes (NULL : toutes) ;
--   · niveaux : les niveaux ouverts (NULL : tous) ;
--   · max_parties_en_cours : les parties de classe et concours EN COURS en même temps
--     (NULL : sans plafond). Il n'existe pas d'objet « classe » : « une classe » se
--     traduit par une partie à la fois ;
--   · max_teachers (déjà là) : le plafond d'enseignants.
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "entreprises" text[];
--> statement-breakpoint
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "niveaux" integer[];
--> statement-breakpoint
ALTER TABLE "org_licences" ADD COLUMN IF NOT EXISTS "max_parties_en_cours" integer;
--> statement-breakpoint
-- 2. La contrainte de périmètre accepte le Programme. On retire d'abord celle de 0036,
--    qui refuserait la mise à jour du point 3 ; on la remet ensuite, élargie, sous le
--    même nom : rejouer 0036 après celle-ci retombe sur « duplicate_object » au lieu
--    d'ajouter l'ancienne.
ALTER TABLE "org_licences" DROP CONSTRAINT IF EXISTS "org_licences_perimetre_check";
--> statement-breakpoint
-- 3. Les licences DÉJÀ en base, défaut prudent, sans rien leur retirer :
--   · une ancienne « Classe » (490 €, un enseignant, toutes les entreprises, tous les
--     niveaux, parties sans plafond) devient PROGRAMME, sans restriction d'entreprise ni de
--     niveau (entreprises et niveaux NULL), son plafond d'enseignants gardé. Elle ne
--     perd rien de ce qu'elle ouvrait ; l'admin choisit l'entreprise au renouvellement ;
--   · une ancienne « Campus » reste Campus.
--   Une Classe d'après cette migration porte toujours son entreprise : la condition
--   « entreprises IS NULL » ne touche donc que les anciennes, même rejouée.
UPDATE "org_licences" SET "arene" = 'programme' WHERE "arene" = 'classe' AND "entreprises" IS NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_licences" ADD CONSTRAINT "org_licences_perimetre_check" CHECK (("arene" IS NULL OR "arene" IN ('classe', 'programme', 'campus')) AND ("arene" IS NOT NULL OR "episodes"));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- 4. La demande de devis dit l'entreprise souhaitée (Classe, Programme) et le niveau (Classe).
ALTER TABLE "demandes_de_devis" ADD COLUMN IF NOT EXISTS "entreprise" text;
--> statement-breakpoint
ALTER TABLE "demandes_de_devis" ADD COLUMN IF NOT EXISTS "niveau" integer;
