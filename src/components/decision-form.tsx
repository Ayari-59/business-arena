"use client";

import { useActionState } from "react";
import { playRoundAction, type PlayRoundState } from "@/app/arena/[gameId]/actions";
import type { RoundDecisions } from "@/engine/types";

const initialState: PlayRoundState = { error: null };

function Field({
  name,
  label,
  defaultValue,
  step = 1,
  suffix,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: number;
  step?: number;
  suffix: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="mt-1 flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 focus-within:border-amber-400/60">
        <input
          type="number"
          name={name}
          defaultValue={defaultValue}
          step={step}
          min={0}
          required
          className="w-full bg-transparent text-sm text-slate-100 outline-none"
        />
        <span className="text-xs text-slate-500">{suffix}</span>
      </span>
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function DecisionForm({
  gameId,
  roundIndex,
  periodName,
  defaults,
  kind,
  alreadySubmitted,
  insuranceOffer,
  enabled,
}: {
  gameId: string;
  roundIndex: number;
  periodName: string;
  defaults: RoundDecisions;
  kind: "solo" | "class";
  alreadySubmitted: boolean;
  /** Offre d'assurance du scénario (prime déjà à l'échelle de la périodicité). */
  insuranceOffer?: { premium: number; coveredLabels: string[] } | null;
  /** Décisions exposées au niveau de difficulté de la partie (doc 08 §2). */
  enabled?: { quality: boolean; maintenance: boolean; finance: boolean; insurance: boolean };
}) {
  const action = playRoundAction.bind(null, gameId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const on = enabled ?? { quality: true, maintenance: true, finance: true, insurance: true };

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="price" label="Prix de vente" defaultValue={defaults.price} step={0.1} suffix="€/u"
          hint="Attention aux seuils psychologiques…" />
        <Field name="productionPlan" label="Plan de production" defaultValue={Math.round(defaults.productionPlan)} suffix="unités"
          hint="La production réelle sera bornée par vos capacités." />
        <Field name="marketingBudget" label="Budget marketing" defaultValue={defaults.marketingBudget} suffix="€" />
        {on.quality ? (
          <Field name="qualityBudget" label="Budget qualité" defaultValue={defaults.qualityBudget} suffix="€" />
        ) : (
          <input type="hidden" name="qualityBudget" value={defaults.qualityBudget} />
        )}
        {on.maintenance ? (
          <Field name="maintenanceBudget" label="Budget maintenance" defaultValue={defaults.maintenanceBudget} suffix="€"
            hint="Une maintenance insuffisante dégrade la disponibilité machine." />
        ) : (
          <input type="hidden" name="maintenanceBudget" value={defaults.maintenanceBudget} />
        )}
        {on.finance ? (
          <>
            <Field name="newLoan" label="Nouvel emprunt" defaultValue={defaults.finance?.newLoan ?? 0} suffix="€"
              hint="À 5 %/an — utile si la trésorerie se tend." />
            <Field name="loanRepayment" label="Remboursement d'emprunt" defaultValue={defaults.finance?.loanRepayment ?? 0} suffix="€" />
          </>
        ) : null}
      </div>
      {on.insurance && insuranceOffer ? (
        <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-slate-950 px-3 py-3">
          <input
            type="checkbox"
            name="insurance"
            defaultChecked={defaults.insurance ?? false}
            className="mt-0.5 h-4 w-4 accent-amber-400"
          />
          <span>
            <span className="text-sm font-medium text-slate-200">
              🛡️ Assurance catastrophe —{" "}
              {insuranceOffer.premium.toLocaleString("fr-FR")} € ce tour
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Couvre : {insuranceOffer.coveredLabels.join(", ")}. Un coût certain contre un
              risque incertain — à vous d&apos;arbitrer.
            </span>
          </span>
        </label>
      ) : null}
      {state.error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
      >
        {pending
          ? "Envoi en cours…"
          : kind === "solo"
            ? `Valider mes décisions et simuler — ${periodName}`
            : alreadySubmitted
              ? "Mettre à jour mes décisions validées"
              : `Valider les décisions de l'équipe — ${periodName}`}
      </button>
      <p className="text-center text-xs text-slate-500">
        {kind === "solo"
          ? "Mode apprentissage : les résultats sont calculés immédiatement, à vous d'analyser."
          : "Vos décisions restent modifiables jusqu'à la clôture du tour par l'enseignant."}
      </p>
    </form>
  );
}
