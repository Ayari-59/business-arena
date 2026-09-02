"use client";

import {
  finishCompetitionAction,
  startFinalAction,
  startQualificationAction,
  type CompetitionActionState,
} from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";

const initial: CompetitionActionState = { error: null };

const ACTIONS = {
  qualification: {
    fn: startQualificationAction,
    label: "Clore les inscriptions et tirer les groupes de qualification",
  },
  final: { fn: startFinalAction, label: "Qualifier les meilleurs et lancer la finale" },
  finish: { fn: finishCompetitionAction, label: "Clore le concours et proclamer le podium" },
} as const;

export function CompetitionControl({
  competitionId,
  action,
}: {
  competitionId: string;
  action: keyof typeof ACTIONS;
}) {
  const config = ACTIONS[action];
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
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
      >
        {pending ? "En cours…" : config.label}
      </button>
    </form>
  );
}
