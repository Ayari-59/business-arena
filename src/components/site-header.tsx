"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InstallButton } from "@/components/install-button";
import { bouton } from "@/components/bouton";
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
 * LA LISIBILITÉ PASSE AVANT LE VERRE TEINTÉ. La barre a vécu à 55 % d'opacité
 * et le panneau à 85 % : sur un fond clair, sur une image, sur un tableau
 * dense, le texte du menu devenait illisible par endroits, et seulement par
 * endroits — le pire des défauts, celui qu'on ne reproduit pas à volonté. La
 * barre reste donc translucide mais franchement opaque, et le panneau est
 * plein : une carte de menu se lit par-dessus n'importe quoi. Le flou et le
 * voile de lumière suffisent à la décoller du fond.
 *
 * LA BARRE EST MARINE, ET OPAQUE. L'habillage « L'arène » pose le marine là où
 * l'œil se repère : l'en-tête en est le premier endroit, sur toutes les pages.
 * Elle prend donc la matière du tableau (`ardoise`), qui retourne l'échelle
 * pour elle seule : ses classes, écrites pour un fond sombre, s'y lisent
 * telles quelles, et le logo y prend sa version blanche.
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
  const enJeu = chemin?.startsWith("/arena/") ?? false;
  // LA PROJECTION N'A PAS DE BARRE DU SITE. C'est l'écran qu'on montre à la
  // classe : « Pour les enseignants », « Ateliers » ou « Espace enseignant »
  // n'y disent rien aux élèves et prennent le haut de l'image. La page porte
  // sa propre navigation, dont le retour au pilotage.
  const enProjection = /^\/teacher\/games\/[^/]+\/projection(\/|$)/.test(chemin ?? "");
  const largeur = enJeu ? "max-w-[1400px]" : "max-w-6xl";

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

  // L'EN-TÊTE SE RETIRE QUAND ON DESCEND, SUR TÉLÉPHONE (audit P3-09). Il
  // prenait 58 px de l'écran pendant toute la lecture, la barre d'action 60 de
  // plus. On note le sens du défilement sur la racine (`data-defile`), et la
  // feuille (« LOT 3B », globals.css) le fait glisser hors de l'écran ; il
  // revient au premier geste vers le haut, et ne part jamais menu ouvert ni
  // près du haut de la page.
  useEffect(() => {
    const racine = document.documentElement;
    const telephone = window.matchMedia("(max-width: 639px)");
    let dernier = window.scrollY;
    const auDefilement = () => {
      const y = window.scrollY;
      const ecart = y - dernier;
      if (Math.abs(ecart) < 8) return;
      if (telephone.matches && !ouvert && ecart > 0 && y > 120) racine.dataset.defile = "bas";
      else delete racine.dataset.defile;
      dernier = y;
    };
    window.addEventListener("scroll", auDefilement, { passive: true });
    return () => {
      window.removeEventListener("scroll", auDefilement);
      delete racine.dataset.defile;
    };
  }, [ouvert]);

  const estCourant = (href: string) => chemin === href || chemin.startsWith(`${href}/`);

  return (
    <header
      ref={cadre}
      data-en-tete-du-site
      className={`ardoise sticky top-0 z-40 border-b border-white/10 bg-slate-950 print:static print:bg-transparent print:hidden ${
        // Dans l'arène, sur téléphone, la barre d'application de la partie prend
        // sa place (voir barre-de-jeu.tsx) : deux barres se doubleraient.
        enJeu ? "max-sm:hidden" : ""
      } ${enProjection ? "hidden" : ""}`}
    >
      {/* Un filet clair posé sur le bord bas de la barre, éteint aux deux
          extrémités. C'est le même geste que le liseré d'une carte : ce qui
          sépare deux surfaces se voit, mais ne se remarque pas. Il a été
          orange : lot P1, l'orange ne dit plus que l'action. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent print:hidden"
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
          <Link href="/" aria-label="Accueil" className="pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center">
            <SiteLogo className="h-6 w-[7.5rem] sm:h-8 sm:w-40" />
          </Link>
        </div>

        {/* Les liens de tête, à plat sur grand écran : un menu horizontal
            direct. Sous lg, ils se replient dans le panneau « Menu », qui reste
            le plan COMPLET à toutes les largeurs. L'installation y vit aussi ;
            le thème, lui, est remonté dans la barre — on ne choisit pas une
            apparence derrière un panneau qui cache la page. */}
        {/* EN PARTIE, LA VITRINE S'EFFACE.
            L'élève jouait avec « Pour les enseignants · Ateliers · Entreprises
            · Espace enseignant » au-dessus de la tête : quatre sorties qui ne
            le concernent pas, sur l'écran où il doit décider. Dans l'arène, la
            barre ne garde que le logo et le plan complet — celui-ci reste, il
            est la garantie qu'aucune page ne devienne inatteignable. L'état de
            la partie, lui, est porté par le bandeau de jeu de la page. */}
        <div className="flex items-center justify-end gap-1.5">
          {enJeu ? null : (
          <ul className="hidden items-center gap-0.5 lg:flex">
            {liensDeTete().map((lien) => (
              <li key={lien.href}>
                <Link
                  href={lien.href}
                  title={lien.aide}
                  aria-current={estCourant(lien.href) ? "page" : undefined}
                  className={`group relative block px-3 py-1.5 text-sm font-medium transition-colors ${
                    estCourant(lien.href)
                      ? "text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {lien.libelle}
                  {/* La page courante porte un trait plein ; les autres le
                      font naître du centre au survol. Une pastille pleine
                      alourdissait une barre qui en compte trois. Le trait dit
                      une POSITION : gris clair, jamais l'orange (lot P1). */}
                  <span
                    aria-hidden
                    className={`absolute inset-x-3 bottom-0.5 h-px origin-center bg-slate-300 transition-transform duration-[var(--duree-passage)] motion-reduce:transition-none ${
                      estCourant(lien.href)
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>
          )}

          {/* Les deux portes d'entrée, une par public : deux boutons
              SECONDAIRES de la maison (lot P1). L'enseignant a été un contour
              orange écrit à la main, l'élève un dégradé clair : deux formes de
              plus, et un orange qui disputait l'œil à l'action de la page. Un
              filet les sépare de ce qui ne fait qu'informer. */}
          {enJeu ? null : (
            <span aria-hidden className="mx-1 hidden h-5 w-px bg-white/10 lg:block" />
          )}
          {enJeu ? null : (
          <div className="hidden items-center gap-1.5 lg:flex">
            {liensDAcces().map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                title={lien.aide}
                aria-current={estCourant(lien.href) ? "page" : undefined}
                className={
                  // LOT P2 : UN SEUL CADRE D'ACTION DANS LA BARRE. Les deux
                  // portes étaient deux boutons secondaires côte à côte, plus
                  // le menu : trois cadres pour une barre. L'élève qui a un
                  // code garde le filet (« Rejoindre une partie ») ; l'espace
                  // enseignant devient un lien souligné, comme les rubriques à
                  // sa gauche. Le seul bouton plein du premier écran reste
                  // « Commencer une partie », dans le héros.
                  lien.acces === "eleve"
                    ? bouton({ variante: "secondaire", taille: "m" })
                    : `${bouton({ variante: "lien", taille: "m" })} px-2`
                }
              >
                {lien.libelle}
              </Link>
            ))}
          </div>
          )}

          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            aria-expanded={ouvert}
            aria-controls="plan-du-site"
            className={`flex items-center gap-2 rounded-lg border bg-slate-900 px-2.5 py-1.5 text-xs transition duration-[var(--duree-passage)] motion-reduce:transition-none pointer-coarse:min-h-11 pointer-coarse:px-3.5 pointer-coarse:text-sm ${
              ouvert
                ? "border-white/40 text-white"
                : "border-white/10 text-slate-300 hover:border-white/35 hover:text-slate-100"
            }`}
          >
            {/* Trois filets qui se croisent quand le plan s'ouvre : le bouton
                dit alors qu'il referme, sans changer de mot. */}
            <span aria-hidden className="relative block h-[9px] w-3.5">
              <span
                className={`absolute left-0 block h-px w-3.5 bg-current transition-transform duration-[var(--duree-passage)] motion-reduce:transition-none ${
                  ouvert ? "top-1/2 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 block h-px w-3.5 bg-current transition-opacity duration-[var(--duree-passage)] motion-reduce:transition-none ${
                  ouvert ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-px w-3.5 bg-current transition-transform duration-[var(--duree-passage)] motion-reduce:transition-none ${
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
          className={`carte relative max-h-[calc(100dvh-4.5rem)] overflow-y-auto rounded-xl p-4 ${
            ouvert ? "motion-safe:animate-plan-ouvre" : ""
          }`}
        >
          {/* Le même filet que sous la barre, posé sur l'arête haute du
              panneau : les deux surfaces se répondent au lieu de se
              superposer. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
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
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-white/5 pointer-coarse:min-h-11"
                  >
                    <span
                      className={`shrink-0 text-sm font-semibold transition-colors ${
                        ouvertGroupe ? "text-slate-50" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    >
                      {groupe.titre}
                    </span>
                    {/* Le filet occupe ce que le titre laisse : c'est ce qui
                        distingue une rubrique d'un lien, sans l'écrire. */}
                    <span
                      aria-hidden
                      className={`h-px flex-1 transition-colors ${ouvertGroupe ? "bg-slate-300" : "bg-white/10"}`}
                    />
                    <svg
                      aria-hidden
                      viewBox="0 0 10 6"
                      className={`h-1.5 w-2.5 shrink-0 transition-transform duration-[var(--duree-passage)] motion-reduce:transition-none ${
                        ouvertGroupe ? "rotate-180 text-slate-200" : "text-slate-400"
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

          {/* L'installation, et rien d'autre : le réglage d'apparence est monté
              dans la barre, et une rubrique « Réglages » qui n'aurait plus
              qu'une ligne — absente la plupart du temps, puisque l'invite
              d'installation ne se montre que sur certains appareils — était un
              titre au-dessus du vide. Le bouton se nomme lui-même.

              `empty:hidden` : le composant ne rend rien quand l'appareil ne
              sait pas installer, et le filet disparaît alors avec lui. */}
          <div className="mt-3 border-t border-white/10 px-3 pt-3 empty:hidden">
            <InstallButton />
          </div>

          <div className="mt-3 flex flex-wrap gap-4 border-t border-white/10 pt-3 text-xs text-slate-400">
            {LIENS_LEGAUX.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className="hover:text-slate-300 pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center"
              >
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
 * Une entrée du plan : son nom, rien d'autre.
 *
 * Chaque entrée portait sous son nom une phrase qui disait ce qu'on trouve
 * sur la page. Le plan en devenait un texte à lire plutôt qu'une liste à
 * parcourir : il est revenu aux seuls noms. La phrase reste dans le plan du
 * site (config/navigation.ts) et s'affiche au survol, pour qui hésite entre
 * deux entrées.
 */
function Entree({ lien, courant }: { lien: LienDeMenu; courant: boolean }) {
  // L'action principale se distingue : c'est la seule entrée du plan qui dit
  // par où commencer, et elle doit se voir sans se lire. Lot P1 : par un filet
  // franc et l'encre forte, comme un bouton secondaire, et non plus par
  // l'orange ; l'entrée de la page courante, une position, prend le gris clair.
  const principale = lien.href === ACTION_PRINCIPALE.href;
  return (
    <Link
      href={lien.href}
      title={lien.aide}
      aria-current={courant ? "page" : undefined}
      className={`group block rounded-lg px-3 py-2 transition duration-[var(--duree-passage)] motion-reduce:transition-none ${
        principale
          ? "border border-white/25 hover:border-white/50 hover:bg-white/5"
          : `border-l-2 hover:bg-white/5 ${
              courant ? "border-slate-300 bg-white/5" : "border-transparent hover:border-white/35"
            }`
      }`}
    >
      <span
        className={`flex items-center justify-between gap-3 text-sm ${principale ? "font-semibold text-slate-50" : "font-medium text-slate-100"}`}
      >
        {lien.libelle}
        {/* La flèche de l'entrée principale avance d'un cheveu au survol :
            c'est le seul mouvement du plan, et il dit où l'on va. */}
        {principale ? (
          <span
            aria-hidden
            className="translate-x-0 text-slate-200 transition-transform duration-[var(--duree-passage)] group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
          >
            →
          </span>
        ) : null}
      </span>
    </Link>
  );
}
