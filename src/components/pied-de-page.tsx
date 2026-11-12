"use client";

import Link from "next/link";
// Le chemin normalisé : `/index` (régénération de l'accueil sur Vercel) vaut `/`.
import { useCheminDeLaPage } from "@/lib/chemin-de-la-page";
import { BrandMark } from "@/components/brand-mark";
import { LIEN_GUIDES, NAVIGATION, liensDeTete, type LienDeMenu } from "@/config/navigation";
import { VENDEUR } from "@/config/editeur";

/**
 * LE PIED DE PAGE, SUR TOUTES LES PAGES PUBLIQUES.
 *
 * Il n'existait que sur l'accueil. Les dix autres pages publiques s'arrêtaient
 * net sur leur dernière section, et les mentions légales n'y étaient
 * atteignables que par le panneau « Menu » : un lien que la loi veut visible,
 * rangé derrière un bouton qui recouvre la page.
 *
 * LE PLAN, PAR PRODUIT, SOUS LES MOTS DU MENU (décision du propriétaire,
 * novembre 2026 : un menu par produit, un mot par entrée). Un pied de page qui
 * déroule le plan est la carte du site, celle qu'on lit en bas d'une page
 * quand on n'a pas trouvé. Il LIT le plan (config/navigation.ts), groupe par
 * groupe : une colonne par produit, Cours · Arène · Épisodes · Offres · Aide,
 * sous le mot de la barre et vers la même page, puis ses entrées, d'un mot.
 * Jamais une copie qui dérivera. Le plan d'avant comptait 5 colonnes, une ligne
 * pour les offres et une pour ce qui sert à tous, et une précision à côté de
 * trois titres : les 5 groupes suffisent, les mentions légales sont dans
 * « Aide ». Cinq colonnes sur grand écran, trois sur tablette, deux sur
 * téléphone : des mots seuls tiennent à deux de front.
 *
 * IL SE POSE HORS DU `<main>`, en frère de celui-ci. C'est ce qui en fait un
 * repère « contentinfo » pour une synthèse vocale ; imbriqué dans le contenu,
 * un `<footer>` n'est plus qu'un bloc parmi d'autres.
 *
 * IL NE PROPOSE PAS LA PAGE OÙ L'ON EST. Un lien qui ramène là où l'on se
 * trouve déjà est la version en une ligne du survol qui ne fait rien. Le pied
 * lit donc le chemin courant, comme la barre le fait pour marquer la page
 * ouverte, et pose l'entrée devenue inutile en texte, marquée `aria-current`.
 *
 * UN COLOPHON, PAS UNE LIGNE DE MENTIONS. L'emblème ancre la signature à
 * gauche : c'est `BrandMark`, le dessin monochrome qui prend la couleur de son
 * texte, donc l'or de la maison dans les deux thèmes. Le nom se pose seul, au
 * serif des titres : une marque se lit, elle ne se glisse pas dans une légende.
 * Le filet qui ferme le plan est le gris bleuté des cartes, le même sur toutes
 * les pages.
 *
 * AUCUNE COULEUR ÉCRITE À LA MAIN. `slate-400`, `white/10` et l'accent du site
 * désignent des paliers d'une échelle que le thème clair renverse.
 */
export function PiedDePage() {
  const chemin = useCheminDeLaPage();

  // L'année est lue au rendu, donc à la compilation pour la page servie et à
  // l'hydratation pour celle du navigateur. Les deux disent la même chose sauf
  // pendant les quelques heures qui suivent le 31 décembre d'un déploiement à
  // l'autre, et c'est le navigateur qui a raison à ce moment-là : la mention
  // se corrige toute seule au lieu de vieillir avec le dernier déploiement.
  const annee = new Date().getFullYear();

  // Le titre d'une colonne est le mot de la barre, vers la même page.
  const mots = liensDeTete();
  const courant = (href: string) => chemin === href.split("#")[0];

  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-start gap-4">
          <BrandMark className="mt-0.5 h-10 w-10 shrink-0 text-amber-400" />
          <div>
            <p className="font-display text-lg font-semibold tracking-etiquette text-slate-200">
              BUSINESS <span className="accent-arena">ARENA</span>
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
              Simulation d&apos;entreprise, apprentissage de la décision.
            </p>
          </div>
        </div>

        {/* UNE COLONNE PAR GROUPE, dans l'ordre du plan, lues du plan par leur
            code : un groupe ajouté demain prend sa colonne ici sans qu'on
            l'écrive. */}
        <nav
          aria-label="Plan du site"
          data-plan-du-pied=""
          className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {NAVIGATION.map((g, i) => (
            <div key={g.code} data-groupe-du-pied={g.code}>
              <Titre id={`pied-${g.code}`} lien={mots[i]!} courant={courant(mots[i]!.href)} />
              {/* La liste porte le nom de sa colonne : « Profil » se lit « Arène »
                  ou « Épisodes » pour une synthèse vocale. */}
              <ul aria-labelledby={`pied-${g.code}`} className="mt-3 space-y-2 text-sm">
                {g.liens.map((lien) => (
                  <li key={lien.href}>
                    <Entree lien={lien} courant={courant(lien.href)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Le filet ferme le plan : le gris bleuté des cartes, plein, le même
            sur toutes les pages. Il a été un dégradé d'orange qui s'éteignait
            vers la droite, et l'orange ne décore pas. */}
        <div aria-hidden className="mt-12 h-px bg-[var(--filet-carte)]" />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 text-xs text-slate-400">
          <p>© {annee} Business Arena</p>
          {/* L'adresse de contact, en texte : elle se sélectionne et se recopie
              (config/editeur.ts). */}
          <span data-contact-pied="" className="select-all">
            {VENDEUR.contact}
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Le titre d'une colonne : le mot du groupe, vers sa page ; en texte sur cette page. */
function Titre({ id, lien, courant }: { id: string; lien: LienDeMenu; courant: boolean }) {
  // La même boîte, lien ou texte : un titre courant ne remonte pas au-dessus de ses voisins.
  const classe = "block w-fit font-display text-sm font-semibold tracking-etiquette";
  if (courant) {
    return (
      <span id={id} aria-current="page" className={`${classe} text-slate-50`}>
        {lien.libelle}
      </span>
    );
  }
  return (
    <Link id={id} href={lien.href} title={lien.aide} className={`${classe} text-slate-200 transition-colors hover:text-white`}>
      {lien.libelle}
    </Link>
  );
}

/** Une entrée du plan, dans sa colonne. La page courante est du texte, pas un lien. */
function Entree({ lien, courant }: { lien: LienDeMenu; courant: boolean }) {
  if (courant) {
    return (
      <span aria-current="page" className="text-slate-200">
        {lien.libelle}
      </span>
    );
  }
  return (
    <Link
      href={lien.href}
      title={lien.aide}
      // L'aide, sur toutes les pages publiques : les guides de prise en main (tests/e2e/guides.e2e.ts).
      {...(lien.href === LIEN_GUIDES.href ? { "data-lien-des-guides": "" } : {})}
      className="text-slate-400 transition-colors hover:text-slate-200"
    >
      {lien.libelle}
    </Link>
  );
}
