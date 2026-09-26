import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LES PAGES QUI SONT DU PAPIER.
 *
 * Trois pages du site ne sont pas des écrans : la fiche d'une page, le manuel
 * de l'enseignant et la liasse de courriers. Elles se posent sous le thème
 * clair (`data-theme="clair"`) et sortent d'une imprimante.
 *
 * LE PIÈGE, ET IL A MORDU. Le thème clair ne pose pas des couleurs claires :
 * il RENVERSE l'échelle entière. `slate-900`, le presque-noir du thème sombre,
 * y vaut 96,8 % de clarté ; `bg-white` y vaut #000. Une page écrite avec les
 * couleurs qu'on voudrait voir — « fond blanc, encre slate-900 » — sort donc
 * exactement à l'envers : au mieux illisible, au pire vide. Le manuel public
 * s'imprimait ainsi sans ses titres ni son sommaire, mesuré à L* 96 sur papier
 * blanc, et la fiche élève sans les siens.
 *
 * LA RÈGLE. Sur ces pages, une couleur s'écrit au palier qui porte la CLARTÉ
 * voulue, c'est-à-dire au palier miroir : l'encre dans le bas de l'échelle
 * (slate-100 à slate-600), le papier dans le haut (slate-900, slate-950). Les
 * blancs et noirs littéraux n'y ont pas leur place, puisque le thème les
 * échange. Ce qui se voit à l'écran est alors exactement ce qui s'imprime.
 *
 * Les seuils ci-dessous ne sont pas écrits à la main : ils sont LUS dans le
 * thème engendré. Si l'échelle change, le garde-fou change avec elle.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(racine)) {
    const p = join(racine, e);
    if (statSync(p).isDirectory()) out.push(...fichiers(p));
    else if (e.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** La clarté perçue d'une couleur du thème clair, de 0 (noir) à 100 (blanc). */
function clarte(valeur: string): number | null {
  const okl = /^oklch\(\s*([\d.]+)%/.exec(valeur);
  if (okl) return Number(okl[1]);
  const hex = /^#([0-9a-f]{6})$/i.exec(valeur.trim());
  if (!hex) return null;
  const n = parseInt(hex[1]!, 16);
  const canaux = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const y = 0.2126 * canaux[0]! + 0.7152 * canaux[1]! + 0.0722 * canaux[2]!;
  return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y;
}

/**
 * La palette telle que le thème clair la sert. Deux sources, dans cet ordre :
 * le fichier engendré, puis le laiton écrit à la main dans globals.css, qui
 * l'emporte — c'est lui qui rend les ambres sombres sur fond clair.
 */
function paletteClaire(): Map<string, number> {
  const palette = new Map<string, number>();
  const ajouter = (css: string) => {
    for (const m of css.matchAll(/--color-([a-z]+)-(\d+):\s*([^;]+);/g)) {
      const c = clarte(m[3]!.trim());
      if (c !== null) palette.set(`${m[1]}-${m[2]}`, c);
    }
  };
  ajouter(readFileSync(join(SRC, "app", "theme-clair.css"), "utf8"));
  const globals = readFileSync(join(SRC, "app", "globals.css"), "utf8");
  const debut = globals.indexOf('[data-theme="clair"] {');
  ajouter(globals.slice(debut, globals.indexOf("}", debut)));
  return palette;
}

/**
 * Le code seul, commentaires retirés. Une page de papier explique forcément
 * la règle en prose, et cette prose cite les classes interdites : sans ce
 * nettoyage, le garde-fou tombe sur l'explication qui le justifie.
 */
function codeSeul(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");
}

const PALETTE = paletteClaire();
const PAGES = fichiers(SRC).filter((f) => readFileSync(f, "utf8").includes('data-theme="clair"'));

/** L'encre doit rester lisible sur le papier ; le papier, rester du papier. */
const ENCRE_MAX = 60;
const PAPIER_MIN = 88;

describe("les pages faites pour l'imprimante", () => {
  it("il y en a, et on les trouve par le thème qu'elles posent", () => {
    expect(PAGES.length).toBeGreaterThanOrEqual(3);
  });

  it("l'échelle renversée est bien lue : slate-900 y est presque blanc", () => {
    expect(PALETTE.get("slate-900")).toBeGreaterThan(90);
    expect(PALETTE.get("slate-100")).toBeLessThan(40);
  });

  for (const page of PAGES) {
    const nom = page.slice(SRC.length + 1);
    const source = codeSeul(readFileSync(page, "utf8"));

    it(`${nom} : son encre se lit sur le papier`, () => {
      // Les couleurs translucides (amber-400/10) recouvrent sans remplacer :
      // elles ne décident ni de l'encre ni du papier.
      for (const m of source.matchAll(/\btext-([a-z]+-\d+)(?![/\d])/g)) {
        const c = PALETTE.get(m[1]!);
        if (c === undefined) continue;
        expect(
          c,
          `text-${m[1]} vaut ${c.toFixed(1)} de clarté sous le thème clair : ` +
            `c'est du papier, pas de l'encre. Écrivez le palier miroir.`,
        ).toBeLessThanOrEqual(ENCRE_MAX);
      }
    });

    it(`${nom} : son papier reste clair`, () => {
      for (const m of source.matchAll(/\bbg-([a-z]+-\d+)(?![/\d])/g)) {
        const c = PALETTE.get(m[1]!);
        if (c === undefined) continue;
        expect(
          c,
          `bg-${m[1]} vaut ${c.toFixed(1)} de clarté sous le thème clair : ` +
            `la page sortirait en aplat sombre. Écrivez le palier miroir.`,
        ).toBeGreaterThanOrEqual(PAPIER_MIN);
      }
    });

    it(`${nom} : pas de blanc ni de noir littéral, le thème les échange`, () => {
      for (const littéral of ["bg-white", "text-white", "bg-black", "text-black"]) {
        expect(
          new RegExp(`\\b${littéral}(?![/\\d-])`).test(source),
          `${littéral} : sous le thème clair, le blanc vaut #000 et le noir #fff.`,
        ).toBe(false);
      }
    });
  }
});
