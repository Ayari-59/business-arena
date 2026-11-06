import { RAPPROCHEMENT_DE_MARS } from "./rapprochement-de-mars";
import { LE_MOIS_DE_MARS_DE_NOVA } from "./le-mois-de-mars-de-nova";
import { LES_PARTENAIRES_AU_31_MARS } from "./les-partenaires-au-31-mars";
import { LES_JEUX_DE_NOEL } from "./les-jeux-de-noel";
import type { Bureau } from "./types";

export type { Bureau } from "./types";

/**
 * LES BUREAUX DU COURS (décision du propriétaire, novembre 2026) : des cas pratiques d'un genre
 * nouveau, servis sans corrigé et corrigés au serveur (bureaux/types.ts). Un prototype pour l'instant.
 */
export const BUREAUX: readonly Bureau[] = [
  RAPPROCHEMENT_DE_MARS,
  // Les activités des chapitres (novembre 2026), lot A.
  LE_MOIS_DE_MARS_DE_NOVA,
  LES_PARTENAIRES_AU_31_MARS,
  LES_JEUX_DE_NOEL,
];

export const bureauParCode = (code: string) => BUREAUX.find((b) => b.code === code);

/** Les bureaux qui reprennent un chapitre : la page du chapitre et le catalogue y mènent. */
export const bureauxDuChapitre = (chapitre: string) => BUREAUX.filter((b) => b.reprend.includes(chapitre));

/** L'adresse d'un bureau. */
export const lienDuBureau = (b: Pick<Bureau, "code">) => `/cours/bureau/${b.code}`;
