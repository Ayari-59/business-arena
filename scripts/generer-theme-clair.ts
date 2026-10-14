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
 * (PAPIER, plus bas), un fond clair à peine bleuté et une encre marine.
 *
 * LE TABLEAU. Un bloc à contre-jour, ou une `ardoise` (les écrans de chiffres
 * de l'arène, la projection), retrouve l'échelle d'origine — celle pour
 * laquelle les classes ont été écrites —, sauf son neutre, qui devient le
 * marine de l'arène et ses blancs (TABLEAU, plus bas). Le fichier porte donc
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
 * l'orange d'action de l'arène, et passe au marine ses deux surfaces les plus
 * sombres. Ces valeurs-là SONT l'échelle du site ; celle de Tailwind n'en est
 * que le point de départ.
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
 * Le fond clair de l'arène, ses cartes blanches et son encre. Les valeurs sont
 * celles de la maquette « L'arène », écrites en hexadécimal pour qu'on les
 * reconnaisse : le fond #f5f7fb, la carte #ffffff, le filet #dbe2ee, l'encre
 * #0e1a2b, le gris de texte #5a6880.
 *
 * Les clés sont celles des classes (`bg-slate-950` est le fond de la page,
 * `bg-slate-900` la carte, `text-slate-100` le texte), et chaque palier garde
 * le RÔLE et à peu près la clarté que le renversement lui donnait, pour que
 * les contrastes mesurés tiennent :
 *
 *   · 50 à 300, l'encre : 16 pour 1 sur le fond ;
 *   · 400, le texte secondaire, celui de la plupart des paragraphes : 6,6 pour
 *     1 sur le fond, 5,9 sur un champ ;
 *   · 500, le gris de la maquette, pour les mentions et le trait des champs :
 *     5,3 pour 1 sur le fond ;
 *   · 600, le gris le plus clair qui se lise encore sur une carte (4,7) ;
 *   · 700 et 800, le filet appuyé et le fond d'un champ ;
 *   · 900 et 950, la carte et la page.
 */
export const PAPIER: Record<number, string> = {
  50: "#0a1422",
  100: "#0e1a2b",
  200: "#0e1a2b",
  300: "#0e1a2b",
  400: "#4b5970",
  500: "#5a6880",
  600: "#66748b",
  700: "#d3dbe8",
  800: "#edf1f7",
  900: "#ffffff",
  950: "#f5f7fb",
};

/**
 * LE TABLEAU : le marine de l'arène et ses blancs cassés, là où la classe
 * regarde ensemble : l'en-tête, le haut de l'accueil, les bandes à
 * contre-jour, les écrans de chiffres de la partie, la projection. Il
 * remplace l'ardoise vert-noir de l'habillage « Papier & Tableau ».
 *
 *   · 950, le marine #0b2545 ; 900, sa surface relevée #13355f (une carte
 *     posée sur le marine) ; 800 et 700, le fond d'un champ et les filets ;
 *   · 600 et 500, des gris bleutés pour ce qui n'est pas du texte : le trait
 *     d'un champ (500) tient 3 pour 1 sur un champ comme sur une carte ;
 *   · 400, le texte secondaire, un gris chaud-neutre #c2bcb2 : 6,5 pour 1 sur
 *     la surface relevée ;
 *   · 300 à 50, l'INFORMATION : des blancs cassés (#f1ede4 pour le texte
 *     courant, 10,6 pour 1 sur la surface relevée), ni blanc pur ni bleu pâle.
 */
export const TABLEAU: Record<number, string> = {
  50: "#f6f3ec",
  100: "#f1ede4",
  200: "#ece8df",
  300: "#e2ddd3",
  400: "#c2bcb2",
  500: "#8aa0c0",
  600: "#6f86aa",
  700: "#2d5385",
  800: "#1b416f",
  900: "#13355f",
  950: "#0b2545",
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
    // contre-jour sur page claire doit retrouver l'orange de l'arène, pas
    // l'amber d'autocar de Tailwind.
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
 * LE TABLEAU : le marine au milieu du clair : l'en-tête, une bande à
 * contre-jour, un écran de chiffres, la projection.
 *
 * Il ramène l'échelle d'origine, celle pour laquelle les classes ont été
 * écrites, ce qui revient à DÉFAIRE, pour ce bloc seulement, ce que le papier
 * vient de poser : d'où la reprise des mêmes clés avec leurs valeurs de
 * départ. Seul le neutre diffère, qui devient le marine et ses blancs cassés.
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
