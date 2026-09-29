/**
 * Génère le thème clair par inversion de l'échelle de Tailwind.
 *
 * Un thème clair n'est pas un choix de couleurs, c'est un renversement : ce
 * qui était un fond sombre devient un fond clair, ce qui était un texte clair
 * devient un texte sombre. Écrire ce renversement à la main teinte par teinte
 * garantit d'en oublier, et un oubli ne se voit pas : il donne un bloc bleu
 * pâle sur fond bleu pâle, illisible, quelque part au fond d'une page que
 * personne ne rouvre.
 *
 * On lit donc l'échelle complète de Tailwind et on l'inverse mécaniquement :
 * le palier 950 prend la valeur du 50, le 900 celle du 100, et ainsi de suite.
 * Le 500 se garde lui-même, c'est le pivot de chaque teinte. Le blanc et le
 * noir s'échangent, ce qui retourne du même coup les bordures « white/10 » en
 * bordures sombres discrètes.
 *
 * LE MÊME RENVERSEMENT SERT DEUX FOIS : à la page entière, et à un BLOC posé
 * à contre-jour au milieu d'elle. Une bande sombre sur une page claire, claire
 * sur une page sombre, attire l'œil sans rien ajouter au vocabulaire du site —
 * c'est le contraste d'une capture d'écran au milieu d'un texte. Le fichier
 * porte donc trois blocs : la page claire, et les deux contre-jour.
 *
 * Ils sont engendrés plutôt qu'écrits, pour la raison qui a fait naître ce
 * script : un renversement recopié à la main s'oublie quelque part, et l'oubli
 * ne se voit pas — il donne un bloc bleu pâle sur fond bleu pâle, au fond
 * d'une page que personne ne rouvre.
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
    renversees.push(`  --color-${teinte}-${palier}: ${jumelle};`);
    // L'ORIGINE, C'EST L'ÉCHELLE DU SITE, pas celle de Tailwind. Un bloc à
    // contre-jour sur page claire doit retrouver l'or patiné et le bleu encré,
    // pas l'amber d'autocar et le gris d'usine.
    origines.push(`  --color-${teinte}-${palier}: ${identite.get(cle) ?? valeur};`);
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
 * Thème clair — FICHIER GÉNÉRÉ, ne pas modifier à la main.
 * Régénérer avec : npx tsx scripts/generer-theme-clair.ts
 * ------------------------------------------------------------------------- */
[data-theme="clair"] {
${clair(renversees)}
}

/* ---------------------------------------------------------------------------
 * LE CONTRE-JOUR : un bloc dont le fond va à l'inverse de la page.
 *
 * Il ne se règle pas sur le thème mais CONTRE lui, donc il lui faut les deux
 * sens. Sur une page sombre, il pose l'échelle renversée — le bloc devient une
 * surface claire. Sur une page claire, il ramène l'échelle d'origine, ce qui
 * revient à DÉFAIRE, pour ce bloc seulement, ce que le thème de la page vient
 * de poser : d'où la reprise des mêmes clés avec leurs valeurs de départ.
 *
 * Sa spécificité (deux sélecteurs) l'emporte sur celle du thème (un seul),
 * quel que soit l'ordre des règles dans la feuille.
 *
 * Un seul bloc à contre-jour par écran : le contraste attire l'œil parce qu'il
 * est unique sur la page, pas parce qu'il est joli. Deux, et aucun des deux ne
 * fonctionne.
 * ------------------------------------------------------------------------- */
[data-theme="sombre"] .contre-jour {
${decale(clair(renversees))}
}

[data-theme="clair"] .contre-jour {
${decale(sombre(origines))}
}

/* L'impression reste sur du papier blanc quel que soit le thème : les classes
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
