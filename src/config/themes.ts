/**
 * Les thèmes du site : un sombre, un clair.
 *
 * Un thème ne redéfinit que deux choses : la teinte neutre, qui fait les fonds
 * et les textes, et la teinte d'accent, qui fait les boutons d'action. Les
 * couleurs de secteur et celles qui portent un sens (le rouge d'une perte, le
 * vert d'un bénéfice) ne bougent pas d'un thème à l'autre : les faire varier
 * demanderait à l'élève de réapprendre à lire ses écrans.
 *
 * Les valeurs vivent dans les feuilles de style, parce que Tailwind ne lit pas
 * le TypeScript. Ce fichier tient la liste, les libellés, et les pastilles du
 * sélecteur ; un test vérifie que les deux ne divergent pas.
 */
export type CodeTheme = "sombre" | "clair";

export interface Theme {
  code: CodeTheme;
  nom: string;
  /** Ce que le thème change, en une phrase, pour le sélecteur. */
  description: string;
  /**
   * Les deux couleurs de la pastille : le fond, puis l'accent.
   *
   * ELLES S'ÉCRIVENT EN CLAIR, et c'est le seul endroit du site où une couleur
   * doit échapper aux variables : la pastille représente l'AUTRE thème, donc
   * elle ne peut pas lire la palette que le thème courant vient de poser.
   *
   * Le revers est qu'elles se recopient, et qu'une copie dérive : elles ont
   * porté l'amber brut de Tailwind et le gris d'usine pendant que le site
   * servait un or patiné sur une nuit encrée. La pastille censée MONTRER le
   * thème sombre peignait des couleurs que le thème sombre n'a pas.
   */
  apercu: { fond: string; accent: string };
}

/**
 * LE THÈME D'ORIGINE : celui qui n'a pas de feuille, parce qu'il EST celle du
 * site. Le sombre est l'échelle de Tailwind telle quelle ; le clair la
 * renverse (voir theme-clair.css). Lui écrire un bloc reviendrait à recopier
 * ce qui existe déjà, avec le risque que la copie diverge — et c'est aussi
 * l'étalon des mesures de lisibilité : on vérifie qu'un thème ne dégrade pas
 * ce qui était lisible, il faut donc un « ce qui était ».
 */
export const THEME_DORIGINE: CodeTheme = "sombre";

/**
 * LE THÈME APPLIQUÉ TANT QUE PERSONNE N'A CHOISI.
 *
 * Ce n'est plus celui d'origine. Le site s'ouvrait en sombre, ce qui allait
 * bien à l'arène — on y joue en salle, projecteur éteint — et mal à tout le
 * reste : un enseignant découvre le produit sur l'ordinateur de sa salle, en
 * plein jour, souvent au vidéoprojecteur, et une page sombre y perd la moitié
 * de son contraste. Elle s'imprime aussi mal, et c'est de ces pages-là qu'on
 * tire des fiches.
 *
 * Les deux constantes étaient la même il y a peu, et les confondre coûterait
 * une mesure : « le thème par défaut » et « le thème de référence » se lisent
 * pareil et ne disent pas la même chose.
 */
export const THEME_PAR_DEFAUT: CodeTheme = "clair";

/** La clé du navigateur. Le choix reste sur l'appareil, il ne part sur aucun serveur. */
export const CLE_THEME = "arena-theme";

export const THEMES: Theme[] = [
  {
    code: "sombre",
    nom: "Sombre",
    description: "Gris bleuté et ambre, l'habillage d'origine. À l'aise dans une salle sombre.",
    apercu: { fond: "#070c1a", accent: "#d8b45c" },
  },
  {
    code: "clair",
    nom: "Clair",
    description: "Fond clair, lisible en salle éclairée et économe à l'impression.",
    apercu: { fond: "#f8fafc", accent: "#5c470f" },
  },
];

export function estCodeTheme(valeur: unknown): valeur is CodeTheme {
  return typeof valeur === "string" && THEMES.some((t) => t.code === valeur);
}
