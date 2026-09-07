"use client";

import { setStageWindowAction, type CompetitionActionState } from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { utcToParisLocalInput } from "@/lib/paris-time";

const initial: CompetitionActionState = { error: null };

const KIND_LABEL: Record<string, string> = {
  qualification: "Qualification",
  final: "Finale",
};

/**
 * Fenêtre d'une étape de concours (heure de Paris). Le verrou d'étape s'ajoute
 * à celui de chaque partie et de chaque tour : les équipes ne jouent que
 * pendant l'intersection des fenêtres posées. Un champ vide = pas de borne.
 *
 * Une étape par formulaire (donc une ref de garde-fou par formulaire) : les
 * étapes apparaissent au fil du concours (qualification puis finale), on ne
 * peut pas les regrouper d'avance.
 */
export function StageSchedule({
  competitionId,
  stageId,
  kind,
  startsAt,
  endsAt,
}: {
  competitionId: string;
  stageId: string;
  kind: string;
  startsAt: string | null;
  endsAt: string | null;
}) {
  const action = setStageWindowAction.bind(null, competitionId, stageId);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(action, initial, {
    label: "planning de l'étape",
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-white/10 bg-slate-950/60 p-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
        {KIND_LABEL[kind] ?? kind}
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-300">Ouverture</span>
          <input
            type="datetime-local"
            name="startsAt"
            defaultValue={utcToParisLocalInput(startsAt ? new Date(startsAt) : null)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-300">Fermeture</span>
          <input
            type="datetime-local"
            name="endsAt"
            defaultValue={utcToParisLocalInput(endsAt ? new Date(endsAt) : null)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-progress disabled:opacity-70"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
      {state.error ? (
        <p role="alert" className="mt-2 text-xs text-rose-300">
          {state.error}
        </p>
      ) : null}
      {guardError ? (
        <div className="mt-2">
          <GuardError message={guardError} />
        </div>
      ) : null}
    </form>
  );
}
