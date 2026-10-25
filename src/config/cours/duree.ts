import type { Chapitre, Etape } from "./types";

/**
 * LA DURÉE INDICATIVE D'UN CHAPITRE (demande du propriétaire, octobre 2026),
 * pour qu'un enseignant place un chapitre dans une séance.
 *
 * Elle ne s'écrit pas à la main, chapitre par chapitre : un chapitre qui gagne
 * une étape la changerait sans que personne ne la corrige. Elle se compte sur
 * les étapes, avec un temps par type d'étape. Ces temps sont des hypothèses,
 * celles d'un élève qui lit sans se presser et se trompe une fois sur trois :
 *
 *   · lire une étape de cours : 2 minutes ;
 *   · répondre à une question à choix : 2 minutes ;
 *   · comparer deux états : 3 minutes ;
 *   · calculer des montants, passer une écriture, trier, chercher un seuil au
 *     curseur : 4 minutes, le temps de lire l'énoncé, de calculer ou de saisir,
 *     et de lire la correction.
 *
 * Le total s'arrondit aux cinq minutes supérieures : la page dit « 25 min »,
 * pas « 23 min », pour ne pas prêter au chiffre une précision qu'il n'a pas.
 */
export const MINUTES_PAR_ETAPE: Readonly<Record<Etape["type"], number>> = {
  lecture: 2,
  choix: 2,
  comparaison: 3,
  montants: 4,
  ecriture: 4,
  tri: 4,
  curseur: 4,
};

/** L'arrondi de la durée affichée, en minutes. */
export const ARRONDI_EN_MINUTES = 5;

/** La durée indicative d'un chapitre, en minutes, arrondie aux cinq minutes supérieures. */
export function dureeDuChapitre(chapitre: Pick<Chapitre, "etapes">): number {
  const brut = chapitre.etapes.reduce((n, e) => n + MINUTES_PAR_ETAPE[e.type], 0);
  return Math.ceil(brut / ARRONDI_EN_MINUTES) * ARRONDI_EN_MINUTES;
}

/** « 25 min », « 1 h 35 » : la durée telle que la page l'écrit. */
export function dureeEnClair(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}
