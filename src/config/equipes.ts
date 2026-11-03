/**
 * LE NOMBRE D'ÉQUIPES D'ÉLÈVES D'UNE PARTIE DE CLASSE : ce que le formulaire de création
 * propose, ce que le service accepte, et ce que le guide annonce, lus au même endroit.
 */
export const EQUIPES_D_UNE_PARTIE = { min: 1, max: 8 } as const;

/** Les choix du formulaire, du plus petit au plus grand. */
export const CHOIX_D_EQUIPES: readonly number[] = Array.from(
  { length: EQUIPES_D_UNE_PARTIE.max - EQUIPES_D_UNE_PARTIE.min + 1 },
  (_, i) => EQUIPES_D_UNE_PARTIE.min + i,
);
