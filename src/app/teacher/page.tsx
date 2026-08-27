import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTeacherGames } from "@/services/game.service";
import { getOrganizerCompetitions } from "@/services/competition.service";
import { getStaffContext } from "@/services/admin.service";
import { createClassGameAction, createCompetitionAction, logoutAction } from "./actions";
import { periodLabel } from "@/config/scenarios/periodicity";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import {
  DEFAULT_SCENARIO_CODE,
  SCENARIOS,
  SECTOR_LABELS,
  economicDefaults,
} from "@/config/scenarios/registry";
import { EconomicParams } from "@/components/economic-params";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const games = await getTeacherGames(session.userId);
  const competitions = await getOrganizerCompetitions(session.userId);
  const staff = await getStaffContext(session.userId);
  const isOrgAdmin = staff?.organizations.some((o) => o.role === "org_admin") ?? false;

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Espace enseignant</p>
          <h1 className="text-2xl font-bold">Mes parties</h1>
        </div>
        <div className="flex items-center gap-4">
          {isOrgAdmin ? (
            <Link href="/org" className="text-xs text-amber-300 underline-offset-4 hover:underline">
              Mon établissement
            </Link>
          ) : null}
          {staff?.isPlatformAdmin ? (
            <Link href="/admin" className="text-xs text-amber-300 underline-offset-4 hover:underline">
              Administration
            </Link>
          ) : null}
          <form action={logoutAction}>
            <button className="text-xs text-slate-500 underline hover:text-slate-300">
              Se déconnecter
            </button>
          </form>
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Créer une partie</h2>
        <form action={createClassGameAction} className="mt-4 grid gap-4 sm:grid-cols-3">
          <EconomicParams
            scenarios={SCENARIOS.map((d) => ({
              code: d.code,
              label: `${SECTOR_LABELS[d.sector]} · ${d.title}`,
              unit: d.vocabulary.unit,
              defaults: economicDefaults(d),
            }))}
            defaultCode={DEFAULT_SCENARIO_CODE}
          />

          <button
            type="submit"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 sm:col-span-3"
          >
            Créer la partie et obtenir le code d&apos;invitation
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Le nombre total d&apos;entreprises (équipes + bots) est plafonné à 8. Les élèves
          rejoignent avec le code, répartis automatiquement dans les équipes. Le niveau règle
          les décisions ouvertes, le plafond d&apos;indices et la fréquence des événements.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          Organiser un concours — Business Arena Championship
        </h2>
        <form action={createCompetitionAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Nom du concours
            </span>
            <input
              name="name"
              required
              maxLength={80}
              placeholder="Championnat BTS MCO 2026"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Équipes par groupe
            </span>
            <select name="groupSize" defaultValue={3} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} équipes par partie</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Qualifiés par groupe
            </span>
            <select name="advancePerGroup" defaultValue={1} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>{n} par groupe → finale</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Périodicité
            </span>
            <select name="periodicity" defaultValue="quarter" className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
              <option value="month">Un mois par tour</option>
              <option value="quarter">Un trimestre par tour</option>
              <option value="year">Une année par tour</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 sm:col-span-2"
          >
            Créer le concours et ouvrir les inscriptions
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Les équipes s&apos;inscrivent avec le code sur /compete. Mode compétition :
          décisions verrouillées après validation, indices limités (§25).
        </p>
        {competitions.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {competitions.map((c) => (
              <li key={c.competitionId}>
                <Link
                  href={`/teacher/competitions/${c.competitionId}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm transition hover:border-amber-400/40"
                >
                  <span>
                    <span className="font-mono text-amber-300">{c.joinCode}</span>
                    <span className="ml-3 text-slate-300">{c.name}</span>
                  </span>
                  <span className="text-slate-400">
                    {c.entriesCount} équipes ·{" "}
                    {c.status === "registration"
                      ? "inscriptions"
                      : c.status === "running"
                        ? "en cours"
                        : "terminé"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-3">
        {games.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune partie pour l&apos;instant.</p>
        ) : (
          games.map((g) => (
            <Link
              key={g.gameId}
              href={`/teacher/games/${g.gameId}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm transition hover:border-amber-400/40"
            >
              <span>
                <span className="font-mono text-amber-300">{g.joinCode}</span>
                <span className="ml-3 text-slate-300">{g.teamsCount} équipes</span>
              </span>
              <span className="text-slate-400">
                {g.status === "finished"
                  ? "Terminée"
                  : `${periodLabel(g.roundDays, g.currentRound)} / ${g.roundsCount}`}
              </span>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
