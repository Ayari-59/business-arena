import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * L'ANNEAU DU HAUT DE PAGE S'ÉCRIT UNE FOIS.
 *
 * Il a été un disque de laiton flou ; l'habillage « L'arène » en a fait
 * l'anneau orange en filigrane de sa maquette. La forme a changé, la règle
 * non : une décoration, un composant, une teinte par fond.
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
  it("a sa teinte sur le marine, ne se pose pas sur le clair, et l'anneau la lit", () => {
    // Sur le marine, l'orange dilué est un filigrane ; sur le clair, le même
    // anneau est une tache. La teinte est déclarée pour chaque sol.
    expect(CSS).toMatch(
      /:root,\s*\[data-theme="clair"\] \.contre-jour,\s*\[data-theme="clair"\] \.ardoise\s*\{[^}]*--halo-de-page:/,
    );
    expect(CSS).toMatch(/\[data-theme="clair"\]\s*\{[^}]*--halo-de-page:/);
    // L'anneau ne se pose que sur le marine : sur le clair, il faisait une
    // tache rose pâle en haut à droite des pages d'épisode. Caché sur le
    // clair, rendu à un bloc à contre-jour.
    expect(CSS).toMatch(/\[data-theme="clair"\] \.halo-de-page\s*\{\s*display: none;/);
    expect(CSS).toMatch(
      /\[data-theme="clair"\] \.contre-jour \.halo-de-page\s*\{\s*display: block;/,
    );
    expect(CSS).toMatch(/\.halo-de-page\s*\{[^}]*var\(--halo-de-page\)/);
    // Le corps de page ne porte plus de halo : l'anneau est la seule lumière
    // de la page, et il vit dans son bloc. Deux décors qui divergent, c'est une
    // page à deux lumières ; le corps est donc un aplat déclaré.
    expect(CSS).toMatch(/body\s*\{[^}]*background-image:\s*none;/);
    expect(CSS, "un halo revient sous toute la page").not.toMatch(
      /body\s*\{[^}]*var\(--halo-de-page\)/,
    );
  });

  it("est un bleu plein de la gamme sur le marine, et le titre s'y lit encore", () => {
    // Orange dilué, à 18 puis à 45 %, l'anneau sortait cuivré : le
    // propriétaire ne voulait plus de ces teintes chaudes. C'est désormais un
    // bleu PLEIN, plus clair que le marine, ton sur ton, sans transparence.
    const bloc = CSS.match(
      /:root,\s*\[data-theme="clair"\] \.contre-jour,\s*\[data-theme="clair"\] \.ardoise\s*\{[^}]*--halo-de-page:\s*([^;]+);/,
    );
    expect(bloc, "teinte de l'anneau sur le marine introuvable").not.toBeNull();
    const teinte = bloc![1]!.trim();
    expect(teinte, "l'anneau redevient une couleur diluée").toMatch(/^#[0-9a-f]{6}$/i);
    const [r, , b] = [1, 3, 5].map((i) => parseInt(teinte.slice(i, i + 2), 16));
    expect(b!, `${teinte} n'est plus un bleu`).toBeGreaterThan(r! + 40);
    const lum = (hex: string) => {
      const [x, y, z] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * x! + 0.7152 * y! + 0.0722 * z!;
    };
    const ratio = (a: string, c: string) => {
      const [la, lc] = [lum(a), lum(c)];
      return (Math.max(la, lc) + 0.05) / (Math.min(la, lc) + 0.05);
    };
    expect(lum(teinte), "l'anneau doit être plus clair que le marine").toBeGreaterThan(
      lum("#0b2545"),
    );
    // Le titre du héros passe dessus : le blanc cassé de la première ligne et
    // l'orange ambré de la seconde (titre de grande taille, seuil 3:1).
    expect(ratio("#f6f3ec", teinte)).toBeGreaterThanOrEqual(4.5);
    expect(ratio("#ff8a1f", teinte)).toBeGreaterThanOrEqual(3);
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
