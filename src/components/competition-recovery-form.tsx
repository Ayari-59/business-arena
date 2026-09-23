"use client";

import { reprendreSonEquipeAction, type RepriseState } from "@/app/compete/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { formaterCodeDeReprise, LONGUEUR_CODE_REPRISE } from "@/config/reprise";

const initial: RepriseState = { error: null };

/**
 * RETROUVER SON ÉQUIPE DEPUIS UN AUTRE APPAREIL.
 *
 * Un élève de concours est reconnu par son navigateur. Le code personnel qu'il
 * a noté à l'inscription lui rend son identité d'un seul champ — y compris
 * après la clôture des inscriptions, où il n'avait plus aucun recours.
 */
export function CompetitionRecoveryForm({
  initialState = initial,
}: {
  /** État de départ : celui d'un formulaire vierge, sauf pour un rendu de test. */
  initialState?: RepriseState;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    reprendreSonEquipeAction,
    initialState,
    { label: "reprise d'une équipe de concours" },
  );
  return (
    <form ref={formRef} action={formAction} className="w-full max-w-sm space-y-3">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Votre code de reprise
        </span>
        <input
          name="code"
          required
          // Deux groupes de quatre, plus le tiret : l'élève recopie ce qu'il a
          // noté, tiret compris, et la saisie ne doit pas se couper au 8e signe.
          maxLength={LONGUEUR_CODE_REPRISE + 2}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder={formaterCodeDeReprise("K7PD5M2X")}
          className="mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-center font-mono text-lg uppercase tracking-[0.2em] text-amber-300 outline-none focus:border-amber-400/60"
        />
      </label>
      <p className="text-xs leading-relaxed text-slate-400">
        Reçu à votre inscription. Il vous rend votre équipe depuis n&apos;importe quel appareil,
        même une fois les inscriptions closes. Votre enseignant peut vous le relire.
      </p>
      {state.error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60"
      >
        {pending ? "Reprise…" : "Retrouver mon équipe"}
      </button>
    </form>
  );
}
