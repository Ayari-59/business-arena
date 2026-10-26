-- LA CALCULATRICE DU COURS, PERMISE OU RETIRÉE PAR CLASSE.
--
-- Décision du propriétaire (octobre 2026) : une calculatrice dans les chapitres et
-- les cas pratiques, que l'enseignant peut retirer à sa classe. Permise par défaut.
-- Migration ADDITIVE et REJOUABLE : une colonne, avec sa valeur par défaut.
ALTER TABLE "cours_classes" ADD COLUMN IF NOT EXISTS "sans_calculatrice" boolean DEFAULT false NOT NULL;
