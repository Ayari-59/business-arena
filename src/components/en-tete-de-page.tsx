import type { ReactNode } from "react";

/**
 * L'EN-TÊTE D'UNE PAGE INTÉRIEURE, ÉCRIT UNE FOIS.
 *
 * Les pages intérieures se présentaient chacune à sa façon : un titre de 24 px
 * sous « Business Arena » ici, un titre de 30 px centré là, un surtitre très
 * espacé sur une colonne de 216 px de marge ailleurs, et un « ← Retour à
 * l'accueil » que l'en-tête du site, dont le logo ramène à l'accueil, rendait
 * superflu. Le lecteur qui passe du guide aux notions changeait de site à
 * chaque clic.
 *
 * L'ANATOMIE, LA MÊME PARTOUT :
 * · un surtitre, en capitales espacées, qui dit dans quelle partie du site on
 *   est ;
 * · le titre, de 40 px sur un téléphone à 48 px au-delà, dans la voix des
 *   titres du site (Barlow Condensed, extra-gras, italique, capitales : voir
 *   globals.css) et à l'encre : l'orange d'un grand titre n'appartient qu'au
 *   héros de l'accueil ;
 * · le chapeau, de 17 à 18 px, qui dit ce que la page apporte ;
 * · ce qui suit le chapeau (un sommaire, un lien de reprise), s'il y a lieu.
 *
 * LA COLONNE EST COMMUNE. Une largeur de lecture et des marges uniques : le
 * titre d'une page tombe au même endroit que celui de la suivante.
 *
 * C'est le seul titre de la page : une page qui pose un `EnTeteDePage` n'écrit
 * pas d'autre `<h1>` (garde : tests/architecture/en-tete-de-page.test.ts).
 */
export const COLONNE_DE_PAGE = "mx-auto w-full max-w-4xl px-6";

export function EnTeteDePage({
  surtitre,
  titre,
  chapeau,
  children,
  id,
  className = "",
}: {
  /** Où l'on est : « Guide de prise en main », « Espace enseignant ». */
  surtitre: ReactNode;
  titre: ReactNode;
  /** Ce que la page apporte, en une ou deux phrases. */
  chapeau?: ReactNode;
  /** Ce qui suit le chapeau : un sommaire, des liens, un bouton. */
  children?: ReactNode;
  /** L'identifiant du titre, pour un `aria-labelledby`. */
  id?: string;
  /** Les marges verticales, si la page en veut d'autres. */
  className?: string;
}) {
  return (
    <header data-en-tete-de-page className={`${COLONNE_DE_PAGE} pb-6 pt-10 sm:pt-14 ${className}`}>
      <p className="text-xs uppercase tracking-annonce text-amber-400">{surtitre}</p>
      <h1
        id={id}
        className="mt-3 text-[clamp(2.5rem,6vw,3rem)] font-extrabold leading-[1.02] text-slate-50"
      >
        {titre}
      </h1>
      {chapeau ? (
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">{chapeau}</p>
      ) : null}
      {children}
    </header>
  );
}
