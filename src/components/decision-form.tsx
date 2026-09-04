"use client";

import { useRef, useState, type ReactNode } from "react";
import { playRoundAction, type PlayRoundState } from "@/app/arena/[gameId]/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import {
  pivotFieldsFor,
  pivotsNonTouches,
  type PivotField,
  type PivotFieldInfo,
} from "@/config/decision-source";
import type { RoundDecisions } from "@/engine/types";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import { formatEuro } from "@/lib/format";

const initialState: PlayRoundState = { error: null };

function EquipmentPanel({
  offer,
  vocabulary,
  buyQty,
  setBuyQty,
  sellQty,
  setSellQty,
}: {
  offer: NonNullable<Parameters<typeof DecisionForm>[0]["equipmentOffer"]>;
  vocabulary: ScenarioVocabulary;
  buyQty: Record<string, number>;
  setBuyQty: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  sellQty: Record<string, number>;
  setSellQty: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const totalCapacity = offer.fleet.reduce((sum, f) => {
    const typ = offer.types.find((t) => t.code === f.typeCode);
    return sum + (typ ? f.count * typ.capacityPerUnit : 0);
  }, 0);
  const totalPending = offer.pendingFleet.reduce((sum, f) => {
    const typ = offer.types.find((t) => t.code === f.typeCode);
    return sum + (typ ? f.count * typ.capacityPerUnit : 0);
  }, 0);
  const buyImpact = offer.types.reduce((sum, t) => sum + (buyQty[t.code] ?? 0) * t.capacityPerUnit, 0);
  const sellImpact = offer.types.reduce((sum, t) => sum + (sellQty[t.code] ?? 0) * t.capacityPerUnit, 0);
  const totalCost = offer.types.reduce((sum, t) => sum + (buyQty[t.code] ?? 0) * t.costPerUnit, 0);
  const totalSale = offer.types.reduce((sum, t) => {
    const f = offer.fleet.find((fl) => fl.typeCode === t.code);
    if (!f || !f.count) return sum;
    const avgBook = f.bookValue / f.count;
    return sum + (sellQty[t.code] ?? 0) * avgBook * t.resaleRatio;
  }, 0);

  return (
    <Family
      legend="🏭 Parc machines · investir ou céder"
      tone="border-indigo-400/25 bg-indigo-950/20"
      legendClass="text-xs font-semibold uppercase tracking-wide text-indigo-300"
    >
      <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-slate-400">Capacité en service</span>
        <span className="text-right text-slate-200">
          {Math.round(totalCapacity).toLocaleString("fr-FR")} {vocabulary.perRoundLabel}
        </span>
        {totalPending > 0 ? (
          <>
            <span className="text-slate-400">En cours d&apos;installation</span>
            <span className="text-right text-emerald-300">
              +{Math.round(totalPending).toLocaleString("fr-FR")} {vocabulary.perRoundLabel}
            </span>
          </>
        ) : null}
      </div>
      <div className="space-y-3">
        {offer.types.map((t) => {
          const fl = offer.fleet.find((f) => f.typeCode === t.code);
          const pend = offer.pendingFleet.find((f) => f.typeCode === t.code);
          const owned = fl?.count ?? 0;
          const pendCount = pend?.count ?? 0;
          const buy = buyQty[t.code] ?? 0;
          const sell = sellQty[t.code] ?? 0;
          const avgBook = owned > 0 ? (fl?.bookValue ?? 0) / owned : 0;
          return (
            <div key={t.code} className="rounded-lg border border-white/5 bg-slate-900 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-slate-200">{t.name}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {Math.round(t.capacityPerUnit).toLocaleString("fr-FR")} {vocabulary.perRoundLabel}/u
                  </span>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-slate-400">
                  {owned} en service{pendCount > 0 ? ` + ${pendCount} en attente` : ""}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>{t.costPerUnit.toLocaleString("fr-FR")} €/u</span>
                <span>Amorti en {Math.round(t.depreciationRounds)} tours</span>
                <span>Maintenance ×{t.maintenanceMultiplier.toLocaleString("fr-FR")}</span>
                {owned > 0 ? (
                  <span>VNC moy. {Math.round(avgBook).toLocaleString("fr-FR")} €</span>
                ) : null}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">
                    Acheter
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 rounded border border-white/10 bg-slate-950 px-2 py-1 focus-within:border-emerald-400/60">
                    <input
                      type="number"
                      min={0}
                      max={t.maxPerRound}
                      value={buy}
                      onChange={(e) =>
                        setBuyQty((prev) => ({
                          ...prev,
                          [t.code]: Math.min(t.maxPerRound, Math.max(0, parseInt(e.target.value) || 0)),
                        }))
                      }
                      className="w-full bg-transparent text-sm tabular-nums text-slate-100 outline-none"
                    />
                    <span className="text-xs text-slate-500">max {t.maxPerRound}</span>
                  </span>
                  {buy > 0 ? (
                    <span className="mt-0.5 block text-xs text-emerald-300/80">
                      = {(buy * t.costPerUnit).toLocaleString("fr-FR")} €
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-red-400">
                    Vendre
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 rounded border border-white/10 bg-slate-950 px-2 py-1 focus-within:border-red-400/60">
                    <input
                      type="number"
                      min={0}
                      max={owned}
                      value={sell}
                      onChange={(e) =>
                        setSellQty((prev) => ({
                          ...prev,
                          [t.code]: Math.min(owned, Math.max(0, parseInt(e.target.value) || 0)),
                        }))
                      }
                      className="w-full bg-transparent text-sm tabular-nums text-slate-100 outline-none"
                    />
                    <span className="text-xs text-slate-500">max {owned}</span>
                  </span>
                  {sell > 0 ? (
                    <span className="mt-0.5 block text-xs text-red-300/80">
                      = {Math.round(sell * avgBook * t.resaleRatio).toLocaleString("fr-FR")} € (VNC {Math.round(sell * avgBook).toLocaleString("fr-FR")} €)
                    </span>
                  ) : null}
                </label>
              </div>
            </div>
          );
        })}
      </div>
      {(buyImpact > 0 || sellImpact > 0) ? (
        <div className="mt-3 rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {buyImpact > 0 ? (
              <>
                <span className="text-emerald-400">Capacité ajoutée (t+1)</span>
                <span className="text-right tabular-nums text-emerald-300">
                  +{Math.round(buyImpact).toLocaleString("fr-FR")} {vocabulary.perRoundLabel}
                </span>
                <span className="text-slate-400">Investissement</span>
                <span className="text-right tabular-nums text-slate-200">
                  {totalCost.toLocaleString("fr-FR")} €
                </span>
              </>
            ) : null}
            {sellImpact > 0 ? (
              <>
                <span className="text-red-400">Capacité retirée</span>
                <span className="text-right tabular-nums text-red-300">
                  −{Math.round(sellImpact).toLocaleString("fr-FR")} {vocabulary.perRoundLabel}
                </span>
                <span className="text-slate-400">Produit de cession</span>
                <span className="text-right tabular-nums text-slate-200">
                  {Math.round(totalSale).toLocaleString("fr-FR")} €
                </span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Les machines achetées entrent en service au tour suivant. La revente se fait à la
        valeur de marché (VNC × ratio de revente) : vendre en dessous de la VNC génère une
        perte de cession, un coût bien réel que le résultat encaisse.
      </p>
    </Family>
  );
}

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
      {hint ? <span className="mt-1 block text-[13px] text-slate-500">{hint}</span> : null}
    </label>
  );
}

/** Champ FACULTATIF : vide veut dire « pas de prévision », jamais zéro. */
function OptionalField({
  name,
  label,
  placeholder,
  suffix,
  hint,
}: {
  name: string;
  label: string;
  placeholder: string;
  suffix: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="mt-1 flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 focus-within:border-amber-400/60">
        <input
          type="text"
          inputMode="decimal"
          name={name}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
        <span className="text-xs text-slate-500">{suffix}</span>
      </span>
      {hint ? <span className="mt-1 block text-[13px] text-slate-500">{hint}</span> : null}
    </label>
  );
}

/**
 * Une famille de décisions, repliable. L'accordéon des périodes situe le tour ;
 * ces accordéons rangent les leviers d'UN tour par famille — cœur ouvert,
 * avancé replié — pour garder le formulaire scannable sans rien cacher au
 * moteur (un `details` fermé reste dans le DOM et se soumet).
 */
function Family({
  legend,
  children,
  defaultOpen = false,
  tone = "border-white/10 bg-slate-950",
  legendClass = "text-xs font-semibold uppercase tracking-wide text-slate-400",
}: {
  legend: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: string;
  legendClass?: string;
}) {
  return (
    <details open={defaultOpen} className={`group rounded-lg border ${tone}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className={legendClass}>{legend}</span>
        <span className="text-xs text-slate-500 transition-transform group-open:rotate-90">▸</span>
      </summary>
      <div className="border-t border-white/10 p-4">{children}</div>
    </details>
  );
}

export function DecisionForm({
  gameId,
  roundIndex,
  periodName,
  defaults,
  proposed,
  kind,
  alreadySubmitted,
  insuranceOffer,
  enabled,
  distributableReserves,
  investmentOffer,
  debtSchedule,
  treasuryOffer,
  bankFile,
  orderOffer,
  studiesOffer,
  capitalAllowance,
  insuranceFormulas,
  suppliersOffer,
  equipmentOffer,
  capacityFacts,
  vocabulary,
}: {
  gameId: string;
  roundIndex: number;
  periodName: string;
  defaults: RoundDecisions;
  /**
   * Les valeurs PROPOSÉES pour ce tour (tour précédent, sinon point de départ
   * du secteur) : la référence pour dire si un pivot a été touché. Distinct de
   * `defaults`, qui reprend aussi ce que l'équipe a déjà validé ce tour.
   */
  proposed?: RoundDecisions;
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
    placement: boolean;
    dividend: boolean;
  };
  /** Bénéfices des tours passés non distribués : le plafond du dividende. */
  distributableReserves?: number;
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
    placementAnnualRate: number | null;
    maturedPlacement: number;
  } | null;
  /**
   * Dossier bancaire : ce que la banque consent pour ce tour, et ce qu'elle a
   * retenu du dernier plan. `null` = le scénario n'en ouvre pas.
   */
  bankFile?: {
    trust: number;
    overdraftLimit: number;
    fullOverdraftLimit: number;
    overdraftAnnualRate: number;
    refusedLoan: number | null;
    lastReliability: number | null;
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
  /** Catalogue d'études du scénario : l'information a un prix. */
  studiesOffer?: {
    marketCost: number;
    priceCost: number;
    financeCost: number;
    projectCost: number;
  } | null;
  /** Enveloppe d'augmentation de capital restante (null = illimitée). */
  capitalAllowance?: { total: number; remaining: number } | null;
  /** Formules d'assurance (si le scénario en propose plusieurs — remplace le toggle simple). */
  insuranceFormulas?: {
    code: string;
    name: string;
    premium: number;
    coveredLabels: string[];
  }[] | null;
  /** Fournisseurs disponibles (si le scénario en propose). */
  suppliersOffer?: {
    code: string;
    name: string;
    narrative: string;
    costMultiplier: number;
    qualityBonus: number;
    paymentDelayDays: number;
    supplyRiskProbability: number;
    materialCostPerUnit: number;
  }[] | null;
  /** Équipements typés : catalogue de machines et parc actuel. */
  equipmentOffer?: {
    types: {
      code: string;
      name: string;
      capacityPerUnit: number;
      costPerUnit: number;
      depreciationRounds: number;
      maintenanceMultiplier: number;
      maxPerRound: number;
      resaleRatio: number;
    }[];
    fleet: { typeCode: string; count: number; bookValue: number }[];
    pendingFleet: { typeCode: string; count: number }[];
  } | null;
  /** Vocabulaire du secteur joué (registre des scénarios). */
  vocabulary: ScenarioVocabulary;
  /** Capacité de production : goulots et levier RH. */
  capacityFacts?: {
    machineCapacity: number;
    laborCapacity: number;
    bottleneck: "machine" | "labor" | "balanced";
    headcount: number;
    productivity: number;
  } | null;
}) {
  const action = playRoundAction.bind(null, gameId);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    action,
    initialState,
    { label: "décisions du tour", timeoutMs: 45_000 },
  );
  const reserves = Math.max(0, distributableReserves ?? 0);

  // Les pivots (prix, volume) validés sans avoir été touchés : on le dit avant
  // d'envoyer, une fois. « Oui » confirme et envoie ; « Non » ramène au champ.
  const reference = proposed ?? defaults;
  const [nonTouches, setNonTouches] = useState<PivotFieldInfo[] | null>(null);
  const confirme = useRef(false);
  const verifierPivots = (e: React.FormEvent<HTMLFormElement>) => {
    if (confirme.current) return;
    const form = e.currentTarget;
    const lire = (name: PivotField) =>
      Number((form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? NaN);
    const intacts = pivotsNonTouches(
      { price: lire("price"), productionPlan: lire("productionPlan") },
      { price: reference.price, productionPlan: reference.productionPlan },
    );
    if (intacts.length === 0) return;
    e.preventDefault();
    setNonTouches(pivotFieldsFor(v).filter((p) => intacts.includes(p.key)));
  };
  const garderLesValeurs = (e: React.MouseEvent<HTMLButtonElement>) => {
    confirme.current = true;
    setNonTouches(null);
    e.currentTarget.form?.requestSubmit();
  };
  const lesModifier = (e: React.MouseEvent<HTMLButtonElement>) => {
    const premier = nonTouches?.[0]?.key;
    setNonTouches(null);
    if (premier) (e.currentTarget.form?.elements.namedItem(premier) as HTMLInputElement | null)?.focus();
  };
  const [equipBuyQty, setEquipBuyQty] = useState<Record<string, number>>({});
  const [equipSellQty, setEquipSellQty] = useState<Record<string, number>>({});
  // Déplier / replier toutes les familles d'un coup. On mute directement les
  // <details> (non contrôlés) plutôt que d'en tenir l'état en React.
  const setAllFamilies = (open: boolean) =>
    formRef.current
      ?.querySelectorAll("details")
      .forEach((d) => ((d as HTMLDetailsElement).open = open));

  // Un champ requis dans une famille repliée est invisible : le navigateur ne
  // peut pas y afficher sa bulle de validation et abandonne l'envoi en silence
  // (« An invalid form control is not focusable »). On rouvre la famille du
  // champ fautif, en phase de capture, avant que le navigateur ne tente d'y
  // poser le focus — la validation redevient visible.
  const revelerFamilleInvalide = (e: React.FormEvent<HTMLFormElement>) => {
    const famille = (e.target as HTMLElement).closest?.("details") as
      | HTMLDetailsElement
      | null;
    if (famille && !famille.open) famille.open = true;
  };
  const on = enabled ?? {
    quality: true,
    maintenance: true,
    finance: true,
    insurance: true,
    hr: false,
    investment: false,
    placement: false,
    dividend: false,
  };

  // Vocabulaire du secteur : c'est lui qui parle à l'élève, pas le moteur.
  const v = vocabulary;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={verifierPivots}
      onInvalidCapture={revelerFamilleInvalide}
      className="space-y-4"
    >
      <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
        <button
          type="button"
          onClick={() => setAllFamilies(true)}
          className="rounded-md border border-white/10 px-2.5 py-1 hover:text-slate-200"
        >
          Tout déplier
        </button>
        <button
          type="button"
          onClick={() => setAllFamilies(false)}
          className="rounded-md border border-white/10 px-2.5 py-1 hover:text-slate-200"
        >
          Tout replier
        </button>
      </div>
      {orderOffer ? (
        <Family
          legend={`📦 Commande exceptionnelle · ${orderOffer.title}`}
          tone="border-sky-400/25 bg-sky-950/20"
          legendClass="text-xs font-semibold uppercase tracking-wide text-sky-300"
        >
          <p className="text-sm leading-relaxed text-slate-300">{orderOffer.narrative}</p>
          <p className="mt-2 text-xs text-slate-400">
            <strong className="text-slate-200">
              {Math.round(orderOffer.units).toLocaleString("fr-FR")} {v.units}
            </strong>{" "}
            à{" "}
            <strong className="text-slate-200">
              {orderOffer.price.toLocaleString("fr-FR")} €/u
            </strong>{" "}
            (coût variable ≈ {orderOffer.unitVariableCost.toLocaleString("fr-FR")} €/u),{" "}
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
              Accepter la commande, à prendre ou à laisser : elle ne repassera pas.
            </span>
          </label>
        </Family>
      ) : null}
      <Family legend="🎯 Vos ventes · le prix et le volume du tour" defaultOpen>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field name="price" label={v.priceLabel} defaultValue={defaults.price} step={0.1}
            suffix={`€/${v.unit}`}
            hint="Attention aux seuils psychologiques…" />
          <Field name="productionPlan" label={v.productionPlanLabel}
            defaultValue={Math.round(defaults.productionPlan)} suffix={v.units}
            hint="Le volume réel sera borné par vos capacités." />
        </div>
      </Family>
      {capacityFacts ? (
        <div className="rounded-lg border border-white/10 bg-slate-950 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            ⚙️ {v.capacityPanelTitle}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-slate-400">{v.capacityLabel}</span>
            <span className="text-right text-slate-200">
              {Math.round(capacityFacts.machineCapacity).toLocaleString("fr-FR")} {v.perRoundLabel}
            </span>
            <span className="text-slate-400">{v.laborLabel}</span>
            <span className="text-right text-slate-200">
              {Math.round(capacityFacts.laborCapacity).toLocaleString("fr-FR")} {v.perRoundLabel}
              <span className="ml-1 text-xs text-slate-500">
                ({capacityFacts.headcount} pers. × prod. {Math.round(capacityFacts.productivity * 100)} %)
              </span>
            </span>
            <span className="text-slate-400">Goulot</span>
            <span className={`text-right font-medium ${
              capacityFacts.bottleneck === "labor"
                ? "text-amber-400"
                : capacityFacts.bottleneck === "machine"
                  ? "text-sky-400"
                  : "text-emerald-400"
            }`}>
              {capacityFacts.bottleneck === "labor"
                ? v.laborLabel
                : capacityFacts.bottleneck === "machine"
                  ? v.capacityBottleneckLabel
                  : "Équilibré"}
            </span>
          </div>
          {capacityFacts.bottleneck === "labor" ? (
            <p className="mt-2 text-xs text-amber-300/80">{v.laborBottleneckHint}</p>
          ) : capacityFacts.bottleneck === "machine" ? (
            <p className="mt-2 text-xs text-sky-300/80">{v.capacityBottleneckHint}</p>
          ) : null}
        </div>
      ) : null}
      {suppliersOffer && suppliersOffer.length > 0 ? (
        <Family
          legend={`🏭 ${v.supplierPanelLabel}`}
          tone="border-emerald-400/25 bg-emerald-950/20"
          legendClass="text-xs font-semibold uppercase tracking-wide text-emerald-300"
        >
          <div className="space-y-2">
            {suppliersOffer.map((s) => (
              <label
                key={s.code}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-900 px-3 py-2.5"
              >
                <input
                  type="radio"
                  name="supplierChoice"
                  value={s.code}
                  defaultChecked={(defaults.supplierChoice ?? suppliersOffer[0]?.code) === s.code}
                  className="mt-0.5 h-4 w-4 accent-emerald-400"
                />
                <span>
                  <span className="text-sm font-medium text-slate-200">
                    {s.name} · {v.materialLabel.toLowerCase()} à{" "}
                    {s.materialCostPerUnit.toLocaleString("fr-FR")} €/u
                    {s.costMultiplier !== 1
                      ? ` (${s.costMultiplier < 1 ? "" : "+"}${Math.round((s.costMultiplier - 1) * 100)} %)`
                      : ""}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">{s.narrative}</span>
                  <span className="mt-1 flex flex-wrap gap-3 text-xs">
                    {s.qualityBonus !== 0 ? (
                      <span className={s.qualityBonus > 0 ? "text-emerald-400" : "text-amber-400"}>
                        Qualité {s.qualityBonus > 0 ? "+" : ""}{Math.round(s.qualityBonus * 100)} %
                      </span>
                    ) : null}
                    <span className="text-slate-500">
                      Délai fournisseur : {s.paymentDelayDays} j
                    </span>
                    {s.supplyRiskProbability > 0 ? (
                      <span className="text-red-400">
                        Risque de rupture : {Math.round(s.supplyRiskProbability * 100)} %/tour
                      </span>
                    ) : (
                      <span className="text-emerald-400/60">Approvisionnement fiable</span>
                    )}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Le choix du fournisseur impacte votre coût variable, la qualité perçue de vos
            produits, le délai de paiement fournisseur (BFR) et le risque de rupture de
            chaîne. L&apos;assurance étendue couvre le litige fournisseur.
          </p>
        </Family>
      ) : null}
      <Family legend="📣 Vos budgets du tour" defaultOpen>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>
      </Family>
      {on.hr ? (
        <Family legend="👥 Ressources humaines">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field name="hire" label="Embauches" defaultValue={0} suffix="pers."
              hint="Arrivée au tour suivant, coût de recrutement immédiat." />
            <Field name="fire" label="Licenciements" defaultValue={0} suffix="pers."
              hint="Départ au tour suivant, indemnité immédiate." />
            <Field name="trainingBudget" label="Budget formation" defaultValue={0} suffix="€"
              hint="Élève la productivité dès le tour suivant." />
            <Field name="salaryPercent" label="Salaires (marché = 100)" defaultValue={Math.round((defaults.hr?.salaryIndex ?? 1) * 100)} suffix="%"
              hint="Sous-payer démotive et fait partir les salariés." />
          </div>
        </Family>
      ) : null}
      {on.finance && debtSchedule && debtSchedule.outstanding > 0.5 ? (
        <p className="rounded-lg border border-amber-400/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
          🏦 Échéance d&apos;emprunt du tour :{" "}
          <strong>{Math.round(debtSchedule.nextMandatory).toLocaleString("fr-FR")} €</strong>{" "}
          de capital, prélevée automatiquement (+ intérêts). Dette restante{" "}
          {Math.round(debtSchedule.outstanding).toLocaleString("fr-FR")} €. Les échéances
          tombent, que la caisse soit pleine ou vide.
        </p>
      ) : null}
      {on.finance ? (
      <Family legend="💶 Financer · emprunt, capital, investissement">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <>
              <Field name="newLoan" label="Nouvel emprunt" defaultValue={0} suffix="€"
                hint="À 5 %/an, amortissement constant sur la durée contractuelle : emprunter engage." />
              <Field
                name="loanRepayment"
                label={debtSchedule ? "Remboursement anticipé" : "Remboursement d'emprunt"}
                defaultValue={0}
                suffix="€"
                hint={debtSchedule ? "Facultatif, en plus de l'échéance obligatoire." : undefined}
              />
              <Field name="capitalIncrease" label="Augmentation de capital" defaultValue={0} suffix="€"
                hint={
                  capitalAllowance
                    ? `Apport des associés · enveloppe restante : ${Math.round(capitalAllowance.remaining).toLocaleString("fr-FR")} € sur ${Math.round(capitalAllowance.total).toLocaleString("fr-FR")} € pour toute la partie. Les associés ne suivent pas indéfiniment.`
                    : "Apport des associés : trésorerie et capitaux propres, sans intérêts mais dilutif."
                } />
            {on.investment && investmentOffer && !equipmentOffer ? (
              <Field
                name="machineCapacityUnits"
                label={`Investissement capacité (${investmentOffer.costPerCapacityUnit.toLocaleString("fr-FR")} €/u)`}
                defaultValue={0}
                suffix={v.perRoundLabel}
                hint={`En service au tour suivant, amorti linéairement. Max ${Math.round(investmentOffer.maxPerRound).toLocaleString("fr-FR")} u par tour.`}
              />
            ) : null}
              {on.dividend ? (
                <Field
                  name="dividend"
                  label="Affectation du résultat · dividende versé aux associés"
                  defaultValue={0}
                  suffix="€"
                  hint={
                    reserves > 0
                      ? `Réserves distribuables : ${formatEuro(reserves)}, les bénéfices des tours passés. Ce qui sort ne finance plus rien, et le versement se fait en trésorerie, pas en résultat : on peut être rentable sans pouvoir payer.`
                      : roundIndex <= 1
                        ? "Rien à distribuer au premier tour : l'affectation du résultat s'ouvre à partir du tour 2, une fois le premier résultat connu, et seulement sur des bénéfices."
                        : "Rien à distribuer : les réserves se constituent des bénéfices des tours passés, et une perte doit d'abord être rattrapée."
                  }
                />
              ) : null}
            </>
        </div>
      </Family>
      ) : null}
      {on.investment && equipmentOffer ? (
        <>
          <EquipmentPanel
            offer={equipmentOffer}
            vocabulary={v}
            buyQty={equipBuyQty}
            setBuyQty={setEquipBuyQty}
            sellQty={equipSellQty}
            setSellQty={setEquipSellQty}
          />
          <input type="hidden" name="equipmentBuyJson" value={JSON.stringify(
            equipmentOffer.types
              .filter((t) => (equipBuyQty[t.code] ?? 0) > 0)
              .map((t) => ({ typeCode: t.code, quantity: equipBuyQty[t.code] ?? 0 }))
          )} />
          <input type="hidden" name="equipmentSellJson" value={JSON.stringify(
            equipmentOffer.types
              .filter((t) => (equipSellQty[t.code] ?? 0) > 0)
              .map((t) => ({ typeCode: t.code, quantity: equipSellQty[t.code] ?? 0 }))
          )} />
        </>
      ) : null}
      {on.finance && treasuryOffer ? (
        <Family legend="💶 Trésorerie · mobiliser le poste clients">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              name="discount"
              label={`Escompte (${(treasuryOffer.discountAnnualRate * 100).toLocaleString("fr-FR")} %/an)`}
              defaultValue={0}
              suffix="€"
              hint={`Avance sur créances, plafonnée à ${Math.round(treasuryOffer.discountMaxShare * 100)} % du poste clients, le moins cher.`}
            />
            <Field
              name="factoring"
              label={`Affacturage (${(treasuryOffer.factoringFeeRate * 100).toLocaleString("fr-FR")} % du montant)`}
              defaultValue={0}
              suffix="€"
              hint="Cession de créances, sans plafond : plus cher, immédiat."
            />
          </div>
          {on.placement && treasuryOffer.placementAnnualRate !== null ? (
            <div className="mt-4 border-t border-white/5 pt-4">
              <Field
                name="placement"
                label={`Placer le surplus (${(treasuryOffer.placementAnnualRate * 100).toLocaleString("fr-FR")} %/an)`}
                defaultValue={0}
                suffix="€"
                hint="Bloqué jusqu'au tour suivant : cet argent ne paiera rien ce tour-ci."
              />
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {treasuryOffer.maturedPlacement > 0.5
                  ? `${Math.round(treasuryOffer.maturedPlacement).toLocaleString("fr-FR")} € placés au tour précédent sont revenus en caisse, intérêts compris. `
                  : ""}
                L&apos;argent qui dort ne rapporte rien, mais l&apos;argent placé ne paie pas les
                factures. Placez trop et vous financerez un découvert à{" "}
                {(treasuryOffer.discountAnnualRate * 100).toLocaleString("fr-FR")} % avec un
                placement à{" "}
                {(treasuryOffer.placementAnnualRate * 100).toLocaleString("fr-FR")} %.
              </p>
            </div>
          ) : null}
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Découvert autorisé jusqu&apos;à{" "}
            {Math.round(treasuryOffer.overdraftLimit).toLocaleString("fr-FR")} €. Au-delà, la
            banque cède vos créances d&apos;office, au tarif fort. Si vous ne gérez pas votre
            trésorerie, quelqu&apos;un la gérera pour vous.
          </p>
        </Family>
      ) : null}
      {on.insurance && insuranceFormulas && insuranceFormulas.length > 0 ? (
        <Family legend="🛡️ Assurance · choisissez votre couverture">
          <div className="space-y-2">
            <label className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-900 px-3 py-2.5">
              <input
                type="radio"
                name="insurance"
                value=""
                defaultChecked={!defaults.insurance}
                className="mt-0.5 h-4 w-4 accent-amber-400"
              />
              <span className="text-sm text-slate-400">Pas d&apos;assurance : pas de prime, tous les risques à votre charge.</span>
            </label>
            {insuranceFormulas.map((f) => (
              <label
                key={f.code}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-900 px-3 py-2.5"
              >
                <input
                  type="radio"
                  name="insurance"
                  value={f.code}
                  defaultChecked={defaults.insurance === f.code || (defaults.insurance === true && f.code === insuranceFormulas[0]?.code)}
                  className="mt-0.5 h-4 w-4 accent-amber-400"
                />
                <span>
                  <span className="text-sm font-medium text-slate-200">
                    {f.name} · {formatEuro(f.premium)}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Couvre : {f.coveredLabels.join(", ")}.
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Un coût certain contre un risque incertain : plus la couverture est large, plus
            la prime pèse sur votre seuil de rentabilité.
          </p>
        </Family>
      ) : on.insurance && insuranceOffer ? (
        <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-slate-950 px-3 py-3">
          <input
            type="checkbox"
            name="insurance"
            defaultChecked={defaults.insurance === true}
            className="mt-0.5 h-4 w-4 accent-amber-400"
          />
          <span>
            <span className="text-sm font-medium text-slate-200">
              🛡️ Assurance catastrophe · {formatEuro(insuranceOffer.premium)} ce tour
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Couvre : {insuranceOffer.coveredLabels.join(", ")}. Un coût certain contre un
              risque incertain, à vous d&apos;arbitrer.
            </span>
          </span>
        </label>
      ) : null}
      {studiesOffer ? (
        <Family legend={"📊 Acheter de l'information · livrée avec les résultats du tour"}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                {
                  name: "studyMarket",
                  label: "Étude de marché",
                  cost: studiesOffer.marketCost,
                  hint: "Demande par segment, parts de marché, prix moyens et résultats des concurrents.",
                },
                {
                  name: "studyPrice",
                  label: "Analyse de prix",
                  cost: studiesOffer.priceCost,
                  hint: "Élasticités estimées par segment, seuils psychologiques, prix de référence.",
                },
                {
                  name: "studyFinance",
                  label: "Étude financière",
                  cost: studiesOffer.financeCost,
                  hint: "Ratios complets, structure des coûts, seuil, comparaison sectorielle.",
                },
                {
                  name: "studyProject",
                  label: "Analyse de projet",
                  cost: studiesOffer.projectCost,
                  hint: "VAN, TRI et délai de récupération de l'investissement ; arbitrage de la commande du tour.",
                },
              ] as const
            ).map((study) => (
              <label
                key={study.name}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-900 px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  name={study.name}
                  defaultChecked={false}
                  className="mt-0.5 h-4 w-4 accent-amber-400"
                />
                <span>
                  <span className="text-sm font-medium text-slate-200">
                    {study.label} · {formatEuro(study.cost)}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">{study.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            L&apos;information a un prix, facturé en charges de structure : il se lit au seuil
            de rentabilité. Décider sans données coûte souvent plus cher.
          </p>
        </Family>
      ) : null}
      {/*
        Gardé sur `on.finance` SEUL, jamais sur `bankFile`. Une partie ouverte
        avant le dossier bancaire n'a pas de bloc `bank` dans son snapshot,
        donc pas de `bankFile` : la conditionner dessus faisait disparaître les
        deux champs en cours de partie, à des élèves qui les remplissaient
        depuis le premier tour. Le texte change, les champs restent.
      */}
      {on.finance ? (
        <Family
          legend={
            bankFile
              ? "🏦 Votre plan de trésorerie · la pièce que lit la banque"
              : "🔭 Votre prévision · facultative, sans effet sur le tour"
          }
        >
          {bankFile && bankFile.refusedLoan !== null ? (
            <p className="mb-3 rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs leading-relaxed text-rose-200">
              Au tour précédent, votre demande de{" "}
              {formatEuro(bankFile.refusedLoan)} n&apos;a pas été instruite : aucun plan de
              trésorerie ne l&apos;accompagnait. La banque ne prête pas contre une intention.
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <OptionalField
              name="expectedUnits"
              label={`${v.units.charAt(0).toUpperCase()}${v.units.slice(1)} que vous pensez vendre`}
              placeholder="ex. 4 200"
              suffix={v.units}
              hint="Appuyez-vous sur l'historique de vos ventes, plus bas dans la page."
            />
            <OptionalField
              name="expectedCash"
              label="Trésorerie nette en fin de tour"
              placeholder="ex. 18 000"
              suffix="€"
              hint={
                bankFile
                  ? "Ce que vous pensez avoir en caisse une fois tout payé. Sans cette ligne, pas d'emprunt."
                  : "Ce que vous pensez avoir en caisse une fois tout payé."
              }
            />
          </div>
          {bankFile ? (
            <>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Confiance de votre banque :{" "}
              <strong className="text-slate-200">{Math.round(bankFile.trust * 100)} %</strong>. Elle
              vous consent ce tour un découvert de{" "}
              <strong className="text-slate-200">{formatEuro(bankFile.overdraftLimit)}</strong>
              {bankFile.overdraftLimit < bankFile.fullOverdraftLimit - 0.5
                ? ` au lieu de ${formatEuro(bankFile.fullOverdraftLimit)}`
                : ""}
              , à{" "}
              <strong className="text-slate-200">
                {(bankFile.overdraftAnnualRate * 100).toLocaleString("fr-FR", {
                  maximumFractionDigits: 1,
                })}{" "}
                %
              </strong>{" "}
              l&apos;an.
              {bankFile.lastReliability !== null
                ? ` Votre dernier plan s'est révélé juste à ${Math.round(bankFile.lastReliability * 100)} %.`
                : ""}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Ce plan n&apos;est pas un exercice : sans la ligne de trésorerie, la banque
              n&apos;instruit aucune demande d&apos;emprunt. Et l&apos;écart entre ce que vous
              annoncez et ce qui sera constaté fixera, au tour suivant, le plafond de votre
              découvert et son taux. Annoncer large pour se couvrir se paie autant que se tromper.
            </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Annoncer avant de savoir, puis mesurer l&apos;écart : c&apos;est le seul moyen de
              savoir si vous avez compris ce marché ou si vous avez eu de la chance. L&apos;écart
              vous sera montré avec les résultats du tour. Cette partie a été ouverte avant le
              dossier bancaire : votre prévision n&apos;y change aucun calcul.
            </p>
          )}
        </Family>
      ) : null}
      <Family
        legend="✍️ En quelques mots (facultatif)"
        tone="border-slate-700/60"
        legendClass="text-xs font-medium text-slate-400"
      >
        <textarea
          name="justification"
          rows={2}
          placeholder="Pourquoi ces choix ce tour-ci ?"
          className="w-full resize-y rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">
          Notez ici la logique de vos décisions. L&apos;enseignant pourra la lire au débriefing.
        </p>
      </Family>
      {state.error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />
      {nonTouches ? (
        <div
          role="alert"
          className="rounded-lg border border-orange-400/40 bg-orange-950/30 px-4 py-3 text-sm text-orange-100"
        >
          <p>
            Vous validez avec les valeurs proposées pour :{" "}
            <strong>{nonTouches.map((p) => p.label).join(", ")}</strong>. C&apos;est un choix ?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={garderLesValeurs}
              className="rounded-lg bg-orange-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-orange-300"
            >
              Oui, je garde ces valeurs
            </button>
            <button
              type="button"
              onClick={lesModifier}
              className="rounded-lg border border-orange-400/50 px-3 py-1.5 text-xs font-semibold text-orange-200 hover:bg-orange-400/10"
            >
              Non, je les modifie
            </button>
          </div>
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
      >
        {pending
          ? "Envoi en cours…"
          : kind === "solo"
            ? `Valider mes décisions et simuler · ${periodName}`
            : alreadySubmitted
              ? "Mettre à jour mes décisions validées"
              : `Valider les décisions de l'équipe · ${periodName}`}
      </button>
      <p className="text-center text-xs text-slate-500">
        {kind === "solo"
          ? "Mode apprentissage : les résultats sont calculés immédiatement, à vous d'analyser."
          : "Vos décisions restent modifiables jusqu'à la clôture du tour par l'enseignant."}
      </p>
    </form>
  );
}
