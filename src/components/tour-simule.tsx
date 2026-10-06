import Link from "next/link";
import { periodLabel } from "@/config/scenarios/periodicity";
import { SECTOR_COLORS, type Sector } from "@/config/scenarios/registry";
import { PictoSecteur } from "@/components/picto-secteur";
import { bouton } from "@/components/bouton";
import { formatEuro } from "@/lib/format";
import { Icone } from "@/components/icone";

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
/** L'entrée d'un bloc, l'un après l'autre : le tour, le chiffre, la place, puis les boutons. */
const entree = (rang: number) => ({
  className: "motion-safe:animate-[revelation-entree_0.5s_cubic-bezier(0.2,0.7,0.2,1)_both]",
  style: { animationDelay: `${rang * 110}ms` },
});

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
      className="relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center overflow-hidden px-6 py-8 text-center sm:py-12"
    >
      {/* Un halo laiton derrière le tour qui vient de se jouer : la fin d'un tour est un moment. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_70%_at_50%_0%,color-mix(in_oklab,var(--color-amber-400)_24%,transparent),transparent)]"
      />
      <span
        {...entree(0)}
        className={`relative flex h-14 w-14 items-center justify-center rounded-xl shadow-lg ring-1 ring-white/10 sm:h-16 sm:w-16 ${SECTOR_COLORS[sector].bg} ${SECTOR_COLORS[sector].accent} ${entree(0).className}`}
      >
        <PictoSecteur secteur={sector} className="h-8 w-8 sm:h-9 sm:w-9" />
      </span>
      <p
        {...entree(1)}
        className={`relative mt-4 flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-annonce text-emerald-300 sm:mt-6 ${entree(1).className}`}
      >
        <span aria-hidden>✓</span> Tour simulé
      </p>
      <h1
        {...entree(2)}
        className={`relative mt-3 font-display text-4xl font-semibold leading-tight text-slate-50 ${entree(2).className}`}
      >
        {periodLabel(roundDays, round)} joué
      </h1>
      <p
        {...entree(3)}
        className={`relative mt-2 max-w-md text-sm leading-relaxed text-slate-400 ${entree(3).className}`}
      >
        Vos décisions sont enregistrées.
      </p>

      {bilan ? <BilanEnTroisChiffres bilan={bilan} /> : null}

      <div
        {...entree(7)}
        className={`relative mt-5 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center ${entree(7).className}`}
      >
        <Link
          href={`/arena/${gameId}#dernier-resultat`}
          className={`${bouton({ taille: "l" })} bg-gradient-to-b from-amber-300 to-amber-400 shadow-lg shadow-amber-400/25 active:scale-[0.98]`}
        >
          <Icone nom="resultats" className="h-4 w-4" />
          Voir les résultats
        </Link>
        {finished ? (
          <Link
            href={`/arena/${gameId}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-400/40 px-6 py-3 text-sm font-semibold text-amber-300 transition hover:border-amber-400 hover:bg-amber-400/10 active:scale-[0.98]"
          >
            <Icone nom="trophee" className="h-4 w-4" />
            Bilan de la partie
          </Link>
        ) : (
          <Link
            href={`/arena/${gameId}#tour-en-cours`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/5 active:scale-[0.98]"
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
    <dl className="relative mt-4 grid w-full max-w-md grid-cols-2 gap-3 text-left">
      <div
        {...entree(4)}
        className={`col-span-2 rounded-xl border bg-gradient-to-b p-4 ${entree(4).className} ${
          gain
            ? "border-emerald-400/30 from-emerald-400/15 to-emerald-400/[0.03] shadow-[0_14px_34px_-20px_rgb(16_185_129/0.6)]"
            : "border-red-400/30 from-red-400/15 to-red-400/[0.03] shadow-[0_14px_34px_-20px_rgb(239_68_68/0.55)]"
        }`}
      >
        <dt className="text-xs font-semibold uppercase tracking-surtitre text-slate-400">
          Résultat net du tour
        </dt>
        <dd
          className={`mt-1 font-display text-5xl font-semibold tabular-nums ${
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
      <div {...entree(5)} className={`carte p-4 ${entree(5).className}`}>
        <dt className="text-xs font-semibold uppercase tracking-surtitre text-slate-400">
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
      <div {...entree(6)} className={`carte p-4 ${entree(6).className}`}>
        <dt className="text-xs font-semibold uppercase tracking-surtitre text-slate-400">
          {bilan.rang ? "Classement" : "Chiffre d'affaires"}
        </dt>
        <dd
          className={`mt-1 text-xl font-semibold tabular-nums ${
            bilan.rang?.place === 1 ? "text-amber-300" : "text-slate-50"
          }`}
        >
          {bilan.rang ? `${bilan.rang.place}ᵉ sur ${bilan.rang.sur}` : formatEuro(bilan.chiffreDAffaires)}
        </dd>
        {bilan.rang && bilan.ipg !== null ? (
          <dd className="text-sm text-slate-400">IPG {bilan.ipg.toFixed(0)}</dd>
        ) : null}
      </div>
    </dl>
  );
}
