import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { SOLDES_INTERMEDIAIRES, soldesDeGestion } from "../../src/config/cours/chapitres/soldes-intermediaires";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LES SOLDES INTERMÉDIAIRES TIENNENT DANS LES NEUF ENTREPRISES.
 *
 * La valeur ajoutée est ce que les ventes et la variation du stock laissent une fois
 * payées toutes les consommations externes, achats compris, une seule fois ; l'EBE est celui
 * que l'arène affiche, tour après tour additionnés ; le résultat courant avant impôt est le
 * résultat avant impôt de l'arène ; les deux méthodes de la CAF se rejoignent ; la variation de
 * trésorerie est celle de l'arène ; la marge commerciale n'existe que là où l'entreprise
 * revend des marchandises ; aucun texte ne sort un « undefined ».
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("les soldes intermédiaires chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = soldesDeGestion(cas);
  const chapitre = chapitreDuCas(SOLDES_INTERMEDIAIRES, cas);

  it("la valeur ajoutée retire chaque consommation externe une fois, achats compris", () => {
    const externes = s.achats + s.autres + s.commissions + s.publicite + s.entretien + s.loyerEtFrais;
    expect(s.valeurAjoutee).toBeCloseTo(s.ventes + s.variation - externes, 1);
    expect(s.marchandises ? s.production : s.margeCommerciale).toBe(0);
  });

  it("l'EBE est celui de l'arène, le résultat courant celui de l'arène, et les deux CAF se rejoignent", () => {
    expect(Math.abs(s.ebe - s.ebeDeLArene)).toBeLessThan(1);
    expect(Math.abs(s.rcai - s.arene.resultatAvantImpot)).toBeLessThan(2);
    expect(s.resultatNet).toBeCloseTo(s.rcai - s.impot, 2);
    expect(s.cafAdditive).toBeCloseTo(s.cafSoustractive, 2);
    expect(s.cafAdditive).toBeCloseTo(s.resultatNet + s.dotation, 2);
  });

  it("la variation de trésorerie est celle de l'arène", () => {
    const tours = anneeJouee(code).partie.rounds;
    expect(s.tresorerie.debut).toBeCloseTo(tours[0]!.results["joueur"]!.cashFlow.opening, 1);
    expect(s.tresorerie.fin).toBeCloseTo(tours[tours.length - 1]!.results["joueur"]!.cashFlow.closing, 1);
  });

  it("la marge commerciale n'existe que là où l'entreprise revend des marchandises ; la production, partout ailleurs", () => {
    const ids = new Set(chapitre.etapes.map((e) => e.id));
    expect(ids.has("marge-commerciale")).toBe(s.marchandises);
    expect(ids.has("production")).toBe(!s.marchandises);
    expect(s.marchandises).toBe(cas.achat.compte.startsWith("607"));
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent ; le compte de l'année se montre", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const t of textesDe(e, cas, etat)) {
        expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(t, `${e.id} : ${t}`).not.toMatch(/\b(de|à) les? /);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
    const intro = chapitre.etapes[0]!;
    const tableau = intro.tableau!(cas);
    expect(tableau.lignes.length).toBeGreaterThan(8);
    for (const l of tableau.lignes) for (const v of l.valeurs) expect(v, l.libelle).not.toMatch(/undefined|NaN/);
  });
});
