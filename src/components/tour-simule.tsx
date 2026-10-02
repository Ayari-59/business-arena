import Link from "next/link";
import { periodLabel } from "@/config/scenarios/periodicity";
import { SECTOR_COLORS, type Sector } from "@/config/scenarios/registry";
import { PictoSecteur } from "@/components/picto-secteur";
import { bouton } from "@/components/bouton";
import { formatEuro } from "@/lib/format";

/** Ce que le tour a donné, en trois chiffres : de quoi sentir la partie avant de la lire. */
export interface BilanDuTour {
  resultatNet: number;
  /** Le résultat net du tour d'avant : absent au premier tour. */
  resultatPrecedent: number | null;
  chiffreDAffaires: number;
  tresorerie: number;
  /** Rang et IPG de l'équipe ; absents tant que le classement n'est pas ouvert. */
  rang: { place: number; sur: number } | null;
  ipg: number | null;
}

/**
 * L'ÉCRAN « TOUR SIMULÉ » (solo, juste après une validation).
 *
 * Valider a résolu le tour à l'instant. Plutôt que de jeter le joueur sur les
 * résultats ou sur le tour suivant — deux boutons « simuler » d'allure
 * identique —, on marque l'étape et on laisse choisir. Un jeu récompense sur
 * l'instant : on donne ici l'essentiel en trois chiffres (résultat, trésorerie,
 * rang), et « voir les résultats » garde le détail. Le tirage, lui, se vit à
 * l'ouverture du tour suivant (voir `TirageDuTour`).
 */
export function TourSimule({
  gameId,
  round,
  currentRound,
  roundDays,
  finished,
  sector,
  bilan = null,
}: {
  gameId: string;
  /** Le tour qui vient d'être joué. */
  round: number;
  /** Le tour à jouer maintenant (égal à `round` si la partie est finie). */
  currentRound: number;
  roundDays: number;
  finished: boolean;
  sector: Sector;
  bilan?: BilanDuTour | null;
}) {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-8 text-center sm:py-12"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl sm:h-16 sm:w-16 ${SECTOR_COLORS[sector].bg} ${SECTOR_COLORS[sector].accent}`}
      >
        <PictoSecteur secteur={sector} className="h-7 w-7 sm:h-9 sm:w-9" />
      </span>
      <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300 sm:mt-6">
        <span aria-hidden>✓</span> Tour simulé
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-50">
        {periodLabel(roundDays, round)} joué
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
        Vos décisions sont enregistrées.
      </p>

      {bilan ? <BilanEnTroisChiffres bilan={bilan} /> : null}

      <div className="mt-5 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
        <Link
          href={`/arena/${gameId}#dernier-resultat`}
          className={bouton({ taille: "l" })}
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

function BilanEnTroisChiffres({ bilan }: { bilan: BilanDuTour }) {
  const gain = bilan.resultatNet >= 0;
  const ecart =
    bilan.resultatPrecedent === null ? null : bilan.resultatNet - bilan.resultatPrecedent;
  return (
    <dl className="mt-4 grid w-full max-w-md grid-cols-2 gap-3 text-left">
      <div
        className={`col-span-2 rounded-2xl border p-4 ${
          gain
            ? "border-emerald-400/30 bg-emerald-950/20"
            : "border-red-400/30 bg-red-950/20"
        }`}
      >
        <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Résultat net du tour
        </dt>
        <dd
          className={`mt-1 font-display text-4xl font-semibold tabular-nums ${
            gain ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {gain ? "+" : ""}
          {formatEuro(bilan.resultatNet)}
        </dd>
        {ecart !== null ? (
          <dd className="mt-1 text-sm text-slate-300">
            {ecart >= 0 ? "▲" : "▼"} {formatEuro(Math.abs(ecart))} {ecart >= 0 ? "de mieux" : "de moins"}{" "}
            que le tour précédent
          </dd>
        ) : null}
      </div>
      <div className="rounded-2xl border border-white/10 p-4">
        <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Trésorerie
        </dt>
        <dd
          className={`mt-1 text-xl font-semibold tabular-nums ${
            bilan.tresorerie < 0 ? "text-red-300" : "text-slate-50"
          }`}
        >
          {formatEuro(bilan.tresorerie)}
        </dd>
      </div>
      <div className="rounded-2xl border border-white/10 p-4">
        <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {bilan.rang ? "Classement" : "Chiffre d'affaires"}
        </dt>
        <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-50">
          {bilan.rang ? `${bilan.rang.place}ᵉ sur ${bilan.rang.sur}` : formatEuro(bilan.chiffreDAffaires)}
        </dd>
        {bilan.rang && bilan.ipg !== null ? (
          <dd className="text-sm text-slate-400">IPG {bilan.ipg.toFixed(0)}</dd>
        ) : null}
      </div>
    </dl>
  );
}
