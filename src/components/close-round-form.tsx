"use client";

import { useEffect, useState } from "react";
import { closeRoundAction, type CloseRoundState } from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { LongActionProgress } from "@/components/long-action-progress";
import { ATTENTES, confirmationCloture } from "@/config/cloture";

const initial: CloseRoundState = { error: null };

/**
 * « Clore le tour n et simuler » : d'abord une confirmation qui dit combien
 * d'équipes ont validé et que le geste est irréversible, puis l'attente
 * montrée. Le formulaire porte le numéro du tour : le serveur refuse de
 * clore un autre tour que celui affiché, un double envoi est sans effet.
 */
export function CloseRoundForm({
  gameId,
  tour,
  validees,
  total,
  ouvert = false,
}: {
  gameId: string;
  tour: number;
  validees: number;
  total: number;
  /** Confirmation déjà ouverte (rendu de test). */
  ouvert?: boolean;
}) {
  const [confirmation, setConfirmation] = useState(ouvert);
  // Le tour clôturé, la mise à jour RSC réutilise ce composant pour le tour
  // suivant sans le remonter : sans ce garde, l'état « confirmation ouverte »
  // du tour qu'on vient de clore se reporterait sur le suivant, et l'enseignant
  // tomberait sur « Clore le tour n+1 ? » sans l'avoir demandé. On le referme
  // dès que le numéro de tour change.
  useEffect(() => setConfirmation(ouvert), [tour, ouvert]);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    closeRoundAction.bind(null, gameId),
    initial,
    { label: "clôture du tour", timeoutMs: 45_000 },
  );
  const texte = confirmationCloture({ tour, validees, total });

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="roundIndex" value={tour} />
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />

      {pending ? (
        <LongActionProgress label={ATTENTES.cloture} />
      ) : confirmation ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cloture-titre"
          className="space-y-3 rounded-lg border border-amber-400/40 bg-slate-950 p-4"
        >
          <p id="cloture-titre" className="text-base font-semibold text-amber-200">
            {texte.titre}
          </p>
          <p className="text-sm text-slate-300">{texte.detail}</p>
          <p className="text-sm text-amber-300">{texte.irreversible}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            >
              {texte.confirmer}
            </button>
            <button
              type="button"
              onClick={() => setConfirmation(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              {texte.annuler}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmation(true)}
          className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300"
        >
          Clore le tour {tour} et simuler
        </button>
      )}
    </form>
  );
}
