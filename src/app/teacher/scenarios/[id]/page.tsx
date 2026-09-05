import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getScenarioById, runEssaiABlanc } from "@/services/scenario-editor.service";
import { SECTOR_LABELS, economicDefaults, type ScenarioDefinition } from "@/config/scenarios/registry";
import { readMarketForm } from "@/config/scenarios/engine-settings";
import { situationLevel } from "@/config/pedagogy/concepts";
import { formatEuro } from "@/lib/format";
import { ConfirmForm, GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { deleteSituationAction, updateEconomicsAction, updateNarrativeAction } from "../actions";

export const dynamic = "force-dynamic";

const champ =
  "mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60";
const etiquette = "block";
const titre = "text-xs font-medium uppercase tracking-wide text-slate-400";

type EcoField = { name: string; label: string; suffix: string };
const ECO_GROUPS: { title: string; fields: EcoField[] }[] = [
  {
    title: "Fiscalité",
    fields: [
      { name: "taxRate", label: "Impôt sur les bénéfices", suffix: "%" },
      { name: "vatRate", label: "TVA (0 = désactivée)", suffix: "%" },
    ],
  },
  {
    title: "Cycle d'exploitation",
    fields: [
      { name: "customerPaymentDelayDays", label: "Délai clients à crédit", suffix: "jours" },
      { name: "supplierPaymentDelayDays", label: "Délai fournisseurs", suffix: "jours" },
    ],
  },
  {
    title: "Financement",
    fields: [
      { name: "loanAnnualRate", label: "Taux d'emprunt annuel", suffix: "%" },
      { name: "loanDurationRounds", label: "Durée d'emprunt", suffix: "tours" },
      { name: "overdraftAnnualRate", label: "Taux de découvert", suffix: "%" },
      { name: "overdraftLimit", label: "Plafond de découvert", suffix: "€" },
      { name: "discountMaxShare", label: "Escompte max.", suffix: "%" },
      { name: "factoringFeeRate", label: "Commission d'affacturage", suffix: "%" },
    ],
  },
  {
    title: "Coûts et structure",
    fields: [
      { name: "fixedCostsPerRound", label: "Charges de structure / tour", suffix: "€" },
      { name: "materialCostPerUnit", label: "Coût d'achat unitaire", suffix: "€/u" },
      { name: "otherVariableCostPerUnit", label: "Autres coûts variables", suffix: "€/u" },
      { name: "depreciationPerRound", label: "Amortissements / tour", suffix: "€" },
      { name: "baseDefectRate", label: "Taux de rebuts", suffix: "%" },
    ],
  },
];
const BPI_FIELDS: { name: string; label: string }[] = [
  { name: "bpiEconomic", label: "Éco." },
  { name: "bpiFinancial", label: "Financière" },
  { name: "bpiCommercial", label: "Commerciale" },
  { name: "bpiProfitability", label: "Rentabilité" },
  { name: "bpiPilotage", label: "Pilotage" },
  { name: "bpiDecisionMastery", label: "Maîtrise déc." },
];

const VERDICT_UI: Record<string, { label: string; cls: string }> = {
  jouable: { label: "✅ Jouable", cls: "border-emerald-400/40 bg-emerald-950/30 text-emerald-200" },
  "a-surveiller": { label: "⚠️ À surveiller", cls: "border-amber-400/40 bg-amber-950/30 text-amber-200" },
  injouable: { label: "🚫 Injouable", cls: "border-red-400/40 bg-red-950/30 text-red-200" },
};

export default async function ScenarioEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; echec?: string; essai?: string }>;
}) {
  const { id } = await params;
  const { ok, echec, essai } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const loaded = await getScenarioById(id, session.userId);
  if (!loaded) notFound();
  const def = loaded.definition;
  // economicDefaults ne lit que `.scenario` : on lui passe la config seule.
  const eco = economicDefaults({ scenario: def.scenario } as unknown as ScenarioDefinition);
  const marche = readMarketForm(def.scenario);
  const verdict = essai ? await runEssaiABlanc(id, session.userId) : null;

  return (
    <main id="main" className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Éditeur de scénario</p>
          <h1 className="text-2xl font-bold">{loaded.summary.title}</h1>
          <p className="mt-1 text-sm text-slate-400">{SECTOR_LABELS[def.sector]}</p>
        </div>
        <Link
          href="/teacher/scenarios"
          className="text-xs text-amber-300 underline-offset-4 hover:underline"
        >
          ← Mes scénarios
        </Link>
      </header>

      {ok ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
          {ok === "eco" ? "Paramètres moteur enregistrés." : "Habillage enregistré."}
        </p>
      ) : null}
      {echec ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200"
        >
          {echec}
        </p>
      ) : null}

      {/* Essai à blanc — filet de jouabilité, non bloquant. */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Essai à blanc</h2>
            <p className="mt-1 text-xs text-slate-400">
              Rejoue cinq stratégies types et vérifie qu&apos;il existe une façon de gagner, sans
              qu&apos;une erreur emporte l&apos;entreprise. N&apos;empêche pas de publier.
            </p>
          </div>
          <Link
            href={`/teacher/scenarios/${id}?essai=1`}
            className="whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-400/20"
          >
            Lancer l&apos;essai
          </Link>
        </div>
        {verdict ? (
          <div className="mt-4 space-y-3">
            <span
              className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${VERDICT_UI[verdict.verdict]!.cls}`}
            >
              {VERDICT_UI[verdict.verdict]!.label}
            </span>
            <ul className="space-y-1 text-xs text-slate-400">
              {verdict.remarques.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
            <div className="overflow-x-auto">
              <table className="w-full text-xs tabular-nums">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-1 text-left font-medium">Stratégie</th>
                    <th className="py-1 text-right font-medium">Résultat/tour</th>
                    <th className="py-1 text-right font-medium">Cumulé</th>
                    <th className="py-1 text-right font-medium">Capitaux fin</th>
                  </tr>
                </thead>
                <tbody>
                  {verdict.detail.map((d) => (
                    <tr key={d.strategie} className="border-t border-white/5">
                      <td className="py-1 text-slate-300">{d.label}</td>
                      <td className="py-1 text-right text-slate-400">{formatEuro(d.parTour)}</td>
                      <td className={`py-1 text-right ${d.cumul >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                        {formatEuro(d.cumul)}
                      </td>
                      <td className={`py-1 text-right ${d.ruineuse ? "text-red-300" : "text-slate-400"}`}>
                        {formatEuro(d.capitauxPropres)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      {/* Habillage (narratif). */}
      <GuardedForm
        action={updateNarrativeAction}
        label="enregistrement de l'habillage"
        className="space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-6"
      >
        <h2 className="text-sm font-semibold text-slate-200">Habillage — ce que l&apos;élève lit</h2>
        <input type="hidden" name="scenarioId" value={id} />
        <label className={etiquette}>
          <span className={titre}>Titre</span>
          <input name="title" defaultValue={def.title} className={champ} />
        </label>
        <label className={etiquette}>
          <span className={titre}>Accroche</span>
          <input name="tagline" defaultValue={def.tagline} className={champ} />
        </label>
        <label className={etiquette}>
          <span className={titre}>Nom de l&apos;entreprise dirigée</span>
          <input name="playerTeamName" defaultValue={def.playerTeamName} className={champ} />
        </label>
        <label className={etiquette}>
          <span className={titre}>Briefing du tour 1</span>
          <textarea name="briefing" defaultValue={def.briefing} rows={3} className={champ} />
        </label>
        <label className={etiquette}>
          <span className={titre}>Contexte d&apos;arrivée</span>
          <textarea name="context" defaultValue={def.context} rows={3} className={champ} />
        </label>
        <fieldset className="space-y-4 rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-400/80">
            Premier arbitrage
          </legend>
          <label className={etiquette}>
            <span className={titre}>Question</span>
            <input name="dilemmaQuestion" defaultValue={def.dilemma.question} className={champ} />
          </label>
          {def.dilemma.routes.map((route, i) => (
            <div key={i} className="rounded-lg border border-white/5 bg-slate-900 p-3">
              <p className="text-xs font-semibold text-slate-300">Route {i + 1}</p>
              <label className="mt-2 block">
                <span className="text-xs text-slate-400">Intitulé</span>
                <input name={`route${i}Label`} defaultValue={route.label} className={champ} />
              </label>
              <label className="mt-2 block">
                <span className="text-xs text-slate-400">Ce qu&apos;elle rapporte</span>
                <input name={`route${i}Gain`} defaultValue={route.gain} className={champ} />
              </label>
              <label className="mt-2 block">
                <span className="text-xs text-slate-400">Ce qu&apos;elle coûte</span>
                <input name={`route${i}Risque`} defaultValue={route.risque} className={champ} />
              </label>
            </div>
          ))}
        </fieldset>
        <SubmitButton>Enregistrer l&apos;habillage</SubmitButton>
      </GuardedForm>

      {/* Paramètres moteur (économie, BPI, marché). */}
      <GuardedForm
        action={updateEconomicsAction}
        label="enregistrement des paramètres moteur"
        className="space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-6"
      >
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Paramètres moteur</h2>
          <p className="mt-1 text-xs text-slate-400">
            Les valeurs affichées sont celles du scénario. Lancez un essai à blanc après un
            changement pour vérifier que le secteur reste jouable.
          </p>
        </div>
        <input type="hidden" name="scenarioId" value={id} />

        {ECO_GROUPS.map((group) => (
          <fieldset key={group.title} className="rounded-lg border border-white/10 bg-slate-950 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-400/80">
              {group.title}
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {group.fields.map((f) => (
                <label key={f.name} className="block">
                  <span className="text-xs text-slate-400">{f.label}</span>
                  <span className="mt-1 flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 focus-within:border-amber-400/60">
                    <input
                      type="text"
                      inputMode="decimal"
                      name={f.name}
                      defaultValue={eco[f.name] ?? ""}
                      className="w-full bg-transparent text-sm text-slate-100 outline-none"
                    />
                    <span className="whitespace-nowrap text-xs text-slate-400">{f.suffix}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <fieldset className="rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-400/80">
            Pondérations du BPI · poids relatifs (renormalisés)
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {BPI_FIELDS.map((f) => (
              <label key={f.name} className="block">
                <span className="text-xs text-slate-400">{f.label}</span>
                <span className="mt-1 flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 focus-within:border-amber-400/60">
                  <input
                    type="text"
                    inputMode="decimal"
                    name={f.name}
                    defaultValue={eco[f.name] ?? ""}
                    className="w-full bg-transparent text-sm text-slate-100 outline-none"
                  />
                  <span className="whitespace-nowrap text-xs text-slate-400">%</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-400/80">
            Marché
          </legend>
          <label className="block sm:max-w-xs">
            <span className="text-xs text-slate-400">
              Intensité concurrentielle (plus haut = concurrence plus dure)
            </span>
            <input
              type="text"
              inputMode="decimal"
              name="competitionIntensity"
              defaultValue={marche.competitionIntensity}
              className={champ}
            />
          </label>
          <input type="hidden" name="segCount" value={marche.segments.length} />
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-300">Segments de clientèle</p>
            {marche.segments.map((seg, i) => (
              <div key={seg.code} className="rounded-lg border border-white/5 bg-slate-900 p-3">
                <p className="text-xs font-medium text-slate-200">{seg.name}</p>
                <input type="hidden" name={`seg${i}Code`} value={seg.code} />
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs text-slate-400">Demande (unités/tour)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      name={`seg${i}Size`}
                      defaultValue={seg.size}
                      className={champ}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-400">Prix de référence (€)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      name={`seg${i}RefPrice`}
                      defaultValue={seg.refPrice}
                      className={champ}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <SubmitButton>Enregistrer les paramètres moteur</SubmitButton>
      </GuardedForm>

      {/* Situations pédagogiques — édition du texte. */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-200">Situations pédagogiques</h2>
          <Link
            href={`/teacher/scenarios/${id}/situations/new`}
            className="whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-400/20"
          >
            + Nouvelle situation
          </Link>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Éditez le texte d&apos;une situation héritée, ou composez-en une nouvelle (récit,
          diagnostic, modèle d&apos;analyse, notions, indices).
        </p>
        {def.situations.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Ce scénario ne porte aucune situation.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {def.situations.map((s) => {
              const niveau = situationLevel(s.conceptCodes);
              const decl =
                "round" in s.trigger ? `tour ${s.trigger.round}` : `détectée (${s.trigger.detect})`;
              return (
                <li
                  key={s.code}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">{s.title}</p>
                    <p className="text-xs text-slate-400">
                      Niveau {niveau} · {decl}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/teacher/scenarios/${id}/situations/${encodeURIComponent(s.code)}`}
                      className="whitespace-nowrap rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-amber-400/50"
                    >
                      Éditer le texte
                    </Link>
                    <ConfirmForm
                      action={deleteSituationAction}
                      label="suppression de la situation"
                      trigger="Supprimer"
                      confirmPrompt="Supprimer cette situation ?"
                    >
                      <input type="hidden" name="scenarioId" value={id} />
                      <input type="hidden" name="situationCode" value={s.code} />
                    </ConfirmForm>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
