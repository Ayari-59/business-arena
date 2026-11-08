import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Calculatrice } from "@/components/cours/calculatrice";

/**
 * LE BOUTON DE LA CALCULATRICE NE COUVRE PLUS LE TEXTE SUR TÉLÉPHONE.
 *
 * Constaté en production (audit d'octobre 2026, capture à 390 px du chapitre
 * libre) : la pastille « Calculatrice », à 16 px du bord, recouvrait la fin de
 * l'encadré « À retenir ». Elle devint un rond de 44 px à 8 px du coin, qui
 * mordait encore sur le bord droit des cartes (captures du laboratoire, novembre
 * 2026) : fermée, elle est désormais sur téléphone un onglet de 32 × 56 px collé
 * au bord droit, dans une bande que la page lui laisse (globals.css) ; dès 640 px,
 * la pastille reprend sa place et son texte. Le e2e des laboratoires mesure qu'il
 * ne touche plus la carte.
 */
describe("place du bouton de la calculatrice", () => {
  const html = renderToStaticMarkup(createElement(Calculatrice));
  const bouton = html.match(/<button[^>]*data-bouton-calculatrice[^>]*>[\s\S]*?<\/button>/)?.[0] ?? "";

  it("un onglet de 32 × 56 px sur téléphone, la pastille au-delà", () => {
    expect(bouton).toMatch(/class="[^"]*\bh-14 w-8\b[^"]*\brounded-l-xl\b[^"]*\bsm:h-auto sm:w-auto sm:rounded-full\b[^"]*\bsm:px-4\b/);
    expect(bouton).not.toMatch(/class="rounded-full[^"]* px-4 py-2\.5 text-sm/);
  });

  it("collé au bord droit sur téléphone, zone sûre comprise ; à 16 px du bord au-delà", () => {
    expect(html).toMatch(/data-calculatrice=""[^>]*class="[^"]*\bright-\[env\(safe-area-inset-right,0px\)\][^"]*\bsm:right-4\b/);
  });

  it("la page lui laisse sa bande à droite, sur téléphone", () => {
    const css = readFileSync(fileURLToPath(new URL("../../src/app/globals.css", import.meta.url)), "utf8");
    expect(css).toMatch(/main:has\(\[data-calculatrice\]\),\s*main:has\(\[data-calculatrice\]\) ~ footer \{\s*padding-right: calc\(1\.5rem \+ env\(safe-area-inset-right, 0px\)\);/);
  });

  it("garde son nom « Calculatrice » pour les lecteurs d'écran", () => {
    expect(bouton).toMatch(/<span class="max-sm:sr-only">Calculatrice<\/span>/);
  });
});
