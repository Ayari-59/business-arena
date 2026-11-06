import { RAPPROCHEMENT_DE_MARS } from "./rapprochement-de-mars";
import { LE_PRET_DE_L_ANNEE } from "./le-pret-de-l-annee";
import { LE_DOSSIER_DE_FINANCEMENT } from "./le-dossier-de-financement";
import { L_ASSEMBLEE_DE_JUIN } from "./l-assemblee-de-juin";
import type { Bureau } from "./types";

export type { Bureau } from "./types";

/**
 * LES BUREAUX DU COURS (décision du propriétaire, novembre 2026) : des cas pratiques d'un genre
 * nouveau, servis sans corrigé et corrigés au serveur (bureaux/types.ts). Un prototype pour l'instant.
 */
export const BUREAUX: readonly Bureau[] = [RAPPROCHEMENT_DE_MARS, LE_PRET_DE_L_ANNEE, LE_DOSSIER_DE_FINANCEMENT, L_ASSEMBLEE_DE_JUIN];

export const bureauParCode = (code: string) => BUREAUX.find((b) => b.code === code);

/** Les bureaux qui reprennent un chapitre : la page du chapitre et le catalogue y mènent. */
export const bureauxDuChapitre = (chapitre: string) => BUREAUX.filter((b) => b.reprend.includes(chapitre));

/** L'adresse d'un bureau. */
export const lienDuBureau = (b: Pick<Bureau, "code">) => `/cours/bureau/${b.code}`;
