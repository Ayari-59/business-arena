/**
 * COMBIEN DE TEMPS IL RESTE.
 *
 * La fenêtre de jeu existait déjà (planning de la partie, du tour, d'une étape
 * de concours), et le verrou se levait correctement — mais `playLockMessage`
 * rend `null` tant que c'est jouable. Autrement dit : l'enseignant pouvait
 * poser une échéance à 15 h 40, et rien à l'écran de l'élève ne le disait. On
 * découvrait la date limite en étant refusé, après vingt minutes de saisie.
 *
 * Ce module est PUR : il traduit une échéance en ce qui s'affiche. Le temps
 * restant est calculé par l'appelant à partir d'un `now` explicite, jamais lu
 * ici, pour que le rendu serveur et le rendu client ne se contredisent pas.
 */

/** En dessous, l'échéance cesse d'être une information et devient un compte à rebours. */
export const SEUIL_URGENCE_MINUTES = 10;

/** Au-delà, annoncer le temps restant n'aide pas : la date suffit. */
export const SEUIL_DECOMPTE_MINUTES = 120;

export interface Echeance {
  /** « mardi 21 septembre à 15:40 ». Toujours affiché. */
  absolu: string;
  /** « dans 12 minutes », ou null au-delà du seuil de décompte. */
  restant: string | null;
  /** Moins de dix minutes : l'affichage passe en alerte. */
  urgence: boolean;
  /** L'échéance est passée. */
  depassee: boolean;
}

const DATE_FR = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/** « mardi 21 septembre à 15:40 » : le « à » que le formateur ne met pas. */
export function dateLisible(quand: Date): string {
  return DATE_FR.format(quand).replace(/\s+(\d{2}:\d{2})$/, " à $1");
}

/** Le temps restant en toutes lettres, arrondi à la minute supérieure. */
function enToutesLettres(minutes: number): string {
  if (minutes >= 60) {
    const heures = Math.floor(minutes / 60);
    const reste = minutes % 60;
    const h = `${heures} h`;
    return reste === 0 ? `dans ${h}` : `dans ${h} ${String(reste).padStart(2, "0")}`;
  }
  if (minutes <= 1) return "dans moins d'une minute";
  return `dans ${minutes} minutes`;
}

/**
 * Ce qu'on affiche d'une échéance à l'instant `maintenant`.
 *
 * `restant` est volontairement absent au-delà de deux heures : « dans 5 h 20 »
 * ne change aucune décision et ajoute un chiffre de plus à un écran qui en
 * porte déjà beaucoup. La date, elle, sert à noter l'heure dans l'agenda.
 */
export function echeanceDuTour(closesAt: Date, maintenant: Date): Echeance {
  const msRestants = closesAt.getTime() - maintenant.getTime();
  const minutes = Math.ceil(msRestants / 60_000);
  const depassee = msRestants <= 0;
  return {
    absolu: dateLisible(closesAt),
    restant: depassee || minutes > SEUIL_DECOMPTE_MINUTES ? null : enToutesLettres(minutes),
    urgence: !depassee && minutes <= SEUIL_URGENCE_MINUTES,
    depassee,
  };
}
