import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { COMMERCES, TAUX_DE_MARQUE, tauxDeMarque } from "../../src/config/cours/chapitres/taux-de-marque";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * TAUX DE MARQUE, TAUX DE MARGE, COEFFICIENT TIENNENT DANS LES TROIS COMMERCES.
 *
 * Le prix d'achat est celui du fournisseur de référence de l'arène, le prix de vente celui du
 * mois du cas ; les deux taux se retrouvent l'un de l'autre ; le coefficient TTC est le
 * coefficient HT augmenté de la TVA ; le fournisseur moins cher relève le taux de marque, et
 * le prix de vente calculé avec le plus cher le garde ; le moins cher se paie plus tôt. Les
 * entreprises qui n'achètent rien à revendre ne jouent pas le chapitre.
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

it("le chapitre ne se joue que dans les commerces, et le dit aux autres", () => {
  expect(TAUX_DE_MARQUE.parcours).toBe("mco");
  expect(TAUX_DE_MARQUE.entreprises?.codes).toEqual(COMMERCES);
  expect(TAUX_DE_MARQUE.entreprises?.pourquoi).toMatch(/\.$/);
  for (const code of COMMERCES) expect(ENTREPRISES_DU_COURS).toContain(code);
});

describe.each(COMMERCES)("taux de marque chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const m = tauxDeMarque(cas);
  const chapitre = chapitreDuCas(TAUX_DE_MARQUE, cas);

  it("le prix d'achat est celui du fournisseur de référence, le prix de vente celui du mois", () => {
    const def = scenarioByCode(code);
    expect(m.fournisseurs.reference.costMultiplier).toBe(1);
    expect(m.achat).toBe(def.scenario.product.materialCostPerUnit);
    expect(m.vente).toBe(cas.gestion.prixMoyen);
    expect(m.marge).toBeCloseTo(m.vente - m.achat, 2);
    expect(m.marge).toBeGreaterThan(0);
    expect(m.margeDuMois).toBeCloseTo(m.marge * cas.gestion.quantite, 1);
  });

  it("les deux taux se retrouvent l'un de l'autre ; le taux de marque est le plus petit", () => {
    expect(m.tMarque).toBeLessThan(m.tMarge);
    expect(m.tMarque).toBeCloseTo((m.marge / m.vente) * 100, 0);
    expect(m.tMarge).toBeCloseTo((m.marge / m.achat) * 100, 0);
    expect(Math.abs(m.tMargeDuTauxDeMarque - m.tMarge)).toBeLessThan(0.35);
  });

  it("le coefficient TTC est le coefficient HT augmenté de la TVA", () => {
    expect(m.coefHt).toBeCloseTo(m.vente / m.achat, 2);
    expect(m.venteTtc).toBeCloseTo(m.vente * (1 + cas.venteComptant.tauxTva), 2);
    expect(Math.abs(m.coefTtc - m.coefHt * (1 + m.tauxTva))).toBeLessThanOrEqual(0.02);
    expect(m.coefHt).toBeCloseTo(100 / (100 - m.tMarque), 1);
  });

  it("le moins cher relève le taux de marque ; le prix calculé avec le plus cher le garde ; le moins cher se paie plus tôt", () => {
    const f = m.fournisseurs;
    expect(f.moinsCher.costMultiplier).toBeLessThan(1);
    expect(f.plusCher.costMultiplier).toBeGreaterThan(1);
    expect(m.achatMoinsCher).toBeLessThan(m.achat);
    expect(m.tMarqueMoinsCher).toBeGreaterThan(m.tMarque);
    expect(m.achatPlusCher).toBeGreaterThan(m.achat);
    expect(m.ventePlusCher).toBeGreaterThan(m.vente);
    expect(((m.ventePlusCher - m.achatPlusCher) / m.ventePlusCher) * 100).toBeCloseTo(m.tMarque, 1);
    expect(f.moinsCher.paymentDelayDays).toBeLessThan(f.reference.paymentDelayDays);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    expect(chapitre.etapes.length).toBe(TAUX_DE_MARQUE.etapes.length);
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\b(de|à) les? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
