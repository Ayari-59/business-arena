import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import { PALIERS_DE_BUDGET, campagnesRejouees } from "../../src/config/cours/campagne";
import { COUT_D_ACQUISITION, campagne } from "../../src/config/cours/chapitres/cout-d-acquisition";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE COÛT D'ACQUISITION ET LA CAMPAGNE, SUR LES BUDGETS QUE L'ARÈNE REJOUE.
 *
 * Le chapitre se joue là où l'arène distingue les nouveaux clients ; le budget du trimestre
 * rejoué est celui de l'année du cours ; les nouveaux clients répondent au budget, de moins en
 * moins ; le coût du client en plus monte ; la bonne réponse sur le dernier palier suit son gain.
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

it("le chapitre se joue là où l'arène distingue les nouveaux clients, et seulement là", () => {
  const avecNouveaux = ENTREPRISES_DU_COURS.filter((code) => scenarioByCode(code).scenario.market.segments.some((s) => s.code === "acquisition"));
  expect(COUT_D_ACQUISITION.entreprises?.codes).toEqual(avecNouveaux);
});

describe.each(COUT_D_ACQUISITION.entreprises!.codes)("le coût d'acquisition chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = campagne(cas);
  const chapitre = chapitreDuCas(COUT_D_ACQUISITION, cas);

  it("le budget du trimestre rejoué est celui de l'année du cours, et le trimestre aussi", () => {
    const r = anneeJouee(code).partie.rounds[0]!.results["joueur"]!;
    expect(k.jouee.budget).toBe(Math.round(r.incomeStatement.marketingCost));
    expect(k.jouee.nouveaux).toBe(Math.round(r.market.bySegment["acquisition"]!.sold));
    expect(k.jouee.marge).toBe(Math.round(r.incomeStatement.grossMargin));
    expect(k.budgets.map((b) => b.facteur)).toEqual([...PALIERS_DE_BUDGET]);
    expect(k.sans.budget).toBe(0);
  });

  it("les nouveaux clients répondent au budget, de moins en moins, et le client en plus coûte de plus en plus", () => {
    const v = campagnesRejouees(code);
    for (let i = 1; i < v.length; i++) expect(v[i]!.nouveaux).toBeGreaterThan(v[i - 1]!.nouveaux);
    for (let i = 2; i < v.length; i++) expect(v[i]!.nouveaux - v[i - 1]!.nouveaux).toBeLessThan(v[i - 1]!.nouveaux - v[i - 2]!.nouveaux);
    expect(k.premierPalier.cacMarginal).toBeCloseTo((k.plus.budget - k.jouee.budget) / (k.plus.nouveaux - k.jouee.nouveaux), 2);
    expect(k.secondPalier.cacMarginal).toBeCloseTo((k.encorePlus.budget - k.plus.budget) / (k.encorePlus.nouveaux - k.plus.nouveaux), 2);
    expect(k.premierPalier.cacMarginal).toBeGreaterThan(k.cac);
    expect(k.secondPalier.cacMarginal).toBeGreaterThan(k.premierPalier.cacMarginal);
  });

  it("le coût d'acquisition, la marge après acquisition et le retour se recomposent", () => {
    expect(k.cac).toBeCloseTo(k.jouee.budget / k.jouee.nouveaux, 2);
    expect(k.margeApresAcquisition).toBeCloseTo(cas.gestion.prixMoyen - cas.gestion.coutVariableUnitaire - k.cac, 2);
    expect(k.gainDeLaCampagne).toBe(k.jouee.marge - k.sans.marge - k.jouee.budget);
    expect(k.roi).toBeCloseTo((k.gainDeLaCampagne / k.jouee.budget) * 100, 1);
    expect(k.meilleur.resultat).toBe(Math.max(...k.budgets.map((b) => b.resultat)));
  });

  it("la bonne réponse sur le dernier palier suit son gain", () => {
    const etape = chapitre.etapes.find((e) => e.id === "jusqu-ou");
    if (etape?.type !== "choix") throw new Error("Pas d'étape jusqu-ou");
    const juste = etape.options(cas, { soldes: {} }).find((o) => o.juste)!;
    const gain = k.encorePlus.marge - k.plus.marge - (k.encorePlus.budget - k.plus.budget);
    expect(juste.texte).toMatch(gain > 0 ? /^Oui/ : /^Non : le dernier/);
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
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bque [AEIOUYÉ]/);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
