-- LE DEVIS DEMANDE LE DIPLÔME OU LE PARCOURS (audit produit du 10 novembre 2026, P1-4).
--
-- C'est le parcours d'une classe qui ouvre ses chapitres, et l'admin attribue des parcours par
-- établissement ou par enseignant (migration 0056). Le devis demandait une entreprise et un niveau de
-- l'arène, jamais le parcours : le vendeur ne savait pas quoi attribuer. Pour une offre qui ouvre le
-- cours à une école (Classe, Programme, Campus), la demande garde désormais le code du parcours choisi
-- (config/cours/parcours-de-formation.ts) ; NULL s'il n'est pas donné, et pour toutes les demandes
-- d'avant. Rien n'est effacé ni réécrit.
ALTER TABLE "demandes_de_devis" ADD COLUMN IF NOT EXISTS "parcours" text;
