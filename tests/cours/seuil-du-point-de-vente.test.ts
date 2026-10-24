import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { SEUIL_DU_POINT_DE_VENTE, seuilDuPointDeVente } from "../../src/config/cours/chapitres/seuil-du-point-de-vente";
import { COMMERCES } from "../../src/config/cours/chapitres/taux-de-marque";
import { JOURS_DU_MOIS } from "../../src/config/cours/point-de-vente";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE SEUIL DU POINT DE VENTE, EN EUROS, EN JOURS ET EN CLIENTS.
 *
 * La marge sur coût variable et son taux viennent du mois du cas ; le seuil couvre les
 * charges fixes ; la marge et l'indice de sécurité s'en déduisent ; le point mort tombe dans
 * le mois ; les clients au seuil suffisent ; le panier plancher est le plus petit qui paie
 * les charges fixes avec les mêmes clients, et le curseur l'atteint.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    case "curseur": {
      const r = e.rates?.(cas);
      return [e.question(cas), ...e.explication(cas), r?.dessous ?? "", r?.dessus ?? "", e.grandeur?.(cas).libelle ?? ""];
    }
    default:
      return [];
  }
}

describe.each(COMMERCES)("le seuil chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = seuilDuPointDeVente(cas);
  const chapitre = chapitreDuCas(SEUIL_DU_POINT_DE_VENTE, cas);

  it("la marge et le seuil viennent du mois du cas ; le seuil couvre les charges fixes", () => {
    expect(s.ca).toBe(cas.gestion.chiffreDAffaires);
    expect(s.mcv).toBeCloseTo(s.ca - cas.gestion.coutVariableUnitaire * cas.gestion.quantite, 1);
    expect(s.tauxMcv).toBeCloseTo((s.mcv / s.ca) * 100, 0);
    expect((s.seuil * s.tauxMcv) / 100).toBeCloseTo(s.chargesFixes, -1);
    expect(s.seuil).toBeLessThan(s.ca);
    expect(s.margeDeSecurite).toBe(Math.round(s.ca - s.seuil));
    expect(s.indice).toBeCloseTo((s.margeDeSecurite / s.ca) * 100, 0);
  });

  it("le point mort tombe dans le mois, au jour où le chiffre d'affaires cumulé atteint le seuil", () => {
    expect(s.pointMort).toBeGreaterThan(0);
    expect(s.pointMort).toBeLessThanOrEqual(JOURS_DU_MOIS);
    expect((s.ca / JOURS_DU_MOIS) * s.pointMort).toBeGreaterThanOrEqual(s.seuil - 1);
    expect((s.ca / JOURS_DU_MOIS) * (s.pointMort - 1)).toBeLessThan(s.seuil);
  });

  it("les clients au seuil suffisent ; le panier plancher est le plus petit qui paie les charges fixes", () => {
    expect(s.clientsAuSeuil * s.panier).toBeGreaterThanOrEqual(s.seuil - 0.01);
    expect((s.clientsAuSeuil - 1) * s.panier).toBeLessThan(s.seuil);
    expect(s.clients * (s.panierPlancher - s.coutVariableParClient)).toBeGreaterThanOrEqual(s.chargesFixes);
    expect(s.clients * (s.panierPlancher - 1 - s.coutVariableParClient)).toBeLessThan(s.chargesFixes);
    expect(s.panierPlancher).toBeLessThan(s.panier);
    const curseur = chapitre.etapes.find((e) => e.type === "curseur");
    if (curseur?.type !== "curseur") throw new Error("Pas de curseur");
    const cible = curseur.cible(cas);
    expect(cible.attendu).toBe(s.panierPlancher);
    expect(cible.attendu).toBeGreaterThanOrEqual(cible.min ?? 0);
    expect(cible.attendu).toBeLessThanOrEqual(cible.max);
  });

  it("aucun texte ne sort undefined ni « de le » ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\b(de|à) les? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bde [aeiouyéèê]/i);
      }
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
