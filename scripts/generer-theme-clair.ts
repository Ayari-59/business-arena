/**
 * Engendre l'habillage du site : le PAPIER, et le TABLEAU.
 *
 * Le site n'a plus qu'un habillage (voir src/config/themes.ts). Il reste
 * engendré, et pour la raison qui a fait naître ce script : un renversement
 * recopié à la main teinte par teinte s'oublie quelque part, et l'oubli ne se
 * voit pas — il donne un bloc bleu pâle sur fond bleu pâle, au fond d'une page
 * que personne ne rouvre.
 *
 * LE PAPIER. Les classes du site ont été écrites pour un fond sombre
 * (`bg-slate-950` est le fond, `text-slate-100` le texte). On lit donc
 * l'échelle complète de Tailwind et on la renverse : le palier 950 prend la
 * valeur du 50, le 900 celle du 100, et ainsi de suite ; le blanc et le noir
 * s'échangent. Les couleurs de sens (rouge, vert) et de secteur suivent ce
 * renversement. L'échelle neutre, elle, ne se renverse plus : elle est écrite
 * (PAPIER, plus bas), un ivoire et une encre brune.
 *
 * LE TABLEAU. Un bloc à contre-jour, ou une `ardoise` (les écrans de chiffres
 * de l'arène, la projection), retrouve l'échelle d'origine — celle pour
 * laquelle les classes ont été écrites —, sauf son neutre, qui devient une
 * ardoise vert-noir et sa craie (TABLEAU, plus bas). Le fichier porte donc
 * deux blocs : le papier, et le tableau.
 *
 * Usage : npx tsx scripts/generer-theme-clair.ts
 * Le fichier produit est versionné : la compilation n'a pas besoin du script.
 * Le test tests/theme/themes.test.ts vérifie qu'il est à jour.
 */
import { readFileSync, writeFileSync } from "node:fs";

export const SOURCE_TAILWIND = "node_modules/tailwindcss/theme.css";
/**
 * L'IDENTITÉ DE LA MAISON, QUI RECOUVRE L'ÉCHELLE DE TAILWIND.
 *
 * Le site ne se sert pas de l'amber de Tailwind : son `@theme` le remplace par
 * un or patiné, et encre de bleu ses deux surfaces les plus sombres. Ces
 * valeurs-là SONT l'échelle du site ; celle de Tailwind n'en est que le point
 * de départ.
 *
 * Le bloc à contre-jour les a ignorées pendant une journée, et le défaut se
 * voyait : une bande sombre posée sur une page claire y ramenait l'amber brut,
 * #ffb900, un jaune d'autocar deux fois plus saturé que l'or du site, qu'on ne
 * trouve nulle part ailleurs. Une bande censée montrer le thème sombre peignait
 * une troisième palette.
 */
export const SOURCE_IDENTITE = "src/app/globals.css";
export const FICHIER_GENERE = "src/app/theme-clair.css";

/**
 * Le miroir : 50 ↔ 950, 100 ↔ 900, et ainsi de suite.
 *
 * Six paliers s'écartent du miroir exact, d'un ou deux crans vers le foncé :
 * 200, 300, 400, 500, 600 et les extrêmes. Le renversement n'est pas symétrique
 * parce que les deux fonds ne le sont pas : le fond sombre du site est très
 * sombre, le fond clair est presque blanc, donc une couleur qui se détachait
 * nettement du premier se noie dans le second. Mesuré par
 * tests/e2e/contraste.e2e.ts : à -800 les paliers 200 et 300 tombaient en
 * dessous de 4 pour 1 sur les puces et sous-titres des métiers ; à -900 ils
 * repassent au-dessus de 4,5.
 */
const MIROIR: Record<number, number> = {
  50: 950,
  100: 900,
  200: 900,
  300: 900,
  400: 700,
  500: 600,
  600: 500,
  700: 300,
  800: 200,
  900: 100,
  950: 50,
};

/**
 * Surcharges ponctuelles : quand le miroir global ne suffit pas pour une teinte
 * donnée. Le bouton d'action (bg-amber-500 text-slate-950) tombe à 3,6 pour 1
 * au palier 600 parce que l'ambre est la teinte la plus lumineuse de l'échelle.
 * On le pousse à 800, ce qui le ramène au-dessus de 4,5.
 *
 * amber-400 sert de texte accentué (liens, menu) : même décalage, un cran de
 * plus, pour rester lisible sur le fond presque blanc.
 */
const SURCHARGES: Record<string, number> = {
  "amber-500": 800,
  "amber-400": 900,
};

/**
 * LE PAPIER : l'échelle neutre de la page, écrite et non plus renversée.
 *
 * Le renversement de l'ardoise de Tailwind donnait un blanc bleuté et un gris
 * d'usine : le site ne choisissait pas son papier, il le subissait, et le
 * laiton se posait sur un blanc froid. Chaque palier garde ici la CLARTÉ
 * (le L d'oklch) que le renversement lui donnait, et ne change que de teinte,
 * vers un ivoire et une encre brune : les contrastes mesurés tiennent donc
 * tels quels. Seules les surfaces (700 à 950) prennent un peu plus de chaleur.
 *
 * Les clés sont celles des classes (`bg-slate-950` est le fond de la page).
 */
export const PAPIER: Record<number, string> = {
  50: "oklch(12.9% 0.02 60)",
  100: "oklch(20.8% 0.022 60)",
  200: "oklch(20.8% 0.022 60)",
  300: "oklch(20.8% 0.022 60)",
  400: "oklch(37.2% 0.03 65)",
  500: "oklch(44.6% 0.032 68)",
  600: "oklch(55.4% 0.034 70)",
  700: "oklch(86.9% 0.028 82)",
  800: "oklch(92.9% 0.022 84)",
  900: "oklch(96.4% 0.014 85)",
  950: "oklch(98.3% 0.009 88)",
};

/**
 * LE TABLEAU : une ardoise vert-noir et sa craie, là où la classe regarde
 * ensemble — les bandes à contre-jour, les écrans de chiffres de l'arène, la
 * projection. Il remplace la nuit bleue, qui n'était que le thème sombre posé
 * au milieu d'une page claire. Les paliers de texte (50 à 600) gardent la
 * clarté de l'échelle d'origine ; les fonds (700 à 950) sont relevés d'un cran
 * pour qu'on y reconnaisse une ardoise et non un écran éteint.
 */
export const TABLEAU: Record<number, string> = {
  50: "oklch(98.4% 0.006 150)",
  100: "oklch(96.8% 0.008 150)",
  200: "oklch(92.9% 0.012 152)",
  300: "oklch(86.9% 0.016 152)",
  400: "oklch(70.4% 0.022 155)",
  500: "oklch(55.4% 0.024 158)",
  600: "oklch(44.6% 0.024 160)",
  700: "oklch(37.2% 0.022 160)",
  800: "oklch(31% 0.02 160)",
  900: "oklch(26.5% 0.018 162)",
  950: "oklch(23% 0.016 162)",
};

/** Les couleurs que le `@theme` du site pose par-dessus celles de Tailwind. */
export function identiteDeLaMaison(sourceGlobals: string): Map<string, string> {
  const debut = sourceGlobals.indexOf("@theme {");
  if (debut < 0) throw new Error(`bloc @theme introuvable dans ${SOURCE_IDENTITE}`);
  const bloc = sourceGlobals.slice(debut, sourceGlobals.indexOf("\n}", debut));
  const surcouches = new Map<string, string>();
  for (const [, teinte, palier, valeur] of bloc.matchAll(/--color-([a-z]+)-(\d+):\s*([^;]+);/g)) {
    if (teinte && palier && valeur) surcouches.set(`${teinte}-${palier}`, valeur.trim());
  }
  if (surcouches.size === 0) throw new Error("le @theme du site ne pose aucune couleur");
  return surcouches;
}

export function genererThemeClair(sourceTailwind: string, sourceGlobals: string): string {
  const palette = new Map<string, string>();
  for (const [, teinte, palier, valeur] of sourceTailwind.matchAll(
    /--color-([a-z]+)-(\d+):\s*([^;]+);/g,
  )) {
    if (teinte && palier && valeur) palette.set(`${teinte}-${palier}`, valeur.trim());
  }
  if (palette.size < 100) {
    throw new Error(`échelle Tailwind introuvable dans ${SOURCE_TAILWIND}`);
  }
  const identite = identiteDeLaMaison(sourceGlobals);

  // Deux listes jumelles : les valeurs RENVERSÉES, et les valeurs d'ORIGINE
  // des mêmes clés. La première fait une surface claire, la seconde ramène une
  // surface à l'échelle du site — c'est ce dont a besoin un bloc à contre-jour
  // au milieu d'une page claire, qui doit défaire ce que la page a posé.
  const renversees: string[] = [];
  const origines: string[] = [];
  const rendues = new Set<string>();
  for (const [cle, valeur] of palette) {
    const separateur = cle.lastIndexOf("-");
    const teinte = cle.slice(0, separateur);
    const palier = Number(cle.slice(separateur + 1));
    const palierCible = SURCHARGES[cle] ?? MIROIR[palier];
    const jumelle = palette.get(`${teinte}-${palierCible}`);
    if (!jumelle || jumelle === valeur) continue;
    renversees.push(
      `  --color-${teinte}-${palier}: ${teinte === "slate" ? PAPIER[palier] : jumelle};`,
    );
    // L'ORIGINE, C'EST L'ÉCHELLE DU SITE, pas celle de Tailwind. Un bloc à
    // contre-jour sur page claire doit retrouver l'or patiné et le bleu encré,
    // pas l'amber d'autocar et le gris d'usine.
    origines.push(
      `  --color-${teinte}-${palier}: ${teinte === "slate" ? TABLEAU[palier] : (identite.get(cle) ?? valeur)};`,
    );
    rendues.add(cle);
  }

  // Une couleur de la maison que le miroir a sautée — son palier jumeau lui
  // est égal — n'est jamais rendue au bloc à contre-jour, et la page claire
  // pourrait pourtant l'avoir recouverte à la main. On les ajoute toutes.
  for (const [cle, valeur] of identite) {
    if (!rendues.has(cle)) origines.push(`  --color-${cle}: ${valeur};`);
  }

  const clair = (lignes: string[]) =>
    ["  --color-white: #000;", "  --color-black: #fff;", ...lignes].join("\n");
  const sombre = (lignes: string[]) =>
    ["  --color-white: #fff;", "  --color-black: #000;", ...lignes].join("\n");

  // Les blocs à contre-jour sont indentés d'un cran : leurs lignes vivent sous
  // un sélecteur descendant, et la feuille se relit mieux ainsi.
  const decale = (bloc: string) =>
    bloc
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n");

  return `/* ---------------------------------------------------------------------------
 * Le papier et le tableau — FICHIER GÉNÉRÉ, ne pas modifier à la main.
 * Régénérer avec : npx tsx scripts/generer-theme-clair.ts
 * ------------------------------------------------------------------------- */
[data-theme="clair"] {
${clair(renversees)}
}

/* ---------------------------------------------------------------------------
 * LE TABLEAU : une ardoise au milieu du papier — une bande à contre-jour, un
 * écran de chiffres, la projection.
 *
 * Il ramène l'échelle d'origine, celle pour laquelle les classes ont été
 * écrites, ce qui revient à DÉFAIRE, pour ce bloc seulement, ce que le papier
 * vient de poser : d'où la reprise des mêmes clés avec leurs valeurs de
 * départ. Seul le neutre diffère, qui devient l'ardoise et sa craie.
 *
 * Sa spécificité (deux sélecteurs) l'emporte sur celle du thème (un seul),
 * quel que soit l'ordre des règles dans la feuille.
 *
 * Une seule bande à contre-jour par écran : le contraste attire l'œil parce
 * qu'il est unique sur la page, pas parce qu'il est joli. Deux, et aucune des
 * deux ne fonctionne.
 * ------------------------------------------------------------------------- */
[data-theme="clair"] .contre-jour,
[data-theme="clair"] .ardoise {
${decale(sombre(origines))}
}

/* L'impression reste sur du papier blanc : les classes
 * print:bg-white et print:text-black des fiches d'atelier s'appuient dessus. */
@media print {
  [data-theme="clair"] {
    --color-white: #fff;
    --color-black: #000;
  }
}
`;
}

if (process.argv[1]?.endsWith("generer-theme-clair.ts")) {
  const css = genererThemeClair(
    readFileSync(SOURCE_TAILWIND, "utf-8"),
    readFileSync(SOURCE_IDENTITE, "utf-8"),
  );
  writeFileSync(FICHIER_GENERE, css);
  console.log(`${FICHIER_GENERE} écrit (${css.split("\n").length} lignes)`);
}
