import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LA PRODUCTION NE CONNAÎT PAS `db.transaction` (novembre 2026).
 *
 * En production, `src/db/index.ts` prend le pilote HTTP de Neon, qui lève « No transactions
 * support in neon-http driver » à tout appel de `transaction`. Les tests, eux, tournent sur
 * node-postgres, qui l'accepte : une transaction passait donc partout sauf en ligne (c'est
 * ainsi que l'attribution des cours par l'admin échouait). Une écriture en plusieurs requêtes
 * qui doivent réussir ensemble passe par `ecrireEnUnBloc` (src/db/en-un-bloc.ts), qui prend le lot
 * de Neon en production et une transaction ailleurs.
 */
const RACINE = join(__dirname, "..", "..", "src");

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
  });
}

describe("aucune transaction Drizzle hors de src/db/en-un-bloc.ts", () => {
  it("le pilote HTTP de Neon les refuse en production", () => {
    const fautifs = fichiers(RACINE)
      .filter((f) => relative(RACINE, f) !== join("db", "en-un-bloc.ts"))
      .filter((f) => /\.transaction\s*\(/.test(readFileSync(f, "utf8")))
      .map((f) => relative(RACINE, f));
    expect(fautifs).toEqual([]);
  });
});
