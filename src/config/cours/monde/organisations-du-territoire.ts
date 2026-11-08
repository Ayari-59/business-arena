import { HAUT_VERDASSE } from "./haut-verdasse";
import { HAUT_VERDASSE_HANDBALL } from "./haut-verdasse-handball";

/**
 * LES ORGANISATIONS NON MARCHANDES DU MONDE DU COURS (décision du propriétaire, novembre 2026).
 *
 * À côté des neuf entreprises (NOVA, MAILLE & CO, L'ESCALE…), le cours a une organisation publique
 * et une association, pour les chapitres du bac STMG qui comparent les organisations. Elles ne se
 * jouent pas dans l'arène et ne se choisissent pas comme « entreprise du cas » d'un chapitre
 * (config/cours/metiers.ts) : un chapitre qui en a besoin importe sa fiche.
 */
export interface OrganisationDuTerritoire {
  code: string;
  nom: string;
  categorie: "publique" | "associative";
  forme: string;
  presentation: string;
}

export const ORGANISATIONS_DU_TERRITOIRE: readonly OrganisationDuTerritoire[] = [HAUT_VERDASSE, HAUT_VERDASSE_HANDBALL].map(
  ({ code, nom, categorie, forme, presentation }) => ({ code, nom, categorie, forme, presentation }),
);
