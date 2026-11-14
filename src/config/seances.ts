/* ---------------------------------------------------------------------------
 * LA PARTIE EN SÉANCES (séance d'essai, P0-1).
 *
 * L'enseignant ne pense pas en tours mais en séances : « combien d'heures de
 * cours me prend cette partie ? ». La séance d'essai a joué la partie par
 * défaut, six tours, et mesuré une séance de 55 min : l'installation (10 min),
 * le tour 1 (20 min), la clôture et la révélation (3 à 5 min), le tour 2 (15 à
 * 18 min), la révélation (3 min). Deux tours par séance, trois séances.
 * ------------------------------------------------------------------------- */

/** Une heure de cours, telle qu'on la compte au lycée. */
export const MINUTES_PAR_SEANCE = 55;
/** La première séance : projection, code, connexions, explications, nom d'équipe. */
export const MINUTES_INSTALLATION = 10;
/** Les séances suivantes : rouvrir la partie, se reconnecter, rappeler où l'on en est. */
export const MINUTES_REPRISE = 5;
/** Après chaque tour : clore, révéler le classement, le commenter d'un mot. */
export const MINUTES_REVELATION = 3;

export interface PlanDesSeances {
  /** Combien de séances la partie demande. */
  seances: number;
  /** Les tours (numérotés à partir de 1) que joue chaque séance. */
  toursParSeance: number[][];
}

/**
 * Range les tours dans les séances, dans l'ordre : un tour entre dans la
 * séance si sa durée et sa révélation y tiennent encore ; sinon il ouvre la
 * séance suivante. Une séance joue toujours au moins un tour.
 */
export function planDesSeances(
  dureesDesTours: readonly number[],
  minutesParSeance: number = MINUTES_PAR_SEANCE,
): PlanDesSeances {
  const toursParSeance: number[][] = [];
  let courante: number[] = [];
  let occupe = MINUTES_INSTALLATION;
  dureesDesTours.forEach((minutes, i) => {
    const tour = minutes + MINUTES_REVELATION;
    if (courante.length > 0 && occupe + tour > minutesParSeance) {
      toursParSeance.push(courante);
      courante = [];
      occupe = MINUTES_REPRISE;
    }
    courante.push(i + 1);
    occupe += tour;
  });
  if (courante.length > 0) toursParSeance.push(courante);
  return { seances: toursParSeance.length, toursParSeance };
}

/** La séance (à partir de 1) qui joue ce tour, d'après le plan. */
export function seanceDuTour(plan: PlanDesSeances, tour: number): number {
  const i = plan.toursParSeance.findIndex((s) => s.includes(tour));
  return i === -1 ? plan.seances : i + 1;
}

/** Ce tour est-il le dernier de sa séance ? Après lui, on reprend à la suivante. */
export function dernierTourDeSaSeance(plan: PlanDesSeances, tour: number): boolean {
  const s = plan.toursParSeance.find((x) => x.includes(tour));
  return s !== undefined && s[s.length - 1] === tour;
}

/**
 * Les durées des tours d'une partie de classe : le premier, puis les suivants,
 * avec le tour d'essai devant s'il y en a un. L'essai prend la prise en main ;
 * la vraie partie ne la repaie pas.
 */
export function dureesDeLaPartie(p: {
  tours: number;
  premier: number;
  suivant: number;
  toursDEssai?: number;
}): number[] {
  const essai = p.toursDEssai ?? 0;
  const total = essai + p.tours;
  return Array.from({ length: total }, (_, i) => (i === 0 ? p.premier : p.suivant));
}

/** « environ 3 séances de 55 min », ou « une séance de 55 min ». */
export function seancesEnClair(seances: number): string {
  return seances <= 1
    ? `une séance de ${MINUTES_PAR_SEANCE} min`
    : `environ ${seances} séances de ${MINUTES_PAR_SEANCE} min`;
}

/**
 * CE QUE LE FORMULAIRE DE CRÉATION REÇOIT POUR UNE ENTREPRISE
 * (`config/estimation-de-la-partie.ts`) : la durée du premier tour et d'un tour
 * suivant, par niveau, avec et sans questions dans les situations.
 */
export interface EstimationDuScenario {
  /** Les tours de la partie écrite : ce que « Tours joués » vide veut dire. */
  toursEcrits: number;
  /** Par niveau : [premier, suivant, premier sans questions, suivant sans questions], en minutes. */
  parNiveau: Record<number, [number, number, number, number]>;
}

/** Le plan des séances d'une partie, d'après les réglages du formulaire. */
export function planDuFormulaire(
  e: EstimationDuScenario,
  reglages: { niveau: number; tours: number; avecQuiz: boolean; toursDEssai: number },
): PlanDesSeances & { premier: number; suivant: number } {
  const [premier, suivant, premierSans, suivantSans] =
    e.parNiveau[reglages.niveau] ?? Object.values(e.parNiveau)[0] ?? [20, 17, 16, 13];
  const p = reglages.avecQuiz ? premier : premierSans;
  const q = reglages.avecQuiz ? suivant : suivantSans;
  return {
    ...planDesSeances(
      dureesDeLaPartie({ tours: reglages.tours, toursDEssai: reglages.toursDEssai, premier: p, suivant: q }),
    ),
    premier: p,
    suivant: q,
  };
}
