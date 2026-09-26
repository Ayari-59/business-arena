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

/**
 * Pourquoi l'on refuse de supprimer. On ne supprime qu'une partie vierge :
 * au-delà, l'archivage rend le même service sans emporter du travail d'élève,
 * et le refus doit le DIRE, sinon l'enseignant cherche un bouton qui n'existe
 * pas.
 */
export const PARTIE_DEJA_JOUEE =
  "Cette partie a déjà été jouée : elle ne se supprime pas. Rangez-la plutôt, rien ne sera perdu.";

export const PARTIE_AVEC_ELEVES =
  "Des élèves sont inscrits dans cette partie : elle ne se supprime pas. Rangez-la plutôt.";
