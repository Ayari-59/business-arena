-- LE TOUR D'ESSAI : UN OU DEUX TOURS POUR DE FAUX AVANT LA VRAIE PARTIE.
--
-- Décision du propriétaire, après comparaison avec Capsim (« rehearsal ») : une partie de
-- classe peut commencer par un ou deux tours d'essai. Les équipes jouent pour apprendre,
-- rien ne compte, puis la partie repart de zéro. Migration ADDITIVE et REJOUABLE :
--   · games.essai : le tour d'essai d'une partie qui en a un (nombre de tours, enchaînement,
--     phase, graine et scénario de la vraie partie tant que l'essai dure, lien vers
--     l'archive après la bascule). Nul pour toutes les autres parties : rien ne change pour
--     elles ;
--   · games.essai_de : posé sur l'ARCHIVE d'un essai, la partie qui reçoit à la bascule tout
--     ce que l'essai a joué (tours, décisions, résultats, états). Elle sort des listes et
--     des compteurs, et disparaît avec sa partie (cascade). Une seule archive par partie.
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "essai" jsonb;
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "essai_de" uuid;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "games" ADD CONSTRAINT "games_essai_de_games_id_fk" FOREIGN KEY ("essai_de") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "games_essai_de_uq" ON "games" USING btree ("essai_de");
