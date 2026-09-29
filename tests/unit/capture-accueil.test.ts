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
const CAPTURES = ["arene", "decider", "resultats"].map((nom) => ({
  nom,
  chemin: join(RACINE, "public", "apercus", `${nom}.webp`),
}));

describe("les captures de la page d'accueil", () => {
  it("existent, et pèsent le poids d'images, pas celui de photos", () => {
    for (const { nom, chemin } of CAPTURES) {
      expect(existsSync(chemin), nom).toBe(true);
      const ko = statSync(chemin).size / 1024;
      expect(ko, `${nom} : ${Math.round(ko)} Ko`).toBeLessThan(150);
    }
    // Trois captures dans une page d'accueil, c'est un budget, pas une galerie.
    const total = CAPTURES.reduce((s, c) => s + statSync(c.chemin).size, 0) / 1024;
    expect(total, `${Math.round(total)} Ko en tout`).toBeLessThan(300);
  });

  it("sont posées avec leurs dimensions : sans elles, la page saute au chargement", () => {
    for (const { nom } of CAPTURES) expect(ACCUEIL, nom).toContain(`/apercus/${nom}.webp`);
    // Le composant `Capture` les porte pour les trois, d'un seul endroit.
    expect(ACCUEIL).toMatch(/width=\{largeur\}/);
    expect(ACCUEIL).toMatch(/height=\{hauteur\}/);
    expect(ACCUEIL).toMatch(/hauteur = 800/);
    expect(ACCUEIL).toMatch(/hauteur=\{1400\}/);
  });

  it("disent ce qu'on y voit, pour qui ne les voit pas", () => {
    const alts = [...ACCUEIL.matchAll(/alt="([^"]+)"/g)].map((m) => m[1]!);
    expect(alts).toHaveLength(3);
    for (const alt of alts) expect(alt.length).toBeGreaterThan(40);
    // Les chiffres des textes de remplacement sont ceux des captures : une
    // description qui ne correspond pas à l'image est pire qu'une absence.
    expect(alts.join(" ")).toContain("399 919");
    expect(alts.join(" ")).toContain("58 188");
    expect(alts.join(" ")).toContain("4 500");
  });

  it("racontent la même partie, et pas trois parties sans rapport", () => {
    // Le verdict montré est celui du tour qu'on voit se décider à côté : c'est
    // ce qui fait de trois images une démonstration plutôt qu'une galerie.
    expect(ACCUEIL).toContain("Décider, puis comprendre");
    expect(ACCUEIL).toContain("sur la partie de l&apos;écran précédent");
  });

  it("le mini-jeu n'est pas revenu par la bande", () => {
    expect(ACCUEIL).not.toContain("TourDessai");
    expect(ACCUEIL).not.toContain('type="range"');
    expect(existsSync(join(RACINE, "src", "components", "tour-dessai.tsx"))).toBe(false);
    expect(existsSync(join(RACINE, "src", "pedagogy", "tour-dessai.ts"))).toBe(false);
  });
});
