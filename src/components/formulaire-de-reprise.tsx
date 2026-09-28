"use client";

import { bouton } from "@/components/bouton";
import { reprendreSaPlaceAction, type RepriseDePlaceState } from "@/app/reprendre/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { formaterCodeDeReprise, LONGUEUR_CODE_REPRISE } from "@/config/reprise";

const initial: RepriseDePlaceState = { error: null };

/**
 * REPRENDRE SA PLACE DEPUIS N'IMPORTE QUEL APPAREIL.
 *
 * Le code arrive tout seul quand l'élève a scanné son QR personnel : le champ
 * est rempli, il ne reste qu'à valider. Il reste saisissable pour celui qui a
 * noté son code sur un cahier, ou à qui l'enseignant vient de le relire.
 */
export function FormulaireDeReprise({
  codeInitial = null,
  initialState = initial,
}: {
  codeInitial?: string | null;
  initialState?: RepriseDePlaceState;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    reprendreSaPlaceAction,
    initialState,
    { label: "reprise de sa place" },
  );
  return (
    <form
      ref={formRef}
      action={formAction}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6"
    >
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Votre code de reprise
        </span>
        <input
          name="code"
          required
          defaultValue={codeInitial ? formaterCodeDeReprise(codeInitial) : undefined}
          autoFocus={codeInitial !== null}
          // Deux groupes de quatre, plus le tiret : l'élève recopie ce qu'il a
          // noté, tiret compris, et la saisie ne se coupe pas au huitième signe.
          maxLength={LONGUEUR_CODE_REPRISE + 2}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder={formaterCodeDeReprise("K7PD5M2X")}
          className="mt-1 w-full champ px-3 py-2 text-center font-mono text-lg uppercase tracking-[0.2em] text-amber-300 outline-none"
        />
      </label>
      {state.error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />
      <button
        type="submit"
        disabled={pending}
        className={`${bouton({ taille: "l" })} w-full`}
      >
        {pending ? "Reprise…" : "Reprendre ma place"}
      </button>
    </form>
  );
}
