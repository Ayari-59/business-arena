-- V1-2 : BPI v2. « pilotage » fusionne stratégie et opérationnel ; les tours
-- portent la version de formule qui les a scorés (les relevés v1 ne sont jamais
-- recalculés). Migration rétro-compatible : nouvelle valeur d'enum, colonne à
-- défaut.
ALTER TYPE "score_dimension" ADD VALUE IF NOT EXISTS 'pilotage';--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN IF NOT EXISTS "bpi_version" integer DEFAULT 1 NOT NULL;
