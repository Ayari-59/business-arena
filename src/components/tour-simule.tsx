import Link from "next/link";
import { periodLabel } from "@/config/scenarios/periodicity";
import { SECTOR_COLORS, type Sector } from "@/config/scenarios/registry";

/**
 * L'ÉCRAN « TOUR SIMULÉ » (solo, juste après une validation).
 *
 * Valider a résolu le tour à l'instant. Plutôt que de jeter le joueur sur les
 * résultats ou sur le tour suivant — deux boutons « simuler » d'allure
 * identique —, on marque l'étape et on laisse choisir. Aucun chiffre n'est
 * dévoilé ici : c'est le rôle de « voir les résultats ». Le tirage, lui, se
 * vit à l'ouverture du tour suivant (voir `TirageDuTour`).
 */
export function TourSimule({
  gameId,
  round,
  currentRound,
  roundDays,
  finished,
  sector,
  scenarioIcon,
}: {
  gameId: string;
  /** Le tour qui vient d'être joué. */
  round: number;
  /** Le tour à jouer maintenant (égal à `round` si la partie est finie). */
  currentRound: number;
  roundDays: number;
  finished: boolean;
  sector: Sector;
  scenarioIcon: string;
}) {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-12 text-center"
    >
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${SECTOR_COLORS[sector].bg}`}
      >
        {scenarioIcon}
      </span>
      <p className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
        <span aria-hidden>✓</span> Tour simulé
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-50">
        {periodLabel(roundDays, round)} joué
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
        Vos décisions sont enregistrées.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/arena/${gameId}#dernier-resultat`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
        >
          <span aria-hidden>📊</span> Voir les résultats
        </Link>
        {finished ? (
          <Link
            href={`/arena/${gameId}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-400/40 px-6 py-3 text-sm font-semibold text-amber-300 transition hover:border-amber-400 hover:bg-amber-400/10"
          >
            <span aria-hidden>🏁</span> Bilan de la partie
          </Link>
        ) : (
          <Link
            href={`/arena/${gameId}#tour-en-cours`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
          >
            Passer au {periodLabel(roundDays, currentRound)}
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </main>
  );
}
