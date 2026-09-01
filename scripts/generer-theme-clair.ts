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
 * Usage : npx tsx scripts/generer-theme-clair.ts
 * Le fichier produit est versionné : la compilation n'a pas besoin du script.
 * Le test tests/theme/themes.test.ts vérifie qu'il est à jour.
 */
import { readFileSync, writeFileSync } from "node:fs";

export const SOURCE_TAILWIND = "node_modules/tailwindcss/theme.css";
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
  "amber-500": 900,
  "amber-400": 900,
};

export function genererThemeClair(sourceTailwind: string): string {
  const palette = new Map<string, string>();
  for (const [, teinte, palier, valeur] of sourceTailwind.matchAll(
    /--color-([a-z]+)-(\d+):\s*([^;]+);/g,
  )) {
    if (teinte && palier && valeur) palette.set(`${teinte}-${palier}`, valeur.trim());
  }
  if (palette.size < 100) {
    throw new Error(`échelle Tailwind introuvable dans ${SOURCE_TAILWIND}`);
  }

  const lignes: string[] = [];
  for (const [cle, valeur] of palette) {
    const separateur = cle.lastIndexOf("-");
    const teinte = cle.slice(0, separateur);
    const palier = Number(cle.slice(separateur + 1));
    const palierCible = SURCHARGES[cle] ?? MIROIR[palier];
    const jumelle = palette.get(`${teinte}-${palierCible}`);
    if (!jumelle || jumelle === valeur) continue;
    lignes.push(`  --color-${teinte}-${palier}: ${jumelle};`);
  }

  return `/* ---------------------------------------------------------------------------
 * Thème clair — FICHIER GÉNÉRÉ, ne pas modifier à la main.
 * Régénérer avec : npx tsx scripts/generer-theme-clair.ts
 * ------------------------------------------------------------------------- */
[data-theme="clair"] {
  --color-white: #000;
  --color-black: #fff;
${lignes.join("\n")}
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
  const css = genererThemeClair(readFileSync(SOURCE_TAILWIND, "utf-8"));
  writeFileSync(FICHIER_GENERE, css);
  console.log(`${FICHIER_GENERE} écrit (${css.split("\n").length} lignes)`);
}
