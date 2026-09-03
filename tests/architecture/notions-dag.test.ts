import { describe, expect, it } from "vitest";
import { CONCEPTS, CONCEPT_PREREQUISITES } from "../../src/config/pedagogy/concepts";

/**
 * Le graphe des prérequis des notions (V2 couche 2, chantier #1).
 *
 * `CONCEPT_PREREQUISITES` décide, à la lecture, quelles situations s'ouvrent à
 * un joueur : une notion dont un prérequis n'est pas maîtrisé ferme la porte.
 * Une faute dans ce graphe — un code qui n'existe plus, une notion oubliée, et
 * surtout une BOUCLE — ne casse aucun type et ne se voit à l'exécution que le
 * jour où une partie se retrouve à ne plus rien ouvrir. On la rattrape ici.
 *
 * Invariants : c'est un DAG (acyclique), il ne référence que des notions
 * existantes, chaque notion y figure exactement une fois, et toute notion est
 * atteignable depuis une racine (aucun îlot isolé).
 */

const CODES = new Set(CONCEPTS.map((c) => c.code));

describe("graphe des prérequis des notions", () => {
  it("couvre exactement les notions du référentiel", () => {
    for (const c of CONCEPTS) {
      expect(CONCEPT_PREREQUISITES, `notion sans entrée de prérequis : ${c.code}`).toHaveProperty(
        c.code,
      );
    }
    for (const code of Object.keys(CONCEPT_PREREQUISITES)) {
      expect(CODES, `entrée de prérequis pour une notion inconnue : ${code}`).toContain(code);
    }
  });

  it("ne référence que des notions existantes, sans auto-référence ni doublon", () => {
    for (const [code, prereqs] of Object.entries(CONCEPT_PREREQUISITES)) {
      expect(new Set(prereqs).size, `prérequis en double pour ${code}`).toBe(prereqs.length);
      for (const p of prereqs) {
        expect(p, `${code} ne peut pas être son propre prérequis`).not.toBe(code);
        expect(CODES, `prérequis inconnu « ${p} » pour ${code}`).toContain(p);
      }
    }
  });

  it("est acyclique (DAG)", () => {
    // 0 = non visité, 1 = en cours (pile), 2 = terminé.
    const state = new Map<string, number>();
    const stack: string[] = [];
    const visit = (code: string) => {
      if (state.get(code) === 2) return;
      if (state.get(code) === 1) {
        const from = stack.indexOf(code);
        throw new Error(`cycle de prérequis : ${[...stack.slice(from), code].join(" → ")}`);
      }
      state.set(code, 1);
      stack.push(code);
      for (const p of CONCEPT_PREREQUISITES[code] ?? []) visit(p);
      stack.pop();
      state.set(code, 2);
    };
    expect(() => {
      for (const code of CODES) visit(code);
    }).not.toThrow();
  });

  it("a des racines de démarrage et n'a aucune notion isolée", () => {
    const roots = [...CODES].filter((c) => (CONCEPT_PREREQUISITES[c] ?? []).length === 0);
    expect(roots.length, "il faut au moins une racine sans prérequis").toBeGreaterThan(0);

    // Atteignabilité : en partant des racines et en suivant les arêtes vers
    // l'aval (prérequis → notions qui en dépendent), on doit couvrir toutes les
    // notions. Une notion non atteinte est un îlot déconnecté du parcours.
    const dependents = new Map<string, string[]>();
    for (const [code, prereqs] of Object.entries(CONCEPT_PREREQUISITES)) {
      for (const p of prereqs) dependents.set(p, [...(dependents.get(p) ?? []), code]);
    }
    const reached = new Set(roots);
    const queue = [...roots];
    while (queue.length > 0) {
      const code = queue.shift()!;
      for (const dep of dependents.get(code) ?? []) {
        if (!reached.has(dep)) {
          reached.add(dep);
          queue.push(dep);
        }
      }
    }
    const isolated = [...CODES].filter((c) => !reached.has(c));
    expect(isolated, `notions inatteignables depuis une racine : ${isolated.join(", ")}`).toEqual(
      [],
    );
  });
});
