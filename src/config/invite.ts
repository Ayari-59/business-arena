/**
 * LE NOM D'UN INVITÉ QUI N'A ENCORE RIEN REJOINT.
 *
 * Un visiteur reçoit un compte minimal avant d'avoir donné le moindre prénom :
 * il porte ce nom-là. Partout où l'on affiche « vous jouez sous le nom de… »,
 * ce nom n'apprend rien et ne doit pas s'afficher. La règle vit ici, en un
 * seul endroit, parce qu'elle est lue des deux côtés : la page d'entrée par
 * code (avant la saisie) et la vue de partie (dans l'arène).
 */
export const NOM_INVITE_PAR_DEFAUT = "Joueur invité";

/** Le prénom à afficher, ou null s'il n'y en a pas de vrai. */
export function pseudoAffichable(nom: string | null | undefined): string | null {
  const propre = nom?.trim();
  return !propre || propre === NOM_INVITE_PAR_DEFAUT ? null : propre;
}
