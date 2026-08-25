import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Garde-fous d'architecture (doc 09 §6) : le moteur économique est pur —
 * aucune dépendance framework/DB, aucune source d'aléa ou d'horloge hors PRNG.
 */

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const engineFiles = listFiles("src/engine").filter((f) => f.endsWith(".ts"));

describe("pureté du moteur économique (src/engine)", () => {
  it("n'importe ni react, ni next, ni drizzle, ni db, ni services", () => {
    const forbidden = [/from ["']react/, /from ["']next/, /from ["']drizzle/, /from ["'].*\/db\//, /from ["'].*\/services\//];
    for (const file of engineFiles) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(source, `${file} viole ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("n'utilise ni Math.random, ni Date.now, ni new Date()", () => {
    for (const file of engineFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/Math\.random/);
      expect(source, file).not.toMatch(/Date\.now/);
      expect(source, file).not.toMatch(/new Date\(/);
    }
  });

  it("couvre bien les modules du moteur", () => {
    expect(engineFiles.length).toBeGreaterThanOrEqual(10);
  });
});
