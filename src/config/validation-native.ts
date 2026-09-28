/**
 * LA BULLE DU NAVIGATEUR PARLE LA LANGUE DU NAVIGATEUR, PAS CELLE DE LA PAGE.
 *
 * Relevé en recette : sur l'écran de décision du premier tour, la note d'avant
 * est exigée, et un envoi sans elle affiche « Please fill out this field »
 * posé au milieu d'un écran entièrement français. Ce n'est pas un défaut de la
 * page — Chrome et Firefox écrivent ces messages dans la langue de LEUR
 * interface, sans regarder le `lang` du document — mais c'est bien l'élève qui
 * le lit, et le dépôt s'est donné pour règle que ses écrans ne parlent pas
 * anglais.
 *
 * On ne remplace donc pas la validation native, qui est la bonne mécanique :
 * elle bloque avant l'envoi, place sa bulle toute seule, la lit à la voix et
 * met le champ au premier plan. On lui donne seulement NOS mots, par
 * `setCustomValidity`.
 *
 * DEUX PRÉCAUTIONS, ET LA SECONDE EST LA PLUS FACILE À OUBLIER. Le message se
 * pose dans `onInvalid`, au moment où le navigateur constate la faute, et il
 * faut l'EFFACER à la première frappe : un `setCustomValidity` non vidé rend
 * le champ invalide pour toujours, et le formulaire ne part plus jamais. Les
 * deux vont donc ensemble, d'où `proprietesDeValidite`, qui les pose du même
 * geste plutôt que de laisser poser l'une sans l'autre.
 */

/** Un champ qui sait dire pourquoi il refuse. */
type ChampValidable = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export interface MessagesDeValidite {
  /** Champ vide alors qu'il est demandé. */
  manquant?: string;
  /** Saisie trop courte au regard de `minLength`. */
  tropCourt?: string;
}

/**
 * Le message à afficher pour l'état d'un champ. Rend "" quand rien n'est à
 * dire : c'est ce qui rend le champ valide de nouveau.
 */
export function messageDeValidite(champ: ChampValidable, messages: MessagesDeValidite): string {
  const etat = champ.validity;
  if (etat.valueMissing && messages.manquant) return messages.manquant;
  if (etat.tooShort && messages.tropCourt) return messages.tropCourt;
  // Tout le reste (type, motif, bornes) garde le message du navigateur : mieux
  // vaut une phrase dans une autre langue qu'une phrase fausse dans la nôtre.
  return "";
}

/**
 * Les deux gestionnaires à poser sur un champ, ensemble. À étaler sur la
 * balise : `<textarea {...proprietesDeValidite({ manquant: "…" })} />`.
 */
export function proprietesDeValidite(messages: MessagesDeValidite): {
  onInvalid: (e: { currentTarget: ChampValidable }) => void;
  onInput: (e: { currentTarget: ChampValidable }) => void;
} {
  return {
    onInvalid: (e) => {
      // On vide d'abord : un message personnalisé déjà posé rendrait
      // `validity` invalide en permanence, et masquerait l'état réel du champ.
      e.currentTarget.setCustomValidity("");
      e.currentTarget.setCustomValidity(messageDeValidite(e.currentTarget, messages));
    },
    onInput: (e) => e.currentTarget.setCustomValidity(""),
  };
}
