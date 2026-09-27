import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { DemoDuTour } from "@/components/demo-du-tour";

/**
 * UN TOUR, EN DOUZE SECONDES.
 *
 * Les pages publiques expliquaient la boucle du jeu en prose — « l'équipe
 * reçoit une situation, décide, la simulation répond » — ce qui est exact et
 * ne montre rien. Trois panneaux qui se relaient le font voir.
 *
 * Ce qui doit tenir :
 * · SANS VIDÉO NI SCRIPT : la politique de sécurité n'autorise les images que
 *   depuis le site, et un hébergeur vidéo serait bloqué.
 * · QUI A DEMANDÉ MOINS D'ANIMATION N'EN REÇOIT AUCUNE, et voit alors les
 *   trois panneaux à la file — le même contenu, dans le même ordre.
 * · LE CONTENU EXISTE MÊME IMMOBILE : c'est ce que lit un lecteur d'écran, et
 *   ce que voit un moteur de recherche.
 */

const html = renderToStaticMarkup(createElement(DemoDuTour, {}));
const source = readFileSync(join(process.cwd(), "src/components/demo-du-tour.tsx"), "utf8");
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

describe("la boucle du tour", () => {
  it("porte ses trois moments, en toutes lettres", () => {
    for (const etape of ["1 · La situation", "2 · La décision", "3 · Le résultat"]) {
      expect(html).toContain(etape);
    }
    expect(html.match(/<li/g) ?? []).toHaveLength(3);
  });

  it("dit ce que chaque moment montre, sans dépendre du mouvement", () => {
    // Un lecteur d'écran lit les trois panneaux : ils sont tous dans la page.
    expect(html).toContain("Des clients repartis sans acheter");
    expect(html).toContain("Produire plus, ou vendre plus cher");
    expect(html).toContain("La simulation répond");
  });

  it("s'anime en CSS, sans vidéo ni script", () => {
    expect(source).not.toMatch(/<video|<iframe|useEffect|"use client"/);
    expect(css).toContain("@keyframes tour-relais");
  });

  it("ne bouge pas pour qui a demandé moins d'animation", () => {
    // Les panneaux ne se superposent QUE sous `motion-safe` : sans cela, ils
    // se suivent, et le cadre prend la hauteur qu'il faut.
    expect(source).toContain("motion-safe:absolute");
    expect(source).toContain("motion-safe:opacity-0");
    expect(source).not.toMatch(/\babsolute inset-5\b/);
    // Et le relais s'arrête : sans cette règle, les panneaux immobiles
    // continueraient de clignoter, ce qui est exactement ce qu'on a demandé
    // d'éviter.
    const reduit = css.slice(css.indexOf(".tour-panneau,"));
    expect(reduit).toMatch(/animation:\s*none/);
  });

  it("rend les clics au seul panneau qu'on lit", () => {
    // Deux panneaux sur trois sont transparents et couvrent le troisième : une
    // opacité nulle ne retire rien à la surface cliquable. L'animation vit donc
    // dans la feuille de style, où la garde des clics fantômes la voit.
    expect(source).not.toContain("animationName");
    expect(css).toMatch(/\.tour-panneau\s*\{[^}]*pointer-events:\s*none/);
    expect(css.slice(css.indexOf("@keyframes tour-relais"))).toMatch(/pointer-events:\s*auto/);
  });

  it("réserve au cadre la hauteur du plus grand panneau, téléphone compris", () => {
    // Mesuré : à 390 px les panneaux montent à 342 px quand un grand écran les
    // tient en 238. Sans cette hauteur-là, le débord caché coupait le panneau
    // le plus long.
    expect(source).toMatch(/motion-safe:h-\[\d+rem\] sm:motion-safe:h-\[\d+rem\]/);
  });

  it("est posée là où un enseignant hésite, et pas dans l'arène", () => {
    const page = readFileSync(join(process.cwd(), "src/app/enseignants/page.tsx"), "utf8");
    expect(page).toContain("<DemoDuTour");
    const arene = readFileSync(
      join(process.cwd(), "src/app/arena/[gameId]/page.tsx"),
      "utf8",
    );
    expect(arene).not.toContain("DemoDuTour");
  });
});
