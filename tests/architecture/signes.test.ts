import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Signe } from "@/components/signe";

/**
 * LES SIGNES DE L'ARBITRAGE SONT DESSINÉS, PAS ÉCRITS.
 *
 * ↗ (U+2197) et ↘ (U+2198) ont une variante emoji. Selon la police disponible,
 * le navigateur rend une pastille de couleur qui ignore la teinte demandée, ou
 * un carré vide là où rien ne les porte ; à l'impression du dossier d'équipe,
 * un aplat gris. Or toute la lecture de la carte tient dans ces deux marques :
 * la couleur est dans le signe, pas dans la phrase.
 *
 * Le tracé prend `currentColor` et ne dépend d'aucune police. Le garde empêche
 * le caractère de revenir par un copier-coller, et il couvre aussi les deux
 * signes eux-mêmes, ⊕ et ⊖, qui seraient la même erreur sous une autre forme.
 */

const SRC = join(process.cwd(), "src");
/** Le composant explique dans son commentaire ce qu'il remplace : il les cite. */
const DISPENSE = join(SRC, "components", "signe.tsx");

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (/\.(ts|tsx|css)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

describe("les signes de gain et de coût", () => {
  it("aucun caractère à variante emoji dans la source", () => {
    const fautifs = fichiers(SRC)
      .filter((f) => f !== DISPENSE)
      .filter((f) => /[↗↘⊕⊖⨁⨂]/.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(SRC.length + 1));
    expect(fautifs, `utiliser <Signe sens="gain|cout" /> : ${fautifs.join(", ")}`).toEqual([]);
  });

  it("le tracé prend la couleur du texte et se tait pour les lecteurs d'écran", () => {
    for (const sens of ["gain", "cout"] as const) {
      const html = renderToStaticMarkup(createElement(Signe, { sens }));
      expect(html).toContain('stroke="currentColor"');
      expect(html).toContain('aria-hidden="true"');
      // Une taille propre, en attribut : sans elle, un SVG s'étale sur toute
      // la largeur de sa ligne dès que la classe utilitaire manque.
      expect(html).toContain('width="1em"');
      expect(html).toContain('height="1em"');
      // Aucune teinte en dur : le signe hérite de la classe qui le porte,
      // donc il survit au thème clair comme au noir et blanc de l'impression.
      expect(html).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i);
    }
  });

  it("le gain porte une barre que le coût n'a pas", () => {
    const gain = renderToStaticMarkup(createElement(Signe, { sens: "gain" }));
    const cout = renderToStaticMarkup(createElement(Signe, { sens: "cout" }));
    expect(gain).not.toBe(cout);
    // Ce qui les sépare est la verticale du plus, pas une nuance de tracé :
    // à 12 px et en noir et blanc, c'est tout ce que l'œil a pour trancher.
    expect(gain).toContain("M6 3.7v4.6");
    expect(cout).not.toContain("M6 3.7v4.6");
    // La barre horizontale, elle, est commune aux deux.
    for (const html of [gain, cout]) expect(html).toContain("M3.7 6h4.6");
  });
});
