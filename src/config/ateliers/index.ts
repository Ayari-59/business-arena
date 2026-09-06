import { ATELIER_AVANCE } from "./avance";
import { ATELIER_CG1 } from "./cg1";
import { ATELIER_MCO } from "./mco";
import { ATELIER_DCG } from "./dcg";
import { ATELIER_DEBUTANT } from "./debutant";
import { ATELIER_GEA } from "./gea";
import { ATELIER_GPME } from "./gpme";
import { ATELIER_MHR } from "./mhr";
import { ATELIER_NDRC } from "./ndrc";
import { ATELIER_STMG } from "./stmg";
import type { AtelierDefinition } from "./types";

export type { AtelierDefinition, AtelierPhase, AtelierSeance } from "./types";

/** Registre des ateliers professionnels. Ajouter un atelier, c'est ajouter une entrée. */
/**
 * L'ordre du registre suit la progression : l'animation de découverte ouverte à
 * toutes les filières d'abord, puis le lycée, puis les ateliers de section de
 * technicien et le BUT, puis l'expertise comptable, et enfin l'atelier
 * d'approfondissement transversal. Un enseignant ne doit pas faire défiler dix
 * fiches avant de trouver la sienne.
 */
export const ATELIERS: readonly AtelierDefinition[] = [
  ATELIER_DEBUTANT,
  ATELIER_STMG,
  ATELIER_CG1,
  ATELIER_MCO,
  ATELIER_NDRC,
  ATELIER_GPME,
  ATELIER_MHR,
  ATELIER_GEA,
  ATELIER_DCG,
  ATELIER_AVANCE,
];

export const atelierByCode = new Map(ATELIERS.map((a) => [a.code, a]));

/** Durée totale d'un atelier, en heures, calculée et jamais recopiée. */
export function dureeTotaleHeures(a: AtelierDefinition): number {
  return a.seances.reduce((somme, s) => somme + s.dureeMinutes, 0) / 60;
}
