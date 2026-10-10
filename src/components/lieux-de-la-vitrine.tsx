import { SCENARIO_CHOICES, SECTOR_LABELS } from "@/config/scenarios/registry";
import { teinteDuMetier } from "@/config/scenarios/presentation";
import { TuileDuLieu } from "@/components/tuile-du-lieu";

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
 * LOT P6 : LE NOM SUR LA PHOTO. Le lot P2 posait le nom et le métier SOUS
 * chaque photo, pour qu'aucun contraste ne dépende d'une image. « Les photos
 * sans texte sont sans âme » (le propriétaire) : ils passent SUR la photo,
 * dans le même voile mesuré que /jouer (`TuileDuLieu`), et la teinte du
 * métier dans un trait au-dessus du nom.
 */

/** Les lieux du héros : une grande photo, trois petites. */
export const LIEUX_DU_HEROS = ["nova", "hotel", "boutique", "batiment"] as const;

function entreprise(code: string) {
  const s = SCENARIO_CHOICES.find((c) => c.code === code);
  if (!s) throw new Error(`Entreprise inconnue : ${code}`);
  return { code: s.code, nom: s.shortName, metier: SECTOR_LABELS[s.sector], teinte: teinteDuMetier(s) };
}

/** Un lieu de la vitrine : une figure, la tuile du lieu, son nom dessus. */
function Lieu({
  code,
  grand = false,
  prioritaire = false,
  className = "aspect-[4/5]",
  classeNom = "text-xs sm:text-sm",
}: {
  code: string;
  grand?: boolean;
  prioritaire?: boolean;
  className?: string;
  classeNom?: string;
}) {
  const e = entreprise(code);
  return (
    <figure data-metier={e.teinte} className="m-0 min-w-0">
      <TuileDuLieu
        code={e.code}
        nom={e.nom}
        metier={e.metier}
        petit={!grand}
        prioritaire={prioritaire}
        {...(grand ? { sizes: "(min-width: 1024px) 460px, 100vw" } : {})}
        className={`rounded-md ring-1 ring-white/15 ${className}`}
        classeTexte={grand ? "px-4 pb-4 pt-10" : "px-3 pb-2.5 pt-6"}
        classeNom={grand ? "text-lg" : classeNom}
        classeMetier={grand ? "text-sm" : "text-xs"}
      />
    </figure>
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
  const [premier, ...autres] = LIEUX_DU_HEROS;
  return (
    <div data-composition-des-lieux="" className={`grid grid-cols-3 gap-3 ${className}`}>
      <div className="col-span-3">
        <Lieu code={premier!} grand prioritaire className="aspect-[16/9]" />
      </div>
      {autres.map((code) => (
        <Lieu key={code} code={code} prioritaire className="aspect-[4/3]" classeNom="text-sm" />
      ))}
    </div>
  );
}

/**
 * SUR TÉLÉPHONE, LES NEUF LIEUX EN GRILLE DE 3 × 3, sous les boutons (lot P6).
 * Le lot P2 en faisait une bande qui défilait de côté : on n'en voyait que
 * deux et demi, et rien ne disait qu'il y en avait neuf. Avec le nom posé sur
 * la photo, trois colonnes de tuiles 4:5 tiennent dans la largeur d'un
 * téléphone, les neuf d'un coup d'œil. Elle vient APRÈS « Tester le
 * simulateur » : elle ne le repousse pas hors du premier écran (mesuré à
 * 390 × 844 et 360 × 740, tests/e2e/mise-en-scene.e2e.ts). Sous la ligne de
 * flottaison, ses photos attendent l'écran.
 */
export function GrilleDesLieux({ className = "" }: { className?: string }) {
  return (
    <ul
      data-grille-des-lieux=""
      aria-label={`Les ${SCENARIO_CHOICES.length} entreprises`}
      className={`grid grid-cols-3 gap-2 ${className}`}
    >
      {SCENARIO_CHOICES.map((s) => (
        <li key={s.code} className="min-w-0">
          <Lieu code={s.code} />
        </li>
      ))}
    </ul>
  );
}

/**
 * LES NEUF MÉTIERS, MONTRÉS, plus bas dans la vitrine. Ils étaient neuf
 * pictogrammes au trait ; ce sont maintenant les neuf lieux, en vignettes
 * (la réduite, chargée à l'approche de l'écran), avec le nom de l'entreprise
 * et son métier posés sur la photo (lot P6) : trois colonnes sur téléphone et
 * tablette, une rangée de neuf sur ordinateur.
 */
export function LesNeufLieux() {
  return (
    <ul className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-9">
      {SCENARIO_CHOICES.map((s) => (
        <li key={s.code} data-lieu-de-la-vitrine={s.code} className="min-w-0">
          <Lieu code={s.code} />
        </li>
      ))}
    </ul>
  );
}
