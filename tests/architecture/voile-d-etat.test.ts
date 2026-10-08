import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LE VOILE D'UN ÉTAT CHOISI EST NEUTRE, ET LE FILET EST ORANGE.
 *
 * Sur le clair, l'accent est une encre orange foncé : diluée à dix pour cent,
 * elle donnait un rose sale sous l'option cochée, l'étape en cours, le niveau
 * retenu ; tirée de l'orange vif mélangé au blanc, elle donnait une pêche
 * (#fff3ea), et le propriétaire ne voulait plus de ces teintes douces. Le fond
 * d'un état choisi est donc un gris froid tiré du marine, mélangé au blanc,
 * et l'orange ne tient plus que dans le filet. Sur le marine, le même rôle
 * revient au marine lui-même, posé sur la carte : l'orange dilué y sortait
 * cuivré.
 *
 * globals.css reprend ces voiles une dilution après l'autre, parce que
 * Tailwind compose la couleur de chaque classe sans prise pour un autre
 * palier. Une dilution ajoutée demain dans une page, et oubliée là-bas,
 * reviendrait à la pêche ou au cuivre sans que rien le signale : cette garde
 * la refuse.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (/\.(tsx|ts)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

const CSS = readFileSync(join(SRC, "app", "globals.css"), "utf8");
/** La feuille sur une ligne : un sélecteur long y est coupé à la mise en forme. */
const CSS_PLAT = CSS.replace(/\s+/g, " ");

/** Le sélecteur CSS d'une classe Tailwind : `hover:bg-amber-400/10` → `.hover\:bg-amber-400\/10`. */
const selecteur = (classe: string) => `.${classe.replace(/([:/[\]])/g, "\\$1")}`;

const MARINE = "#0b2545";
const ENCRE = "#b8460a";

function rvb(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
function luminance(hex: string): number {
  const [r, g, b] = rvb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contraste(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** `color-mix(in srgb, a p%, b)`, arrondi à l'octet comme le navigateur. */
function melange(a: string, p: number, b: string): string {
  const [x, y] = [rvb(a), rvb(b)];
  return `#${x
    .map((v, i) =>
      Math.round(v * p + y[i]! * (1 - p))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

describe("le voile d'un état choisi", () => {
  const employees = new Set<string>();
  for (const f of fichiers(SRC)) {
    for (const m of readFileSync(f, "utf8").matchAll(/[\][a-z0-9:_-]*bg-amber-(?:400|500)\/\d+/g)) {
      employees.add(m[0]);
    }
  }

  it("a sa règle sur le clair, pour chaque dilution que le site emploie", () => {
    expect(employees.size, "aucune dilution trouvée : la garde ne garde rien").toBeGreaterThan(3);
    const oubliees = [...employees].filter(
      (classe) => !CSS_PLAT.includes(`[data-theme="clair"] ${selecteur(classe)}`),
    );
    expect(oubliees, `dilutions sans voile sur le clair : ${oubliees.join(", ")}`).toEqual([]);
  });

  it("a sa règle sur le marine, pour chaque voile de fond (5 à 25 %)", () => {
    const voiles = [...employees].filter((c) => /amber-400\/(5|10|15|20|25)$/.test(c));
    expect(voiles.length, "aucun voile trouvé : la garde ne garde rien").toBeGreaterThan(3);
    const oubliees = voiles.filter(
      (classe) =>
        !CSS_PLAT.includes(`[data-theme="clair"] :is(.contre-jour, .ardoise) ${selecteur(classe)}`),
    );
    expect(oubliees, `voiles sans règle sur le marine : ${oubliees.join(", ")}`).toEqual([]);
  });

  it("est neutre sur le clair : tiré du marine et du blanc, plus de l'orange", () => {
    const debut = CSS.indexOf('[data-theme="clair"] .bg-amber-400\\/10:');
    expect(debut, "règle du voile à 10 % introuvable").toBeGreaterThan(0);
    const bloc = CSS.slice(debut, CSS.indexOf("}", debut));
    // La règle lit le voile neutre ; l'accent mélangé au blanc n'est que le
    // repli d'une autre palette, qui remet la variable à `initial`.
    expect(bloc).toMatch(
      /var\(--voile-choisi, color-mix\(in srgb, var\(--accent-plein\) \d+%, #fff\)\)/,
    );
    for (const nom of ["voile-choisi-leger", "voile-choisi", "voile-choisi-fort"]) {
      const m = CSS.match(
        new RegExp(`--${nom}: color-mix\\(in srgb, var\\(--marine\\) (\\d+)%, #fff\\);`),
      );
      expect(m, `--${nom} n'est plus tiré du marine et du blanc`).not.toBeNull();
      const voile = melange(MARINE, Number(m![1]) / 100, "#ffffff");
      // L'encre orange, celle des options cochées et de la ligne du joueur,
      // doit encore s'y lire.
      expect(
        contraste(ENCRE, voile),
        `encre ${ENCRE} sur --${nom} (${voile})`,
      ).toBeGreaterThanOrEqual(4.5);
      // Et c'est un gris froid, pas une teinte chaude : le bleu l'emporte.
      const [r, , b] = rvb(voile);
      expect(b!, `--${nom} (${voile}) n'est plus froid`).toBeGreaterThan(r!);
    }
  });

  it("est tiré du marine sur le marine, plus un cuivre", () => {
    for (const nom of [
      "voile-choisi-marine-leger",
      "voile-choisi-marine",
      "voile-choisi-marine-fort",
    ]) {
      expect(CSS, `--${nom}`).toMatch(
        new RegExp(`--${nom}: color-mix\\(in srgb, var\\(--marine\\) \\d+%, transparent\\);`),
      );
    }
  });
});
