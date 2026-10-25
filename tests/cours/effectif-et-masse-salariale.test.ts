import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { EFFECTIF_ET_MASSE_SALARIALE, masseSalariale } from "../../src/config/cours/chapitres/effectif-et-masse-salariale";
import { compteDeResultat } from "../../src/config/cours/chapitres/lire-le-compte-de-resultat";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * L'EFFECTIF ET LA MASSE SALARIALE, SUR L'ANNÉE DE L'ARÈNE.
 *
 * La masse salariale du chapitre est celle que le compte de résultat a comptée ; les taux se
 * recomposent ; le salaire net reçu est bien moindre que le coût ; l'embauche coûte son coût
 * annuel.
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

describe.each(ENTREPRISES_DU_COURS)("la masse salariale chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const m = masseSalariale(cas);
  const chapitre = chapitreDuCas(EFFECTIF_ET_MASSE_SALARIALE, cas);

  it("la masse salariale est celle que le compte de résultat de l'année a comptée", () => {
    const hr = scenarioByCode(code).scenario.hr!;
    expect(m.effectif).toBe(hr.includedHeadcount);
    expect(m.masse).toBeCloseTo(compteDeResultat(cas).s.personnel, 1);
    expect(m.coutAnnuel * m.effectif).toBeCloseTo(m.masse, 1);
  });

  it("les taux se recomposent, et le net reçu est bien moindre que le coût", () => {
    expect(m.partDansLesCharges).toBeCloseTo((m.masse / m.charges) * 100, 1);
    expect(m.tauxDeFraisDePersonnel).toBeCloseTo((m.masse / m.ventes) * 100, 1);
    expect(m.caParSalarie).toBe(Math.round(m.ventes / m.effectif));
    expect(m.netAnnuel).toBeLessThan(m.coutAnnuel * 0.7);
    expect(m.netAnnuel).toBeGreaterThan(m.coutAnnuel * 0.4);
  });

  it("l'embauche coûte son coût annuel, pas son net", () => {
    const etape = chapitre.etapes.find((e) => e.id === "embauche");
    if (etape?.type !== "choix") throw new Error("Pas d'étape embauche");
    const juste = etape.options(cas, { soldes: {} }).find((o) => o.juste)!;
    expect(juste.texte).toBe(`De ${montantEcrit(m.coutAnnuel)} : le coût annuel d'un salarié`);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [AEIOUYÉ]/);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
