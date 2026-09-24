import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * AUCUNE DÉCISION NE SE PREND À LA MOLETTE.
 *
 * Un `<input type="number">` qui a le focus change de valeur quand la molette
 * passe dessus. Le formulaire de décision en aligne plusieurs dans un écran
 * qu'on fait défiler : l'élève clique dans « Prix », descend lire l'aide juste
 * en dessous, et le prix a changé sans un mot.
 *
 * La garde vaut pour tout ce qu'un ÉLÈVE ou un ENSEIGNANT remplit. La console
 * d'administration en est dispensée : ses pages sont des composants serveur,
 * où aucun gestionnaire d'événement ne peut être posé, et personne n'y saisit
 * une décision de jeu.
 */

const SRC = join(process.cwd(), "src");
const DISPENSES = ["/app/admin/"];

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (entree.endsWith(".tsx")) trouves.push(chemin);
  }
  return trouves;
}

describe("les champs numériques", () => {
  it("portent tous la garde de molette", () => {
    const fautes: string[] = [];
    for (const f of fichiers(SRC)) {
      if (DISPENSES.some((d) => f.includes(d))) continue;
      const source = readFileSync(f, "utf8");
      // Chaque `type="number"` doit être immédiatement suivi de la garde :
      // la coller à la ligne d'après est la seule façon de ne pas l'oublier
      // en ajoutant un champ par copie d'un autre.
      const champs = source.match(/type="number"/g) ?? [];
      const gardes = source.match(/type="number"\n\s*onWheel=\{sansMolette\}/g) ?? [];
      if (champs.length !== gardes.length) {
        fautes.push(`${f.slice(SRC.length)} : ${champs.length} champs, ${gardes.length} gardés`);
      }
    }
    expect(fautes, `champs numériques sans garde :\n${fautes.join("\n")}`).toEqual([]);
  });

  it("les curseurs aussi", () => {
    // Firefox change la valeur d'un `<input type="range">` à la molette SANS
    // qu'il ait le focus : passer au-dessus d'un curseur d'emprunt en faisant
    // défiler la page suffirait à emprunter. Même garde, même raison.
    const fautes: string[] = [];
    for (const f of fichiers(SRC)) {
      if (DISPENSES.some((d) => f.includes(d))) continue;
      const source = readFileSync(f, "utf8");
      const champs = source.match(/type="range"/g) ?? [];
      const gardes = source.match(/type="range"\n\s*onWheel=\{sansMolette\}/g) ?? [];
      if (champs.length !== gardes.length) {
        fautes.push(`${f.slice(SRC.length)} : ${champs.length} curseurs, ${gardes.length} gardés`);
      }
    }
    expect(fautes, `curseurs sans garde :\n${fautes.join("\n")}`).toEqual([]);
  });

  it("la garde retire le focus, elle n'annule pas l'événement", () => {
    // React attache ses écouteurs de molette en mode passif : preventDefault()
    // n'y ferait rien, et une garde qui ne garde pas est pire que rien.
    const source = readFileSync(join(SRC, "components", "sans-molette.ts"), "utf8");
    // Hors commentaires : le module EXPLIQUE pourquoi preventDefault ne marche
    // pas, et cette explication ne doit pas faire échouer sa propre garde.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
    expect(code).toContain("e.currentTarget.blur()");
    expect(code).not.toContain("preventDefault");
  });
});
