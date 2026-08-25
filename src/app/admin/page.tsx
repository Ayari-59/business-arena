import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPlatformOverview, getStaffContext } from "@/services/admin.service";
import {
  createEstablishmentAction,
  deactivateAdminInviteAction,
  newAdminInviteAction,
  updatePlatformConfigAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const overview = await getPlatformOverview(session.userId);

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Administration générale</p>
          <h1 className="text-2xl font-bold">Plateforme Business Arena</h1>
        </div>
        <nav className="flex gap-4 text-xs text-slate-500">
          <Link href="/teacher" className="hover:text-slate-300">Espace enseignant</Link>
          <Link href="/" className="hover:text-slate-300">Landing</Link>
        </nav>
      </header>

      {/* Statistiques */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Établissements", overview.stats.organizations],
            ["Utilisateurs", overview.stats.users],
            ["Parties", overview.stats.games],
            ["Concours", overview.stats.competitions],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">{value}</p>
          </div>
        ))}
      </section>

      {/* Réglages du jeu */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Réglages globaux du jeu</h2>
        <form action={updatePlatformConfigAction} className="mt-4 space-y-4">
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              name="allowPublicPlay"
              defaultChecked={overview.config.allowPublicPlay}
              className="h-4 w-4 accent-amber-400"
            />
            Autoriser les parties solo publiques depuis la landing
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              name="allowSelfServiceTeachers"
              defaultChecked={overview.config.allowSelfServiceTeachers}
              className="h-4 w-4 accent-amber-400"
            />
            Autoriser l&apos;inscription enseignant sans code d&apos;invitation (auto-service)
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Annonce sur la landing (vide = aucune)
            </span>
            <input
              name="announcement"
              defaultValue={overview.config.announcement}
              maxLength={200}
              placeholder="Ex : maintenance dimanche 8h-9h, finale du championnat le 12 juin…"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
          >
            Enregistrer les réglages
          </button>
        </form>
      </section>

      {/* Nouvel établissement */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Déployer un nouvel établissement</h2>
        <p className="mt-1 text-xs text-slate-500">
          Crée l&apos;établissement et génère un code d&apos;invitation administrateur : la
          personne qui s&apos;inscrit avec ce code devient admin de l&apos;établissement et
          peut à son tour inviter ses enseignants.
        </p>
        <form action={createEstablishmentAction} className="mt-4 flex flex-wrap gap-3">
          <input
            name="name"
            required
            maxLength={80}
            placeholder="Lycée Jean-Monnet, IUT GEA Lille…"
            className="min-w-64 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
          >
            Créer + code admin
          </button>
        </form>
      </section>

      {/* Établissements */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-200">
          Établissements ({overview.organizations.length})
        </h2>
        <div className="space-y-3">
          {overview.organizations.map((org) => (
            <div key={org.organizationId} className="rounded-xl bg-slate-950 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">
                  {org.name}
                  <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                    {org.kind === "public" ? "grand public" : org.kind === "school" ? "établissement" : org.kind}
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  {org.teachers} enseignant{org.teachers > 1 ? "s" : ""} · {org.members} membres ·{" "}
                  {org.games} parties
                </p>
              </div>
              {org.kind !== "public" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500">Codes admin :</span>
                  {org.adminInvites.length === 0 ? (
                    <span className="text-slate-600">aucun</span>
                  ) : (
                    org.adminInvites.map((invite) => (
                      <span
                        key={invite.id}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono ${
                          invite.active
                            ? "border-amber-400/40 text-amber-300"
                            : "border-white/10 text-slate-600 line-through"
                        }`}
                      >
                        {invite.code}
                        {invite.active ? (
                          <form
                            action={deactivateAdminInviteAction.bind(null, invite.id, org.organizationId)}
                          >
                            <button className="text-slate-500 hover:text-red-400" title="Désactiver">
                              ✕
                            </button>
                          </form>
                        ) : null}
                      </span>
                    ))
                  )}
                  <form action={newAdminInviteAction.bind(null, org.organizationId)}>
                    <button className="rounded-full border border-white/15 px-3 py-1 text-slate-300 hover:border-amber-400/40">
                      + nouveau code
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
