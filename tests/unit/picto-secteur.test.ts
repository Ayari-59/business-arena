import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PictoSecteur } from "@/components/picto-secteur";
import { SECTOR_COLORS, SECTOR_LABELS } from "@/config/scenarios/registry";
import type { Sector } from "@/config/scenarios/registry";

/**
 * LES NEUF SECTEURS, DESSINÉS ET NON ÉCRITS.
 *
 * Un emoji est dessiné par le système : différent sur Windows, sur Mac et sur
 * Android, souvent en couleurs étrangères au site, et illisible au
 * vidéoprojecteur. Ce qui doit tenir : un pictogramme par secteur, tous
 * différents, tous à la couleur de leur accent.
 */

const SECTEURS = Object.keys(SECTOR_LABELS) as Sector[];

const dessin = (s: Sector) =>
  renderToStaticMarkup(createElement(PictoSecteur, { secteur: s }));

describe("les pictogrammes de secteur", () => {
  it("existent pour les neuf secteurs, sans trou", () => {
    expect(SECTEURS).toHaveLength(9);
    for (const s of SECTEURS) expect(dessin(s), s).toContain("<svg");
  });

  it("ne se ressemblent pas : neuf formes distinctes", () => {
    const traces = SECTEURS.map((s) => dessin(s));
    expect(new Set(traces).size).toBe(SECTEURS.length);
  });

  it("prennent la couleur du texte qui les porte, et rien d'autre", () => {
    // Sans cela, il faudrait neuf déclinaisons de chaque pictogramme, et
    // l'accent du secteur ne les atteindrait pas.
    for (const s of SECTEURS) {
      const svg = dessin(s);
      expect(svg, s).toContain('stroke="currentColor"');
      expect(svg, s).not.toMatch(/(?:fill|stroke)="#/);
    }
  });

  it("sont décoratifs : le nom du secteur est écrit à côté", () => {
    for (const s of SECTEURS) expect(dessin(s), s).toContain("aria-hidden");
  });

  it("chaque secteur garde son accent, et deux secteurs n'ont pas le même", () => {
    const accents = SECTEURS.map((s) => SECTOR_COLORS[s].accent);
    expect(new Set(accents).size).toBe(SECTEURS.length);
  });
});

describe("là où ils remplacent les emoji", () => {
  const lire = (c: string) => readFileSync(join(process.cwd(), c), "utf8");

  it("la tuile de l'arène et celle de la liste des parties", () => {
    for (const chemin of ["src/app/arena/[gameId]/page.tsx", "src/app/teacher/page.tsx"]) {
      const source = lire(chemin);
      expect(source, chemin).toContain("<PictoSecteur");
      // L'emoji du scénario ne se pose plus dans la tuile.
      expect(source, chemin).not.toContain("scenarioIcon}");
    }
  });
});
