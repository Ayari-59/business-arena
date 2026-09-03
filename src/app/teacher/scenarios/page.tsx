import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listScenariosByAuthor, listSharedScenarios } from "@/services/scenario-editor.service";
import { SCENARIOS, SECTOR_LABELS } from "@/config/scenarios/registry";
import { ConfirmForm, GuardedForm } from "@/components/guarded-action";
import {
  deleteScenarioAction,
  duplicateScenarioAction,
  forkScenarioAction,
  importScenarioAction,
  publishScenarioAction,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUT_LABEL: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Retiré",
};
const STATUT_CLASS: Record<string, string> = {
  draft: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  published: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  archived: "border-white/10 bg-slate-800 text-slate-400",
};

/** Un bouton de changement de statut (cycle de vie du scénario). */
function StatutForm({ id, to, label }: { id: string; to: string; label: string }) {
  return (
    <GuardedForm action={publishScenarioAction} label="statut du scénario">
      <input type="hidden" name="scenarioId" value={id} />
      <input type="hidden" name="status" value={to} />
      <button className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400/50">
        {label}
      </button>
    </GuardedForm>
  );
}

export default async function TeacherScenariosPage({
  searchParams,
}: {
  searchParams: Promise<{ echec?: string }>;
}) {
  const { echec } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const mine = await listScenariosByAuthor(session.userId);
  const shared = await listSharedScenarios(session.userId);

  return (
    <main id="main" className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Espace enseignant</p>
          <h1 className="text-2xl font-bold">Mes scénarios</h1>
          <p className="mt-1 text-sm text-slate-400">
            Partez d&apos;un secteur calibré, reformulez-le à votre main, réutilisez-le d&apos;une
            classe à l&apos;autre.
          </p>
        </div>
        <Link href="/teacher" className="text-xs text-amber-300 underline-offset-4 hover:underline">
          ← Mes parties
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

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Mes scénarios</h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Aucun scénario pour l&apos;instant. Dupliquez un secteur ci-dessous pour commencer.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {mine.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-100">
                    <span className="truncate">{s.title}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${STATUT_CLASS[s.status]}`}
                    >
                      {STATUT_LABEL[s.status]}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/teacher/scenarios/${s.id}`}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-amber-400/50"
                  >
                    Éditer
                  </Link>
                  <a
                    href={`/teacher/scenarios/${s.id}/export`}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-amber-400/50"
                  >
                    Exporter
                  </a>
                  <GuardedForm action={forkScenarioAction} label="copie d'un de mes scénarios">
                    <input type="hidden" name="sourceId" value={s.id} />
                    <input type="hidden" name="title" value={`${s.title} (copie)`} />
                    <button className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-amber-400/50">
                      Dupliquer
                    </button>
                  </GuardedForm>
                  {/* Cycle de vie : brouillon → publié → retiré, et retour. */}
                  {s.status === "draft" ? (
                    <StatutForm id={s.id} to="published" label="Publier" />
                  ) : s.status === "published" ? (
                    <>
                      <StatutForm id={s.id} to="draft" label="Dépublier" />
                      <StatutForm id={s.id} to="archived" label="Retirer" />
                    </>
                  ) : (
                    <StatutForm id={s.id} to="published" label="Réactiver" />
                  )}
                  <ConfirmForm
                    action={deleteScenarioAction}
                    label="suppression du scénario"
                    trigger="Supprimer"
                    confirmPrompt="Supprimer définitivement ?"
                  >
                    <input type="hidden" name="scenarioId" value={s.id} />
                  </ConfirmForm>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Un scénario <strong className="text-slate-400">publié</strong> devient sélectionnable au
          lancement d&apos;une partie, et visible des autres enseignants. Un{" "}
          <strong className="text-slate-400">brouillon</strong> reste privé. Un scénario{" "}
          <strong className="text-slate-400">retiré</strong> n&apos;est plus proposé ni partagé,
          mais les parties déjà lancées avec lui continuent — et il se réactive à tout moment.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Scénarios partagés</h2>
        <p className="mt-1 text-xs text-slate-500">
          Publiés par d&apos;autres enseignants. Dupliquez-en un pour en obtenir votre propre copie
          éditable.
        </p>
        {shared.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Rien de partagé pour l&apos;instant. Dès qu&apos;un collègue publie un scénario, il
            apparaît ici, prêt à dupliquer.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {shared.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">{s.title}</p>
                  {s.authorName ? (
                    <p className="text-xs text-slate-500">par {s.authorName}</p>
                  ) : null}
                </div>
                <GuardedForm action={forkScenarioAction} label="copie d'un scénario partagé">
                  <input type="hidden" name="sourceId" value={s.id} />
                  <input type="hidden" name="title" value={`${s.title} (copie)`} />
                  <button className="whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-400/20">
                    Dupliquer
                  </button>
                </GuardedForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Importer un scénario</h2>
        <p className="mt-1 text-xs text-slate-500">
          Depuis un fichier JSON exporté (d&apos;un autre espace, d&apos;un collègue). Il devient un
          brouillon dans votre espace.
        </p>
        <GuardedForm
          action={importScenarioAction}
          label="import d'un scénario"
          className="mt-3 flex flex-wrap items-center gap-3"
        >
          <input
            type="text"
            name="title"
            placeholder="Titre (facultatif)"
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <input
            type="file"
            name="file"
            accept="application/json,.json"
            className="text-xs text-slate-400 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:text-slate-200"
          />
          <button className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-400/20">
            Importer
          </button>
        </GuardedForm>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Partir d&apos;un secteur</h2>
        <p className="mt-1 text-xs text-slate-500">
          Chaque secteur est calibré et jouable. La copie hérite de ses règles ; vous en changez
          l&apos;habillage (le moteur reste inchangé).
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {SCENARIOS.map((d) => (
            <li
              key={d.code}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-100">{d.title}</p>
                <p className="text-xs text-slate-500">{SECTOR_LABELS[d.sector]}</p>
              </div>
              <GuardedForm action={duplicateScenarioAction} label="duplication du secteur">
                <input type="hidden" name="baseCode" value={d.code} />
                <button className="whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-400/20">
                  Dupliquer
                </button>
              </GuardedForm>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
