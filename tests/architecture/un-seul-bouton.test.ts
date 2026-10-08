import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { bouton } from "@/components/bouton";

/**
 * LE BOUTON S'ÉCRIT UNE FOIS.
 *
 * Relevé avant d'écrire `components/bouton.ts` : 50 boutons laiton pleins dans
 * 37 fichiers, en ONZE remplissages différents, et en deux familles qui ne se
 * parlaient pas — `bg-amber-500` avec une ombre sur les pages publiques,
 * `bg-amber-400` sans ombre dans l'application. Personne n'avait décidé cela :
 * chaque bouton avait été copié du plus proche voisin, et la copie dérivait.
 *
 * Une fonction de classes ne règle rien toute seule : il suffit d'un bouton
 * écrit à la main pour que la dérive reprenne, et elle reprend toujours par le
 * bouton qu'on ajoute en vitesse. D'où cette garde.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (entree.endsWith(".tsx") || entree.endsWith(".ts")) trouves.push(chemin);
  }
  return trouves;
}

/**
 * Les aperçus DESSINENT des écrans : leur bouton est un `<p>` qui occupe toute
 * la largeur d'un faux téléphone, pas un bouton qu'on clique. Lui appliquer la
 * vraie fonction le ferait rétrécir à la largeur de son texte, et la maquette
 * ne ressemblerait plus à l'écran qu'elle montre.
 */
const DESSINS = ["/components/apercus.tsx"];

/**
 * Du laiton PLEIN suivi d'un remplissage : la signature d'un bouton.
 *
 * Sans préfixe de variante : le lien d'évitement du gabarit est entièrement
 * écrit en `focus:` — il n'existe qu'au focus clavier, ne peut pas appeler la
 * fonction (qui rendrait ses classes inconditionnelles), et n'est donc pas un
 * bouton copié.
 */
const SANS_PREFIXE = "(?<![\\w:/-])";
const LAITON_PLEIN = new RegExp(
  `${SANS_PREFIXE}bg-amber-(?:400|500)(?![\\w/-])[^"'\`]*${SANS_PREFIXE}p[xy]-` +
    `|${SANS_PREFIXE}p[xy]-[0-9.]+[^"'\`]*${SANS_PREFIXE}bg-amber-(?:400|500)(?![\\w/-])`,
);

describe("un seul bouton", () => {
  it("aucun bouton laiton plein n'est écrit à la main", () => {
    const fautes: string[] = [];
    for (const f of fichiers(SRC)) {
      const court = f.slice(SRC.length);
      if (court === "/components/bouton.ts" || DESSINS.includes(court)) continue;
      const source = readFileSync(f, "utf8");
      for (const ligne of source.split("\n")) {
        if (LAITON_PLEIN.test(ligne)) fautes.push(`${court} : ${ligne.trim().slice(0, 100)}`);
      }
    }
    expect(
      fautes,
      `ces boutons devraient appeler bouton() :\n${fautes.join("\n")}`,
    ).toEqual([]);
  });

  it("les trois tailles passent le plancher de 24 px", () => {
    // 12 px de texte, 16 px d'interligne, et deux fois le remplissage vertical.
    // La plus petite fait 16 + 2 × 6 = 28 px : au-dessus du plancher WCAG 2.5.8.
    expect(bouton({ taille: "s" })).toContain("py-1.5");
    expect(bouton({ taille: "m" })).toContain("py-2");
    expect(bouton({ taille: "l" })).toContain("py-3");
  });

  it("l'ombre n'est portée que par le grand bouton plein", () => {
    // Une ombre laiton donne de la présence à l'appel d'une page publique ;
    // posée sur les huit boutons d'un écran de pilotage, elle fait du bruit.
    expect(bouton({ taille: "l" })).toContain("shadow-lg");
    expect(bouton({ taille: "m" })).not.toContain("shadow");
    expect(bouton({ variante: "secondaire", taille: "l" })).not.toContain("shadow");
    expect(bouton({ variante: "lien", taille: "l" })).not.toContain("shadow");
  });

  it("chaque variante dit une intention différente", () => {
    const principal = bouton();
    const secondaire = bouton({ variante: "secondaire" });
    const lien = bouton({ variante: "lien" });
    expect(principal).toContain("bg-amber-400");
    expect(secondaire).toContain("border-white/15");
    // Le lien : l'encre d'action soulignée d'un pixel, sans cadre ni fond.
    expect(lien).toContain("underline");
    expect(lien).toContain("decoration-1");
    expect(lien).not.toMatch(/\bborder\b|\bbg-/);
    // Et toutes partagent la même forme : c'est ce qui les fait lire comme une
    // famille plutôt que comme trois inventions.
    for (const v of [principal, secondaire, lien]) {
      expect(v).toContain("rounded-lg");
      expect(v).toContain("inline-flex");
      expect(v).toContain("disabled:cursor-not-allowed");
      // Désactivé, un bouton est NEUTRE : l'opacité faisait d'un aplat orange
      // un pêche pâle. L'état passe par la feuille (« LE BOUTON DÉSACTIVÉ »).
      expect(v).not.toMatch(/disabled:opacity/);
    }
    expect(secondaire).toContain("bouton-filet");
  });

  it("désactivé, le bouton plein prend le gris des filets, sans ombre ni opacité", () => {
    const css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
    const debut = css.indexOf(".bouton-plein:disabled,");
    expect(debut, "la règle du bouton désactivé a disparu").toBeGreaterThan(0);
    const regle = css.slice(debut, css.indexOf("}", debut));
    expect(regle).toContain("var(--bouton-inactif-fond)");
    expect(regle).toContain("var(--bouton-inactif-texte)");
    expect(regle).toMatch(/box-shadow:\s*none/);
    expect(regle).toMatch(/opacity:\s*1/);
    expect(css).toMatch(/--bouton-inactif-fond:\s*#dbe2ee/);
    expect(css).toMatch(/--bouton-inactif-texte:\s*#4b5970/);
  });
});
