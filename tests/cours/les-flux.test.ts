import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { FLUX_DE_L_ARENE, LES_FLUX, premierTrimestre } from "../../src/config/cours/chapitres/les-flux";
import { CHAPITRES } from "../../src/config/cours/registre";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LES FLUX TIENNENT DANS LES NEUF ENTREPRISES.
 *
 * Chaque opération du mois a un partenaire, et les six partenaires sont tous là ; le
 * trimestre vu de la banque est celui de l'arène, entrées moins sorties égale la
 * variation de la banque, et chaque ligne de l'arène a un libellé en français ; aucun texte
 * ne sort un « undefined » ; le chapitre pilote reste le premier du cours.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    case "tri":
      return [e.question(cas), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi, String(x.montant)]), ...e.explication(cas)];
    default:
      return [];
  }
}

it("le chapitre pilote reste le premier du cours, celui qui s'ouvre sans licence", () => {
  expect(CHAPITRES[0]!.libre).toBe(true);
  expect(LES_FLUX.libre).toBe(false);
});

describe.each(ENTREPRISES_DU_COURS)("les flux chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(LES_FLUX, cas);
  const t = premierTrimestre(cas);

  it("chaque opération a un partenaire, les six sont là, et chaque libellé est unique", () => {
    const tri = chapitre.etapes.find((e) => e.type === "tri");
    if (tri?.type !== "tri") throw new Error("étape de tri");
    const elements = tri.elements(cas);
    const codes = new Set(tri.categories.map((k) => k.code));
    for (const el of elements) {
      expect(codes.has(el.categorie), el.libelle).toBe(true);
      expect(el.montant, el.libelle).toBeGreaterThan(0);
      expect(el.libelle, el.libelle).not.toMatch(/"/);
    }
    expect(new Set(elements.map((e) => e.categorie)).size).toBe(tri.categories.length);
    expect(new Set(elements.map((e) => e.libelle)).size).toBe(elements.length);
  });

  it("le trimestre est celui de l'arène : entrées moins sorties égale la variation de la banque", () => {
    const cf = anneeJouee(code).partie.rounds[0]!.results["joueur"]!.cashFlow;
    expect(t.debut).toBeCloseTo(cf.opening, 1);
    expect(t.fin).toBeCloseTo(cf.closing, 1);
    expect(t.variation).toBeCloseTo(t.fin - t.debut, 0);
    expect(t.entrees).toBeGreaterThan(0);
    for (const l of t.lignes) expect(FLUX_DE_L_ARENE[l.label], l.label).toBeDefined();
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\b(de|à) les? /);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
