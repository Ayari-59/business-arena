/**
 * RANGER UNE PARTIE SANS LA PERDRE.
 *
 * L'archivage est une DATE (`games.archivedAt`), pas un statut. Ce sont deux
 * questions différentes : le statut dit où en est la partie — en cours,
 * terminée —, l'archivage dit si elle est rangée. Les confondre obligerait à
 * deviner quel statut rendre au désarchivage, et ferait perdre l'information :
 * une partie de juin jamais close doit redevenir « en cours » si on la
 * ressort, pas « terminée ».
 *
 * Ce module ne contient que le prédicat et la phrase, parce qu'ils sont lus
 * par des services que `game.service` importe lui-même : les y mettre créerait
 * un cycle.
 */

/** Ce qu'on répond à qui frappe à la porte d'une partie rangée. */
export const PARTIE_ARCHIVEE = "Cette partie a été archivée par l'enseignant.";

/**
 * L'énumération des statuts garde sa valeur « archived », qui n'a jamais été
 * écrite par personne. On l'accepte ici plutôt que de parier là-dessus.
 */
export function estArchivee(game: { archivedAt: Date | null; status: string }): boolean {
  return game.archivedAt !== null || game.status === "archived";
}
