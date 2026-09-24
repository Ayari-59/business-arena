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

/**
 * LE CHAMP DE SAISIE SE VOIT AVANT QU'ON Y TOUCHE.
 *
 * Les champs portaient la surface du CONTENU — rayon lg, slate-950, bordure à
 * 5 % de blanc. Sur un bloc lui-même en slate-950, cela donnait un champ de la
 * couleur exacte de ce qui le porte, cerné d'un trait à 5 % : invisible. Et le
 * thème clair renversant l'échelle, `border-white/5` y était du blanc sur du
 * blanc — le même défaut, en pire.
 *
 * Le motif était écrit quarante-quatre fois à la main. Il vit maintenant dans
 * `@utility champ`, et ces gardes empêchent qu'il se réécrive à côté.
 */
describe("le champ, défini une fois", () => {
  it("porte ses trois traits : trait franc, fond décalé, creux", () => {
    const bloc = css.slice(css.indexOf("@utility champ"), css.indexOf("\n}", css.indexOf("@utility champ")));
    expect(bloc).toContain("var(--color-slate-500)");
    expect(bloc).toContain("var(--color-slate-800)");
    expect(bloc).toContain("var(--creux-champ)");
  });

  it("son creux est propre à chaque thème", () => {
    expect(css).toMatch(/:root\s*\{[^}]*--creux-champ:/);
    expect(css).toMatch(/\[data-theme="clair"\]\s*\{[^}]*--creux-champ:/);
  });

  it("le laiton du focus passe par une variable, pour que l'exception se dise sur place", () => {
    const bloc = css.slice(css.indexOf("@utility champ"), css.indexOf("\n}", css.indexOf("@utility champ")));
    expect(bloc).toContain("var(--focus-champ, var(--color-amber-400))");
  });
});

describe("personne ne redessine un champ à la main", () => {
  const TSX = fichiers(SRC, ".tsx");

  it("aucune bordure de focus n'est rejouée à côté de l'utilitaire", () => {
    // Une bordure de focus écrite en classe utilitaire se bat avec celle de
    // `champ` dans la cascade, et qui gagne dépend de l'ordre de génération.
    // Une exception se déclare par `[--focus-champ:…]`, pas par une bordure.
    const fautifs = TSX.filter((f) =>
      /focus(-within)?:border-(amber|red|sky|emerald|rose)/.test(readFileSync(f, "utf8")),
    );
    expect(fautifs, `à passer en [--focus-champ:…] :\n${fautifs.join("\n")}`).toEqual([]);
  });

  it("aucun contrôle ne porte la surface d'un bloc de contenu", () => {
    // Un `outline-none` dit qu'on maîtrise le focus d'un contrôle : c'est la
    // signature d'un champ. Avec un fond de bloc, c'est un champ invisible.
    const fautifs: string[] = [];
    for (const f of TSX) {
      for (const m of readFileSync(f, "utf8").matchAll(/className="([^"]*)"/g)) {
        const cls = m[1]!;
        if (!cls.includes("outline-none")) continue;
        if (/bg-slate-9[0-9]0/.test(cls)) fautifs.push(`${f.slice(SRC.length)} : ${cls.slice(0, 70)}`);
      }
    }
    expect(fautifs, `à remplacer par \`champ\` :\n${fautifs.join("\n")}`).toEqual([]);
  });

  it("aucune enveloppe de champ ne dessine sa propre bordure", () => {
    // `focus-within` sur une enveloppe : elle tient un contrôle, donc c'est un
    // champ, et sa surface vient de `champ`.
    const fautifs: string[] = [];
    for (const f of TSX) {
      for (const m of readFileSync(f, "utf8").matchAll(/className="([^"]*)"/g)) {
        const cls = m[1]!;
        if (!cls.includes("focus-within:")) continue;
        if (cls.includes("border-white/")) fautifs.push(`${f.slice(SRC.length)} : ${cls.slice(0, 70)}`);
      }
    }
    expect(fautifs, `à remplacer par \`champ\` :\n${fautifs.join("\n")}`).toEqual([]);
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
