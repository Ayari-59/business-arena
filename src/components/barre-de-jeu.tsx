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
  const enTete = progression && progression.titre && !termine ? progression : null;
  const avecTitre = enTete !== null;

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
      // `mb-3` : la barre ne laisse que 12 px sous elle. Le conteneur de la page espace ses enfants de
      // 24 px, ce qui, avec le remplissage du parcours, faisait 22 px entre la barre et la première
      // carte de chaque étape.
      className="sticky top-0 z-40 -mx-4 -mt-6 mb-3 border-b border-white/10 bg-slate-950/95 bg-gradient-to-b from-white/[0.04] to-transparent pt-[env(safe-area-inset-top)] shadow-[0_10px_24px_-16px_rgb(0_0_0/0.45)] backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/90 sm:hidden print:hidden"
    >
      {/* UNE BARRE BASSE : la flèche, le titre de l'étape, le menu — et dessous, sur une ligne,
          le temps du tour dans sa teinte à gauche, la partie et le tour à droite. Quand il n'y a
          pas de titre (partie terminée, rien à lire), l'ancienne forme : le nom, puis le tour. */}
      <div
        className={`flex items-center gap-1 px-1.5 ${avecTitre ? "min-h-11" : "h-14"}`}
      >
        <Link
          href={retour}
          aria-label="Quitter la partie"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[0.06] text-slate-200 ring-1 ring-white/10 transition active:scale-95 hover:bg-white/10 hover:text-slate-50"
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
        {avecTitre ? (
          <h2
            data-titre-etape=""
            className="line-clamp-2 min-w-0 flex-1 font-display text-lg font-semibold leading-tight text-slate-50"
          >
            {enTete?.titre}
          </h2>
        ) : (
          <div className="min-w-0 flex-1 text-center leading-tight">
            <p className="truncate text-base font-bold text-slate-50">{nom}</p>
            <p className="truncate text-sm text-slate-400">
              {termine
                ? "Partie terminée"
                : progression
                  ? `Tour ${tour} sur ${tours}`
                  : `Tour ${tour} sur ${tours} · en cours`}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-label="Menu de la partie"
          aria-expanded={ouvert}
          aria-controls={id}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ring-1 transition active:scale-95 ${
            ouvert
              ? "bg-amber-400/15 text-amber-300 ring-amber-400/40"
              : "bg-white/[0.06] text-slate-200 ring-white/10 hover:bg-white/10 hover:text-slate-50"
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

      {enTete ? (
        <div className="flex items-center justify-between gap-3 px-4 pb-1 text-sm">
          <p
            className={`flex shrink-0 items-center gap-2 rounded-full py-0.5 pl-2 pr-3 font-semibold uppercase tracking-etiquette ${PHASES[enTete.phase].texte} ${PHASES[enTete.phase].teinte}`}
          >
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 rounded-full ${PHASES[enTete.phase].fond}`}
            />
            <span data-amorce-etape="">{enTete.amorce}</span>
          </p>
          {/* Le nom cède la place, jamais le temps du tour ni le rang. */}
          <p className="flex min-w-0 text-slate-400">
            <span className="truncate">{nom}</span>
            <span className="shrink-0 font-medium tabular-nums text-slate-300">&nbsp;· Tour {tour}/{tours}</span>
          </p>
        </div>
      ) : null}

      {/* La barre du tour, en segments : un par temps (résultats, briefing, analyse, courrier,
          décisions), chacun dans sa teinte, plus ou moins rempli. */}
      {progression ? (
        <div
          role="progressbar"
          aria-label="Avancement du tour"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progression.fraction * 100)}
          className="flex h-1.5 gap-0.5"
        >
          {progression.segments.map((segment, i) => (
            <div
              key={i}
              className="h-1.5 overflow-hidden rounded-full bg-white/12"
              style={{ flexGrow: segment.poids, flexBasis: 0 }}
            >
              <div
                className={`h-1.5 rounded-full ${PHASES[segment.phase].fond} ${PHASES[segment.phase].texte} shadow-[0_0_8px_0_currentColor] transition-[width] duration-300 motion-reduce:transition-none`}
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
        <div className="carte max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-xl p-2">
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
