import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { NEGOCIATIONS, NEGOCIER_LE_PRIX, negociation } from "../../src/config/cours/chapitres/negocier-le-prix";
import { ECART_DE_PRIX, prixRejoues } from "../../src/config/cours/decision";
import { CONTRE_PROPOSITION } from "../../src/config/cours/negociation";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * NÉGOCIER LE PRIX, SUR LES COÛTS ET LES CLIENTÈLES DE L'ARÈNE.
 *
 * Le coût complet et la marge de manœuvre se recomposent ; la remise maximale du curseur est
 * la plus forte qui laisse le prix au-dessus du coût complet ; la contre-proposition tombe entre
 * les deux planchers ; la bonne réponse sur la baisse accordée à tous suit le trimestre rejoué
 * par l'arène, et celle sur les clients qui tiennent le prix suit la sensibilité du scénario.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    case "curseur":
      return [e.question(cas), ...e.explication(cas), ...e.lecture(cas, e.cible(cas).attendu).map((l) => l.libelle)];
    default:
      return [];
  }
}

describe.each(NEGOCIATIONS)("négocier le prix chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const n = negociation(cas);
  const chapitre = chapitreDuCas(NEGOCIER_LE_PRIX, cas);
  const etape = (id: string) => chapitre.etapes.find((e) => e.id === id)!;

  it("le coût complet et la marge de manœuvre se recomposent sur le mois du cas", () => {
    const g = cas.gestion;
    expect(n.coutVariable).toBeCloseTo(g.matiereParUnite + g.autresParUnite, 2);
    expect(Math.abs(n.partDesFixes * g.quantite - g.chargesFixes)).toBeLessThan(g.quantite * 0.005 + 1e-9);
    expect(n.coutComplet).toBeCloseTo(n.coutVariable + n.partDesFixes, 2);
    expect(n.margeDeManoeuvre).toBeCloseTo(g.prixMoyen - n.coutComplet, 2);
    expect(n.remiseMaximale).toBeCloseTo((n.margeDeManoeuvre / g.prixMoyen) * 100, 1);
    expect(n.coutComplet).toBeLessThan(g.prixMoyen);
  });

  it("la remise du curseur est la plus forte qui laisse le prix au-dessus du coût complet", () => {
    const curseur = etape("remise-maximale");
    if (curseur.type !== "curseur") throw new Error("Pas de curseur");
    const { attendu, max } = curseur.cible(cas);
    const resultat = (r: number) => curseur.lecture(cas, r).find((l) => l.fort)!.montant;
    expect(resultat(attendu)).toBeGreaterThanOrEqual(0);
    expect(resultat(attendu + 1)).toBeLessThan(0);
    expect(max).toBeGreaterThan(attendu);
  });

  it("la remise demandée est jugée sur le coût complet, et la contre-proposition tombe entre les deux planchers", () => {
    expect(n.prixRemise).toBeCloseTo(cas.gestion.prixMoyen * (1 - ECART_DE_PRIX), 2);
    const remise = etape("remise-demandee");
    if (remise.type !== "choix") throw new Error("Pas d'étape remise");
    const juste = remise.options(cas, { soldes: {} }).find((o) => o.juste)!;
    expect(juste.texte).toMatch(n.prixRemise >= n.coutComplet ? /^Oui/ : /passe sous/);
    expect(n.contreProposition).toBeGreaterThan(n.coutVariable);
    expect(n.contreProposition).toBeLessThan(n.coutComplet);
    expect(Math.abs(n.contreProposition - (n.coutVariable + (n.coutComplet - n.coutVariable) * CONTRE_PROPOSITION))).toBeLessThanOrEqual(0.5);
  });

  it("la baisse accordée à tous se lit sur le trimestre que l'arène rejoue", () => {
    const [baisse, base] = prixRejoues(code);
    const etapeBaisse = etape("baisse-pour-tous");
    if (etapeBaisse.type !== "choix") throw new Error("Pas d'étape baisse");
    const juste = etapeBaisse.options(cas, { soldes: {} }).find((o) => o.juste)!;
    const attendu = baisse!.quantite > base!.quantite ? (baisse!.marge > base!.marge ? /et plus de marge/ : /mais moins de marge/) : /mêmes ventes/;
    expect(juste.texte).toMatch(attendu);
  });

  it("les clients qui tiennent le prix sont les moins sensibles au prix du scénario", () => {
    const segments = scenarioByCode(code).scenario.market.segments;
    const moins = segments.reduce((a, b) => (Math.abs(b.priceElasticity) < Math.abs(a.priceElasticity) ? b : a));
    expect(n.tenace.code).toBe(moins.code);
    for (const k of n.clienteles) expect(k.perte).toBeGreaterThan(0);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) les? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bde [aeiouyéèê]/i);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
