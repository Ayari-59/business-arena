import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { BUDGET_DU_POINT_DE_VENTE, budgetDuPointDeVente } from "../../src/config/cours/chapitres/budget-du-point-de-vente";
import { COMMERCES_A_STOCK } from "../../src/config/cours/chapitres/stock-du-point-de-vente";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE BUDGET DU POINT DE VENTE RETROUVE LE TRIMESTRE DE L'ARÈNE.
 *
 * Les quantités à acheter et leur montant sont ceux que l'arène a achetés ; la marge
 * budgétée est la vente moins le coût des vendues ; la part payée suit la règle du moteur
 * (le délai rapporté aux jours du tour) ; ce qui est payé et ce qui reste dû font les achats.
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

it("la part due au fournisseur est celle que le moteur calcule", () => {
  const moteur = readFileSync(join(process.cwd(), "src/engine/simulation/index.ts"), "utf8");
  expect(moteur).toContain("(s?.paymentDelayDays ?? scenario.finance.supplierPaymentDelayDays) / scenario.roundDays");
});

describe.each(COMMERCES_A_STOCK)("le budget chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const b = budgetDuPointDeVente(cas);
  const s = cas.stock!;
  const chapitre = chapitreDuCas(BUDGET_DU_POINT_DE_VENTE, cas);

  it("les achats budgétés sont ceux que l'arène a faits ; la marge est la vente moins le coût des vendues", () => {
    expect(b.aAcheter).toBe(s.achats.quantite);
    expect(b.achatsHt).toBeCloseTo(s.achats.ht, 2);
    expect(b.ventesHt).toBeCloseTo(s.vendues * s.ventes.prixUnitaire, 1);
    expect(b.margeBudgetee).toBeCloseTo(b.ventesHt - s.coutDAchatDesVendues, 2);
  });

  it("la part payée suit le délai du fournisseur rapporté aux jours du tour, et le reste est dû", () => {
    expect(b.joursDuTour).toBe(scenarioByCode(code).scenario.roundDays);
    expect(b.partPayee).toBeCloseTo((1 - Math.min(1, cas.achat.delai / b.joursDuTour)) * 100, 1);
    expect(b.decaisse + b.detteFinale).toBeCloseTo(b.achatsTtc, 2);
    expect(b.achatsTtc).toBeCloseTo(b.achatsHt * (1 + s.achats.tauxTva), 2);
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
