import { SCENARIO_CHOICES, SECTOR_LABELS } from "@/config/scenarios/registry";
import { teinteDuMetier } from "@/config/scenarios/presentation";
import { PhotoDuLieu } from "@/components/illustrations/scene-d-entreprise";

/**
 * LES LIEUX, IMAGE DU PRODUIT (lot P2 « la mise en scène »).
 *
 * L'audit « cap premium » relevait que le meilleur atout visuel du produit,
 * les neuf photographies de lieux traitées au marine, n'apparaissait qu'à
 * l'étape Situation du premier tour, à 490 px du haut de l'arène. La vitrine
 * n'en montrait aucune : un titre, un anneau décoratif coupé, et plus bas
 * neuf pictogrammes au trait. Les lieux deviennent ici ce qu'on voit d'abord :
 * c'est eux qui font « produit éditorial » plutôt que « logiciel ».
 *
 * UNE LÉGENDE, PAS UN TEXTE SUR LA PHOTO. Le nom de l'entreprise et son
 * métier sont posés SOUS chaque photo, sur le marine du héros, en vrai texte :
 * le nom à l'encre claire, le métier dans la teinte de son métier
 * (`data-metier` publie `--metier`, ≥ 4,5:1 sur le marine, voir « LES
 * MÉTIERS » dans globals.css). Aucun contraste ne dépend d'une photo.
 */

/** Les lieux du héros : une grande photo, trois petites. */
export const LIEUX_DU_HEROS = ["nova", "hotel", "boutique", "batiment"] as const;

function entreprise(code: string) {
  const s = SCENARIO_CHOICES.find((c) => c.code === code);
  if (!s) throw new Error(`Entreprise inconnue : ${code}`);
  return { code: s.code, nom: s.shortName, metier: SECTOR_LABELS[s.sector], teinte: teinteDuMetier(s) };
}

/** La légende d'un lieu : le nom, puis le métier dans sa teinte. */
function Legende({ nom, metier, grand = false }: { nom: string; metier: string; grand?: boolean }) {
  return (
    <figcaption className="mt-2 leading-tight">
      <span className={`block font-semibold text-slate-100 ${grand ? "text-base" : "text-sm"}`}>
        {nom}
      </span>
      <span className="mt-0.5 block text-xs font-medium text-[color:var(--metier,var(--color-slate-300))]">
        {metier}
      </span>
    </figcaption>
  );
}

/**
 * LA COMPOSITION DES LIEUX, à droite du titre (ordinateur). Une grande photo
 * (NOVA, l'entreprise qu'on lance par défaut) et trois petites dessous, coins
 * presque nets (`rounded-md`), filet clair d'un pixel. Elle remplace le grand
 * anneau décoratif coupé du coin haut droit. Au-dessus de la ligne de
 * flottaison : la grande est chargée en premier, les petites d'emblée aussi.
 */
export function CompositionDesLieux({ className = "" }: { className?: string }) {
  const [premier, ...autres] = LIEUX_DU_HEROS.map(entreprise);
  return (
    <div data-composition-des-lieux="" className={`grid grid-cols-3 gap-x-3 gap-y-4 ${className}`}>
      <figure data-metier={premier!.teinte} className="col-span-3 m-0">
        <div className="overflow-hidden rounded-md ring-1 ring-white/15">
          <PhotoDuLieu
            scenario={premier!.code}
            prioritaire
            sizes="(min-width: 1024px) 460px, 100vw"
            className="aspect-[16/9] w-full"
          />
        </div>
        <Legende nom={premier!.nom} metier={premier!.metier} grand />
      </figure>
      {autres.map((e) => (
        <figure key={e.code} data-metier={e.teinte} className="m-0 min-w-0">
          <div className="overflow-hidden rounded-md ring-1 ring-white/15">
            <PhotoDuLieu scenario={e.code} petit prioritaire className="aspect-[4/3] w-full" />
          </div>
          <Legende nom={e.nom} metier={e.metier} />
        </figure>
      ))}
    </div>
  );
}

/**
 * SUR TÉLÉPHONE, UNE BANDE DE VIGNETTES sous les boutons : les neuf lieux, qui
 * défilent de côté dans leur propre bande (la page, elle, ne bouge pas), un
 * cran par vignette (`scroll-snap`), sans barre de défilement. Elle vient
 * APRÈS « Commencer une partie » : elle ne le repousse pas hors du premier
 * écran. La bande se lit au clavier (elle prend le focus et défile aux
 * flèches) et porte son nom.
 */
export function BandeDesLieux({ className = "" }: { className?: string }) {
  return (
    <ul
      data-bande-des-lieux=""
      aria-label={`Les ${SCENARIO_CHOICES.length} entreprises`}
      tabIndex={0}
      className={`-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {SCENARIO_CHOICES.map((s) => {
        const e = entreprise(s.code);
        return (
          <li key={e.code} className="w-[9.5rem] shrink-0 snap-start">
            <figure data-metier={e.teinte} className="m-0">
              <div className="overflow-hidden rounded-md ring-1 ring-white/15">
                <PhotoDuLieu scenario={e.code} petit className="aspect-[4/3] w-full" />
              </div>
              <Legende nom={e.nom} metier={e.metier} />
            </figure>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * LES NEUF MÉTIERS, MONTRÉS, plus bas dans la vitrine. Ils étaient neuf
 * pictogrammes au trait ; ce sont maintenant les neuf lieux, en vignettes
 * (la réduite, chargée à l'approche de l'écran), avec le nom de l'entreprise
 * et son métier dans sa teinte.
 */
export function LesNeufLieux() {
  return (
    <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-9 lg:gap-x-3">
      {SCENARIO_CHOICES.map((s) => {
        const e = entreprise(s.code);
        return (
          <li key={e.code} data-metier={e.teinte} data-lieu-de-la-vitrine={e.code}>
            <figure className="m-0">
              <div className="overflow-hidden rounded-md ring-1 ring-white/10">
                <PhotoDuLieu scenario={e.code} petit className="aspect-[4/3] w-full" />
              </div>
              <Legende nom={e.nom} metier={e.metier} />
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
