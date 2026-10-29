import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Calculatrice } from "@/components/cours/calculatrice";

/**
 * LE BOUTON DE LA CALCULATRICE NE COUVRE PLUS LE TEXTE SUR TÉLÉPHONE.
 *
 * Constaté en production (audit d'octobre 2026, capture à 390 px du chapitre
 * libre) : la pastille « Calculatrice », à 16 px du bord, recouvrait la fin de
 * l'encadré « À retenir ». Fermée, elle devient sur téléphone un rond de 44 px
 * posé à 8 px du coin ; dès 640 px, la pastille reprend sa place et son texte.
 */
describe("place du bouton de la calculatrice", () => {
  const html = renderToStaticMarkup(createElement(Calculatrice));
  const bouton = html.match(/<button[^>]*data-bouton-calculatrice[^>]*>[\s\S]*?<\/button>/)?.[0] ?? "";

  it("un rond de 44 px sur téléphone, la pastille au-delà", () => {
    expect(bouton).toMatch(/class="[^"]*\bh-11 w-11\b[^"]*\bsm:h-auto sm:w-auto sm:px-4\b/);
    expect(bouton).not.toMatch(/class="rounded-full[^"]* px-4 py-2\.5 text-sm/);
  });

  it("collé au coin sur téléphone : 8 px du bord au lieu de 16", () => {
    expect(html).toMatch(/data-calculatrice=""[^>]*class="[^"]*\bright-2\b[^"]*\bsm:right-4\b/);
  });

  it("garde son nom « Calculatrice » pour les lecteurs d'écran", () => {
    expect(bouton).toMatch(/<span class="max-sm:sr-only">Calculatrice<\/span>/);
  });
});
