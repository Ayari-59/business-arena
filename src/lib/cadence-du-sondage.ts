/**
 * LA CADENCE DU SONDEUR (`components/round-status-poller.tsx`).
 *
 * Pendant une séance, une page qui attend une validation, une clôture ou une
 * révélation doit la montrer vite : à la séance d'essai du 13 novembre 2026,
 * le mur disait encore « 2 / 4 » quand le pilotage comptait 3 sur 4, et un
 * élève voyait ses résultats 42 s à 3 min après la clôture, parce que le
 * sondeur partait à 60 s et ralentissait jusqu'à 180 s.
 *
 * La règle est donc double :
 *  - EN SÉANCE, c'est-à-dire tant que quelque chose a bougé (ou que la page a
 *    été ouverte ou revue) depuis moins de `DUREE_DE_SEANCE_MS`, on sonde à
 *    cadence fixe, `CADENCE_DE_SEANCE_MS`, sans aucun recul ;
 *  - HORS SÉANCE, un onglet oublié ouvert : on repart à `BASE_MS` et on
 *    ralentit (×1,5) jusqu'à `MAX_MS`, comme avant.
 * Un onglet caché ne sonde jamais : c'est le sondeur qui s'en charge.
 */
export const CADENCE_DE_SEANCE_MS = 12_000;
export const BASE_MS = 60_000;
export const MAX_MS = 180_000;
/** Une séance est finie quand plus rien n'a bougé depuis 30 min. */
export const DUREE_DE_SEANCE_MS = 30 * 60_000;

export function prochainDelai(p: {
  /** Le délai qui vient de s'écouler. */
  delai: number;
  /** Le dernier sondage a-t-il vu un changement ? */
  change: boolean;
  /** Depuis quand rien n'a bougé (ni changement, ni retour sur l'onglet). */
  depuisLeDernierMouvementMs: number;
}): number {
  if (p.change || p.depuisLeDernierMouvementMs < DUREE_DE_SEANCE_MS) return CADENCE_DE_SEANCE_MS;
  // Hors séance : la cadence lente reprend à sa base, puis ralentit.
  if (p.delai < BASE_MS) return BASE_MS;
  return Math.min(MAX_MS, Math.round(p.delai * 1.5));
}

/**
 * LA CHARGE D'UNE CLASSE EN SÉANCE : les requêtes par minute que reçoit le
 * serveur quand `eleves` téléphones, le pilotage et le mur restent ouverts et
 * visibles. Écrite ici pour que le chiffre du rapport se recalcule.
 */
export function requetesParMinute(pages: number, cadenceMs = CADENCE_DE_SEANCE_MS): number {
  return Math.round(pages * (60_000 / cadenceMs) * 100) / 100;
}
