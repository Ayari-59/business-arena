import Link from "next/link";
import type { CompetitionView } from "@/services/competition.service";

const STAGE_LABELS: Record<string, string> = {
  qualification: "Qualifications",
  groups: "Phase de groupes",
  knockout: "Élimination directe",
  semifinal: "Demi-finales",
  final: "Finale",
};

const STATUS_LABELS: Record<string, string> = {
  registration: "Inscriptions ouvertes",
  running: "En cours",
  finished: "Terminé",
};

/** Tableau de concours partagé (organisateur et participants). */
export function CompetitionBoard({
  view,
  gameLinkBase,
}: {
  view: CompetitionView;
  /** "/teacher/games" (pilotage) ou null (participants : pas de lien de pilotage). */
  gameLinkBase: string | null;
}) {
  return (
    <div className="space-y-6">
      {view.podium && view.podium.length > 0 ? (
        <section className="rounded-xl border border-amber-400/40 bg-slate-900 p-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Podium</p>
          <p className="mt-3 text-2xl font-bold text-amber-300">🏆 {view.podium[0]}</p>
          <div className="mt-2 flex justify-center gap-6 text-sm text-slate-300">
            {view.podium[1] ? <span>🥈 {view.podium[1]}</span> : null}
            {view.podium[2] ? <span>🥉 {view.podium[2]}</span> : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Équipes inscrites ({view.entries.length})
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {view.entries.map((e) => (
            <li
              key={e.teamLabel}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                e.status === "winner"
                  ? "bg-amber-400/10 text-amber-200"
                  : e.status === "eliminated"
                    ? "bg-slate-950 text-slate-500 line-through"
                    : "bg-slate-950 text-slate-300"
              }`}
            >
              <span>{e.teamLabel}</span>
              <span className="text-xs text-slate-500">
                {e.members} joueur{e.members > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {view.stages.map((stage) => (
        <section key={stage.index} className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            {STAGE_LABELS[stage.kind] ?? stage.kind}
            <span className="ml-2 text-xs font-normal text-slate-500">
              {stage.status === "finished" ? "terminée" : "en cours"}
            </span>
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {stage.games.map((game, i) => (
              <div key={game.gameId} className="rounded-lg bg-slate-950 p-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {stage.kind === "final" ? "Finale" : `Groupe ${String.fromCharCode(65 + i)}`}
                    {" · "}
                    {game.status === "finished"
                      ? "terminé"
                      : `tour ${game.currentRound}/${game.roundsCount}`}
                  </span>
                  {gameLinkBase ? (
                    <Link
                      href={`${gameLinkBase}/${game.gameId}`}
                      className="text-amber-300 underline-offset-4 hover:underline"
                    >
                      Piloter →
                    </Link>
                  ) : null}
                </div>
                {game.standings.length > 0 ? (
                  <ol className="mt-2 space-y-1">
                    {game.standings.map((s, rank) => (
                      <li
                        key={s.entryId}
                        className="flex items-center justify-between text-sm text-slate-300"
                      >
                        <span>
                          <span className="mr-2 text-slate-500">#{rank + 1}</span>
                          {s.entryId}
                        </span>
                        <span className="tabular-nums text-slate-400">BPI {s.bpi.toFixed(1)}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">Classement après le premier tour.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs text-slate-500">Statut : {STATUS_LABELS[view.status] ?? view.status}</p>
    </div>
  );
}
