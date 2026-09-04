"use client";

import { useState } from "react";
import {
  finishCompetitionAction,
  startFinalAction,
  startQualificationAction,
  type CompetitionActionState,
} from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { LongActionProgress } from "@/components/long-action-progress";
import { ATTENTES } from "@/config/cloture";

const initial: CompetitionActionState = { error: null };

const ACTIONS = {
  qualification: {
    fn: startQualificationAction,
    label: "Clore les inscriptions et tirer les groupes de qualification",
    attente: ATTENTES.tirageGroupes,
    // Ce que l'enseignant s'apprête à rendre définitif.
    effet:
      "Les inscriptions seront closes et les groupes tirés au sort. Le tirage est définitif : plus personne ne pourra s'inscrire ensuite.",
  },
  final: {
    fn: startFinalAction,
    label: "Qualifier les meilleurs et lancer la finale",
    attente: ATTENTES.finale,
    effet:
      "Les meilleurs de chaque groupe sont qualifiés et la finale démarre. Les équipes non qualifiées sont éliminées — c'est sans retour.",
  },
  finish: {
    fn: finishCompetitionAction,
    label: "Clore le concours et proclamer le podium",
    attente: ATTENTES.podium,
    effet:
      "Le concours sera clos et le podium proclamé. Aucun tour ne pourra plus être joué ensuite.",
  },
} as const;

/**
 * Une phase de concours est IRRÉVERSIBLE (tirage seedé consommé, équipes
 * éliminées, podium figé). On demande donc une confirmation qui nomme l'effet
 * avant de la déclencher — même geste en deux temps que la clôture d'un tour,
 * pour qu'un misclic ne ferme pas un concours en cours de remplissage.
 */
export function CompetitionControl({
  competitionId,
  action,
}: {
  competitionId: string;
  action: keyof typeof ACTIONS;
}) {
  const config = ACTIONS[action];
  const [confirmation, setConfirmation] = useState(false);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    config.fn.bind(null, competitionId),
    initial,
    { label: `concours : ${action}`, timeoutMs: 45_000 },
  );
  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      {state.error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />
      {pending ? (
        <LongActionProgress label={config.attente} />
      ) : confirmation ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={config.label}
          className="space-y-3 rounded-lg border border-amber-400/40 bg-slate-950 p-4"
        >
          <p className="text-sm text-amber-200">{config.effet}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            >
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setConfirmation(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmation(true)}
          className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300"
        >
          {config.label}
        </button>
      )}
    </form>
  );
}
