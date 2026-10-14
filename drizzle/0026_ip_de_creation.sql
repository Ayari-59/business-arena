-- L'ADRESSE D'ORIGINE D'UNE PARTIE PUBLIQUE.
--
-- `/jouer` crée une partie ENTIÈRE à chaque envoi de formulaire — partie,
-- équipes, états d'ouverture, et le snapshot du scénario en jsonb — sans
-- qu'aucune session soit exigée. Une boucle y créait donc autant de parties
-- qu'elle faisait de requêtes. Ce n'est pas une faille d'autorisation : c'est
-- une amplification d'écriture, qui coûte de la base.
--
-- La colonne ne sert qu'à compter : « combien de parties depuis cette adresse
-- depuis une heure ». Elle reste NULLE pour les parties créées par un
-- enseignant identifié, qui n'ont rien à plafonner.
--
-- Colonne AJOUTÉE, en IF NOT EXISTS pour rester rejouable (voir le journal
-- incomplet dont parle scripts/verifier-migrations.ts).
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "creator_ip" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "games_creator_ip_idx" ON "games" USING btree ("creator_ip","created_at");
