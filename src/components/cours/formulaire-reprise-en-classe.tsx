"use client";

import { bouton } from "@/components/bouton";
import { reprendreSaPlaceAction, type RepriseEnClasseState } from "@/app/cours/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { formaterCodeDeReprise, LONGUEUR_CODE_REPRISE } from "@/config/reprise";

const initial: RepriseEnClasseState = { error: null };

/**
 * REPRENDRE SA PLACE DANS SA CLASSE DU COURS, SUR CET APPAREIL, AVEC SON CODE DE REPRISE (audit UX du
 * 11 novembre 2026, P1-5). Le formulaire est celui du profil des épisodes, dont il reprend le code.
 */
export function FormulaireRepriseEnClasse() {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(reprendreSaPlaceAction, initial, {
    label: "reprise de sa place dans la classe",
  });
  return (
    <form ref={formRef} action={formAction} className="carte grid w-full max-w-sm gap-4 p-6" noValidate>
      <label className="grid gap-1">
        <span className="text-sm font-semibold text-slate-200">Votre code de reprise</span>
        <input
          name="code"
          required
          maxLength={LONGUEUR_CODE_REPRISE + 2}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder={formaterCodeDeReprise("K7PD5M2X")}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "refus-de-la-reprise" : undefined}
          className="champ w-full px-3 py-2 text-center font-mono text-lg uppercase tracking-surtitre text-slate-100"
        />
      </label>
      {state.error ? (
        <p id="refus-de-la-reprise" role="alert" className="encadre-perte rounded-lg px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />
      <button type="submit" disabled={pending} className={`${bouton({ taille: "l" })} w-full`}>
        {pending ? "Reprise…" : "Reprendre ma place"}
      </button>
    </form>
  );
}
