import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { COMMERCES_A_STOCK, STOCK_DU_POINT_DE_VENTE, stockDuPointDeVente } from "../../src/config/cours/chapitres/stock-du-point-de-vente";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE STOCK DU POINT DE VENTE TIENT DANS LES DEUX COMMERCES À STOCK.
 *
 * Le trimestre est celui de l'arène ; le coût des vendues est le stock initial plus les
 * achats moins le stock final ; la rotation et la durée de stockage se répondent ; la
 * couverture se lit en jours de vente ; le stock final que le curseur cherche est le plus
 * gros pour lequel la durée de stockage ne dépasse pas le crédit du fournisseur. Les
 * entreprises sans stock de marchandises ne jouent pas le chapitre.
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
    case "curseur": {
      const r = e.rates?.(cas);
      return [e.question(cas), ...e.explication(cas), r?.dessous ?? "", r?.dessus ?? "", ...(e.zones ?? [])];
    }
    default:
      return [];
  }
}

it("le chapitre ne se joue que là où l'arène garde un stock de marchandises", () => {
  expect(STOCK_DU_POINT_DE_VENTE.entreprises?.codes).toEqual(COMMERCES_A_STOCK);
  for (const code of ENTREPRISES_DU_COURS) {
    const garde = casDeLEntreprise(code).stock !== null;
    if ((COMMERCES_A_STOCK as readonly string[]).includes(code)) expect(garde, code).toBe(true);
  }
  expect(casDeLEntreprise("bistrot").stock).toBeNull();
});

describe.each(COMMERCES_A_STOCK)("le stock chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const st = stockDuPointDeVente(cas);
  const s = cas.stock!;
  const chapitre = chapitreDuCas(STOCK_DU_POINT_DE_VENTE, cas);

  it("le coût des vendues, le stock moyen, la rotation et la durée se répondent", () => {
    expect(st.camv).toBeCloseTo(s.initial.valeur + s.achats.ht - s.final.valeur, 2);
    expect(st.camv).toBeCloseTo(s.vendues * s.cump, -1);
    expect(st.stockMoyen).toBeCloseTo((s.initial.valeur + s.final.valeur) / 2, 2);
    expect(st.rotation).toBeCloseTo(st.camv / st.stockMoyen, 2);
    expect(Math.abs(st.duree - st.jours / (st.camv / st.stockMoyen))).toBeLessThanOrEqual(1);
    expect(st.jours).toBe(s.fin - s.debut + 1);
  });

  it("la couverture se lit en jours de vente ; les jours non financés sont l'écart au crédit fournisseur", () => {
    expect(Math.abs(st.couverture - s.final.quantite / (s.vendues / st.jours))).toBeLessThanOrEqual(1);
    expect(st.delai).toBe(cas.achat.delai);
    expect(st.joursNonFinances).toBe(Math.max(0, st.duree - st.delai));
  });

  it("le stock final cherché est le plus gros que le crédit fournisseur couvre, et le curseur l'atteint", () => {
    expect(st.dureePour(st.stockFinalFinance)).toBeLessThanOrEqual(st.delai + 1e-9);
    expect(st.dureePour(st.stockFinalFinance + 1)).toBeGreaterThan(st.delai);
    expect(st.dureePour(s.final.quantite)).toBeCloseTo(st.jours * st.stockMoyen / st.camv, 6);
    const curseur = chapitre.etapes.find((e) => e.type === "curseur");
    if (curseur?.type !== "curseur") throw new Error("Pas de curseur");
    const cible = curseur.cible(cas);
    expect(cible.attendu).toBe(st.stockFinalFinance);
    expect(cible.attendu).toBeGreaterThanOrEqual(cible.min ?? 0);
    expect(cible.attendu).toBeLessThanOrEqual(cible.max);
    const d = curseur.droites(cas);
    expect(d.produit(cible.attendu)).toBeGreaterThanOrEqual(d.cout(cible.attendu));
    expect(d.produit(cible.attendu + 1)).toBeLessThan(d.cout(cible.attendu + 1));
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
