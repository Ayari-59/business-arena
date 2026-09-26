-- RANGER UNE PARTIE SANS LA PERDRE.
--
-- Rien ne permettait de faire disparaître une partie d'une liste : ni
-- suppression, ni réinitialisation, ni archivage. Le statut « archived »
-- existait bien dans l'énumération, le code le LISAIT — on ne rejoint pas une
-- partie archivée — mais personne ne l'écrivait jamais. Une porte sans poignée.
--
-- L'archivage est une DATE, et non un statut, parce que ce sont deux questions
-- différentes : le statut dit où en est la partie (en cours, terminée),
-- l'archivage dit si elle est rangée. Les confondre obligerait à deviner quel
-- statut rendre au désarchivage — une partie de juin jamais close doit
-- redevenir « en cours » si on la ressort, pas « terminée ».
--
-- Colonne AJOUTÉE, en IF NOT EXISTS pour rester rejouable.
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "games_created_by_archived_idx" ON "games" USING btree ("created_by","archived_at");
