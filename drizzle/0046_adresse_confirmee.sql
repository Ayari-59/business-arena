-- L'ADRESSE CONFIRMÉE : LE LIEN REÇU À L'INSCRIPTION.
--
-- Décision du propriétaire : n'importe qui pouvait s'inscrire avec l'adresse d'un autre.
-- Un lien de confirmation part désormais à l'inscription. Il ne bloque pas l'essai : sans
-- lui, le compte ne devient pas administrateur de la plateforme, et son établissement ne
-- reçoit pas de licence. Migration ADDITIVE et REJOUABLE :
--   · users.email_confirme_le : la date où le lien a été ouvert. Nulle pour tous les
--     comptes existants : aucun n'est réputé confirmé sans l'avoir fait ;
--   · users.confirmation_envoyee_le : le dernier envoi, pour espacer les renvois.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_confirme_le" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "confirmation_envoyee_le" timestamp with time zone;
