"use client";

import { bouton } from "@/components/bouton";
import { joinCompetitionAction, type JoinCompetitionState } from "@/app/compete/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { messageDejaInscrit } from "@/config/concours";

const initial: JoinCompetitionState = { error: null, dejaInscrit: null };

export function CompetitionJoinForm({
  initialState = initial,
  defaultCode = "",
}: {
  /** État de départ : celui d'un formulaire vierge, sauf pour un rendu de test. */
  initialState?: JoinCompetitionState;
  /** Code prérempli quand on arrive depuis la page publique d'un concours. */
  defaultCode?: string;
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
      className="w-full max-w-sm space-y-4 carte p-4 sm:p-7"
    >
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Code du concours
        </span>
        <input
          name="code"
          required
          defaultValue={defaultCode}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="EX : R4KT7B"
          className="mt-1 w-full champ px-3 py-2 text-center font-mono text-lg uppercase tracking-annonce text-slate-100 outline-none"
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
          className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
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
          className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
        />
      </label>
      {state.error ? (
        <p className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      {state.dejaInscrit ? (
        <div
          role="status"
          className="space-y-2 rounded-lg encadre-neutre px-3 py-2 text-sm text-slate-200"
        >
          <p>{messageDejaInscrit(state.dejaInscrit.teamLabel)}</p>
          <a
            href={`/compete/${state.dejaInscrit.competitionId}`}
            className={bouton()}
          >
            Ouvrir mon équipe →
          </a>
        </div>
      ) : null}
      <GuardError message={guardError} />
      <button
        type="submit"
        disabled={pending}
        className={`${bouton({ taille: "l" })} w-full`}
      >
        {pending ? "Inscription…" : "S'inscrire au concours"}
      </button>
    </form>
  );
}
