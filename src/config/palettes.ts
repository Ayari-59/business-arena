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
 *   · `sombre` : l'échelle posée sur le tableau (le marine), du pâle (50) au
 *     profond (950). Les paliers 200 à 400 servent de texte, le 500 de fond de
 *     bouton, le 950 de voile ;
 *   · `clair` : sur le papier, l'accent n'est plus une lueur mais une ENCRE.
 *     Trois valeurs suffisent, celles du site d'origine : une encre pour les
 *     liens et les filets, un remplissage pour le bouton, un voile de fond.
 *
 * L'APLAT D'ACTION SUIT LA PALETTE. La palette d'origine, l'orange de
 * l'arène, pose ses aplats en orange vif avec un texte marine (variables
 * `--accent-plein*` de globals.css). Une autre palette les rebranche sur son
 * propre remplissage et sur le texte clair qu'il a été mesuré pour porter.
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
 * Les valeurs ont été tirées d'une même courbe de clarté, celle de l'ancien
 * laiton, dont on n'a changé que la teinte ; le palier 600 a été relevé d'un
 * cran quand le tableau est passé du vert-noir au marine, plus clair, pour
 * tenir encore 4,5 pour 1.
 */
export type CodePalette = "arene" | "cobalt" | "prune" | "lagune";

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
   * L'échelle sur surface sombre. Pour la palette d'origine, la copie exacte
   * de ce que globals.css pose : elle n'émet rien.
   */
  sombre: Partial<Record<Palier, string>>;
  /** L'encre, le remplissage et le voile, sur surface claire. */
  clair: { encre: string; remplissage: string; voile: string };
}

/** LA PALETTE D'ORIGINE : celle que globals.css pose. Elle n'ajoute aucune règle. */
export const PALETTE_D_ORIGINE: CodePalette = "arene";

/** La palette servie tant que personne n'en a choisi une autre. */
export const PALETTE_PAR_DEFAUT: CodePalette = PALETTE_D_ORIGINE;

export const PALETTES: Palette[] = [
  {
    code: "arene",
    nom: "Orange arène",
    description: "Un orange ambré d'action sur le marine. L'habillage d'origine.",
    sombre: {
      50: "#ff8a1f",
      100: "#ff8a1f",
      200: "#ff8a1f",
      300: "#ff8a1f",
      400: "#ff8a1f",
      500: "#ff8a1f",
      600: "#e67300",
      700: "#b35c00",
      800: "#8a4400",
      900: "#5c2d00",
      950: "#2b1600",
    },
    clair: { encre: "#a35200", remplissage: "#a35200", voile: "#f0f2f4" },
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
      600: "#5a8fd4",
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
      600: "#b07bc8",
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
      600: "#049fac",
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
 * DEUX CONTEXTES : le papier, qui prend l'encre de la palette, et le tableau
 * (une bande à contre-jour, ou une `ardoise`), qui prend son échelle « sombre » : l'accent se
 * lit comme une lueur sur le marine, pas comme une encre. Recolorer le seul
 * papier laisserait chaque tableau dans l'orange, une seconde palette peinte
 * au milieu de la première.
 *
 * La spécificité est celle du thème PLUS l'élément (`html[...]`) : la règle
 * l'emporte sur celles de theme-clair.css quel que soit l'ordre des feuilles.
 */
export function feuilleDePalette(code: CodePalette): string {
  if (code === PALETTE_D_ORIGINE) return "";
  const palette = paletteParCode(code);
  // L'aplat d'action reprend le remplissage de la palette et le texte clair
  // qu'il porte, sur chaque sol : une variable qui lit une autre variable se
  // résout là où elle est posée, d'où sa reprise dans les deux règles.
  const aplat =
    "--accent-plein:var(--color-amber-500);--accent-plein-survol:var(--color-amber-500);" +
    "--accent-plein-texte:var(--color-slate-950);--accent-plein-ombre:var(--color-amber-700);";
  // CE QUI N'APPARTIENT QU'À L'ORANGE DE L'ARÈNE. Ses voiles d'état neutres
  // (sur le papier comme sur le marine) et son accent toujours plein
  // (globals.css) sont des choix de l'arène, pas du site : une autre palette
  // les remet à `initial`, et les règles retombent sur l'accent de la
  // palette, dilué comme la classe le demande.
  const propresALArene =
    "--accent-sans-dilution:initial;--voile-choisi-leger:initial;" +
    "--voile-choisi:initial;--voile-choisi-fort:initial;";
  const propresAuTableau =
    "--voile-choisi-marine-leger:initial;--voile-choisi-marine:initial;--voile-choisi-marine-fort:initial;";
  return (
    `html[data-theme="clair"]{${lignes(echelleClaire(palette))}${aplat}${propresALArene}}` +
    `html[data-theme="clair"] .contre-jour,html[data-theme="clair"] .ardoise{${lignes(palette.sombre)}${aplat}${propresAuTableau}}`
  );
}
