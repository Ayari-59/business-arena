import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ASSORTIMENT, FAMILLES_D_ASSORTIMENT, assortiment } from "../../src/config/cours/chapitres/assortiment";
import { COMMERCES } from "../../src/config/cours/chapitres/taux-de-marque";
import { gammeDuMois } from "../../src/config/cours/gamme";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * L'ASSORTIMENT SE LIT SUR LA GAMME DE L'ARÈNE.
 *
 * Chaque commerce a une gamme dans l'arène ; la marge de chaque référence et ses parts se
 * recomposent ; chaque référence tombe dans la famille que ses chiffres lui donnent face aux
 * moyennes de la gamme ; la dernière référence garde une marge positive, ce qui rend juste
 * la réponse « pas forcément ».
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    case "tri":
      return [e.question(cas), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas)];
    default:
      return [];
  }
}

it("les familles du classement sont les quatre, et l'assortiment en mêle plusieurs dans chaque commerce", () => {
  expect(FAMILLES_D_ASSORTIMENT.map((f) => f.code)).toEqual(["locomotive", "volume", "marge", "a-revoir"]);
  for (const code of COMMERCES) {
    const familles = new Set(assortiment(casDeLEntreprise(code)).lignes.map((r) => r.famille));
    expect(familles.size, code).toBeGreaterThanOrEqual(2);
  }
});

describe.each(COMMERCES)("l'assortiment chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const a = assortiment(cas);
  const chapitre = chapitreDuCas(ASSORTIMENT, cas);

  it("la gamme est celle de l'arène ; marges et parts se recomposent", () => {
    const g = gammeDuMois(code)!;
    expect(a.lignes.map((r) => r.code)).toEqual(g.references.map((r) => r.code));
    for (const r of a.lignes) expect(r.mcv).toBe(Math.round(r.quantite * (r.prix - r.coutVariableUnitaire)));
    expect(a.mcvTotale).toBe(a.lignes.reduce((t, r) => t + r.mcv, 0));
    expect(a.lignes.reduce((t, r) => t + r.partDuCa, 0)).toBeCloseTo(100, -1);
    expect(a.lignes.reduce((t, r) => t + r.partDeLaMarge, 0)).toBeCloseTo(100, -1);
  });

  it("chaque référence tombe dans la famille que lui donnent les moyennes de la gamme", () => {
    const volume = a.lignes.reduce((t, r) => t + r.quantite, 0) / a.lignes.length;
    const marge = a.lignes.reduce((t, r) => t + (r.prix - r.coutVariableUnitaire), 0) / a.lignes.length;
    for (const r of a.lignes) {
      const fort = r.quantite >= volume;
      const forte = r.prix - r.coutVariableUnitaire >= marge - 0.005;
      expect(r.famille, r.nom).toBe(fort ? (forte ? "locomotive" : "volume") : forte ? "marge" : "a-revoir");
    }
  });

  it("la dernière référence garde une marge positive : la retirer coûterait sa marge", () => {
    expect(a.derniere.mcv).toBeGreaterThan(0);
    expect(a.derniere.mcv).toBe(Math.min(...a.lignes.map((r) => r.mcv)));
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\b(de|à) les? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bde [aeiouyéèê]/i);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
