import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LA COLONNE DE DROITE DE L'ACCUEIL MONTRE L'APPLICATION, SANS LA REJOUER.
 *
 * Elle a porté trois choses. Un cockpit DESSINÉ, aux chiffres inventés
 * (« 346 920 € ») : il promettait une simulation sans en faire tourner une.
 * Puis un tour jouable, qui tenait la promesse mais faisait de la page
 * d'accueil un mini-jeu. Maintenant trois captures d'écrans réels, tenues en
 * main de cartes.
 *
 * LES TROIS ÉCRANS NE SONT PLUS MONTRÉS QU'À CET ENDROIT. Une section les
 * reprenait en grand plus bas, « Un tour, en deux temps » ; elle a été
 * retirée, et avec elle le seul autre endroit où ces images étaient décrites.
 * Ce qui se jouait là se joue maintenant dans l'en-tête, ou nulle part : d'où
 * les gardes sur la légende et sur les trois textes de remplacement.
 *
 * Ce que cette garde tient :
 *  · les captures EXISTENT et restent légères — une page d'accueil qui met
 *    trois secondes à se charger n'a plus rien à promettre ;
 *  · elles ont toutes la même taille, sans quoi la main serait un escalier ;
 *  · cette taille est écrite dans la page, sinon le texte saute au
 *    chargement, et c'est bien celle des fichiers ;
 *  · chacune porte un texte de remplacement qui dit ce qu'on y voit ;
 *  · l'éventail est arrêté, pas tiré au sort à chaque rendu ;
 *  · le mini-jeu n'est pas revenu par la bande.
 */

const RACINE = process.cwd();
const ACCUEIL = readFileSync(join(RACINE, "src", "app", "page.tsx"), "utf8");
const GLOBALS = readFileSync(join(RACINE, "src", "app", "globals.css"), "utf8");
const ECRANS = ["arene", "decider", "resultats"];
/**
 * Six fichiers : trois écrans, deux thèmes. Le fichier nu est la prise SOMBRE
 * — celle que montre la page claire — et le suffixe `-clair` la prise claire,
 * que montre la page sombre. Les captures vont à contre-courant de la page :
 * sur un fond de même teinte, un écran n'est qu'un rectangle qui s'y fond.
 */
const JEUX = [
  { teinte: "sombre", suffixe: "" },
  { teinte: "claire", suffixe: "-clair" },
];
const CAPTURES = JEUX.flatMap(({ teinte, suffixe }) =>
  ECRANS.map((nom) => ({
    nom: `${nom}${suffixe}`,
    teinte,
    chemin: join(RACINE, "public", "apercus", `${nom}${suffixe}.webp`),
  })),
);

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
    // Le budget se compte PAR THÈME, parce qu'une visite n'en charge qu'un :
    // le fond CSS ne télécharge que le fichier retenu. Compter les six
    // reviendrait à facturer au visiteur des images qu'il ne reçoit pas — et
    // à interdire le second jeu pour une dépense imaginaire.
    for (const { teinte, suffixe } of JEUX) {
      const total =
        ECRANS.reduce(
          (s, nom) => s + statSync(join(RACINE, "public", "apercus", `${nom}${suffixe}.webp`)).size,
          0,
        ) / 1024;
      expect(total, `prises ${teinte} : ${Math.round(total)} Ko`).toBeLessThan(300);
    }
  });

  it("sont posées avec leurs dimensions : sans elles, la page saute au chargement", () => {
    // La page ne nomme plus les fichiers un par un : elle nomme l'écran, et
    // compose les deux chemins. On vérifie donc les deux gabarits.
    for (const nom of ECRANS) expect(ACCUEIL, nom).toContain(`nom="${nom}"`);
    expect(ACCUEIL).toContain("`url(/apercus/${nom}.webp)`");
    expect(ACCUEIL).toContain("`url(/apercus/${nom}-clair.webp)`");
    // Les dimensions sont écrites une fois, dans `CARTE`. Elles l'ont été à
    // deux endroits, du temps où une section du corps de page reprenait les
    // mêmes images — et elles y étaient fausses, 800 déclarés contre 1120
    // réels.
    expect(ACCUEIL).toMatch(/const CARTE = \{ largeur: 800, hauteur: 1120 \}/);
    // Un fond n'a pas d'attributs de taille : c'est le rapport de forme qui
    // réserve la place, et il se lit sur les mêmes deux nombres.
    expect(ACCUEIL).toContain("aspectRatio: `${CARTE.largeur} / ${CARTE.hauteur}`");
  });

  it("ont toutes la même taille, sans quoi la main de cartes serait un escalier", () => {
    // L'en-tête pose les trois captures en éventail. Un recadrage qui
    // changerait la hauteur de l'une d'elles ferait dépasser une carte, et
    // rien dans la page ne le dirait : c'est ici que ça se voit. Les six
    // fichiers sont tenus, pas trois : les deux prises d'un même écran se
    // remplacent au changement de thème, et un cadrage qui aurait glissé se
    // verrait sauter d'un clic à l'autre.
    for (const { nom, chemin } of CAPTURES) {
      expect(tailleWebp(chemin), nom).toEqual({ largeur: 800, hauteur: 1120 });
    }
    // Et la page annonce bien la taille qu'elles ont vraiment : un cadre
    // déclaré trop haut réserve une place que l'image ne remplit pas.
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
    // Trois descriptions pour trois écrans, et aucune carte muette. Les deux
    // du fond ont un moment porté un texte de remplacement vide, parce qu'une
    // section plus bas montrait les mêmes images avec leur description ; cette
    // section a été retirée, et ces trois phrases sont désormais tout ce qu'a
    // qui ne voit pas la page.
    expect(alts).toHaveLength(3);
    for (const alt of alts) expect(alt.length).toBeGreaterThan(40);
    // Les chiffres des textes de remplacement sont ceux des captures : une
    // description qui ne correspond pas à l'image est pire qu'une absence.
    expect(alts.join(" ")).toContain("407 000");
    expect(alts.join(" ")).toContain("63 340");
    expect(alts.join(" ")).toContain("5 500");
  });

  it("racontent le même tour, et la légende le dit", () => {
    // Le verdict montré est celui du tour qu'on voit se décider sur la carte
    // d'à côté : c'est ce qui fait de trois images une démonstration plutôt
    // qu'une galerie. Rien dans l'image ne le dit — c'est la légende qui le
    // dit, et elle est donc tenue.
    expect(ACCUEIL).toContain("d&apos;un même tour");
    for (const mot of ["arène", "décision", "verdict"]) {
      expect(ACCUEIL, mot).toContain(mot);
    }
  });

  it("la page choisit la prise qui s'oppose à son fond", () => {
    // Une capture sombre sur une page sombre est un rectangle d'encre dans de
    // l'encre. La règle tient dans les deux sens, et elle vit dans la feuille
    // de style parce que c'est le seul endroit qui sait quel thème est posé.
    expect(GLOBALS).toMatch(
      /\.capture-decran\s*\{[^}]*background-image: var\(--ecran-sur-page-claire\)/,
    );
    // Sur le tableau (l'en-tête remis à contre-jour depuis l'admin), la prise
    // claire : c'est le même renversement, porté par la bande et non plus par
    // un thème de page.
    expect(GLOBALS).toMatch(
      /\[data-theme="clair"\] \.contre-jour \.capture-decran\s*\{[^}]*background-image: var\(--ecran-sur-page-sombre\)/,
    );
    // Un fond n'a pas de texte de remplacement : sans ces deux attributs, les
    // trois écrans disparaîtraient pour qui ne voit pas la page.
    expect(ACCUEIL).toContain('role="img"');
    expect(ACCUEIL).toContain("aria-label={alt}");
  });

  it("le mini-jeu n'est pas revenu par la bande", () => {
    // Ni la section retirée : elle reviendrait avec deux images déjà montrées
    // en haut de page, ce qu'on vient précisément de lui reprocher.
    expect(ACCUEIL).not.toContain("Décider, puis comprendre");
    expect(ACCUEIL).not.toContain('numero="01"');
    expect(ACCUEIL).not.toContain("TourDessai");
    expect(ACCUEIL).not.toContain('type="range"');
    expect(existsSync(join(RACINE, "src", "components", "tour-dessai.tsx"))).toBe(false);
    expect(existsSync(join(RACINE, "src", "pedagogy", "tour-dessai.ts"))).toBe(false);
  });
});
