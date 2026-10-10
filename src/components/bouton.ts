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
 * · `principal` : ce qu'on attend de vous sur cet écran. Un par écran, en
 *   principe : deux boutons pleins côte à côte, c'est une hésitation affichée.
 *   L'orange plein, le texte marine.
 * · `secondaire` : l'autre chemin, celui qu'on prend sans être poussé : un
 *   filet fin, l'encre.
 * · `lien` : une action de troisième rang, dans une page dense : le texte
 *   souligné d'un pixel, sans cadre, À L'ENCRE. Il a été un « laiton », un
 *   contour orange, puis l'encre orange d'action. Lot P1 : l'orange ne sert
 *   plus qu'au bouton principal, au focus, à l'option cochée et au champ en
 *   saisie (garde `orange-de-l-action.test.ts`), et un lien n'est rien de cela.
 *
 * UNE SEULE FORME, TROIS VARIANTES (lot P1). Le site dessinait ses boutons de
 * cinq façons : plein en relief d'arcade (capitales condensées, ombre pleine
 * décalée de trois à six pixels), contour orange, contour blanc, aplat marine,
 * lien souligné. Il n'en a plus que trois, et elles partagent tout ce qui
 * n'est pas leur variante : le même rayon (`rounded-lg`), la même graisse
 * (600), la casse de la phrase, la grotesque de lecture, et pour une taille
 * donnée la même hauteur, qu'on soit plein ou filet (le plein porte un bord
 * transparent du pixel du filet). Le plein n'a plus de socle : une ombre
 * douce et courte, posée par la feuille (`.bouton-plein`, « LE BOUTON
 * D'ACTION » dans globals.css), et un enfoncement d'un pixel à l'appui. Les
 * boutons qui portaient leur propre forme (« Espace enseignant » en contour
 * orange, « Je suis enseignant » et « Passer au Tour N » en contour blanc,
 * « J'ai pris note ») passent par cette fonction ; « Suivant : … » garde son
 * aplat neutre (`bouton-suite`), dans cette forme.
 *
 * Toutes les tailles passent le plancher de 24 px de haut (règle WCAG 2.5.8) :
 * la plus petite fait 12 px de texte, 16 px d'interligne, 2 × 6 px de
 * remplissage et 2 × 1 px de bord, soit 30 px ; la moyenne en fait 38, la
 * grande 46 (le lien, sans bord, deux de moins).
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
  // vif, un texte marine en casse de phrase, une ombre douce et courte. Les
  // classes d'échelle restent pour ce qui ne lit pas la feuille. Le bord
  // transparent est le pixel du filet : même hauteur que le secondaire.
  principal: "bouton-plein border border-transparent bg-amber-400 text-slate-950 hover:bg-amber-300",
  // Un filet fin, l'encre ; au survol le filet s'éclaire, jamais à l'orange
  // (l'anneau du geste dit déjà, lui, qu'on peut toucher).
  secondaire:
    "bouton-filet border border-white/25 text-slate-100 hover:border-white/50 hover:bg-white/5",
  // Le lien est à l'encre, souligné ; le soulignement s'épaissit au survol.
  lien: "text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2",
};

/**
 * Une taille donne la même hauteur aux trois variantes. La grande parle en 16
 * px (le plein y était agrandi par la feuille, le filet non) : 24 px
 * d'interligne, 2 × 10 px de remplissage et le pixel du bord, 46 px. Le
 * remplissage a perdu deux pixels quand le corps en a gagné deux, pour que la
 * dernière carte du parcours sur téléphone tienne toujours sur un écran.
 */
const TAILLES: Record<TailleDeBouton, string> = {
  s: "px-3 py-1.5 text-xs",
  m: "px-4 py-2 text-sm",
  l: "px-6 py-2.5 text-base",
};

/** Un lien n'a pas de cadre : il garde la hauteur de sa taille, pas le retrait. */
const TAILLES_DU_LIEN: Record<TailleDeBouton, string> = {
  s: "py-1.5 text-xs",
  m: "py-2 text-sm",
  l: "py-2.5 text-base",
};

export function bouton({
  variante = "principal",
  taille = "m",
}: {
  variante?: VarianteDeBouton;
  taille?: TailleDeBouton;
} = {}): string {
  const tailles = variante === "lien" ? TAILLES_DU_LIEN : TAILLES;
  return `${COMMUN} ${VARIANTES[variante]} ${tailles[taille]}`;
}
