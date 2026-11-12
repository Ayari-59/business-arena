"use client";

import Link from "next/link";
// Le chemin normalisé : `/index` (régénération de l'accueil sur Vercel) vaut `/`.
import { useCheminDeLaPage } from "@/lib/chemin-de-la-page";
import { useEffect, useRef, useState } from "react";
import { InstallButton } from "@/components/install-button";
import { bouton } from "@/components/bouton";
import { SiteLogo } from "@/components/site-logo";
import { liensDAcces, liensDeTete, NAVIGATION, type LienDeMenu } from "@/config/navigation";
// Les phrases des groupes s'écrivent avec des espaces ordinaires : l'insécable se pose au rendu.
import { insecables } from "@/lib/typographie";

/**
 * La barre de navigation.
 *
 * Elle alignait huit liens de même poids, tous marqués « masqué en dessous de
 * la barre des petits écrans » : sur téléphone, la navigation disparaissait
 * entièrement, sans rien pour la remplacer. Sur grand écran, elle disait tout
 * et donc plus rien, chaque page ayant exactement la même importance que la
 * suivante.
 *
 * Sur grand écran, les mots de la barre s'affichent À PLAT : un menu
 * horizontal direct, sans détour par un panneau. En dessous, ils se replient,
 * la barre d'un téléphone ne tient pas une rangée de liens. À toutes les
 * largeurs, un bouton « Menu » déplie le plan COMPLET, lu du registre : c'est
 * lui qui garantit qu'aucune page ne redevienne inatteignable, sur téléphone
 * comme sur grand écran, le jour où l'on en ajoutera une.
 *
 * LA LISIBILITÉ PASSE AVANT LE VERRE TEINTÉ. La barre a vécu à 55 % d'opacité
 * et le panneau à 85 % : sur un fond clair, sur une image, sur un tableau
 * dense, le texte du menu devenait illisible par endroits, et seulement par
 * endroits, le pire des défauts, celui qu'on ne reproduit pas à volonté. La
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
 * LA BARRE ET LE MENU DÉPLIÉ ONT LES MÊMES GROUPES (décision du propriétaire,
 * novembre 2026 : un menu par produit, un mot par entrée). La barre dit
 * Cours · Arène · Épisodes · Offres · Aide, chaque mot vers la page de son
 * produit ; le menu déplié pose les mêmes 5 mots, vers les mêmes pages, et
 * sous chacun ses entrées, d'un mot elles aussi ; sous le titre du cours, de
 * l'arène et des épisodes, une phrase dit ce qu'on y apprend. Les mentions
 * légales, les CGV et les CGU n'y sont pas : elles tiennent sur une petite
 * ligne, en bas du pied de page. Le menu d'avant comptait un
 * groupe de plus que la barre (« Élèves »), et un accordéon y cachait les
 * entrées : sur téléphone, où la barre ne montre pas ses mots, la page d'un
 * groupe qui n'est pas une de ses entrées (la présentation de l'arène, les
 * offres) n'aurait plus été atteignable. Les groupes sont donc dépliés, et
 * leur titre est le lien. À droite de la barre, et en tête du menu déplié,
 * deux portes, une par public : Rejoindre (le code d'une partie) et Connexion
 * (l'espace enseignant), pour que ni l'élève ni l'enseignant n'ait à chercher.
 */
export function SiteHeader() {
  const chemin = useCheminDeLaPage();
  const [ouvert, setOuvert] = useState(false);
  const cadre = useRef<HTMLElement>(null);
  // Dans l'arène, la page est plus large (1 400 px) : la barre s'aligne sur
  // ses bords, sinon le logo et le menu flottent en retrait sur grand écran.
  const enJeu = chemin?.startsWith("/arena/") ?? false;
  // LA PROJECTION N'A PAS DE BARRE DU SITE. C'est l'écran qu'on montre à la
  // classe : les mots du site ou la connexion n'y disent rien aux élèves et
  // prennent le haut de l'image. La page porte sa propre navigation, dont le
  // retour au pilotage.
  // Le code d'une cohorte projeté (/teacher/cohortes/…/projection) suit la même règle, comme celui
  // d'une classe du cours (/teacher/cours/…/code ; audit UX du 11 novembre 2026, P2-9).
  const enProjection = /^\/teacher\/(?:(?:games|cohortes)\/[^/]+\/projection|cours\/[^/]+\/code)(\/|$)/.test(
    chemin ?? "",
  );
  const largeur = enJeu ? "max-w-[1400px]" : "max-w-6xl";
  // Les mots de la barre : un par groupe, et les mêmes, vers les mêmes pages, en tête des
  // groupes du menu déplié.
  const mots = liensDeTete();

  // Un menu qui reste ouvert derrière la page qu'on vient d'appeler masque
  // cette page. On le referme donc au changement d'adresse, à la touche
  // d'échappement, et au clic à côté.
  useEffect(() => setOuvert(false), [chemin]);
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

  // Dans la barre, un mot se marque sur sa page et sur les pages sous elle : « Épisodes » sur le
  // profil des épisodes. Ses 5 adresses ne se recouvrent pas.
  const estCourant = (href: string) => chemin === href || chemin.startsWith(`${href}/`);
  // Dans le menu déplié, seule l'adresse la PLUS PRÉCISE se marque : sur le catalogue des épisodes
  // (/entreprises/episode), « Catalogue » et non aussi « Métiers » (/entreprises), qui est d'un
  // autre groupe. Une ancre ne se marque jamais : le chemin de la page n'en porte pas.
  const laPlusPrecise = [...mots, ...liensDAcces(), ...NAVIGATION.flatMap((g) => g.liens)]
    .map((l) => l.href)
    .filter(estCourant)
    .sort((a, b) => b.length - a.length)[0];
  const estCourantDansLeMenu = (href: string) => href === laPlusPrecise;

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

        {/* Les mots de la barre, à plat sur grand écran : un menu horizontal
            direct. Sous lg, ils se replient dans le panneau « Menu », qui reste
            le plan COMPLET à toutes les largeurs. L'installation y vit aussi ;
            le thème, lui, est remonté dans la barre : on ne choisit pas une
            apparence derrière un panneau qui cache la page. */}
        {/* EN PARTIE, LA VITRINE S'EFFACE.
            L'élève jouait avec quatre sorties qui ne le concernent pas
            au-dessus de la tête, sur l'écran où il doit décider. Dans l'arène,
            la barre ne garde que le logo et le plan complet : celui-ci reste, il
            est la garantie qu'aucune page ne devienne inatteignable. L'état de
            la partie, lui, est porté par le bandeau de jeu de la page. */}
        <div className="flex items-center justify-end gap-1.5">
          {enJeu ? null : (
          <ul className="hidden items-center gap-0.5 lg:flex">
            {mots.map((lien) => (
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
                      alourdissait une barre qui en compte cinq. Le trait dit
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

          {/* Les deux portes d'entrée, une par public : un filet les sépare de
              ce qui ne fait qu'informer. */}
          {enJeu ? null : (
            <span aria-hidden className="mx-1 hidden h-5 w-px bg-white/10 lg:block" />
          )}
          {enJeu ? null : (
          <div className="hidden items-center gap-1.5 lg:flex">
            {liensDAcces().map((lien) => (
              <Porte key={lien.href} lien={lien} courant={estCourant(lien.href)} />
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
          {/* LES DEUX PORTES EN TÊTE, ET RIEN D'AUTRE : le code de l'élève et
              l'espace enseignant, les mêmes boutons qu'à droite de la barre.
              Sur téléphone, c'est le seul endroit où ils sont. */}
          <div data-portes-du-menu="" className="grid grid-cols-2 gap-2 border-b border-white/10 pb-3">
            {liensDAcces().map((lien) => (
              <Porte key={lien.href} lien={lien} courant={estCourantDansLeMenu(lien.href)} className="w-full pointer-coarse:min-h-11" />
            ))}
          </div>
          {/* LES CINQ GROUPES, dépliés : le mot de la barre en titre, vers la
              même page, puis, pour le cours, l'arène et les épisodes, la phrase
              qui dit ce qu'on y fait (la pédagogie, en texte discret : pas une
              entrée ; discret par l'encre, en 14 px comme toute prose de second
              plan, tests/architecture/echelle-typographique.test.ts), et ses
              entrées, d'un mot chacune. Le filet occupe ce que le
              titre laisse : c'est ce qui distingue un groupe d'une entrée, sans
              l'écrire. */}
          <div className="mt-2 space-y-2">
            {NAVIGATION.map((groupe, i) => {
              const titre = mots[i]!;
              return (
                <div key={groupe.code} data-groupe-du-menu={groupe.code}>
                  <div className="flex items-center gap-3">
                    <Link
                      id={`menu-${groupe.code}`}
                      href={titre.href}
                      title={titre.aide}
                      data-titre-du-groupe=""
                      aria-current={estCourantDansLeMenu(titre.href) ? "page" : undefined}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-50 underline-offset-4 transition duration-[var(--duree-passage)] hover:bg-white/5 motion-reduce:transition-none pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center ${
                        estCourantDansLeMenu(titre.href) ? "underline decoration-slate-300" : ""
                      }`}
                    >
                      {titre.libelle}
                    </Link>
                    <span aria-hidden className="h-px flex-1 bg-white/10" />
                  </div>
                  {groupe.phrase ? (
                    <p data-phrase-du-groupe="" className="px-3 pb-1 text-sm leading-relaxed text-slate-400">
                      {insecables(groupe.phrase)}
                    </p>
                  ) : null}
                  {/* La liste porte le nom de son groupe pour une synthèse vocale. */}
                  <ul aria-labelledby={`menu-${groupe.code}`} className="flex flex-wrap gap-x-1 gap-y-0.5">
                    {groupe.liens.map((lien) => (
                      <li key={lien.href}>
                        <Entree lien={lien} courant={estCourantDansLeMenu(lien.href)} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* L'installation, et rien d'autre : le réglage d'apparence est monté
              dans la barre, et une rubrique « Réglages » qui n'aurait plus
              qu'une ligne (absente la plupart du temps, puisque l'invite
              d'installation ne se montre que sur certains appareils) était un
              titre au-dessus du vide. Le bouton se nomme lui-même.

              `empty:hidden` : le composant ne rend rien quand l'appareil ne
              sait pas installer, et le filet disparaît alors avec lui. */}
          <div className="mt-3 border-t border-white/10 px-3 pt-3 empty:hidden">
            <InstallButton />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Une porte d'entrée : à droite de la barre et en tête du menu déplié, la même.
 * Deux boutons SECONDAIRES de la maison (lot P1) au départ, puis UN SEUL CADRE
 * D'ACTION DANS LA BARRE (lot P2) : l'élève qui a un code garde le filet,
 * l'enseignant un lien souligné, comme les mots à sa gauche. Le seul bouton
 * plein du premier écran reste « Tester le simulateur » (lot P6), dans le
 * héros. Le mot se voit ; le nom (`nom`), plus long, se lit à la synthèse
 * vocale, et commence par le mot.
 */
function Porte({ lien, courant, className = "" }: { lien: LienDeMenu; courant: boolean; className?: string }) {
  return (
    <Link
      href={lien.href}
      title={lien.aide}
      aria-label={lien.nom}
      aria-current={courant ? "page" : undefined}
      className={`${
        lien.acces === "eleve"
          ? bouton({ variante: "secondaire", taille: "m" })
          : `${bouton({ variante: "lien", taille: "m" })} px-2`
      } ${className}`}
    >
      {lien.libelle}
    </Link>
  );
}

/**
 * Une entrée du plan : son mot, rien d'autre.
 *
 * Chaque entrée portait sous son nom une phrase qui disait ce qu'on trouve
 * sur la page, puis une phrase en guise de nom. Le plan en devenait un texte à
 * lire plutôt qu'une liste à parcourir : il est revenu à un mot par entrée. La
 * phrase reste dans le plan du site (config/navigation.ts) et s'affiche au
 * survol, pour qui hésite entre deux entrées. La page courante porte le filet
 * gris clair d'une POSITION.
 */
function Entree({ lien, courant }: { lien: LienDeMenu; courant: boolean }) {
  return (
    <Link
      href={lien.href}
      title={lien.aide}
      aria-current={courant ? "page" : undefined}
      className={`block rounded-lg border-l-2 px-3 py-1.5 text-sm font-medium transition duration-[var(--duree-passage)] hover:bg-white/5 motion-reduce:transition-none pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center ${
        courant
          ? "border-slate-300 bg-white/5 text-slate-50"
          : "border-transparent text-slate-200 hover:border-white/35 hover:text-slate-50"
      }`}
    >
      {lien.libelle}
    </Link>
  );
}
