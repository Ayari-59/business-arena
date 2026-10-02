"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useProgression } from "@/lib/progression-parcours";
import { PHASES } from "@/config/phases-du-tour";
import type { CodeTheme } from "@/config/themes";

/**
 * LA BARRE D'UNE APPLICATION, À LA PLACE DE CELLE D'UN SITE, DANS L'ARÈNE.
 *
 * Sur téléphone, la partie s'ouvrait sous la barre de la vitrine : le logo, la
 * bascule de thème et un « Menu » qui ouvre le plan de tout le site. Un élève
 * qui décide n'a rien à y faire, et rien de ce qui compte pour lui — quelle
 * partie, quel tour — n'y figurait. Ici, quatre choses : de quoi QUITTER, la
 * partie en cours, où en est le tour, et un menu pour le reste.
 *
 * Elle ne remplace la barre du site QUE sur petit écran (le site la masque, voir
 * site-header.tsx) : sur grand écran, la vitrine garde sa barre et celle-ci
 * disparaît. Le reste de ce que portait la barre du site — profil, fiches,
 * guide, apparence — vit dans son menu « ⋯ », au bout d'un doigt.
 *
 * L'APPARENCE EST DANS LE MENU, PAS SUPPRIMÉE. Une salle éclairée au
 * vidéoprojecteur et un élève dans le train ne veulent pas le même thème : le
 * choix reste à portée, il cesse seulement d'occuper la barre.
 */
export function BarreDeJeu({
  nom,
  tour,
  tours,
  termine,
  retour,
  cockpit,
  themeParDefaut,
  accents,
  compte = null,
}: {
  nom: string;
  tour: number;
  tours: number;
  termine: boolean;
  /** Où mène la flèche : l'écran de lancement en solo, l'accueil en classe. */
  retour: string;
  /** Le cockpit de prévision de la partie : testez vos hypothèses avant de valider. */
  cockpit: string;
  themeParDefaut: CodeTheme;
  accents?: Record<CodeTheme, string>;
  /** Ce qui n'est pas le jeu, en classe : sous quel nom on joue, la clé de reprise, la composition des équipes. */
  compte?: React.ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  // Où en est le joueur dans son tour : le parcours en cartes le déclare, la barre
  // le montre. Sans parcours (grand écran, partie terminée), il n'y a rien à dire.
  const progression = useProgression();
  const cadre = useRef<HTMLDivElement>(null);

  // Le menu se referme sur Échap et au toucher hors de la barre, comme le plan
  // du site : un panneau qu'on ne peut pas écarter couvre la partie.
  useEffect(() => {
    if (!ouvert) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    const aCote = (e: Event) => {
      if (cadre.current && !cadre.current.contains(e.target as Node))
        setOuvert(false);
    };
    document.addEventListener("keydown", auClavier);
    document.addEventListener("pointerdown", aCote);
    return () => {
      document.removeEventListener("keydown", auClavier);
      document.removeEventListener("pointerdown", aCote);
    };
  }, [ouvert]);

  const lien =
    "flex min-h-11 items-center rounded-lg px-3 text-base text-slate-200 transition hover:bg-white/5";

  return (
    <div
      ref={cadre}
      className="sticky top-0 z-40 -mx-4 -mt-6 border-b border-white/10 bg-slate-950/95 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/90 sm:hidden print:hidden"
    >
      <div className="flex h-14 items-center gap-1 px-1.5">
        <Link
          href={retour}
          aria-label="Quitter la partie"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-300 transition hover:bg-white/5 hover:text-slate-100"
        >
          <svg
            aria-hidden
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1 text-center leading-tight">
          <p className="truncate text-base font-bold text-slate-50">{nom}</p>
          <p className="truncate text-sm text-slate-400">
            {termine ? (
              "Partie terminée"
            ) : progression ? (
              <>
                Tour {tour} sur {tours} ·{" "}
                {/* Le temps du tour, dans sa teinte : c'est ce qui dit où l'on en est. */}
                <span className={`font-semibold ${PHASES[progression.phase].texte}`}>
                  {progression.libelle}
                  {progression.rang ? ` ${progression.rang}` : ""}
                </span>
              </>
            ) : (
              `Tour ${tour} sur ${tours} · en cours`
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-label="Menu de la partie"
          aria-expanded={ouvert}
          aria-controls={id}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition hover:bg-white/5 ${
            ouvert ? "text-amber-300" : "text-slate-300 hover:text-slate-100"
          }`}
        >
          <svg
            aria-hidden
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
      </div>

      {/* La barre du tour, en segments : un par temps (résultats, briefing, analyse, courrier,
          décisions), chacun dans sa teinte, plus ou moins rempli. */}
      {progression ? (
        <div
          role="progressbar"
          aria-label="Avancement du tour"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progression.fraction * 100)}
          className="flex h-1 gap-0.5"
        >
          {progression.segments.map((segment, i) => (
            <div
              key={i}
              className="h-1 overflow-hidden rounded-full bg-white/12"
              style={{ flexGrow: segment.poids, flexBasis: 0 }}
            >
              <div
                className={`h-1 ${PHASES[segment.phase].fond} transition-[width] duration-300 motion-reduce:transition-none`}
                style={{ width: `${Math.round(segment.fait * 100)}%` }}
              />
            </div>
          ))}
        </div>
      ) : null}

      <div
        id={id}
        className={`absolute inset-x-2 top-full mt-1 ${ouvert ? "block" : "hidden"}`}
      >
        <div className="carte max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl p-2">
          <Link href={cockpit} className={lien}>
            Cockpit de prévision
          </Link>
          <Link href="/profile" className={lien}>
            Mon profil et ma progression
          </Link>
          <Link href="/notions" className={lien}>
            Fiches notions
          </Link>
          <Link href="/guide" className={lien}>
            Guide
          </Link>
          <Link href="/" className={lien}>
            Accueil du site
          </Link>
          {compte ? (
            <div className="mt-1 space-y-3 border-t border-white/10 p-2 pt-3">
              {compte}
            </div>
          ) : null}
          <div className="mt-1 flex min-h-11 items-center justify-between gap-3 border-t border-white/10 px-3 pt-2">
            <span className="text-base text-slate-200">Apparence</span>
            <ThemeSwitcher parDefaut={themeParDefaut} accents={accents} />
          </div>
        </div>
      </div>
    </div>
  );
}
