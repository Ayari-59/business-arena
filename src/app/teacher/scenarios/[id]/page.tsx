import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getScenarioById } from "@/services/scenario-editor.service";
import { SECTOR_LABELS } from "@/config/scenarios/registry";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { updateNarrativeAction } from "../actions";

export const dynamic = "force-dynamic";

const champ =
  "mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60";
const etiquette = "block";
const titre = "text-xs font-medium uppercase tracking-wide text-slate-400";

export default async function ScenarioEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; echec?: string }>;
}) {
  const { id } = await params;
  const { ok, echec } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const loaded = await getScenarioById(id, session.userId);
  if (!loaded) notFound();
  const def = loaded.definition;

  return (
    <main id="main" className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Éditeur de scénario</p>
          <h1 className="text-2xl font-bold">{loaded.summary.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {SECTOR_LABELS[def.sector]} · règles moteur héritées de la base (inchangées à cette
            étape). Vous en réglez l&apos;habillage : ce que l&apos;élève lit.
          </p>
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
          Habillage enregistré.
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

      <GuardedForm
        action={updateNarrativeAction}
        label="enregistrement de l'habillage"
        className="space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-6"
      >
        <input type="hidden" name="scenarioId" value={id} />

        <label className={etiquette}>
          <span className={titre}>Titre</span>
          <input name="title" defaultValue={def.title} className={champ} />
        </label>

        <label className={etiquette}>
          <span className={titre}>Accroche</span>
          <input name="tagline" defaultValue={def.tagline} className={champ} />
          <span className="mt-1 block text-xs text-slate-500">
            Une phrase : ce que l&apos;élève dirige.
          </span>
        </label>

        <label className={etiquette}>
          <span className={titre}>Nom de l&apos;entreprise dirigée</span>
          <input name="playerTeamName" defaultValue={def.playerTeamName} className={champ} />
        </label>

        <label className={etiquette}>
          <span className={titre}>Briefing du tour 1</span>
          <textarea name="briefing" defaultValue={def.briefing} rows={3} className={champ} />
          <span className="mt-1 block text-xs text-slate-500">
            Deux ou trois phrases : ce que l&apos;entreprise fait, la contrainte qui décide de tout,
            ce qui se joue au premier tour. Sans jargon ni chiffre.
          </span>
        </label>

        <label className={etiquette}>
          <span className={titre}>Contexte d&apos;arrivée</span>
          <textarea name="context" defaultValue={def.context} rows={3} className={champ} />
          <span className="mt-1 block text-xs text-slate-500">
            D&apos;où vient l&apos;entreprise, dans quel état, face à quoi. Sans chiffre : les
            montants viennent du scénario joué.
          </span>
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
                <span className="text-xs text-slate-500">Intitulé</span>
                <input name={`route${i}Label`} defaultValue={route.label} className={champ} />
              </label>
              <label className="mt-2 block">
                <span className="text-xs text-slate-500">Ce qu&apos;elle rapporte</span>
                <input name={`route${i}Gain`} defaultValue={route.gain} className={champ} />
              </label>
              <label className="mt-2 block">
                <span className="text-xs text-slate-500">Ce qu&apos;elle coûte</span>
                <input name={`route${i}Risque`} defaultValue={route.risque} className={champ} />
              </label>
            </div>
          ))}
        </fieldset>

        <SubmitButton>Enregistrer l&apos;habillage</SubmitButton>
      </GuardedForm>

      <p className="text-xs text-slate-500">
        Les paramètres économiques et la structure de marché s&apos;éditeront dans une prochaine
        étape. Pour l&apos;instant, la copie garde les réglages calibrés de son secteur d&apos;origine.
      </p>
    </main>
  );
}
