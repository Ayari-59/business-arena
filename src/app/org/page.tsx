import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getOrgDashboard } from "@/services/admin.service";
import {
  deactivateTeacherInviteAction,
  newTeacherInviteAction,
  renameOrgAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function OrgAdminPage() {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  let dashboard;
  try {
    dashboard = await getOrgDashboard(session.userId);
  } catch {
    redirect("/teacher");
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
            Administration d&apos;établissement
          </p>
          <h1 className="text-2xl font-bold">{dashboard.name}</h1>
        </div>
        <nav className="flex gap-4 text-xs text-slate-500">
          <Link href="/teacher" className="hover:text-slate-300">Espace enseignant</Link>
          <Link href="/" className="hover:text-slate-300">Landing</Link>
        </nav>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Enseignants", dashboard.stats.teachers],
            ["Élèves joueurs", dashboard.stats.students],
            ["Parties", dashboard.stats.games],
            ["Concours", dashboard.stats.competitions],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">{value}</p>
          </div>
        ))}
      </section>

      {/* Invitations enseignants */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Inviter des enseignants</h2>
        <p className="mt-1 text-xs text-slate-500">
          Partagez un code : l&apos;enseignant s&apos;inscrit sur /teacher/login avec ce code et
          rejoint automatiquement votre établissement.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {dashboard.teacherInvites.map((invite) => (
            <span
              key={invite.id}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono ${
                invite.active
                  ? "border-amber-400/40 text-amber-300"
                  : "border-white/10 text-slate-600 line-through"
              }`}
            >
              {invite.code}
              {invite.active ? (
                <form action={deactivateTeacherInviteAction.bind(null, invite.id)}>
                  <button className="text-slate-500 hover:text-red-400" title="Désactiver">✕</button>
                </form>
              ) : null}
            </span>
          ))}
          <form action={newTeacherInviteAction}>
            <button className="rounded-full border border-white/15 px-4 py-1.5 text-slate-300 hover:border-amber-400/40">
              + générer un code enseignant
            </button>
          </form>
        </div>
      </section>

      {/* Équipe pédagogique */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Équipe pédagogique ({dashboard.teachers.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3 font-medium">Nom</th>
                <th className="pb-2 pr-3 font-medium">E-mail</th>
                <th className="pb-2 pr-3 font-medium">Rôle</th>
                <th className="pb-2 text-right font-medium">Parties créées</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {dashboard.teachers.map((t) => (
                <tr key={t.userId} className="border-t border-white/5">
                  <td className="py-2 pr-3">{t.name}</td>
                  <td className="py-2 pr-3 text-slate-400">{t.email}</td>
                  <td className="py-2 pr-3">
                    {t.role === "org_admin" ? (
                      <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[11px] text-amber-300">
                        admin
                      </span>
                    ) : (
                      "enseignant"
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">{t.games}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Activité */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Dernières parties</h2>
          {dashboard.games.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune partie pour l&apos;instant.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dashboard.games.slice(0, 10).map((g) => (
                <li key={g.gameId} className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-slate-300">
                  <span>
                    {g.joinCode ? (
                      <span className="mr-2 font-mono text-amber-300">{g.joinCode}</span>
                    ) : null}
                    par {g.createdBy}
                  </span>
                  <span className="text-xs text-slate-500">
                    {g.status === "finished" ? "terminée" : g.status === "running" ? "en cours" : g.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Concours</h2>
          {dashboard.competitions.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun concours pour l&apos;instant.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dashboard.competitions.map((c) => (
                <li key={c.competitionId} className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-slate-300">
                  <span>{c.name}</span>
                  <span className="text-xs text-slate-500">
                    {c.status === "registration" ? "inscriptions" : c.status === "running" ? "en cours" : "terminé"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-200">Établissement</h2>
          <form action={renameOrgAction} className="flex gap-2">
            <input
              name="name"
              defaultValue={dashboard.name}
              maxLength={80}
              className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
            />
            <button className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:border-amber-400/40">
              Renommer
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
