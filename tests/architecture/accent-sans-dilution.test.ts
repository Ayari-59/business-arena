import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PALETTES, PALETTE_D_ORIGINE, feuilleDePalette } from "../../src/config/palettes";

/**
 * L'ACCENT NE SE DILUE PAS.
 *
 * Un filet d'orange à 40 %, une flèche à 60 %, un cadre à 30 % : sur le blanc,
 * l'orange dilué devient un saumon, sur le marine un cuivre. Ce sont les
 * teintes douces que le propriétaire a demandé de retirer. globals.css rend
 * donc chaque dilution d'accent employée (texte, cadre, filet, soulignement,
 * anneau, point) à l'accent plein, par la variable `--accent-sans-dilution`.
 *
 * Tailwind compose chaque dilution sans prise pour une autre : une classe
 * ajoutée demain dans une page, et oubliée dans la feuille, ramènerait le
 * saumon sans que rien le signale. Cette garde la refuse, et vérifie que les
 * autres palettes, qui ne sont pas concernées, retombent sur leur dessin.
 */

const SRC = join(process.cwd(), "src");
const CSS = readFileSync(join(SRC, "app", "globals.css"), "utf8");

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (/\.(tsx|ts)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

/** Le sélecteur CSS d'une classe Tailwind : `hover:text-amber-400/80` → `.hover\:text-amber-400\/80`. */
const selecteur = (classe: string) => `.${classe.replace(/([:/[\]])/g, "\\$1")}`;

/** Les dilutions d'accent que la feuille doit rendre pleines. Les fonds de 5 à 25 % sont des voiles d'état (voile-d-etat.test.ts). */
const MOTIF =
  /(?<![\w[\]:/-])((?:hover:|has-\[:checked\]:|open:)?(?:text|border|border-l|decoration|ring|bg|before:bg|via|from)-amber-\d+\/(\d+))(?![\w[])/g;

describe("l'accent ne se dilue pas", () => {
  const employees = new Map<string, string>();
  for (const f of fichiers(SRC)) {
    for (const m of readFileSync(f, "utf8").matchAll(MOTIF)) {
      const classe = m[1]!;
      if (/^bg-amber-\d+\/(5|10|15|20|25)$/.test(classe)) continue;
      // Les paliers 800 à 950 sont des fonds neutres sur le papier, pas l'accent.
      if (/bg-amber-(800|900|950)\//.test(classe)) continue;
      if (/(hover|has-\[:checked\]):bg-amber-\d+\/(10|20)$/.test(classe)) continue;
      employees.set(classe, f.slice(SRC.length + 1));
    }
  }

  it("chaque dilution employée a sa règle pleine dans globals.css", () => {
    expect(employees.size, "aucune dilution trouvée : la garde ne garde rien").toBeGreaterThan(10);
    const oubliees = [...employees].filter(([classe]) => {
      const i = CSS.indexOf(selecteur(classe));
      if (i < 0) return true;
      const regle = CSS.slice(i, CSS.indexOf("}", i));
      const taux = classe.split("/")[1];
      return !regle.includes(`var(--accent-sans-dilution, ${taux}%)`);
    });
    expect(
      oubliees.map(([c, f]) => `${c} (${f})`),
      "dilutions d'accent sans règle pleine",
    ).toEqual([]);
  });

  it("l'orange de l'arène pose l'accent plein", () => {
    expect(CSS).toMatch(/:root\s*\{[^}]*--accent-sans-dilution: 100%;/);
  });

  it("les autres palettes retombent sur leur dilution, leurs voiles et leur anneau", () => {
    expect(feuilleDePalette(PALETTE_D_ORIGINE)).toBe("");
    for (const p of PALETTES.filter((q) => q.code !== PALETTE_D_ORIGINE)) {
      const f = feuilleDePalette(p.code);
      const papier = f.slice(0, f.indexOf("}"));
      const tableau = f.slice(f.indexOf(".contre-jour"));
      for (const nom of [
        "accent-sans-dilution",
        "voile-choisi-leger",
        "voile-choisi",
        "voile-choisi-fort",
      ]) {
        expect(papier, `${p.code} : --${nom}`).toContain(`--${nom}:initial;`);
      }
      for (const nom of [
        "voile-choisi-marine-leger",
        "voile-choisi-marine",
        "voile-choisi-marine-fort",
      ]) {
        expect(tableau, `${p.code} : --${nom}`).toContain(`--${nom}:initial;`);
      }
      // L'anneau des hauts de page est retiré partout : plus de teinte à lui donner.
      expect(tableau, `${p.code} : anneau`).not.toContain("--halo-de-page");
    }
  });
});
