import type { Sector } from "@/config/scenarios/registry";
import { PhotoDuLieu } from "@/components/illustrations/scene-d-entreprise";

/**
 * LE LIEU, AVEC SON NOM POSÉ DESSUS (lot P6 « neuf lieux qui parlent »).
 *
 * « Les photos sans texte sont sans âme » (le propriétaire). Les lieux de
 * /jouer et de la vitrine montraient la photo, puis le nom et le métier
 * DESSOUS, sur le fond de la page. Le nom et le métier passent SUR la photo,
 * en bas, sur un voile marine qui monte du bas (`.voile-du-lieu`) : la
 * photo dit le lieu, le texte dit qui l'on dirige, et les deux se lisent
 * d'un même coup d'œil — c'est ce qui rend tenable une grille de 3 × 3 sur
 * un téléphone.
 *
 * LES RÈGLES DU TEXTE SUR PHOTO (lot P2) TIENNENT :
 *   · le texte est clair et le voile marine, et le contraste se MESURE sur
 *     le pixel le plus clair sous chaque ligne, pour les neuf photos
 *     (tests/e2e/mise-en-scene.e2e.ts, ≥ 4,5:1) ;
 *   · la teinte du métier ne s'écrit pas sur la photo (une teinte moyenne y
 *     tombait à 2,6:1) : elle passe dans un TRAIT, au-dessus du nom ;
 *   · la photo est décorative (`aria-hidden`) ; le nom et le métier sont du
 *     vrai texte, et donnent son nom au bouton qui les contient.
 *
 * LE TOUT EST UNE `ardoise` : le texte prend les blancs cassés du marine, et
 * le trait la version CLAIRE de la teinte (la bande à contre-jour retourne
 * `--metier`, voir « LOT 5A » dans globals.css), même posé sur une page de
 * papier. Le composant n'est fait que de `span` : il se pose aussi bien dans
 * un bouton (/jouer) que dans une figure (vitrine).
 */
export function TuileDuLieu({
  code,
  secteur,
  nom,
  metier,
  petit = true,
  prioritaire = false,
  sizes,
  className = "",
  classePhoto = "",
  classeTexte = "px-3 pb-2.5 pt-6 sm:pb-3",
  classeNom = "text-sm",
  classeMetier = "text-xs",
}: {
  /** Le code de l'entreprise (ou d'une variante : elle garde son lieu). */
  code: string;
  secteur?: Sector;
  nom: string;
  metier: string;
  /** La réduite (768 px) seule : vignette, carte, téléphone. */
  petit?: boolean;
  /** Au-dessus de la ligne de flottaison : chargée d'emblée. */
  prioritaire?: boolean;
  sizes?: string;
  /** Le cadre : son rapport de forme surtout (`aspect-[4/5]`…). */
  className?: string;
  classePhoto?: string;
  classeTexte?: string;
  classeNom?: string;
  classeMetier?: string;
}) {
  return (
    <span
      data-tuile-du-lieu={code}
      className={`ardoise relative isolate block overflow-hidden bg-slate-950 ${className}`}
    >
      <PhotoDuLieu
        scenario={code}
        secteur={secteur}
        petit={petit}
        prioritaire={prioritaire}
        {...(sizes ? { sizes } : {})}
        className={`absolute inset-0 -z-10 h-full w-full ${classePhoto}`}
      />
      <span aria-hidden className="voile-du-lieu absolute inset-0 -z-10" />
      <span
        data-texte-sur-photo=""
        className={`absolute inset-x-0 bottom-0 flex flex-col items-start ${classeTexte}`}
      >
        {/* La teinte du métier : un trait plein, jamais une encre sur la photo. */}
        <span
          aria-hidden
          data-trait-du-metier=""
          className="mb-1.5 block h-[3px] w-5 rounded-full bg-[color:var(--metier,var(--color-slate-300))]"
        />
        <span className={`block font-bold leading-tight text-slate-50 ${classeNom}`}>
          {nom}
        </span>
        <span className={`mt-0.5 block font-medium leading-tight text-slate-200 ${classeMetier}`}>
          {metier}
        </span>
      </span>
    </span>
  );
}
