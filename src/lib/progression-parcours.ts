import { useSyncExternalStore } from "react";

/**
 * OÙ EN EST LE JOUEUR DANS SON TOUR, lisible par la barre du haut.
 *
 * Le parcours en cartes (parcours-mobile.tsx) sait où l'on en est ; la barre de
 * la partie (barre-de-jeu.tsx) porte la barre de progression. Ce sont deux
 * frères sous une page serveur : aucun contexte ne passe de l'un à l'autre, d'où
 * ce petit magasin, le plus mince qui tienne — une valeur, des abonnés.
 */
export interface Progression {
  /** « Briefing », « Analyse » ou « Décision » : de quoi on parle. */
  phase: string;
  /** « 2 sur 4 », vide quand il n'y a rien à compter. */
  rang: string;
  /** Entre 0 et 1 : la part du tour déjà faite. */
  fraction: number;
}

let courante: Progression | null = null;
const abonnes = new Set<() => void>();

export function definirProgression(valeur: Progression | null): void {
  if (
    courante === valeur ||
    (courante &&
      valeur &&
      courante.phase === valeur.phase &&
      courante.rang === valeur.rang &&
      courante.fraction === valeur.fraction)
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
