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
 * · `secondaire` — l'autre chemin, celui qu'on prend sans être poussé.
 * · `laiton` — une action de second rang dans une page dense, qui doit se
 *   distinguer d'un texte sans peser comme un bouton plein.
 *
 * TROIS TAILLES, ET LA PLUS GRANDE PORTE L'OMBRE. Une ombre laiton donne de la
 * présence à l'appel d'une page publique ; posée sur les huit boutons d'un
 * écran de pilotage, elle devient du bruit. La règle est donc simple à suivre :
 * grand bouton = appel de page = un peu de relief.
 *
 * Toutes les tailles passent le plancher de 24 px de haut (règle WCAG 2.5.8) :
 * la plus petite fait 12 px de texte, 16 px d'interligne et 2 × 6 px de
 * remplissage, soit 28 px.
 */

export type VarianteDeBouton = "principal" | "secondaire" | "laiton";
export type TailleDeBouton = "s" | "m" | "l";

/** Ce que tous les boutons partagent : la forme, l'alignement, l'état désactivé. */
const COMMUN =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTES: Record<VarianteDeBouton, string> = {
  principal: "bg-amber-400 text-slate-950 hover:bg-amber-300",
  secondaire: "border border-white/15 text-slate-200 hover:border-amber-400/50 hover:bg-white/5",
  laiton: "border border-amber-400/40 text-amber-300 hover:border-amber-400 hover:bg-amber-400/10",
};

const TAILLES: Record<TailleDeBouton, string> = {
  s: "px-3 py-1.5 text-xs",
  m: "px-4 py-2 text-sm",
  l: "px-6 py-3 text-sm",
};

/** L'ombre n'est portée que par la grande taille, et seulement par le plein. */
const RELIEF = "shadow-lg shadow-amber-400/20";

export function bouton({
  variante = "principal",
  taille = "m",
}: {
  variante?: VarianteDeBouton;
  taille?: TailleDeBouton;
} = {}): string {
  const relief = variante === "principal" && taille === "l" ? ` ${RELIEF}` : "";
  return `${COMMUN} ${VARIANTES[variante]} ${TAILLES[taille]}${relief}`;
}
