import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getScenarioById } from "@/services/scenario-editor.service";
import { MODEL_QUESTION_ID } from "@/config/scenarios/situation-kit";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { updateSituationAction } from "../../../actions";

export const dynamic = "force-dynamic";

const champ =
  "mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60";
const titre = "text-xs font-medium uppercase tracking-wide text-slate-400";

export default async function SituationEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; code: string }>;
  searchParams: Promise<{ ok?: string; echec?: string }>;
}) {
  const { id, code } = await params;
  const decoded = decodeURIComponent(code);
  const { ok, echec } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const loaded = await getScenarioById(id, session.userId);
  if (!loaded) notFound();
  const situation = loaded.definition.situations.find((s) => s.code === decoded);
  if (!situation) notFound();

  const modelQuestion = situation.quiz.find((q) => q.id === MODEL_QUESTION_ID);
  const round = "round" in situation.trigger ? situation.trigger.round : null;

  return (
    <main id="main" className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Situation pédagogique</p>
          <h1 className="text-2xl font-bold">{situation.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Édition du texte. La structure d&apos;analyse (modèles, notions, niveaux d&apos;indices)
            reste celle du secteur d&apos;origine.
          </p>
        </div>
        <Link
          href={`/teacher/scenarios/${id}`}
          className="text-xs text-amber-300 underline-offset-4 hover:underline"
        >
          ← Le scénario
        </Link>
      </header>

      {ok ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
          Situation enregistrée.
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
        action={updateSituationAction}
        label="enregistrement de la situation"
        className="space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-6"
      >
        <input type="hidden" name="scenarioId" value={id} />
        <input type="hidden" name="situationCode" value={situation.code} />
        <input type="hidden" name="diagCount" value={situation.diagnosticOptions.length} />

        <label className="block">
          <span className={titre}>Titre</span>
          <input name="title" defaultValue={situation.title} className={champ} />
        </label>
        <label className="block">
          <span className={titre}>Récit</span>
          <textarea name="narrative" defaultValue={situation.narrative} rows={4} className={champ} />
        </label>
        <label className="block">
          <span className={titre}>Problème (question ouverte)</span>
          <textarea name="problem" defaultValue={situation.problem} rows={2} className={champ} />
        </label>

        <fieldset className="space-y-3 rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-400/80">
            Options de diagnostic
          </legend>
          {situation.diagnosticOptions.map((o, i) => (
            <label key={o.id} className="block">
              <span className="text-xs text-slate-500">
                Option {i + 1}
                {o.correct ? (
                  <span className="ml-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-emerald-300">
                    bonne réponse
                  </span>
                ) : null}
              </span>
              <input name={`diag${i}`} defaultValue={o.label} className={champ} />
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-3 rounded-lg border border-white/10 bg-slate-950 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-400/80">
            Indices (coût croissant)
          </legend>
          {situation.hints.map((h, i) => (
            <label key={h.level} className="block">
              <span className="text-xs text-slate-500">
                Indice {h.level} · −{h.costRatio.toString().replace(".", ",")} du score
              </span>
              <input name={`hint${i}`} defaultValue={h.text} className={champ} />
            </label>
          ))}
        </fieldset>

        <label className="block">
          <span className={titre}>Correction du choix de modèle</span>
          <textarea
            name="modelExplain"
            defaultValue={modelQuestion?.explain ?? ""}
            rows={3}
            className={champ}
          />
          <span className="mt-1 block text-xs text-slate-500">
            Affichée après la question « quel modèle d&apos;analyse mobilisez-vous ? ».
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          {round !== null ? (
            <label className="block">
              <span className={titre}>Tour de déclenchement</span>
              <input
                type="text"
                inputMode="numeric"
                name="triggerRound"
                defaultValue={round}
                className={champ}
              />
            </label>
          ) : null}
          <label className="block">
            <span className={titre}>Poids dans le score</span>
            <input
              type="text"
              inputMode="decimal"
              name="weight"
              defaultValue={situation.weight}
              className={champ}
            />
          </label>
        </div>

        <SubmitButton>Enregistrer la situation</SubmitButton>
      </GuardedForm>
    </main>
  );
}
