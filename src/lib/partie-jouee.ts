/**
 * UNE PREMIÈRE PARTIE JOUÉE, SUR CET APPAREIL (lot P4).
 *
 * L'invitation à installer l'application recouvrait la vitrine dès l'arrivée
 * sur un téléphone : on proposait d'installer un produit que le visiteur
 * n'avait pas encore essayé. Elle attend désormais qu'il ait joué. Le client
 * le sait sans serveur : l'arène pose ce témoin dès qu'elle montre un tour
 * RÉSOLU (le verdict d'un tour validé, un tour clos, le bilan d'une partie
 * terminée). Le stockage local peut manquer (navigation privée, stockage
 * bloqué) : chaque accès est sous `try`, et sans stockage, l'invitation se
 * tait — c'est le choix prudent.
 */
export const CLE_PARTIE_JOUEE = "partie-jouee-le";

export function marquerUnePartieJouee(): void {
  try {
    if (!localStorage.getItem(CLE_PARTIE_JOUEE)) {
      localStorage.setItem(CLE_PARTIE_JOUEE, String(Date.now()));
    }
  } catch {
    // stockage indisponible : rien à mémoriser, l'invitation restera muette
  }
}

export function unePartieAEteJouee(): boolean {
  try {
    return localStorage.getItem(CLE_PARTIE_JOUEE) !== null;
  } catch {
    return false;
  }
}
