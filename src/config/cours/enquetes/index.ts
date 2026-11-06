import { LA_CLOTURE_DU_STAGIAIRE } from "./la-cloture-du-stagiaire";
import { LE_BILAN_FONCTIONNEL_DE_L_ALTERNANT } from "./le-bilan-fonctionnel-de-l-alternant";
import { LES_COMPTES_ANNUELS_DU_STAGIAIRE } from "./les-comptes-annuels-du-stagiaire";
import { LE_TABLEAU_DES_FLUX_DE_L_ASSISTANTE } from "./le-tableau-des-flux-de-l-assistante";
import type { Enquete } from "./types";

export type { Enquete } from "./types";

/**
 * LES ENQUÊTES DU COURS (décision du propriétaire, novembre 2026) : un dossier qui cache des erreurs,
 * servi sans corrigé et corrigé au serveur (enquetes/types.ts). Un prototype pour l'instant.
 */
export const ENQUETES: readonly Enquete[] = [
  LA_CLOTURE_DU_STAGIAIRE,
  // Lot D (novembre 2026) : une activité par chapitre de la comptabilité générale.
  LE_BILAN_FONCTIONNEL_DE_L_ALTERNANT,
  LES_COMPTES_ANNUELS_DU_STAGIAIRE,
  LE_TABLEAU_DES_FLUX_DE_L_ASSISTANTE,
];

export const enqueteParCode = (code: string) => ENQUETES.find((e) => e.code === code);

/** Les enquêtes qui reprennent un chapitre : la page du chapitre et le catalogue y mènent. */
export const enquetesDuChapitre = (chapitre: string) => ENQUETES.filter((e) => e.reprend.includes(chapitre));

/** L'adresse d'une enquête. */
export const lienDeLEnquete = (e: Pick<Enquete, "code">) => `/cours/enquete/${e.code}`;
