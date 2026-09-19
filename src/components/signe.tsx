/**
 * Les deux signes de l'arbitrage : ce que la route ajoute, ce qu'elle retire.
 *
 * C'étaient des flèches, ↗ et ↘, écrites en caractères Unicode. Deux défauts,
 * l'un de forme et l'autre de fond.
 *
 * De forme : ces points de code ont une variante emoji. Selon la police
 * disponible, le navigateur rend une pastille de couleur qui ignore la teinte
 * demandée, ou un carré vide là où rien ne les porte ; sur le dossier d'équipe
 * imprimé, un aplat gris. Un tracé ne dépend d'aucune police, prend
 * `currentColor`, et survit au thème clair comme au noir et blanc.
 *
 * De fond : une flèche dit « ça monte » et « ça descend ». Or la carte n'oppose
 * pas une hausse à une baisse, elle oppose un GAIN à un COÛT. Le plus et le
 * moins cerclés le disent dans la langue que l'élève apprend par ailleurs, et
 * ce sont les deux marques qui se distinguent le mieux l'une de l'autre quand
 * la couleur disparaît : deux diagonales opposées, à 12 px et lues vite, se
 * ressemblent beaucoup.
 *
 * `aria-hidden` parce que le signe ne dit rien seul : la ligne qu'il accompagne
 * porte son intitulé pour les lecteurs d'écran.
 */
export function Signe({
  sens,
  className = "",
}: {
  sens: "gain" | "cout";
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      /*
        La taille suit celle du texte : un signe figé à 12 px se décrochait des
        lignes en `text-xs` comme de celles en `text-sm`. Elle est portée DEUX
        FOIS, en attribut et en classe : un SVG sans dimension propre s'étale
        sur toute la largeur disponible, et il suffirait que la classe
        utilitaire manque à la feuille compilée pour que le signe mange la
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
      <circle cx="6" cy="6" r="4.4" />
      {/* La barre horizontale est commune ; seul le gain porte la verticale. */}
      <path d={sens === "gain" ? "M6 3.7v4.6M3.7 6h4.6" : "M3.7 6h4.6"} />
    </svg>
  );
}
