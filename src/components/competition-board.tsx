import { formatDecimal } from "@/lib/format";
import Link from "next/link";
import type { CompetitionView } from "@/services/competition.service";
import { nomDeLaPhase } from "@/config/concours";
import { Icone } from "@/components/icone";
import { PastilleDeRang, classeLigneDeRang } from "@/components/rang";

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
        <section className="filet-or rounded-xl border-2 bg-slate-900 p-4 sm:p-7 text-center">
          <p className="text-xs uppercase tracking-annonce texte-or">Podium</p>
          <p className="mt-3 flex items-center justify-center gap-2 text-2xl font-bold text-slate-100">
            <Icone nom="trophee" className="texte-or h-6 w-6" />
            <PastilleDeRang rang={1} className="text-base" />
            {view.podium[0]}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-300">
            {/* Les médailles étaient des emoji d'argent et de bronze : le rang,
                écrit dans sa pastille de métal, dit la même chose sans
                dépendre du téléphone. */}
            {view.podium[1] ? (
              <span className="flex items-center gap-2">
                <PastilleDeRang rang={2} />
                {view.podium[1]}
              </span>
            ) : null}
            {view.podium[2] ? (
              <span className="flex items-center gap-2">
                <PastilleDeRang rang={3} />
                {view.podium[2]}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="carte p-3 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Équipes inscrites ({view.entries.length})
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {view.entries.map((e) => (
            <li
              key={e.teamLabel}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                e.status === "winner"
                  ? "ligne-rang-1 bg-slate-950 font-semibold texte-or"
                  : e.status === "eliminated"
                    ? "bg-slate-950 text-slate-400 line-through"
                    : "bg-slate-950 text-slate-300"
              }`}
            >
              <span>{e.teamLabel}</span>
              <span className="text-xs text-slate-400">
                {e.members} joueur{e.members > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {view.stages.map((stage) => (
        <section key={stage.index} className="carte p-3 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            {nomDeLaPhase(stage, stage.index)}
            <span className="ml-2 text-xs font-normal text-slate-400">
              {stage.status === "finished" ? "terminée" : "en cours"}
            </span>
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {stage.games.map((game, i) => (
              <div key={game.gameId} className="rounded-lg bg-slate-950 p-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {stage.kind === "final" ? "Finale" : `Poule ${String.fromCharCode(65 + i)}`}
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
                        className={`flex items-center justify-between rounded-md py-0.5 pl-2 text-sm text-slate-300 ${classeLigneDeRang(rank + 1)}`}
                      >
                        <span className="flex items-center gap-2">
                          <PastilleDeRang rang={rank + 1} />
                          {s.entryId}
                        </span>
                        <span className="tabular-nums text-slate-400">
                          IPG {formatDecimal(s.bpi)}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">Classement après le premier tour.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs text-slate-400">Statut : {STATUS_LABELS[view.status] ?? view.status}</p>
    </div>
  );
}
