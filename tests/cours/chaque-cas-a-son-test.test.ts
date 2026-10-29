import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";

/**
 * CHAQUE CAS DÉDIÉ A SON TEST PROPRE (audit d'octobre 2026, contenu § 1.5).
 *
 * L'audit comptait 18 cas dédiés couverts seulement par la garde générique
 * (situations.test.ts : pas de NaN, une réponse qui ne se devine pas). Les lots suivants
 * leur ont donné un test qui refait leur calcul à la main et vérifie leur seule bonne
 * réponse. Cette garde empêche qu'un nouveau cas arrive sans : le fichier du cas doit être
 * importé par un test du cours autre que la garde générique.
 */

const RACINE = process.cwd();
const DOSSIER_DES_CAS = join(RACINE, "src/config/cours/situations/par-chapitre");
const TESTS = join(RACINE, "tests/cours");

/** Le fichier qui déclare ce code de cas. */
const fichierDuCas = (() => {
  const par = new Map<string, string>();
  for (const f of readdirSync(DOSSIER_DES_CAS).filter((n) => n.endsWith(".ts"))) {
    for (const m of readFileSync(join(DOSSIER_DES_CAS, f), "utf8").matchAll(/\bcode: "([a-z0-9-]+)"/g)) {
      if (!par.has(m[1]!)) par.set(m[1]!, f.replace(/\.ts$/, ""));
    }
  }
  return par;
})();

const sources = readdirSync(TESTS)
  .filter((n) => n.endsWith(".test.ts") && n !== "situations.test.ts" && n !== "chaque-cas-a-son-test.test.ts")
  .map((n) => readFileSync(join(TESTS, n), "utf8"));

describe("chaque cas dédié a son test", () => {
  it("les 127 cas dédiés sont tous importés par un test du cours", () => {
    const sans = CAS_PAR_CHAPITRE.filter((s) => {
      const f = fichierDuCas.get(s.code) ?? s.code;
      return !sources.some((src) => src.includes(`situations/par-chapitre/${f}"`));
    }).map((s) => s.code);
    expect(CAS_PAR_CHAPITRE.length).toBe(127);
    expect(sans).toEqual([]);
  });
});
