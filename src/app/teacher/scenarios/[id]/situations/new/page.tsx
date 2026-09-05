import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getScenarioById } from "@/services/scenario-editor.service";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { SITUATION_CATEGORIES, DETECT_CODES } from "@/config/scenarios/situation-build";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { addSituationAction } from "../../../actions";

export const dynamic = "force-dynamic";

const champ =
  "mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60";
const titre = "text-xs font-medium uppercase tracking-wide text-slate-400";

const CAT_LABEL: Record<string, string> = {
  prise_de_poste: "Prise de poste",
  contexte_marche: "Contexte de marché",
  decision_strategique: "Décision stratégique",
  alerte_comptable: "Alerte comptable",
  tresorerie_dormante: "Trésorerie dormante",
};
const DETECT_LABEL: Record<string, string> = {
  profitable_illiquid: "Rentable mais à court de trésorerie",
  stockout: "Rupture de stock",
  below_breakeven: "Sous le seuil de rentabilité",
  capacity_saturated: "Capacité saturée",
  idle_cash: "Trésorerie dormante",
};
const REL_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "— (non concerné)" },
  { value: "optimal", label: "Optimal" },
  { value: "acceptable", label: "Acceptable" },
  { value: "misleading", label: "Piège plausible" },
  { value: "irrelevant", label: "Hors sujet" },
];

export default async function NewSituationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ echec?: string }>;
}) {
  const { id } = await params;
  const { echec } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const loaded = await getScenarioById(id, session.userId);
  if (!loaded) notFound();

  // Notions groupées par domaine, pour une liste de cases lisible.
  const parDomaine = new Map<string, typeof CONCEPTS>();
  for (const n of CONCEPTS) {
    parDomaine.set(n.domain, [...(parDomaine.get(n.domain) ?? []), n]);
  }

  return (
    <main id="main" className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Nouvelle situation</p>
          <h1 className="text-2xl font-bold">{loaded.summary.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Composez une situation : le récit, le diagnostic, le modèle d&apos;analyse attendu, les
            notions, les indices. Un modèle au moins doit être « optimal ».
          </p>
        </div>
        <Link
          href={`/teacher/scenarios/${id}`}
          className="text-xs text-amber-300 underline-offset-4 hover:underline"
        >
          ← Le scénario
        </Link>
      </header>

      {echec ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200"
        >
          {echec}
        </p>
      ) : null}

      <GuardedForm
        action={addSituationAction}
        label="création de la situation"
        className="space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-6"
      >
        <input type="hidden" name="scenarioId" value={id} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={titre}>Catégorie</span>
            <select name="category" className={champ} defaultValue="decision_strategique">
              {SITUATION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CAT_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={titre}>Poids dans le score</span>
            <input type="text" inputMode="decimal" name="weight" defaultValue="1" className={champ} />
          </label>
        </div>

        <label className="block">
          <span className={titre}>Titre</span>
          <input name="title" className={champ} />
        </label>
        <label className="block">
          <span className={titre}>Récit</span>
          <textarea name="narrative" rows={4} className={champ} />
        </label>
        <label className="block">
          <span className={titre}>Problème (question ouverte)</span>
          <textarea name="problem" rows={2} className={champ} />
        </label>

        <fieldset className="space-y-3 rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-400/80">
            Diagnostic · cochez la bonne réponse
          </legend>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" value={i} defaultChecked={i === 0} className="shrink-0" />
              <input
                name={`diag${i}`}
                placeholder={`Option ${i + 1}${i > 1 ? " (facultative)" : ""}`}
                className={champ}
              />
            </div>
          ))}
        </fieldset>

        <fieldset className="rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-400/80">
            Modèles d&apos;analyse · au moins un « optimal »
          </legend>
          <div className="mt-1 space-y-2">
            {DECISION_MODELS.map((m) => (
              <label key={m.code} className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300">{m.name}</span>
                <select name={`model_${m.code}`} defaultValue="" className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-100">
                  {REL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className={titre}>Correction du choix de modèle</span>
          <textarea name="modelExplain" rows={3} className={champ} />
        </label>

        <fieldset className="rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-400/80">
            Notions travaillées · au moins une
          </legend>
          <div className="mt-1 max-h-64 space-y-3 overflow-y-auto pr-1">
            {[...parDomaine.entries()].map(([domaine, notions]) => (
              <div key={domaine}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{domaine}</p>
                <div className="mt-1 grid gap-1 sm:grid-cols-2">
                  {notions.map((n) => (
                    <label key={n.code} className="flex items-center gap-2 text-sm text-slate-300">
                      <input type="checkbox" name="notion" value={n.code} className="shrink-0" />
                      {n.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-400/80">
            Indices (coût croissant)
          </legend>
          {[0, 1, 2, 3, 4].map((i) => (
            <label key={i} className="block">
              <span className="text-xs text-slate-400">Indice {i + 1}</span>
              <input name={`hint${i}`} className={champ} />
            </label>
          ))}
        </fieldset>

        <fieldset className="rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-400/80">
            Déclenchement
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs text-slate-400">Type</span>
              <select name="triggerType" defaultValue="round" className={champ}>
                <option value="round">À un tour</option>
                <option value="detect">Sur détection</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Tour (si « à un tour »)</span>
              <input type="text" inputMode="numeric" name="triggerRound" defaultValue="1" className={champ} />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Détection (si « sur détection »)</span>
              <select name="triggerDetect" defaultValue={DETECT_CODES[0]} className={champ}>
                {DETECT_CODES.map((d) => (
                  <option key={d} value={d}>
                    {DETECT_LABEL[d]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <SubmitButton>Créer la situation</SubmitButton>
      </GuardedForm>
    </main>
  );
}
