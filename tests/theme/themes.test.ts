import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  genererThemeClair,
  identiteDeLaMaison,
  FICHIER_GENERE,
  PAPIER,
  SOURCE_IDENTITE,
  SOURCE_TAILWIND,
  TABLEAU,
} from "../../scripts/generer-theme-clair";
import { COULEUR_DU_PAPIER, COULEUR_DU_TABLEAU } from "../../src/config/themes";

/**
 * L'HABILLAGE UNIQUE : le papier, et le tableau.
 *
 * Le site a eu deux thèmes, un interrupteur, une amorce qui relisait le choix
 * avant l'affichage et un réglage d'administration pour le thème d'ouverture.
 * Il n'en a plus qu'un. Ces essais tiennent les deux moitiés qui ne se parlent
 * pas — les couleurs dans les feuilles de style, les rares couleurs écrites en
 * clair dans le TypeScript pour ce qui ne lit pas les feuilles — et gardent la
 * porte fermée au retour d'un second thème par la bande.
 */
const GLOBALS = readFileSync("src/app/globals.css", "utf-8");
const CLAIR = readFileSync(FICHIER_GENERE, "utf-8");
const LAYOUT = readFileSync("src/app/layout.tsx", "utf-8");
const HEADER = readFileSync("src/components/site-header.tsx", "utf-8");

/** Les thèmes qui déclarent un JEU DE COULEURS : `[data-theme="x"] {`. */
const declaresEnCss = [...(GLOBALS + CLAIR).matchAll(/\[data-theme="([a-z]+)"\]\s*\{/g)].map(
  (m) => m[1]!,
);

/**
 * Une valeur d'échelle en #rrggbb, pour comparer aux couleurs écrites en
 * clair : l'hexadécimal tel quel, l'oklch(L% C H) converti.
 */
function oklchEnHex(valeur: string): string {
  if (/^#[0-9a-f]{6}$/i.test(valeur)) return valeur.toLowerCase();
  const [l, c, h] = valeur.match(/[\d.]+/g)!.map(Number) as [number, number, number];
  const L = l / 100;
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  return `#${rgb
    .map((x) => {
      const v = Math.max(0, Math.min(1, x));
      const s = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
      return Math.round(255 * s)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

describe("un seul habillage", () => {
  it("une seule palette déclarée : le papier", () => {
    expect([...new Set(declaresEnCss)]).toEqual(["clair"]);
    expect(GLOBALS + CLAIR, "une règle du thème sombre traîne encore").not.toContain(
      '[data-theme="sombre"]',
    );
  });

  it("aucun interrupteur, aucune amorce : la racine porte le papier dès le serveur", () => {
    expect(existsSync("src/components/theme-switcher.tsx")).toBe(false);
    expect(HEADER).not.toContain("ThemeSwitcher");
    expect(LAYOUT).toContain('data-theme="clair"');
    expect(LAYOUT, "une amorce relit encore un thème choisi").not.toContain("localStorage");
  });

  it("le navigateur dessine ses commandes pour le papier, et pour l'ardoise sur le tableau", () => {
    // Les barres de défilement, les champs et les cases à cocher sont dessinés
    // par le navigateur, qui ne lit pas nos variables.
    expect(GLOBALS).toMatch(/\[data-theme="clair"\]\s*\{[^}]*color-scheme: light;/);
    expect(GLOBALS).toMatch(
      /\[data-theme="clair"\] \.contre-jour,\s*\[data-theme="clair"\] \.ardoise\s*\{\s*color-scheme: dark;/,
    );
  });

  it("les couleurs écrites en clair sont celles des échelles, converties", () => {
    // La barre du téléphone, l'écran de démarrage et les aperçus de palette ne
    // lisent pas les feuilles : leurs couleurs sont recopiées, et une copie
    // dérive. Celle-ci se recalcule.
    expect(COULEUR_DU_PAPIER).toBe(oklchEnHex(PAPIER[950]!));
    expect(COULEUR_DU_TABLEAU).toBe(oklchEnHex(TABLEAU[950]!));
  });
});

describe("le fichier engendré", () => {
  it("est à jour", () => {
    // Il est versionné pour que la compilation n'ait pas besoin du script ;
    // versionner une sortie, c'est accepter qu'elle vieillisse en silence.
    const attendu = genererThemeClair(
      readFileSync(SOURCE_TAILWIND, "utf-8"),
      readFileSync(SOURCE_IDENTITE, "utf-8"),
    );
    expect(
      CLAIR,
      `${FICHIER_GENERE} n'est plus à jour : npx tsx scripts/generer-theme-clair.ts`,
    ).toBe(attendu);
  });

  it("le neutre du papier est celui de l'arène, écrit, pas le gris renversé de Tailwind", () => {
    const papier = CLAIR.slice(0, CLAIR.indexOf(".contre-jour"));
    for (const [palier, valeur] of Object.entries(PAPIER)) {
      expect(papier, `slate-${palier}`).toContain(`--color-slate-${palier}: ${valeur};`);
    }
  });

  it("le tableau rend l'échelle DU SITE, avec le marine pour neutre", () => {
    // Le site ne se sert pas de l'amber de Tailwind : son `@theme` le remplace
    // par l'orange de l'arène. Le bloc à contre-jour l'a ignoré pendant une
    // journée, du temps de l'or patiné, et une bande sombre y ramenait l'amber
    // brut, un jaune d'autocar qu'on ne trouve nulle part ailleurs. Seul le
    // neutre fait exception : il est écrit dans TABLEAU.
    const identite = identiteDeLaMaison(readFileSync(SOURCE_IDENTITE, "utf-8"));
    const debut = CLAIR.indexOf('[data-theme="clair"] .contre-jour,');
    const bloc = CLAIR.slice(debut, CLAIR.indexOf("\n}", debut));
    expect(bloc).toContain('[data-theme="clair"] .ardoise {');
    expect(identite.size, "le @theme du site ne pose aucune couleur").toBeGreaterThan(3);
    for (const [cle, valeur] of identite) {
      if (cle.startsWith("slate-")) continue;
      expect(bloc, `${cle} n'est pas rendue au tableau`).toContain(`--color-${cle}: ${valeur};`);
    }
    for (const [palier, valeur] of Object.entries(TABLEAU)) {
      expect(bloc, `slate-${palier} du tableau`).toContain(`--color-slate-${palier}: ${valeur};`);
    }
  });

  it("laisse le papier blanc à l'impression", () => {
    // Les fiches d'atelier s'impriment avec print:bg-white et print:text-black.
    // Sur le papier, où le blanc et le noir sont échangés, elles sortiraient en
    // noir sur noir.
    const impression = CLAIR.slice(CLAIR.indexOf("@media print"));
    expect(impression, "aucune règle d'impression").toContain("--color-white: #fff");
    expect(impression).toContain("--color-black: #000");
  });
});
