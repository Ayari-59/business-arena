/**
 * Les deux flèches de l'arbitrage : ce que la route rapporte, ce qu'elle coûte.
 *
 * Elles étaient écrites en caractères Unicode (↗ U+2197 et ↘ U+2198). Ces deux
 * points de code ont une variante emoji : selon la police disponible, le
 * navigateur les remplace par une pastille de couleur qui ignore la teinte
 * demandée, et qui s'imprime en aplat gris sur le dossier de l'équipe. Là où
 * aucune police ne les porte, c'est un carré vide.
 *
 * Un tracé vaut mieux qu'un caractère : il prend la couleur du texte
 * (`currentColor`), garde la même épaisseur partout, et ne dépend d'aucune
 * police installée. `aria-hidden` parce que la flèche ne dit rien seule : la
 * ligne qu'elle accompagne porte son intitulé pour les lecteurs d'écran.
 */
export function Fleche({
  sens,
  className = "",
}: {
  sens: "hausse" | "baisse";
  className?: string;
}) {
  const hausse = sens === "hausse";
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      /*
        La taille suit celle du texte : une flèche figée à 12 px se décrochait
        des lignes en `text-xs` comme de celles en `text-sm`. Elle est portée
        DEUX FOIS, en attribut et en classe : un SVG sans dimension propre
        s'étale sur toute la largeur disponible, et il suffirait que la classe
        utilitaire manque à la feuille compilée pour que la flèche mange la
        carte. Vu à l'écran avant de l'écrire ici.
      */
      width="1em"
      height="1em"
      className={`inline-block h-[1em] w-[1em] shrink-0 align-[-0.125em] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={hausse ? "M2.5 9.5 9 3" : "M2.5 2.5 9 9"} />
      <path d={hausse ? "M4.5 3H9v4.5" : "M9 4.5V9H4.5"} />
    </svg>
  );
}
