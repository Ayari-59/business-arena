import { ATELIER_CG1 } from "./cg1";
import { ATELIER_MCO } from "./mco";
import { ATELIER_DCG } from "./dcg";
import { ATELIER_GPME } from "./gpme";
import { ATELIER_MHR } from "./mhr";
import { ATELIER_NDRC } from "./ndrc";
import { ATELIER_STMG } from "./stmg";
import type { AtelierDefinition } from "./types";

export type { AtelierDefinition, AtelierPhase, AtelierSeance } from "./types";

/** Registre des ateliers professionnels. Ajouter un atelier, c'est ajouter une entrée. */
/**
 * L'ordre du registre est celui des fiches : l'animation de découverte du
 * lycée vient d'abord, puis les ateliers de section de technicien, puis
 * l'expertise comptable. Un enseignant de STMG ne doit pas faire défiler cinq
 * ateliers de BTS avant de trouver le sien.
 */
export const ATELIERS: readonly AtelierDefinition[] = [ATELIER_STMG, ATELIER_CG1, ATELIER_MCO, ATELIER_NDRC, ATELIER_GPME, ATELIER_MHR, ATELIER_DCG];

export const atelierByCode = new Map(ATELIERS.map((a) => [a.code, a]));

/** Durée totale d'un atelier, en heures, calculée et jamais recopiée. */
export function dureeTotaleHeures(a: AtelierDefinition): number {
  return a.seances.reduce((somme, s) => somme + s.dureeMinutes, 0) / 60;
}
