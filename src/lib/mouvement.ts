/**
 * LE MOUVEMENT SE DEMANDE AU SYSTÈME, ET SES DURÉES À LA FEUILLE.
 *
 * Deux règles tiennent tout le mouvement du produit, et elles vivent ici pour
 * ne pas être réécrites à chaque composant :
 *
 * · QUI A DEMANDÉ MOINS D'ANIMATION N'EN REÇOIT AUCUNE. `prefers-reduced-motion`
 *   n'est pas un réglage de confort : c'est une demande médicale (troubles
 *   vestibulaires, migraines, épilepsie photosensible). Un compteur qui défile
 *   est exactement ce qu'elle vise. Le code JavaScript ne peut pas s'en
 *   remettre au `@media` de la feuille : il la lit lui-même, et pose d'un coup
 *   l'état final.
 *
 * · AUCUNE DURÉE N'EST ÉCRITE DANS UN COMPOSANT. Les jetons `--duree-*` du bloc
 *   « LOT 5B » de globals.css sont la seule source : la feuille les donne au
 *   CSS, et `dureeDuJeton` les donne au script. Une durée tapée dans un
 *   composant finit par diverger de celle d'à côté, et le produit se met à
 *   bouger de trois façons différentes.
 */

/** La demande du système : « moins de mouvement, s'il vous plaît ». */
export const MOUVEMENT_REDUIT = "(prefers-reduced-motion: reduce)";

/** Vraie quand l'utilisateur a demandé moins d'animation (faux côté serveur). */
export function mouvementReduit(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOUVEMENT_REDUIT).matches;
}

/**
 * La valeur d'un jeton de durée, en millisecondes, lue sur la racine du
 * document. `--duree-chiffre: 0.55s` rend 550. Hors navigateur, ou si le jeton
 * manque, le repli vaut zéro : pas de mouvement plutôt qu'une durée inventée.
 */
export function dureeDuJeton(nom: string): number {
  if (typeof window === "undefined") return 0;
  const brut = getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
  if (!brut) return 0;
  const n = Number.parseFloat(brut);
  if (!Number.isFinite(n)) return 0;
  return brut.endsWith("ms") ? n : n * 1000;
}

/**
 * L'amorti d'un compteur : vite au départ, posé à l'arrivée (cubique sortante).
 * La même intention que la courbe `--courbe-passage` de la feuille, pour que le
 * chiffre et l'écran qui le porte aient le même tempérament.
 */
export function amorti(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}
