import { RAPPROCHEMENT_DE_MARS } from "./rapprochement-de-mars";
import { L_ECHEANCE_DE_JANVIER } from "./l-echeance-de-janvier";
import { LE_BESOIN_DE_L_ANNEE_TYPE } from "./le-besoin-de-l-annee-type";
import { LA_PREMIERE_CONSOLIDATION } from "./la-premiere-consolidation";
import type { Bureau } from "./types";

export type { Bureau } from "./types";

/**
 * LES BUREAUX DU COURS (décision du propriétaire, novembre 2026) : des cas pratiques d'un genre
 * nouveau, servis sans corrigé et corrigés au serveur (bureaux/types.ts). Un prototype pour l'instant.
 */
export const BUREAUX: readonly Bureau[] = [RAPPROCHEMENT_DE_MARS, L_ECHEANCE_DE_JANVIER, LE_BESOIN_DE_L_ANNEE_TYPE, LA_PREMIERE_CONSOLIDATION];

export const bureauParCode = (code: string) => BUREAUX.find((b) => b.code === code);

/** Les bureaux qui reprennent un chapitre : la page du chapitre et le catalogue y mènent. */
export const bureauxDuChapitre = (chapitre: string) => BUREAUX.filter((b) => b.reprend.includes(chapitre));

/** L'adresse d'un bureau. */
export const lienDuBureau = (b: Pick<Bureau, "code">) => `/cours/bureau/${b.code}`;
