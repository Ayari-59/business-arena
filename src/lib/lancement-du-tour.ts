/**
 * LE TOUR SUIVANT ATTEND LE PROFESSEUR, OU LE CALENDRIER (décision du propriétaire,
 * novembre 2026). Logique PURE : ni base, ni horloge implicite.
 *
 * Avant, la clôture du tour N ouvrait aussitôt le tour N+1 : la classe rejouait sans
 * temps de débrief. Une partie de classe créée depuis ce changement porte un MARQUEUR,
 * posé à la création dans `games.difficulty_profile` :
 *
 *   lancementDesTours: { regle: "professeur", lances: { "<id du tour>": "<ISO>" } }
 *
 * Pour une telle partie, un tour au-delà du premier, une fois ouvert par la clôture du
 * précédent, n'est jouable que :
 *   · si l'enseignant l'a LANCÉ (bouton du pilotage : l'heure est notée sous l'identifiant
 *     du tour, qui change quand la partie recommence ou quand l'essai bascule) ;
 *   · ou si le planning porte une date d'ouverture pour ce tour (`rounds.opensAt`) et
 *     qu'elle est passée. Aucune tâche planifiée : l'ouverture se DÉDUIT à la lecture,
 *     comme le verrou du planning (`lib/play-window.ts`).
 *
 * Une partie sans marqueur (toutes celles d'avant, le solo, l'examen, le concours)
 * enchaîne comme avant : `etatDuLancement` y répond « rien à attendre ». Les tours d'essai,
 * jusqu'à la bascule, enchaînent aussi comme avant : sa bascule vers la vraie partie a son
 * propre déroulé (`services/tour-d-essai.service.ts`).
 */

export interface LancementDesTours {
  regle: "professeur";
  /** L'heure du lancement de chaque tour lancé, par identifiant de tour. */
  lances: Record<string, string>;
}

/** Le marqueur à poser à la création : la classe de l'enseignant, hors concours. */
export function lancementALaCreation(args: {
  kind: string;
  mode: string;
}): LancementDesTours | undefined {
  return args.kind === "class" && args.mode === "learning"
    ? { regle: "professeur", lances: {} }
    : undefined;
}

/** Le marqueur d'une partie, ou null : elle enchaîne ses tours comme avant. */
export function lireLeLancement(profil: unknown): LancementDesTours | null {
  const brut = (profil as { lancementDesTours?: unknown } | null)?.lancementDesTours;
  if (!brut || typeof brut !== "object") return null;
  const l = brut as { regle?: unknown; lances?: unknown };
  if (l.regle !== "professeur") return null;
  const lances: Record<string, string> = {};
  if (l.lances && typeof l.lances === "object") {
    for (const [id, quand] of Object.entries(l.lances as Record<string, unknown>)) {
      if (typeof quand === "string" && !Number.isNaN(Date.parse(quand))) lances[id] = quand;
    }
  }
  return { regle: "professeur", lances };
}

export interface TourALancer {
  id: string;
  index: number;
  status: string;
  opensAt: Date | null;
}

export interface EtatDuLancement {
  /** La règle s'applique à ce tour : partie marquée, tour au-delà du premier, ouvert. */
  concerne: boolean;
  /** L'heure où l'enseignant l'a lancé ; null s'il ne l'a pas fait. */
  lanceLe: Date | null;
  /** Le tour attend encore, à `now` : ni lancé, ni arrivé à sa date. */
  enAttente: boolean;
  /** La date du planning à laquelle il s'ouvrira seul, tant qu'il n'est pas lancé. */
  ouvertureAuto: Date | null;
}

/** L'essai n'a pas encore basculé vers la vraie partie (`config/tour-d-essai.ts`). */
function essaiEnJeu(essai: unknown): boolean {
  const phase = (essai as { phase?: unknown } | null)?.phase;
  return typeof phase === "string" && phase !== "fini";
}

const RIEN_A_ATTENDRE: EtatDuLancement = {
  concerne: false,
  lanceLe: null,
  enAttente: false,
  ouvertureAuto: null,
};

export function etatDuLancement(args: {
  profil: unknown;
  /** `games.essai` : tant que l'essai n'a pas basculé, ses tours enchaînent comme avant. */
  essai: unknown;
  tour: TourALancer | null | undefined;
  now: Date;
}): EtatDuLancement {
  const lancement = lireLeLancement(args.profil);
  const tour = args.tour;
  if (!lancement || !tour || tour.index <= 1 || tour.status !== "open") return RIEN_A_ATTENDRE;
  if (essaiEnJeu(args.essai)) return RIEN_A_ATTENDRE;
  const lance = lancement.lances[tour.id];
  if (lance) return { concerne: true, lanceLe: new Date(lance), enAttente: false, ouvertureAuto: null };
  const date = tour.opensAt;
  return {
    concerne: true,
    lanceLe: null,
    enAttente: !date || args.now.getTime() < date.getTime(),
    ouvertureAuto: date,
  };
}

/** Ce que l'élève lit tant que le tour attend son professeur. */
export function messageDAttente(tour: number): string {
  return `Le tour ${tour} n'est pas encore lancé : votre professeur l'ouvrira.`;
}

/**
 * Le statut que les sondeurs (élève, pilotage, mur) comparent : « attente » tant que le
 * tour attend, pour que la page se recharge d'elle-même au lancement ou à la date.
 */
export function statutSonde(statut: string, etat: EtatDuLancement): string {
  return etat.enAttente ? "attente" : statut;
}

/**
 * QUAND LE TOUR S'EST OUVERT, pour mesurer le temps des équipes
 * (`services/observation.service.ts`) : son lancement, sinon la date du planning, sinon,
 * pour une partie qui enchaîne, la clôture du tour précédent. Une partie marquée n'a pas
 * ce dernier repère : son tour s'ouvre au lancement, pas à la clôture.
 */
export function ouvertureDuTour(args: {
  profil: unknown;
  essai: unknown;
  tour: { id: string; opensAt: Date | null };
  clotureDuPrecedent: Date | null;
}): Date | null {
  const lancement = lireLeLancement(args.profil);
  const lance = lancement?.lances[args.tour.id];
  if (lance) return new Date(lance);
  if (args.tour.opensAt) return args.tour.opensAt;
  const enchaine = !lancement || essaiEnJeu(args.essai);
  return enchaine ? args.clotureDuPrecedent : null;
}

/** « 18 novembre 2026 à 08:30 », à l'heure de Paris : la date que le pilotage annonce. */
export function dateDeLancement(iso: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "long",
    timeStyle: "short",
  }).format(typeof iso === "string" ? new Date(iso) : iso);
}
