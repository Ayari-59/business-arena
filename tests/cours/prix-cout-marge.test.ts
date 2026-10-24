import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { BAISSE_DE_PRIX, PRIX_COUT_MARGE, prixCoutMarge } from "../../src/config/cours/chapitres/prix-cout-marge";
import { ECART_DE_PRIX } from "../../src/config/cours/decision";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * PRIX, COÛT ET MARGE TIENNENT DANS LES NEUF ENTREPRISES.
 *
 * Le prix et les coûts sont ceux du mois du cas ; la marge est positive partout, le taux de
 * marque toujours sous le taux de marge ; le résultat du mois est la marge moins les charges
 * fixes ; la baisse de prix est celle que « Décider » fait jouer à l'arène, et la marge baisse
 * toujours plus que le prix ; la marge se calcule hors taxes ; aucun texte ne sort un
 * « undefined ».
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

it("la baisse de prix est celle que « Décider » fait jouer à l'arène", () => {
  expect(BAISSE_DE_PRIX).toBe(ECART_DE_PRIX);
});

describe.each(ENTREPRISES_DU_COURS)("prix, coût et marge chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const m = prixCoutMarge(cas);
  const chapitre = chapitreDuCas(PRIX_COUT_MARGE, cas);

  it("le prix et les coûts sont ceux du mois du cas ; la marge est positive, le taux de marque sous le taux de marge", () => {
    expect(m.prix).toBe(cas.gestion.prixMoyen);
    expect(m.cout).toBeCloseTo(cas.gestion.matiereParUnite + cas.gestion.autresParUnite, 2);
    expect(m.marge).toBeCloseTo(m.prix - m.cout, 2);
    expect(m.marge).toBeGreaterThan(0);
    expect(m.tauxDeMarque).toBeLessThan(m.tauxDeMarge);
    expect(m.tauxDeMarque).toBeCloseTo((m.marge / m.prix) * 100, 0);
    expect(m.tauxDeMarge).toBeCloseTo((m.marge / m.cout) * 100, 0);
  });

  it("le résultat du mois est la marge moins les charges fixes ; une baisse de prix se prend tout entière sur la marge", () => {
    expect(m.margeDuMois).toBeCloseTo(m.marge * cas.gestion.quantite, 1);
    expect(m.resultat).toBeCloseTo(m.margeDuMois - cas.gestion.chargesFixes, 1);
    expect(m.marge - m.margeBaissee).toBeCloseTo(m.prix - m.prixBaisse, 2);
    expect(m.baisseDeLaMarge).toBeGreaterThan(BAISSE_DE_PRIX * 100);
    expect(m.prixTtc).toBeCloseTo(m.prix * (1 + cas.venteComptant.tauxTva), 2);
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
