import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listScenariosByAuthor } from "@/services/scenario-editor.service";
import { SCENARIOS, SECTOR_LABELS } from "@/config/scenarios/registry";
import { GuardedForm } from "@/components/guarded-action";
import {
  deleteScenarioAction,
  duplicateScenarioAction,
  publishScenarioAction,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUT_LABEL: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};
const STATUT_CLASS: Record<string, string> = {
  draft: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  published: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  archived: "border-white/10 bg-slate-800 text-slate-400",
};

export default async function TeacherScenariosPage({
  searchParams,
}: {
  searchParams: Promise<{ echec?: string }>;
}) {
  const { echec } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const mine = await listScenariosByAuthor(session.userId);

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
                <div className="flex items-center gap-2">
                  <Link
                    href={`/teacher/scenarios/${s.id}`}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-amber-400/50"
                  >
                    Éditer
                  </Link>
                  <GuardedForm action={publishScenarioAction} label="statut du scénario">
                    <input type="hidden" name="scenarioId" value={s.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={s.status === "published" ? "draft" : "published"}
                    />
                    <button className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400/50">
                      {s.status === "published" ? "Dépublier" : "Publier"}
                    </button>
                  </GuardedForm>
                  <GuardedForm action={deleteScenarioAction} label="suppression du scénario">
                    <input type="hidden" name="scenarioId" value={s.id} />
                    <button className="rounded-lg border border-white/10 px-3 py-1 text-xs text-red-300 hover:border-red-400/50">
                      Supprimer
                    </button>
                  </GuardedForm>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Un scénario <strong className="text-slate-400">publié</strong> devient sélectionnable au
          lancement d&apos;une partie. Un brouillon reste privé à votre espace.
        </p>
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
