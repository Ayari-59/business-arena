import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Fleche } from "@/components/fleche";

/**
 * LES FLÈCHES DE L'ARBITRAGE SONT DESSINÉES, PAS ÉCRITES.
 *
 * ↗ (U+2197) et ↘ (U+2198) ont une variante emoji. Selon la police disponible,
 * le navigateur rend une pastille de couleur qui ignore la teinte demandée, ou
 * un carré vide là où rien ne les porte ; à l'impression du dossier d'équipe,
 * un aplat gris. Or toute la lecture de la carte tient dans ces deux flèches :
 * la couleur est dans la flèche, pas dans la phrase.
 *
 * Le tracé prend `currentColor` et ne dépend d'aucune police. Le garde
 * empêche le caractère de revenir par un copier-coller.
 */

const SRC = join(process.cwd(), "src");
/** Le composant explique dans son commentaire ce qu'il remplace : il les cite. */
const DISPENSE = join(SRC, "components", "fleche.tsx");

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (/\.(ts|tsx|css)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

describe("les flèches de gain et de risque", () => {
  it("aucun caractère à variante emoji dans la source", () => {
    const fautifs = fichiers(SRC)
      .filter((f) => f !== DISPENSE)
      .filter((f) => /[↗↘]/.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(SRC.length + 1));
    expect(fautifs, `utiliser <Fleche sens="hausse|baisse" /> : ${fautifs.join(", ")}`).toEqual([]);
  });

  it("le tracé prend la couleur du texte et se tait pour les lecteurs d'écran", () => {
    for (const sens of ["hausse", "baisse"] as const) {
      const html = renderToStaticMarkup(createElement(Fleche, { sens }));
      expect(html).toContain('stroke="currentColor"');
      expect(html).toContain('aria-hidden="true"');
      // Une taille propre, en attribut : sans elle, un SVG s'étale sur toute
      // la largeur de sa ligne dès que la classe utilitaire manque.
      expect(html).toContain('width="1em"');
      expect(html).toContain('height="1em"');
      // Aucune teinte en dur : la flèche hérite de la classe qui la porte,
      // donc elle survit au thème clair comme au noir et blanc de l'impression.
      expect(html).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i);
    }
  });

  it("les deux sens ne dessinent pas le même trait", () => {
    const hausse = renderToStaticMarkup(createElement(Fleche, { sens: "hausse" }));
    const baisse = renderToStaticMarkup(createElement(Fleche, { sens: "baisse" }));
    expect(hausse).not.toBe(baisse);
  });
});
