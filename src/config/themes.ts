/**
 * Les thèmes du site.
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
export type CodeTheme = "ardoise" | "nuit" | "prune" | "clair";

export interface Theme {
  code: CodeTheme;
  nom: string;
  /** Ce que le thème change, en une phrase, pour le sélecteur. */
  description: string;
  /** Les deux couleurs de la pastille : le fond, puis l'accent. */
  apercu: { fond: string; accent: string };
}

/** Le thème appliqué tant que personne n'a choisi. Il n'a pas de feuille : c'est celle du site. */
export const THEME_PAR_DEFAUT: CodeTheme = "ardoise";

/** La clé du navigateur. Le choix reste sur l'appareil, il ne part sur aucun serveur. */
export const CLE_THEME = "arena-theme";

export const THEMES: Theme[] = [
  {
    code: "ardoise",
    nom: "Ardoise",
    description: "Gris bleuté et ambre, l'habillage d'origine.",
    apercu: { fond: "#020618", accent: "#f59e0b" },
  },
  {
    code: "nuit",
    nom: "Nuit",
    description: "Bleu profond et cyan, plus contrasté sur un écran.",
    apercu: { fond: "#050e1c", accent: "#06b6d4" },
  },
  {
    code: "prune",
    nom: "Prune",
    description: "Violet sombre et abricot, plus chaud.",
    apercu: { fond: "#150a1c", accent: "#fb923c" },
  },
  {
    code: "clair",
    nom: "Papier",
    description: "Fond clair, lisible en salle éclairée et économe à l'impression.",
    apercu: { fond: "#f8fafc", accent: "#b45309" },
  },
];

export function estCodeTheme(valeur: unknown): valeur is CodeTheme {
  return typeof valeur === "string" && THEMES.some((t) => t.code === valeur);
}
