import { ATELIER_CG1 } from "./cg1";
import { ATELIER_MCO } from "./mco";
import type { AtelierDefinition } from "./types";

export type { AtelierDefinition, AtelierPhase, AtelierSeance } from "./types";

/** Registre des ateliers professionnels. Ajouter un atelier, c'est ajouter une entrée. */
export const ATELIERS: readonly AtelierDefinition[] = [ATELIER_CG1, ATELIER_MCO];

export const atelierByCode = new Map(ATELIERS.map((a) => [a.code, a]));

/** Durée totale d'un atelier, en heures, calculée et jamais recopiée. */
export function dureeTotaleHeures(a: AtelierDefinition): number {
  return a.seances.reduce((somme, s) => somme + s.dureeMinutes, 0) / 60;
}
