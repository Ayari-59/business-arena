-- LA COMPÉTENCE QU'UN MANAGER CHOISIT DE TRAVAILLER.
--
-- La recommandation du prochain épisode visait la compétence que le profil
-- jugeait prioritaire, sans demander son avis à la personne. Elle peut
-- maintenant choisir ce qu'elle travaille ; le choix est gardé avec son
-- profil, pour la suivre d'un appareil à l'autre. Une ligne par personne.
CREATE TABLE IF NOT EXISTS "episode_objectifs" (
	"user_id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"competence" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
