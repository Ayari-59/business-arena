/**
 * Le verrou temporel du planning (phase A), en logique PURE.
 *
 * Trois fenêtres peuvent se superposer : la partie (globale), le tour courant,
 * et — pour un concours — l'étape. On ne peut jouer que lorsqu'on est DANS
 * toutes les fenêtres définies à la fois :
 * - l'ouverture effective est la PLUS TARDIVE des ouvertures définies (il faut
 *   que la dernière soit passée) ;
 * - la fermeture effective est la PLUS PRÉCOCE des fermetures définies (la
 *   première qui tombe referme l'accès).
 *
 * Aucune fenêtre définie = pas de planning : l'accès suit le pilotage manuel
 * des tours, comme avant (rétrocompatible). Ce module ne connaît QUE le temps ;
 * le statut du tour (open/resolved…) et l'état de la partie sont vérifiés
 * ailleurs, et combinés à ce verrou au point d'application.
 */

export type PlayLockState = "before" | "open" | "after";

export interface PlayWindowInput {
  now: Date;
  gameOpensAt?: Date | null;
  gameClosesAt?: Date | null;
  roundOpensAt?: Date | null;
  roundDeadline?: Date | null;
  stageStartsAt?: Date | null;
  stageEndsAt?: Date | null;
  /**
   * Le tour attend que l'enseignant le lance (`lib/lancement-du-tour.ts`) : son numéro.
   * Absent ou nul : rien à attendre, comme avant.
   */
  attenteDuLancement?: { tour: number } | null;
}

export interface PlayWindow {
  /** La soumission de décisions est-elle autorisée à `now` ? */
  playable: boolean;
  /** « pas encore ouvert » / « ouvert » / « clôturé ». */
  state: PlayLockState;
  /** Ouverture effective (la plus tardive), ou null si aucune n'est définie. */
  opensAt: Date | null;
  /** Fermeture effective (la plus précoce), ou null si aucune n'est définie. */
  closesAt: Date | null;
  /** Le tour attend son lancement par l'enseignant : son numéro. */
  attenteDuLancement?: { tour: number };
}

function latest(dates: Array<Date | null | undefined>): Date | null {
  const defined = dates.filter((d): d is Date => d instanceof Date);
  if (defined.length === 0) return null;
  return defined.reduce((a, b) => (b.getTime() > a.getTime() ? b : a));
}

function earliest(dates: Array<Date | null | undefined>): Date | null {
  const defined = dates.filter((d): d is Date => d instanceof Date);
  if (defined.length === 0) return null;
  return defined.reduce((a, b) => (b.getTime() < a.getTime() ? b : a));
}

export function computePlayWindow(input: PlayWindowInput): PlayWindow {
  const opensAt = latest([input.gameOpensAt, input.roundOpensAt, input.stageStartsAt]);
  const closesAt = earliest([input.gameClosesAt, input.roundDeadline, input.stageEndsAt]);
  const t = input.now.getTime();

  if (opensAt && t < opensAt.getTime()) {
    return { playable: false, state: "before", opensAt, closesAt };
  }
  if (closesAt && t > closesAt.getTime()) {
    return { playable: false, state: "after", opensAt, closesAt };
  }
  // Un tour clôturé par le planning le reste ; sinon, celui qui attend son lancement
  // n'est pas encore ouvert, quelles que soient les autres fenêtres.
  if (input.attenteDuLancement) {
    return {
      playable: false,
      state: "before",
      opensAt,
      closesAt,
      attenteDuLancement: { tour: input.attenteDuLancement.tour },
    };
  }
  return { playable: true, state: "open", opensAt, closesAt };
}
