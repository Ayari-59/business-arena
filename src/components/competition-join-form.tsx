"use client";

import { joinCompetitionAction, type JoinCompetitionState } from "@/app/compete/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { messageDejaInscrit } from "@/config/concours";

const initial: JoinCompetitionState = { error: null, dejaInscrit: null };

export function CompetitionJoinForm({
  initialState = initial,
}: {
  /** État de départ : celui d'un formulaire vierge, sauf pour un rendu de test. */
  initialState?: JoinCompetitionState;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    joinCompetitionAction,
    initialState,
    { label: "inscription à un concours" },
  );
  return (
    <form
      ref={formRef}
      action={formAction}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6"
    >
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Code du concours
        </span>
        <input
          name="code"
          required
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="EX : R4KT7B"
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-center font-mono text-lg uppercase tracking-[0.3em] text-amber-300 outline-none focus:border-amber-400/60"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Nom de votre équipe
        </span>
        <input
          name="teamLabel"
          required
          maxLength={40}
          placeholder="Les Requins du BFR"
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Votre prénom / pseudo
        </span>
        <input
          name="pseudo"
          required
          maxLength={40}
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
        />
      </label>
      {state.error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      {state.dejaInscrit ? (
        <div
          role="status"
          className="space-y-2 rounded-lg border border-amber-400/30 bg-amber-950/20 px-3 py-2 text-sm text-amber-200"
        >
          <p>{messageDejaInscrit(state.dejaInscrit.teamLabel)}</p>
          <a
            href={`/compete/${state.dejaInscrit.competitionId}`}
            className="inline-block rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
          >
            Ouvrir mon équipe →
          </a>
        </div>
      ) : null}
      <GuardError message={guardError} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
      >
        {pending ? "Inscription…" : "S'inscrire au concours"}
      </button>
    </form>
  );
}
