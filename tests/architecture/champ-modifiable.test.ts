import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UN CHAMP MODIFIABLE SAUTE AUX YEUX, UNE INFORMATION CONSULTABLE RESTE PLATE
 * (lot 6E, point 5). Mesuré, pas jugé à l'œil.
 *
 * Sur le cockpit, un champ avait le fond #1b416f sur un panneau… du marine de
 * la page, et un liseré gris : à trois mètres, rien ne disait où écrire. Les
 * trois sols du cockpit (page, panneau, champ) sont maintenant ÉCARTÉS et LUS,
 * et cette garde tient les contrastes qui les font distinguer :
 *
 *   · le fond du champ est NETTEMENT plus clair que le panneau (≥ 1,35 pour 1),
 *     et le panneau nettement plus clair que la page (≥ 1,4) ;
 *   · le liseré du champ tient 3 pour 1 contre le panneau ET contre la page
 *     (contour d'un contrôle, WCAG 1.4.11) ;
 *   · ce qui s'écrit dans le champ se lit : le chiffre ≥ 4,5, l'unité ≥ 4,5 ;
 *   · le panneau garde ce qui s'y lit : le rouge de résultat ≥ 4,5 (c'est lui
 *     qui interdit d'éclaircir le panneau) ;
 *   · la règle qui pose ces sols sur le champ existe, hors du papier ; les
 *     radios et les cases prennent le même liseré, et l'orange quand ils sont
 *     cochés (une option cochée est une décision).
 * Le navigateur mesure le reste (`tests/e2e/energie-de-l-arene.e2e.ts`).
 */

const CSS = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
const jeton = (nom: string): string => {
  const m = CSS.match(new RegExp(`--${nom}:\\s*(#[0-9a-f]{6})`, "i"));
  expect(m, `--${nom} introuvable`).not.toBeNull();
  return m![1]!.toLowerCase();
};

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const contraste = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const PAGE = jeton("sol-page");
const PANNEAU = jeton("sol-panneau");
const CHAMP = jeton("sol-champ");
const FILET = jeton("filet-champ");

describe("les trois sols du cockpit se distinguent", () => {
  it("la page, le panneau et le champ sont trois niveaux, pas trois nuances", () => {
    expect(contraste(PAGE, PANNEAU), `page ${PAGE} / panneau ${PANNEAU}`).toBeGreaterThanOrEqual(
      1.4,
    );
    expect(contraste(PANNEAU, CHAMP), `panneau ${PANNEAU} / champ ${CHAMP}`).toBeGreaterThanOrEqual(
      1.35,
    );
    // Du plus profond au plus clair : page < panneau < champ.
    expect(luminance(PAGE)).toBeLessThan(luminance(PANNEAU));
    expect(luminance(PANNEAU)).toBeLessThan(luminance(CHAMP));
  });

  it("le liseré d'un champ tient 3 pour 1 contre le panneau et contre la page", () => {
    expect(contraste(FILET, PANNEAU)).toBeGreaterThanOrEqual(3);
    expect(contraste(FILET, PAGE)).toBeGreaterThanOrEqual(3);
    expect(contraste(FILET, CHAMP)).toBeGreaterThanOrEqual(3);
  });

  it("ce qui s'écrit dans le champ se lit, et le panneau garde son rouge", () => {
    // Le chiffre (#f6f3ec), l'unité (#e2ddd3, et le gris #c2bcb2 qui en reste ailleurs).
    for (const encre of ["#f6f3ec", "#e2ddd3", "#c2bcb2"]) {
      expect(contraste(encre, CHAMP), `${encre} sur le champ`).toBeGreaterThanOrEqual(4.5);
    }
    // Le rouge de résultat (#ff7070) et le bleu donnée (#8fb0dc) sur le panneau.
    expect(contraste("#ff7070", PANNEAU)).toBeGreaterThanOrEqual(4.5);
    expect(contraste("#8fb0dc", PANNEAU)).toBeGreaterThanOrEqual(4.5);
  });

  it("le cockpit pose ces sols : la page, le panneau, le champ hors du papier", () => {
    expect(CSS).toMatch(/body:has\(main\[data-ecran-de-jeu\]\) \{[^}]*var\(--sol-page/);
    expect(CSS).toMatch(/\.panneau \{[^}]*background-color: var\(--sol-panneau/);
    expect(CSS).toMatch(
      /\[data-ecran-de-jeu\] \.champ:not\(\.papier \.champ\):not\(\.champ-facultatif\) \{\s*background-color: var\(--sol-champ/,
    );
    expect(CSS).toMatch(
      /\[data-ecran-de-jeu\] \.champ:not\(\.papier \.champ\) \{\s*border-color: var\(--filet-champ\)/,
    );
  });

  it("les radios et les cases ont le liseré d'un champ, et l'orange plein une fois cochés", () => {
    const bloc = CSS.slice(CSS.indexOf("LES CHOIX DE LA FEUILLE : RADIOS ET CASES"));
    expect(bloc).toMatch(/appearance: none;[\s\S]*border: 2px solid var\(--filet-champ\)/);
    expect(bloc).toMatch(
      /:checked:not\(\.papier \*\)[^{]*\{\s*border-color: var\(--accent-plein\)/,
    );
    expect(bloc).toContain("radial-gradient(circle, var(--accent-plein)");
  });
});
