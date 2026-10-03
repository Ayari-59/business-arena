import { useSyncExternalStore } from "react";
import type { PhaseDuTour } from "@/config/phases-du-tour";

/**
 * OÙ EN EST LE JOUEUR DANS SON TOUR, lisible par la barre du haut.
 *
 * Le parcours en cartes (parcours-mobile.tsx) sait où l'on en est ; la barre de
 * la partie (barre-de-jeu.tsx) porte la barre de progression. Ce sont deux
 * frères sous une page serveur : aucun contexte ne passe de l'un à l'autre, d'où
 * ce petit magasin, le plus mince qui tienne — une valeur, des abonnés.
 */
/** Un temps du tour dans la barre : sa place (poids) et la part déjà faite (0 à 1). */
export interface SegmentDeProgression {
  phase: PhaseDuTour;
  poids: number;
  fait: number;
}

export interface Progression {
  /** Le temps du tour où l'on est : il donne sa teinte à la barre et au sous-titre. */
  phase: PhaseDuTour;
  /** Son nom, tel qu'on le lit : « Briefing », « Analyse », « Récapitulatif »… */
  libelle: string;
  /** Les temps du tour, dans l'ordre, pour dessiner la barre en segments colorés. */
  segments: SegmentDeProgression[];
  /** « 2 sur 4 », vide quand il n'y a rien à compter. */
  rang: string;
  /** L'amorce du temps, en toutes lettres : « Briefing · 2 sur 4 », « Analyse · 1 rendue sur 3 ». */
  amorce: string;
  /** Le titre de la carte où l'on est : c'est lui qui se lit en haut de l'écran. Vide : pas de titre. */
  titre: string;
  /** Entre 0 et 1 : la part du tour déjà faite. */
  fraction: number;
}

let courante: Progression | null = null;
const abonnes = new Set<() => void>();

export function definirProgression(valeur: Progression | null): void {
  if (
    courante === valeur ||
    (courante && valeur && JSON.stringify(courante) === JSON.stringify(valeur))
  ) {
    return;
  }
  courante = valeur;
  for (const a of abonnes) a();
}

export function useProgression(): Progression | null {
  return useSyncExternalStore(
    (rappel) => {
      abonnes.add(rappel);
      return () => abonnes.delete(rappel);
    },
    () => courante,
    () => null,
  );
}
