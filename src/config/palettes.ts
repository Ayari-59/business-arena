/**
 * LES PALETTES D'ACCENT : des jeux de couleurs VALIDÉS, entre lesquels
 * l'administrateur choisit. Il ne compose rien.
 *
 * L'accent du site est l'échelle « amber » : boutons, liens, filets, halos,
 * chiffres. Les utilitaires lisent des variables, donc remplacer l'échelle
 * recolore tout sans toucher une page. C'est ce que fait une palette.
 *
 * UNE PALETTE DIT DEUX CHOSES, parce que l'accent ne s'écrit pas pareil sur un
 * fond sombre et sur un fond clair :
 *
 *   · `sombre` : l'échelle posée sur les surfaces sombres, du pâle (50) au
 *     profond (950). Les paliers 200 à 400 servent de texte, le 500 de fond de
 *     bouton, le 950 de voile ;
 *   · `clair` : sur le papier, l'accent n'est plus une lueur mais une ENCRE.
 *     Trois valeurs suffisent, celles du site d'origine : une encre pour les
 *     liens et les filets, un remplissage pour le bouton, un voile de fond.
 *
 * LES COULEURS QUI PORTENT UN SENS NE BOUGENT PAS. Aucune palette n'est rouge
 * ni verte : le rouge est une perte, le vert un bénéfice, et un accent qui
 * emprunterait l'un des deux apprendrait à l'élève à lire un bouton comme un
 * résultat.
 *
 * « VALIDÉ » SE MESURE, ET SE MESURE ICI. tests/architecture/palettes.test.ts
 * calcule, pour CHAQUE palette, le contraste de chaque rôle sur les fonds du
 * site, dans les deux thèmes, et refuse la palette qui passe sous 4,5 pour 1.
 * Une palette ajoutée à cette liste n'entre donc pas sans avoir été mesurée.
 * Les valeurs ont été tirées d'une même courbe de clarté — celle du laiton —
 * dont on n'a changé que la teinte, ce qui garde à chaque palette le même
 * rapport de contraste que l'original.
 */
export type CodePalette = "laiton" | "cobalt" | "prune" | "lagune";

/** Les paliers de l'échelle d'accent, tels que Tailwind les nomme. */
export const PALIERS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
export type Palier = (typeof PALIERS)[number];

export interface Palette {
  code: CodePalette;
  nom: string;
  /** Ce que la palette change, en une phrase, pour la liste. */
  description: string;
  /**
   * L'échelle sur surface sombre. Pour le laiton, seuls les paliers que
   * globals.css recouvre : c'est la palette d'origine, elle n'émet rien.
   */
  sombre: Partial<Record<Palier, string>>;
  /** L'encre, le remplissage et le voile, sur surface claire. */
  clair: { encre: string; remplissage: string; voile: string };
}

/** LA PALETTE D'ORIGINE : celle que globals.css pose. Elle n'ajoute aucune règle. */
export const PALETTE_D_ORIGINE: CodePalette = "laiton";

/** La palette servie tant que personne n'en a choisi une autre. */
export const PALETTE_PAR_DEFAUT: CodePalette = PALETTE_D_ORIGINE;

export const PALETTES: Palette[] = [
  {
    code: "laiton",
    nom: "Laiton",
    description: "Un or patiné sur une nuit encrée. L'habillage d'origine.",
    sombre: {
      200: "#f0dca8",
      300: "#e7cd8b",
      400: "#d8b45c",
      500: "#c39a34",
      600: "#a67f22",
      700: "#86641a",
      950: "#241b06",
    },
    clair: { encre: "#5c470f", remplissage: "#7a5f14", voile: "#f6efdb" },
  },
  {
    code: "cobalt",
    nom: "Cobalt",
    description:
      "Un bleu net, plus froid. Le plus neutre à côté des couleurs de secteur.",
    sombre: {
      50: "#f8fbff",
      100: "#ebf3ff",
      200: "#c8e0fe",
      300: "#b1d2fe",
      400: "#87bcff",
      500: "#68a3ed",
      600: "#5488ca",
      700: "#426ca1",
      800: "#395d8b",
      900: "#304d71",
      950: "#101d2d",
    },
    clair: { encre: "#2c4c73", remplissage: "#3c6598", voile: "#e5f0ff" },
  },
  {
    code: "prune",
    nom: "Prune",
    description:
      "Un violet sourd, plus feutré. Tranche avec les bleus de l'interface.",
    sombre: {
      50: "#fdf9ff",
      100: "#f9eeff",
      200: "#efd0fe",
      300: "#e6bef8",
      400: "#d5a2eb",
      500: "#be87d6",
      600: "#a06fb5",
      700: "#7f5891",
      800: "#6e4c7c",
      900: "#5a3f66",
      950: "#231728",
    },
    clair: { encre: "#5a3d67", remplissage: "#775288", voile: "#f6eafc" },
  },
  {
    code: "lagune",
    nom: "Lagune",
    description:
      "Un bleu-vert vif, plus frais. Le plus lumineux des quatre sur fond sombre.",
    sombre: {
      50: "#f2fdff",
      100: "#d6faff",
      200: "#a5ecf4",
      300: "#85e1eb",
      400: "#47cedc",
      500: "#05b5c4",
      600: "#0598a4",
      700: "#037983",
      800: "#006871",
      900: "#02565d",
      950: "#022125",
    },
    clair: { encre: "#00555c", remplissage: "#06717a", voile: "#dbf5f8" },
  },
];

export function estCodePalette(valeur: unknown): valeur is CodePalette {
  return typeof valeur === "string" && PALETTES.some((p) => p.code === valeur);
}

export function paletteParCode(code: CodePalette): Palette {
  return PALETTES.find((p) => p.code === code)!;
}

/**
 * L'échelle sur surface CLAIRE, étendue de trois valeurs à onze paliers : le
 * même découpage que le thème clair du site, où presque tout l'accent devient
 * une seule encre, le 500 un remplissage et le 950 un voile.
 */
export function echelleClaire(palette: Palette): Record<Palier, string> {
  const { encre, remplissage, voile } = palette.clair;
  return Object.fromEntries(
    PALIERS.map((p) => [
      p,
      p === 500 ? remplissage : p === 950 ? voile : encre,
    ]),
  ) as Record<Palier, string>;
}

const lignes = (echelle: Partial<Record<Palier, string>>) =>
  Object.entries(echelle)
    .map(([palier, valeur]) => `--color-amber-${palier}:${valeur};`)
    .join("");

/**
 * La feuille qui pose une palette, ou rien si c'est celle d'origine.
 *
 * QUATRE CONTEXTES, parce qu'un bloc à contre-jour prend le thème opposé : sur
 * une page sombre il porte l'échelle claire, sur une page claire l'échelle
 * sombre. Recolorer les seules pages laisserait chaque bande à contre-jour dans
 * le laiton, une troisième palette peinte au milieu des deux autres.
 *
 * La spécificité est celle du thème PLUS l'élément (`html[...]`) : la règle
 * l'emporte sur celles de theme-clair.css quel que soit l'ordre des feuilles.
 */
export function feuilleDePalette(code: CodePalette): string {
  if (code === PALETTE_D_ORIGINE) return "";
  const palette = paletteParCode(code);
  const sombre = lignes(palette.sombre);
  const clair = lignes(echelleClaire(palette));
  return (
    `html[data-theme="sombre"]{${sombre}}` +
    `html[data-theme="clair"]{${clair}}` +
    `html[data-theme="sombre"] .contre-jour{${clair}}` +
    `html[data-theme="clair"] .contre-jour{${sombre}}`
  );
}

/**
 * Les deux couleurs qui représentent la palette dans les pastilles de thème :
 * le premier accent du sombre, l'encre du clair. Celles du laiton sont dans
 * themes.ts ; une autre palette les remplace.
 */
export function accentsDeLaPalette(code: CodePalette): {
  sombre: string;
  clair: string;
} {
  const p = paletteParCode(code);
  return { sombre: p.sombre[400]!, clair: p.clair.encre };
}
