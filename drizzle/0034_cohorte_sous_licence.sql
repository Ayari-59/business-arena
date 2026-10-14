-- LA COHORTE ET L'ORGANISATION QUI L'A ACHETÉE.
--
-- Sans licence, seuls les épisodes de démonstration se lancent. Un manager entré
-- par le code d'une cohorte joue tous les épisodes si l'organisation de son
-- animateur est sous licence : la cohorte porte donc cette organisation. Nulle
-- pour les cohortes d'avant, que l'administrateur rattache depuis /admin/cohortes.
ALTER TABLE "episode_cohortes" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "episode_cohortes" ADD CONSTRAINT "episode_cohortes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
