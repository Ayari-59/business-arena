import Link from "next/link";
import type { ReactNode } from "react";
import { periodLabel } from "@/config/scenarios/periodicity";
import type { Sector } from "@/config/scenarios/registry";
import { bouton } from "@/components/bouton";
import { formatEuro } from "@/lib/format";
import { Icone } from "@/components/icone";
import { VerdictDuMarche } from "@/components/verdict-du-marche";
import { euroSigne } from "@/components/tableau-de-bord";

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
  /**
   * Le verdict en une phrase : celui que la révélation du tour écrit déjà
   * (`verdictDuTour`). Absent, l'écran en construit une avec ses chiffres.
   */
  verdict?: string | null;
}

/**
 * « LE MARCHÉ A RÉPONDU » : LA FIN D'UN TOUR, EN SOLO.
 *
 * Valider a résolu le tour à l'instant. Plutôt que de jeter le joueur sur les
 * résultats ou sur le tour suivant, on marque l'instant : un écran marine,
 * plein, en trois temps (le tour, le résultat, le rang et le verdict), puis
 * deux chemins. « Voir les résultats » est la seule action orange ; « Passer au
 * tour suivant » est l'autre chemin, en filet. Voir `VerdictDuMarche` pour la
 * grammaire, partagée avec la conséquence d'une décision dans un épisode.
 *
 * Le tirage du tour suivant, lui, se vit à son ouverture (`TirageDuTour`).
 */
export function TourSimule({
  gameId,
  round,
  currentRound,
  roundDays,
  finished,
  sector: _sector,
  entreprise = null,
  roundsCount = null,
  bilan = null,
  ecartEstime = null,
  explication = null,
}: {
  /**
   * CE QUI A FAIT LE RÉSULTAT (lot 6E) : la cascade du compte et les causes
   * chiffrées du tour, déjà lues par la page (`lecture-du-resultat.ts`). Null
   * sans bilan : l'écran ne calcule rien.
   */
  explication?: ReactNode;
  /**
   * « VOUS AVIEZ ESTIMÉ … LE MARCHÉ A DONNÉ … », quand l'équipe a déposé une
   * estimation. L'écran ne la calcule pas : la page de l'arène a déjà les
   * décisions du tour et son résultat (voir `ecart-d-estimation.tsx`). `null`
   * sans estimation : on ne reproche pas ce qui n'a pas été dit.
   */
  ecartEstime?: ReactNode;
  gameId: string;
  /** Le tour qui vient d'être joué. */
  round: number;
  /** Le tour à jouer maintenant (égal à `round` si la partie est finie). */
  currentRound: number;
  roundDays: number;
  finished: boolean;
  sector: Sector;
  /** Le nom de l'entreprise, en surtitre : « NOVA ». */
  entreprise?: string | null;
  roundsCount?: number | null;
  bilan?: BilanDuTour | null;
}) {
  const tour = periodLabel(roundDays, round);
  const surtitre = [entreprise, "Verdict du marché"].filter(Boolean).join(" · ");
  const titre = `${tour}${roundsCount ? `/${roundsCount}` : ""} · le marché a répondu`;

  const actions = (
    <>
      <Link
        href={`/arena/${gameId}#dernier-resultat`}
        className={`${bouton({ taille: "l" })} active:scale-[0.98]`}
      >
        <Icone nom="resultats" className="h-4 w-4" />
        Voir les résultats
      </Link>
      {finished ? (
        <Link
          href={`/arena/${gameId}`}
          className={`${bouton({ variante: "secondaire", taille: "l" })} active:scale-[0.98]`}
        >
          <Icone nom="trophee" className="h-4 w-4" />
          Bilan de la partie
        </Link>
      ) : (
        <Link
          href={`/arena/${gameId}#tour-en-cours`}
          className={`${bouton({ variante: "secondaire", taille: "l" })} active:scale-[0.98]`}
        >
          Passer au {periodLabel(roundDays, currentRound)}
          <span aria-hidden>→</span>
        </Link>
      )}
    </>
  );

  return (
    // L'ÉCRAN ENTIER EST L'ARDOISE. Plus de carte posée sur le papier, plus de
    // halo : le marine pleine page, sous l'en-tête du site (qui est marine
    // aussi), et rien d'autre à regarder.
    <main
      id="main"
      data-rituel-du-marche=""
      className="ardoise flex min-h-[calc(100dvh-4rem)] items-center bg-slate-950 px-5 py-6 text-slate-100 sm:px-6 sm:py-8"
    >
      {bilan ? (
        <VerdictDuMarche
          forme="ecran"
          surtitre={surtitre}
          titre={titre}
          chiffre={{
            libelle: "Résultat net du tour",
            valeur: euroSigne(bilan.resultatNet),
            sens: bilan.resultatNet >= 0 ? "gain" : "perte",
            // LE RÉSULTAT MONTE DEPUIS CELUI DU TOUR PRÉCÉDENT : c'est la
            // distance parcourue que la classe regarde, pas le nombre seul.
            nombre: bilan.resultatNet,
            plume: "euro-signe",
            depuis: bilan.resultatPrecedent ?? 0,
          }}
          ecart={
            bilan.resultatPrecedent === null ||
            Math.round(bilan.resultatNet - bilan.resultatPrecedent) === 0
              ? null
              : {
                  valeur: euroSigne(bilan.resultatNet - bilan.resultatPrecedent),
                  mention: "par rapport au tour précédent",
                  sens: bilan.resultatNet >= bilan.resultatPrecedent ? "gain" : "perte",
                  nombre: bilan.resultatNet - bilan.resultatPrecedent,
                  plume: "euro-signe" as const,
                }
          }
          rang={bilan.rang}
          ipg={bilan.rang ? bilan.ipg : null}
          phrase={bilan.verdict ?? null}
          explication={explication}
          complement={
            <>
              {/* LES DEUX AUTRES CHIFFRES DU TOUR, EN PETIT : ce qu'on a vendu,
                  et ce qu'il reste en caisse (une crise de trésorerie se voit
                  ici). */}
              <p className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm tabular-nums text-slate-400">
              <span>
                Chiffre d&apos;affaires{" "}
                <span className="font-semibold text-slate-200">
                  {formatEuro(bilan.chiffreDAffaires)}
                </span>
              </span>
              <span>
                Trésorerie{" "}
                <span
                  className={`font-semibold ${bilan.tresorerie < 0 ? "text-red-300" : "text-slate-200"}`}
                >
                  {formatEuro(bilan.tresorerie)}
                </span>
              </span>
              </p>
              {/* CE QU'ON AVAIT CRU, SOUS CE QUI EST ARRIVÉ : c'est l'écart
                  qui s'apprend, et le moment où toute la classe regarde est le
                  seul où il se retient. */}
              {ecartEstime}
            </>
          }
          actions={actions}
        />
      ) : (
        // Sans bilan fourni, aucun chiffre : l'écran reste une simple étape.
        <div className="rituel mx-auto w-full max-w-4xl text-center">
          <div data-temps="1">
            <p className="text-xs font-semibold uppercase tracking-annonce text-slate-400">
              {surtitre}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
              {titre}
            </h1>
            <p className="mt-3 text-base text-slate-300">Vos décisions sont enregistrées.</p>
          </div>
          <div data-temps="4" className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {actions}
          </div>
        </div>
      )}
    </main>
  );
}
