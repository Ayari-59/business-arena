import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LA HIÉRARCHIE DES SURFACES.
 *
 * Avant : 41 conteneurs et 75 blocs intérieurs écrits à la main, tous en
 * aplats bordés au même trait. Posés les uns dans les autres, ils donnaient
 * des boîtes dans des boîtes, et une page sans relief où rien ne disait ce qui
 * portait quoi.
 *
 * La convention existait déjà en creux dans le code ; elle est maintenant
 * explicite et tenue en UN endroit :
 *   · CONTENANT — `carte` : rayon xl, fond slate-900, voile de lumière par le
 *     haut, ombre en deux temps ;
 *   · CONTENU — rayon lg, fond slate-950, bordure à 5 % : elle délimite sans
 *     encadrer.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string, ext: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(racine)) {
    const p = join(racine, e);
    if (statSync(p).isDirectory()) out.push(...fichiers(p, ext));
    else if (e.endsWith(ext)) out.push(p);
  }
  return out;
}

const css = readFileSync(join(SRC, "app", "globals.css"), "utf8");

describe("la carte, définie une fois", () => {
  it("porte ses trois traits : lumière du haut, ombre, rayon", () => {
    const bloc = css.slice(css.indexOf("@utility carte"), css.indexOf("}", css.indexOf("@utility carte")));
    expect(bloc).toContain("linear-gradient");
    expect(bloc).toContain("var(--ombre-carte)");
    expect(bloc).toContain("border-radius");
  });

  it("son ombre est propre à chaque thème", () => {
    // Sur fond clair, l'ombre du thème sombre serait une salissure.
    expect(css).toMatch(/:root\s*\{[^}]*--ombre-carte:/);
    expect(css).toMatch(/\[data-theme="clair"\]\s*\{[^}]*--ombre-carte:/);
  });

  it("à l'impression elle redevient plate, hors de toute couche", () => {
    // Une règle dans `@layer` perdrait contre les utilitaires `print:` selon
    // l'ordre de génération ; celle-ci gagne toujours.
    const impression = css.slice(css.indexOf("@media print"));
    expect(impression).toContain(".carte");
    expect(impression).toContain("box-shadow: none");
  });
});

describe("personne ne redessine une carte à la main", () => {
  const TSX = fichiers(SRC, ".tsx");

  it("l'ancienne signature de conteneur a disparu", () => {
    const fautifs = TSX.filter((f) =>
      readFileSync(f, "utf8").includes("rounded-xl border border-white/10 bg-slate-900"),
    );
    expect(fautifs, `à remplacer par \`carte\` :\n${fautifs.join("\n")}`).toEqual([]);
  });

  it("les blocs intérieurs ne portent plus un trait de conteneur", () => {
    const fautifs = TSX.filter((f) =>
      readFileSync(f, "utf8").includes("rounded-lg border border-white/10 bg-slate-950"),
    );
    expect(fautifs, `bordure à ramener à /5 :\n${fautifs.join("\n")}`).toEqual([]);
  });
});

describe("le rythme vertical de l'arène est déclaré une fois", () => {
  const page = readFileSync(join(SRC, "app", "arena", "[gameId]", "page.tsx"), "utf8");

  it("la colonne porte son écart, les enfants ne le reprennent pas", () => {
    const main = page.slice(page.indexOf('<main id="main"'));
    const ouverture = main.slice(0, main.indexOf(">"));
    expect(ouverture).toMatch(/space-y-\d/);
    // Les `mt-*` restants vivent DANS les blocs (un titre, un paragraphe), pas
    // sur les enfants directs de la colonne : c'est ce que vérifie l'absence
    // de `<div className="mt-N">` nu, la forme qu'avaient les cinq écarts
    // décidés séparément.
    expect(main).not.toMatch(/<div className="mt-\d">\s*\n\s*<(?:Round|Event|Team)/);
  });
});
