import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";

/**
 * AUCUNE PAGE NE COMPTE LES SECTEURS À LA MAIN.
 *
 * « Sept entreprises, sept façons de perdre de l'argent » était vrai le matin
 * et faux l'après-midi, le jour où deux secteurs sont arrivés. Le défaut s'est
 * répandu partout à la fois : le titre de la vitrine, sa description pour les
 * moteurs de recherche, le surtitre, la page des concepts, la foire aux
 * questions de l'atelier, et jusqu'aux liens de bas de page.
 *
 * La règle : un nombre de secteurs qui s'affiche se LIT du registre. Écrit en
 * toutes lettres, il devient faux sans prévenir et personne ne s'en aperçoit,
 * parce qu'aucun test ne lit la prose.
 */

const NOMBRES = "deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze";
const COMPTABLES = "secteurs?|entreprises?|métiers?|fiches?|économies?|contraintes?";
const COMPTAGE = new RegExp(`\\b(${NOMBRES})\\s+(${COMPTABLES})\\b`, "i");

/** Fichiers de PRÉSENTATION : ce que lit un visiteur, pas la donnée d'un scénario. */
function sources(racine: string, suffixes: string[]): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...sources(chemin, suffixes));
    else if (suffixes.some((s) => entree.endsWith(s))) trouves.push(chemin);
  }
  return trouves;
}

describe("comptage des secteurs", () => {
  it("le registre porte bien plusieurs secteurs", () => {
    // Sans cela, le test suivant garderait une règle sans objet.
    expect(SCENARIOS.length).toBeGreaterThan(2);
  });

  it("aucune page ni aucun atelier n'écrit ce nombre en toutes lettres", () => {
    const fichiers = [
      ...sources("src/app", [".tsx"]),
      ...sources("src/config/ateliers", [".ts"]),
    ];
    expect(fichiers.length, "aucune source de présentation trouvée").toBeGreaterThan(5);

    const fautes: string[] = [];
    for (const fichier of fichiers) {
      for (const [i, ligne] of readFileSync(fichier, "utf-8").split("\n").entries()) {
        const m = COMPTAGE.exec(ligne);
        if (m) fautes.push(`${fichier}:${i + 1} « ${m[0]} »`);
      }
    }
    expect(
      fautes,
      `comptage écrit à la main, à lire du registre :\n${fautes.join("\n")}`,
    ).toEqual([]);
  });
});
