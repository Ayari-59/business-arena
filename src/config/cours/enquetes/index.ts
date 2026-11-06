import { LA_CLOTURE_DU_STAGIAIRE } from "./la-cloture-du-stagiaire";
import { LA_REVISION_DE_L_ASSISTANT } from "./la-revision-de-l-assistant";
import type { Enquete } from "./types";

export type { Enquete } from "./types";

/**
 * LES ENQUÊTES DU COURS (décision du propriétaire, novembre 2026) : un dossier qui cache des erreurs,
 * servi sans corrigé et corrigé au serveur (enquetes/types.ts). Un prototype pour l'instant.
 */
export const ENQUETES: readonly Enquete[] = [
  LA_CLOTURE_DU_STAGIAIRE,
  // Les activités des chapitres, lot B (novembre 2026).
  LA_REVISION_DE_L_ASSISTANT,
];

export const enqueteParCode = (code: string) => ENQUETES.find((e) => e.code === code);

/** Les enquêtes qui reprennent un chapitre : la page du chapitre et le catalogue y mènent. */
export const enquetesDuChapitre = (chapitre: string) => ENQUETES.filter((e) => e.reprend.includes(chapitre));

/** L'adresse d'une enquête. */
export const lienDeLEnquete = (e: Pick<Enquete, "code">) => `/cours/enquete/${e.code}`;
