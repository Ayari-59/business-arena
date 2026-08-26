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
  investmentOffer,
  debtSchedule,
  treasuryOffer,
  orderOffer,
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
  enabled?: {
    quality: boolean;
    maintenance: boolean;
    finance: boolean;
    insurance: boolean;
    hr: boolean;
    investment: boolean;
  };
  /** Investissement du scénario (coût par unité de capacité, plafond). */
  investmentOffer?: { costPerCapacityUnit: number; maxPerRound: number } | null;
  /** Échéance d'emprunt obligatoire du tour (prélevée automatiquement). */
  debtSchedule?: { nextMandatory: number; outstanding: number } | null;
  /** Outils de trésorerie du scénario (escompte / affacturage). */
  treasuryOffer?: {
    discountAnnualRate: number;
    discountMaxShare: number;
    factoringFeeRate: number;
    overdraftLimit: number;
  } | null;
  /** Commande exceptionnelle proposée pour CE tour (rotation du pool). */
  orderOffer?: {
    title: string;
    narrative: string;
    units: number;
    price: number;
    paymentDelayDays: number;
    unitVariableCost: number;
  } | null;
}) {
  const action = playRoundAction.bind(null, gameId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const on = enabled ?? {
    quality: true,
    maintenance: true,
    finance: true,
    insurance: true,
    hr: false,
    investment: false,
  };

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
            <Field name="newLoan" label="Nouvel emprunt" defaultValue={0} suffix="€"
              hint="À 5 %/an, amortissement constant sur la durée contractuelle — emprunter engage." />
            <Field
              name="loanRepayment"
              label={debtSchedule ? "Remboursement anticipé" : "Remboursement d'emprunt"}
              defaultValue={0}
              suffix="€"
              hint={debtSchedule ? "Facultatif, en plus de l'échéance obligatoire." : undefined}
            />
            <Field name="capitalIncrease" label="Augmentation de capital" defaultValue={0} suffix="€"
              hint="Apport des associés : trésorerie et capitaux propres — sans intérêts, mais dilutif." />
          </>
        ) : null}
        {on.investment && investmentOffer ? (
          <Field
            name="machineCapacityUnits"
            label={`Investissement capacité (${investmentOffer.costPerCapacityUnit.toLocaleString("fr-FR")} €/u)`}
            defaultValue={0}
            suffix="u/tour"
            hint={`En service au tour suivant, amorti linéairement. Max ${Math.round(investmentOffer.maxPerRound).toLocaleString("fr-FR")} u par tour.`}
          />
        ) : null}
      </div>
      {orderOffer ? (
        <fieldset className="rounded-lg border border-sky-400/25 bg-sky-950/20 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-sky-300">
            📦 Commande exceptionnelle — {orderOffer.title}
          </legend>
          <p className="text-sm leading-relaxed text-slate-300">{orderOffer.narrative}</p>
          <p className="mt-2 text-xs text-slate-400">
            <strong className="text-slate-200">
              {Math.round(orderOffer.units).toLocaleString("fr-FR")} unités
            </strong>{" "}
            à{" "}
            <strong className="text-slate-200">
              {orderOffer.price.toLocaleString("fr-FR")} €/u
            </strong>{" "}
            (coût variable ≈ {orderOffer.unitVariableCost.toLocaleString("fr-FR")} €/u) —{" "}
            {orderOffer.paymentDelayDays > 0
              ? `règlement à ${orderOffer.paymentDelayDays} jours`
              : "règlement comptant"}
            . Servie sur votre stock restant après le marché.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {orderOffer.paymentDelayDays > 0
              ? "Belle marge… mais ce chiffre d'affaires dormira en créances : votre BFR gonflera d'autant. Qui finance l'attente ?"
              : "Du cash dès la livraison… mais une marge mince : comparez le prix à votre coût variable avant de signer."}
          </p>
          <label className="mt-3 flex items-start gap-3">
            <input
              type="checkbox"
              name="acceptOrder"
              defaultChecked={defaults.acceptOrder ?? false}
              className="mt-0.5 h-4 w-4 accent-sky-400"
            />
            <span className="text-sm font-medium text-slate-200">
              Accepter la commande — à prendre ou à laisser, elle ne repassera pas.
            </span>
          </label>
        </fieldset>
      ) : null}
      {on.finance && debtSchedule && debtSchedule.outstanding > 0.5 ? (
        <p className="rounded-lg border border-amber-400/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
          🏦 Échéance d&apos;emprunt du tour :{" "}
          <strong>{Math.round(debtSchedule.nextMandatory).toLocaleString("fr-FR")} €</strong>{" "}
          de capital, prélevée automatiquement (+ intérêts) — dette restante{" "}
          {Math.round(debtSchedule.outstanding).toLocaleString("fr-FR")} €. Les échéances
          tombent, que la caisse soit pleine ou vide.
        </p>
      ) : null}
      {on.finance && treasuryOffer ? (
        <fieldset className="rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            💶 Trésorerie — mobiliser le poste clients
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              name="discount"
              label={`Escompte (${(treasuryOffer.discountAnnualRate * 100).toLocaleString("fr-FR")} %/an)`}
              defaultValue={0}
              suffix="€"
              hint={`Avance sur créances, plafonnée à ${Math.round(treasuryOffer.discountMaxShare * 100)} % du poste clients — le moins cher.`}
            />
            <Field
              name="factoring"
              label={`Affacturage (${(treasuryOffer.factoringFeeRate * 100).toLocaleString("fr-FR")} % du montant)`}
              defaultValue={0}
              suffix="€"
              hint="Cession de créances, sans plafond — plus cher, immédiat."
            />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Découvert autorisé jusqu&apos;à{" "}
            {Math.round(treasuryOffer.overdraftLimit).toLocaleString("fr-FR")} €. Au-delà, la
            banque cède vos créances d&apos;office, au tarif fort — si vous ne gérez pas votre
            trésorerie, quelqu&apos;un la gérera pour vous.
          </p>
        </fieldset>
      ) : null}
      {on.hr ? (
        <fieldset className="rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            👥 Ressources humaines
          </legend>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field name="hire" label="Embauches" defaultValue={0} suffix="pers."
              hint="Arrivée au tour suivant — coût de recrutement immédiat." />
            <Field name="fire" label="Licenciements" defaultValue={0} suffix="pers."
              hint="Départ au tour suivant — indemnité immédiate." />
            <Field name="trainingBudget" label="Budget formation" defaultValue={0} suffix="€"
              hint="Élève la productivité dès le tour suivant." />
            <Field name="salaryPercent" label="Salaires (marché = 100)" defaultValue={Math.round((defaults.hr?.salaryIndex ?? 1) * 100)} suffix="%"
              hint="Sous-payer démotive — et fait partir les salariés." />
          </div>
        </fieldset>
      ) : null}
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
