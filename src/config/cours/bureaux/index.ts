import { RAPPROCHEMENT_DE_MARS } from "./rapprochement-de-mars";
import { LE_MOIS_DE_MARS_DE_NOVA } from "./le-mois-de-mars-de-nova";
import { LES_PARTENAIRES_AU_31_MARS } from "./les-partenaires-au-31-mars";
import { LES_JEUX_DE_NOEL } from "./les-jeux-de-noel";
import { LE_REMPLACEMENT_DE_LA_CUISINE } from "./le-remplacement-de-la-cuisine";
import { LA_FICHE_DE_STOCK_D_AVRIL } from "./la-fiche-de-stock-d-avril";
import { LES_PIECES_DE_JANVIER } from "./les-pieces-de-janvier";
import { LA_PAIE_DE_JANVIER } from "./la-paie-de-janvier";
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
  // Les activités des chapitres, lot B (novembre 2026).
  LE_REMPLACEMENT_DE_LA_CUISINE,
  LA_FICHE_DE_STOCK_D_AVRIL,
  LES_PIECES_DE_JANVIER,
  LA_PAIE_DE_JANVIER,
];

export const bureauParCode = (code: string) => BUREAUX.find((b) => b.code === code);

/** Les bureaux qui reprennent un chapitre : la page du chapitre et le catalogue y mènent. */
export const bureauxDuChapitre = (chapitre: string) => BUREAUX.filter((b) => b.reprend.includes(chapitre));

/** L'adresse d'un bureau. */
export const lienDuBureau = (b: Pick<Bureau, "code">) => `/cours/bureau/${b.code}`;
