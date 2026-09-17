"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InstallButton } from "@/components/install-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SiteLogo } from "@/components/site-logo";
import {
  ACTION_PRINCIPALE,
  GROUPE_OUVERT,
  LIENS_LEGAUX,
  liensDAcces,
  liensDeTete,
  NAVIGATION,
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
 * Sur grand écran, les liens de tête s'affichent À PLAT : un menu horizontal
 * direct, sans détour par un panneau. En dessous, ils se replient — la barre
 * d'un téléphone ne tient pas une rangée de liens. À toutes les largeurs, un
 * bouton « Menu » déplie le plan COMPLET, lu du registre : c'est lui qui
 * garantit qu'aucune page ne redevienne inatteignable, sur téléphone comme sur
 * grand écran, le jour où l'on en ajoutera une. L'orientation n'a plus son
 * bouton dédié dans la barre ; elle reste en tête de ce plan.
 *
 * Les liens à plat sont ceux de l'enseignant qui découvre : présentation,
 * ateliers, entreprises. Les fiches notions n'y sont plus, elles sont une
 * ressource, pas une vitrine. À droite, deux boutons, un par public : l'espace
 * enseignant et le code d'une partie, pour que ni l'un ni l'autre n'ait à
 * ouvrir le menu.
 */
export function SiteHeader() {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  // Les groupes du plan sont repliés, sauf le premier, orientation et contact,
  // qui porte l'action principale : à l'ouverture, le menu tient sur ses deux
  // entrées et trois en-têtes. On déplie ce qu'on veut.
  const [groupesOuverts, setGroupesOuverts] = useState<Set<string>>(
    () => new Set([GROUPE_OUVERT]),
  );
  const cadre = useRef<HTMLElement>(null);
  // Dans l'arène, la page est plus large (1 400 px) : la barre s'aligne sur
  // ses bords, sinon le logo et le menu flottent en retrait sur grand écran.
  const largeur = chemin?.startsWith("/arena/") ? "max-w-[1400px]" : "max-w-6xl";

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
    if (!ouvert) setGroupesOuverts(new Set([GROUPE_OUVERT]));
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
    <header
      ref={cadre}
      className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/55 print:static print:bg-transparent print:hidden"
    >
      {/* Un filet de laiton posé sur le bord bas de la barre, éteint aux deux
          extrémités. C'est le même geste que le liseré d'une carte : ce qui
          sépare deux surfaces se voit, mais ne se remarque pas. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent print:hidden"
      />
      {/* La rangée a le droit de passer à la ligne. Sans cela, un bouton qui
          apparaît (l'invite d'installation ne se montre que sur certains
          appareils) pousse la fin de la barre hors de l'écran, et personne ne
          le voit depuis un ordinateur de bureau. */}
      <nav
        aria-label="Navigation principale"
        className={`relative z-40 mx-auto flex ${largeur} flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3.5 sm:px-6`}
      >
        <div className="flex items-center gap-2.5">
          <Link href="/" aria-label="Accueil">
            <SiteLogo className="h-6 w-[7.5rem] sm:h-8 sm:w-40" />
          </Link>
        </div>

        {/* Les liens de tête, à plat sur grand écran : un menu horizontal
            direct. Sous lg, ils se replient dans le panneau « Menu », qui reste
            le plan COMPLET à toutes les largeurs (le thème et l'installation y
            vivent aussi, pour ne pas empiler des contrôles hétéroclites). */}
        <div className="flex items-center justify-end gap-1.5">
          <ul className="hidden items-center gap-0.5 lg:flex">
            {liensDeTete().map((lien) => (
              <li key={lien.href}>
                <Link
                  href={lien.href}
                  title={lien.aide}
                  aria-current={estCourant(lien.href) ? "page" : undefined}
                  className={`group relative block px-3 py-1.5 text-sm font-medium transition-colors ${
                    estCourant(lien.href)
                      ? "text-amber-200"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {lien.libelle}
                  {/* La page courante porte un trait de laiton plein ; les
                      autres le font naître du centre au survol. Une pastille
                      pleine alourdissait une barre qui en compte trois. */}
                  <span
                    aria-hidden
                    className={`absolute inset-x-3 bottom-0.5 h-px origin-center bg-amber-400/70 transition-transform duration-200 motion-reduce:transition-none ${
                      estCourant(lien.href)
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>

          {/* Les deux portes d'entrée, une par public. L'enseignant en ambre,
              comme l'action principale du plan ; l'élève en clair. Un filet les
              sépare de ce qui ne fait qu'informer. */}
          <span aria-hidden className="mx-1 hidden h-5 w-px bg-white/10 lg:block" />
          <div className="hidden items-center gap-1.5 lg:flex">
            {liensDAcces().map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                title={lien.aide}
                aria-current={estCourant(lien.href) ? "page" : undefined}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition duration-200 hover:-translate-y-px motion-reduce:transform-none motion-reduce:transition-none ${
                  lien.acces === "enseignant"
                    ? "border-amber-400/45 bg-gradient-to-b from-amber-400/15 to-amber-400/5 text-amber-200 shadow-amber-950/40 hover:border-amber-400 hover:from-amber-400/25 hover:to-amber-400/10"
                    : "border-white/15 bg-gradient-to-b from-white/8 to-transparent text-slate-200 hover:border-white/35 hover:from-white/12"
                }`}
              >
                {lien.libelle}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            aria-expanded={ouvert}
            aria-controls="plan-du-site"
            className={`flex items-center gap-2 rounded-lg border bg-slate-900 px-2.5 py-1.5 text-xs transition duration-200 motion-reduce:transition-none ${
              ouvert
                ? "border-amber-400/45 text-amber-200"
                : "border-white/10 text-slate-300 hover:border-amber-400/35 hover:text-slate-100"
            }`}
          >
            {/* Trois filets qui se croisent quand le plan s'ouvre : le bouton
                dit alors qu'il referme, sans changer de mot. */}
            <span aria-hidden className="relative block h-[9px] w-3.5">
              <span
                className={`absolute left-0 block h-px w-3.5 bg-current transition-transform duration-200 motion-reduce:transition-none ${
                  ouvert ? "top-1/2 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 block h-px w-3.5 bg-current transition-opacity duration-200 motion-reduce:transition-none ${
                  ouvert ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-px w-3.5 bg-current transition-transform duration-200 motion-reduce:transition-none ${
                  ouvert ? "top-1/2 -rotate-45" : "top-full"
                }`}
              />
            </span>
            Menu
          </button>
        </div>
      </nav>

      {/* Voile derrière le panneau, SUR TÉLÉPHONE seulement : là, le panneau
          pleine largeur laissait transparaître la page dessous et semblait à
          moitié ouvert. Sur grand écran le menu n'est qu'une carte de coin :
          pas besoin d'assombrir toute la page (la fermeture au clic-dehors est
          assurée par le gestionnaire plus haut). Posé sous la barre (z-30). */}
      <div
        aria-hidden
        onClick={() => setOuvert(false)}
        className={`fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm sm:hidden ${ouvert ? "block" : "hidden"}`}
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
        <div
          className={`carte relative max-h-[calc(100dvh-4.5rem)] overflow-y-auto rounded-2xl p-4 supports-[backdrop-filter]:bg-slate-900/85 supports-[backdrop-filter]:backdrop-blur-xl ${
            ouvert ? "motion-safe:animate-plan-ouvre" : ""
          }`}
        >
          {/* Le même filet que sous la barre, posé sur l'arête haute du
              panneau : les deux surfaces se répondent au lieu de se
              superposer. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/55 to-transparent"
          />
          <div className="space-y-1">
            {NAVIGATION.map((groupe) => {
              const ouvertGroupe = groupesOuverts.has(groupe.code);
              return (
                <div key={groupe.code}>
                  <button
                    type="button"
                    onClick={() => basculerGroupe(groupe.code)}
                    aria-expanded={ouvertGroupe}
                    aria-controls={`groupe-${groupe.code}`}
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-white/5"
                  >
                    <span
                      className={`shrink-0 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                        ouvertGroupe
                          ? "text-amber-300/90"
                          : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    >
                      {groupe.titre}
                    </span>
                    {/* Le filet occupe ce que le titre laisse : c'est ce qui
                        distingue une rubrique d'un lien, sans l'écrire. */}
                    <span
                      aria-hidden
                      className={`h-px flex-1 transition-colors ${ouvertGroupe ? "bg-amber-400/25" : "bg-white/10"}`}
                    />
                    <svg
                      aria-hidden
                      viewBox="0 0 10 6"
                      className={`h-1.5 w-2.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
                        ouvertGroupe ? "rotate-180 text-amber-300/90" : "text-slate-400"
                      }`}
                    >
                      <path
                        d="M1 1l4 4 4-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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

          {/* Réglages : ce qui était éparpillé dans la barre, réuni et nommé. */}
          <div className="mt-3 border-t border-white/10 pt-3">
            <p className="flex items-center gap-3 px-3">
              <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Réglages
              </span>
              <span aria-hidden className="h-px flex-1 bg-white/10" />
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-3 px-3">
              <span className="text-sm text-slate-300">Apparence</span>
              <ThemeSwitcher />
            </div>
            {/* N'apparaît que si l'installation est réellement possible. */}
            <div className="mt-2 px-3 empty:hidden">
              <InstallButton />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 border-t border-white/10 pt-3 text-xs text-slate-400">
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
function Entree({ lien, courant }: { lien: LienDeMenu; courant: boolean }) {
  // L'action principale garde sa couleur : c'est la seule entrée du plan qui
  // dit par où commencer, et elle doit se voir sans se lire.
  const principale = lien.href === ACTION_PRINCIPALE.href;
  return (
    <Link
      href={lien.href}
      aria-current={courant ? "page" : undefined}
      className={`group block rounded-lg px-3 py-2 transition duration-200 motion-reduce:transition-none ${
        principale
          ? "border border-amber-400/40 bg-gradient-to-b from-amber-400/12 to-amber-950/20 shadow-[0_6px_20px_-12px] shadow-amber-400/60 hover:border-amber-400 hover:from-amber-400/20"
          : `border-l-2 hover:bg-white/5 ${
              courant ? "border-amber-400/70 bg-white/5" : "border-transparent hover:border-amber-400/50"
            }`
      }`}
    >
      <span
        className={`flex items-center justify-between gap-3 text-sm font-medium ${principale ? "text-amber-300" : "text-slate-100"}`}
      >
        {lien.libelle}
        {/* La flèche de l'entrée principale avance d'un cheveu au survol :
            c'est le seul mouvement du plan, et il dit où l'on va. */}
        {principale ? (
          <span
            aria-hidden
            className="translate-x-0 text-amber-300 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
          >
            →
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">{lien.aide}</span>
    </Link>
  );
}
