"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InstallButton } from "@/components/install-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SiteLogo } from "@/components/site-logo";
import {
  ACTION_PRINCIPALE,
  LIENS_LEGAUX,
  NAVIGATION,
  liensDeTete,
  type LienDeMenu,
} from "@/config/navigation";

/**
 * La barre de navigation.
 *
 * Elle alignait huit liens de même poids, tous marqués « masqué en dessous de
 * la barre des petits écrans » : sur téléphone, la navigation disparaissait
 * entièrement, sans rien pour la remplacer. Sur grand écran, elle disait tout
 * et donc plus rien, chaque page ayant exactement la même importance que la
 * suivante.
 *
 * Trois choses restent visibles : les catalogues, l'entrée qui répond à la
 * question d'un enseignant qui arrive, et un bouton qui déplie le plan complet.
 * Le plan est le MÊME à toutes les largeurs, parce qu'il est lu du registre :
 * c'est ce qui garantit qu'aucune page ne redevienne inatteignable sur
 * téléphone le jour où l'on en ajoutera une.
 */
export function SiteHeader() {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  // Les groupes du plan sont repliés : à l'ouverture, le menu tient sur
  // l'action principale et trois en-têtes. On déplie ce qu'on veut.
  const [groupesOuverts, setGroupesOuverts] = useState<Set<string>>(new Set());
  const cadre = useRef<HTMLElement>(null);

  const basculerGroupe = (code: string) =>
    setGroupesOuverts((etat) => {
      const suivant = new Set(etat);
      if (suivant.has(code)) suivant.delete(code);
      else suivant.add(code);
      return suivant;
    });

  // Un menu qui reste ouvert derrière la page qu'on vient d'appeler masque
  // cette page. On le referme donc au changement d'adresse, à la touche
  // d'échappement, et au clic à côté.
  useEffect(() => setOuvert(false), [chemin]);
  // Menu refermé : on replie les groupes, pour rouvrir sur un plan court.
  useEffect(() => {
    if (!ouvert) setGroupesOuverts(new Set());
  }, [ouvert]);
  useEffect(() => {
    if (!ouvert) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    const aCote = (e: MouseEvent) => {
      if (!cadre.current?.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("keydown", auClavier);
    document.addEventListener("mousedown", aCote);
    return () => {
      document.removeEventListener("keydown", auClavier);
      document.removeEventListener("mousedown", aCote);
    };
  }, [ouvert]);

  const estCourant = (href: string) => chemin === href || chemin.startsWith(`${href}/`);

  return (
    <header ref={cadre} className="relative z-40 border-b border-white/5 print:hidden">
      {/* La rangée a le droit de passer à la ligne. Sans cela, un bouton qui
          apparaît (l'invite d'installation ne se montre que sur certains
          appareils) pousse la fin de la barre hors de l'écran, et personne ne
          le voit depuis un ordinateur de bureau. */}
      <nav
        aria-label="Navigation principale"
        className="relative z-40 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3.5 sm:px-6"
      >
        <div className="flex items-center gap-2.5">
          <Link href="/" aria-label="Accueil">
            <SiteLogo className="h-6 w-[7.5rem] sm:h-8 sm:w-40" />
          </Link>
          {/* La plateforme évolue vite : le dire évite de faire passer un
              réglage en cours pour un défaut, et invite aux retours. */}
          <span
            title="Version bêta : la plateforme est pleinement utilisable, mais scénarios et contenus évoluent encore. Vos retours sont les bienvenus."
            className="rounded-full border border-sky-400/40 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-sky-300"
          >
            Bêta
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <div className="mr-1 hidden items-center gap-6 text-sm text-slate-400 lg:flex">
            {liensDeTete().map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                title={lien.aide}
                aria-current={estCourant(lien.href) ? "page" : undefined}
                className={
                  estCourant(lien.href)
                    ? "text-slate-100 underline decoration-amber-400/60 underline-offset-8"
                    : "hover:text-slate-200"
                }
              >
                {lien.libelle}
              </Link>
            ))}
          </div>

          <Link
            href={ACTION_PRINCIPALE.href}
            title={ACTION_PRINCIPALE.aide}
            aria-current={estCourant(ACTION_PRINCIPALE.href) ? "page" : undefined}
            className="hidden rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:border-amber-400 hover:bg-amber-400/10 sm:block"
          >
            {ACTION_PRINCIPALE.libelle}
          </Link>

          <ThemeSwitcher />
          <InstallButton />

          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            aria-expanded={ouvert}
            aria-controls="plan-du-site"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 transition hover:border-white/25 hover:text-slate-100"
          >
            <span aria-hidden className="flex flex-col gap-[3px]">
              <span className="block h-px w-3.5 bg-current" />
              <span className="block h-px w-3.5 bg-current" />
              <span className="block h-px w-3.5 bg-current" />
            </span>
            Menu
          </button>
        </div>
      </nav>

      {/* Voile derrière le panneau : sans lui, sur téléphone la page
          transparaissait dessous et le menu semblait flotter à moitié ouvert.
          Un clic dessus referme. Posé sous la barre (z-30) pour ne pas la
          ternir, mais au-dessus du reste de la page. */}
      <div
        aria-hidden
        onClick={() => setOuvert(false)}
        className={`fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm ${ouvert ? "block" : "hidden"}`}
      />

      <div
        id="plan-du-site"
        className={`absolute inset-x-0 top-full z-50 origin-top px-4 pb-4 sm:left-auto sm:right-6 sm:w-[26rem] sm:px-0 ${
          ouvert ? "block" : "hidden"
        }`}
      >
        {/* Le plan est plus haut qu'un écran de téléphone. Il défile donc
            dans son propre cadre : sans cela, les dernières entrées ne
            s'atteignent qu'en faisant défiler la page DERRIÈRE le menu. */}
        <div className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl">
          <Entree
            lien={ACTION_PRINCIPALE}
            courant={estCourant(ACTION_PRINCIPALE.href)}
            accent
          />

          <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
            {NAVIGATION.map((groupe) => {
              const ouvertGroupe = groupesOuverts.has(groupe.code);
              return (
                <div key={groupe.code}>
                  <button
                    type="button"
                    onClick={() => basculerGroupe(groupe.code)}
                    aria-expanded={ouvertGroupe}
                    aria-controls={`groupe-${groupe.code}`}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-white/5"
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {groupe.titre}
                    </span>
                    <span
                      aria-hidden
                      className={`text-slate-400 transition-transform ${ouvertGroupe ? "rotate-180" : ""}`}
                    >
                      ⌄
                    </span>
                  </button>
                  {ouvertGroupe ? (
                    <div id={`groupe-${groupe.code}`} className="mt-0.5 space-y-0.5 pb-1">
                      {groupe.liens.map((lien) => (
                        <Entree key={lien.href} lien={lien} courant={estCourant(lien.href)} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-4 border-t border-white/10 pt-3 text-xs text-slate-500">
            {LIENS_LEGAUX.map((lien) => (
              <Link key={lien.href} href={lien.href} className="hover:text-slate-300">
                {lien.libelle}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Une entrée du plan : son nom, et ce qu'on y trouve.
 *
 * L'aide n'est pas un ornement. « Parcours », « Guide » et « Notions » ne se
 * distinguent pas les uns des autres pour qui découvre le site, et c'est cette
 * phrase qui évite d'ouvrir les trois pour trouver la bonne.
 */
function Entree({
  lien,
  courant,
  accent = false,
}: {
  lien: LienDeMenu;
  courant: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      href={lien.href}
      aria-current={courant ? "page" : undefined}
      className={`block rounded-lg px-3 py-2 transition ${
        accent
          ? "border border-amber-400/40 bg-amber-950/20 hover:border-amber-400"
          : "hover:bg-white/5"
      } ${courant ? "bg-white/5" : ""}`}
    >
      <span
        className={`block text-sm font-medium ${accent ? "text-amber-300" : "text-slate-100"}`}
      >
        {lien.libelle}
      </span>
      <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">{lien.aide}</span>
    </Link>
  );
}
