import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * L'HYGIÈNE DU DÉPÔT (audit d'octobre 2026, P2-13 et Q-2).
 *
 * Le rapport de couverture (coverage/, 43 fichiers) était suivi par git ; et des modules
 * qu'aucune page, route ni test n'atteignait restaient dans src/ (le module de
 * formation `src/training`, une copie du service de diagnostic, trois composants, une aide
 * de validation), soit 1 818 lignes. Ils sont retirés ; la garde empêche leur retour.
 */

const RACINE = process.cwd();

describe("hygiène du dépôt", () => {
  it("coverage/ est ignoré et hors de l'index", () => {
    expect(readFileSync(join(RACINE, ".gitignore"), "utf8")).toMatch(/^coverage\/$/m);
    let suivis = "";
    try {
      suivis = execFileSync("git", ["ls-files", "coverage"], { cwd: RACINE, encoding: "utf8" });
    } catch {
      return; // hors d'un dépôt git (archive) : rien à vérifier
    }
    expect(suivis.trim()).toBe("");
  });

  it.each([
    "src/training",
    "src/services/diagnosis.service.ts",
    "src/components/arena-layout.tsx",
    "src/components/guide-with-glossary.tsx",
    "src/components/variance-panel.tsx",
    "src/config/validation-native.ts",
  ])("le code mort %s ne revient pas", (chemin) => {
    expect(existsSync(join(RACINE, chemin))).toBe(false);
  });
});
