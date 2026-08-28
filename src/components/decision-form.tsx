"use client";

import { useActionState } from "react";
import { playRoundAction, type PlayRoundState } from "@/app/arena/[gameId]/actions";
import type { RoundDecisions } from "@/engine/types";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import { formatEuro } from "@/lib/format";

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
          className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
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
  distributableReserves,
  investmentOffer,
  debtSchedule,
  treasuryOffer,
  orderOffer,
  studiesOffer,
  capitalAllowance,
  insuranceFormulas,
  suppliersOffer,
  capacityFacts,
  vocabulary,
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
  const [state, formAction, pending] = useActionState(action, initialState);
  const reserves = Math.max(0, distributableReserves ?? 0);
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
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="price" label={v.priceLabel} defaultValue={defaults.price} step={0.1}
          suffix={`€/${v.unit}`}
          hint="Attention aux seuils psychologiques…" />
        <Field name="productionPlan" label={v.productionPlanLabel}
          defaultValue={Math.round(defaults.productionPlan)} suffix={v.units}
          hint="Le volume réel sera borné par vos capacités." />
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
            {on.dividend ? (
              <Field
                name="dividend"
                label="Dividende versé aux associés"
                defaultValue={0}
                suffix="€"
                hint={
                  reserves > 0
                    ? `Réserves distribuables : ${formatEuro(reserves)}, les bénéfices des tours passés. Ce qui sort ne finance plus rien, et le versement se fait en trésorerie, pas en résultat : on peut être rentable sans pouvoir payer.`
                    : "Rien à distribuer : les réserves se constituent des bénéfices des tours passés, et une perte doit d'abord être rattrapée."
                }
              />
            ) : null}
          </>
        ) : null}
        {on.investment && investmentOffer ? (
          <Field
            name="machineCapacityUnits"
            label={`Investissement capacité (${investmentOffer.costPerCapacityUnit.toLocaleString("fr-FR")} €/u)`}
            defaultValue={0}
            suffix={v.perRoundLabel}
            hint={`En service au tour suivant, amorti linéairement. Max ${Math.round(investmentOffer.maxPerRound).toLocaleString("fr-FR")} u par tour.`}
          />
        ) : null}
      </div>
      {orderOffer ? (
        <fieldset className="rounded-lg border border-sky-400/25 bg-sky-950/20 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-sky-300">
            📦 Commande exceptionnelle · {orderOffer.title}
          </legend>
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
        </fieldset>
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
      {on.finance && treasuryOffer ? (
        <fieldset className="rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            💶 Trésorerie · mobiliser le poste clients
          </legend>
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
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
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
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Découvert autorisé jusqu&apos;à{" "}
            {Math.round(treasuryOffer.overdraftLimit).toLocaleString("fr-FR")} €. Au-delà, la
            banque cède vos créances d&apos;office, au tarif fort. Si vous ne gérez pas votre
            trésorerie, quelqu&apos;un la gérera pour vous.
          </p>
        </fieldset>
      ) : null}
      <fieldset className="rounded-lg border border-white/10 bg-slate-950 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          🔭 Votre prévision · facultative, sans effet sur le tour
        </legend>
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
            hint="Ce que vous pensez avoir en caisse une fois tout payé."
          />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Annoncer avant de savoir, puis mesurer l&apos;écart : c&apos;est le seul moyen de
          savoir si vous avez compris ce marché ou si vous avez eu de la chance. L&apos;écart
          vous sera montré avec les résultats du tour.
        </p>
      </fieldset>
      {studiesOffer ? (
        <fieldset className="rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            📊 Acheter de l&apos;information · livrée avec les résultats du tour
          </legend>
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
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            L&apos;information a un prix, facturé en charges de structure : il se lit au seuil
            de rentabilité. Décider sans données coûte souvent plus cher.
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
              hint="Arrivée au tour suivant, coût de recrutement immédiat." />
            <Field name="fire" label="Licenciements" defaultValue={0} suffix="pers."
              hint="Départ au tour suivant, indemnité immédiate." />
            <Field name="trainingBudget" label="Budget formation" defaultValue={0} suffix="€"
              hint="Élève la productivité dès le tour suivant." />
            <Field name="salaryPercent" label="Salaires (marché = 100)" defaultValue={Math.round((defaults.hr?.salaryIndex ?? 1) * 100)} suffix="%"
              hint="Sous-payer démotive et fait partir les salariés." />
          </div>
        </fieldset>
      ) : null}
      {on.insurance && insuranceFormulas && insuranceFormulas.length > 0 ? (
        <fieldset className="rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            🛡️ Assurance · choisissez votre couverture
          </legend>
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
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Un coût certain contre un risque incertain : plus la couverture est large, plus
            la prime pèse sur votre seuil de rentabilité.
          </p>
        </fieldset>
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
      {suppliersOffer && suppliersOffer.length > 0 ? (
        <fieldset className="rounded-lg border border-emerald-400/25 bg-emerald-950/20 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            🏭 Fournisseur de matières premières
          </legend>
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
                    {s.name} · matières à {s.materialCostPerUnit.toLocaleString("fr-FR")} €/u
                    {s.costMultiplier !== 1
                      ? ` (${s.costMultiplier < 1 ? "" : "+"}${Math.round((s.costMultiplier - 1) * 100)} %)`
                      : ""}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">{s.narrative}</span>
                  <span className="mt-1 flex flex-wrap gap-3 text-[11px]">
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
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Le choix du fournisseur impacte votre coût variable, la qualité perçue de vos
            produits, le délai de paiement fournisseur (BFR) et le risque de rupture de
            chaîne. L&apos;assurance étendue couvre le litige fournisseur.
          </p>
        </fieldset>
      ) : null}
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
            <p className="mt-2 text-[11px] text-amber-300/80">{v.laborBottleneckHint}</p>
          ) : capacityFacts.bottleneck === "machine" ? (
            <p className="mt-2 text-[11px] text-sky-300/80">{v.capacityBottleneckHint}</p>
          ) : null}
        </div>
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
