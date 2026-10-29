-- LE PARCOURS D'UNE CLASSE DU COURS (décision du propriétaire, octobre 2026) : l'offre Classe
-- ouvre les chapitres du parcours de la classe, Programme ceux des parcours de ses classes,
-- Campus tous les chapitres, la Découverte le seul chapitre libre. Le parcours est un code de
-- config/cours/registre.ts (PARCOURS), obligatoire à la création d'une classe.
--
-- LES CLASSES EXISTANTES NE PERDENT RIEN : elles sont marquées « héritées » (heritee = true),
-- sans parcours, et gardent l'accès d'avant (tout le cours sous licence) jusqu'à ce que leur
-- enseignant leur choisisse un parcours (services/cours.service.ts, coursOuvert).
ALTER TABLE "cours_classes" ADD COLUMN IF NOT EXISTS "parcours" text;
--> statement-breakpoint
ALTER TABLE "cours_classes" ADD COLUMN IF NOT EXISTS "heritee" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
UPDATE "cours_classes" SET "heritee" = true WHERE "parcours" IS NULL AND "heritee" = false;
