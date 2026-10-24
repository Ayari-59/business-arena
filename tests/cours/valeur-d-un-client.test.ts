import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import { VALEUR_D_UN_CLIENT, portefeuille } from "../../src/config/cours/chapitres/valeur-d-un-client";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LA VALEUR D'UN CLIENT, SUR LE PORTEFEUILLE QUE L'ARÈNE JOUE.
 *
 * Le chapitre ne vaut que là où l'on vend à l'abonnement ; chaque trimestre du portefeuille est
 * celui du moteur, et se recompose à l'adhérent près ; la marge, la valeur vie et le coût
 * d'acquisition se recalculent sur le compte de résultat du trimestre ; la bonne réponse sur la
 * hausse de l'attrition suit l'occupation, le prix et la saison du moteur.
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

it("le chapitre se joue là où l'on vend à l'abonnement, et seulement là", () => {
  const abonnement = ENTREPRISES_DU_COURS.filter((code) => scenarioByCode(code).scenario.subscription);
  expect(VALEUR_D_UN_CLIENT.entreprises?.codes).toEqual(abonnement);
});

describe.each(VALEUR_D_UN_CLIENT.entreprises!.codes)("la valeur d'un client chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const p = portefeuille(cas);
  const tours = anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);
  const chapitre = chapitreDuCas(VALEUR_D_UN_CLIENT, cas);

  it("chaque trimestre est celui du moteur, et se recompose à l'adhérent près", () => {
    expect(p.trimestres).toHaveLength(tours.length);
    for (const [i, t] of p.trimestres.entries()) {
      const s = tours[i]!.subscription!;
      expect(t.ouverture).toBe(Math.round(s.opening));
      expect(t.cloture).toBe(Math.round(s.closing));
      expect(Math.abs(t.departs - s.churned)).toBeLessThanOrEqual(1);
      expect(Math.abs(t.nouveaux - s.newMembers)).toBeLessThanOrEqual(1);
      expect(t.ouverture - t.departs + t.nouveaux).toBe(t.cloture);
      expect(Math.abs(t.attrition - s.churnRate * 100)).toBeLessThan(0.15);
      if (i > 0) expect(t.ouverture).toBe(p.trimestres[i - 1]!.cloture);
    }
  });

  it("la marge, la valeur vie et le coût d'acquisition se recalculent sur le premier trimestre", () => {
    const r = tours[0]!;
    const s = r.subscription!;
    const is = r.incomeStatement;
    expect(p.marge).toBeCloseTo((is.revenue - is.cogs) / s.closing, 1);
    // La valeur vie de l'arène : marge par adhérent ÷ attrition du moteur (indicateur du métier).
    const deLArene = (is.revenue - is.cogs) / s.closing / s.churnRate;
    expect(Math.abs(p.vvc - deLArene) / deLArene).toBeLessThan(0.01);
    const nouveaux = Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0);
    expect(p.cac).toBeCloseTo(is.marketingCost / nouveaux, 1);
    expect(p.vvcSurCac).toBeCloseTo(p.vvc / p.cac, 1);
    expect(p.dureeDeVie * p.marge).toBeCloseTo(p.vvc, -1);
  });

  it("la bonne réponse sur la hausse de l'attrition suit l'occupation, le prix et la saison du moteur", () => {
    const abonnement = scenarioByCode(code).scenario.subscription!;
    const [r1, r2] = tours;
    const sature = r2!.subscription!.occupancy > abonnement.crowdingThreshold;
    const prix = (r: typeof r1) => r!.incomeStatement.revenue / r!.subscription!.closing;
    const plusCher = prix(r2) > prix(r1) + 0.5;
    const saison = (abonnement.churnSeasonality?.[1] ?? 1) > 1;
    expect([sature, plusCher, saison].filter(Boolean)).toHaveLength(1);
    const pourquoi = chapitre.etapes.find((e) => e.id === "pourquoi");
    if (pourquoi?.type !== "choix") throw new Error("Pas d'étape pourquoi");
    const juste = pourquoi.options(cas, { soldes: {} }).find((o) => o.juste)!;
    expect(juste.texte).toMatch(sature ? /trop pleine/ : plusCher ? /augmenté/ : /saison/);
  });

  it("le portefeuille d'équilibre égale recrues ÷ attrition, et la fidélisation pèse plus qu'autant de recrues", () => {
    expect(p.recrues).toBe(p.trimestres.reduce((t, x) => t + x.nouveaux, 0));
    expect(p.equilibre).toBeCloseTo(p.recruesParTrimestre / (p.attritionMoyenne / 100), -1);
    expect(p.equilibreMoinsDAttrition).toBeGreaterThan(p.equilibrePlusDeRecrues);
    const leviers = chapitre.etapes.find((e) => e.id === "leviers");
    if (leviers?.type !== "choix") throw new Error("Pas d'étape leviers");
    expect(leviers.options(cas, { soldes: {} }).find((o) => o.juste)!.texte).toMatch(/attrition/);
    expect(p.vvcDuPire).toBeLessThan(p.vvc);
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
