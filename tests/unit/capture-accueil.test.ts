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

/**
 * La taille d'un WebP, lue dans l'image elle-même.
 *
 * Trois lignes plutôt qu'une dépendance : nos captures sont des WebP simples
 * (un seul bloc VP8), et leur en-tête range la largeur et la hauteur sur
 * quatorze bits, juste après le code de départ, à une place fixe.
 */
function tailleWebp(chemin: string): { largeur: number; hauteur: number } {
  const b = readFileSync(chemin);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error(`${chemin} n'est pas un WebP`);
  }
  return { largeur: b.readUInt16LE(26) & 0x3fff, hauteur: b.readUInt16LE(28) & 0x3fff };
}

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
    // Les dimensions sont écrites une fois, dans `CARTE`, et les deux façons
    // de poser une capture — le cadre du corps de page et la carte de la main
    // — les lisent toutes les deux là.
    expect(ACCUEIL).toMatch(/const CARTE = \{ largeur: 800, hauteur: 1120 \}/);
    expect(ACCUEIL).toMatch(/width=\{largeur\}/);
    expect(ACCUEIL).toMatch(/height=\{hauteur\}/);
    expect(ACCUEIL).toMatch(/largeur = CARTE\.largeur/);
    expect(ACCUEIL).toMatch(/hauteur = CARTE\.hauteur/);
    expect(ACCUEIL).toMatch(/width=\{CARTE\.largeur\}/);
    expect(ACCUEIL).toMatch(/height=\{CARTE\.hauteur\}/);
  });

  it("ont toutes la même taille, sans quoi la main de cartes serait un escalier", () => {
    // L'en-tête pose les trois captures en éventail. Un recadrage qui
    // changerait la hauteur de l'une d'elles ferait dépasser une carte, et
    // rien dans la page ne le dirait : c'est ici que ça se voit.
    for (const { nom, chemin } of CAPTURES) {
      expect(tailleWebp(chemin), nom).toEqual({ largeur: 800, hauteur: 1120 });
    }
    // Et la page annonce bien la taille qu'elles ont vraiment : une image
    // déclarée trop haute réserve une place que l'image ne remplit pas.
    const { largeur, hauteur } = tailleWebp(CAPTURES[0]!.chemin);
    expect(ACCUEIL).toContain(`largeur: ${largeur}, hauteur: ${hauteur}`);
  });

  it("l'éventail est arrêté, pas tiré au sort à chaque rendu", () => {
    // Un ordre aléatoire se tirerait deux fois — une fois sur le serveur, une
    // fois dans le navigateur — et la page se repeindrait sous l'oeil du
    // visiteur. Les angles et les places sont donc écrits.
    expect(ACCUEIL).not.toMatch(/Math\.random/);
    expect(ACCUEIL).toMatch(/-rotate-\[9deg\]/);
    expect(ACCUEIL).toMatch(/\brotate-\[9deg\]/);
    // La hauteur de la main vient d'un rapport de forme, pas de l'image : sans
    // lui, l'en-tête reprendrait la hauteur de la plus haute des captures et
    // écraserait le bloc de texte d'à côté.
    expect(ACCUEIL).toMatch(/aspect-\[9\/8\]/);
  });

  it("disent ce qu'on y voit, pour qui ne les voit pas", () => {
    const alts = [...ACCUEIL.matchAll(/alt="([^"]+)"/g)].map((m) => m[1]!);
    // Trois descriptions pour trois écrans. Les deux cartes du fond de la
    // main sont les mêmes images, montrées en grand plus bas : elles portent
    // un texte de remplacement vide, pour ne pas les faire lire deux fois.
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
    // Le déroulé numérote les deux temps : c'est ce qui fait de trois écrans
    // une séquence plutôt qu'une galerie.
    expect(ACCUEIL).toContain('numero="01"');
    expect(ACCUEIL).toContain('numero="02"');
    expect(ACCUEIL).toContain("sur la même partie");
  });

  it("le mini-jeu n'est pas revenu par la bande", () => {
    expect(ACCUEIL).not.toContain("TourDessai");
    expect(ACCUEIL).not.toContain('type="range"');
    expect(existsSync(join(RACINE, "src", "components", "tour-dessai.tsx"))).toBe(false);
    expect(existsSync(join(RACINE, "src", "pedagogy", "tour-dessai.ts"))).toBe(false);
  });
});
