"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { ACTION_PRINCIPALE, LIEN_CONTACT, LIENS_LEGAUX } from "@/config/navigation";

/**
 * LE PIED DE PAGE, SUR TOUTES LES PAGES PUBLIQUES.
 *
 * Il n'existait que sur l'accueil. Les dix autres pages publiques s'arrêtaient
 * net sur leur dernière section, et « Mentions légales & RGPD » n'y était
 * atteignable que par le panneau « Menu » : un lien que la loi veut visible,
 * rangé derrière un bouton qui recouvre la page.
 *
 * CE QU'IL NE FAIT PLUS. Celui de l'accueil déroulait à plat les QUATORZE
 * liens du plan, dans l'ordre du registre, sans hiérarchie ni regroupement —
 * c'est-à-dire exactement ce que le menu affiche déjà en accordéon, en moins
 * lisible, puisque les groupes qui disent à qui chaque page s'adresse y
 * disparaissaient. Un pied de page n'est pas un second menu. La navigation
 * reste au menu, qui la fait mieux.
 *
 * TROIS CHOSES, DONC, ET RIEN D'AUTRE : qui édite et ce que fait le site ; où
 * aller si l'on n'a encore rien décidé, plus de quoi nous joindre ; ce que la
 * loi impose. Le rappel d'action est UNIQUE et lit `ACTION_PRINCIPALE` : la
 * même entrée que le menu met en tête, jamais une copie qui dérivera.
 *
 * IL SE POSE HORS DU `<main>`, en frère de celui-ci. C'est ce qui en fait un
 * repère « contentinfo » pour une synthèse vocale ; imbriqué dans le contenu,
 * un `<footer>` n'est plus qu'un bloc parmi d'autres, et le site n'avait alors
 * aucun repère de pied de page — pas même sur l'accueil, où il en existait un.
 *
 * IL NE PROPOSE PAS LA PAGE OÙ L'ON EST. Le rappel d'action pointe vers
 * l'orientation ; sur la page d'orientation elle-même, c'était un lien qui
 * ramène là où l'on se trouve déjà — la version en une ligne du survol qui ne
 * fait rien. Le pied lit donc le chemin courant, comme la barre le fait pour
 * marquer la page ouverte, et retire l'entrée devenue inutile.
 *
 * UN COLOPHON, PAS UNE LIGNE DE MENTIONS. Sa première version disait les
 * trois bonnes choses et les disait toutes de la même façon : quatorze mots de
 * gris pâle sur deux rangées, l'emblème absent, le nom de la marque noyé au
 * milieu d'une phrase, et huit cents pixels de vide entre la gauche et la
 * droite. Un pied de page est la signature d'une page, comme l'achevé
 * d'imprimer ferme un livre : il lui faut une hiérarchie.
 *
 * Elle tient en quatre décisions. L'emblème ancre le bloc à gauche — c'est
 * `BrandMark`, le dessin monochrome qui prend la couleur de son texte, donc
 * l'or de la maison dans les deux thèmes, sans second fichier ni couleur
 * écrite ici. Le nom quitte la phrase et se pose seul, au serif des titres :
 * une marque se lit, elle ne se glisse pas dans une légende. Les deux liens
 * passent en colonne alignée à droite, ce qui répond aux deux lignes de
 * gauche au lieu de laisser le vide entre elles. Et le filet qui sépare la
 * signature des mentions est de laiton qui s'éteint vers la droite, pas d'un
 * gris de plus.
 *
 * AUCUNE COULEUR ÉCRITE À LA MAIN. `slate-400`, `white/10` et l'accent du site
 * désignent des paliers d'une échelle que le thème clair renverse : le filet
 * est un gris pâle sur fond sombre et un gris d'encre sur papier, sans qu'on
 * ait à l'écrire deux fois.
 */
export function PiedDePage() {
  const chemin = usePathname();
  const ailleurs = (lien: { href: string }) => lien.href !== chemin;

  // L'année est lue au rendu, donc à la compilation pour la page servie et à
  // l'hydratation pour celle du navigateur. Les deux disent la même chose sauf
  // pendant les quelques heures qui suivent le 31 décembre d'un déploiement à
  // l'autre, et c'est le navigateur qui a raison à ce moment-là : la mention
  // se corrige toute seule au lieu de vieillir avec le dernier déploiement.
  const annee = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-10">
          <div className="flex items-start gap-4">
            <BrandMark className="mt-0.5 h-10 w-10 shrink-0 text-amber-400" />
            <div>
              <p className="font-display text-lg font-semibold tracking-[0.14em] text-slate-200">
                BUSINESS <span className="accent-arena">ARENA</span>
              </p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
                Simulation d&apos;entreprise, apprentissage de la décision.
              </p>
            </div>
          </div>
          {/* Deux liens : celui qui aide à décider, et celui qui met quelqu'un
              au bout du fil. Le premier porte l'accent, parce qu'un pied de
              page où tout se ressemble ne propose rien. */}
          <nav
            aria-label="Aller plus loin"
            className="flex flex-col gap-3 text-sm sm:items-end sm:text-right"
          >
            {ailleurs(ACTION_PRINCIPALE) ? (
              <Link
                href={ACTION_PRINCIPALE.href}
                className="group font-semibold text-amber-400 transition-colors hover:text-amber-300"
              >
                {ACTION_PRINCIPALE.libelle}
                <span
                  aria-hidden
                  className="ml-1.5 inline-block transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            ) : null}
            {ailleurs(LIEN_CONTACT) ? (
              <Link
                href={LIEN_CONTACT.href}
                className="text-slate-400 transition-colors hover:text-slate-200"
              >
                {LIEN_CONTACT.libelle}
              </Link>
            ) : null}
          </nav>
        </div>
        {/* Le filet de laiton s'éteint vers la droite : il ferme la signature
            sans poser une seconde barre en travers de la page. */}
        <div
          aria-hidden
          className="mt-12 h-px bg-gradient-to-r from-amber-400/40 via-amber-400/15 to-transparent"
        />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 text-xs text-slate-400">
          <p>© {annee} Business Arena</p>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {LIENS_LEGAUX.filter(ailleurs).map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className="transition-colors hover:text-slate-200"
              >
                {lien.libelle}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
