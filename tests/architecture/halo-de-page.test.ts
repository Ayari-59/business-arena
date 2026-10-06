import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LE HALO DE LAITON S'ÉCRIT UNE FOIS.
 *
 * Six pages publiques dessinaient à la main le même disque flou derrière leur
 * en-tête : `bg-amber-400/10 blur-3xl`, à la hauteur près. Six copies d'une
 * décoration, ce sont six décorations qui dérivent — et surtout six endroits
 * où corriger le jour où l'on s'aperçoit d'un défaut.
 *
 * Ce jour est venu, et c'est une mesure qui l'a trouvé, pas un œil. Le laiton
 * du thème clair est un brun foncé : la lueur chaude dessinée pour le fond
 * d'encre y devenait une TACHE. Relevé au pixel en haut de l'accueil, le
 * centre tombait à #e2e0da quand le reste de la page est à #f8fafc — un tiers
 * de page vingt pour cent plus sombre que le reste, et de teinte opposée au
 * fond, qui est bleuté.
 *
 * La teinte vit donc dans `--halo-de-page`, qui change avec le thème, et le
 * disque dans un composant. Ce que cette garde tient : que personne ne le
 * redessine à côté.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (entree.endsWith(".tsx")) trouves.push(chemin);
  }
  return trouves;
}

const COMPOSANT = join(SRC, "components", "halo-de-page.tsx");
const CSS = readFileSync(join(SRC, "app", "globals.css"), "utf8");
const TSX = fichiers(SRC).map((chemin) => ({ chemin, source: readFileSync(chemin, "utf8") }));

describe("le halo de page", () => {
  it("a sa teinte par thème, et le disque la lit", () => {
    // Sur fond sombre, le laiton est une lueur ; sur fond clair, c'est le
    // laiton CLAIR de l'échelle qu'il faut, et faiblement.
    expect(CSS).toMatch(
      /:root,\s*\[data-theme="clair"\] \.contre-jour,\s*\[data-theme="clair"\] \.ardoise\s*\{[^}]*--halo-de-page:/,
    );
    expect(CSS).toMatch(/\[data-theme="clair"\]\s*\{[^}]*--halo-de-page:/);
    expect(CSS).toMatch(/\.halo-de-page\s*\{[^}]*var\(--halo-de-page\)/);
    // Le fond du corps de page lit la même teinte : deux halos qui divergent,
    // c'est une page à deux lumières.
    expect(CSS).toMatch(/body\s*\{[^}]*var\(--halo-de-page\)/);
  });

  it("n'est redessiné à la main nulle part", () => {
    const fautes = TSX.filter(
      ({ chemin, source }) =>
        chemin !== COMPOSANT && /bg-amber-\d+\/\d+[^"]*blur-3xl|blur-3xl[^"]*bg-amber/.test(source),
    ).map(({ chemin }) => chemin.slice(SRC.length + 1));
    expect(fautes, `halo écrit à la main : ${fautes.join(", ")}`).toEqual([]);
  });

  it("sert encore quelque part, sinon la règle ne garde rien", () => {
    const porteurs = TSX.filter(
      ({ chemin, source }) => chemin !== COMPOSANT && source.includes("<HaloDePage"),
    );
    expect(porteurs.length, "aucune page ne pose le halo").toBeGreaterThan(3);
  });
});
