import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UNE SEULE BARRE DE NAVIGATION, ET UN SEUL LOGO.
 *
 * Trois pages — le guide, les parcours, les mentions légales — portaient leur
 * PROPRE barre de navigation, logo compris, sous l'en-tête du site. Sur un
 * téléphone, les deux logos se superposaient, le premier lien venait se coller
 * au second logo, et le bouton du bout sortait de l'écran : 79 px de débord
 * horizontal à 390 de large, 149 à 320. Sur grand écran le défaut ne se voyait
 * pas, ce qui l'a laissé vivre.
 *
 * La cause tient en une ligne : une barre en `flex` sans repli, dans une page
 * qui avait déjà la sienne au-dessus. Le remède aussi : il n'y a qu'une barre,
 * celle du gabarit, et son menu porte déjà tout le plan du site.
 *
 * CE QUE CETTE GARDE N'INTERDIT PAS. Un sommaire, un fil d'Ariane, une barre
 * d'onglets sont des `<nav>` parfaitement légitimes ; ce qui ne l'est pas, c'est
 * de REFAIRE l'en-tête, et un logo posé dans une page en est le signe sûr.
 */

const SRC = join(process.cwd(), "src");

function pages(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...pages(chemin));
    else if (entree === "page.tsx") trouves.push(chemin);
  }
  return trouves;
}

/**
 * La page de connexion enseignant pose le logo au centre de sa carte, comme le
 * fait n'importe quel écran de connexion : ce n'est pas une barre refaite.
 */
const ACCEPTEES = ["/app/teacher/login/page.tsx"];

describe("une seule entête", () => {
  it("aucune page ne repose le logo du site", () => {
    const fautes = pages(join(SRC, "app"))
      .filter((f) => readFileSync(f, "utf8").includes("<SiteLogo"))
      .map((f) => f.slice(SRC.length))
      .filter((f) => !ACCEPTEES.includes(f));
    expect(
      fautes,
      `ces pages reposent le logo, donc refont l'en-tête :\n${fautes.join("\n")}`,
    ).toEqual([]);
  });

  it("aucune barre de liens en ligne ne refuse de se replier", () => {
    // Une barre horizontale de liens qui ne se replie pas déborde dès que
    // l'écran rétrécit. Si une page en pose une, elle porte `flex-wrap`.
    const fautes: string[] = [];
    for (const f of pages(join(SRC, "app"))) {
      const source = readFileSync(f, "utf8");
      for (const balise of source.match(/<nav\b[^>]*>/g) ?? []) {
        const classes = balise.match(/className="([^"]*)"/)?.[1] ?? "";
        if (!/\bflex\b/.test(classes)) continue;
        if (/flex-col|flex-wrap/.test(classes)) continue;
        fautes.push(`${f.slice(SRC.length)} : ${balise.slice(0, 90)}`);
      }
    }
    expect(fautes, `barres qui ne se replient pas :\n${fautes.join("\n")}`).toEqual([]);
  });
});
