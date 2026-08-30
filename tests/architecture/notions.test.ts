import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { DECISION_MODELS } from "../../src/config/pedagogy/models";

/**
 * Le mot « notion », et le nombre qui l'accompagne.
 *
 * Le produit disait « concepts » là où les référentiels et les enseignants
 * disent « notions ». Le mot ne change rien au calcul, ce qui est exactement
 * pourquoi personne ne l'aurait corrigé : c'est le lecteur qui connaît son
 * métier qui bute dessus.
 *
 * Le nombre était écrit à la main dans la page d'accueil. Il tombait juste au
 * moment où il a été écrit, ce qui est la pire des situations : rien ne
 * signale qu'il a cessé de l'être.
 *
 * Les identifiants du code, eux, gardent leur nom : `CONCEPTS`, `conceptCodes`
 * et les colonnes de la base ne s'affichent nulle part, et les renommer
 * demanderait une migration pour un gain nul.
 */
const PAGES = (() => {
  const trouves: string[] = [];
  const parcourir = (dossier: string) => {
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = join(dossier, entree.name);
      if (entree.isDirectory()) parcourir(chemin);
      else if (entree.name.endsWith(".tsx")) trouves.push(chemin);
    }
  };
  parcourir("src/app");
  parcourir("src/components");
  return trouves;
})();

describe("notions", () => {
  it("aucune page ne parle de concepts à l'élève", () => {
    const fautifs: string[] = [];
    for (const chemin of PAGES) {
      const source = readFileSync(chemin, "utf-8")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      // Les identifiants du code sont permis ; c'est le mot en toutes lettres,
      // dans une phrase, qui ne l'est pas.
      const restes = [...source.matchAll(/\bconcepts?\b/gi)].filter((m) => {
        const avant = source.slice(Math.max(0, m.index! - 24), m.index!);
        const morceau = avant + m[0];
        // Un accès de champ (`profile.concepts`), un identifiant exporté ou un
        // chemin d'import ne s'affichent nulle part : ce sont des noms de code.
        return !/\.concepts|conceptCodes|conceptHint|conceptMastery|pedagogy\/|CONCEPTS|\/concepts/.test(
          morceau,
        );
      });
      if (restes.length > 0) fautifs.push(`${chemin} (${restes.length})`);
    }
    expect(fautifs, `pages parlant encore de concepts : ${fautifs.join(", ")}`).toEqual([]);
  });

  it("l'accueil compte les fiches et les modèles au lieu de les écrire", () => {
    const accueil = readFileSync("src/app/page.tsx", "utf-8");
    expect(accueil, "le nombre de fiches est écrit à la main").not.toMatch(
      new RegExp(`${CONCEPTS.length} fiches notions"`),
    );
    expect(accueil).toContain("CONCEPTS.length");
    expect(accueil, "le nombre de modèles est écrit à la main").not.toMatch(
      new RegExp(`"${DECISION_MODELS.length} modèles"`),
    );
    expect(accueil).toContain("DECISION_MODELS.length");
  });

  it("l'ancienne adresse des fiches redirige au lieu de disparaître", () => {
    // Elle a pu être copiée dans un cahier de textes ou sur un support
    // imprimé : la casser silencieusement serait pire que de l'avoir renommée.
    const ancienne = readFileSync("src/app/concepts/page.tsx", "utf-8");
    expect(ancienne).toContain("redirect");
    expect(ancienne).toContain("/notions");
  });

  it("aucun lien ne pointe encore vers l'ancienne adresse", () => {
    const fautifs = PAGES.filter(
      (chemin) =>
        chemin !== "src/app/concepts/page.tsx" &&
        /href=\{?[`"]\/concepts/.test(readFileSync(chemin, "utf-8")),
    );
    expect(fautifs, `liens vers l'ancienne adresse : ${fautifs.join(", ")}`).toEqual([]);
  });
});
