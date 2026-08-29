"use client";

import { useFormStatus } from "react-dom";

/**
 * LE BOUTON QUI DIT QU'IL A ENTENDU.
 *
 * Un formulaire branché sur une action serveur peut mettre plusieurs secondes :
 * créer une partie, c'est écrire des équipes, des concurrents et six tours ;
 * clôturer un tour, c'est faire tourner la simulation pour toute la classe.
 * Pendant ce temps, un bouton ordinaire ne bouge pas d'un pixel. L'utilisateur
 * croit que son clic s'est perdu, et il reclique.
 *
 * `useFormStatus` doit être appelé par un composant SITUÉ DANS le formulaire,
 * jamais par celui qui le rend : d'où ce composant séparé, et non un état
 * remonté dans la page.
 *
 * Le bouton se désactive pendant l'attente, ce qui règle aussi la double
 * soumission : deux clics créaient deux parties.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
}: {
  children: React.ReactNode;
  /**
   * Ce que le bouton dit pendant l'attente. Un verbe en cours, pas un mot.
   * Omis quand le bouton porte une mise en page qu'un libellé remplacerait
   * mal : il se contente alors de se désactiver, ce qui suffit à dire non.
   */
  pendingLabel?: string;
  className?: string;
  /** Désactivation propre au bouton, indépendante de l'attente. */
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`${className ?? ""} disabled:cursor-progress disabled:opacity-70`}
    >
      {pending && pendingLabel ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            aria-hidden
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
