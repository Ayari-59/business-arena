"use client";

import { useState } from "react";

/**
 * Choix du secteur ET paramètres économiques, réunis dans un seul composant
 * client. Les deux sont liés : les valeurs indicatives affichées en filigrane
 * sont celles du scénario SÉLECTIONNÉ. Les afficher en dur reviendrait à
 * proposer les chiffres de l'atelier à un enseignant qui monte une partie
 * d'hôtellerie.
 *
 * Un champ laissé vide conserve la valeur du scénario : c'est la raison pour
 * laquelle les valeurs par défaut sont des `placeholder` et jamais des
 * `defaultValue`, qui les enverraient au serveur comme des choix explicites.
 */

export interface ScenarioOption {
  code: string;
  label: string;
  /** Le mot du secteur pour une unité vendue (« nuitée », « couvert »). */
  unit: string;
  /** Valeurs du scénario, déjà mises en forme pour l'affichage. */
  defaults: Record<string, string | null>;
}

type Field = {
  name: string;
  label: string;
  /** "unit" prend le mot du secteur (€/nuitée, €/couvert…). */
  suffix: string | "unit";
};

const GROUPS: { title: string; note?: string; fields: Field[] }[] = [
  {
    title: "Fiscalité",
    note: "Activer la TVA rend créances et dettes TTC et crée une dette « TVA à décaisser » payée le tour suivant. Son poids se lit dans le BFR.",
    fields: [
      { name: "taxRate", label: "Impôt sur les bénéfices", suffix: "%" },
      { name: "vatRate", label: "TVA (0 = désactivée)", suffix: "%" },
    ],
  },
  {
    title: "Cycle d'exploitation",
    note: "Le cœur du besoin en fonds de roulement. Le délai client ne s'applique qu'aux segments qui font déjà crédit : un client qui paie comptant continue de payer comptant. Les délais propres à chaque fournisseur et aux commandes exceptionnelles ne bougent pas, car c'est l'arbitrage qu'ils enseignent.",
    fields: [
      { name: "customerPaymentDelayDays", label: "Délai clients à crédit", suffix: "jours" },
      { name: "supplierPaymentDelayDays", label: "Délai fournisseurs", suffix: "jours" },
    ],
  },
  {
    title: "Financement",
    note: "Resserrer le plafond de découvert force la mobilisation du poste clients : c'est le levier le plus direct pour faire vivre une crise de trésorerie. Escompte et affacturage ne sont réglables que dans les scénarios qui les proposent.",
    fields: [
      { name: "loanAnnualRate", label: "Taux d'emprunt annuel", suffix: "%" },
      { name: "loanDurationRounds", label: "Durée d'emprunt", suffix: "tours" },
      { name: "overdraftAnnualRate", label: "Taux de découvert", suffix: "%" },
      { name: "overdraftLimit", label: "Plafond de découvert", suffix: "€" },
      { name: "discountMaxShare", label: "Escompte max. du poste clients", suffix: "%" },
      { name: "factoringFeeRate", label: "Commission d'affacturage", suffix: "%" },
    ],
  },
  {
    title: "Coûts et structure",
    fields: [
      { name: "fixedCostsPerRound", label: "Charges de structure / tour", suffix: "€" },
      { name: "materialCostPerUnit", label: "Coût matières unitaire", suffix: "unit" },
      { name: "otherVariableCostPerUnit", label: "Autres coûts variables", suffix: "unit" },
      { name: "depreciationPerRound", label: "Amortissements / tour", suffix: "€" },
      { name: "baseDefectRate", label: "Taux de rebuts (non-qualité)", suffix: "%" },
    ],
  },
];

export function EconomicParams({
  scenarios,
  defaultCode,
}: {
  scenarios: ScenarioOption[];
  defaultCode: string;
}) {
  const [code, setCode] = useState(defaultCode);
  const selected = scenarios.find((s) => s.code === code) ?? scenarios[0]!;

  return (
    <>
      <label className="block sm:col-span-3">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Secteur d&apos;activité
        </span>
        <select
          name="scenarioCode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
        >
          {scenarios.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-500">
          Chaque secteur enseigne ce que les autres ne peuvent pas : le stock et le coefficient
          multiplicateur dans le commerce, le taux d&apos;occupation en hôtellerie, le ratio
          matières en restauration, le poste clients dans les services.
        </span>
      </label>

      <details className="rounded-lg border border-white/10 bg-slate-950 p-4 sm:col-span-3">
        <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-slate-400">
          ⚙️ Paramètres économiques (avancé) · laissez vide pour les valeurs du scénario
        </summary>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Les valeurs en filigrane sont celles de{" "}
          <strong className="text-slate-400">{selected.label}</strong>. Montants en base
          trimestrielle, redimensionnés selon la périodicité choisie. Une valeur hors bornes est
          ignorée sans faire échouer la création.
        </p>

        {GROUPS.map((group) => (
          <section key={group.title} className="mt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/80">
              {group.title}
            </h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {group.fields.map((field) => {
                const fallback = selected.defaults[field.name];
                // Un tiret signale un levier que ce scénario n'ouvre pas :
                // le champ reste saisissable mais restera sans effet.
                const unavailable = fallback === null;
                return (
                  <label key={field.name} className="block">
                    <span className="text-[11px] text-slate-500">{field.label}</span>
                    <span className="mt-1 flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 focus-within:border-amber-400/60">
                      <input
                        type="text"
                        inputMode="decimal"
                        name={field.name}
                        placeholder={unavailable ? "non proposé" : (fallback ?? "")}
                        disabled={unavailable}
                        className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed"
                      />
                      <span className="whitespace-nowrap text-[11px] text-slate-500">
                        {field.suffix === "unit" ? `€/${selected.unit}` : field.suffix}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {group.note ? (
              <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{group.note}</p>
            ) : null}
          </section>
        ))}
      </details>
    </>
  );
}
