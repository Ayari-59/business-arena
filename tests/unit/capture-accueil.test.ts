import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LA COLONNE DE DROITE DE L'ACCUEIL MONTRE L'APPLICATION, SANS LA REJOUER.
 *
 * Elle a porté trois choses. Un cockpit DESSINÉ, aux chiffres inventés
 * (« 346 920 € ») : il promettait une simulation sans en faire tourner une.
 * Puis un tour jouable, qui tenait la promesse mais faisait de la page
 * d'accueil un mini-jeu. Maintenant une capture de l'écran réel.
 *
 * Ce que cette garde tient :
 *  · la capture EXISTE et reste légère — une page d'accueil qui met trois
 *    secondes à se charger n'a plus rien à promettre ;
 *  · ses dimensions sont écrites dans la page, sinon le texte saute au
 *    chargement ;
 *  · elle porte un texte de remplacement qui dit ce qu'on y voit ;
 *  · le mini-jeu n'est pas revenu par la bande.
 */

const RACINE = process.cwd();
const ACCUEIL = readFileSync(join(RACINE, "src", "app", "page.tsx"), "utf8");
const CAPTURE = join(RACINE, "public", "apercus", "arene.webp");

describe("la capture de la page d'accueil", () => {
  it("existe, et pèse le poids d'une image, pas celui d'une photo", () => {
    expect(existsSync(CAPTURE)).toBe(true);
    const ko = statSync(CAPTURE).size / 1024;
    expect(ko, `${Math.round(ko)} Ko`).toBeLessThan(150);
  });

  it("est posée avec ses dimensions : sans elles, la page saute au chargement", () => {
    expect(ACCUEIL).toContain("/apercus/arene.webp");
    expect(ACCUEIL).toMatch(/width=\{800\}/);
    expect(ACCUEIL).toMatch(/height=\{1400\}/);
  });

  it("dit ce qu'on y voit, pour qui ne la voit pas", () => {
    const alt = ACCUEIL.match(/alt="([^"]+)"/)?.[1] ?? "";
    expect(alt.length).toBeGreaterThan(40);
    // Les chiffres du texte de remplacement sont ceux de la capture : une
    // description qui ne correspond pas à l'image est pire qu'une absence.
    expect(alt).toContain("399 919");
  });

  it("le mini-jeu n'est pas revenu par la bande", () => {
    expect(ACCUEIL).not.toContain("TourDessai");
    expect(ACCUEIL).not.toContain('type="range"');
    expect(existsSync(join(RACINE, "src", "components", "tour-dessai.tsx"))).toBe(false);
    expect(existsSync(join(RACINE, "src", "pedagogy", "tour-dessai.ts"))).toBe(false);
  });
});
