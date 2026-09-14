import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ACCESSIBILITÉ DE BASE : ZOOM LIBRE, TEXTES LISIBLES, LIEN D'ÉVITEMENT.
 *
 * Mesuré en production sur la page d'accueil : viewport avec maximum-scale=1
 * (zoom bloqué sur mobile, WCAG 1.4.4), 45 blocs de texte sous 12 px, aucun
 * lien « Aller au contenu ». Trois gardes sur la source, pour que ça ne
 * revienne pas par une classe utilitaire glissée dans un composant.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string, extensions: string[]): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin, extensions));
    else if (extensions.some((ext) => entree.endsWith(ext))) trouves.push(chemin);
  }
  return trouves;
}

const layout = readFileSync(join(SRC, "app", "layout.tsx"), "utf8");

describe("zoom mobile", () => {
  it("le viewport ne bloque ni l'échelle ni le zoom", async () => {
    const { viewport } = await import("@/app/layout");
    expect(viewport.maximumScale).toBeUndefined();
    expect(viewport.userScalable).not.toBe(false);
    expect(layout).not.toMatch(/maximumScale|userScalable:\s*false|maximum-scale|user-scalable/);
  });
});

describe("lien d'évitement", () => {
  it("est le premier élément focusable du layout et cible le contenu", () => {
    const lien = layout.indexOf('href="#main"');
    const entete = layout.indexOf("<SiteHeader");
    expect(lien).toBeGreaterThan(-1);
    expect(lien).toBeLessThan(entete);
    expect(layout).toContain("Aller au contenu");
    // Invisible hors focus, visible au focus : sans quoi il est soit gênant,
    // soit inutile.
    expect(layout).toMatch(/sr-only/);
    expect(layout).toMatch(/focus:not-sr-only/);
  });

  it("chaque page pose son <main> avec l'identifiant visé", () => {
    const pages = fichiers(join(SRC, "app"), [".tsx"]).filter((f) =>
      readFileSync(f, "utf8").includes("<main"),
    );
    expect(pages.length).toBeGreaterThan(20);
    for (const page of pages) {
      const source = readFileSync(page, "utf8");
      const mains = source.match(/<main\b[^>]*>/g) ?? [];
      for (const balise of mains) {
        expect(balise, `${page.slice(SRC.length)} : ${balise}`).toContain('id="main"');
      }
    }
  });
});

describe("tailles de texte", () => {
  const PX_INTERDIT = /text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/g;
  const REM_INTERDIT = /text-\[0?\.(?:[0-6]\d*|7[0-4]\d*)rem\]/g;

  it("aucune classe utilitaire ne descend sous 12 px", () => {
    const fautes: string[] = [];
    for (const f of fichiers(SRC, [".tsx", ".ts"])) {
      const source = readFileSync(f, "utf8");
      for (const m of source.matchAll(PX_INTERDIT)) fautes.push(`${f.slice(SRC.length)} : ${m[0]}`);
      for (const m of source.matchAll(REM_INTERDIT)) fautes.push(`${f.slice(SRC.length)} : ${m[0]}`);
    }
    expect(fautes).toEqual([]);
  });

  it("aucune feuille de style ne fixe une taille sous 12 px", () => {
    const fautes: string[] = [];
    for (const f of fichiers(join(SRC, "app"), [".css"])) {
      const source = readFileSync(f, "utf8");
      for (const m of source.matchAll(/font-size:\s*([0-9.]+)(px|rem)/g)) {
        const valeur = Number(m[1]);
        const px = m[2] === "rem" ? valeur * 16 : valeur;
        if (px < 12) fautes.push(`${f.slice(SRC.length)} : ${m[0]}`);
      }
    }
    expect(fautes).toEqual([]);
  });

  it("les textes d'aide sous les champs de décision sont à 13 px", () => {
    const form = readFileSync(join(SRC, "components", "decision-form.tsx"), "utf8");
    const aides = form.match(/\{hint \? <span className="[^"]*">\{hint\}<\/span> : null\}/g) ?? [];
    // Il y en avait deux tant que le plan de trésorerie avait son champ
    // facultatif ; il ne reste que celui des champs de décision. Ce qui
    // compte est qu'aucun ne descende sous 13 px, pas combien il y en a.
    expect(aides.length).toBeGreaterThanOrEqual(1);
    for (const aide of aides) expect(aide).toContain("text-[13px]");
  });
});

/**
 * L'ESPACE EST UNE QUALITÉ, PAS UN RESTE.
 *
 * Quatre-vingt-une cartes portaient `p-1.5` — SIX pixels de padding sur
 * téléphone. C'était un arbitrage assumé (gagner de la largeur utile) qui avait
 * gagné partout, y compris là où rien ne l'imposait : le texte touchait la
 * bordure et l'écran donnait l'impression d'un brouillon.
 *
 * Le plancher est maintenant de 12 px (`p-3`, `px-3`) pour tout ce qui CONTIENT
 * quelque chose. Les pastilles gardent leur compacité : `px-1.5 py-0.5` est une
 * étiquette, pas un contenant, et l'élargir la déformerait.
 */
describe("respiration des cartes", () => {
  const FICHIERS = fichiers(SRC, [".tsx"]);

  it("aucun conteneur ne descend sous 12 px de padding", () => {
    const fautifs: string[] = [];
    for (const f of FICHIERS) {
      const source = readFileSync(f, "utf8");
      // `p-1.5` ou `px-1.5` suivi d'un padding vertical d'au moins 2 (py-2, py-3…)
      // : c'est un contenant. `px-1.5 py-0.5` ne correspond pas.
      for (const m of source.match(/\bp-1\.5\b(?!\s*sm:p-1)|px-1\.5 (?:py|pb|pt)-(?:[1-9]|1\.5)/g) ?? []) {
        fautifs.push(`${f} : ${m}`);
      }
    }
    expect(fautifs, `cartes trop serrées :\n${fautifs.join("\n")}`).toEqual([]);
  });
});
