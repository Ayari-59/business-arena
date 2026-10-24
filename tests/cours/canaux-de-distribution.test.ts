import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import { CANAUX_DE_DISTRIBUTION, CANAUX_INDIRECTS, DISTRIBUTIONS, canauxDeDistribution } from "../../src/config/cours/chapitres/canaux-de-distribution";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LES CANAUX DE DISTRIBUTION, SUR LES INTERMÉDIAIRES DE L'ARÈNE.
 *
 * Le canal indirect est une clientèle du scénario qui paie à terme ; le trimestre lu est celui
 * où il vend le plus ; ventes, chiffre d'affaires et commission sont ceux du moteur ; le coût
 * par unité se recompose, commission et délai compris.
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

describe.each(DISTRIBUTIONS)("les canaux chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = canauxDeDistribution(cas);
  const chapitre = chapitreDuCas(CANAUX_DE_DISTRIBUTION, cas);
  const indirect = CANAUX_INDIRECTS[code];

  it("le canal indirect est une clientèle du scénario payée à terme, lue au trimestre où elle vend le plus", () => {
    const seg = scenarioByCode(code).scenario.market.segments.find((s) => s.code === indirect)!;
    expect(seg.paymentDelayDays).toBeGreaterThan(0);
    expect(k.delai).toBe(seg.paymentDelayDays);
    const ventes = anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!.market.bySegment[indirect]!.sold);
    expect(k.trimestre).toBe(ventes.indexOf(Math.max(...ventes)) + 1);
    expect(k.intermediaire.ventes).toBe(Math.round(Math.max(...ventes)));
  });

  it("le coût par unité se recompose, commission et délai compris", () => {
    const reverse = k.intermediaire.chiffreDAffaires - k.intermediaire.commission;
    expect(k.coutDuDelai).toBeCloseTo((reverse * (1 + cas.venteCredit.tauxTva) * cas.pret.tauxAnnuel * k.delai) / 360, 1);
    expect(k.coutParUnite).toBeCloseTo((k.intermediaire.commission + k.coutDuDelai) / k.intermediaire.ventes, 2);
    expect(k.partDesVentes).toBeCloseTo((k.intermediaire.ventes / (k.direct.ventes + k.intermediaire.ventes)) * 100, 1);
    expect(k.coutParUnite).toBeGreaterThan(0);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bde [aeiouyéèêAEIOUYÉ]/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bque [AEIOUYÉ]/);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
