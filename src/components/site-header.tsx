"use client";

import Link from "next/link";
import { flushSync } from "react-dom";
// Le chemin normalisé : `/index` (régénération de l'accueil sur Vercel) vaut `/`.
import { useCheminDeLaPage } from "@/lib/chemin-de-la-page";
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type MouseEvent, type PointerEvent } from "react";
import { InstallButton } from "@/components/install-button";
import { bouton } from "@/components/bouton";
import { BoutonDeDeconnexion } from "@/components/bouton-de-deconnexion";
import { Icone, type NomDIcone } from "@/components/icone";
import { Chevron } from "@/components/repliable";
import { SiteLogo } from "@/components/site-logo";
import {
  liensDAcces,
  NAVIGATION,
  phraseCourte,
  type EntreeDeMenu,
  type GroupeDeMenu,
  type LienDeMenu,
} from "@/config/navigation";
// Les phrases et les lignes s'écrivent avec des espaces ordinaires : l'insécable se pose au rendu.
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
 * LA LISIBILITÉ PASSE AVANT LE VERRE TEINTÉ. La barre a vécu à 55 % d'opacité
 * et le panneau à 85 % : sur un fond clair, sur une image, sur un tableau
 * dense, le texte du menu devenait illisible par endroits, et seulement par
 * endroits, le pire des défauts, celui qu'on ne reproduit pas à volonté. La
 * barre et ses panneaux sont donc pleins : un menu se lit par-dessus
 * n'importe quoi.
 *
 * LA BARRE EST MARINE, ET OPAQUE. L'habillage « L'arène » pose le marine là où
 * l'œil se repère : l'en-tête en est le premier endroit, sur toutes les pages.
 * Elle prend donc la matière du tableau (`ardoise`), qui retourne l'échelle
 * pour elle seule : ses classes, écrites pour un fond sombre, s'y lisent
 * telles quelles, et le logo y prend sa version blanche.
 *
 * UN MENU PAR PRODUIT, UN MOT PAR ENTRÉE (décision du propriétaire, novembre
 * 2026). La barre dit Cours · Arène · Épisodes · Offres · Aide, puis les deux
 * portes, une par public : Rejoindre (le code d'une partie) et Connexion
 * (l'espace enseignant), pour que ni l'élève ni l'enseignant n'ait à chercher.
 * Les mentions légales, les CGV et les CGU n'y sont pas : elles tiennent sur
 * une petite ligne, en bas du pied de page.
 *
 * UN PANNEAU PAR MOT (le propriétaire, 12 novembre 2026, la maquette A : « le
 * menu n'est pas au top visuellement »). Sur grand écran, là où la barre
 * montre ses mots, plus de bouton « Menu » : chaque mot est un bouton qui
 * ouvre SON panneau, sur toute la largeur, collé sous la barre. À gauche, le
 * pictogramme du produit, son nom, sa phrase (la pédagogie en avant) et un
 * bouton plein vers sa page ; à droite, chaque entrée en carte : son
 * pictogramme, son mot, et une ligne qui dit à quoi elle sert. Le panneau
 * s'ouvre au survol après un court délai, au clic et au clavier ; un seul à la
 * fois ; Échap le ferme et rend le focus au mot ; un clic dehors, un
 * changement de page ou la sortie du panneau au clavier le ferment. C'est le
 * motif « disclosure navigation » : un bouton qui dit s'il est déplié
 * (`aria-expanded`) et ce qu'il déplie (`aria-controls`), un panneau de liens,
 * et pas de `role="menu"`, qui promettrait les flèches d'un menu
 * d'application.
 *
 * SUR TÉLÉPHONE, là où la barre ne montre pas ses mots, « Menu » ouvre la
 * liste des 5 groupes, Rejoindre et Connexion en tête : pictogramme, nom,
 * phrase courte, chevron. Toucher un groupe montre ce que son panneau montre,
 * en colonne : son bouton vers sa page, puis ses entrées avec leur ligne ;
 * « Retour » ramène à la liste sans fermer le menu. C'est par là que les
 * pages des groupes qui ne sont l'entrée d'aucun groupe (la présentation de
 * l'arène, les offres) restent atteignables au doigt.
 *
 * UNE FOIS CONNECTÉ, « CONNEXION » DEVIENT « DÉCONNEXION » (le propriétaire,
 * novembre 2026 : « Il me faut un bouton déconnexion quand je suis connecté »),
 * à la même place, dans la barre et en tête du menu du téléphone. « Connecté »
 * veut dire une session enseignant, qui est aussi celle du référent d'un
 * établissement et de l'administrateur ; un élève qui joue par code n'en a
 * pas. La barre ne sait que cela, en un booléen lu au serveur par la mise en
 * page (`estConnecte`, lib/session.ts) : ni l'identifiant ni le nom ne lui
 * parviennent.
 */

/**
 * LES TEMPS DU SURVOL (ce ne sont pas des animations : rien ne bouge pendant
 * eux). Passer sur un mot en allant ailleurs n'ouvre rien : il faut s'y poser
 * un court instant. D'un mot à l'autre, panneau déjà ouvert, la bascule est
 * plus vive. La souris qui sort de la barre et du panneau a un instant pour y
 * revenir, le temps d'un geste trop large.
 */
const DELAI_D_OUVERTURE = 150;
const DELAI_DE_BASCULE = 90;
const DELAI_DE_FERMETURE = 300;

/** Le panneau ouvert sur grand écran : son groupe, et ce qui l'a ouvert. */
interface PanneauOuvert {
  code: string;
  /**
   * Épinglé par un clic (ou au clavier), il reste jusqu'à un clic dehors, Échap,
   * un second clic sur son mot ou un changement de page ; ouvert au survol, il
   * se referme aussi quand la souris s'en va.
   */
  epingle: boolean;
  /**
   * Le survol vient de l'amener (ouvert, ou basculé d'un mot à l'autre) : un
   * clic sur son mot l'épingle au lieu de le refermer, par surprise, sous la
   * main qui venait de le faire apparaître.
   */
  auSurvol: boolean;
  /** Il s'ouvre depuis une barre fermée : lui seul entre en fondu, pas la bascule d'un mot à l'autre. */
  depuisFerme: boolean;
}

/** Les adresses que la page ouverte peut marquer : la page de chaque groupe, ses entrées, les portes. */
const ADRESSES_DU_PLAN = [
  ...NAVIGATION.flatMap((g) => [g.entree, ...g.liens.map((l) => l.href)]),
  ...liensDAcces().map((l) => l.href),
];

export function SiteHeader({ connecte = false }: { connecte?: boolean }) {
  const chemin = useCheminDeLaPage() ?? "";
  // Le panneau ouvert sur grand écran (un seul à la fois).
  const [panneau, setPanneau] = useState<PanneauOuvert | null>(null);
  // Le menu du téléphone (le bouton « Menu ») : ouvert ou non, et le groupe qu'on y a ouvert.
  const [ouvert, setOuvert] = useState(false);
  const [groupeOuvert, setGroupeOuvert] = useState<string | null>(null);
  // Le bas de la barre, mesuré à l'ouverture : sur téléphone, le menu prend tout l'écran sous elle.
  const [basDeLaBarre, setBasDeLaBarre] = useState<number | null>(null);
  const cadre = useRef<HTMLElement>(null);
  const barre = useRef<HTMLElement>(null);
  const boutonDuMenu = useRef<HTMLButtonElement>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Le dernier geste : le clavier ou un pointeur. Seul le focus qui part AU CLAVIER referme.
  const geste = useRef<"clavier" | "pointeur">("pointeur");

  // UN MENU RESTÉ OUVERT DERRIÈRE LA PAGE QU'ON VIENT D'APPELER MASQUE CETTE
  // PAGE : il se referme au changement d'adresse (ici, au rendu même qui le
  // découvre), à la touche d'échappement et au clic à côté.
  const [cheminVu, setCheminVu] = useState(chemin);
  if (cheminVu !== chemin) {
    setCheminVu(chemin);
    setPanneau(null);
    setOuvert(false);
    setGroupeOuvert(null);
  }

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

  const fermerLeMenu = () => {
    setOuvert(false);
    setGroupeOuvert(null);
  };

  useEffect(() => {
    const clavier = () => {
      geste.current = "clavier";
    };
    const pointeur = () => {
      geste.current = "pointeur";
    };
    document.addEventListener("keydown", clavier, true);
    document.addEventListener("pointerdown", pointeur, true);
    const attente = minuterie;
    return () => {
      document.removeEventListener("keydown", clavier, true);
      document.removeEventListener("pointerdown", pointeur, true);
      if (attente.current !== null) clearTimeout(attente.current);
    };
  }, []);

  useEffect(() => {
    if (!panneau && !ouvert) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Le focus revient au mot (ou au bouton « Menu ») s'il était dans la barre, ou nulle part :
      // un champ de la page qu'on remplissait le garde.
      const actif = document.activeElement;
      const rendre = !actif || actif === document.body || !!cadre.current?.contains(actif);
      if (panneau) {
        setPanneau(null);
        if (rendre) document.getElementById(`mot-${panneau.code}`)?.focus();
      }
      if (ouvert) {
        setOuvert(false);
        setGroupeOuvert(null);
        if (rendre) boutonDuMenu.current?.focus();
      }
    };
    const aCote = (e: globalThis.MouseEvent) => {
      if (cadre.current?.contains(e.target as Node)) return;
      setPanneau(null);
      setOuvert(false);
      setGroupeOuvert(null);
    };
    document.addEventListener("keydown", auClavier);
    document.addEventListener("mousedown", aCote);
    return () => {
      document.removeEventListener("keydown", auClavier);
      document.removeEventListener("mousedown", aCote);
    };
  }, [panneau, ouvert]);

  // Sur téléphone, le menu va du bas de la barre au bas de l'écran : la mesure suit la fenêtre
  // (un téléphone qu'on tourne).
  useEffect(() => {
    if (!ouvert) return;
    const mesurer = () => setBasDeLaBarre(barre.current?.getBoundingClientRect().bottom ?? null);
    window.addEventListener("resize", mesurer);
    return () => window.removeEventListener("resize", mesurer);
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

  // LA PAGE OÙ L'ON EST. Seule l'adresse la PLUS PRÉCISE se marque : sur le catalogue des épisodes
  // (/entreprises/episode), « Catalogue » et non aussi « Métiers » (/entreprises), qui est d'un
  // autre groupe ; une page sous elle compte aussi (« Épisodes » sur le profil des épisodes). Une
  // ancre ne se marque jamais : le chemin de la page n'en porte pas. Le mot du groupe où l'on est
  // garde sa marque dans la barre, panneau ouvert ou non.
  const estSous = (href: string) => chemin === href || chemin.startsWith(`${href}/`);
  const laPlusPrecise = ADRESSES_DU_PLAN.filter(estSous).sort((a, b) => b.length - a.length)[0];
  const estCourant = (href: string) => href === laPlusPrecise;
  const groupeCourant = NAVIGATION.find(
    (g) => g.entree === laPlusPrecise || g.liens.some((l) => l.href === laPlusPrecise),
  )?.code;

  // LE SURVOL, À LA SOURIS SEULEMENT : un doigt sur une tablette touche, il ne survole pas.
  const annuler = () => {
    if (minuterie.current !== null) clearTimeout(minuterie.current);
    minuterie.current = null;
  };
  const plusTard = (delai: number, faire: () => void) => {
    annuler();
    minuterie.current = setTimeout(() => {
      minuterie.current = null;
      faire();
    }, delai);
  };
  const ouvrirAuSurvol = (code: string) =>
    setPanneau((avant) =>
      avant
        ? avant.code === code
          ? avant
          : { code, epingle: avant.epingle, auSurvol: true, depuisFerme: false }
        : { code, epingle: false, auSurvol: true, depuisFerme: true },
    );
  const surLeMot = (e: PointerEvent, code: string) => {
    if (e.pointerType !== "mouse") return;
    if (panneau?.code === code) return annuler();
    plusTard(panneau ? DELAI_DE_BASCULE : DELAI_D_OUVERTURE, () => ouvrirAuSurvol(code));
  };
  const horsDuMot = (e: PointerEvent) => {
    if (e.pointerType === "mouse") annuler();
  };
  const horsDeLaBarre = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (!panneau || panneau.epingle) return annuler();
    plusTard(DELAI_DE_FERMETURE, () => setPanneau((p) => (p && !p.epingle ? null : p)));
  };

  // LE CLIC (et le clavier, Entrée ou Espace, qui cliquent le bouton). Un clic sur le mot d'un
  // panneau que le survol vient d'amener l'ÉPINGLE : il reste ouvert, il ne se referme pas par
  // surprise sous la main qui venait de le faire apparaître. Un second clic le referme.
  const auClicDuMot = (code: string) => {
    annuler();
    setPanneau((avant) => {
      if (avant?.code === code) return avant.auSurvol ? { ...avant, epingle: true, auSurvol: false } : null;
      return { code, epingle: true, auSurvol: false, depuisFerme: avant === null };
    });
  };

  // LA SORTIE AU CLAVIER. Le focus qui quitte le mot et son panneau, à la tabulation, referme le
  // panneau : il se poserait sinon sur la page, panneau ouvert par-dessus.
  const horsDuPanneau = (e: FocusEvent<HTMLLIElement>, code: string) => {
    if (geste.current !== "clavier" || panneau?.code !== code) return;
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPanneau(null);
  };
  const horsDuMenu = (e: FocusEvent<HTMLElement>) => {
    if (geste.current !== "clavier" || !ouvert) return;
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) fermerLeMenu();
  };
  // Un lien suivi referme ce qui le portait, même vers la page où l'on est déjà (une ancre).
  const auLienSuivi = (e: MouseEvent, fermer: () => void) => {
    if ((e.target as Element).closest("a")) fermer();
  };

  const basculerLeMenu = () => {
    if (ouvert) return fermerLeMenu();
    setBasDeLaBarre(barre.current?.getBoundingClientRect().bottom ?? null);
    setOuvert(true);
  };
  // Un groupe ouvert dans le menu du téléphone : le focus passe à son « Retour », et revient au
  // groupe quand on revient à la liste. Sans cela, il resterait sur un bouton qui disparaît.
  const ouvrirLeGroupe = (code: string) => {
    flushSync(() => setGroupeOuvert(code));
    document.getElementById(`plan-${code}-retour`)?.focus();
  };
  const revenirALaListe = (code: string) => {
    flushSync(() => setGroupeOuvert(null));
    document.getElementById(`plan-groupe-${code}`)?.focus();
  };

  return (
    <header
      ref={cadre}
      data-en-tete-du-site
      onBlur={horsDuMenu}
      // Menu ouvert, l'en-tête passe devant la barre d'action du téléphone (`z-40`, posée après lui) :
      // le menu va jusqu'au bas de l'écran, elle en aurait couvert la fin.
      className={`ardoise sticky top-0 ${ouvert ? "z-50" : "z-40"} border-b border-white/10 bg-slate-950 print:static print:bg-transparent print:hidden ${
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
      {/* Sous un panneau ouvert, la page s'assombrit (la maquette A) : l'œil va au panneau. Le voile
          ne retient aucun clic, qui passe à la page et referme le panneau. */}
      {panneau ? (
        <div
          aria-hidden
          data-voile-du-panneau=""
          className={`pointer-events-none fixed inset-0 z-30 hidden bg-slate-950/50 lg:block ${
            panneau.depuisFerme ? "motion-safe:animate-carte-fondu" : ""
          }`}
        />
      ) : null}
      <nav
        ref={barre}
        aria-label="Navigation principale"
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") annuler();
        }}
        onPointerLeave={horsDeLaBarre}
        className="relative z-40"
      >
        {/* La rangée a le droit de passer à la ligne. Sans cela, un bouton qui
            apparaît pousse la fin de la barre hors de l'écran, et personne ne
            le voit depuis un ordinateur de bureau. */}
        <div
          data-rangee-de-la-barre=""
          className={`mx-auto flex ${largeur} flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3.5 sm:px-6`}
        >
          <div className="flex items-center gap-2.5">
            <Link href="/" aria-label="Accueil" className="pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center">
              <SiteLogo className="h-6 w-[7.5rem] sm:h-8 sm:w-40" />
            </Link>
          </div>

          {/* Les mots de la barre, sur grand écran : un par groupe, chacun suivi de son panneau dans
              le document, pour que la tabulation passe du mot à ce qu'il ouvre. Sous lg, ils se
              replient dans le menu du téléphone. */}
          {/* EN PARTIE, LA VITRINE S'EFFACE.
              L'élève jouait avec quatre sorties qui ne le concernent pas
              au-dessus de la tête, sur l'écran où il doit décider. Dans l'arène,
              la barre ne garde que le logo et le menu : celui-ci reste, il est
              la garantie qu'aucune page ne devienne inatteignable. L'état de
              la partie, lui, est porté par le bandeau de jeu de la page. */}
          <div className="flex items-center justify-end gap-1.5">
            {enJeu ? null : (
            <ul className="hidden items-center gap-0.5 lg:flex">
              {NAVIGATION.map((groupe) => {
                const deplie = panneau?.code === groupe.code;
                const courant = groupeCourant === groupe.code;
                return (
                  <li key={groupe.code} onBlur={(e) => horsDuPanneau(e, groupe.code)}>
                    <button
                      type="button"
                      id={`mot-${groupe.code}`}
                      data-mot-de-la-barre={groupe.code}
                      aria-expanded={deplie}
                      aria-controls={`panneau-${groupe.code}`}
                      aria-current={courant ? "true" : undefined}
                      onClick={() => auClicDuMot(groupe.code)}
                      onPointerEnter={(e) => surLeMot(e, groupe.code)}
                      onPointerLeave={horsDuMot}
                      className={`group relative block cursor-pointer px-3 py-1.5 text-sm font-medium transition-colors ${
                        deplie || courant ? "text-white" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {groupe.titre}
                      {/* Le mot du panneau ouvert porte un trait plein et épais (la maquette A) ; le
                          mot du groupe où l'on est garde son trait fin ; les autres le font naître du
                          centre au survol. Le trait dit une POSITION : clair, jamais l'orange (lot P1). */}
                      <span
                        aria-hidden
                        className={`absolute inset-x-3 bottom-0.5 origin-center transition-transform duration-[var(--duree-passage)] motion-reduce:transition-none ${
                          deplie
                            ? "h-0.5 scale-x-100 bg-white"
                            : courant
                              ? "h-px scale-x-100 bg-slate-300"
                              : "h-px scale-x-0 bg-slate-300 group-hover:scale-x-100"
                        }`}
                      />
                    </button>
                    <PanneauDuGroupe
                      groupe={groupe}
                      deplie={deplie}
                      entre={deplie && panneau.depuisFerme}
                      estCourant={estCourant}
                      onClick={(e) => auLienSuivi(e, () => setPanneau(null))}
                    />
                  </li>
                );
              })}
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
                <Porte key={lien.href} lien={lien} courant={estCourant(lien.href)} connecte={connecte} />
              ))}
            </div>
            )}

            {/* « Menu », là où la barre ne montre pas ses mots : sur téléphone et sur tablette, et
                dans l'arène à toutes les largeurs, où la barre ne garde que lui. */}
            <button
              ref={boutonDuMenu}
              type="button"
              onClick={basculerLeMenu}
              aria-expanded={ouvert}
              aria-controls="plan-du-site"
              className={`flex cursor-pointer items-center gap-2 rounded-lg border bg-slate-900 px-2.5 py-1.5 text-xs transition duration-[var(--duree-passage)] motion-reduce:transition-none pointer-coarse:min-h-11 pointer-coarse:px-3.5 pointer-coarse:text-sm ${
                enJeu ? "" : "lg:hidden"
              } ${
                ouvert
                  ? "border-white/40 text-white"
                  : "border-white/10 text-slate-300 hover:border-white/35 hover:text-slate-100"
              }`}
            >
              {/* Trois filets qui se croisent quand le menu s'ouvre : le bouton
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
        </div>

        {/* LE MENU DU TÉLÉPHONE. Sous la barre, il prend l'écran jusqu'en bas ; sur tablette et dans
            l'arène, il reste une carte de coin. Il défile dans son propre cadre : sans cela, les
            dernières entrées ne s'atteindraient qu'en faisant défiler la page DERRIÈRE lui. */}
        <div
          id="plan-du-site"
          hidden={!ouvert}
          onClick={(e) => auLienSuivi(e, fermerLeMenu)}
          style={basDeLaBarre === null ? undefined : ({ "--bas-de-la-barre": `${basDeLaBarre}px` } as CSSProperties)}
          className={`absolute inset-x-0 top-full overflow-y-auto overscroll-contain bg-slate-900 max-sm:h-[calc(100dvh_-_var(--bas-de-la-barre,4.5rem))] sm:left-auto sm:right-6 sm:max-h-[calc(100dvh_-_5rem)] sm:w-[26rem] sm:carte ${
            enJeu ? "" : "lg:hidden"
          } ${ouvert ? "motion-safe:animate-plan-ouvre" : ""}`}
        >
          <div className="px-4 pb-8 pt-4 sm:p-4">
            {/* LA LISTE DES GROUPES, les deux portes en tête, et rien d'autre : le code de l'élève et
                l'espace enseignant, les mêmes boutons qu'à droite de la barre. Sur téléphone, c'est
                le seul endroit où ils sont. */}
            <div data-liste-des-groupes="" hidden={groupeOuvert !== null} className="motion-safe:animate-carte-fondu">
              <div data-portes-du-menu="" className="grid grid-cols-2 gap-2">
                {liensDAcces().map((lien) => (
                  <Porte
                    key={lien.href}
                    lien={lien}
                    courant={estCourant(lien.href)}
                    connecte={connecte}
                    className="w-full pointer-coarse:min-h-11"
                  />
                ))}
              </div>
              <ul className="mt-4 border-t border-white/10">
                {NAVIGATION.map((groupe) => (
                  <li key={groupe.code} className="border-b border-white/10">
                    <RangeeDuGroupe
                      groupe={groupe}
                      courant={groupeCourant === groupe.code}
                      onClick={() => ouvrirLeGroupe(groupe.code)}
                    />
                  </li>
                ))}
              </ul>
              {/* L'installation, sur les appareils qui savent installer. `empty:hidden` : le
                  composant ne rend rien ailleurs, et la marge disparaît avec lui. */}
              <div className="mt-4 empty:hidden">
                <InstallButton />
              </div>
            </div>
            {NAVIGATION.map((groupe) => (
              <GroupeDuMenu
                key={groupe.code}
                groupe={groupe}
                deplie={groupeOuvert === groupe.code}
                estCourant={estCourant}
                onRetour={() => revenirALaListe(groupe.code)}
              />
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

/**
 * Une porte d'entrée : à droite de la barre et en tête du menu du téléphone,
 * la même. Deux boutons SECONDAIRES de la maison (lot P1) au départ, puis UN
 * SEUL CADRE D'ACTION DANS LA BARRE (lot P2) : l'élève qui a un code garde le
 * filet, l'enseignant un lien souligné, comme les mots à sa gauche. Le mot se
 * voit ; le nom (`nom`), plus long, se lit à la synthèse vocale, et commence
 * par le mot.
 *
 * Une fois connecté, la porte de l'enseignant est la sortie : « Déconnexion »,
 * sous la même forme et à la même place (components/bouton-de-deconnexion.tsx).
 * La porte de l'élève ne change pas.
 */
function Porte({
  lien,
  courant,
  connecte,
  className = "",
}: {
  lien: LienDeMenu;
  courant: boolean;
  connecte: boolean;
  className?: string;
}) {
  const forme = `${
    lien.acces === "eleve"
      ? bouton({ variante: "secondaire", taille: "m" })
      : `${bouton({ variante: "lien", taille: "m" })} px-2`
  } ${className}`;
  if (connecte && lien.acces === "enseignant") return <BoutonDeDeconnexion className={forme} />;
  return (
    <Link
      href={lien.href}
      title={lien.aide}
      aria-label={lien.nom}
      aria-current={courant ? "page" : undefined}
      className={forme}
    >
      {lien.libelle}
    </Link>
  );
}

/**
 * Le pictogramme d'un produit ou d'une entrée, dans sa case : la liste fermée
 * du site (components/icone.tsx), à l'encre claire. L'orange ne dit que
 * l'action (lot P1) : la maquette posait des pictogrammes orange, la charte
 * du site prime.
 */
function Pictogramme({ nom, grand = false }: { nom: NomDIcone; grand?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-lg bg-white/[0.06] text-slate-200 ring-1 ring-white/10 ring-inset ${
        grand ? "h-11 w-11" : "h-9 w-9"
      }`}
    >
      <Icone nom={nom} className={grand ? "h-6 w-6" : "h-5 w-5"} />
    </span>
  );
}

/**
 * LE BOUTON D'UN GROUPE, vers sa page : « Voir les diplômes ». Le bouton plein
 * de la maison, le seul de son panneau.
 */
function Appel({ groupe, courant, className = "" }: { groupe: GroupeDeMenu; courant: boolean; className?: string }) {
  return (
    <Link
      href={groupe.entree}
      data-appel-du-groupe={groupe.code}
      aria-current={courant ? "page" : undefined}
      className={`${bouton({ variante: "principal", taille: "m" })} ${className}`}
    >
      {groupe.appel}
    </Link>
  );
}

/**
 * LE PANNEAU D'UN MOT, sur grand écran (la maquette A) : toute la largeur,
 * collé sous la barre. À gauche, le produit : son pictogramme, son nom, sa
 * phrase (le cours, l'arène et les épisodes en ont une ; discrète par
 * l'encre) et son bouton. À droite, ses entrées en cartes, deux ou trois de
 * front : chaque carte est un lien dont le NOM est le mot (`aria-labelledby`)
 * et dont la ligne est la description (`aria-describedby`).
 */
function PanneauDuGroupe({
  groupe,
  deplie,
  entre,
  estCourant,
  onClick,
}: {
  groupe: GroupeDeMenu;
  deplie: boolean;
  entre: boolean;
  estCourant: (href: string) => boolean;
  onClick: (e: MouseEvent) => void;
}) {
  const id = `panneau-${groupe.code}`;
  // Deux ou quatre cartes se rangent deux par deux ; trois, cinq ou six, trois par trois à partir de
  // 1 280 px (la maquette), deux par deux en dessous, où trois cartes de front n'auraient plus la
  // largeur d'une ligne en deux lignes.
  const colonnes = groupe.liens.length === 2 || groupe.liens.length === 4 ? "grid-cols-2" : "grid-cols-2 xl:grid-cols-3";
  return (
    <div
      id={id}
      data-panneau-du-groupe={groupe.code}
      hidden={!deplie}
      onClick={onClick}
      className={`absolute inset-x-0 top-full border-b border-white/10 bg-slate-900 shadow-[var(--ombre-carte)] ${
        entre ? "motion-safe:animate-panneau-ouvre" : ""
      }`}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-10 px-6 py-8">
        <div>
          <Pictogramme nom={groupe.icone} grand />
          <p id={`${id}-nom`} className="mt-4 text-2xl font-semibold text-slate-50">
            {groupe.titre}
          </p>
          {groupe.phrase ? (
            <p data-phrase-du-groupe="" className="mt-2 text-base leading-relaxed text-slate-400">
              {insecables(groupe.phrase)}
            </p>
          ) : null}
          <Appel groupe={groupe} courant={estCourant(groupe.entree)} className="mt-5" />
          {/* L'installation de l'application, sur les ordinateurs qui savent installer : sans
              bouton « Menu » sur grand écran, l'aide la porte. */}
          {groupe.code === "aide" ? (
            <div className="mt-3 empty:hidden">
              <InstallButton />
            </div>
          ) : null}
        </div>
        <ul aria-labelledby={`${id}-nom`} className={`grid content-start gap-3.5 ${colonnes}`}>
          {groupe.liens.map((lien, i) => (
            <li key={lien.href}>
              <CarteDEntree id={`${id}-${i}`} lien={lien} courant={estCourant(lien.href)} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Une entrée en carte, dans le panneau : son pictogramme, son mot, sa ligne. */
function CarteDEntree({ id, lien, courant }: { id: string; lien: EntreeDeMenu; courant: boolean }) {
  return (
    <Link
      href={lien.href}
      data-entree-du-panneau={lien.href}
      aria-labelledby={`${id}-mot`}
      aria-describedby={`${id}-ligne`}
      aria-current={courant ? "page" : undefined}
      className={`flex h-full flex-col rounded-lg border p-4 transition-colors duration-[var(--duree-passage)] motion-reduce:transition-none ${
        courant ? "border-slate-300/70 bg-white/[0.07]" : "border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]"
      }`}
    >
      <Pictogramme nom={lien.icone} />
      <span id={`${id}-mot`} className="mt-3 text-base font-semibold text-slate-50">
        {lien.libelle}
      </span>
      <span id={`${id}-ligne`} data-ligne-de-l-entree="" className="mt-1 text-sm leading-snug text-slate-400">
        {insecables(lien.ligne)}
      </span>
    </Link>
  );
}

/**
 * UN GROUPE DANS LA LISTE DU TÉLÉPHONE (la maquette A) : son pictogramme, son
 * nom, sa phrase courte (le début de sa phrase, lu dans le plan ; les offres
 * et l'aide n'en ont pas) et un chevron. Le toucher ouvre le groupe, dans le
 * même menu.
 */
function RangeeDuGroupe({ groupe, courant, onClick }: { groupe: GroupeDeMenu; courant: boolean; onClick: () => void }) {
  const courte = phraseCourte(groupe);
  return (
    <button
      type="button"
      id={`plan-groupe-${groupe.code}`}
      data-groupe-du-menu={groupe.code}
      aria-controls={`plan-${groupe.code}`}
      aria-labelledby={`plan-groupe-${groupe.code}-nom`}
      aria-describedby={courte ? `plan-groupe-${groupe.code}-phrase` : undefined}
      aria-current={courant ? "true" : undefined}
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-1 py-3 text-left transition-colors duration-[var(--duree-passage)] hover:bg-white/5 motion-reduce:transition-none"
    >
      <Pictogramme nom={groupe.icone} />
      <span className="min-w-0 flex-1">
        <span
          id={`plan-groupe-${groupe.code}-nom`}
          data-titre-du-groupe=""
          className={`block text-base font-semibold text-slate-50 ${courant ? "underline decoration-slate-300 underline-offset-4" : ""}`}
        >
          {groupe.titre}
        </span>
        {courte ? (
          <span id={`plan-groupe-${groupe.code}-phrase`} data-phrase-courte="" className="block text-sm text-slate-400">
            {courte}
          </span>
        ) : null}
      </span>
      <Chevron className="text-slate-400" />
    </button>
  );
}

/**
 * UN GROUPE OUVERT DANS LE MENU DU TÉLÉPHONE : ce que son panneau montre sur
 * grand écran, en colonne. « Retour » ramène à la liste, sans fermer le menu ;
 * puis le produit (pictogramme, nom, phrase), son bouton vers sa page, et ses
 * entrées, chacune avec sa ligne, de 44 px au moins au doigt.
 */
function GroupeDuMenu({
  groupe,
  deplie,
  estCourant,
  onRetour,
}: {
  groupe: GroupeDeMenu;
  deplie: boolean;
  estCourant: (href: string) => boolean;
  onRetour: () => void;
}) {
  const id = `plan-${groupe.code}`;
  return (
    <div id={id} data-groupe-du-plan={groupe.code} hidden={!deplie} className="motion-safe:animate-carte-entre">
      <button
        type="button"
        id={`${id}-retour`}
        aria-label="Retour aux groupes"
        onClick={onRetour}
        className="-ml-1 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-slate-300 transition-colors duration-[var(--duree-passage)] hover:text-white motion-reduce:transition-none"
      >
        <Chevron className="rotate-180" />
        Retour
      </button>
      <div className="mt-2 flex items-center gap-3">
        <Pictogramme nom={groupe.icone} grand />
        <p id={`${id}-nom`} className="text-xl font-semibold text-slate-50">
          {groupe.titre}
        </p>
      </div>
      {groupe.phrase ? (
        <p data-phrase-du-groupe="" className="mt-3 text-sm leading-relaxed text-slate-400">
          {insecables(groupe.phrase)}
        </p>
      ) : null}
      <Appel groupe={groupe} courant={estCourant(groupe.entree)} className="mt-4 w-full pointer-coarse:min-h-11" />
      <ul aria-labelledby={`${id}-nom`} className="mt-4 border-t border-white/10">
        {groupe.liens.map((lien, i) => (
          <li key={lien.href} className="border-b border-white/10">
            <Link
              href={lien.href}
              data-entree-du-menu={lien.href}
              aria-labelledby={`${id}-${i}-mot`}
              aria-describedby={`${id}-${i}-ligne`}
              aria-current={estCourant(lien.href) ? "page" : undefined}
              className={`flex min-h-11 items-start gap-3 rounded-lg px-1 py-3 transition-colors duration-[var(--duree-passage)] hover:bg-white/5 motion-reduce:transition-none ${
                estCourant(lien.href) ? "bg-white/[0.06]" : ""
              }`}
            >
              <Pictogramme nom={lien.icone} />
              <span className="min-w-0">
                <span
                  id={`${id}-${i}-mot`}
                  className={`block text-base font-semibold text-slate-50 ${
                    estCourant(lien.href) ? "underline decoration-slate-300 underline-offset-4" : ""
                  }`}
                >
                  {lien.libelle}
                </span>
                <span id={`${id}-${i}-ligne`} data-ligne-de-l-entree="" className="block text-sm leading-snug text-slate-400">
                  {insecables(lien.ligne)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
