import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChiffreQuiArrive, ValeurRafraichie } from "@/components/chiffre-qui-arrive";
import { PLUMES } from "@/lib/plumes";
import { amorti } from "@/lib/mouvement";
import { euroSigne } from "@/components/tableau-de-bord";

/**
 * LE MOUVEMENT DE L'ARÈNE : CE QUI NE SE NÉGOCIE PAS.
 *
 * Le lot 5B fait monter des chiffres, glisser des écrans et réagir ce qui est
 * cliquable. Quatre choses doivent rester vraies après n'importe quelle
 * retouche, et aucune ne se voit sur une capture d'écran :
 *
 *   1. les DURÉES sont bornées et prises aux jetons — aucune milliseconde
 *      écrite dans un composant, aucune durée hors de la fourchette décidée ;
 *   2. `prefers-reduced-motion` coupe TOUT ce que ce lot ajoute ;
 *   3. la valeur finale est dans le DOM dès le premier octet — le serveur
 *      l'écrit, l'animation ne touche que l'affichage ;
 *   4. le focus clavier est au moins aussi visible que le survol, et aucune
 *      action n'est retardée ni rendue inerte par une animation.
 *
 * Chacune a été vue ROUGE avant d'être écrite ici.
 */

const CSS = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
const DEBUT_5B = CSS.indexOf(" * LOT 5B : L'ARÈNE PREND VIE.");
const BLOC = CSS.slice(DEBUT_5B);

/** Les commentaires retirés : une durée citée en prose n'est pas une durée appliquée. */
const SANS_COMMENTAIRES = BLOC.replace(/\/\*[\s\S]*?\*\//g, "");

/** La valeur d'un jeton de durée du bloc, en millisecondes. */
function jetonDeDuree(nom: string): number {
  const m = BLOC.match(new RegExp(`--${nom}:\\s*([0-9.]+)(m?s)\\s*;`));
  expect(m, `le jeton --${nom} manque au bloc LOT 5B`).not.toBeNull();
  const n = Number.parseFloat(m![1]!);
  return m![2] === "ms" ? n : n * 1000;
}

function fichiers(racine: string, motif = /\.(tsx|ts)$/): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin, motif));
    else if (motif.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

describe("le bloc LOT 5B existe et se tient", () => {
  it("la feuille porte un bloc LOT 5B, et il finit par la coupure du mouvement", () => {
    expect(DEBUT_5B).toBeGreaterThan(0);
    // Le dernier bloc du fichier est la coupure : rien ne peut lui échapper en
    // étant écrit « après », puisqu'il n'y a pas d'après.
    const coupure = BLOC.lastIndexOf("@media (prefers-reduced-motion: reduce)");
    expect(coupure).toBeGreaterThan(0);
    expect(BLOC.slice(coupure)).not.toMatch(/\n@keyframes/);
  });
});

describe("1. les durées sont bornées, et prises aux jetons", () => {
  it("chaque temps du produit reste dans la fourchette décidée", () => {
    // Un geste doit se sentir sans se voir attendre.
    expect(jetonDeDuree("duree-geste")).toBeGreaterThan(0);
    expect(jetonDeDuree("duree-geste")).toBeLessThanOrEqual(150);
    // Un passage : la fourchette du propriétaire, 150 à 250 ms.
    expect(jetonDeDuree("duree-passage")).toBeGreaterThanOrEqual(150);
    expect(jetonDeDuree("duree-passage")).toBeLessThanOrEqual(250);
    // Un compteur : 400 à 700 ms.
    expect(jetonDeDuree("duree-chiffre")).toBeGreaterThanOrEqual(400);
    expect(jetonDeDuree("duree-chiffre")).toBeLessThanOrEqual(700);
    // Un éclat de rafraîchissement : bref, et jamais plus long qu'un compteur.
    expect(jetonDeDuree("duree-eclat")).toBeLessThanOrEqual(jetonDeDuree("duree-chiffre"));
  });

  it("la courbe ne se trace jamais plus longtemps que les chiffres qu'elle accompagne", () => {
    // Sinon elle finirait seule, après que la racine a rendu son marqueur.
    expect(jetonDeDuree("duree-trace")).toBeLessThanOrEqual(jetonDeDuree("duree-chiffre"));
  });

  it("aucune durée n'est écrite à la main dans le bloc, hors de ses jetons", () => {
    const sansJetons = SANS_COMMENTAIRES.replace(
      /--(?:duree|retard)-[a-z-]+:\s*[0-9.]+m?s\s*;/g,
      "",
    );
    // La barre indéterminée des actions longues est une animation du site,
    // reprise telle quelle avec sa durée d'origine : elle est nommée ici.
    const reste = sansJetons.replace(
      /animation: barre-indeterminee 1\.4s ease-in-out infinite;/g,
      "",
    );
    const durees = reste.match(/(?<![\w-])[0-9.]+m?s(?![\w-])/g) ?? [];
    expect(durees, `durées écrites à la main : ${durees.join(", ")}`).toEqual([]);
  });

  it("aucune durée d'animation ou de transition n'est écrite dans un composant", () => {
    // Les utilitaires de durée de Tailwind et les millisecondes d'une feuille
    // en ligne sont des durées écrites à la main : une seule grammaire veut
    // une seule source, et c'est le bloc LOT 5B. Un composant qui a une raison
    // de nommer sa durée renvoie au jeton par une valeur arbitraire.
    //
    // UNE SEULE EXCEPTION, ET ELLE EST NOMMÉE. La ligne repliée de l'ardoise
    // appartient à un autre chantier en cours, qu'on ne doit pas toucher :
    // sa durée de 150 ms reste écrite là, dans la fourchette du geste. Le
    // compte est figé ici pour qu'une seconde n'arrive pas en silence.
    const EXCEPTION = join("src", "components", "ardoise-repliee.tsx");
    const fautifs: string[] = [];
    const racines = [join(process.cwd(), "src", "components"), join(process.cwd(), "src", "app")];
    for (const racine of racines) {
      for (const f of fichiers(racine)) {
        if (f.endsWith(EXCEPTION)) continue;
        const t = readFileSync(f, "utf8");
        for (const m of t.matchAll(/transition(?:Duration|Delay)?:\s*["'`][^"'`]*?[0-9.]+m?s/g)) {
          fautifs.push(`${f} : ${m[0]}`);
        }
        for (const m of t.matchAll(/(?<![\w-])(?:duration|delay)-\[?[0-9.]+m?s?\]?(?![\w-])/g)) {
          fautifs.push(`${f} : ${m[0]}`);
        }
      }
    }
    expect(fautifs, fautifs.join("\n")).toEqual([]);
    const repliee = readFileSync(join(process.cwd(), EXCEPTION), "utf8");
    expect(repliee.match(/(?<![\w-])duration-[0-9]+(?![\w-])/g)).toEqual(["duration-150"]);
  });
});

describe("2. « moins de mouvement » coupe tout ce que ce lot ajoute", () => {
  const coupure = BLOC.slice(BLOC.lastIndexOf("@media (prefers-reduced-motion: reduce)"));

  it("chaque animation du bloc est nommée dans la coupure", () => {
    // Les sélecteurs qui portent une `animation:` hors de toute coupure.
    const anime = [...SANS_COMMENTAIRES.matchAll(/(^|\n)([^@{}][^{}]*?)\{[^{}]*?\n\s*animation:/g)]
      .map((m) => m[2]!.trim().replace(/\s+/g, " "))
      .filter((s) => !s.startsWith("@") && s.length > 0);
    expect(anime.length).toBeGreaterThan(0);
    for (const sel of anime) {
      // Chaque sélecteur animé se retrouve dans la liste de la coupure (la
      // comparaison se fait sur la dernière partie du sélecteur, celle qui
      // nomme ce qui bouge).
      const cle = sel.split(",")[0]!.trim();
      expect(coupure, `« ${cle} » n'est pas coupé par prefers-reduced-motion`).toContain(cle);
    }
  });

  it("la coupure ne laisse passer aucune transition de geste", () => {
    expect(coupure).toMatch(/transition:\s*none/);
    expect(coupure).toMatch(/transform:\s*none/);
  });

  it("le compteur, lui, se coupe côté script", () => {
    const source = readFileSync(join(process.cwd(), "src", "lib", "mouvement.ts"), "utf8");
    expect(source).toContain("prefers-reduced-motion: reduce");
    const chiffre = readFileSync(
      join(process.cwd(), "src", "components", "chiffre-qui-arrive.tsx"),
      "utf8",
    );
    // Les deux composants animés interrogent la demande du système avant de bouger.
    expect(chiffre.match(/mouvementReduit\(\)/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});

describe("3. la valeur finale est dans le DOM dès le départ", () => {
  it("le rendu serveur d'un chiffre qui arrive porte la valeur finale, pas un zéro", () => {
    const html = renderToStaticMarkup(
      createElement(ChiffreQuiArrive, {
        valeur: 299484,
        plume: "euro",
        depuis: 0,
        memoire: "essai",
      }),
    );
    // L'espace fine insécable des milliers est celle de `lib/format`.
    expect(html).toContain(PLUMES.euro(299484));
    expect(html).not.toMatch(/>0\s*€</);
  });

  it("un écart signé est écrit signé dès le rendu serveur", () => {
    const html = renderToStaticMarkup(
      createElement(ChiffreQuiArrive, { valeur: -294, plume: "euro-signe", depuis: 0 }),
    );
    expect(html).toContain(PLUMES["euro-signe"](-294));
  });

  it("une valeur rafraîchie rend son contenu tel quel, sans attendre", () => {
    const html = renderToStaticMarkup(
      createElement(ValeurRafraichie, { valeur: 12000, children: "12 000 €" }),
    );
    expect(html).toContain("12 000 €");
    expect(html).toContain('data-valeur-rafraichie="posee"');
  });

  it("la plume signée écrit exactement comme la maison écrit un montant signé", () => {
    // Deux écritures d'un même montant finiraient par diverger ; celle du
    // compteur est celle de l'ardoise, sur toute l'échelle des valeurs jouées.
    for (const v of [-1234567, -294, -1, 0, 1, 294, 1234567]) {
      expect(PLUMES["euro-signe"](v)).toBe(euroSigne(v));
    }
  });

  it("l'amorti part de la valeur de départ et finit exactement sur l'arrivée", () => {
    expect(amorti(0)).toBe(0);
    expect(amorti(1)).toBe(1);
    // Amorti : la moitié du temps a déjà parcouru plus de la moitié du chemin.
    expect(amorti(0.5)).toBeGreaterThan(0.5);
  });
});

describe("4. le geste : le focus au moins aussi visible que le survol", () => {
  /** L'épaisseur d'un anneau, en pixels, dans une règle du bloc. */
  function anneau(apres: string): { epaisseur: number; couleur: string } {
    const i = BLOC.indexOf(apres);
    expect(i, `règle « ${apres} » absente`).toBeGreaterThan(0);
    const m = BLOC.slice(i).match(/outline:\s*(\d+)px solid ([^;]+);/);
    expect(m, `pas d'anneau après « ${apres} »`).not.toBeNull();
    return { epaisseur: Number(m![1]), couleur: m![2]!.trim() };
  }

  it("le survol et le focus dessinent le MÊME anneau, le focus plus épais", () => {
    const survol = anneau("@media (hover: hover) and (pointer: fine)");
    // Le focus du site, posé plus haut dans la feuille, est la référence.
    const focusGlobal = CSS.slice(CSS.indexOf("\n:focus-visible {")).match(
      /outline:\s*(\d+)px solid ([^;]+);/,
    );
    expect(focusGlobal).not.toBeNull();
    const focus = { epaisseur: Number(focusGlobal![1]), couleur: focusGlobal![2]!.trim() };
    expect(focus.epaisseur).toBeGreaterThanOrEqual(survol.epaisseur);
    // Une seule grammaire : la même teinte de part et d'autre.
    expect(BLOC).toContain("--anneau-du-geste: var(--color-amber-400)");
    expect(survol.couleur).toBe("var(--anneau-du-geste)");
    expect(focus.couleur).toBe("var(--color-amber-400)");
  });

  it("le survol ne porte aucune information à lui seul", () => {
    // Il ne fait apparaître ni texte ni contenu : seulement un anneau.
    const i = BLOC.indexOf("@media (hover: hover) and (pointer: fine)");
    const regle = BLOC.slice(i, BLOC.indexOf("\n}", BLOC.indexOf("{", i + 60)));
    expect(regle).not.toMatch(/content:/);
    expect(regle).not.toMatch(/display:/);
    expect(regle).not.toMatch(/visibility:/);
  });

  it("aucune animation ne rend une zone inerte ni ne retarde une action", () => {
    // Un bloc qui s'anime reste cliquable : pas de `pointer-events: none`, pas
    // de `visibility: hidden`, et aucune animation qui finirait transparente.
    expect(SANS_COMMENTAIRES).not.toMatch(/pointer-events:\s*none/);
    expect(SANS_COMMENTAIRES).not.toMatch(/visibility:\s*hidden/);
    for (const m of SANS_COMMENTAIRES.matchAll(/@keyframes ([\w-]+) \{([\s\S]*?)\n\}/g)) {
      const [, nom, corps] = m;
      const fin = corps!.slice(corps!.lastIndexOf("{"));
      if (/opacity/.test(corps!)) {
        expect(fin, `@keyframes ${nom} ne finit pas visible`).toMatch(/opacity:\s*1/);
      }
      if (/transform/.test(corps!)) {
        expect(fin, `@keyframes ${nom} ne finit pas en place`).toMatch(/transform:\s*none/);
      }
    }
  });

  it("le bouton occupé reste lisible : son encre entière, et une barre qui tourne", () => {
    expect(BLOC).toMatch(/\[aria-busy="true"\] \{\s*\n\s*opacity: 1;/);
    expect(BLOC).toContain("animation: barre-indeterminee");
  });
});

describe("5. la densité passe par des jetons, pas carte par carte", () => {
  it("les quatre jetons d'espacement de l'écran de jeu existent et resserrent", () => {
    const jeton = (nom: string) => {
      const m = BLOC.match(new RegExp(`--${nom}:\\s*([0-9.]+)rem;`));
      expect(m, `le jeton --${nom} manque`).not.toBeNull();
      return Number.parseFloat(m![1]!);
    };
    // Les valeurs d'avant, en rem : 2 entre les blocs, 1 dans une pile, 1,5 de
    // marge intérieure. Chaque jeton doit être STRICTEMENT plus serré.
    expect(jeton("pas-de-bloc")).toBeLessThan(2);
    expect(jeton("pas-de-pile")).toBeLessThan(1);
    expect(jeton("marge-de-carte")).toBeLessThan(1.5);
    const tete = BLOC.match(/--interligne-de-tete:\s*([0-9.]+);/);
    expect(tete).not.toBeNull();
    expect(Number.parseFloat(tete![1]!)).toBeLessThan(1.25);
    // Mais pas au point d'étouffer : un bloc garde au moins seize pixels d'air.
    expect(jeton("pas-de-bloc")).toBeGreaterThanOrEqual(1);
    expect(Number.parseFloat(tete![1]!)).toBeGreaterThanOrEqual(1.1);
  });

  it("la densité ne touche ni les tailles de texte ni les cibles tactiles", () => {
    const i = BLOC.indexOf("3. PLUS DE DENSITÉ");
    const j = BLOC.indexOf("4. DE LA RÉACTION AU GESTE");
    const densite = BLOC.slice(i, j).replace(/\/\*[\s\S]*?\*\//g, "");
    // Des PROPRIÉTÉS, pas des conditions : `@media (min-width: 640px)` est une
    // largeur d'écran, pas une cible tactile rétrécie.
    expect(densite).not.toMatch(/\n\s*font-size:/);
    expect(densite).not.toMatch(/\n\s*min-height:/);
    expect(densite).not.toMatch(/\n\s*min-width:/);
    expect(densite).not.toMatch(/\n\s*line-height:\s*[0-9.]/);
    // Et pas davantage les tableaux financiers, dont les cellules gardent leur air.
    expect(densite).not.toMatch(/tableau-financier/);
  });
});
