import type { SegmentConfig } from "../types";

/**
 * LE COEFFICIENT DE SAISON D'UN TOUR — LA SEULE LECTURE D'UN TABLEAU DE SAISONNALITÉ.
 *
 * Un tableau de saisonnalité porte la dramaturgie de la partie TOUR PAR TOUR : sa valeur
 * d'indice `tour − 1` est celle du tour `tour`, quelle que soit la durée du tour (voir
 * `config/scenarios/periodicity.ts`). Il n'est JAMAIS lu modulo sa longueur : boucler
 * ferait revenir le même pic de Noël deux fois dans l'année, sans que rien ne le dise.
 *
 * Une partie plus longue que son scénario porte des tableaux déjà prolongés à sa durée
 * (`config/scenarios/rounds.ts`, `prolongerLaSaison`, au trimestre seulement : l'année
 * y revient tous les quatre tours, c'est le calendrier et non une boucle). Au-delà de la
 * fin du tableau, la création de la partie a déjà refusé de jouer
 * (`config/scenarios/rounds.ts`, `applyRoundsCount`) ; le moteur rend 1, la saison
 * neutre, plutôt que d'interrompre une partie : c'est aussi ce que lit l'anticipation
 * d'un concurrent au dernier tour, quand il n'y a plus de tour suivant.
 */
export function saisonDuTour(tableau: readonly number[], tour: number): number {
  return tableau[tour - 1] ?? 1;
}

/**
 * LA CROISSANCE CUMULÉE D'UN SEGMENT AU TOUR `tour` : (1 + g)^(tour − 1), arrêtée au
 * tour `croissanceJusquAuTour` quand une partie prolongée l'a posé (le marché arrive à
 * maturité au dernier tour écrit du scénario). La seule lecture de la croissance : la
 * gazette et le tableur des ateliers la lisent ici aussi.
 */
export function facteurDeCroissance(
  segment: Pick<SegmentConfig, "growth" | "croissanceJusquAuTour">,
  tour: number,
): number {
  const jusquA = Math.min(tour, segment.croissanceJusquAuTour ?? tour);
  return Math.pow(1 + segment.growth, jusquA - 1);
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
  const growth = facteurDeCroissance(segment, roundIndex);
  return segment.size * growth * season * demandMultiplier;
}
