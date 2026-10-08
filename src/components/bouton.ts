/**
 * LE BOUTON, ÉCRIT UNE FOIS.
 *
 * Relevé avant d'écrire ce fichier : 48 boutons laiton pleins, dans 36
 * fichiers, en ONZE remplissages différents (px-6 py-3, px-5 py-2, px-4 py-3,
 * px-4 py-2, px-6 py-2, px-5 py-2.5, px-3 py-2…), et en deux familles qui ne se
 * parlaient pas — `bg-amber-500` avec une ombre sur les pages publiques,
 * `bg-amber-400` sans ombre dans l'application. Les contours laiton
 * alternaient `text-amber-200` et `text-amber-300` sans règle. Personne n'avait
 * décidé tout cela : chaque bouton avait été copié du plus proche voisin.
 *
 * Ce n'est pas un composant mais une FONCTION DE CLASSES, parce qu'un bouton
 * est tantôt un `<button>`, tantôt un `<Link>` de Next, tantôt un `<a>`, et
 * parfois un `<p>` dans une maquette d'écran. Un composant aurait forcé trois
 * enveloppes ; une fonction se pose partout, et le reste des classes du site
 * continue de s'écrire à côté d'elle.
 *
 * TROIS VARIANTES, ET ELLES VEULENT DIRE QUELQUE CHOSE :
 * · `principal` — ce qu'on attend de vous sur cet écran. Un par écran, en
 *   principe : deux boutons pleins côte à côte, c'est une hésitation affichée.
 * · `secondaire` — l'autre chemin, celui qu'on prend sans être poussé : un
 *   filet gris, l'encre.
 * · `lien` — une action de troisième rang, dans une page dense : l'encre
 *   d'action soulignée d'un pixel, sans cadre. Il a été un « laiton », un
 *   contour orange : une quatrième forme de bouton, entre les deux autres,
 *   qui faisait lire l'orange partout. Le site dessinait ses boutons de cinq
 *   façons ; il n'en a plus que trois.
 *
 * TROIS TAILLES, ET LA PLUS GRANDE PORTE L'OMBRE. Le bouton plein de l'arène
 * a une ombre pleine, orange foncé, décalée vers le bas : six pixels sur
 * l'appel d'une page publique, trois sur les autres (voir `.bouton-plein`
 * dans globals.css, qui porte aussi sa couleur et ses capitales condensées).
 * La règle est donc simple à suivre : grand bouton = appel de page = plus de
 * relief.
 *
 * Toutes les tailles passent le plancher de 24 px de haut (règle WCAG 2.5.8) :
 * la plus petite fait 12 px de texte, 16 px d'interligne et 2 × 6 px de
 * remplissage, soit 28 px.
 */

export type VarianteDeBouton = "principal" | "secondaire" | "lien";
export type TailleDeBouton = "s" | "m" | "l";

/**
 * Ce que tous les boutons partagent : la forme, l'alignement, l'état désactivé.
 *
 * DÉSACTIVÉ, UN BOUTON EST NEUTRE. Il s'éteignait par l'opacité : un aplat
 * orange à 60 % donnait un pêche pâle, le pastel que la charte chasse, et qui
 * se lisait comme un bouton actif délavé. Il prend désormais un fond gris
 * bleuté (#dbe2ee) et une encre grise (#4b5970), sans ombre ni opacité : voir
 * « LE BOUTON DÉSACTIVÉ » dans globals.css, qui l'emporte sur toute opacité
 * qu'un appelant ajouterait.
 */
const COMMUN =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed";

const VARIANTES: Record<VarianteDeBouton, string> = {
  // `bouton-plein` en fait le bouton de l'arène (voir globals.css) : l'orange
  // vif, un texte marine en capitales condensées, une ombre pleine dessous.
  // Les classes d'échelle restent pour ce qui ne lit pas la feuille.
  principal: "bouton-plein bg-amber-400 text-slate-950 hover:bg-amber-300",
  secondaire:
    "bouton-filet border border-white/15 text-slate-200 hover:border-amber-400/50 hover:bg-white/5",
  lien: "text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2",
};

const TAILLES: Record<TailleDeBouton, string> = {
  s: "px-3 py-1.5 text-xs",
  m: "px-4 py-2 text-sm",
  l: "px-6 py-3 text-sm",
};

/** Un lien n'a pas de cadre : il garde la hauteur de sa taille, pas le retrait. */
const TAILLES_DU_LIEN: Record<TailleDeBouton, string> = {
  s: "py-1.5 text-xs",
  m: "py-2 text-sm",
  l: "py-3 text-sm",
};

/** Le grand relief n'est porté que par la grande taille, et seulement par le plein. */
const RELIEF = "shadow-lg shadow-amber-400/20";

export function bouton({
  variante = "principal",
  taille = "m",
}: {
  variante?: VarianteDeBouton;
  taille?: TailleDeBouton;
} = {}): string {
  const relief = variante === "principal" && taille === "l" ? ` ${RELIEF}` : "";
  const tailles = variante === "lien" ? TAILLES_DU_LIEN : TAILLES;
  return `${COMMUN} ${VARIANTES[variante]} ${tailles[taille]}${relief}`;
}
