import { useSyncExternalStore } from "react";

/**
 * LE RÉSULTAT ESTIMÉ, LISIBLE PAR LA BARRE DU HAUT (lot P7).
 *
 * Sur téléphone, la feuille de décision (decision-form.tsx) calcule le
 * résultat estimé ; la barre de la partie (barre-de-jeu.tsx) le montre, sur
 * CHAQUE carte de décision, dans la ligne qui dit déjà où l'on en est. Ce sont
 * deux frères sous une page serveur : aucun contexte ne passe de l'un à
 * l'autre. D'où ce petit magasin, du même modèle que `progression-parcours` :
 * une valeur, des abonnés.
 *
 * Ce qui passe ici est un RÉSUMÉ en nombres, déjà calculé : la barre ne
 * calcule rien et ne lit pas le formulaire.
 */
export interface EstimationEnCours {
  /** Aucune vente estimée : la barre invite à estimer, elle n'écrit pas de zéros. */
  vide: boolean;
  resultatNet: number;
  tresorerieNette: number;
  chiffreDAffaires: number;
  stockFinal: number;
  /** L'unité du métier (« enceintes ») pour le stock et le livrable. */
  unites: string;
  manquantes: number;
  ventesLivrables: number;
}

let courante: EstimationEnCours | null = null;
/** Mener au champ des ventes estimées : c'est la feuille qui sait où il est. */
let versLeChamp: (() => void) | null = null;
const abonnes = new Set<() => void>();

const pareilles = (a: EstimationEnCours | null, b: EstimationEnCours | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    (Object.keys(a) as (keyof EstimationEnCours)[]).every((k) => a[k] === b[k]));

export function definirEstimationEnCours(
  valeur: EstimationEnCours | null,
  allerAuChamp: (() => void) | null = null,
): void {
  versLeChamp = valeur ? allerAuChamp : null;
  if (pareilles(courante, valeur)) return;
  courante = valeur;
  for (const a of abonnes) a();
}

export function useEstimationEnCours(): EstimationEnCours | null {
  return useSyncExternalStore(
    (rappel) => {
      abonnes.add(rappel);
      return () => abonnes.delete(rappel);
    },
    () => courante,
    () => null,
  );
}

/** Le lien « Estimez vos ventes » de la barre : il mène au champ, sur sa carte. */
export function allerAuChampDesVentes(): void {
  versLeChamp?.();
}
