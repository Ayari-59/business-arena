import type { SegmentConfig } from "../types";

/**
 * LE COEFFICIENT DE SAISON D'UN TOUR — LA SEULE LECTURE D'UN TABLEAU DE SAISONNALITÉ.
 *
 * Un tableau de saisonnalité porte la dramaturgie de la partie TOUR PAR TOUR : sa valeur
 * d'indice `tour − 1` est celle du tour `tour`, quelle que soit la durée du tour (voir
 * `config/scenarios/periodicity.ts`). Il n'est JAMAIS lu modulo sa longueur : boucler
 * ferait revenir le même pic de Noël deux fois dans l'année, sans que rien ne le dise.
 *
 * Au-delà de la fin du tableau, la création de la partie a déjà refusé de jouer
 * (`config/scenarios/rounds.ts`, `applyRoundsCount`) ; le moteur rend 1, la saison
 * neutre, plutôt que d'interrompre une partie : c'est aussi ce que lit l'anticipation
 * d'un concurrent au dernier tour, quand il n'y a plus de tour suivant.
 */
export function saisonDuTour(tableau: readonly number[], tour: number): number {
  return tableau[tour - 1] ?? 1;
}

/**
 * Demande potentielle du marché pour un segment au tour t (doc 02 §3.1) :
 * base × croissance^(t-1) × saisonnalité × effet macro (événements).
 */
export function computePotentialDemand(
  segment: SegmentConfig,
  roundIndex: number,
  seasonality: number[],
  demandMultiplier: number,
): number {
  const applicable = segment.seasonality ?? seasonality;
  const season = saisonDuTour(applicable, roundIndex);
  const growth = Math.pow(1 + segment.growth, roundIndex - 1);
  return segment.size * growth * season * demandMultiplier;
}
