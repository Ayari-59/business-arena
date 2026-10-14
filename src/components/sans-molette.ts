import type { WheelEvent } from "react";

/**
 * LA MOLETTE NE DÉCIDE PAS DU PRIX.
 *
 * Un `<input type="number">` qui a le focus change de valeur quand la molette
 * passe dessus. Le formulaire de décision en aligne plusieurs dans un écran
 * qu'on fait défiler : l'élève clique dans « Prix », descend lire l'aide juste
 * en dessous, et le prix a changé sans un mot. C'est la seule façon connue de
 * modifier une décision sans le savoir.
 *
 * On retire le focus plutôt que d'annuler l'événement : React attache ses
 * écouteurs de molette en mode passif, `preventDefault()` n'y fait rien. Sans
 * focus, le navigateur ne touche plus au champ et le défilement continue
 * normalement — ce que voulait la personne qui a tourné la molette.
 */
export function sansMolette(e: WheelEvent<HTMLInputElement>): void {
  e.currentTarget.blur();
}
