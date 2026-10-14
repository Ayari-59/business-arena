"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import {
  ACTION_PRINCIPALE,
  LIEN_GUIDES,
  NAVIGATION,
  type GroupeDeMenu,
  type LienDeMenu,
} from "@/config/navigation";
import { VENDEUR } from "@/config/editeur";

/**
 * LE PIED DE PAGE, SUR TOUTES LES PAGES PUBLIQUES.
 *
 * Il n'existait que sur l'accueil. Les dix autres pages publiques s'arrêtaient
 * net sur leur dernière section, et « Mentions légales & RGPD » n'y était
 * atteignable que par le panneau « Menu » : un lien que la loi veut visible,
 * rangé derrière un bouton qui recouvre la page.
 *
 * LE PLAN, EN QUATRE COLONNES (décision du propriétaire, octobre 2026). Sa
 * version précédente ne proposait que quatre liens, par crainte de redire le
 * menu ; mais un pied de page qui déroule le plan rangé par public est la
 * carte du site, celle qu'on lit en bas d'une page quand on n'a pas trouvé.
 * Il LIT le plan (config/navigation.ts), groupe par groupe, sous les mêmes
 * titres que la barre et le menu : jamais une copie qui dérivera. Cinq
 * colonnes sur grand écran, Jouer / Enseignants / Écoles / Entreprises / Aide,
 * puis les offres et le contact sur une ligne ; empilées sur téléphone.
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
  const chemin = usePathname();

  // L'année est lue au rendu, donc à la compilation pour la page servie et à
  // l'hydratation pour celle du navigateur. Les deux disent la même chose sauf
  // pendant les quelques heures qui suivent le 31 décembre d'un déploiement à
  // l'autre, et c'est le navigateur qui a raison à ce moment-là : la mention
  // se corrige toute seule au lieu de vieillir avec le dernier déploiement.
  const annee = new Date().getFullYear();

  // CINQ COLONNES ET UNE LIGNE. Le plan se déroulait en quatre colonnes dont
  // la deuxième empilait les trois publics : une colonne de trente lignes à
  // côté de trois colonnes de cinq, et un pied de page mal calibré, long d'un
  // côté, vide de l'autre. Les cinq premiers groupes prennent maintenant
  // chacun leur colonne, dans l'ordre du plan : Jouer, Enseignants, Écoles,
  // Entreprises, Aide. Le sixième, les offres et le contact, se lit sur une
  // seule ligne sous les cinq, comme la ligne de contact d'un courrier. Trois
  // colonnes sur tablette, une pile sur téléphone. Lus du plan par leur code :
  // un groupe ajouté demain prend sa colonne ici sans qu'on l'écrive.
  const groupe = (code: string): GroupeDeMenu => {
    const g = NAVIGATION.find((x) => x.code === code);
    if (!g) throw new Error(`pied de page : le groupe « ${code} » n'est pas dans le plan`);
    return g;
  };
  const colonnes: GroupeDeMenu[] = [
    groupe("jouer"),
    groupe("enseignants"),
    groupe("ecoles"),
    groupe("entreprises"),
    groupe("aide"),
  ];
  const ligne = groupe("offres");

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

        <nav
          aria-label="Plan du site"
          data-plan-du-pied=""
          className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {colonnes.map((g) => (
            <div key={g.code} data-groupe-du-pied={g.code}>
              <p className="font-display text-sm font-semibold tracking-etiquette text-slate-200">
                {g.titre}
                {g.precision ? (
                  <>
                    {" "}
                    <span className="font-sans text-xs font-normal tracking-normal text-slate-400">
                      {g.precision}
                    </span>
                  </>
                ) : null}
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {g.liens.map((lien) => (
                  <li key={lien.href}>
                    <Entree lien={lien} courant={chemin === lien.href.split("#")[0]} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div
            data-groupe-du-pied={ligne.code}
            className="flex flex-wrap items-baseline gap-x-6 gap-y-2 sm:col-span-3 lg:col-span-5"
          >
            <p className="font-display text-sm font-semibold tracking-etiquette text-slate-200">
              {ligne.titre}
              {ligne.precision ? (
                <>
                  {" "}
                  <span className="font-sans text-xs font-normal tracking-normal text-slate-400">
                    {ligne.precision}
                  </span>
                </>
              ) : null}
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {ligne.liens.map((lien) => (
                <li key={lien.href}>
                  <Entree lien={lien} courant={chemin === lien.href.split("#")[0]} />
                </li>
              ))}
            </ul>
          </div>
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

/**
 * Une entrée du plan, dans sa colonne. L'action principale se distingue par
 * son encre forte, son soulignement et sa flèche, parce qu'un pied de page où
 * tout se ressemble ne propose rien ; elle a porté l'orange, qui ne dit plus
 * que l'action d'un bouton (lot P1). La page courante est du texte, pas un
 * lien.
 */
function Entree({ lien, courant }: { lien: LienDeMenu; courant: boolean }) {
  const principale = lien.href === ACTION_PRINCIPALE.href;
  if (courant) {
    return (
      <span aria-current="page" className="text-slate-200">
        {lien.libelle}
      </span>
    );
  }
  if (principale) {
    return (
      <Link
        href={lien.href}
        className="group font-semibold text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        {lien.libelle}
        <span aria-hidden className="ml-1.5 inline-block transition-transform group-hover:translate-x-1">
          →
        </span>
      </Link>
    );
  }
  return (
    <Link
      href={lien.href}
      // L'aide, sur toutes les pages publiques : les guides de prise en main (tests/e2e/guides.e2e.ts).
      {...(lien.href === LIEN_GUIDES.href ? { "data-lien-des-guides": "" } : {})}
      className="text-slate-400 transition-colors hover:text-slate-200"
    >
      {lien.libelle}
    </Link>
  );
}
