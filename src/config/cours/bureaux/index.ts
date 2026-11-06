import { RAPPROCHEMENT_DE_MARS } from "./rapprochement-de-mars";
import { LES_SOLDES_POUR_LA_BANQUE } from "./les-soldes-pour-la-banque";
import { LE_BILAN_FINANCIER_POUR_LA_BANQUE } from "./le-bilan-financier-pour-la-banque";
import { LE_DIAGNOSTIC_POUR_L_ASSEMBLEE } from "./le-diagnostic-pour-l-assemblee";
import { LE_TABLEAU_DE_FINANCEMENT_DE_NOVA } from "./le-tableau-de-financement-de-nova";
import type { Bureau } from "./types";

export type { Bureau } from "./types";

/**
 * LES BUREAUX DU COURS (décision du propriétaire, novembre 2026) : des cas pratiques d'un genre
 * nouveau, servis sans corrigé et corrigés au serveur (bureaux/types.ts). Un prototype pour l'instant.
 */
export const BUREAUX: readonly Bureau[] = [
  RAPPROCHEMENT_DE_MARS,
  // Lot D (novembre 2026) : une activité par chapitre de la comptabilité générale.
  LES_SOLDES_POUR_LA_BANQUE,
  LE_BILAN_FINANCIER_POUR_LA_BANQUE,
  LE_DIAGNOSTIC_POUR_L_ASSEMBLEE,
  LE_TABLEAU_DE_FINANCEMENT_DE_NOVA,
];

export const bureauParCode = (code: string) => BUREAUX.find((b) => b.code === code);

/** Les bureaux qui reprennent un chapitre : la page du chapitre et le catalogue y mènent. */
export const bureauxDuChapitre = (chapitre: string) => BUREAUX.filter((b) => b.reprend.includes(chapitre));

/** L'adresse d'un bureau. */
export const lienDuBureau = (b: Pick<Bureau, "code">) => `/cours/bureau/${b.code}`;
