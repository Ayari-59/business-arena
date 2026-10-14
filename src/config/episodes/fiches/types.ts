/**
 * LES FICHES ENSEIGNANT DES ÉPISODES.
 *
 * Un épisode joué en classe ne se conduit pas comme un atelier : il tient en
 * une séance, tout le groupe joue le même trimestre sous le même hasard, et la
 * notion du cours est le piège de la décision. La fiche dit à l'enseignant ce
 * que l'épisode enseigne, comment conduire la séance, le corrigé du calcul de
 * la semaine 1, les réflexes qu'il verra et les questions qui les font parler.
 *
 * Une fiche est une DONNÉE, adossée à un épisode du registre ; un test vérifie
 * qu'elle dit la même chose que lui : le même chiffre au corrigé, les mêmes
 * réflexes, des formations qui existent.
 */
import type { AtelierPhase } from "@/config/ateliers/types";

/** Une erreur de calcul fréquente : la valeur qu'elle donne, et d'où elle vient. */
export interface ErreurFrequente {
  valeur: number;
  cause: string;
}

/** Un réflexe de l'épisode, tel que l'enseignant le verra dans la classe. */
export interface ReflexeCommente {
  /** La décision et l'option, à partir de 0, comme dans les traces de l'épisode. */
  decision: number;
  option: number;
  /** Pourquoi il est tentant : l'argument que les élèves donneront. */
  pourquoi: string;
  /** Ce qui, dans les sources, permettait de l'éviter. */
  ceQuiLeDejoue: string;
}

export interface FicheEnseignant {
  /** Le code de l'épisode du registre. */
  code: string;
  /** Les formations servies, codes de src/config/formations.ts. */
  formations: readonly string[];
  /** Les enseignements visés, nommés comme le programme les nomme. */
  programme: readonly string[];
  /** Ce que l'épisode enseigne, en un paragraphe. */
  notion: string;
  /** Ce que l'élève sait faire à la fin, à la première personne. */
  objectifs: readonly string[];
  /** Ce qu'il faut avoir vu en cours avant de jouer. */
  prerequis: string;
  /** La séance : sa durée, et son déroulé minuté (la somme des phases). */
  dureeMinutes: number;
  deroule: readonly AtelierPhase[];
  /** Le corrigé du calcul demandé en semaine 1, dans l'unité de la prévision. */
  calcul: {
    reponse: number;
    /** Le calcul pas à pas, avec les chiffres des sources. */
    etapes: readonly string[];
    erreurs: readonly ErreurFrequente[];
  };
  reflexes: readonly ReflexeCommente[];
  /** Les questions du débrief, dans l'ordre où les poser. */
  debrief: readonly string[];
  /** Un exercice sur papier pour prolonger, avec sa réponse. */
  prolongement: { enonce: string; corrige: string };
  /** Ce qu'on évalue : jamais le résultat obtenu, qui dépend du hasard. */
  evaluation: readonly string[];
  /** Ce qu'un enseignant de la discipline doit relire, s'il y a lieu. */
  vigilance?: string;
}
