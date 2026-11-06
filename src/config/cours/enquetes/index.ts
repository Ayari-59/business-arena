import { LA_CLOTURE_DU_STAGIAIRE } from "./la-cloture-du-stagiaire";
import { LE_JOURNAL_DE_L_APPRENTI } from "./le-journal-de-l-apprenti";
import { LES_EFFETS_DE_L_INTERIMAIRE } from "./les-effets-de-l-interimaire";
import { LA_REVISION_DE_L_ASSISTANT } from "./la-revision-de-l-assistant";
import { LE_DOSSIER_DES_IMMOBILISATIONS } from "./le-dossier-des-immobilisations";
import { LA_NOTE_DE_L_ANALYSTE } from "./la-note-de-l-analyste";
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
  // Les activités des chapitres (novembre 2026), lot A.
  LE_JOURNAL_DE_L_APPRENTI,
  LES_EFFETS_DE_L_INTERIMAIRE,
  // Les activités des chapitres, lot B (novembre 2026).
  LA_REVISION_DE_L_ASSISTANT,
  // Les activités des chapitres, lot C (novembre 2026).
  LE_DOSSIER_DES_IMMOBILISATIONS,
  LA_NOTE_DE_L_ANALYSTE,
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
