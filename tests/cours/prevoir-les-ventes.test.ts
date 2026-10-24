import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import { PREVOIR_LES_VENTES, prevision } from "../../src/config/cours/chapitres/prevoir-les-ventes";
import { COMMERCES } from "../../src/config/cours/chapitres/taux-de-marque";
import { ANNEES, TRIMESTRES_PAR_AN, troisAnnees } from "../../src/config/cours/trois-annees";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * PRÉVOIR LES VENTES SUR TROIS ANNÉES DE L'ARÈNE.
 *
 * La première des trois années est l'année du cas, à l'unité près ; le trimestre fort est
 * celui où les ventes plafonnent sous la demande ; la croissance, le coefficient moyen et la
 * prévision se recomposent ; l'écart compare la prévision à ce que l'arène a joué, et la
 * croissance de l'année 3 est bien plus faible que celle de l'année 2 (le marché mûrit).
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
    default:
      return [];
  }
}

describe.each(COMMERCES)("la prévision chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const p = prevision(cas);
  const chapitre = chapitreDuCas(PREVOIR_LES_VENTES, cas);

  it("trois années de quatre trimestres, dont la première est l'année du cas", () => {
    const serie = troisAnnees(code);
    expect(serie).toHaveLength(ANNEES * TRIMESTRES_PAR_AN);
    const an1 = anneeJouee(code).partie.rounds.map((t) =>
      Math.round(Object.values(t.results["joueur"]!.market.bySegment).reduce((s, v) => s + v.demandForCompany, 0)),
    );
    expect(serie.slice(0, TRIMESTRES_PAR_AN).map((q) => q.demande)).toEqual(an1);
    for (const q of serie) expect(q.vendu).toBeLessThanOrEqual(q.demande);
  });

  it("au trimestre fort, les ventes plafonnent sous la demande", () => {
    expect(p.venduFort2).toBeLessThan(p.demandeFort2);
    const an2 = troisAnnees(code).filter((q) => q.annee === 2);
    for (const q of an2) expect(q.demande).toBeLessThanOrEqual(p.demandeFort2);
  });

  it("la croissance, le coefficient moyen et la prévision se recomposent", () => {
    expect(p.croissance).toBeCloseTo((p.total2 / p.total1 - 1) * 100, 0);
    expect(Math.abs(p.coef - (p.coef1 + p.coef2) / 2)).toBeLessThanOrEqual(0.005 + 1e-9);
    expect(p.coef).toBeGreaterThan(1);
    expect(Math.abs(p.total3 - p.total2 * (1 + p.croissance / 100))).toBeLessThanOrEqual(1);
    expect(Math.abs(p.prevu - (p.total3 / 4) * p.coef)).toBeLessThanOrEqual(1);
    expect(p.ecart).toBeCloseTo(((p.reel - p.prevu) / p.prevu) * 100, 0);
  });

  it("le marché mûrit : l'année 3 grandit bien moins que l'année 2, et la prévision la dépasse", () => {
    const croissance3 = (p.total3Reel / p.total2 - 1) * 100;
    expect(croissance3).toBeLessThan(p.croissance / 2);
    expect(p.ecart).toBeLessThan(0);
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
