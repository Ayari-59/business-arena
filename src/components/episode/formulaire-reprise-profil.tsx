"use client";

import { bouton } from "@/components/bouton";
import {
  reprendreProfilAction,
  type RepriseDeProfilState,
} from "@/app/entreprises/episode/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { formaterCodeDeReprise, LONGUEUR_CODE_REPRISE } from "@/config/reprise";

const initial: RepriseDeProfilState = { error: null };

/** Reprendre son profil décisionnel sur cet appareil, avec son code personnel. */
export function FormulaireRepriseProfil() {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    reprendreProfilAction,
    initial,
    { label: "reprise du profil décisionnel" },
  );
  return (
    <form ref={formRef} action={formAction} className="carte grid w-full max-w-sm gap-4 p-6">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Votre code de reprise
        </span>
        <input
          name="code"
          required
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
      <button type="submit" disabled={pending} className={`${bouton({ taille: "l" })} w-full`}>
        {pending ? "Reprise…" : "Reprendre mon profil"}
      </button>
    </form>
  );
}
