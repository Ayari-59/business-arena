import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LES COMMANDES DU README EXISTENT, ET CELLES QUI COMPTENT Y SONT.
 *
 * Le README donnait une recette de base locale qui demandait `createdb` et un
 * Postgres installé : sur un poste neuf, dans un conteneur d'intégration
 * continue ou dans un bac à sable, elle ne tenait pas, et le parcours en
 * navigateur restait rouge faute de base plutôt que faute de code. La recette
 * était fausse depuis assez longtemps pour que personne ne s'en serve.
 *
 * Une documentation qui ment coûte plus cher qu'une documentation absente :
 * on la suit, elle échoue, et on doute du dépôt plutôt que du texte. Cette
 * garde tient les deux bouts — aucune commande citée qui n'existe, aucune
 * commande d'entrée qui ne soit citée.
 */

const RACINE = process.cwd();
const README = readFileSync(join(RACINE, "README.md"), "utf8");
const SCRIPTS: Record<string, string> = JSON.parse(
  readFileSync(join(RACINE, "package.json"), "utf8"),
).scripts;

/**
 * Les commandes qu'on tape le premier jour. Les autres (`db:studio`,
 * `calibrate`…) servent à qui connaît déjà le dépôt et n'ont pas à figurer.
 */
const A_DOCUMENTER = ["base:locale", "dev", "test", "test:e2e", "typecheck", "build"];

describe("les commandes documentées", () => {
  it("chaque `npm run` cité dans le README existe", () => {
    const cites = [...README.matchAll(/npm run ([a-z0-9:]+)/g)].map((m) => m[1]!);
    expect(cites.length).toBeGreaterThan(4);
    const inconnues = [...new Set(cites)].filter((c) => !(c in SCRIPTS));
    expect(
      inconnues,
      `le README cite des commandes qui n'existent pas : ${inconnues.join(", ")}`,
    ).toEqual([]);
  });

  it("les commandes d'entrée sont toutes citées", () => {
    const manquantes = A_DOCUMENTER.filter((c) => !README.includes(`npm run ${c}`) && c !== "test");
    // `npm test` s'écrit sans `run` : on l'accepte sous ses deux formes.
    if (!README.includes("npm test") && !README.includes("npm run test")) manquantes.push("test");
    expect(
      manquantes,
      `ces commandes d'entrée ne sont nulle part dans le README : ${manquantes.join(", ")}`,
    ).toEqual([]);
  });

  it("la recette de base locale ne demande plus d'installer Postgres", () => {
    // `createdb` suppose un Postgres système et un rôle : les deux manquent là
    // où l'on a justement besoin d'une base jetable.
    expect(README).not.toContain("createdb");
    expect(README).toContain("npm run base:locale");
  });

  it("le dossier de données de la base locale n'est pas versionné", () => {
    // Des données de démonstration recréées en une commande n'ont rien à faire
    // dans l'historique.
    expect(readFileSync(join(RACINE, ".gitignore"), "utf8")).toMatch(/^\.pglite\/$/m);
  });
});
