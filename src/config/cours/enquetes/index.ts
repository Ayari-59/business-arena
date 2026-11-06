import { LA_CLOTURE_DU_STAGIAIRE } from "./la-cloture-du-stagiaire";
import { LE_JOURNAL_DE_L_APPRENTI } from "./le-journal-de-l-apprenti";
import { LES_EFFETS_DE_L_INTERIMAIRE } from "./les-effets-de-l-interimaire";
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
];

export const enqueteParCode = (code: string) => ENQUETES.find((e) => e.code === code);

/** Les enquêtes qui reprennent un chapitre : la page du chapitre et le catalogue y mènent. */
export const enquetesDuChapitre = (chapitre: string) => ENQUETES.filter((e) => e.reprend.includes(chapitre));

/** L'adresse d'une enquête. */
export const lienDeLEnquete = (e: Pick<Enquete, "code">) => `/cours/enquete/${e.code}`;
