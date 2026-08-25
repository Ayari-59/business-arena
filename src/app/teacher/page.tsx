import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTeacherGames } from "@/services/game.service";
import { createClassGameAction, logoutAction } from "./actions";
import { periodLabel } from "@/config/scenarios/periodicity";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const games = await getTeacherGames(session.userId);

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Espace enseignant</p>
          <h1 className="text-2xl font-bold">Mes parties</h1>
        </div>
        <form action={logoutAction}>
          <button className="text-xs text-slate-500 underline hover:text-slate-300">
            Se déconnecter
          </button>
        </form>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Créer une partie NOVA</h2>
        <form action={createClassGameAction} className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Équipes (élèves)
            </span>
            <select
              name="humanTeamsCount"
              defaultValue={4}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n} équipe{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Concurrents bots
            </span>
            <select
              name="botCount"
              defaultValue={1}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n} bot{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Périodicité
            </span>
            <select
              name="periodicity"
              defaultValue="quarter"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="month">Un mois par tour</option>
              <option value="quarter">Un trimestre par tour</option>
              <option value="year">Une année par tour</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 sm:col-span-3"
          >
            Créer la partie et obtenir le code d&apos;invitation
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Le nombre total d&apos;entreprises (équipes + bots) est plafonné à 8. Les élèves
          rejoignent avec le code, répartis automatiquement dans les équipes.
        </p>
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
