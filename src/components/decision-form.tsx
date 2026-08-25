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
}: {
  gameId: string;
  roundIndex: number;
  periodName: string;
  defaults: RoundDecisions;
}) {
  const action = playRoundAction.bind(null, gameId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="price" label="Prix de vente" defaultValue={defaults.price} step={0.1} suffix="€/u"
          hint="Attention aux seuils psychologiques…" />
        <Field name="productionPlan" label="Plan de production" defaultValue={Math.round(defaults.productionPlan)} suffix="unités"
          hint="La production réelle sera bornée par vos capacités." />
        <Field name="marketingBudget" label="Budget marketing" defaultValue={defaults.marketingBudget} suffix="€" />
        <Field name="qualityBudget" label="Budget qualité" defaultValue={defaults.qualityBudget} suffix="€" />
        <Field name="maintenanceBudget" label="Budget maintenance" defaultValue={defaults.maintenanceBudget} suffix="€"
          hint="Une maintenance insuffisante dégrade la disponibilité machine." />
        <Field name="newLoan" label="Nouvel emprunt" defaultValue={defaults.finance?.newLoan ?? 0} suffix="€"
          hint="À 5 %/an — utile si la trésorerie se tend." />
        <Field name="loanRepayment" label="Remboursement d'emprunt" defaultValue={defaults.finance?.loanRepayment ?? 0} suffix="€" />
      </div>
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
        {pending ? "Simulation en cours…" : `Valider mes décisions et simuler — ${periodName}`}
      </button>
      <p className="text-center text-xs text-slate-500">
        Mode apprentissage : les résultats sont calculés immédiatement, à vous d&apos;analyser.
      </p>
    </form>
  );
}
