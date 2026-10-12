"use client";

import { useState } from "react";
import { bouton } from "@/components/bouton";
import { commencerLaVraiePartieAction, type CloseRoundState } from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { LongActionProgress } from "@/components/long-action-progress";
import { CONFIRMATION_DE_LA_BASCULE } from "@/config/tour-d-essai";

const initial: CloseRoundState = { error: null };

/**
 * « COMMENCER LA VRAIE PARTIE » : la fin du tour d'essai (services/tour-d-essai.service.ts).
 *
 * D'abord une confirmation qui dit ce qui repart de zéro et ce qui reste, puis
 * l'attente montrée. Pendant l'essai, le geste est le second de l'ardoise (en
 * filet) : le premier reste « clore le tour ». L'essai terminé, il devient le seul
 * geste attendu, plein.
 */
export function CommencerLaVraiePartie({
  gameId,
  principal,
}: {
  gameId: string;
  /** L'essai est terminé : le geste attendu de l'écran. */
  principal: boolean;
}) {
  const [confirmation, setConfirmation] = useState(false);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    commencerLaVraiePartieAction.bind(null, gameId),
    initial,
    { label: "début de la vraie partie", timeoutMs: 45_000 },
  );
  const texte = CONFIRMATION_DE_LA_BASCULE;

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-3" data-bascule-de-l-essai="">
      {state.error ? (
        <p role="alert" className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />

      {pending ? (
        <LongActionProgress label={texte.attente} />
      ) : confirmation ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bascule-titre"
          className="space-y-3 rounded-lg border border-white/15 bg-slate-900 p-4"
        >
          <p id="bascule-titre" className="text-base font-semibold text-slate-50">
            {texte.titre}
          </p>
          <p className="text-sm text-slate-300">{texte.detail}</p>
          <p className="text-sm font-medium text-slate-200">{texte.irreversible}</p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={bouton()}>
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
          className={
            principal
              ? `${bouton({ taille: "l" })} w-full`
              : `${bouton({ variante: "secondaire", taille: "m" })} w-full`
          }
        >
          Commencer la vraie partie
        </button>
      )}
    </form>
  );
}
