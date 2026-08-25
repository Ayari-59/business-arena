import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTeacherGameView } from "@/services/game.service";
import { getTeacherPedagogyView } from "@/services/pedagogy.service";
import { formatEuro } from "@/lib/format";
import { periodLabel } from "@/config/scenarios/periodicity";
import { closeRoundAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function TeacherGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { gameId } = await params;
  const view = await getTeacherGameView(gameId, session.userId);
  if (!view) notFound();
  const pedagogy = await getTeacherPedagogyView(gameId, session.userId);

  const finished = view.status === "finished";
  const humanTeams = view.teams.filter((t) => t.controller === "human");
  const allSubmitted = humanTeams.every((t) => t.hasSubmitted);
  const closeAction = closeRoundAction.bind(null, view.gameId);

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Pilotage de partie</p>
          <h1 className="text-2xl font-bold">
            Code d&apos;invitation : <span className="font-mono text-amber-300">{view.joinCode}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Les élèves rejoignent sur <span className="font-mono">/join</span> avec ce code.
          </p>
        </div>
        <p className="rounded-full border border-white/10 px-4 py-1 text-sm text-slate-300">
          {finished
            ? "Partie terminée"
            : `${periodLabel(view.roundDays, view.currentRound)} / ${view.roundsCount}`}
        </p>
      </header>

      <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Équipes — état des décisions du tour {view.currentRound}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3 font-medium">Équipe</th>
                <th className="pb-2 pr-3 font-medium">Joueurs</th>
                <th className="pb-2 pr-3 font-medium">Décisions</th>
                <th className="pb-2 pr-3 text-right font-medium">Dernier résultat</th>
                <th className="pb-2 text-right font-medium">Trésorerie</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {view.teams.map((t) => (
                <tr key={t.teamId} className="border-t border-white/5">
                  <td className="py-2 pr-3">
                    {t.name}
                    {t.controller === "bot" ? (
                      <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                        bot
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 text-slate-400">
                    {t.controller === "bot" ? "—" : t.playerNames.join(", ") || "aucun joueur"}
                  </td>
                  <td className="py-2 pr-3">
                    {finished ? (
                      "—"
                    ) : t.hasSubmitted ? (
                      <span className="text-emerald-400">validées</span>
                    ) : (
                      <span className="text-amber-300">en attente</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {t.lastNetIncome === null ? "—" : formatEuro(t.lastNetIncome)}
                  </td>
                  <td
                    className={`py-2 text-right tabular-nums ${
                      (t.lastNetTreasury ?? 0) < 0 ? "text-red-400" : ""
                    }`}
                  >
                    {t.lastNetTreasury === null ? "—" : formatEuro(t.lastNetTreasury)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!finished ? (
          <form action={closeAction} className="mt-4">
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            >
              Clore le tour {view.currentRound} et simuler
              {allSubmitted ? "" : " (les équipes sans décisions reconduisent le tour précédent)"}
            </button>
          </form>
        ) : null}
      </section>

      {pedagogy ? (
        <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Vue pédagogique</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Maîtrise des concepts (du plus fragile au plus solide)
              </h3>
              {pedagogy.conceptMastery.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  Disponible dès qu&apos;un tour avec situations aura été débriefé.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {pedagogy.conceptMastery.slice(0, 8).map((c) => (
                    <li key={c.code} className="text-sm">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>{c.name}</span>
                        <span className="tabular-nums text-slate-400">{Math.round(c.average)}</span>
                      </div>
                      <div className="mt-0.5 h-1.5 rounded-full bg-slate-950">
                        <div
                          className={`h-1.5 rounded-full ${c.average < 40 ? "bg-red-400" : c.average < 70 ? "bg-amber-400" : "bg-emerald-400"}`}
                          style={{ width: `${Math.max(3, Math.min(100, c.average))}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Indices consommés
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {pedagogy.hintsUsedByTeam.map((t) => (
                  <li key={t.teamName} className="flex justify-between">
                    <span>{t.teamName}</span>
                    <span className="tabular-nums text-slate-400">{t.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Choix de modèles d&apos;analyse
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {pedagogy.modelChoiceStats.map((s) => (
                  <li key={s.relevance} className="flex justify-between text-slate-300">
                    <span>
                      {s.relevance === "optimal"
                        ? "Pertinents"
                        : s.relevance === "acceptable"
                          ? "Acceptables"
                          : s.relevance === "misleading"
                            ? "Trompeurs (contresens)"
                            : "Hors sujet"}
                    </span>
                    <span className="tabular-nums text-slate-400">{s.count}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                Un choix « trompeur » fréquent signale un concept mal compris — à reprendre en classe.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Classement</h2>
        {view.ranking.length === 0 ? (
          <p className="text-sm text-slate-500">Disponible après le premier tour.</p>
        ) : (
          <ol className="space-y-2">
            {view.ranking.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-300"
              >
                <span>
                  <span className="mr-2 text-slate-500">#{row.rank}</span>
                  {row.name}
                </span>
                <span className="tabular-nums">{formatEuro(row.cumulativeNetIncome)} cumulés</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
