import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UN DÉLAI POSÉ HORS DE L'APPEL NE S'APPLIQUE À RIEN.
 *
 * Trois essais de `tournoi-multi-phases` rejouent une phase entière de tournoi
 * sur une base embarquée : quelques secondes au repos, davantage dès que la
 * machine travaille. On leur avait donné vingt secondes. Écrites ainsi :
 *
 *     it("…", async () => {
 *       …
 *     }), DELAI_PHASE;
 *
 * La parenthèse fermait `it` AVANT la virgule : la ligne ne passait pas un
 * troisième argument, elle évaluait `it(…)` puis `DELAI_PHASE`, et jetait la
 * seconde valeur. Les trois essais sont donc restés au délai par défaut de cinq
 * secondes, et ont continué de tomber au hasard dans la suite complète — un
 * échec qui va et vient, c'est-à-dire un échec qu'on finit par ignorer.
 *
 * Rien ne le signalait : la ligne est du JavaScript valide, le typage l'accepte,
 * et le test passe quand la machine est au repos. Seule une garde le voit.
 *
 * La forme juste met le délai DANS l'appel : `}, DELAI_PHASE);`
 */

const TESTS = join(process.cwd(), "tests");

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (entree.endsWith(".ts")) trouves.push(chemin);
  }
  return trouves;
}

/**
 * `}), QUELQUE_CHOSE;` en fin de ligne : la signature de l'erreur. Une valeur
 * seule après la parenthèse fermante n'est lue par personne.
 */
const DELAI_HORS_APPEL = /^\s*\}\)\s*,\s*[A-Za-z0-9_$.]+\s*;\s*$/;

describe("les délais des essais", () => {
  it("aucun délai n'est posé après la parenthèse qui ferme l'essai", () => {
    const fautes: string[] = [];
    for (const f of fichiers(TESTS)) {
      const lignes = readFileSync(f, "utf8").split("\n");
      lignes.forEach((ligne, i) => {
        if (DELAI_HORS_APPEL.test(ligne)) {
          fautes.push(`${f.slice(process.cwd().length + 1)}:${i + 1} : ${ligne.trim()}`);
        }
      });
    }
    expect(
      fautes,
      "ces délais sont hors de l'appel et ne s'appliquent pas ; " +
        `écrire « }, DELAI); » plutôt que « }), DELAI; » :\n${fautes.join("\n")}`,
    ).toEqual([]);
  });

  it("les essais qui rejouent une phase de tournoi gardent leur délai", () => {
    // Ceux-là sont la raison d'être de la garde : sans délai explicite, ils
    // retombent aux cinq secondes par défaut, qui ne suffisent pas sous charge.
    const source = readFileSync(join(TESTS, "integration", "tournoi-multi-phases.test.ts"), "utf8");
    expect(source).toContain("const DELAI_PHASE = 20_000;");
    expect(source.match(/\}, DELAI_PHASE\);/g) ?? []).toHaveLength(3);
  });
});
